// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Scroll Reveal
// Arms every .kodza-reveal (hidden state), then plays its entrance when it scrolls into view.
// Blocks entering together get a turn each, row by row and left to right in a row; a block beside
// one that enters (a label beside its title) comes with it; a block entering alone starts at once. Mask blocks are cut into lines at their current width, inline
// tags kept (em, strong, a…), and given back their markup as written once in, so a later resize
// reflows them normally. Once played, a block keeps nothing from its entrance: its own opacity,
// transform and transitions are back (a hover on a card still eases).
(() => {
  const SELECTOR = '.kodza-reveal';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const blocks = new WeakMap(); // block → { html (mask blocks: their markup as written), timer }
  const waiting = new Set(); // armed blocks not in yet (repeat blocks aside)

  // A time read from a variable, "0.9s" or "900ms", in ms
  const time = (el, name, fallback) => {
    const value = getComputedStyle(el).getPropertyValue(name).trim();
    const n = parseFloat(value);
    if (Number.isNaN(n)) return fallback;
    return value.endsWith('ms') ? n : n * 1000;
  };

  // Only text and inline tags can be cut into lines
  const inline = (el) => [...el.querySelectorAll('*')].every((child) => child.localName === 'br' || getComputedStyle(child).display === 'inline');

  // Cut a text block into lines, each in its own window. Every word is marked and placed on its
  // line, then each line gets a copy of its stretch of markup, the inline tags around it included
  const split = (el, html) => {
    el.innerHTML = html;
    const texts = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) texts.push(walker.currentNode);
    const words = [];
    texts.forEach((node) => {
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part.trim()) return part && node.before(part);
        const word = document.createElement('span');
        word.className = 'kodza-reveal__word';
        word.textContent = part;
        node.before(word);
        words.push(word);
      });
      node.remove();
    });
    // Same line: the middles line up (words in another font or size sit a few px off)
    const lines = [];
    words.forEach((word) => {
      const box = word.getBoundingClientRect();
      const middle = box.top + box.height / 2;
      const last = lines[lines.length - 1];
      if (last && Math.abs(middle - last.middle) < box.height / 2) last.words.push(word);
      else lines.push({ middle, words: [word] });
    });
    const range = document.createRange();
    const copies = lines.map(({ words: [first, ...rest] }) => {
      range.setStartBefore(first);
      range.setEndAfter(rest[rest.length - 1] || first);
      const copy = range.cloneContents();
      copy.querySelectorAll('.kodza-reveal__word').forEach((word) => word.replaceWith(word.textContent));
      copy.querySelectorAll('[id]').forEach((tag) => tag.removeAttribute('id')); // a tag cut over two lines would show its id twice
      return copy;
    });
    el.textContent = '';
    copies.forEach((copy, i) => {
      const outer = document.createElement('span');
      const inner = document.createElement('span');
      outer.className = 'kodza-reveal__line';
      inner.style.setProperty('--kz-line', i);
      inner.append(copy);
      outer.append(inner);
      el.append(outer, ' ');
    });
  };

  // The entrance is over: the block keeps nothing of it (a repeat block stays armed for the next time)
  const settle = (el) => {
    el.classList.remove('is-playing');
    el.style.removeProperty('--i');
    if (!el.getAttribute('style')) el.removeAttribute('style');
    if (el.classList.contains('kodza-reveal--repeat')) return;
    el.classList.remove('is-armed');
    const { html } = blocks.get(el);
    if (html !== null) el.innerHTML = html;
  };

  const reveal = (el, i, instant) => {
    const block = blocks.get(el);
    clearTimeout(block.timer);
    el.classList.add('is-in');
    waiting.delete(el);
    if (!el.classList.contains('kodza-reveal--repeat')) observer.unobserve(el);
    // Scrolled past it (or loaded below it): it is simply there
    if (instant) return settle(el);
    el.style.setProperty('--i', i);
    el.classList.add('is-playing');
    const duration = time(el, '--kz-reveal-duration', 900);
    const stagger = time(el, '--kz-reveal-stagger', 90);
    const lines = el.querySelectorAll('.kodza-reveal__line').length;
    // The longest part of each entrance: the image of a clip settles in 1.9 durations, mask lines rise in 1.1
    const length = el.classList.contains('kodza-reveal--clip') ? 1.9 : lines ? 1.1 : 1;
    block.timer = setTimeout(() => settle(el), duration * length + stagger * (i + lines) + 100);
  };

  // A repeat block back below the screen: hidden again, at once
  const hide = (el) => {
    clearTimeout(blocks.get(el).timer);
    el.classList.remove('is-in', 'is-playing');
  };

  // One observer for every block, so the blocks entering together take turns
  let observer = null;

  // The blocks of one arrival, in turn order: row by row, left to right in a row. A row is the
  // blocks starting beside the first one's height (a label on the baseline of its title, a card
  // standing higher than its neighbours)
  const order = (items) => {
    items.sort((a, b) => a.box.top - b.box.top || a.box.left - b.box.left);
    const rows = [];
    items.forEach((item) => {
      const row = rows[rows.length - 1];
      if (row && item.box.top < row.bottom) row.items.push(item);
      else rows.push({ bottom: item.box.bottom, items: [item] });
    });
    return rows.flatMap((row) => row.items.sort((a, b) => a.box.left - b.box.left || a.box.top - b.box.top));
  };

  const watch = (entries) => {
    const arriving = [];
    entries.forEach((entry) => {
      const el = entry.target;
      if (entry.isIntersecting) {
        if (!el.classList.contains('is-in')) arriving.push({ el, box: entry.boundingClientRect });
      } else if (entry.boundingClientRect.top < 0) {
        if (!el.classList.contains('is-in')) reveal(el, 0, true);
      } else if (el.classList.contains('kodza-reveal--repeat')) {
        hide(el);
      }
    });
    // A block beside an arriving one, its top already on screen, comes with it: side by side
    // blocks enter as a row (a repeat block keeps its own crossing, to hide again on its own)
    if (arriving.length) {
      waiting.forEach((el) => {
        if (arriving.some((item) => item.el === el)) return;
        const box = el.getBoundingClientRect();
        if (!box.height || box.top >= innerHeight) return;
        if (arriving.some((item) => box.top < item.box.bottom && box.bottom > item.box.top)) arriving.push({ el, box });
      });
    }
    order(arriving).forEach(({ el }, i) => reveal(el, i, false));
  };

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(el, signal) {
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    const mask = el.classList.contains('kodza-reveal--mask') && inline(el);
    const html = mask ? el.innerHTML : null;
    blocks.set(el, { html, timer: 0 });
    if (mask) {
      split(el, html);
      document.fonts?.ready.then(() => !signal.aborted && !el.classList.contains('is-in') && split(el, html));
      let width = innerWidth;
      window.addEventListener('resize', () => {
        if (innerWidth === width) return;
        width = innerWidth;
        if (!el.classList.contains('is-in')) split(el, html);
      }, { signal });
    }
    el.classList.add('is-armed');
    if (!el.classList.contains('kodza-reveal--repeat')) waiting.add(el);
    observer ||= new IntersectionObserver(watch, { rootMargin: '0px 0px -12% 0px' });
    observer.observe(el);
    signal.addEventListener('abort', () => {
      waiting.delete(el);
      observer.unobserve(el);
      clearTimeout(blocks.get(el).timer);
    });
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
