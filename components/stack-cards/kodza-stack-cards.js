// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Stack Cards
// Takes the top card by the hand: drag it sideways and let go, and it leaves on the side you threw
// it, turned by your speed, far enough to clear the pile, then slides behind it while the others
// step forward. A release that is too short or too slow puts it back. Prev plays it backwards: the
// bottom card slides out from behind, then lands on top while the others step back. The arrow keys
// do the same on the card and on the buttons. The counter rolls,
// and a hidden line tells screen readers where they are.
// Tune it with the --kz-stack-cards-* variables (component.css), the words with data-text-status
// on the root ({n} and {total} are the numbers), and the feel of the throw with the constants below.
(() => {
  const SELECTOR = '[data-kodza-stack-cards]';
  const WORDS = {
    status: 'Card {n} of {total}',
  };
  const DRAG_START = 6; // px before a press becomes a drag (a vertical move scrolls the page instead)
  const DRAG_TURN = 0.06; // degrees per px the held card turns while you drag it
  const DRAG_TURN_MAX = 16;
  const THROW_DISTANCE = 0.3; // share of the card's width past which a release throws it
  const THROW_SPEED = 0.45; // px per ms past which a quick flick throws it, however short
  const SPEED_WINDOW = 80; // ms of movement the release speed is measured on
  const CLEAR = 16; // px of air between the card and the pile when it changes sides of it
  const LIFT = 0.04; // how high the card rises on its way out, in card widths
  const SPIN = 8; // degrees the card turns on its way out, plus SPIN_SPEED per px/ms of throw
  const SPIN_SPEED = 10;
  const SPIN_MAX = 18;
  const OUT_TIME = [220, 320]; // ms to clear the pile, fast throw to button press
  const UNDER_TIME = 560; // ms to slide behind the pile, or out from behind it for Prev
  const LAND_TIME = 480; // ms for Prev's card to land on top
  const RETURN_TIME = 460; // ms for a card let go too early to come back
  const ROLL_TIME = 420; // ms the counter takes to roll
  const OUT_EASE = 'cubic-bezier(0.2, 0.7, 0.3, 1)';
  const UNDER_EASE = 'cubic-bezier(0.5, 0, 0.2, 1)';
  const LAND_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const RETURN_EASE = 'cubic-bezier(0.34, 1.4, 0.64, 1)';
  const ROLL_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const cards = [...root.querySelectorAll('.kodza-stack-cards__card')];
    const total = cards.length;
    if (total < 2) return;
    const now = root.querySelector('.kodza-stack-cards__now');
    const status = root.querySelector('.kodza-stack-cards__status');
    const prev = root.querySelector('.kodza-stack-cards__button--prev');
    const next = root.querySelector('.kodza-stack-cards__button--next');
    const totalLabel = root.querySelector('.kodza-stack-cards__total');
    if (totalLabel) totalLabel.textContent = `/ ${total}`;
    const order = cards.slice(); // top of the pile first
    const running = new Set();
    let busy = false;
    let queued = null;

    const play = (el, frames, options) => {
      const animation = el.animate(frames, { ...options, duration: options.duration * pace });
      running.add(animation);
      animation.finished.catch(() => {}).finally(() => running.delete(animation));
      return animation;
    };
    signal.addEventListener('abort', () => running.forEach((animation) => animation.cancel()));

    // One motion per card: a new one starts where the last one is, so a quick second press never
    // jumps. It resolves true if it ran to the end without being replaced
    const motion = new WeakMap();
    const move = (card, to, duration, easing, from) => {
      const start = from || getComputedStyle(card).transform;
      motion.get(card)?.cancel();
      const animation = play(card, [{ transform: start }, { transform: to }], { duration, easing, fill: 'forwards' });
      motion.set(card, animation);
      return animation.finished.then(() => motion.get(card) === animation, () => false);
    };
    const settle = (card) => {
      motion.get(card)?.cancel();
      motion.delete(card);
      card.classList.remove('is-out');
    };

    // Every card takes its place by its depth; only the top one can be read, focused and held
    const place = (except) => {
      order.forEach((card, depth) => {
        if (card === except) return;
        card.style.setProperty('--kz-stack-cards-depth', depth);
        card.style.zIndex = total - depth;
        card.classList.toggle('is-top', depth === 0);
        card.tabIndex = depth === 0 ? 0 : -1;
        card.inert = depth !== 0;
      });
    };

    const roll = (dir) => {
      const number = cards.indexOf(order[0]) + 1;
      const label = String(number);
      if (status) status.textContent = word('status').replace('{n}', number).replace('{total}', total);
      if (!now) return;
      const old = now.lastElementChild;
      if (still || !old) {
        now.replaceChildren(Object.assign(document.createElement('span'), { textContent: label }));
        return;
      }
      [...now.children].slice(0, -1).forEach((el) => el.remove());
      const fresh = Object.assign(document.createElement('span'), { textContent: label });
      now.append(fresh);
      const options = { duration: ROLL_TIME, easing: ROLL_EASE, fill: 'forwards' };
      play(old, [{ transform: 'translateY(0)' }, { transform: `translateY(${-120 * dir}%)` }], options)
        .finished.then(() => old.remove(), () => {});
      play(fresh, [{ transform: `translateY(${120 * dir}%)` }, { transform: 'translateY(0)' }], options);
    };

    // Screen px to the pile's own px: a parent scaled by transform (a thumbnail, a theme) must not
    // change how far the card follows the hand
    const scaleOf = (el) => el.getBoundingClientRect().width / el.offsetWidth || 1;

    const keepFocus = () => {
      const focused = document.activeElement;
      return focused && cards.includes(focused);
    };

    const done = () => {
      busy = false;
      const ask = queued;
      queued = null;
      if (ask) ask();
    };

    // Where a card stops beside the pile: far enough that its near corner clears the pile (the card
    // turns on its bottom edge, so that corner is the bottom one; an open hand reaches further)
    const awayOf = (card, dir, spin) => {
      const width = card.offsetWidth;
      const turn = (Math.abs(spin) * Math.PI) / 180;
      const fan = root.classList.contains('kodza-stack-cards--fan')
        ? (Math.abs(parseFloat(getComputedStyle(root).getPropertyValue('--kz-stack-cards-fan'))) || 0) * (Math.PI / 180)
        : 0;
      const out = (width * (1 + Math.cos(turn))) / 2 + card.offsetHeight * Math.sin(fan) + CLEAR;
      return `translate(${dir * out}px, ${-width * LIFT}px) rotate(${spin}deg)`;
    };

    // Next: the top card goes out on `dir` (-1 left, 1 right), from wherever the hand left it, clears
    // the pile, and only then goes to the bottom and slides in behind the others
    const throwTop = (dir, speed = 0, from) => {
      if (signal.aborted) return;
      if (busy) {
        queued = () => throwTop(dir);
        return;
      }
      const card = order[0];
      const hadFocus = keepFocus();
      order.push(order.shift());
      card.style.transform = '';
      if (still) {
        place();
        roll(1);
        if (hadFocus) order[0].focus({ preventScroll: true });
        return;
      }
      busy = true;
      place(card);
      card.style.zIndex = total + 1;
      card.inert = true;
      card.classList.remove('is-top');
      card.classList.add('is-out');
      card.tabIndex = -1;
      if (hadFocus) order[0].focus({ preventScroll: true });
      roll(1);
      const spin = dir * Math.min(SPIN + Math.abs(speed) * SPIN_SPEED, SPIN_MAX);
      const time = clamp(OUT_TIME[1] - Math.abs(speed) * 120, OUT_TIME[0], OUT_TIME[1]);
      move(card, awayOf(card, dir, spin), time, OUT_EASE, from).then((current) => {
        if (!current || signal.aborted) return false;
        place();
        const under = move(card, 'none', UNDER_TIME, UNDER_EASE);
        done();
        return under;
      }).then((current) => {
        if (current) settle(card);
      });
    };

    // Prev: the same way back. The bottom card slides out from behind the pile on the left, and once
    // clear of it, lands on top while the others step back
    const bringBack = () => {
      if (signal.aborted) return;
      if (busy) {
        queued = bringBack;
        return;
      }
      const card = order[order.length - 1];
      const hadFocus = keepFocus();
      order.unshift(order.pop());
      if (still) {
        place();
        roll(-1);
        if (hadFocus) order[0].focus({ preventScroll: true });
        return;
      }
      busy = true;
      roll(-1);
      card.classList.add('is-out');
      card.style.setProperty('--kz-stack-cards-depth', 0);
      card.style.zIndex = 0;
      move(card, awayOf(card, -1, -SPIN), UNDER_TIME, UNDER_EASE).then((current) => {
        if (!current || signal.aborted) return false;
        const focusHere = hadFocus || keepFocus();
        place();
        if (focusHere) order[0].focus({ preventScroll: true });
        const land = move(card, 'none', LAND_TIME, LAND_EASE);
        done();
        return land;
      }).then((current) => {
        if (current) settle(card);
      });
    };

    // The hand: a press on the top card that moves sideways holds it; a vertical one scrolls
    let held = null;
    const letGo = () => {
      root.classList.remove('is-dragging');
      root.style.removeProperty('--kz-stack-cards-pull');
    };
    root.addEventListener('pointerdown', (event) => {
      const card = event.target.closest('.kodza-stack-cards__card');
      if (still || busy || !card || card !== order[0] || card.classList.contains('is-out') || event.button !== 0) return;
      held = { card, id: event.pointerId, x: event.clientX, y: event.clientY, dx: 0, moving: false, gone: false, trail: [] };
    }, { signal });
    root.addEventListener('pointermove', (event) => {
      if (!held || event.pointerId !== held.id || held.gone) return;
      const dx = event.clientX - held.x;
      const dy = event.clientY - held.y;
      if (!held.moving) {
        if (Math.abs(dy) > DRAG_START && Math.abs(dy) > Math.abs(dx)) {
          held = null;
          return;
        }
        if (Math.abs(dx) < DRAG_START) return;
        held.moving = true;
        // Caught on its way back: the hand takes it where it is
        held.base = new DOMMatrixReadOnly(getComputedStyle(held.card).transform).m41;
        settle(held.card);
        held.scale = scaleOf(held.card);
        held.width = held.card.offsetWidth;
        held.card.setPointerCapture(event.pointerId);
        root.classList.add('is-dragging');
      }
      event.preventDefault();
      const x = held.base + dx / held.scale;
      const y = (dy / held.scale) * 0.15;
      held.dx = x;
      held.transform = `translate(${x}px, ${y}px) rotate(${clamp(x * DRAG_TURN, -DRAG_TURN_MAX, DRAG_TURN_MAX)}deg)`;
      held.card.style.transform = held.transform;
      held.trail.push({ x, t: event.timeStamp });
      while (held.trail.length > 2 && event.timeStamp - held.trail[0].t > SPEED_WINDOW) held.trail.shift();
      root.style.setProperty('--kz-stack-cards-pull', Math.min(Math.abs(x) / (held.width * THROW_DISTANCE), 1).toFixed(3));
    }, { signal });
    const release = (event) => {
      if (!held || event.pointerId !== held.id) return;
      const { card, moving, dx, trail, width, transform } = held;
      held = null;
      if (!moving) return;
      letGo();
      // The click that ends a drag is not a click (and none may come: the guard leaves right after)
      const swallow = (click) => {
        click.preventDefault();
        click.stopPropagation();
      };
      root.addEventListener('click', swallow, { capture: true, once: true, signal });
      setTimeout(() => root.removeEventListener('click', swallow, { capture: true }), 0);
      const first = trail[0];
      const last = trail[trail.length - 1];
      const speed = first && last && last.t > first.t ? (last.x - first.x) / (last.t - first.t) : 0;
      const far = Math.abs(dx) > width * THROW_DISTANCE;
      const quick = Math.abs(speed) > THROW_SPEED && Math.sign(speed) === Math.sign(dx);
      if (event.type === 'pointerup' && (far || quick)) {
        throwTop(Math.sign(dx), speed, transform);
        return;
      }
      card.style.transform = '';
      move(card, 'none', RETURN_TIME, RETURN_EASE, transform).then((current) => {
        if (current) settle(card);
      });
    };
    root.addEventListener('pointerup', release, { signal });
    root.addEventListener('pointercancel', release, { signal });
    root.addEventListener('dragstart', (event) => {
      if (event.target.closest?.('.kodza-stack-cards__card')) event.preventDefault();
    }, { signal });

    next?.addEventListener('click', () => throwTop(-1), { signal });
    prev?.addEventListener('click', bringBack, { signal });
    root.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      if (event.target !== order[0] && !event.target.closest('.kodza-stack-cards__button')) return;
      event.preventDefault();
      if (event.key === 'ArrowRight') throwTop(-1);
      else bringBack();
    }, { signal });

    place();
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
