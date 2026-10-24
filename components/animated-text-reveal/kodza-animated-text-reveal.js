// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Scroll Text Reveal
// Splits each paragraph into words, then gives every word its own progress (--w, 0 to 1)
// from the paragraph's position on screen. Words overlap a little, so the light flows
// instead of jumping from one word to the next. Only paragraphs on screen are updated.
(() => {
  const SELECTOR = '.kodza-scroll-reveal';
  const OVERLAP = 0.3; // how much of the scroll each word takes to light up
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const clamp = (v) => Math.min(1, Math.max(0, v));

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    // Words become spans; the spaces between them stay plain text, so lines wrap as before
    const parts = root.textContent.trim().split(/(\s+)/);
    root.textContent = '';
    const words = [];
    parts.forEach((part) => {
      if (/^\s+$/.test(part)) return root.append(part);
      const word = document.createElement('span');
      word.className = 'kodza-scroll-reveal__word';
      word.textContent = part;
      root.append(word);
      words.push(word);
    });
    if (reduceMotion) return;
    words.forEach((word) => word.style.setProperty('--w', 0));

    let visible = false;
    let ticking = false;
    const update = () => {
      ticking = false;
      if (!visible) return;
      const vh = window.innerHeight;
      const rect = root.getBoundingClientRect();
      // 0 when the top of the paragraph reaches 85% of the screen, 1 when its bottom passes 45%
      const progress = clamp((vh * 0.85 - rect.top) / (rect.height + vh * 0.4));
      words.forEach((word, i) => {
        const start = (i / words.length) * (1 - OVERLAP);
        word.style.setProperty('--w', clamp((progress - start) / OVERLAP).toFixed(3));
      });
    };
    const request = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      request();
    });
    observer.observe(root);
    signal.addEventListener('abort', () => observer.disconnect());
    window.addEventListener('scroll', request, { passive: true, signal });
    window.addEventListener('resize', request, { signal });
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
