// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Show More
// Opens and closes at the real height (Web Animations), rises the items that were hidden,
// keeps aria-expanded in step, and brings the top back into view when closing past it.
// A list shows its first data-visible items; with nothing more to show, the button goes.
(() => {
  const SELECTOR = '.kodza-more';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const fold = 'cubic-bezier(0.65, 0, 0.35, 1)';
  let uid = 0;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const content = root.querySelector('.kodza-more__content');
    const toggle = root.querySelector('.kodza-more__toggle');
    if (!content || !toggle) return;
    content.id = content.id || `kodza-more-${++uid}`;
    toggle.setAttribute('aria-controls', content.id);

    // A list: the items past data-visible wait behind the button
    const visible = parseInt(root.dataset.visible, 10);
    const extra = Number.isNaN(visible) ? [] : [...content.children].slice(visible);
    extra.forEach((item) => item.classList.add('is-extra'));
    const measure = () => {
      if (Number.isNaN(visible)) root.classList.toggle('is-short', !root.classList.contains('is-open') && content.scrollHeight <= content.clientHeight + 2);
      else root.classList.toggle('is-short', !extra.length);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    signal.addEventListener('abort', () => observer.disconnect());

    toggle.addEventListener('click', () => {
      const opening = toggle.getAttribute('aria-expanded') !== 'true';
      content.getAnimations().forEach((animation) => animation.cancel());
      root.classList.remove('is-closing');
      const from = content.offsetHeight;
      toggle.setAttribute('aria-expanded', String(opening));
      if (opening) {
        root.classList.add('is-open');
        const to = content.offsetHeight;
        if (reduceMotion) return;
        content.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 640, easing: ease });
        extra.forEach((item, i) => item.animate([
          { opacity: 0, transform: 'translateY(12px)' },
          { opacity: 1, transform: 'none' },
        ], { duration: 520, delay: 80 + i * 55, easing: ease, fill: 'backwards' }));
        return;
      }
      // Closing: measure the short state, but stay open (items shown, no cap) until the end
      root.classList.remove('is-open');
      const to = content.offsetHeight;
      root.classList.add('is-open');
      const top = root.getBoundingClientRect().top;
      if (top < 0) window.scrollBy({ top: top - 24, behavior: reduceMotion ? 'auto' : 'smooth' });
      if (reduceMotion) return root.classList.remove('is-open');
      root.classList.add('is-closing');
      content.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 480, easing: fold }).onfinish = () => !signal.aborted && root.classList.remove('is-open', 'is-closing');
    }, { signal });
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
    // Rendered by React (data-kodza-manual): React starts it, with an init aimed at that markup once
    // it has hydrated it. Any earlier start would change markup React has not taken over yet
    const owner = root.closest('[data-kodza-manual]');
    if (owner && !(scope && owner.contains(scope))) return;
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
