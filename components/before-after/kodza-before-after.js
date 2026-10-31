// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Before / After
// Moves the handle with the pointer (exactly under it while dragging, gliding there after a
// click), with the arrow keys through the range input, and nudges once when first seen.
// Positions are read in the frame's own pixels, so a scaled parent is fine.
(() => {
  const SELECTOR = '.kodza-compare';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const range = root.querySelector('.kodza-compare__range');
    let pos = parseFloat(range?.value) || 50;
    let target = pos;
    let frame = 0;
    let dragging = false;

    const paint = () => {
      root.style.setProperty('--kz-compare-pos', `${pos}%`);
      root.classList.toggle('is-near-start', pos < 22);
      root.classList.toggle('is-near-end', pos > 78);
      if (range) range.value = Math.round(pos);
    };
    const glide = () => {
      if (signal.aborted) return;
      pos += (target - pos) * (dragging || reduceMotion ? 1 : 0.2);
      if (Math.abs(target - pos) < 0.05) pos = target;
      paint();
      frame = pos === target ? 0 : requestAnimationFrame(glide);
    };
    const go = (value) => {
      target = Math.min(100, Math.max(0, value));
      if (!frame) frame = requestAnimationFrame(glide);
    };
    const at = (event) => {
      const box = root.getBoundingClientRect();
      return ((event.clientX - box.left) / box.width) * 100;
    };

    root.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      root.setPointerCapture(event.pointerId);
      root.classList.add('is-dragging');
      go(at(event));
    }, { signal });
    root.addEventListener('pointermove', (event) => {
      if (!root.hasPointerCapture(event.pointerId)) return;
      dragging = true;
      go(at(event));
    }, { signal });
    const release = () => {
      dragging = false;
      root.classList.remove('is-dragging');
    };
    root.addEventListener('pointerup', release, { signal });
    root.addEventListener('pointercancel', release, { signal });
    range?.addEventListener('input', () => go(parseFloat(range.value)), { signal });

    // The first time it is seen: a small nudge, to say it moves
    if (!reduceMotion && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = pos;
        [[start + 9, 450], [start - 6, 950], [start, 1400]].forEach(([value, delay]) => setTimeout(() => !dragging && go(value), delay));
      }, { threshold: 0.6 });
      io.observe(root);
      signal.addEventListener('abort', () => io.disconnect());
    }

    paint();
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
