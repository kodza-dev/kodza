// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Hero Screen
// Plays the entrance of Hero Split once the section is in view (the label and title lines rise
// out of their masks, the screen opens from its top edge down, the rest follows), then hands over
// to the scroll: the scene pins while the screen, leaning back under the title, stands up to face
// you and grows to its real size, passing over the title as it steps back. Leaning, the screen
// sits in shade under a long soft shadow; upright, it lights up and the shadow tucks in. Every move
// is a paused animation set from the scroll: scrolling back up plays it in reverse.
// "kodza:replay" plays the entrance again.
(() => {
  const SELECTOR = '.kodza-hero-screen';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GLIDE = 'cubic-bezier(0.6, 0, 0.1, 1)'; // slow start, long settle
  const SOFT = 'cubic-bezier(0.25, 1, 0.5, 1)';
  const TRAVEL = 'cubic-bezier(0.45, 0, 0.55, 1)'; // the moves on the scroll: gentle, a mouse wheel goes by notches

  const decoded = (root) => Promise.all([...root.querySelectorAll('img')].map((img) => img.decode().catch(() => {})));

  // ---------- Scroll engine (begin) ----------
  // The same block in every hero that plays on scroll: copy it as is, write only the timeline.
  // `root` is a tall track and `scene` sticks inside it (position: sticky, in the CSS); the
  // progress runs from 0, the scene just pinned, to 1, about to unpin. `timeline()` returns
  // tracks, [element, keyframes, from, to] with from and to in progress; each becomes a paused
  // Web Animation whose time follows the scroll, smoothed by a requestAnimationFrame loop that
  // sleeps once it has caught up. The tracks are built again when `scene` or an element of
  // `watch` changes size, so `timeline()` measures there.
  function scrub(root, scene, signal, timeline, watch = []) {
    const SPAN = 1000;
    let tracks = [];
    let live = false;
    let now = 0;
    let target = 0;
    let frame = 0;
    let last = 0;
    const geometry = () => {
      const box = root.getBoundingClientRect();
      return {
        top: box.top,
        scale: box.height / root.offsetHeight || 1, // a parent scaled by transform
        run: root.offsetHeight - scene.offsetHeight,
        stick: parseFloat(getComputedStyle(scene).top) || 0,
      };
    };
    const progress = () => {
      const { top, scale, run, stick } = geometry();
      return run > 0 ? Math.min(1, Math.max(0, (stick - top / scale) / run)) : 0;
    };
    const seek = () => tracks.forEach((a) => { a.currentTime = now * SPAN; });
    const tick = (time) => {
      const dt = last ? Math.min(time - last, 64) : 16;
      last = time;
      now += (target - now) * (1 - Math.exp(-dt / 70));
      if (Math.abs(target - now) < 0.0004) now = target;
      seek();
      frame = now === target ? 0 : requestAnimationFrame(tick);
      if (!frame) last = 0;
    };
    const update = () => {
      if (!live) return;
      target = progress();
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const clear = () => {
      tracks.forEach((a) => a.cancel());
      tracks = [];
    };
    const build = () => {
      clear();
      if (!live) return;
      tracks = timeline().filter(([el]) => el).map(([el, keyframes, from, to]) => {
        const a = el.animate(keyframes, { duration: (to - from) * SPAN, delay: from * SPAN, endDelay: (1 - to) * SPAN, fill: 'both' });
        a.pause();
        return a;
      });
      seek();
      update();
    };
    const stop = () => {
      live = false;
      cancelAnimationFrame(frame);
      frame = last = now = 0;
      clear();
    };
    // Scrolls the page so the progress is at least `p` (a focused control must show)
    const reveal = (p) => {
      const { top, scale, run, stick } = geometry();
      if (run > 0 && progress() < p) window.scrollBy(0, top - (stick - p * run) * scale);
    };

    document.addEventListener('scroll', update, { passive: true, capture: true, signal });
    window.addEventListener('resize', update, { passive: true, signal });
    let resized = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(resized);
      resized = requestAnimationFrame(build);
    });
    [scene, ...watch].forEach((el) => el && ro.observe(el));
    signal.addEventListener('abort', () => {
      ro.disconnect();
      cancelAnimationFrame(resized);
      stop();
    });
    return {
      start() {
        live = true;
        build();
      },
      stop,
      progress,
      reveal,
    };
  }
  // ---------- Scroll engine (end) ----------

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    if (reduceMotion) return root.classList.add('is-shown');
    const q = (s) => root.querySelector(s);
    const scene = q('.kodza-hero-screen__scene');
    const copy = q('.kodza-hero-screen__copy');
    const device = q('.kodza-hero-screen__device');
    const tilt = q('.kodza-hero-screen__tilt');
    const lines = [...root.querySelectorAll('.kodza-hero-screen__line')];
    const setting = (name, fallback) => {
      const value = parseFloat(getComputedStyle(root).getPropertyValue(`--kz-hero-screen-${name}`));
      return Number.isFinite(value) ? value : fallback;
    };

    // The screen sits in its place at the centre of the scene (the CSS puts it there). At rest it
    // leans back from its top edge, smaller, that edge just under the copy: these are the
    // transforms that take it there, set inline so the entrance plays on the leaning screen.
    // Layout boxes only (offsetTop…): they ignore transforms, so a scaled page changes nothing.
    const measure = () => {
      const rest = {
        device: `translateY(${copy.offsetTop + copy.offsetHeight - device.offsetTop}px) scale(${setting('shrink', 0.86)})`,
        tilt: `perspective(${setting('depth', 1600)}px) rotateX(${setting('tilt', 24)}deg)`,
      };
      device.style.transform = rest.device;
      tilt.style.transform = rest.tilt;
      return rest;
    };

    // The scroll part, in progress: the screen stands up first, then grows into its place, and
    // holds there for the last stretch before the page goes on
    const timeline = () => {
      const rest = measure();
      const fade = (el, from, to, start, end) => [el, [{ opacity: from, easing: TRAVEL }, { opacity: to }], start, end];
      // The copy steps back as the screen comes up over it, its lowest lines first
      const words = [q('.kodza-hero-screen__actions'), q('.kodza-hero-screen__lead'), ...[...lines].reverse(), q('.kodza-hero-screen__eyebrow')];
      return [
        [tilt, [{ transform: rest.tilt, easing: TRAVEL }, { transform: rest.tilt.replace(/rotateX\([^)]*\)/, 'rotateX(0deg)') }], 0, 0.62],
        [device, [{ transform: rest.device, easing: TRAVEL }, { transform: 'translateY(0px) scale(1)' }], 0, 0.74],
        // Leaning, it sits in shade under a long soft shadow; facing you, it lights up and the
        // shadow tucks in under it
        fade(q('.kodza-hero-screen__veil'), 1, 0, 0, 0.62),
        fade(q('.kodza-hero-screen__shadow--far'), 1, 0, 0.05, 0.6),
        fade(q('.kodza-hero-screen__shadow--near'), 0, 1, 0.25, 0.72),
        [copy, [
          { transform: 'translateY(0px) scale(1)', easing: TRAVEL },
          { transform: `translateY(${-0.06 * scene.clientHeight}px) scale(0.9)` },
        ], 0, 0.6],
        ...words.map((el, i) => fade(el, 1, 0, i * 0.035, 0.3 + i * 0.045)),
      ];
    };
    const pin = scrub(root, scene, signal, timeline, [copy]);

    let running = [];
    const stop = () => {
      running.forEach((a) => a.cancel());
      running = [];
    };
    const animate = (el, keyframes, options) => {
      if (el) running.push(el.animate(keyframes, { easing: GLIDE, fill: 'backwards', ...options }));
    };
    const rise = (el, delay, duration) => animate(el, [{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration, delay });
    // Scrolling during the entrance hurries it, so the scroll takes over without a wait
    const hurry = () => {
      if (running.length && !root.classList.contains('is-live') && pin.progress() > 0) running.forEach((a) => a.updatePlaybackRate(4));
    };

    const play = async () => {
      await decoded(root);
      if (signal.aborted) return;
      stop();
      pin.stop();
      root.classList.remove('is-live');
      root.classList.add('is-shown');
      measure();
      rise(q('.kodza-hero-screen__eyebrow .kodza-hero-screen__rise'), 0, 1000);
      lines.forEach((l, i) => rise(l.querySelector(':scope > .kodza-hero-screen__rise'), 110 + i * 125, 1170));
      // The screen opens from its top edge down, settling from a slight zoom
      animate(q('.kodza-hero-screen__curtain'), [{ transform: 'translateY(-100%)' }, { transform: 'none' }], { duration: 1350, delay: 200 });
      animate(q('.kodza-hero-screen__hold'), [{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: 1350, delay: 200 });
      animate(q('.kodza-hero-screen__glass img'), [{ transform: 'scale(1.2)' }, { transform: 'none' }], { duration: 2000, delay: 200, easing: SOFT });
      // Its shadow comes once it is mostly open, never around an empty frame
      animate(q('.kodza-hero-screen__shadows'), [{ opacity: 0 }, { opacity: 1 }], { duration: 1000, delay: 1000, easing: SOFT });
      [q('.kodza-hero-screen__lead'), q('.kodza-hero-screen__actions')].forEach((el, i) => {
        animate(el, [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: 700 + i * 110, easing: SOFT });
      });
      hurry();
      const entrance = running;
      Promise.all(entrance.map((a) => a.finished)).then(() => {
        if (entrance !== running || signal.aborted) return;
        root.classList.add('is-live');
        pin.start();
      }, () => {});
    };

    root.addEventListener('kodza:replay', play, { signal });
    document.addEventListener('scroll', hurry, { passive: true, capture: true, signal });
    // Tabbing back to a button scrolls back to where it shows: the hero, whole
    q('.kodza-hero-screen__foot').addEventListener('focusin', () => {
      if (pin.progress() <= 0) return;
      const box = root.getBoundingClientRect();
      const k = box.height / root.offsetHeight || 1;
      window.scrollBy(0, box.top - (parseFloat(getComputedStyle(scene).top) || 0) * k);
    }, { signal });
    signal.addEventListener('abort', stop);
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      io.disconnect();
      play();
    }, { rootMargin: '0px 0px -15% 0px' });
    signal.addEventListener('abort', () => io.disconnect());
    Promise.all([document.fonts?.ready, decoded(root)]).then(() => {
      if (!signal.aborted) io.observe(root);
    });
  }

  // Kodza lifecycle, the same in every component: `kodza:init` starts the instances inside
  // event.detail.root (the whole page by default), `kodza:destroy` stops them and puts their
  // markup back. For themes and apps that swap content without a page load. Each running root
  // keeps its markup as written under KODZA, shared by every Kodza script on the page: a Kodza
  // component inside another one is saved as written, not half-started, and stopped with it.
  const KODZA = Symbol.for('kodza');
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
    if (root.classList.contains('is-ready')) return; // already running, maybe from another copy of this script
    const controller = new AbortController();
    const saved = { html: written(root), attrs: attrsOf(root), stop: () => destroy(root) };
    instances.set(root, { controller, saved });
    root[KODZA] = saved;
    mount(root, controller.signal);
    root.classList.add('is-ready');
  });
  const destroy = (scope) => find(scope).forEach((root) => {
    const instance = instances.get(root);
    if (!instance) return;
    instances.delete(root);
    // The Kodza components running inside it stop first: once its markup is put back, their own
    // script could not find them any more
    root.querySelectorAll('*').forEach((el) => el[KODZA]?.stop());
    instance.controller.abort();
    delete root[KODZA];
    put(root, instance.saved);
  });
  document.addEventListener('kodza:init', (event) => init(event.detail?.root));
  document.addEventListener('kodza:destroy', (event) => destroy(event.detail?.root));
  init();
  // Loaded in <head>, the script runs before the markup exists: once more when it is parsed
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(), { once: true });
})();
