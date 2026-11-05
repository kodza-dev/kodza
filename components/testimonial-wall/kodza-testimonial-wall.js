// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Testimonial Wall
// Deals the cards into columns (as many as --kz-testimonial-wall-columns asks at that width),
// repeats each column until it covers the window twice and slides it by exactly one set of cards,
// every other column downwards, so the loop never shows its seam. A column under the mouse eases
// to a stop; the pause button, the keyboard focus inside, a wall out of view or a hidden tab stop
// them all. With reduced motion the cards are dealt the same way and stay put.
// Settings: the --kz-testimonial-wall-* variables (speed, height, columns), and the constants below.
(() => {
  const SELECTOR = '[data-kodza-testimonial-wall]';
  const EASE = 260; // ms, how gently a column slows to a stop and gets going again
  const OFFSETS = [0, 0.42, 0.71, 0.18]; // where each column starts in its loop, so no two rows line up
  const MAX_SETS = 50; // copies of a column at most, for a very short one
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
    const wall = root.querySelector('.kodza-testimonial-wall__wall');
    const list = root.querySelector('.kodza-testimonial-wall__cards');
    const button = root.querySelector('.kodza-testimonial-wall__pause');
    const cards = list ? [...list.children] : [];
    if (!wall || !cards.length) return;
    let columns = [];
    let count = 0;
    let width = 0;
    let visible = false;
    let focused = false;
    let held = false;
    let frame = 0;
    let pending = 0;
    let last = 0;

    const waiting = () => held || focused || !visible || document.hidden;
    // A column's speed, eased: 1 runs, 0 holds (paused, so the browser stops drawing it)
    const apply = (col) => {
      const animation = col.animation;
      if (!animation) return;
      if (!col.rate) {
        if (animation.playState === 'running') animation.pause();
        return;
      }
      animation.playbackRate = col.rate;
      if (animation.playState !== 'running') animation.play();
    };
    const tick = (now) => {
      const step = last ? Math.min(64, now - last) : 16;
      const share = 1 - Math.exp(-step / (EASE * pace));
      let easing = false;
      last = now;
      columns.forEach((col) => {
        const target = waiting() || col.hovered ? 0 : 1;
        if (col.rate !== target) {
          col.rate += (target - col.rate) * share;
          if (Math.abs(target - col.rate) < 0.004) col.rate = target;
          else easing = true;
        }
        apply(col);
      });
      frame = easing ? requestAnimationFrame(tick) : 0;
      if (!easing) last = 0;
    };
    const sync = () => {
      // Out of sight, nothing to ease: the columns simply hold, and ease in again when seen
      if (!visible || document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
        last = 0;
        columns.forEach((col) => {
          col.rate = 0;
          apply(col);
        });
        return;
      }
      if (!frame) frame = requestAnimationFrame(tick);
    };

    // Card 1 to the first column, card 2 to the second, and round again
    const countOf = () => Math.max(1, Math.min(cards.length, Math.round(parseFloat(getComputedStyle(wall).getPropertyValue('--kz-testimonial-wall-columns'))) || 3));
    const deal = () => {
      columns.forEach((col) => col.animation?.cancel());
      count = countOf();
      columns = Array.from({ length: count }, () => {
        const column = document.createElement('div');
        const track = document.createElement('div');
        column.className = 'kodza-testimonial-wall__column';
        track.className = 'kodza-testimonial-wall__track';
        column.append(track);
        const col = { column, track, animation: null, duration: 0, rate: 0, hovered: false };
        column.addEventListener('pointerenter', (event) => {
          if (event.pointerType !== 'mouse') return;
          col.hovered = true;
          sync();
        }, { signal });
        column.addEventListener('pointerleave', () => {
          col.hovered = false;
          sync();
        }, { signal });
        return col;
      });
      cards.forEach((card, i) => columns[i % count].track.append(card));
      list.replaceChildren(...columns.map((col) => col.column));
    };

    // Each column repeats its cards until it covers the window plus one set, then slides by exactly
    // one set: the first copy lands where the cards were, so the seam is never seen
    const loop = () => {
      const speed = parseFloat(getComputedStyle(root).getPropertyValue('--kz-testimonial-wall-speed')) || 24;
      const height = wall.clientHeight;
      columns.forEach((col, i) => {
        const { track } = col;
        const progress = col.animation ? ((col.animation.currentTime || 0) % col.duration) / col.duration : OFFSETS[i % OFFSETS.length];
        col.animation?.cancel();
        track.querySelectorAll('[data-copy]').forEach((el) => el.remove());
        const originals = [...track.children];
        const copy = () => originals.forEach((card) => {
          const twin = card.cloneNode(true);
          twin.setAttribute('data-copy', '');
          twin.setAttribute('aria-hidden', 'true');
          twin.inert = true;
          track.append(twin);
        });
        copy();
        const set = track.children[originals.length].offsetTop - originals[0].offsetTop;
        if (set <= 0) return;
        for (let sets = 2; track.offsetHeight < height + set && sets < MAX_SETS; sets += 1) copy();
        col.duration = (set / speed) * 1000 * pace;
        col.animation = track.animate(
          [{ transform: 'translate3d(0, 0, 0)' }, { transform: `translate3d(0, ${-set}px, 0)` }],
          { duration: col.duration, iterations: Infinity, direction: i % 2 ? 'reverse' : 'normal' },
        );
        col.animation.currentTime = progress * col.duration;
        apply(col);
      });
    };

    // A new width: dealt again when the number of columns changes, measured again in any case
    const resize = new ResizeObserver(() => {
      if (wall.clientWidth === width) return;
      width = wall.clientWidth;
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(() => {
        if (countOf() !== count) deal();
        if (still) return;
        loop();
        sync();
      });
    });
    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    signal.addEventListener('abort', () => {
      resize.disconnect();
      seen.disconnect();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(pending);
      columns.forEach((col) => col.animation?.cancel());
    });

    deal();
    if (still) {
      root.classList.add('is-still');
      width = wall.clientWidth;
      resize.observe(wall);
      return;
    }
    root.classList.add('is-live');
    button?.addEventListener('click', () => {
      held = !held;
      button.setAttribute('aria-pressed', String(held));
      sync();
    }, { signal });
    // A link reached with the keyboard holds the wall; the pause button has its own say
    root.addEventListener('focusin', (event) => {
      focused = event.target !== button && event.target.matches(':focus-visible');
      sync();
    }, { signal });
    root.addEventListener('focusout', (event) => {
      if (!root.contains(event.relatedTarget)) focused = false;
      sync();
    }, { signal });
    document.addEventListener('visibilitychange', sync, { signal });
    // Measured once the fonts are in: a card's height depends on them
    Promise.resolve(document.fonts?.ready).then(() => {
      if (signal.aborted) return;
      loop();
      width = wall.clientWidth;
      resize.observe(wall);
      seen.observe(wall);
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
