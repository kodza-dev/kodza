// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Marquee
// Copies the words until they fill the width twice (copies are hidden from screen
// readers), then loops over exactly one set, at a constant speed in pixels per second.
// Under the pointer it eases to a stop instead of freezing, and starts again the same way.
(() => {
  const SELECTOR = '.kodza-marquee';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const track = root.querySelector('.kodza-marquee__track');
    if (!track) return;
    const original = [...track.children];

    const fill = () => {
      track.querySelectorAll('[data-copy]').forEach((copy) => copy.remove());
      const setWidth = track.scrollWidth;
      if (!setWidth) return;
      // Enough copies to cover the width plus one set (capped, in case the width is off)
      for (let filled = setWidth, n = 0; filled < root.clientWidth + setWidth && n < 50; filled += setWidth, n++) {
        original.forEach((item) => {
          const copy = item.cloneNode(true);
          copy.dataset.copy = '';
          copy.setAttribute('aria-hidden', 'true');
          track.append(copy);
        });
      }
      const speed = parseFloat(getComputedStyle(root).getPropertyValue('--kz-marquee-speed')) || 60;
      root.style.setProperty('--kz-marquee-distance', `${setWidth}px`);
      root.style.setProperty('--kz-marquee-duration', `${setWidth / speed}s`);
    };

    // is-ready comes with the mount, so the loop is held here until the fonts are in (measured
    // with a fallback font, it would jump when they swap)
    let filled = false;
    track.style.animationPlayState = 'paused';
    document.fonts.ready.then(() => {
      if (signal.aborted) return;
      fill();
      filled = true;
      track.style.animationPlayState = '';
    });
    // Refill only when the available width really changes
    let width = 0;
    const observer = new ResizeObserver(([entry]) => {
      if (Math.abs(entry.contentRect.width - width) < 1) return;
      width = entry.contentRect.width;
      if (filled) fill();
    });
    observer.observe(root);
    signal.addEventListener('abort', () => observer.disconnect());
    if (reduceMotion) return;

    // Slow down and speed up smoothly, by easing the animation's playback rate
    let rate = 1;
    let target = 1;
    let frame = null;
    const ease = () => {
      if (signal.aborted) return;
      rate += (target - rate) * 0.08;
      if (Math.abs(target - rate) < 0.01) rate = target;
      track.getAnimations().forEach((animation) => (animation.playbackRate = rate));
      frame = rate === target ? null : requestAnimationFrame(ease);
    };
    const setTarget = (value) => {
      target = value;
      if (!frame) frame = requestAnimationFrame(ease);
    };
    root.addEventListener('pointerenter', () => setTarget(0), { signal });
    root.addEventListener('pointerleave', () => setTarget(1), { signal });
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
