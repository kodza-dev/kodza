// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Border Trace Card
// Draws the card's rounded border as an SVG path, then animates its dash from the point
// of the border closest to where the pointer entered. The path goes around three times,
// so a dash can start anywhere and still be one continuous line.
(() => {
  const SELECTOR = '.kodza-trace';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const SVG = 'http://www.w3.org/2000/svg';
  const CORNER = 26; // length of each corner arm, for --corners

  // A rounded rectangle, starting at the top-left, going clockwise (only the drawing commands)
  function lap(w, h, r, i) {
    const x0 = i, y0 = i, x1 = w - i, y1 = h - i;
    r = Math.max(0, Math.min(r - i, (x1 - x0) / 2, (y1 - y0) / 2));
    return `H ${x1 - r} A ${r} ${r} 0 0 1 ${x1} ${y0 + r} V ${y1 - r} A ${r} ${r} 0 0 1 ${x1 - r} ${y1} ` +
      `H ${x0 + r} A ${r} ${r} 0 0 1 ${x0} ${y1 - r} V ${y0 + r} A ${r} ${r} 0 0 1 ${x0 + r} ${y0}`;
  }

  // Four corner brackets, each drawn from one arm to the other
  function corners(w, h, r, i) {
    const x0 = i, y0 = i, x1 = w - i, y1 = h - i, c = CORNER;
    r = Math.max(0, r - i);
    return [
      `M ${x0} ${y0 + r + c} V ${y0 + r} A ${r} ${r} 0 0 1 ${x0 + r} ${y0} H ${x0 + r + c}`,
      `M ${x1 - r - c} ${y0} H ${x1 - r} A ${r} ${r} 0 0 1 ${x1} ${y0 + r} V ${y0 + r + c}`,
      `M ${x1} ${y1 - r - c} V ${y1 - r} A ${r} ${r} 0 0 1 ${x1 - r} ${y1} H ${x1 - r - c}`,
      `M ${x0 + r + c} ${y1} H ${x0 + r} A ${r} ${r} 0 0 1 ${x0} ${y1 - r} V ${y1 - r - c}`,
    ];
  }

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(card, signal) {
    const mode = card.classList.contains('kodza-trace--corners') ? 'corners' : card.classList.contains('kodza-trace--both') ? 'both' : 'one';
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('class', 'kodza-trace__svg');
    svg.setAttribute('aria-hidden', 'true');
    card.append(svg);

    const style = getComputedStyle(card);
    const duration = parseFloat(style.getPropertyValue('--kz-trace-duration')) * 1000 || 700;
    const ease = style.getPropertyValue('--kz-trace-ease').trim() || 'ease';
    let paths = [];
    let lapLength = 0;
    let samples = [];
    let entry = 0;

    function build() {
      const { width: w, height: h } = card.getBoundingClientRect();
      const r = parseFloat(style.getPropertyValue('--kz-trace-radius')) || 0;
      const inset = (parseFloat(style.getPropertyValue('--kz-trace-width')) || 1.5) / 2;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.replaceChildren();
      const shapes = mode === 'corners' ? corners(w, h, r, inset) : [`M ${inset + Math.max(0, r - inset)} ${inset} ` + lap(w, h, r, inset).repeat(1) + ' ' + lap(w, h, r, inset) + ' ' + lap(w, h, r, inset)];
      paths = shapes.map((d) => {
        const path = document.createElementNS(SVG, 'path');
        path.setAttribute('d', d);
        // At rest the dash is zero-long, and a round cap would still draw a dot: hidden until traced
        path.style.opacity = 0;
        svg.append(path);
        return path;
      });
      if (mode === 'corners') {
        paths.forEach((p) => {
          p.setAttribute('pathLength', '1');
          p.style.strokeDasharray = '0 1';
        });
        return;
      }
      lapLength = paths[0].getTotalLength() / 3;
      paths[0].style.strokeDasharray = `0 ${lapLength * 3}`;
      // Points along one lap, to find where the pointer came in
      samples = Array.from({ length: 240 }, (_, k) => {
        const s = (k / 240) * lapLength;
        const p = paths[0].getPointAtLength(s);
        return { s, x: p.x, y: p.y };
      });
    }

    const nearest = (x, y) => samples.reduce((best, p) => ((p.x - x) ** 2 + (p.y - y) ** 2 < (best.x - x) ** 2 + (best.y - y) ** 2 ? p : best)).s;

    function enter(event) {
      const rect = card.getBoundingClientRect();
      const L = lapLength;
      if (mode === 'corners') {
        // The corner closest to the pointer goes first, then the others
        const cx = event ? event.clientX - rect.left : rect.width / 2;
        const cy = event ? event.clientY - rect.top : 0;
        const order = [[0, 0], [rect.width, 0], [rect.width, rect.height], [0, rect.height]]
          .map(([x, y], i) => ({ i, d: (x - cx) ** 2 + (y - cy) ** 2 }))
          .sort((a, b) => a.d - b.d);
        order.forEach(({ i }, rank) => {
          paths[i].getAnimations().forEach((a) => a.cancel());
          // Each corner shows up when its own line starts, not during its delay (a dot would wait there)
          paths[i].animate([
            { strokeDasharray: '0 1', opacity: 0 },
            { strokeDasharray: '0 1', opacity: 1, offset: 0.01 },
            { strokeDasharray: '1 0', opacity: 1 },
          ], { duration: duration * 0.55, delay: rank * 70, easing: ease, fill: 'both' });
        });
        return;
      }
      entry = event ? nearest(event.clientX - rect.left, event.clientY - rect.top) : 0;
      const path = paths[0];
      path.getAnimations().forEach((a) => a.cancel());
      path.style.opacity = 1;
      if (mode === 'both') {
        // One dash centred on the entry point, growing both ways until it closes the loop
        path.animate([
          { strokeDasharray: `0 ${3 * L}`, strokeDashoffset: -(entry + L) },
          { strokeDasharray: `${L} ${3 * L}`, strokeDashoffset: -(entry + L / 2) },
        ], { duration, easing: ease, fill: 'forwards' });
      } else {
        path.animate([
          { strokeDasharray: `0 ${3 * L}`, strokeDashoffset: -entry },
          { strokeDasharray: `${L} ${3 * L}`, strokeDashoffset: -entry },
        ], { duration, easing: ease, fill: 'forwards' });
      }
    }

    // Once a line has shrunk back to nothing, it hides again (a new hover cancels this first)
    const hideAfter = (path, animation) => animation.finished.then(() => {
      if (signal.aborted) return;
      path.style.opacity = 0;
      animation.cancel();
    }).catch(() => {});

    function leave() {
      const L = lapLength;
      if (mode === 'corners') {
        paths.forEach((p) => {
          p.getAnimations().forEach((a) => a.cancel());
          hideAfter(p, p.animate([{ strokeDasharray: '1 0', opacity: 1 }, { strokeDasharray: '0 1', opacity: 1 }], { duration: duration * 0.45, easing: ease, fill: 'forwards' }));
        });
        return;
      }
      const path = paths[0];
      path.getAnimations().forEach((a) => a.cancel());
      if (mode === 'both') {
        path.animate([{ opacity: 1, strokeDasharray: `${L} ${3 * L}`, strokeDashoffset: -(entry + L / 2) }, { opacity: 0, strokeDasharray: `${L} ${3 * L}`, strokeDashoffset: -(entry + L / 2) }], { duration: duration * 0.5, easing: 'ease', fill: 'forwards' });
      } else {
        // The line does not rewind: its tail catches up with its head, one lap later
        hideAfter(path, path.animate([
          { strokeDasharray: `${L} ${3 * L}`, strokeDashoffset: -entry },
          { strokeDasharray: `0 ${3 * L}`, strokeDashoffset: -(entry + L) },
        ], { duration, easing: ease, fill: 'forwards' }));
      }
    }

    build();
    const observer = new ResizeObserver(build);
    observer.observe(card);
    signal.addEventListener('abort', () => observer.disconnect());
    card.addEventListener('pointerenter', enter, { signal });
    card.addEventListener('pointerleave', leave, { signal });
    card.addEventListener('focusin', () => enter(null), { signal });
    card.addEventListener('focusout', leave, { signal });
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
