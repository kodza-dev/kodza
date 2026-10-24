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
