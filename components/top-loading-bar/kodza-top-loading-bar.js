// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Top Loading Bar
// start() jumps to 8% and creeps towards 90% in shrinking steps; done() runs to 100% and
// slips the line off to the right; set(p) goes to a given point. With data-links, a click on a
// link to another page of the same site starts it (and the back button resets it).
(() => {
  const SELECTOR = '.kodza-loading-bar';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    let p = 0;
    let running = false;
    let timer = 0;

    const paint = (value) => {
      p = Math.min(1, Math.max(0, value));
      root.style.setProperty('--kz-loadbar-p', p);
      root.setAttribute('aria-valuenow', Math.round(p * 100));
    };

    // Shrinking steps: a third of what is left, then less and less
    const creep = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!running) return;
        paint(p + (0.9 - p) * (0.12 + Math.random() * 0.22));
        creep();
      }, 280 + Math.random() * 420);
    };

    const start = () => {
      clearTimeout(timer);
      root.classList.remove('is-done', 'is-leaving');
      root.classList.add('is-idle');
      paint(0);
      void root.offsetWidth;
      root.classList.remove('is-idle');
      root.setAttribute('aria-busy', 'true');
      running = true;
      paint(0.08);
      creep();
    };

    const done = () => {
      if (!running) return;
      running = false;
      clearTimeout(timer);
      root.removeAttribute('aria-busy');
      root.classList.add('is-done');
      paint(1);
      timer = setTimeout(() => {
        root.classList.add('is-leaving');
        timer = setTimeout(() => {
          root.classList.add('is-idle');
          root.classList.remove('is-done', 'is-leaving');
          paint(0);
        }, reduceMotion ? 0 : 560);
      }, reduceMotion ? 200 : 320);
    };

    root.kodzaLoadingBar = { start, done, set: (value) => (running ? paint(value) : (start(), paint(value))) };
    // Stopped mid-load: the creeping and the exit stop with it
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      running = false;
      delete root.kodzaLoadingBar;
    });
    root.classList.add('is-idle');
    paint(0);

    if (root.hasAttribute('data-links')) {
      document.addEventListener('click', (event) => {
        const link = event.target.closest?.('a[href]');
        if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (link.target && link.target !== '_self') return;
        if (link.hasAttribute('download')) return;
        const url = new URL(link.href, location.href);
        // Another page of this site (a #section of the same page loads nothing)
        if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
        start();
      }, { signal });
      window.addEventListener('pageshow', (event) => event.persisted && done(), { signal });
    }
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
