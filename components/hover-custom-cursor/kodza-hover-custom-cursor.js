// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Custom Cursor
// One cursor per zone. It follows the pointer with a soft lag (a little easing each
// frame, only while it moves), and shows the data-cursor label of the item under it.
// Touch screens and reduced motion keep the normal pointer, or a cursor without lag.
(() => {
  const SELECTOR = '.kodza-cursor-zone';
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FOLLOW = reduceMotion ? 1 : 0.2; // how much of the way it catches up each frame

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(zone, signal) {
    const cursor = document.createElement('div');
    cursor.className = 'kodza-cursor-zone__cursor';
    cursor.setAttribute('aria-hidden', 'true');
    const dot = document.createElement('span');
    dot.className = 'kodza-cursor-zone__dot';
    const label = document.createElement('span');
    label.className = 'kodza-cursor-zone__pill';
    cursor.append(dot, label);
    zone.append(cursor);
    zone.classList.add('is-ready');

    const target = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 };
    let frame = null;

    const render = () => {
      if (signal.aborted) return;
      pos.x += (target.x - pos.x) * FOLLOW;
      pos.y += (target.y - pos.y) * FOLLOW;
      cursor.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      const still = Math.abs(target.x - pos.x) < 0.1 && Math.abs(target.y - pos.y) < 0.1;
      frame = still ? null : requestAnimationFrame(render);
    };

    zone.addEventListener('pointerenter', (event) => {
      // Appear right under the pointer, not sliding in from a corner
      target.x = pos.x = event.clientX;
      target.y = pos.y = event.clientY;
      render();
      cursor.classList.add('is-visible');
    }, { signal });
    zone.addEventListener('pointermove', (event) => {
      target.x = event.clientX;
      target.y = event.clientY;
      const item = event.target.closest('[data-cursor]');
      if (item) label.textContent = item.dataset.cursor;
      cursor.classList.toggle('is-label', Boolean(item));
      if (!frame) frame = requestAnimationFrame(render);
    }, { signal });
    zone.addEventListener('pointerleave', () => cursor.classList.remove('is-visible', 'is-label'), { signal });
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
