// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Expanding Panels
// Opens one panel at a time, on hover (after a short rest, so a pointer passing through opens
// nothing), focus or tap: the panels slide and resize from where they were to where they are
// (the Make Way engine, measured before and after), the photos recropped as they go. The text
// keeps the open panel's width all along, so it never rewraps while the panel grows.
// Tune it with the --kz-expanding-panels-* variables in the CSS and the constants below.
(() => {
  const SELECTOR = '.kodza-expanding-panels';
  const MOVE = 750; // ms, the panels sliding to their new widths; the text rises while they move (CSS)
  const MOVE_EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const CAUGHT_EASE = 'cubic-bezier(0.33, 0.66, 0.4, 1)'; // a move caught mid-way goes on at speed, no stop
  const HOVER_REST = 90; // ms the pointer rests on a panel before it opens (a wait, not motion: the pace leaves it)
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
    const list = root.querySelector('.kodza-expanding-panels__list');
    const panels = list ? [...list.children].filter((el) => el.matches('.kodza-expanding-panels__panel')) : [];
    const frames = panels.map((panel) => panel.querySelector('.kodza-expanding-panels__frame'));
    const toggles = panels.map((panel) => panel.querySelector('.kodza-expanding-panels__toggle'));
    if (panels.length < 2 || [...frames, ...toggles].some((el) => !el)) return;

    // The text's width: an open panel's, so it is laid out once and only uncovered as it opens
    let current = 0;
    const measure = () => root.style.setProperty('--kz-expanding-panels-open', `${panels[current].offsetWidth}px`);

    // The engine moves the panels: they slide and resize from their old widths to their new ones
    const engine = makeWay(list, frames, { duration: MOVE * pace, easing: MOVE_EASE, caught: CAUGHT_EASE });
    const set = (next) => {
      panels.forEach((panel, i) => {
        panel.classList.toggle('is-open', i === next);
        toggles[i].setAttribute('aria-expanded', String(i === next));
      });
      current = next;
      measure();
    };
    const open = (next) => {
      if (next === current) return;
      if (still) set(next);
      else engine.move(() => set(next));
    };

    // Hover opens after a short rest, with a mouse or a pen only: a finger taps
    const canHover = window.matchMedia('(hover: hover)');
    let timer = 0;
    frames.forEach((frame, i) => {
      frame.addEventListener('pointerenter', (event) => {
        if (event.pointerType === 'touch' || !canHover.matches) return;
        clearTimeout(timer);
        timer = setTimeout(() => open(i), HOVER_REST);
      }, { signal });
      frame.addEventListener('pointerleave', () => clearTimeout(timer), { signal });
    });
    toggles.forEach((toggle, i) => {
      toggle.addEventListener('click', () => open(i), { signal });
      // From the keyboard only: a click opens on its own, and a window coming back to the front
      // must not reopen the panel that kept the focus
      toggle.addEventListener('focus', () => toggle.matches(':focus-visible') && open(i), { signal });
    });

    // The arrows move along the panels, and the panel that takes the focus opens
    root.addEventListener('keydown', (event) => {
      const at = toggles.indexOf(event.target);
      const to = at < 0 ? undefined : { ArrowLeft: at - 1, ArrowUp: at - 1, ArrowRight: at + 1, ArrowDown: at + 1, Home: 0, End: toggles.length - 1 }[event.key];
      if (to === undefined) return;
      event.preventDefault();
      toggles[(to + toggles.length) % toggles.length].focus();
    }, { signal });

    // Written open in the markup: it starts open (the first one otherwise)
    set(Math.max(0, panels.findIndex((panel) => panel.classList.contains('is-open'))));

    // A new width changes an open panel's width, so the text's
    let width = list.clientWidth;
    let raf = 0;
    const observer = new ResizeObserver(() => {
      if (list.clientWidth === width) return;
      width = list.clientWidth;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        engine.cancel();
        measure();
      });
    });
    observer.observe(root);
    signal.addEventListener('abort', () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      engine.cancel();
    });
  }

  // ---------- Make Way engine (copied as is by Expanding Panels) ----------
  // move(change) measures every frame in the container's own pixels (a parent scaled by
  // transform does not shift them), runs change() to give them their new places, measures again,
  // then slides and resizes each frame from where it was to where it is. Caught mid-move, a frame
  // starts again from where it is. The container's height follows, so the page below never
  // jumps. A frame clips its picture (object-fit: cover): the picture grows with it, never stretched.
  // timing: { duration, easing, caught } — caught, the easing of a move that starts mid-way.
  function makeWay(container, frames, { duration, easing, caught = easing }) {
    let moving = [];
    const rects = () => {
      const box = container.getBoundingClientRect();
      const scale = box.width / container.offsetWidth || 1;
      return frames.map((frame) => {
        const rect = frame.getBoundingClientRect();
        return { x: (rect.left - box.left) / scale, y: (rect.top - box.top) / scale, w: rect.width / scale, h: rect.height / scale };
      });
    };
    const cancel = () => {
      moving.forEach((animation) => animation.cancel());
      moving = [];
    };
    const move = (change) => {
      const before = rects();
      const tall = container.offsetHeight;
      const timing = { duration, easing: moving.some((a) => a.playState === 'running') ? caught : easing };
      cancel();
      change();
      const after = rects();
      frames.forEach((frame, i) => {
        const [a, b] = [before[i], after[i]];
        if (Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.w - b.w), Math.abs(a.h - b.h)) < 0.5) return;
        moving.push(frame.animate([
          { transform: `translate(${a.x - b.x}px, ${a.y - b.y}px)`, width: `${a.w}px`, height: `${a.h}px` },
          { transform: 'translate(0px, 0px)', width: `${b.w}px`, height: `${b.h}px` },
        ], timing));
      });
      const height = container.offsetHeight;
      if (height !== tall) moving.push(container.animate([{ height: `${tall}px` }, { height: `${height}px` }], timing));
      // Resolves once everything has arrived, false when a newer move or a cancel cut it short
      return Promise.all(moving.map((animation) => animation.finished)).then(() => true, () => false);
    };
    return { move, cancel };
  }
  // ---------- end of the engine ----------

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
