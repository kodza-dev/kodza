// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Kbd
// Shows Mod as ⌘ on a Mac and Ctrl elsewhere, sinks the keys the user is really pressing, and
// lights up a shortcut line when its whole combo is down. It only watches: nothing is
// prevented, the page keeps its own shortcuts.
(() => {
  const SELECTOR = '.kodza-kbd';
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  // What a key event means for data-key ("Mod" is Command on a Mac, Control elsewhere)
  const name = (event) => {
    if (event.key === (mac ? 'Meta' : 'Control')) return 'mod';
    return (event.key || '').toLowerCase();
  };
  // The keys running on the page share one watch on the keyboard, on while there is at least one
  const keys = new Set();
  const down = new Set();
  let watch = null;
  const paint = () => {
    const all = [...keys].filter((key) => key.dataset.key);
    all.forEach((key) => key.classList.toggle('is-pressed', down.has(key.dataset.key.toLowerCase())));
    new Set(all.map((key) => key.closest('.kodza-kbd-combo'))).forEach((combo) => {
      if (!combo) return;
      const parts = [...combo.querySelectorAll('.kodza-kbd[data-key]')];
      const hit = parts.length && parts.every((key) => down.has(key.dataset.key.toLowerCase()));
      const line = combo.closest('.kodza-kbd-list > li');
      if (hit && line) {
        line.classList.add('is-hit');
        clearTimeout(line.kodzaHit);
        line.kodzaHit = setTimeout(() => line.classList.remove('is-hit'), 650);
      }
    });
  };
  const start = () => {
    watch = new AbortController();
    const { signal } = watch;
    document.addEventListener('keydown', (event) => {
      down.add(name(event));
      if (event.metaKey && mac) down.add('mod');
      if (event.ctrlKey && !mac) down.add('mod');
      paint();
    }, { signal });
    document.addEventListener('keyup', (event) => {
      // On a Mac, letters held with ⌘ never send their keyup: letting ⌘ go lets them all go
      if (name(event) === 'mod') down.clear();
      else down.delete(name(event));
      paint();
    }, { signal });
    window.addEventListener('blur', () => {
      down.clear();
      paint();
    }, { signal });
  };

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(key, signal) {
    if (key.dataset.key === 'Mod') {
      key.textContent = mac ? '⌘' : 'Ctrl';
      key.setAttribute('aria-label', mac ? 'Command' : 'Control');
    }
    keys.add(key);
    if (!watch) start();
    // The last key gone, the watch stops
    signal.addEventListener('abort', () => {
      keys.delete(key);
      if (keys.size) return;
      watch.abort();
      watch = null;
      down.clear();
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
