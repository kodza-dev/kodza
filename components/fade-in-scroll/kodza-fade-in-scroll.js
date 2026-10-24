// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Scroll Reveal
// Arms every .kodza-reveal (hidden state), then plays its entrance when it scrolls into view.
// Blocks entering together get a turn each (by position, top to bottom, left to right); a block
// entering alone starts at once. Mask blocks are cut into lines at their current width, and
// given back their original text once in, so a later resize reflows them normally.
(() => {
  const SELECTOR = '.kodza-reveal';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const blocks = new WeakMap(); // block → { text (mask blocks: their plain text), signal }

  // Cut a text block into lines, each in its own window (plain text only)
  const split = (el, text) => {
    el.textContent = '';
    const spans = text.split(/\s+/).map((word) => {
      const span = document.createElement('span');
      span.textContent = `${word} `;
      el.append(span);
      return span;
    });
    const lines = [];
    spans.forEach((span) => {
      const last = lines[lines.length - 1];
      if (last && Math.abs(last.top - span.offsetTop) < 2) last.words.push(span.textContent);
      else lines.push({ top: span.offsetTop, words: [span.textContent] });
    });
    el.textContent = '';
    lines.forEach((line, i) => {
      const outer = document.createElement('span');
      const inner = document.createElement('span');
      outer.className = 'kodza-reveal__line';
      inner.textContent = line.words.join('').trim();
      inner.style.setProperty('--kz-line', i);
      outer.append(inner);
      el.append(outer, ' ');
    });
  };

  const reveal = (el, i, instant) => {
    el.style.setProperty('--i', i);
    el.classList.toggle('is-instant', instant);
    el.classList.add('is-in');
    if (instant) requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('is-instant')));
    // Once a mask has played, it gets its plain text back
    const { text, signal } = blocks.get(el);
    if (text !== null && !el.classList.contains('kodza-reveal--repeat')) {
      const duration = parseFloat(getComputedStyle(el).getPropertyValue('--kz-reveal-duration')) || 0.9;
      const lines = el.querySelectorAll('.kodza-reveal__line').length;
      const timer = setTimeout(() => (el.textContent = text), instant ? 0 : (duration * 1.1 + 0.09 * (i + lines)) * 1000 + 100);
      signal.addEventListener('abort', () => clearTimeout(timer));
    }
  };

  // One observer for every block, so the blocks entering together take turns
  let observer = null;
  const watch = (entries) => {
    const arriving = [];
    entries.forEach((entry) => {
      const el = entry.target;
      if (entry.isIntersecting) {
        if (!el.classList.contains('is-in')) arriving.push(entry);
      } else if (entry.boundingClientRect.top < 0) {
        // Scrolled past it (or loaded below it): it is simply there
        if (!el.classList.contains('is-in')) reveal(el, 0, true);
      } else if (el.classList.contains('kodza-reveal--repeat')) {
        el.classList.remove('is-in');
      }
    });
    arriving
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
      .forEach((entry, i) => reveal(entry.target, i, false));
    entries.forEach((entry) => {
      if (entry.target.classList.contains('is-in') && !entry.target.classList.contains('kodza-reveal--repeat')) observer.unobserve(entry.target);
    });
  };

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(el, signal) {
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    const mask = el.classList.contains('kodza-reveal--mask') && !el.children.length;
    const text = mask ? el.textContent.trim() : null;
    blocks.set(el, { text, signal });
    if (mask) {
      split(el, text);
      document.fonts?.ready.then(() => !signal.aborted && !el.classList.contains('is-in') && split(el, text));
      let width = innerWidth;
      window.addEventListener('resize', () => {
        if (innerWidth === width) return;
        width = innerWidth;
        if (!el.classList.contains('is-in')) split(el, text);
      }, { signal });
    }
    el.classList.add('is-armed');
    observer ||= new IntersectionObserver(watch, { rootMargin: '0px 0px -12% 0px' });
    observer.observe(el);
    signal.addEventListener('abort', () => observer.unobserve(el));
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
