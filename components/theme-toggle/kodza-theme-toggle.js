// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Theme Toggle
// Switches the page between light and dark. The theme is written where the site reads it, on <html>
// by default as data-theme="dark" or "light". It starts from the visitor's saved choice, else from
// what the page already says, else from the system setting, which it keeps following until the
// visitor makes a choice. Every toggle on the page stays in step, other tabs too. Images with a night
// version (data-dark-src) get it laid over the day one, loaded the first time the page goes dark.
// Settings, on the button: data-target (the element that carries the theme: by default the nearest
// one around the button that already has the attribute, else <html>), data-attribute (the attribute
// written, "data-theme" by default) or data-class (a class added in the dark, such as "dark",
// instead of the attribute), data-storage (the localStorage key, "kodza-theme" by default; empty,
// nothing is saved). A toggle that themes one part of the page (a section with its own data-theme)
// saves nothing unless data-storage says where, and keeps its theme when the system changes.
//
// Against a white flash on load, put this line in a script tag at the top of <head>, before the
// stylesheets (same key and attribute as the button):
// try{var t=localStorage.getItem('kodza-theme');document.documentElement.setAttribute('data-theme',t==='dark'||t==='light'?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){}
(() => {
  const SELECTOR = '[data-kodza-theme-toggle]';
  const TARGET = 'html'; // the element that carries the theme, when none around the button has it
  const ATTRIBUTE = 'data-theme'; // written "dark" or "light" on it
  const STORAGE = 'kodza-theme'; // where the visitor's choice is kept
  const NIGHT = 'img[data-dark-src]'; // images that have a night version
  // Shared by every toggle of the page, whichever copy of this script started it
  const PAIRED = Symbol.for('kodza theme-toggle pair'); // on an image already given its night twin
  const CHOSEN = Symbol.for('kodza theme-toggle chosen'); // on a target whose theme the visitor picked
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const valid = (theme) => (theme === 'dark' || theme === 'light' ? theme : null);

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const name = root.dataset.class;
    const attribute = root.dataset.attribute || ATTRIBUTE;
    const selector = root.dataset.target || (name ? TARGET : `[${attribute}]`);
    const target = root.closest(selector) || document.querySelector(root.dataset.target || TARGET) || document.documentElement;
    const page = target === document.documentElement;
    const key = root.hasAttribute('data-storage') ? root.dataset.storage : page ? STORAGE : '';
    const pairs = new Set(); // the pairs this toggle made, taken apart on destroy
    let live = false; // after the start, a change of theme is seen happening

    const stored = () => {
      if (!key) return null;
      try { return valid(localStorage.getItem(key)); } catch { return null; }
    };
    const store = (theme) => {
      if (!key) return;
      try { localStorage.setItem(key, theme); } catch { /* private mode: the choice lasts the page */ }
    };
    const given = () => (name ? (target.classList.contains(name) ? 'dark' : null) : valid(target.getAttribute(attribute)));
    const read = () => given() || 'light';
    const preferred = () => (system.matches ? 'dark' : 'light');

    // Each night image goes in a pair with its day one, the night twin a clone that keeps its
    // classes and size, so it lands exactly on top
    const pairUp = () => target.querySelectorAll(NIGHT).forEach((img) => {
      if (img[PAIRED] || img.classList.contains('kodza-theme-toggle-night')) return;
      const pair = document.createElement('span');
      pair.className = 'kodza-theme-toggle-pair';
      if (getComputedStyle(img).display === 'block') pair.classList.add('kodza-theme-toggle-pair--block');
      const night = img.cloneNode(false);
      ['id', 'src', 'srcset', 'sizes', 'loading', 'fetchpriority', 'data-dark-src'].forEach((attr) => night.removeAttribute(attr));
      night.alt = '';
      night.setAttribute('aria-hidden', 'true');
      night.classList.add('kodza-theme-toggle-night');
      img.replaceWith(pair);
      pair.append(img, night);
      img[PAIRED] = pair;
      pairs.add(pair);
    });

    // The night twins light up once their image is decoded, never as an empty box
    const shade = (dark) => target.querySelectorAll('.kodza-theme-toggle-pair').forEach((pair) => {
      const [img, night] = pair.children;
      if (!night) return;
      if (live) pair.classList.add('is-ready');
      if (!dark) return pair.classList.remove('is-night');
      if (!night.getAttribute('src')) night.src = img.dataset.darkSrc;
      night.decode().catch(() => {}).then(() => {
        if (!signal.aborted && read() === 'dark') pair.classList.add('is-night');
      });
    });

    const sync = () => {
      const theme = read();
      root.setAttribute('aria-pressed', String(theme === 'dark'));
      pairUp();
      shade(theme === 'dark');
    };
    const apply = (theme) => {
      if (given() !== theme) {
        if (name) target.classList.toggle(name, theme === 'dark');
        else target.setAttribute(attribute, theme);
      }
      sync();
    };

    // The visitor's choice first, then what the page says (the line in <head> wrote it), then the system
    const follows = page || !given(); // a part of the page with its own theme keeps it
    apply(stored() || given() || preferred());
    live = true;

    // Whoever changes the theme (another toggle, the site's own script), this button follows
    const observer = new MutationObserver(sync);
    observer.observe(target, { attributes: true, attributeFilter: [name ? 'class' : attribute] });

    root.addEventListener('click', () => {
      const theme = read() === 'dark' ? 'light' : 'dark';
      target[CHOSEN] = true;
      store(theme);
      apply(theme);
      root.dispatchEvent(new CustomEvent('kodza:theme-toggle', { bubbles: true, detail: { theme } }));
    }, { signal });

    system.addEventListener('change', () => {
      if (follows && !target[CHOSEN] && !stored()) apply(preferred());
    }, { signal });

    // Chosen in another tab
    window.addEventListener('storage', (event) => {
      if (key && event.key === key) apply(valid(event.newValue) || preferred());
    }, { signal });

    signal.addEventListener('abort', () => {
      observer.disconnect();
      pairs.forEach((pair) => {
        const img = pair.firstElementChild;
        delete img[PAIRED];
        pair.replaceWith(img);
      });
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
