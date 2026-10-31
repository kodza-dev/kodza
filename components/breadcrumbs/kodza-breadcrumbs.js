// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Breadcrumbs
// Folds the middle of the trail behind a "…" button when it would wrap onto a second line
// (or always, with --collapse), and unfolds it on click: the hidden crumbs slide in while the
// others glide to their new place. The first crumb and the last two stay. root.kodzaFold()
// folds it back (after a client-side navigation, or to replay): the crumbs leave in reverse
// order, then the trail closes up around the "…".
(() => {
  const SELECTOR = '.kodza-breadcrumbs';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const list = root.querySelector('.kodza-breadcrumbs__list');
    const items = list ? [...list.children] : [];
    root.classList.add('is-ready');
    if (items.length < 4) return;

    const folded = items.slice(1, -2);
    folded.forEach((item, i) => {
      item.classList.add('kodza-breadcrumbs__folded');
      item.style.setProperty('--i', i);
    });

    const more = document.createElement('li');
    const button = document.createElement('button');
    more.className = 'kodza-breadcrumbs__item kodza-breadcrumbs__more';
    button.type = 'button';
    button.textContent = '…';
    button.setAttribute('aria-label', `Show ${folded.length} hidden levels`);
    more.append(button);
    items[0].after(more);

    let unfolded = false;
    const fold = (on) => root.classList.toggle('is-collapsed', on);
    // One line high, or wrapping?
    const fits = () => {
      fold(false);
      return list.offsetHeight <= items[0].offsetHeight * 1.5;
    };
    const update = () => {
      if (!unfolded) fold(root.classList.contains('kodza-breadcrumbs--collapse') || !fits());
    };

    // The crumbs that stay on screen glide to their new place (measured before and after)
    const stay = items.filter((item) => !folded.includes(item));
    const measure = () => new Map(stay.map((item) => [item, item.getBoundingClientRect()]));
    const glide = (before) => {
      if (reduceMotion) return;
      // Screen pixels back to the trail's own (a parent may be scaled with a transform)
      const k = root.getBoundingClientRect().width / root.offsetWidth || 1;
      stay.forEach((item) => {
        const from = before.get(item);
        const to = item.getBoundingClientRect();
        const dx = (from.left - to.left) / k;
        const dy = (from.top - to.top) / k;
        if (dx || dy) item.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 550, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      });
    };

    button.addEventListener('click', () => {
      // From the keyboard, the focus moves on to the first unfolded crumb
      const fromKeyboard = button.matches(':focus-visible');
      const before = measure();
      unfolded = true;
      root.classList.add('is-unfolding');
      fold(false);
      glide(before);
      if (fromKeyboard) folded[0].querySelector('a, [aria-current]')?.focus({ preventScroll: true });
    }, { signal });

    // Folding back: the hidden crumbs leave in reverse order, then the trail closes up and the
    // "…" comes back where they were
    let leaving = [];
    root.kodzaFold = () => {
      if (!unfolded || leaving.length) return;
      if (!root.classList.contains('kodza-breadcrumbs--collapse') && fits()) return; // it fits now: nothing to fold
      const close = () => {
        leaving.forEach((animation) => animation.cancel());
        leaving = [];
        if (signal.aborted) return;
        if (folded.some((item) => item.contains(document.activeElement))) button.focus({ preventScroll: true });
        const before = measure();
        unfolded = false;
        root.classList.remove('is-unfolding');
        update();
        glide(before);
        if (!reduceMotion) more.animate([{ opacity: 0, transform: 'translateX(-8px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      };
      if (reduceMotion) return close();
      leaving = folded.map((item, i) => item.animate(
        [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-12px)' }],
        { duration: 320, delay: (folded.length - 1 - i) * 60, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' }
      ));
      Promise.all(leaving.map((animation) => animation.finished)).then(close, () => {});
    };
    signal.addEventListener('abort', () => {
      leaving.forEach((animation) => animation.cancel());
      delete root.kodzaFold;
    });

    const observer = new ResizeObserver(update);
    observer.observe(root);
    signal.addEventListener('abort', () => observer.disconnect());
    document.fonts?.ready.then(() => !signal.aborted && update());
    update();
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
