// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Accordion
// Animates the <details>: the panel opens at its real height while the answer rises from
// behind its edge, and closes the same way before the browser closes it. With data-single,
// opening one answer folds the others.
(() => {
  const SELECTOR = '.kodza-accordion';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const fold = 'cubic-bezier(0.65, 0, 0.35, 1)';

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const items = [...root.querySelectorAll('.kodza-accordion__item')];
    const single = root.hasAttribute('data-single');

    const open = (item) => {
      const panel = item.querySelector('.kodza-accordion__panel');
      item.classList.remove('is-closing');
      panel.getAnimations().forEach((animation) => animation.cancel());
      item.open = true;
      if (reduceMotion) return;
      panel.animate([{ height: '0px' }, { height: `${panel.scrollHeight}px` }], { duration: 520, easing: ease });
      [...panel.children].forEach((child, i) => child.animate([
        { opacity: 0, transform: 'translateY(14px)' },
        { opacity: 1, transform: 'none' },
      ], { duration: 620, delay: 60 + i * 70, easing: ease, fill: 'backwards' }));
    };

    const close = (item) => {
      const panel = item.querySelector('.kodza-accordion__panel');
      if (!item.open || item.classList.contains('is-closing')) return;
      if (reduceMotion) return (item.open = false);
      item.classList.add('is-closing');
      panel.animate([{ height: `${panel.offsetHeight}px`, opacity: 1 }, { height: '0px', opacity: 0.4 }], { duration: 420, easing: fold }).onfinish = () => {
        item.classList.remove('is-closing');
        item.open = false;
      };
    };

    items.forEach((item) => {
      item.querySelector('.kodza-accordion__trigger').addEventListener('click', (event) => {
        event.preventDefault();
        if (item.open && !item.classList.contains('is-closing')) return close(item);
        if (single) items.forEach((other) => other !== item && close(other));
        open(item);
      }, { signal });
    });
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
