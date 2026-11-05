// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Direction-Aware Hover
// Reads the side of a tile the pointer comes in by, and the side it leaves by, and writes it on
// the tile (data-edge): the CSS uncovers the caption or the second photo from that edge, then
// folds it away toward the edge the pointer goes out. The keyboard focus opens it from the
// bottom. A finger does nothing here: the caption already sits under the photo.
// Everything else (timing, colours, sizes) is in the --kz-direction-hover-* variables.
(() => {
  const SELECTOR = '.kodza-direction-hover';

  // The edge of the box the pointer is nearest to, in proportion: a wide tile still tells its
  // top from its sides. Measured on the whole link, the words under a product included.
  const edgeOf = (box, event) => {
    const rect = box.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    return Math.abs(x) > Math.abs(y) ? (x < 0 ? 'left' : 'right') : (y < 0 ? 'top' : 'bottom');
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }), so kodza:destroy stops it all.
  function mount(root, signal) {
    const canHover = window.matchMedia('(hover: hover)');
    const links = [...root.querySelectorAll('.kodza-direction-hover__link')].filter((link) => link.closest(SELECTOR) === root);

    links.forEach((link) => {
      const covers = [...link.querySelectorAll('.kodza-direction-hover__caption, .kodza-direction-hover__photo')];
      const open = () => link.classList.add('is-open');
      const close = (edge) => {
        link.dataset.edge = edge; // the open state hides the change: it only says where to fold
        link.classList.remove('is-open');
      };
      // Folds the closed cover on the edge it will open from, with no transition (it is hidden
      // either way). Still on its way out, it is not moved: it turns back from where it is.
      const place = (edge) => {
        if (link.dataset.edge === edge || covers.some((el) => el.getAnimations().length)) return;
        link.classList.add('is-placing');
        link.dataset.edge = edge;
        void link.offsetWidth;
        link.classList.remove('is-placing');
      };
      // A mouse or a pen: a finger taps, and the tap follows the link
      const pointed = (event) => event.pointerType !== 'touch' && canHover.matches;

      link.addEventListener('pointerenter', (event) => {
        if (!pointed(event)) return;
        place(edgeOf(link, event));
        open();
      }, { signal });
      link.addEventListener('pointerleave', (event) => {
        if (!pointed(event) || link.matches(':focus-visible')) return;
        close(edgeOf(link, event));
      }, { signal });
      // From the keyboard only: a click gives the focus too, and the pointer already opened it
      link.addEventListener('focus', () => {
        if (!link.matches(':focus-visible')) return;
        place('bottom');
        open();
      }, { signal });
      link.addEventListener('blur', () => {
        if (!link.matches(':hover')) close('bottom');
      }, { signal });
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
