// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Service List
// A row opens on click: the height opens out of the row, and its two lines, its tags, its terms and
// its link rise out of the opening one after another. It folds back the same way, its content
// dimming as the height closes. data-single keeps one row open at a time. The <details> stay
// native: without the script, a row still opens and closes, and find-in-page opens it.
// The section plays its entrance once, as it comes into view: the label rises, the title line
// after line, each out of its own mask, the intro comes up; then each row as it comes into view,
// its hairline drawing out from the left, the number coming up, the name rising out of its box.
// "kodza:replay" plays the rows on screen again, and sets the others waiting to be scrolled to.
// The timings are the constants under SELECTOR.
(() => {
  const SELECTOR = '.kodza-service-list';
  // Opening and folding a row, in ms (each one times the site's pace):
  const OPEN = 520; // the height opening…
  const SHOW = 620; // …and each part of the row rising out of it…
  const SHOW_AT = 60; // …the first one here…
  const SHOW_STEP = 70; // …the next ones a beat later
  const FOLD = 420; // the height closing
  // The entrance. The head, as Section Intro plays it:
  const LABEL = 1000; // the label rising out of its mask
  const TITLE = 1170; // each title line…
  const TITLE_AT = 110; // …the first one starting here…
  const TITLE_STEP = 125; // …and the next a beat later
  const INTRO = 900; // the intro coming up…
  const INTRO_AT = 450;
  // The rows:
  const LINE = 1100; // the hairline drawing out
  const MARK = 700; // the number coming up…
  const MARK_AT = 120;
  const NAME = 1000; // the name rising out of its box…
  const NAME_AT = 160;
  const ICON_AT = 300; // …and the +, last
  const ROW = 120; // between two rows that come into view together
  const ENTER = '0px 0px -12% 0px'; // a row plays once its top is this far into the screen
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const FOLD_EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';
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
  // starts is tied to `signal` (listeners get { signal }, observers and animations stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const items = [...root.querySelectorAll('.kodza-service-list__item')];
    const single = root.hasAttribute('data-single');

    // Opening and folding
    const open = (item) => {
      const panel = item.querySelector('.kodza-service-list__panel');
      item.classList.remove('is-closing');
      panel.getAnimations().forEach((animation) => animation.cancel());
      item.open = true;
      if (still || !panel) return;
      panel.animate([{ height: '0px' }, { height: `${panel.scrollHeight}px` }], { duration: OPEN * pace, easing: EASE });
      const body = panel.querySelector('.kodza-service-list__body') || panel;
      [...body.children].forEach((child, i) => child.animate(UP(14), { duration: SHOW * pace, delay: (SHOW_AT + i * SHOW_STEP) * pace, easing: EASE, fill: 'backwards' }));
    };
    const close = (item) => {
      const panel = item.querySelector('.kodza-service-list__panel');
      if (!item.open || item.classList.contains('is-closing')) return;
      if (still || !panel) return (item.open = false);
      item.classList.add('is-closing');
      panel.animate([{ height: `${panel.offsetHeight}px`, opacity: 1 }, { height: '0px', opacity: 0.4 }], { duration: FOLD * pace, easing: FOLD_EASE }).onfinish = () => {
        item.classList.remove('is-closing');
        item.open = false;
      };
    };
    items.forEach((item) => {
      item.querySelector('.kodza-service-list__trigger')?.addEventListener('click', (event) => {
        event.preventDefault();
        if (item.open && !item.classList.contains('is-closing')) return close(item);
        if (single) items.forEach((other) => other !== item && close(other));
        open(item);
      }, { signal });
    });
    signal.addEventListener('abort', () => items.forEach((item) => {
      item.querySelector('.kodza-service-list__panel')?.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
      item.classList.remove('is-closing');
    }));

    // The entrance
    const parts = [...root.querySelectorAll('.kodza-service-list__head, .kodza-service-list__item')];
    if (still) return parts.forEach((part) => part.classList.add('is-shown'));
    let running = [];
    const stop = () => {
      running.forEach((a) => a.cancel());
      running = [];
    };
    // The entrance of the head or of one row, `at` ms after the first one of its batch
    const play = (part, at) => {
      const animate = (el, keyframes, options) => {
        if (el) running.push(el.animate(keyframes, { easing: GLIDE, fill: 'backwards', ...options, duration: options.duration * pace, delay: (at + (options.delay || 0)) * pace }));
      };
      part.classList.add('is-shown');
      if (part.matches('.kodza-service-list__head')) {
        const q = (s) => part.querySelector(`:scope > ${s}`);
        animate(q('.kodza-service-list__eyebrow'), RISE, { duration: LABEL });
        // The title, line after line, each out of its own mask (written as lines, like Section
        // Intro's); a title written in one piece rises in one piece
        const lines = [...part.querySelectorAll('.kodza-service-list__line > .kodza-service-list__rise')];
        if (lines.length) lines.forEach((line, i) => animate(line, [{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration: TITLE, delay: TITLE_AT + i * TITLE_STEP }));
        else animate(q('.kodza-service-list__title'), RISE, { duration: TITLE, delay: TITLE_AT });
        // The intro waits for the last line to be on its way
        animate(q('.kodza-service-list__intro'), UP(20), { duration: INTRO, delay: INTRO_AT + Math.max(0, lines.length - 2) * TITLE_STEP, easing: SOFT });
        return;
      }
      const q = (s) => part.querySelector(`:scope > .kodza-service-list__trigger > ${s}`);
      if (PSEUDO) {
        animate(part, [{ transform: 'scaleX(0)' }, { transform: 'none' }], { duration: LINE, pseudoElement: '::before' });
        if (part === items[items.length - 1]) animate(part, [{ transform: 'scaleX(0)' }, { transform: 'none' }], { duration: LINE, delay: ROW, pseudoElement: '::after' });
      }
      animate(q('.kodza-service-list__number'), UP(12), { duration: MARK, delay: MARK_AT, easing: SOFT });
      animate(q('.kodza-service-list__name'), RISE, { duration: NAME, delay: NAME_AT });
      animate(q('.kodza-service-list__icon'), [{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'none' }], { duration: MARK, delay: ICON_AT, easing: SOFT });
    };

    // What comes into view together plays in the order of the page, row after row
    const io = new IntersectionObserver((entries) => {
      entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target)
        .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
        .forEach((part, i) => {
          io.unobserve(part);
          play(part, i * ROW);
        });
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
