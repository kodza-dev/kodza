// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Table
// Sorts by the clicked column (numbers and dates by their data-sort value, words by their
// text), keeps aria-sort in step and glides each row from its old place to its new one. Also
// fades the edges while there is more to scroll sideways.
(() => {
  const SELECTOR = '.kodza-table';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const tbody = root.querySelector('tbody');
    const headers = [...root.querySelectorAll('thead th')];
    if (!tbody) return;

    const value = (row, index) => {
      const cell = row.children[index];
      const raw = cell?.dataset.sort ?? cell?.textContent.trim() ?? '';
      const number = Number(raw);
      return raw !== '' && !Number.isNaN(number) ? number : raw.toLowerCase();
    };

    const mark = (index) => [...tbody.rows].forEach((row) => [...row.children].forEach((cell, i) => cell.classList.toggle('is-sorted', i === index)));

    const sort = (th) => {
      const index = headers.indexOf(th);
      const numeric = th.classList.contains('kodza-table__num');
      const current = th.getAttribute('aria-sort');
      // A new column starts from the most telling end: biggest numbers, first letters
      const order = current ? (current === 'ascending' ? 'descending' : 'ascending') : numeric ? 'descending' : 'ascending';
      headers.forEach((other) => other !== th && other.removeAttribute('aria-sort'));
      th.setAttribute('aria-sort', order);

      const rows = [...tbody.rows];
      const k = root.getBoundingClientRect().width / root.offsetWidth || 1;
      const before = new Map(rows.map((row) => [row, row.getBoundingClientRect().top]));
      rows.sort((a, b) => {
        const x = value(a, index);
        const y = value(b, index);
        const result = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
        return order === 'ascending' ? result : -result;
      });
      tbody.append(...rows);
      mark(index);
      if (reduceMotion) return;
      rows.forEach((row, i) => {
        const dy = (before.get(row) - row.getBoundingClientRect().top) / k;
        if (dy) row.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 620, delay: Math.min(i, 8) * 18, easing: ease, fill: 'backwards' });
      });
    };

    headers.forEach((th) => th.querySelector('.kodza-table__sort')?.addEventListener('click', () => sort(th), { signal }));
    const sorted = headers.find((th) => th.hasAttribute('aria-sort'));
    if (sorted) mark(headers.indexOf(sorted));

    // The edges fade while there is more to see sideways
    const edges = () => {
      const more = root.scrollWidth - root.clientWidth;
      root.style.setProperty('--kz-table-fade-l', root.scrollLeft > 2 ? '32px' : '0px');
      root.style.setProperty('--kz-table-fade-r', more - root.scrollLeft > 2 ? '32px' : '0px');
    };
    edges();
    root.addEventListener('scroll', edges, { passive: true, signal });
    const observer = new ResizeObserver(edges);
    observer.observe(root);
    signal.addEventListener('abort', () => observer.disconnect());
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
