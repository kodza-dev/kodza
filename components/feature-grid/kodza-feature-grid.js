// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Feature Grid
// The head plays its entrance once, as it comes into view: the label rises, the title line after
// line, each out of its own mask, then the intro comes up. Each row of cells plays its own: the
// hairlines around a cell draw out from its corner, the icon comes up, the name rises out of its
// own box, the sentence and the arrow follow. The cells of a row follow one another from the left, the rows from the top.
// "kodza:replay" plays the rows on screen again, and sets the others waiting to be scrolled to.
// The hairlines, the veil and the arrow on hover are CSS. The timings are the constants under SELECTOR.
(() => {
  const SELECTOR = '.kodza-feature-grid';
  // The entrance, in ms (each one times the site's pace). The head, as Section Intro plays it:
  const LABEL = 1000; // the label rising out of its mask
  const TITLE = 1170; // each title line…
  const TITLE_AT = 110; // …the first one starting here…
  const TITLE_STEP = 125; // …and the next a beat later
  const INTRO_AT = 450; // the intro coming up
  // The cells:
  const LINE = 1100; // a hairline drawing out
  const MARK = 700; // the icon or the number coming up…
  const MARK_AT = 120; // …once the hairlines are on their way
  const NAME = 1000; // the name rising out of its box…
  const NAME_AT = 200;
  const TEXT = 900; // the sentence coming up…
  const TEXT_AT = 320;
  const ARROW_AT = 420; // …and the arrow, last
  const CARD = 900; // --cards: the card coming up
  const ROW = 160; // between two rows that come into view together…
  const COL = 90; // …and between two cells of a row
  const ENTER = '0px 0px -12% 0px'; // a row plays once its top is this far into the screen
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const GLIDE = 'cubic-bezier(0.6, 0, 0.1, 1)'; // slow start, long settle
  const SOFT = 'cubic-bezier(0.25, 1, 0.5, 1)';
  // The hairlines are drawn on ::before and ::after: browsers that cannot animate them show them
  const PSEUDO = typeof KeyframeEffect !== 'undefined' && 'pseudoElement' in KeyframeEffect.prototype;
  // Rising out of its own box, no wrapper needed: the box clips what is still below its bottom edge
  // (with room for the descenders and the side bearings)
  const RISE = [
    { transform: 'translateY(calc(100% + 0.2em))', clipPath: 'inset(-0.2em -0.1em 100% -0.1em)' },
    { transform: 'none', clipPath: 'inset(-0.2em -0.1em -0.2em -0.1em)' },
  ];
  const UP = (px) => [{ opacity: 0, transform: `translateY(${px}px)` }, { opacity: 1, transform: 'none' }];

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const parts = [...root.querySelectorAll('.kodza-feature-grid__head, .kodza-feature-grid__item')];
    if (still) return parts.forEach((part) => part.classList.add('is-shown'));
    const cards = root.classList.contains('kodza-feature-grid--cards');

    let running = [];
    const stop = () => {
      running.forEach((a) => a.cancel());
      running = [];
    };
    // The entrance of the head or of one cell, `at` ms after the first one of its batch
    const play = (part, at) => {
      const animate = (el, keyframes, options) => {
        if (el) running.push(el.animate(keyframes, { easing: GLIDE, fill: 'backwards', ...options, duration: options.duration * pace, delay: (at + (options.delay || 0)) * pace }));
      };
      const q = (s) => part.querySelector(`:scope > ${s}`);
      part.classList.add('is-shown');
      if (part.matches('.kodza-feature-grid__head')) {
        animate(q('.kodza-feature-grid__eyebrow'), RISE, { duration: LABEL });
        // The title, line after line, each out of its own mask (written as lines, like Section
        // Intro's); a title written in one piece rises in one piece
        const lines = [...part.querySelectorAll('.kodza-feature-grid__line > .kodza-feature-grid__rise')];
        if (lines.length) lines.forEach((line, i) => animate(line, [{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration: TITLE, delay: TITLE_AT + i * TITLE_STEP }));
        else animate(q('.kodza-feature-grid__title'), RISE, { duration: TITLE, delay: TITLE_AT });
        // The intro waits for the last line to be on its way
        animate(q('.kodza-feature-grid__intro'), UP(20), { duration: TEXT, delay: INTRO_AT + Math.max(0, lines.length - 2) * TITLE_STEP, easing: SOFT });
        return;
      }
      if (cards) animate(part, UP(28), { duration: CARD, easing: SOFT });
      else if (PSEUDO) {
        animate(part, [{ transform: 'scaleX(0)' }, { transform: 'none' }], { duration: LINE, pseudoElement: '::before' });
        animate(part, [{ transform: 'scaleY(0)' }, { transform: 'none' }], { duration: LINE, pseudoElement: '::after' });
      }
      animate(q('.kodza-feature-grid__icon') || q('.kodza-feature-grid__number'), UP(12), { duration: MARK, delay: MARK_AT, easing: SOFT });
      animate(q('.kodza-feature-grid__name'), RISE, { duration: NAME, delay: NAME_AT });
      animate(q('.kodza-feature-grid__text'), UP(14), { duration: TEXT, delay: TEXT_AT, easing: SOFT });
      animate(q('.kodza-feature-grid__arrow'), [{ opacity: 0, transform: 'translateX(-8px)' }, { opacity: 1, transform: 'none' }], { duration: MARK, delay: ARROW_AT, easing: SOFT });
    };

    // What comes into view together plays in the order of the page: row after row, and in a row,
    // cell after cell from the left (a row is the cells whose tops line up)
    const io = new IntersectionObserver((entries) => {
      const rows = [];
      entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target)
        .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
        .forEach((part) => {
          const top = part.getBoundingClientRect().top;
          const row = rows.find((r) => Math.abs(r.top - top) < 2);
          if (row) row.parts.push(part);
          else rows.push({ top, parts: [part] });
        });
      rows.forEach((row, r) => row.parts.forEach((part, c) => {
        io.unobserve(part);
        play(part, r * ROW + c * COL);
      }));
    }, { rootMargin: ENTER });
    const watch = () => parts.forEach((part) => io.observe(part));
    signal.addEventListener('abort', () => {
      io.disconnect();
      stop();
    });
    // Replayed: the rows on screen play again now, the others wait to be scrolled to
    root.addEventListener('kodza:replay', () => {
      io.disconnect();
      stop();
      parts.forEach((part) => part.classList.remove('is-shown'));
      watch();
    }, { signal });
    Promise.resolve(document.fonts?.ready).then(() => {
      if (!signal.aborted) watch();
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
