// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Flip Card
// You take the card by an edge: the edge under the mouse lifts a few degrees, and a click turns
// the card over from that side (Web Animations, so a click during the turn sends it back the way
// it came). The face that arrives lays its lines down one by one, each rising from behind its own
// edge. The face that looks away is inert. Settings: the constants below, the --kz-flip-card-*
// variables in the CSS, and data-trigger="hover" on the root to turn it on hover.
(() => {
  const SELECTOR = '[data-kodza-flip-card]';
  const DURATION = 800; // ms, one half-turn
  const LIFT = 96; // px the card rises toward you at the half-turn
  const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)'; // symmetric: the way back feels like the way there
  const RISE_AT = 0.42; // share of the turn when the arriving face starts laying its lines (it shows at 0.5)
  const RISE = 0.6; // share of the turn one line takes to rise
  const STAGGER = 55; // ms between two lines
  const RISE_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
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
    const inner = root.querySelector('.kodza-flip-card__inner');
    const front = root.querySelector('.kodza-flip-card__face--front');
    const back = root.querySelector('.kodza-flip-card__face--back');
    if (!inner || !front || !back) return;
    const fronts = front.querySelector('.kodza-flip-card__toggle');
    const backs = back.querySelector('.kodza-flip-card__toggle');
    const onHover = root.dataset.trigger === 'hover';
    const vertical = root.classList.contains('kodza-flip-card--vertical');
    const axis = vertical ? 'rotateX' : 'rotateY';
    // A side is the sign of the turn: +1 lifts the left edge (the top one when vertical turns -1).
    // From the keyboard, the card turns like a page: by its right edge, or its bottom one.
    const KEYBOARD_SIDE = vertical ? 1 : -1;
    let flipped = false;
    let rest = 0; // the angle the card comes to rest at
    let side = KEYBOARD_SIDE; // the side of the last turn
    let turn = []; // the animations of the last turn

    back.inert = true;
    if (still) root.classList.add('is-still');

    const sideOf = (event) => {
      const box = root.getBoundingClientRect();
      if (vertical) return event.clientY < box.top + box.height / 2 ? -1 : 1;
      return event.clientX < box.left + box.width / 2 ? 1 : -1;
    };
    // The lines of a face in reading order, list rows and figures one by one
    const linesOf = (face) => [...face.querySelectorAll('.kodza-flip-card__body > *, .kodza-flip-card__foot > *')]
      .flatMap((el) => (el.matches('ul, ol, .kodza-flip-card__stats') ? [...el.children] : [el]));

    if (!still) {
      signal.addEventListener('abort', () => {
        turn.forEach((a) => a.cancel());
        root.classList.remove('is-peek-start', 'is-peek-end');
      }, { once: true });
    }

    const play = (to, by) => {
      // Halfway through a turn, it goes back the way it came, from where it is
      if (turn[0]?.playState === 'running') {
        turn.forEach((a) => a.reverse());
        rest -= 180 * side;
        side = -side;
        return;
      }
      turn.forEach((a) => a.cancel());
      side = by;
      const from = ((rest % 360) + 360) % 360;
      rest = from + 180 * by;
      const arriving = to ? back : front;
      const timing = { duration: DURATION * pace, easing: EASE, fill: 'both' };
      turn = [
        inner.animate([
          { transform: `translateZ(0px) ${axis}(${from}deg)` },
          { transform: `translateZ(${LIFT}px) ${axis}(${from + 90 * by}deg)`, offset: 0.5 },
          { transform: `translateZ(0px) ${axis}(${rest}deg)` },
        ], timing),
        // Each line rises from behind its own bottom edge: the clip moves with it, so its lower
        // edge stays put while the text comes up through it
        ...linesOf(arriving).map((line, i) => line.animate([
          { transform: 'translateY(100%)', clipPath: 'inset(0 0 100% 0)' },
          { transform: 'none', clipPath: 'inset(0 0 0 0)' },
        ], {
          duration: DURATION * RISE * pace,
          delay: (DURATION * RISE_AT + STAGGER * i) * pace,
          easing: RISE_EASE,
          fill: 'backwards',
        })),
      ];
    };

    // `focus`: the visitor came from the keyboard, so focus follows to the face that is now shown
    const flip = (to, by, focus = false) => {
      if (to === flipped) return;
      flipped = to;
      front.inert = to;
      back.inert = !to;
      root.classList.toggle('is-flipped', to);
      if (!still) play(to, by);
      if (focus) (to ? backs : fronts)?.focus({ preventScroll: true });
    };

    root.addEventListener('click', (event) => {
      const keyboard = event.detail === 0;
      const by = keyboard ? KEYBOARD_SIDE : sideOf(event);
      if (event.target.closest('.kodza-flip-card__toggle')) return flip(!flipped, by, keyboard);
      if (flipped || event.target.closest('a, button, input, select, textarea, label')) return;
      if (onHover && event.pointerType === 'mouse') return;
      if (!window.getSelection()?.isCollapsed) return;
      flip(true, by);
    }, { signal });

    root.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !flipped) return;
      event.preventDefault();
      flip(false, -side, true); // undoes the last turn
    }, { signal });

    if (onHover) {
      root.addEventListener('pointerenter', (event) => { if (event.pointerType === 'mouse') flip(true, sideOf(event)); }, { signal });
      root.addEventListener('pointerleave', (event) => {
        if (event.pointerType !== 'mouse') return;
        const active = document.activeElement;
        if (root.contains(active) && active.matches(':focus-visible')) return; // reading with the keyboard: it stays
        flip(false, sideOf(event));
      }, { signal });
    } else if (!still) {
      // The edge under the mouse lifts: the first few degrees of the turn it would take
      const peek = (by) => {
        const start = vertical ? by < 0 : by > 0;
        root.classList.toggle('is-peek-start', by !== 0 && start);
        root.classList.toggle('is-peek-end', by !== 0 && !start);
      };
      root.addEventListener('pointermove', (event) => { if (event.pointerType === 'mouse') peek(sideOf(event)); }, { signal });
      root.addEventListener('pointerleave', () => peek(0), { signal });
    }
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
