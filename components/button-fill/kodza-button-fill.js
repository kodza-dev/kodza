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
