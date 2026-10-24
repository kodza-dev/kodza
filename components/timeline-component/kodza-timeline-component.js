// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Timeline
// Fills the rail up to the reading point (60% down the screen), gliding after it rather than
// sticking to it, fills each dot the ink has reached, marks the last one reached as the
// current step, and lets each step arrive the first time it comes into view.
(() => {
  const SELECTOR = '.kodza-timeline';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const items = [...root.querySelectorAll('.kodza-timeline__item')];
    const fill = Object.assign(document.createElement('span'), { className: 'kodza-timeline__fill' });
    fill.setAttribute('aria-hidden', 'true');
    root.prepend(fill);
    let frame = 0;
    let shown = 0;

    // Where the ink should be: the reading point, between the ends of the rail
    const target = () => {
      const box = root.getBoundingClientRect();
      const span = box.height - 16;
      return { box, span, value: Math.min(1, Math.max(0, (innerHeight * 0.6 - box.top - 8) / span)) };
    };

    // The ink glides towards it (a little behind the scroll), the dots follow the ink
    const update = () => {
      if (signal.aborted) return;
      frame = 0;
      const { box, span, value } = target();
      shown = reduceMotion ? value : shown + (value - shown) * 0.16;
      if (Math.abs(value - shown) < 0.0005) shown = value;
      root.style.setProperty('--kz-timeline-progress', shown.toFixed(4));
      const reached = box.top + 8 + shown * span;
      let current = null;
      items.forEach((item) => {
        // The dot sits 10px below the top of its step
        const passed = item.getBoundingClientRect().top + 10 <= reached + 1;
        item.classList.toggle('is-passed', passed);
        if (passed) current = item;
      });
      items.forEach((item) => item.classList.toggle('is-current', item === current));
      if (shown !== value) frame = requestAnimationFrame(update);
    };
    const schedule = () => (frame ||= requestAnimationFrame(update));

    if (!reduceMotion && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-seen');
        io.unobserve(entry.target);
      }), { rootMargin: '0px 0px -10% 0px' });
      items.forEach((item) => io.observe(item));
      signal.addEventListener('abort', () => io.disconnect());
    } else items.forEach((item) => item.classList.add('is-seen'));

    window.addEventListener('scroll', schedule, { passive: true, signal });
    window.addEventListener('resize', schedule, { signal });
    shown = target().value;
    update();
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
