// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Loading Button
// Rolls the words from one state to the next (idle, loading, done, and back to idle from
// below), keeps aria-busy and a spoken status in step. A click starts loading and sends
// "kodza:loading"; call el.kodzaLoading.done() when the work is over (it rests 1.8s on the
// third words), or el.kodzaLoading.reset().
(() => {
  const SELECTOR = '.kodza-loading-button';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const STATES = ['idle', 'loading', 'done'];

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(button, signal) {
    const words = [...button.querySelectorAll('.kodza-loading-button__label > span')];
    if (words.length < 3) return;
    const sr = Object.assign(document.createElement('span'), { className: 'kodza-loading-button__sr' });
    sr.setAttribute('aria-live', 'polite');
    button.append(sr);
    let index = 0;
    let rest = 0;

    // The new words come up from below, the old ones leave through the top
    const roll = (next) => {
      const old = words[index];
      const now = words[next];
      index = next;
      words.forEach((word) => word.getAnimations().forEach((a) => a.cancel()));
      words.forEach((word, i) => (word.style.transform = i === next ? 'none' : 'translateY(110%)'));
      if (reduceMotion) return;
      const timing = { duration: 520, easing: ease };
      old.animate([{ transform: 'none' }, { transform: 'translateY(-110%)' }], timing);
      now.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], timing);
    };

    const set = (state) => {
      const next = STATES.indexOf(state);
      if (next === index) return;
      roll(next);
      button.dataset.state = state;
      button.toggleAttribute('aria-busy', state === 'loading');
      if (state === 'loading') button.setAttribute('aria-busy', 'true');
      sr.textContent = state === 'idle' ? '' : words[next].textContent;
    };

    const done = () => {
      if (button.dataset.state !== 'loading') return;
      set('done');
      clearTimeout(rest);
      rest = setTimeout(() => set('idle'), 1800);
    };
    const reset = () => {
      clearTimeout(rest);
      set('idle');
    };

    button.addEventListener('click', () => {
      if (button.dataset.state && button.dataset.state !== 'idle') return;
      set('loading');
      button.dispatchEvent(new CustomEvent('kodza:loading', { bubbles: true }));
    }, { signal });

    button.kodzaLoading = { done, reset };
    button.dataset.state = 'idle';
    signal.addEventListener('abort', () => {
      clearTimeout(rest);
      delete button.kodzaLoading;
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
    // Rendered by React (data-kodza-manual): React starts it, with an init aimed at that markup once
    // it has hydrated it. Any earlier start would change markup React has not taken over yet
    const owner = root.closest('[data-kodza-manual]');
    if (owner && !(scope && owner.contains(scope))) return;
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
