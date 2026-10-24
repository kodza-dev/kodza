// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — 3D Press Button
// Presses the face for the pointer, Enter and Space alike, makes every tap go all the way down
// before it springs back, and flips aria-pressed on a latching toggle.
(() => {
  const SELECTOR = '.kodza-press-button';
  const TRAVEL = 110; // ms: a tap shorter than the way down (80 ms, plus a late frame) still reaches the bottom
  const SPRING = 450; // ms: the bounce back, as long as --kz-press-up

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(button, signal) {
    let downAt = 0;
    let timer = 0;
    let key = null;
    let pointer = null; // listens for the end of a pointer press, wherever the pointer goes
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      pointer?.abort();
    });

    const disabled = () => button.disabled || button.getAttribute('aria-disabled') === 'true';

    const press = () => {
      clearTimeout(timer);
      button.classList.remove('is-releasing');
      button.classList.add('is-pressed');
      downAt = performance.now();
    };

    const release = () => {
      if (!button.classList.contains('is-pressed')) return;
      clearTimeout(timer);
      // A quick tap still lands at the bottom before the spring sends it back up
      timer = setTimeout(() => {
        button.classList.remove('is-pressed');
        button.classList.add('is-releasing');
        timer = setTimeout(() => button.classList.remove('is-releasing'), SPRING);
      }, Math.max(0, TRAVEL - (performance.now() - downAt)));
    };

    button.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || disabled()) return;
      press();
      pointer?.abort();
      pointer = new AbortController();
      const end = () => {
        pointer.abort();
        release();
      };
      document.addEventListener('pointerup', end, { signal: pointer.signal });
      document.addEventListener('pointercancel', end, { signal: pointer.signal });
    }, { signal });

    // The keyboard presses it too: Enter on links and buttons, Space on buttons
    button.addEventListener('keydown', (event) => {
      if (event.repeat || key || disabled()) return;
      if (event.key === 'Enter' || (event.key === ' ' && button.localName === 'button')) {
        key = event.key;
        press();
      }
    }, { signal });
    button.addEventListener('keyup', (event) => {
      if (event.key !== key) return;
      key = null;
      release();
    }, { signal });
    button.addEventListener('blur', () => {
      if (!key) return;
      key = null;
      release();
    }, { signal });

    // A latching toggle: each press flips it, and the face stays down while it is on
    if (button.hasAttribute('aria-pressed')) {
      button.addEventListener('click', () => {
        if (disabled()) return;
        button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'));
      }, { signal });
    }
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
