// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Checkbox
// Keeps a "select all" box (data-all) in step with the others in its group: checked when all
// are, a dash when only some are, and a click on it checks or clears them all (skipping the
// disabled ones). The drawing is CSS.
(() => {
  const SELECTOR = '.kodza-checkbox';
  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const all = root.querySelector('.kodza-checkbox__input[data-all]');
    root.classList.add('is-ready');
    if (!all) return;
    const boxes = [...root.querySelectorAll('.kodza-checkbox__input:not([data-all])')].filter((box) => !box.disabled);

    let settling = 0;
    const sync = () => {
      clearTimeout(settling);
      // Wait for a cascade from the "all" box to finish before judging
      settling = setTimeout(judge, 80);
    };
    const judge = () => {
      const on = boxes.filter((box) => box.checked).length;
      all.checked = on === boxes.length;
      all.indeterminate = on > 0 && on < boxes.length;
    };

    all.addEventListener('change', () => {
      // One after the other, for the eye; the target is read once, before the boxes move
      const value = all.checked;
      boxes.forEach((box, i) => setTimeout(() => {
        if (box.checked === value) return;
        box.checked = value;
        box.dispatchEvent(new Event('change', { bubbles: true }));
      }, i * 60));
      // Meanwhile the "all" box already shows where it is going
      all.indeterminate = false;
      all.checked = value;
    }, { signal });
    boxes.forEach((box) => box.addEventListener('change', sync, { signal }));
    judge();
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
