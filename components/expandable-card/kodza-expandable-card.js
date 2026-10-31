// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Expandable Card
// Keeps exactly one card open per group, and tells screen readers which one it is.
// Each text is cut into lines at the width it will have once its card is open,
// so it can rise line by line and never reflows while the card widens.
(() => {
  const SELECTOR = '.kodza-expand';
  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const cards = [...root.querySelectorAll('.kodza-expand__card')];
    if (!cards.length) return;

    // Plain text only: a paragraph with links or markup keeps its fade
    const texts = new Map();
    root.querySelectorAll('.kodza-expand__panel p').forEach((p) => {
      if (!p.children.length) texts.set(p, p.textContent.trim().split(/\s+/));
    });

    const split = (p, words) => {
      p.textContent = '';
      const spans = words.map((word) => {
        const span = document.createElement('span');
        span.textContent = `${word} `;
        p.append(span);
        return span;
      });
      const lines = [];
      spans.forEach((span) => {
        const last = lines[lines.length - 1];
        if (last && last.top === span.offsetTop) last.words.push(span.textContent);
        else lines.push({ top: span.offsetTop, words: [span.textContent] });
      });
      p.textContent = '';
      lines.forEach((line, i) => {
        const outer = document.createElement('span');
        const inner = document.createElement('span');
        outer.className = 'kodza-expand__line';
        inner.textContent = line.words.join('').trim();
        inner.style.setProperty('--kz-line', i);
        outer.append(inner);
        p.append(outer, ' ');
      });
    };

    // The width of an open card's text: what is left once the closed cards took their share
    let measured = -1;
    const layout = () => {
      const style = getComputedStyle(root);
      const card = getComputedStyle(cards[0]);
      let width = root.clientWidth;
      if (style.flexDirection !== 'column') {
        const grow = parseFloat(style.getPropertyValue('--kz-expand-grow')) || 2.6;
        width = ((width - (parseFloat(style.columnGap) || 0) * (cards.length - 1)) * grow) / (grow + cards.length - 1);
      }
      width = Math.max(0, Math.floor(width - parseFloat(card.paddingLeft) - parseFloat(card.paddingRight)));
      if (width === measured) return;
      measured = width;
      root.style.setProperty('--kz-expand-text', `${width}px`);
      texts.forEach((words, p) => split(p, words));
    };

    const open = (card) => {
      cards.forEach((other) => {
        const isOpen = other === card;
        other.classList.toggle('is-open', isOpen);
        other.querySelector('.kodza-expand__toggle')?.setAttribute('aria-expanded', String(isOpen));
      });
    };

    cards.forEach((card) => card.querySelector('.kodza-expand__toggle')?.addEventListener('click', () => open(card), { signal }));
    open(cards.find((card) => card.classList.contains('is-open')) || cards[0]);
    layout();
    const observer = new ResizeObserver(layout);
    observer.observe(root);
    signal.addEventListener('abort', () => observer.disconnect());
    document.fonts?.ready.then(() => {
      if (signal.aborted) return;
      measured = -1;
      layout();
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
