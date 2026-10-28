// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Progress
// Follows data-value (0–100, or none for indeterminate): fills the bar or the ring, rolls the
// digits of the percentage, keeps aria-valuenow in step, and marks .is-complete at 100.
// From your code: el.dataset.value = 42 (or el.removeAttribute('data-value')).
(() => {
  const SELECTOR = '.kodza-progress';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const make = (tag, className) => Object.assign(document.createElement(tag), className ? { className } : {});

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const value = root.querySelector('.kodza-progress__value');
    const label = root.querySelector('.kodza-progress__label');
    if (!value) return;
    root.setAttribute('aria-valuemin', '0');
    root.setAttribute('aria-valuemax', '100');

    // The percentage: three columns of digits (0 to 9, stacked) and a tick for the end
    const number = make('span', 'kodza-progress__number');
    const columns = [0, 1, 2].map(() => {
      const column = make('span', 'kodza-progress__digit');
      const strip = make('span');
      for (let d = 0; d < 10; d++) strip.append(Object.assign(make('span'), { textContent: d }));
      column.append(strip);
      return column;
    });
    number.append(...columns, '%');
    const tick = make('span', 'kodza-progress__tick');
    tick.innerHTML = '<svg viewBox="0 0 16 16"><path d="M3.5 8.4l2.9 2.8 6.1-6.4" pathLength="1"/></svg>';
    value.replaceChildren(number, tick);
    value.setAttribute('aria-hidden', 'true');

    // The words it rolls to once done
    if (label && root.dataset.done) {
      const now = Object.assign(make('span'), { textContent: label.textContent.trim() });
      const done = Object.assign(make('span'), { textContent: root.dataset.done });
      label.replaceChildren(now, done);
    }

    let settle = 0;
    const render = (first) => {
      const raw = root.getAttribute('data-value');
      const unknown = raw === null || raw === '' || Number.isNaN(parseFloat(raw));
      root.classList.toggle('is-indeterminate', unknown);
      if (unknown) {
        root.removeAttribute('aria-valuenow');
        clearTimeout(settle);
        root.classList.remove('is-complete');
        return;
      }
      const v = Math.round(Math.min(100, Math.max(0, parseFloat(raw))));
      root.style.setProperty('--kz-progress-v', v);
      root.setAttribute('aria-valuenow', v);
      const digits = String(v).padStart(3, ' ');
      columns.forEach((column, i) => {
        const on = digits[i] !== ' ';
        column.style.setProperty('--kz-progress-d', on ? digits[i] : 0);
        if (on === !column.classList.contains('is-off')) return;
        // A column that comes or goes eases its width: the number never jumps
        const from = column.offsetWidth;
        column.classList.toggle('is-off', !on);
        const to = column.offsetWidth;
        if (!first && !reduceMotion) column.animate([{ width: `${from}px` }, { width: `${to}px` }], { duration: 450, easing: ease });
      });
      // 100% lands first, then gives way to the tick
      clearTimeout(settle);
      if (v < 100) root.classList.remove('is-complete');
      else if (first || reduceMotion) root.classList.add('is-complete');
      else settle = setTimeout(() => root.classList.add('is-complete'), 550);
    };

    render(true);
    const observer = new MutationObserver(() => render(false));
    observer.observe(root, { attributes: true, attributeFilter: ['data-value'] });
    signal.addEventListener('abort', () => {
      observer.disconnect();
      clearTimeout(settle);
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
