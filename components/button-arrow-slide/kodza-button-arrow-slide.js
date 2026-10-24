// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Arrow Button
// Draws the arrow in on hover; on the way out it keeps moving forward and undraws
// from its tail, as if it went through the button.
(() => {
  const SELECTOR = '.kodza-arrow-button';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(button, signal) {
    const path = button.querySelector('.kodza-arrow-button__arrow path');
    if (!path) return;
    const style = getComputedStyle(button);
    const duration = reduceMotion ? 0 : parseFloat(style.getPropertyValue('--kz-arrow-duration')) * 1000 || 600;
    const ease = style.getPropertyValue('--kz-arrow-ease').trim() || 'ease';
    let animation = null;

    const current = () => parseFloat(getComputedStyle(path).strokeDashoffset) || 0;
    const run = (from, to, done) => {
      animation?.cancel();
      animation = path.animate([{ strokeDashoffset: from }, { strokeDashoffset: to }], { duration, easing: ease, fill: 'forwards' });
      animation.onfinish = done || null;
    };

    const enter = () => {
      button.classList.add('is-hover');
      // Coming back while it was still leaving: start again from the left
      const from = current();
      run(from < 0 ? 1 : from, 0);
    };
    const leave = () => {
      button.classList.remove('is-hover');
      run(current(), -1, () => {
        animation?.cancel();
        animation = null;
      });
    };

    button.addEventListener('pointerenter', enter, { signal });
    button.addEventListener('pointerleave', leave, { signal });
    button.addEventListener('focus', () => button.matches(':focus-visible') && enter(), { signal });
    button.addEventListener('blur', leave, { signal });
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
