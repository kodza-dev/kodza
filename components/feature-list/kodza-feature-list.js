// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Feature List
// Everything that is included, in groups set out in columns. Each group shows its first
// data-visible lines; the button unfolds every group at once at its real height, the lines that
// waited rising into place, and the groups below sliding down instead of jumping. It folds back
// the same way, the extra lines fading as the groups close, and keeps the button in view.
// The section plays its entrance once, as it comes into view: the label rises, the title line
// after line, each out of its own mask, the intro comes up; then the groups, column after column,
// each hairline drawing out from the left, the name rising, then its lines one after another;
// the button comes up last.
// "kodza:replay" plays the groups on screen again, and sets the others waiting to be scrolled to.
// The timings are the constants under SELECTOR.
(() => {
  const SELECTOR = '.kodza-feature-list';
  // Unfolding and folding, in ms (each one times the site's pace):
  const OPEN = 640; // the height opening, the groups below sliding down…
  const SHOW = 520; // …and each line that waited rising into place…
  const SHOW_AT = 80; // …the first one here…
  const SHOW_STEP = 45; // …the next ones a beat later, down a group…
  const SHOW_COLUMN = 40; // …and from one group to the next
  const FOLD = 480; // the height closing
  const FADE = 240; // the extra lines fading as it closes
  const KEEP = 96; // the button never folds closer than this to the top of the screen
  // The entrance. The head, as Section Intro plays it:
  const LABEL = 1000; // the label rising out of its mask
  const TITLE = 1170; // each title line…
  const TITLE_AT = 110; // …the first one starting here…
  const TITLE_STEP = 125; // …and the next a beat later
  const INTRO = 900; // the intro coming up…
  const INTRO_AT = 450;
  // The groups:
  const LINE = 1100; // the hairline drawing out
  const NAME = 1000; // the name rising out of its box…
  const NAME_AT = 100;
  const ITEM = 900; // …then each line…
  const ITEM_AT = 220;
  const ITEM_STEP = 45; // …a beat after the one above
  const COLUMN = 140; // between two groups that come into view together
  const BUTTON = 800; // the button coming up under the groups…
  const BUTTON_AT = 320; // …once the last group of its batch is on its way
  const ENTER = '0px 0px -12% 0px'; // a group plays once its top is this far into the screen
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
  // The hairlines are drawn on ::before: browsers that cannot animate it show it
  const PSEUDO = typeof KeyframeEffect !== 'undefined' && 'pseudoElement' in KeyframeEffect.prototype;
  // Rising out of its own box, no wrapper needed: the box clips what is still below its bottom edge
  // (with room for the descenders and the side bearings)
  const RISE = [
    { transform: 'translateY(calc(100% + 0.2em))', clipPath: 'inset(-0.2em -0.1em 100% -0.1em)' },
    { transform: 'none', clipPath: 'inset(-0.2em -0.1em -0.2em -0.1em)' },
  ];
  const UP = (px) => [{ opacity: 0, transform: `translateY(${px}px)` }, { opacity: 1, transform: 'none' }];
  let uid = 0;

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and animations stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const content = root.querySelector('.kodza-feature-list__groups');
    const toggle = root.querySelector('.kodza-feature-list__toggle');
    const groups = [...root.querySelectorAll('.kodza-feature-list__group')];
    const linesOf = (group) => [...group.querySelectorAll('.kodza-feature-list__item')];

    // The lines past data-visible, in each group, wait behind the button
    const visible = parseInt(root.dataset.visible, 10);
    const extras = groups.map((group) => (Number.isNaN(visible) ? [] : linesOf(group).slice(visible)));
    extras.flat().forEach((line) => line.classList.add('is-extra'));
    root.classList.toggle('is-short', !extras.flat().length || !toggle);

    if (content && toggle && extras.flat().length) {
      content.id = content.id || `kodza-feature-list-${++uid}`;
      toggle.setAttribute('aria-controls', content.id);
      // Where each group sits, to slide the ones that move instead of letting them jump
      const tops = () => groups.map((group) => group.offsetTop);
      let moving = []; // the unfolding or folding under way (not the entrance)
      const halt = () => {
        moving.forEach((animation) => animation.cancel());
        moving = [];
      };
      const move = (el, keyframes, options) => moving.push(el.animate(keyframes, options));
      const settle = () => {
        if (!signal.aborted) root.classList.remove('is-moving', 'is-closing');
      };
      toggle.addEventListener('click', () => {
        const opening = toggle.getAttribute('aria-expanded') !== 'true';
        halt();
        root.classList.remove('is-closing');
        const from = content.offsetHeight;
        const before = tops();
        toggle.setAttribute('aria-expanded', String(opening));
        root.classList.toggle('is-open', opening);
        const to = content.offsetHeight;
        const after = tops();
        if (!opening) {
          // Keep the button in view: it moves up by what the groups lose
          const top = toggle.getBoundingClientRect().top; // already where it will sit once folded
          if (top < KEEP) window.scrollBy({ top: top - KEEP, behavior: still ? 'auto' : 'smooth' });
        }
        if (still) return;
        root.classList.add('is-moving');
        if (opening) {
          move(content, [{ height: `${from}px` }, { height: `${to}px` }], { duration: OPEN * pace, easing: EASE });
          moving[0].onfinish = settle;
          groups.forEach((group, g) => {
            const dy = before[g] - after[g];
            if (Math.abs(dy) > 0.5) move(group, [{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: OPEN * pace, easing: EASE });
            extras[g].forEach((line, i) => move(line, UP(12), { duration: SHOW * pace, delay: (SHOW_AT + i * SHOW_STEP + g * SHOW_COLUMN) * pace, easing: EASE, fill: 'backwards' }));
          });
          return;
        }
        // Folding: stay open (the extra lines shown) until the end, the groups sliding to where
        // they will sit once closed
        root.classList.add('is-open', 'is-closing');
        move(content, [{ height: `${from}px` }, { height: `${to}px` }], { duration: FOLD * pace, easing: FOLD_EASE });
        moving[0].onfinish = () => {
          if (signal.aborted) return;
          root.classList.remove('is-open');
          halt(); // in the same frame: the groups land where they were sliding to
          settle();
        };
        groups.forEach((group, g) => {
          const dy = after[g] - before[g];
          if (Math.abs(dy) > 0.5) move(group, [{ transform: 'none' }, { transform: `translateY(${dy}px)` }], { duration: FOLD * pace, easing: FOLD_EASE, fill: 'forwards' });
          extras[g].forEach((line) => move(line, [{ opacity: 1 }, { opacity: 0 }], { duration: FADE * pace, easing: 'ease-out', fill: 'forwards' }));
        });
      }, { signal });
      signal.addEventListener('abort', () => {
        halt();
        root.classList.remove('is-moving', 'is-closing');
      });
    }

    // The entrance
    // The button is part of it, after the groups (gone when nothing waits behind it)
    const parts = [...root.querySelectorAll('.kodza-feature-list__head'), ...groups];
    if (toggle && !root.classList.contains('is-short')) parts.push(toggle);
    if (still) return parts.forEach((part) => part.classList.add('is-shown'));
    let running = [];
    const stop = () => {
      running.forEach((a) => a.cancel());
      running = [];
    };
    // The entrance of the head or of one group, `at` ms after the first one of its batch
    const play = (part, at) => {
      const animate = (el, keyframes, options) => {
        if (el) running.push(el.animate(keyframes, { easing: GLIDE, fill: 'backwards', ...options, duration: options.duration * pace, delay: (at + (options.delay || 0)) * pace }));
      };
      part.classList.add('is-shown');
      if (part.matches('.kodza-feature-list__head')) {
        const q = (s) => part.querySelector(`:scope > ${s}`);
        animate(q('.kodza-feature-list__eyebrow'), RISE, { duration: LABEL });
        // The title, line after line, each out of its own mask (written as lines, like Section
        // Intro's); a title written in one piece rises in one piece
        const lines = [...part.querySelectorAll('.kodza-feature-list__line > .kodza-feature-list__rise')];
        if (lines.length) lines.forEach((line, i) => animate(line, [{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration: TITLE, delay: TITLE_AT + i * TITLE_STEP }));
        else animate(q('.kodza-feature-list__title'), RISE, { duration: TITLE, delay: TITLE_AT });
        // The intro waits for the last line to be on its way
        animate(q('.kodza-feature-list__intro'), UP(20), { duration: INTRO, delay: INTRO_AT + Math.max(0, lines.length - 2) * TITLE_STEP, easing: SOFT });
        return;
      }
      if (part === toggle) return animate(part, UP(16), { duration: BUTTON, delay: BUTTON_AT, easing: SOFT });
      if (PSEUDO) animate(part, [{ transform: 'scaleX(0)' }, { transform: 'none' }], { duration: LINE, pseudoElement: '::before' });
      animate(part.querySelector('.kodza-feature-list__name'), RISE, { duration: NAME, delay: NAME_AT });
      // The lines shown, one after another (the ones that wait rise when the button opens them)
      linesOf(part).filter((line) => line.offsetParent).forEach((line, i) => animate(line, RISE, { duration: ITEM, delay: ITEM_AT + i * ITEM_STEP }));
    };

    // What comes into view together plays in the order of the page, column after column
    const io = new IntersectionObserver((entries) => {
      entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target)
        .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
        .forEach((part, i) => {
          io.unobserve(part);
          play(part, i * COLUMN);
        });
    }, { rootMargin: ENTER });
    const watch = () => parts.forEach((part) => io.observe(part));
    signal.addEventListener('abort', () => {
      io.disconnect();
      stop();
    });
    // Replayed: the groups on screen play again now, the others wait to be scrolled to
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
