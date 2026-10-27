// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Burger Button
// Flips aria-expanded on click (the CSS does the rest), says so with a kodza:burger event, and
// puts is-open on the menu named by data-target. Escape closes it again. It also rolls the label,
// both ways: the old word goes up, the new one comes up from below.
(() => {
  const SELECTOR = '.kodza-burger';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const words = [...root.querySelectorAll('.kodza-burger__word')];
    const isOpen = () => root.getAttribute('aria-expanded') === 'true';
    const rolls = new Map();
    let shown = isOpen();
    const target = () => {
      try {
        return root.dataset.target ? document.querySelector(root.dataset.target) : null;
      } catch {
        return null;
      }
    };

    // The word a screen reader hears is the one on screen
    const sync = () => words.forEach((word, i) => {
      if (i === (isOpen() ? 1 : 0)) word.removeAttribute('aria-hidden');
      else word.setAttribute('aria-hidden', 'true');
    });

    // A click during the roll turns it back from where the words are
    const roll = (open) => {
      if (reduceMotion.matches || words.length < 2) return;
      const style = getComputedStyle(root);
      const raw = style.getPropertyValue('--kz-burger-duration').trim();
      const duration = parseFloat(raw) * (raw.endsWith('ms') ? 1 : 1000) || 500;
      const easing = style.getPropertyValue('--kz-burger-ease').trim();
      words.forEach((word, i) => {
        const coming = i === Number(open);
        const from = rolls.has(word) ? getComputedStyle(word).translate : coming ? '0 115%' : '0 0';
        rolls.get(word)?.cancel();
        const frames = { translate: [from, coming ? '0 0' : '0 -115%'] };
        let run;
        try {
          run = word.animate(frames, { duration, easing });
        } catch {
          run = word.animate(frames, { duration, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
        }
        rolls.set(word, run);
        run.finished.then(() => rolls.get(word) === run && rolls.delete(word), () => {});
      });
    };

    const set = (open) => {
      root.setAttribute('aria-expanded', String(open));
      target()?.classList.toggle('is-open', open);
      root.dispatchEvent(new CustomEvent('kodza:burger', { bubbles: true, detail: { open } }));
    };

    root.addEventListener('click', () => set(!isOpen()), { signal });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || event.defaultPrevented || !isOpen()) return;
      const menu = target();
      const inside = menu?.contains(document.activeElement);
      set(false);
      if (inside) root.focus();
    }, { signal });

    // Another script flips aria-expanded (a theme closing its own menu): the words follow
    const observer = new MutationObserver(() => {
      if (isOpen() !== shown) roll((shown = isOpen()));
      sync();
    });
    observer.observe(root, { attributes: true, attributeFilter: ['aria-expanded'] });
    sync();
    signal.addEventListener('abort', () => {
      observer.disconnect();
      rolls.forEach((run) => run.cancel());
      target()?.classList.remove('is-open');
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
