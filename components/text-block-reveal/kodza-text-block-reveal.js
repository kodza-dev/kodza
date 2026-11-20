// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Text Block Reveal
// When the title reaches the screen, cuts it into its real lines and plays the block on each,
// one after the other. Titles of one block that come in together (a label, then its heading)
// queue up, in page order. Once played, the
// title goes back to plain text, so it reflows like any other. Settings: the --kz-text-block-
// reveal-* variables in the CSS, data-from="right", and the two constants below.
(() => {
  const SELECTOR = '.kodza-text-block-reveal';
  // How much of the screen the title has to enter before it plays
  const ENTER = '0px 0px -12% 0px';
  // A title that comes in with another one starts when the last line of the other is covered
  const QUEUE_AT = 0.5;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const ms = (value, fallback) => {
    const n = parseFloat(value);
    if (!(n >= 0)) return fallback;
    return /ms\s*$/.test(value) ? n : n * 1000;
  };
  // Per block (the parent of the titles): the moment its queue is free again
  const queues = new WeakMap();

  // The words laid out as the browser wraps them, then grouped by line
  function lay(root, text) {
    root.textContent = '';
    const sr = document.createElement('span');
    sr.className = 'kodza-text-block-reveal__sr';
    sr.textContent = text;
    const box = document.createElement('span');
    box.className = 'kodza-text-block-reveal__lines';
    box.setAttribute('aria-hidden', 'true');
    root.append(sr, box);
    const words = text.split(' ').map((word) => {
      const span = document.createElement('span');
      span.textContent = word;
      box.append(span, ' ');
      return span;
    });
    const lines = [];
    words.forEach((word) => {
      const top = word.offsetTop;
      const line = lines.at(-1);
      if (line && Math.abs(line.top - top) < 4) line.words.push(word.textContent);
      else lines.push({ top, words: [word.textContent] });
    });
    box.textContent = '';
    lines.forEach((line, i) => {
      const outer = document.createElement('span');
      outer.className = 'kodza-text-block-reveal__line';
      const inner = document.createElement('span');
      inner.className = 'kodza-text-block-reveal__text';
      inner.textContent = line.words.join(' ');
      inner.style.setProperty('--i', i);
      outer.append(inner);
      box.append(outer);
    });
    return lines.length;
  }

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const text = root.textContent.trim().replace(/\s+/g, ' ');
    if (still || !text) return;
    const style = getComputedStyle(root);
    const duration = ms(style.getPropertyValue('--kz-text-block-reveal-duration'), 1100);
    const stagger = ms(style.getPropertyValue('--kz-text-block-reveal-stagger'), 120);
    let state = 'waiting';
    let count = lay(root, text);
    let timers = [];
    root.classList.add('is-waiting');

    const finish = () => {
      timers.forEach(clearTimeout);
      timers = [];
      root.classList.remove('is-playing', 'is-again');
      root.style.removeProperty('--wait');
      root.textContent = text;
      state = 'done';
    };
    // A title waiting its turn plays at once, with its wait as a delay: one timeline, so the page
    // can be paused, sped up or finished as a whole (getAnimations)
    let left = 0;
    const play = () => {
      timers.forEach(clearTimeout);
      timers = [];
      const again = state !== 'waiting';
      const now = performance.now();
      const block = root.parentElement || document;
      const wait = Math.max(0, (queues.get(block) || 0) - now);
      count = lay(root, text);
      queues.set(block, now + wait + (stagger * (count - 1) + duration * QUEUE_AT) * pace);
      root.classList.remove('is-playing', 'is-waiting');
      root.classList.toggle('is-again', again);
      root.style.setProperty('--wait', `${Math.round(wait)}ms`);
      void root.offsetWidth; // restart the animation, even on a replay
      root.classList.add('is-playing');
      state = 'playing';
      left = count;
      // In case a block never ends (a tab in the background)
      timers.push(setTimeout(finish, wait + (duration + stagger * (count - 1)) * pace + 200));
    };
    root.addEventListener('animationend', (event) => {
      if (state !== 'playing' || !event.animationName.startsWith('kodza-text-block-reveal-block')) return;
      if (--left <= 0) finish();
    }, { signal });

    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();
      document.fonts.ready.then(() => !signal.aborted && play());
    }, { rootMargin: ENTER });
    observer.observe(root);

    // Still waiting, the lines follow the width: they are cut again when it changes
    let width = root.offsetWidth;
    const resize = new ResizeObserver(() => {
      if (state !== 'waiting' || Math.abs(root.offsetWidth - width) < 1) return;
      width = root.offsetWidth;
      count = lay(root, text);
    });
    resize.observe(root);
    root.addEventListener('kodza:replay', play, { signal });
    signal.addEventListener('abort', () => {
      observer.disconnect();
      resize.disconnect();
      timers.forEach(clearTimeout);
    });
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
