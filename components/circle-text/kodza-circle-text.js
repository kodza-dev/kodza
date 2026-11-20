// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Circle Text
// Writes the label of a round link or button around its edge, repeated and spaced so the copies
// close the circle exactly, with a dot between them. The ring turns slowly, follows the scroll
// (faster, and backwards when the page goes up), then settles; under the pointer it slows down.
// The label stays in the link, read once; the ring is hidden from screen readers. Settings: the
// --kz-circle-text-* variables in the CSS and the constants below.
(() => {
  const SELECTOR = '.kodza-circle-text';
  const SVG = 'http://www.w3.org/2000/svg';
  // The room between two copies, for the dot, in em of the ring's text
  const GAP = 2.4;
  // How much the scroll speeds the ring up, and the most it can (times its own speed)
  const SCROLL_PUSH = 9;
  const SCROLL_MAX = 7;
  // Under the pointer, its speed
  const HOVER_SPEED = 0.25;
  // How fast the speed settles back, per frame (0 to 1)
  const EASE = 0.06;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  let count = 0;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const label = root.querySelector('.kodza-circle-text__label');
    const words = label?.textContent.replace(/\s+/g, ' ').trim();
    if (!words) return;
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const id = `kodza-circle-text-${++count}-${Math.random().toString(36).slice(2, 7)}`;
    const ring = document.createElementNS(SVG, 'svg');
    ring.setAttribute('class', 'kodza-circle-text__ring');
    ring.setAttribute('aria-hidden', 'true');
    ring.setAttribute('focusable', 'false');
    root.prepend(ring);
    root.classList.add('is-live');

    // The circle the letters stand on, from the top, clockwise; then as many copies as fit, each
    // stretched to its share of the turn, and a dot in the middle of every gap
    const build = () => {
      const size = root.offsetWidth;
      const style = getComputedStyle(ring);
      const font = parseFloat(style.fontSize) || 12;
      const inset = parseFloat(style.getPropertyValue('--kz-circle-text-inset')) || font * 0.6;
      if (!size) return;
      const c = size / 2;
      const r = c - inset - font * 0.72;
      ring.setAttribute('viewBox', `0 0 ${size} ${size}`);
      ring.replaceChildren();
      const path = document.createElementNS(SVG, 'path');
      path.id = id;
      path.setAttribute('d', `M ${c} ${c - r} a ${r} ${r} 0 1 1 0 ${2 * r} a ${r} ${r} 0 1 1 0 ${-2 * r}`);
      path.setAttribute('fill', 'none');
      const text = document.createElementNS(SVG, 'text');
      ring.append(path, text);
      text.textContent = words;
      const length = text.getComputedTextLength();
      const turn = 2 * Math.PI * r;
      const gap = font * GAP;
      const n = Math.max(1, Math.floor(turn / (length + gap)));
      const share = turn / n;
      text.textContent = '';
      for (let i = 0; i < n; i++) {
        const copy = document.createElementNS(SVG, 'textPath');
        copy.setAttribute('href', `#${id}`);
        copy.setAttribute('startOffset', (i * share + gap / 2).toFixed(2));
        copy.setAttribute('textLength', (share - gap).toFixed(2));
        copy.setAttribute('lengthAdjust', 'spacing');
        copy.textContent = words;
        text.append(copy);
        const angle = ((i * share) / turn) * 2 * Math.PI;
        const middle = r + font * 0.34;
        const dot = document.createElementNS(SVG, 'circle');
        dot.setAttribute('class', 'kodza-circle-text__dot');
        dot.setAttribute('cx', (c + Math.sin(angle) * middle).toFixed(2));
        dot.setAttribute('cy', (c - Math.cos(angle) * middle).toFixed(2));
        dot.setAttribute('r', (font * 0.16).toFixed(2));
        ring.append(dot);
      }
    };
    document.fonts.ready.then(() => !signal.aborted && build());
    build();
    let size = root.offsetWidth;
    const resize = new ResizeObserver(() => {
      if (Math.abs(root.offsetWidth - size) < 1) return;
      size = root.offsetWidth;
      build();
    });
    resize.observe(root);
    signal.addEventListener('abort', () => resize.disconnect());
    if (still) return;

    // The turn is a CSS animation; the script only changes how fast it plays
    const spin = ring.getAnimations().find((a) => a.animationName === 'kodza-circle-text-spin');
    if (!spin) return;
    let push = 0;
    let hover = false;
    let rate = 1;
    let frame = 0;
    let lastY = window.scrollY;
    let lastT = performance.now();
    const tick = () => {
      push *= 1 - EASE;
      if (Math.abs(push) < 0.01) push = 0;
      const target = (1 + push) * (hover ? HOVER_SPEED : 1);
      rate += (target - rate) * EASE * 2;
      if (Math.abs(target - rate) < 0.005 && !push) rate = target;
      spin.playbackRate = rate;
      frame = rate === target && !push ? 0 : requestAnimationFrame(tick);
    };
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    window.addEventListener('scroll', () => {
      const now = performance.now();
      const speed = (window.scrollY - lastY) / Math.max(16, now - lastT);
      lastY = window.scrollY;
      lastT = now;
      push = Math.max(-SCROLL_MAX - 1, Math.min(SCROLL_MAX, push + speed * SCROLL_PUSH * 0.2));
      wake();
    }, { passive: true, signal });
    root.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse') return;
      hover = true;
      wake();
    }, { signal });
    root.addEventListener('pointerleave', () => {
      hover = false;
      wake();
    }, { signal });
    signal.addEventListener('abort', () => cancelAnimationFrame(frame));
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
