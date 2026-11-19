// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Lite Embed
// Puts the real player in only on Play: until then, a poster and a link to the video. The
// connection warms up on hover or focus, the player loads behind the poster, and the poster lifts
// away once it is there. The timings are the constants below; the providers' addresses too.
(() => {
  const SELECTOR = '.kodza-lite-embed';
  const PILL_OUT = 260; // ms, the Play pill stepping back
  const CURTAIN = 700; // ms, the poster lifting away, once the player has loaded
  const PATIENCE = 4000; // ms: a player that never says it has loaded is shown anyway (a wait, not motion)
  const GLIDE = 'cubic-bezier(0.65, 0, 0.35, 1)';
  // Where each player lives: the hosts warmed up on hover, the address of the player itself.
  // youtube-nocookie keeps YouTube's cookies off the page until the visitor presses Play
  const PROVIDERS = {
    youtube: {
      hosts: ['https://www.youtube-nocookie.com', 'https://www.google.com'],
      src: (id, start) => `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&playsinline=1&rel=0${start ? `&start=${start}` : ''}`,
    },
    vimeo: {
      hosts: ['https://player.vimeo.com', 'https://i.vimeocdn.com', 'https://f.vimeocdn.com'],
      src: (id, start) => `https://player.vimeo.com/video/${encodeURIComponent(id)}?autoplay=1&dnt=1${start ? `#t=${start}s` : ''}`,
    },
  };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const provider = PROVIDERS[root.dataset.provider] || PROVIDERS.youtube;
    const id = root.dataset.id;
    const link = root.querySelector('.kodza-lite-embed__link');
    const poster = root.querySelector('.kodza-lite-embed__poster');
    const play = root.querySelector('.kodza-lite-embed__play');
    if (!id || !link) return;

    const hints = [];
    const animations = [];
    let warm = false;
    let frame = null;
    let timer = 0;
    let fromKeyboard = false;

    // One preconnect per host for the whole page, whichever copy adds it
    const warmUp = () => {
      if (warm) return;
      warm = true;
      provider.hosts.forEach((href) => {
        if (document.head.querySelector(`link[rel="preconnect"][href="${href}"]`)) return;
        const hint = document.createElement('link');
        hint.rel = 'preconnect';
        hint.href = href;
        document.head.append(hint);
        hints.push(hint);
      });
    };

    const settle = () => {
      root.classList.add('is-played');
      if (fromKeyboard) frame.focus();
    };

    const reveal = () => {
      if (root.classList.contains('is-open')) return;
      clearTimeout(timer);
      root.classList.remove('is-loading');
      root.classList.add('is-open');
      if (still) return settle();
      animations.push(play.animate([{ opacity: 1, scale: 1 }, { opacity: 0, scale: 0.9 }], {
        duration: PILL_OUT * pace, easing: GLIDE, fill: 'forwards',
      }));
      const curtain = link.animate([{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 0 100% 0)' }], {
        duration: CURTAIN * pace, delay: (PILL_OUT / 2) * pace, easing: GLIDE, fill: 'forwards',
      });
      animations.push(curtain);
      curtain.finished.then(settle, () => {});
    };

    link.addEventListener('pointerenter', warmUp, { signal });
    link.addEventListener('focus', warmUp, { signal });
    link.addEventListener('touchstart', warmUp, { signal, passive: true });
    link.addEventListener('click', (event) => {
      // A new tab or window asked for: the link does its job
      if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (frame) return;
      warmUp();
      fromKeyboard = event.detail === 0;
      const start = parseInt(root.dataset.start, 10) || 0;
      frame = document.createElement('iframe');
      frame.className = 'kodza-lite-embed__frame';
      frame.title = poster?.alt || 'Video';
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.addEventListener('load', reveal, { once: true, signal });
      frame.src = provider.src(id, start);
      root.classList.add('is-loading');
      root.prepend(frame);
      timer = setTimeout(reveal, PATIENCE);
    }, { signal });

    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      animations.forEach((animation) => animation.cancel());
      hints.forEach((hint) => hint.remove());
    }, { once: true });
  }
  // Kodza lifecycle, the same in every component: `kodza:init` starts the instances inside
  // event.detail.root (the whole page by default), `kodza:destroy` stops them and puts their
  // markup back. For themes and apps that swap content without a page load. Each running root
  // keeps its markup as written under KODZA, shared by every Kodza script on the page: a Kodza
  // component inside another one is saved as written, not half-started, and stopped with it. Two
  // components on one root (a reveal on a stat card) both start, and stop together.
  const KODZA = Symbol.for('kodza');
  const RUNNING = Symbol.for(`kodza ${SELECTOR}`); // a root this component runs on, for every copy of this script
  const instances = new WeakMap();
  const find = (scope = document) => [scope, ...scope.querySelectorAll(SELECTOR)].filter((el) => el.matches?.(SELECTOR));
  const attrsOf = (el) => [...el.attributes].map((a) => [a.name, a.value]);
  const put = (el, saved) => {
    [...el.attributes].forEach((a) => el.removeAttribute(a.name));
    saved.attrs.forEach(([name, value]) => el.setAttribute(name, value));
    el.innerHTML = saved.html;
  };
  // The markup inside a root as written: Kodza components already running in it give back their own
  const written = (root) => {
    const all = [...root.querySelectorAll('*')];
    if (!all.some((el) => el[KODZA])) return root.innerHTML;
    const copy = root.cloneNode(true);
    const twins = copy.querySelectorAll('*');
    let last = null;
    all.forEach((el, i) => {
      if (!el[KODZA] || last?.contains(el)) return;
      last = el;
      put(twins[i], el[KODZA]);
    });
    return copy.innerHTML;
  };
  const init = (scope) => find(scope).forEach((root) => {
    // Already running, maybe from another copy of this script. Marked is-ready with no Kodza component
    // running on it, a root is a copy of a started one (a cloned slide): it is left as it is
    if (root[RUNNING] || (root.classList.contains('is-ready') && !root[KODZA])) return;
    // Rendered by React (data-kodza-manual): React starts it, with an init aimed at that markup once
    // it has hydrated it. Any earlier start would change markup React has not taken over yet
    const owner = root.closest('[data-kodza-manual]');
    if (owner && !(scope && owner.contains(scope))) return;
    const controller = new AbortController();
    // Another Kodza component already running on this root: its markup as written is kept, and the
    // two stop together
    const before = root[KODZA];
    const saved = { html: before ? before.html : written(root), attrs: before ? before.attrs : attrsOf(root), stop: () => destroy(root) };
    if (before) before.above = saved;
    instances.set(root, { controller, saved, before });
    root[KODZA] = saved;
    root[RUNNING] = true;
    mount(root, controller.signal);
    root.classList.add('is-ready');
  });
  const destroy = (scope) => find(scope).forEach((root) => {
    const instance = instances.get(root);
    if (!instance) return;
    instances.delete(root);
    instance.saved.above?.stop(); // a Kodza component started after it on the same root stops first
    // The Kodza components running inside it stop first: once its markup is put back, their own
    // script could not find them any more
    root.querySelectorAll('*').forEach((el) => el[KODZA]?.stop());
    instance.controller.abort();
    delete root[RUNNING];
    // Started on top of another one: that one stops next, and puts the markup back
    if (instance.before) {
      delete instance.before.above;
      root[KODZA] = instance.before;
      return instance.before.stop();
    }
    delete root[KODZA];
    put(root, instance.saved);
  });
  document.addEventListener('kodza:init', (event) => init(event.detail?.root));
  document.addEventListener('kodza:destroy', (event) => destroy(event.detail?.root));
  init();
  // Loaded in <head>, the script runs before the markup exists: once more when it is parsed
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(), { once: true });
})();
