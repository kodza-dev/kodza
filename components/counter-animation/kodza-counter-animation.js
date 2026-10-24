// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Counter
// Turns the figure into windows of spinning digits (screen readers keep the plain text), then
// rolls them when the counter comes into view: more turns and a later landing for the digits
// on the right. "kodza:replay" on the element rolls it again.
(() => {
  const SELECTOR = '.kodza-counter';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const value = root.querySelector('.kodza-counter__value');
    if (!value) return;
    const text = value.textContent.trim();
    const count = (text.match(/\d/g) || []).length;
    let rank = 0;
    const strips = [];

    value.setAttribute('aria-hidden', 'true');
    value.after(Object.assign(document.createElement('span'), { className: 'kodza-counter__sr', textContent: text }));
    value.replaceChildren(...[...text].map((char) => {
      if (!/\d/.test(char)) return Object.assign(document.createElement('span'), { className: 'kodza-counter__char', textContent: char });
      // The digits on the right spin more: one turn on the left, up to three on the right
      const turns = 1 + Math.round((rank / Math.max(1, count - 1)) * 2);
      const column = Object.assign(document.createElement('span'), { className: 'kodza-counter__digit' });
      const strip = document.createElement('span');
      for (let i = 0; i < (turns + 1) * 10; i++) strip.append(Object.assign(document.createElement('span'), { textContent: i % 10 }));
      column.append(strip);
      strips.push({ strip, stop: turns * 10 + Number(char), rank: rank++ });
      return column;
    }));

    const land = () => strips.forEach(({ strip, stop }) => (strip.style.transform = `translateY(${-stop * 1.1}em)`));
    const roll = () => {
      if (reduceMotion) return land();
      strips.forEach(({ strip, stop, rank: r }) => {
        strip.getAnimations().forEach((animation) => animation.cancel());
        strip.style.transform = '';
        strip.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${-stop * 1.1}em)` }], {
          duration: 1500 + r * 160,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          fill: 'forwards',
        });
      });
    };

    if (reduceMotion || !('IntersectionObserver' in window)) land();
    else {
      const io = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        io.disconnect();
        roll();
      }, { threshold: 0.6 });
      io.observe(root);
      signal.addEventListener('abort', () => io.disconnect());
    }
    root.addEventListener('kodza:replay', roll, { signal });
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
