// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Zoom Lens
// Follows the pointer with a little lag (or the finger while it is down, above it) and
// shows the detail at data-zoom, from data-zoom-src when given (loaded on first use).
// --inside moves the picture's zoom origin instead. Measured in the frame's own pixels.
(() => {
  const SELECTOR = '.kodza-zoom';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const img = root.querySelector('img');
    if (!img) return;
    const zoom = parseFloat(root.dataset.zoom) || 2.5;
    const inside = root.classList.contains('kodza-zoom--inside');
    let lens = null;
    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    let frame = 0;
    let lift = 0;

    const sharp = () => {
      const src = img.dataset.zoomSrc;
      if (!src || img.dataset.zoomLoaded) return;
      img.dataset.zoomLoaded = 'true';
      if (inside) {
        const hi = new Image();
        hi.onload = () => (img.src = src);
        hi.src = src;
      } else lens.style.backgroundImage = `url("${src}")`;
    };

    if (inside) root.style.setProperty('--kz-zoom-scale', zoom);
    else {
      lens = Object.assign(document.createElement('span'), { className: 'kodza-zoom__lens' });
      lens.setAttribute('aria-hidden', 'true');
      lens.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
      root.append(lens);
    }

    const paint = () => {
      // The picture, not the frame around it, sets the scale of the detail
      const w = img.clientWidth;
      const h = img.clientHeight;
      if (inside) {
        root.style.setProperty('--kz-zoom-ox', `${(x / w) * 100}%`);
        root.style.setProperty('--kz-zoom-oy', `${(y / h) * 100}%`);
        return;
      }
      const size = lens.offsetWidth;
      // The lens shows what is under its centre, magnified
      lens.style.backgroundSize = `${w * zoom}px ${h * zoom}px`;
      lens.style.backgroundPosition = `${-(x * zoom - size / 2)}px ${-(y * zoom - size / 2)}px`;
      root.style.setProperty('--kz-zoom-x', `${x - size / 2}px`);
      root.style.setProperty('--kz-zoom-y', `${y - size / 2 - lift}px`);
    };
    const glide = () => {
      if (signal.aborted) return;
      const k = reduceMotion ? 1 : 0.22;
      x += (tx - x) * k;
      y += (ty - y) * k;
      paint();
      frame = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(glide) : 0;
    };
    const aim = (event, first) => {
      const box = root.getBoundingClientRect();
      const k = box.width / root.offsetWidth || 1;
      tx = Math.min(img.clientWidth, Math.max(0, (event.clientX - box.left) / k));
      ty = Math.min(img.clientHeight, Math.max(0, (event.clientY - box.top) / k));
      if (first) {
        x = tx;
        y = ty;
        paint();
      }
      if (!frame) frame = requestAnimationFrame(glide);
    };

    root.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse') return;
      lift = 0;
      sharp();
      aim(event, true);
      root.classList.add('is-zooming');
    }, { signal });
    root.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse') return;
      // A finger would hide the lens: it shows a little above it
      lift = inside ? 0 : 90;
      sharp();
      aim(event, true);
      root.classList.add('is-zooming');
    }, { signal });
    root.addEventListener('pointermove', (event) => {
      if (!root.classList.contains('is-zooming')) return;
      root.classList.add('is-moving');
      aim(event);
    }, { signal });
    const leave = () => root.classList.remove('is-zooming', 'is-moving');
    root.addEventListener('pointerleave', leave, { signal });
    root.addEventListener('pointerup', (event) => event.pointerType !== 'mouse' && leave(), { signal });
    root.addEventListener('pointercancel', leave, { signal });
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
