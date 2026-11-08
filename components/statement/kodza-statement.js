// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Statement
// Plays its entrance once, as it comes into view: the label and the lines of the sentence rise
// out of their masks, then the name under a quote comes up into place. "kodza:replay" plays it again if
// it is on screen, or sets it waiting to be scrolled to. The timings are the constants under
// SELECTOR.
(() => {
  const SELECTOR = '.kodza-statement';
  // The entrance, in ms (each one times the site's pace)
  const LABEL = 1000; // the label rising out of its mask
  const LINE = 1170; // each line of the sentence…
  const LINE_AT = 110; // …the first one starting here…
  const LINE_STEP = 140; // …and the next a beat later
  const FADE = 900; // the name under a quote rising into place…
  const FADE_AT = 520; // …once the last line is on its way
  const ENTER = '0px 0px -15% 0px'; // it plays once its top is this far into the screen
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const GLIDE = 'cubic-bezier(0.6, 0, 0.1, 1)'; // slow start, long settle
  const SOFT = 'cubic-bezier(0.25, 1, 0.5, 1)';

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    // The still path: no motion asked, by the visitor or the site
    if (reduceMotion || !pace) return root.classList.add('is-shown');
    let running = [];
    const stop = () => {
      running.forEach((a) => a.cancel());
      running = [];
    };

    const play = () => {
      stop();
      // The entrance, at the site's pace
      const animate = (el, keyframes, options) => {
        if (el) running.push(el.animate(keyframes, { easing: GLIDE, fill: 'backwards', ...options, duration: options.duration * pace, delay: (options.delay || 0) * pace }));
      };
      const rise = (el, delay, duration) => animate(el, [{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration, delay });
      const fade = (el, delay) => animate(el, [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: FADE, delay, easing: SOFT });
      const q = (s) => root.querySelector(s);
      root.classList.add('is-shown');
      rise(q('.kodza-statement__label .kodza-statement__rise'), 0, LABEL);
      const lines = root.querySelectorAll('.kodza-statement__line .kodza-statement__rise');
      lines.forEach((line, i) => rise(line, LINE_AT + i * LINE_STEP, LINE));
      fade(q('.kodza-statement__cite'), FADE_AT + Math.max(0, lines.length - 1) * LINE_STEP);
    };

    const io = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      io.unobserve(root);
      play();
    }), { rootMargin: ENTER });
    // What is on screen now, by the same threshold: an observer knows the visitor's screen, where the
    // window's height would be the frame's in an embed or a preview
    const inView = new Set();
    const watch = new IntersectionObserver((entries) => entries.forEach((entry) => {
      inView[entry.isIntersecting ? 'add' : 'delete'](entry.target);
    }), { rootMargin: ENTER });
    signal.addEventListener('abort', () => watch.disconnect());
    signal.addEventListener('abort', () => {
      io.disconnect();
      stop();
    });
    // Replayed: on screen it plays again now, off screen it waits to be scrolled to
    root.addEventListener('kodza:replay', () => {
      io.unobserve(root);
      if (inView.has(root)) return play();
      stop();
      root.classList.remove('is-shown');
      io.observe(root);
    }, { signal });
    Promise.resolve(document.fonts?.ready).then(() => {
      if (!signal.aborted) {
        io.observe(root);
        watch.observe(root);
      }
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
