// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Fill Button
// Prepares every .kodza-fill-button (a copy of its content for the fill, a rolling label)
// and follows where the pointer enters and leaves.
(() => {
  const SELECTOR = '.kodza-fill-button';

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(button, signal) {
    // 1. The original content moves into a resting layer
    const content = document.createElement('span');
    content.className = 'kodza-fill-button__content';
    content.append(...button.childNodes);
    button.append(content);

    // 2. Each label gets a copy of itself for the roll
    content.querySelectorAll('.kodza-fill-button__label').forEach((label) => {
      const text = label.textContent.trim();
      label.innerHTML = '';
      const line = document.createElement('span');
      line.dataset.text = text;
      line.textContent = text;
      label.append(line);
    });

    // 3. The arrow, if any, is doubled so it can loop
    content.querySelectorAll('.kodza-fill-button__icon').forEach((icon) => {
      const svg = icon.querySelector('svg');
      if (svg) icon.append(svg.cloneNode(true));
    });

    // 4. The filled layer is a copy, hidden from screen readers
    const fill = content.cloneNode(true);
    fill.className = 'kodza-fill-button__fill';
    fill.setAttribute('aria-hidden', 'true');
    button.append(fill);

    // 5. The circle grows from the entry point and closes toward the exit point
    const track = (event) => {
      const rect = button.getBoundingClientRect();
      button.style.setProperty('--kz-x', `${((event.clientX - rect.left) / rect.width) * 100}%`);
      button.style.setProperty('--kz-y', `${((event.clientY - rect.top) / rect.height) * 100}%`);
    };
    button.addEventListener('pointerenter', (event) => {
      track(event);
      button.classList.add('is-hover');
    }, { signal });
    button.addEventListener('pointerleave', (event) => {
      track(event);
      button.classList.remove('is-hover');
    }, { signal });
    // With the keyboard, the fill starts from the center
    button.addEventListener('focus', () => {
      if (!button.matches(':hover')) {
        button.style.setProperty('--kz-x', '50%');
        button.style.setProperty('--kz-y', '50%');
      }
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
