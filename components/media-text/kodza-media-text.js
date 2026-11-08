// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Media Text
// Each part of the section (its head, then every row) plays its entrance once, as it comes into
// view: the label and title lines rise out of their masks, the picture opens from the top edge
// down, then the text, the list, the button and the caption follow. "kodza:replay" plays again
// the parts on screen and sets the others waiting. The timings are the constants under SELECTOR.
(() => {
  const SELECTOR = '.kodza-media-text';
  // The entrance, in ms (each one times the site's pace)
  const LABEL = 1000; // the label rising out of its mask
  const LINE = 1170; // each title line…
  const LINE_AT = 110; // …the first one starting here…
  const LINE_STEP = 125; // …and the next a beat later
  const CURTAIN = 1350; // the picture uncovered from the top edge down
  const CURTAIN_AT = 200;
  const SETTLE = 2000; // the picture settling from a slight zoom…
  const ZOOM = 1.2; // …this one
  const FADE = 900; // the text, the list, the button and the caption rising into place
  const FADE_AT = 700; // when the first of them starts
  const FADE_STEP = 110; // between two blocks
  const ITEM_STEP = 70; // between two list items
  const ENTER = '0px 0px -15% 0px'; // a part plays once its top is this far into the screen
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const GLIDE = 'cubic-bezier(0.6, 0, 0.1, 1)'; // slow start, long settle
  const SOFT = 'cubic-bezier(0.25, 1, 0.5, 1)';

  const decoded = (el) => Promise.all([...el.querySelectorAll('img')].map((img) => img.decode().catch(() => {})));

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const units = [...root.querySelectorAll('.kodza-media-text__head, .kodza-media-text__row')].filter((unit) => unit.closest(SELECTOR) === root);
    // The still path: no motion asked, by the visitor or the site
    if (reduceMotion || !pace) return units.forEach((unit) => unit.classList.add('is-shown'));
    const running = new Map(); // a part and the animations it plays
    const stop = (unit) => {
      running.get(unit)?.forEach((a) => a.cancel());
      running.delete(unit);
    };

    const play = async (unit) => {
      await decoded(unit);
      if (signal.aborted) return;
      stop(unit);
      const list = [];
      running.set(unit, list);
      // The entrance, at the site's pace
      const animate = (el, keyframes, options) => {
        if (el) list.push(el.animate(keyframes, { easing: GLIDE, fill: 'backwards', ...options, duration: options.duration * pace, delay: (options.delay || 0) * pace }));
      };
      const rise = (el, delay, duration) => animate(el, [{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration, delay });
      const fade = (el, delay) => animate(el, [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], { duration: FADE, delay, easing: SOFT });
      const q = (s) => unit.querySelector(s);
      unit.classList.add('is-shown');
      rise(q('.kodza-media-text__eyebrow .kodza-media-text__rise'), 0, LABEL);
      unit.querySelectorAll('.kodza-media-text__line .kodza-media-text__rise').forEach((line, i) => rise(line, LINE_AT + i * LINE_STEP, LINE));
      // The curtain: both layers on transforms, the picture settles from a slight zoom
      animate(q('.kodza-media-text__curtain'), [{ transform: 'translateY(-100%)' }, { transform: 'none' }], { duration: CURTAIN, delay: CURTAIN_AT });
      animate(q('.kodza-media-text__hold'), [{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: CURTAIN, delay: CURTAIN_AT });
      animate(q('.kodza-media-text__frame img'), [{ transform: `scale(${ZOOM})` }, { transform: 'none' }], { duration: SETTLE, delay: CURTAIN_AT, easing: SOFT });
      // The words, block after block; a list comes in item by item
      let at = FADE_AT;
      unit.querySelectorAll('.kodza-media-text__copy > :is(.kodza-media-text__body, .kodza-media-text__list, .kodza-media-text__actions, .kodza-media-text__sign)').forEach((block) => {
        if (!block.matches('.kodza-media-text__list')) {
          fade(block, at);
          at += FADE_STEP;
          return;
        }
        block.querySelectorAll(':scope > li').forEach((item) => {
          fade(item, at);
          at += ITEM_STEP;
        });
        at += FADE_STEP - ITEM_STEP;
      });
      fade(q('.kodza-media-text__caption'), FADE_AT + FADE_STEP);
    };

    const io = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      play(entry.target);
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
      [...running.keys()].forEach(stop);
    });
    // Replayed: the parts on screen play again now, the others wait to be scrolled to
    const onScreen = (unit) => inView.has(unit);
    root.addEventListener('kodza:replay', () => units.forEach((unit) => {
      io.unobserve(unit);
      if (onScreen(unit)) return play(unit);
      stop(unit);
      unit.classList.remove('is-shown');
      io.observe(unit);
    }), { signal });
    Promise.resolve(document.fonts?.ready).then(() => {
      if (!signal.aborted) units.forEach((unit) => {
        io.observe(unit);
        watch.observe(unit);
      });
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
