// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Magnetic Button
// Each button watches the pointer on the page: within reach (its size, plus a margin) it is
// drawn towards the pointer, its label a little more, and every frame eases the motion so it
// settles back softly. Measured in the button's own pixels, so a scaled parent is fine.
(() => {
  const SELECTOR = '.kodza-magnetic';
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(el, signal) {
    if (!fine || reduceMotion) return;
    const strength = Math.min(1, Math.max(0, parseFloat(el.dataset.strength) || 0.3));
    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    let frame = 0;

    const tick = () => {
      frame = 0;
      let moving = false;
      x += (tx - x) * 0.16;
      y += (ty - y) * 0.16;
      if (Math.abs(tx - x) < 0.05 && Math.abs(ty - y) < 0.05) {
        x = tx;
        y = ty;
      } else moving = true;
      el.style.setProperty('--kz-magnetic-x', `${x.toFixed(2)}px`);
      el.style.setProperty('--kz-magnetic-y', `${y.toFixed(2)}px`);
      el.style.setProperty('--kz-magnetic-lx', `${(x * 0.3).toFixed(2)}px`);
      el.style.setProperty('--kz-magnetic-ly', `${(y * 0.3).toFixed(2)}px`);
      if (moving) frame = requestAnimationFrame(tick);
    };

    const aim = (event) => {
      const box = el.getBoundingClientRect();
      const k = box.width / el.offsetWidth || 1;
      // The box at rest: where it would be without its current pull
      const cx = box.left + box.width / 2 - x * k;
      const cy = box.top + box.height / 2 - y * k;
      const dx = event.clientX - cx;
      const dy = event.clientY - cy;
      const reach = Math.max(box.width, box.height) / 2 + 60 * k;
      const near = Math.hypot(dx, dy) < reach;
      // Never further than half its height: it leans, it does not run
      const max = el.offsetHeight * 0.5;
      tx = near ? (dx / k) * strength : 0;
      ty = near ? (dy / k) * strength : 0;
      const pull = Math.hypot(tx, ty);
      if (pull > max) {
        tx *= max / pull;
        ty *= max / pull;
      }
      if (!frame) frame = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', aim, { passive: true, signal });
    document.addEventListener('pointerleave', () => {
      tx = ty = 0;
      if (!frame) frame = requestAnimationFrame(tick);
    }, { signal });
    signal.addEventListener('abort', () => cancelAnimationFrame(frame));
  }

  // Kodza lifecycle, the same in every component: `kodza:init` starts the instances inside
  // event.detail.root (the whole page by default), `kodza:destroy` stops them and puts their
  // markup back. For themes and apps that swap content without a page load. Each running root
  // keeps its markup as written under KODZA, shared by every Kodza script on the page: a Kodza
  // component inside another one is saved as written, not half-started, and stopped with it.
  const KODZA = Symbol.for('kodza');
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
    if (root.classList.contains('is-ready')) return; // already running, maybe from another copy of this script
    const controller = new AbortController();
    const saved = { html: written(root), attrs: attrsOf(root), stop: () => destroy(root) };
    instances.set(root, { controller, saved });
    root[KODZA] = saved;
    mount(root, controller.signal);
    root.classList.add('is-ready');
  });
  const destroy = (scope) => find(scope).forEach((root) => {
    const instance = instances.get(root);
    if (!instance) return;
    instances.delete(root);
    // The Kodza components running inside it stop first: once its markup is put back, their own
    // script could not find them any more
    root.querySelectorAll('*').forEach((el) => el[KODZA]?.stop());
    instance.controller.abort();
    delete root[KODZA];
    put(root, instance.saved);
  });
  document.addEventListener('kodza:init', (event) => init(event.detail?.root));
  document.addEventListener('kodza:destroy', (event) => destroy(event.detail?.root));
  init();
  // Loaded in <head>, the script runs before the markup exists: once more when it is parsed
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(), { once: true });
})();
