// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Filter Transitions
// Moves the pill to the chosen filter, then plays the change in two beats: the cards that go
// step back, then the layout changes and every card that stays glides from where it was to
// where it is now (measured before and after), while the new ones come in one by one and the
// grid eases to its new height. A new click finishes the running change first.
// Fires "kodza:filter" with { filter, count } on the component.
(() => {
  const SELECTOR = '.kodza-filter';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const pillsBox = root.querySelector('.kodza-filter__pills');
    const pills = [...root.querySelectorAll('.kodza-filter__pill')];
    const grid = root.querySelector('.kodza-filter__grid');
    const items = [...root.querySelectorAll('.kodza-filter__item')];
    const num = root.querySelector('.kodza-filter__num');
    if (!pillsBox || !pills.length || !grid) return;

    // The white copy of the labels, cut to the pill's shape
    const mirror = document.createElement('span');
    mirror.className = 'kodza-filter__mirror';
    mirror.setAttribute('aria-hidden', 'true');
    mirror.append(...pills.map((pill) => Object.assign(document.createElement('span'), { className: 'kodza-filter__ghost', textContent: pill.textContent })));
    pillsBox.append(mirror);

    const place = (pill) => {
      pillsBox.style.setProperty('--kz-ind-l', `${pill.offsetLeft}px`);
      pillsBox.style.setProperty('--kz-ind-r', `${pillsBox.scrollWidth - pill.offsetLeft - pill.offsetWidth}px`);
    };

    // The count rolls to its new number
    if (num) num.replaceChildren(Object.assign(document.createElement('span'), { textContent: num.textContent.trim() }));
    const roll = (value) => {
      if (!num) return;
      const prev = num.lastElementChild;
      if (prev.textContent === String(value)) return;
      const span = Object.assign(document.createElement('span'), { textContent: value });
      num.append(span);
      if (reduceMotion) return prev.remove();
      const timing = { duration: 450, easing: ease };
      prev.animate([{ transform: 'none' }, { transform: 'translateY(-110%)' }], { ...timing, fill: 'forwards' }).finished.then(() => prev.remove());
      span.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], timing);
    };

    let running = [];
    let outs = [];
    let token = 0;
    const matches = (item, filter) => filter === 'all' || (item.dataset.category || '').split(/\s+/).includes(filter);

    const apply = async (filter) => {
      const id = ++token;
      // A change still running: the cards on their way out come back, the rest lands at once
      outs.forEach((animation) => animation.cancel());
      running.forEach((animation) => animation.finish());
      outs = [];
      running = [];
      const leaving = items.filter((item) => !item.hidden && !matches(item, filter));
      const entering = items.filter((item) => item.hidden && matches(item, filter));
      const staying = items.filter((item) => !item.hidden && matches(item, filter));
      roll(staying.length + entering.length);
      if (reduceMotion) {
        items.forEach((item) => (item.hidden = !matches(item, filter)));
        return;
      }

      // Beat one: the cards that go step back
      if (leaving.length) {
        outs = leaving.map((item) => item.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(0.94)' }], { duration: 220, easing: 'ease-in', fill: 'forwards' }));
        await Promise.all(outs.map((animation) => animation.finished.catch(() => {})));
        if (id !== token) return;
      }

      // Beat two: the layout changes; what stays glides there, what comes arrives, the grid eases
      const before = new Map(staying.map((item) => [item, item.getBoundingClientRect()]));
      const from = grid.offsetHeight;
      leaving.forEach((item) => (item.hidden = true));
      outs.forEach((animation) => animation.cancel());
      outs = [];
      entering.forEach((item) => (item.hidden = false));
      const to = grid.offsetHeight;
      // Screen pixels back to the grid's own (a parent may be scaled with a transform)
      const k = grid.getBoundingClientRect().width / grid.offsetWidth || 1;
      staying.forEach((item) => {
        const a = before.get(item);
        const b = item.getBoundingClientRect();
        if (Math.abs(a.left - b.left) + Math.abs(a.top - b.top) < 1) return;
        running.push(item.animate([{ transform: `translate(${(a.left - b.left) / k}px, ${(a.top - b.top) / k}px)` }, { transform: 'none' }], { duration: 650, easing: ease }));
      });
      entering
        .sort((a, b) => a.offsetTop - b.offsetTop || a.offsetLeft - b.offsetLeft)
        .forEach((item, i) => running.push(item.animate([{ opacity: 0, transform: 'translateY(16px) scale(0.96)' }, { opacity: 1, transform: 'none' }], { duration: 650, delay: 80 + i * 60, easing: ease, fill: 'backwards' })));
      if (from !== to) running.push(grid.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 650, easing: ease }));
    };

    const select = (pill) => {
      pills.forEach((other) => other.setAttribute('aria-pressed', String(other === pill)));
      place(pill);
      const filter = pill.dataset.filter || 'all';
      apply(filter);
      root.dispatchEvent(new CustomEvent('kodza:filter', { detail: { filter, count: items.filter((item) => matches(item, filter)).length }, bubbles: true }));
    };

    pills.forEach((pill) => pill.addEventListener('click', () => pill.getAttribute('aria-pressed') !== 'true' && select(pill), { signal }));
    const current = () => pills.find((pill) => pill.getAttribute('aria-pressed') === 'true') || pills[0];
    const start = current().dataset.filter || 'all';
    items.forEach((item) => (item.hidden = !matches(item, start)));
    roll(items.filter((item) => !item.hidden).length);
    place(current());
    const observer = new ResizeObserver(() => place(current()));
    observer.observe(pillsBox);
    signal.addEventListener('abort', () => observer.disconnect());
    document.fonts?.ready.then(() => place(current()));
    requestAnimationFrame(() => !signal.aborted && root.classList.add('is-live'));
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
