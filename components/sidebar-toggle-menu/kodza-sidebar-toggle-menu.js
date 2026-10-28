// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Sidebar Menu
// Opens the panel as a modal dialog and plays the slide, closes it with the animation
// (close button, Escape, a click on the page) and gives the focus back to the menu button.
// The page behind does not scroll while the panel is open.
(() => {
  const SELECTOR = '.kodza-sidebar';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The page behind stays put while it is open: a wheel or a swipe only scrolls what can
  // scroll inside, under the pointer. Listening only while open costs nothing the rest of the time.
  const holdPage = (layer, signal) => {
    const inside = (target, x, y, dy) => {
      for (let el = target; el instanceof Element && layer.contains(el); el = el.parentElement) {
        const box = el.getBoundingClientRect();
        if (x < box.left || x > box.right || y < box.top || y > box.bottom) continue;
        if (!/(auto|scroll)/.test(getComputedStyle(el).overflowY) || el.scrollHeight <= el.clientHeight + 1) continue;
        if (dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return true;
      }
      return false;
    };
    let last = 0;
    const wheel = (event) => !inside(event.target, event.clientX, event.clientY, event.deltaY) && event.preventDefault();
    const touchstart = (event) => (last = event.touches[0].clientY);
    const touchmove = (event) => {
      const touch = event.touches[0];
      const dy = last - touch.clientY;
      last = touch.clientY;
      if (!inside(event.target, touch.clientX, touch.clientY, dy)) event.preventDefault();
    };
    const hold = (on) => {
      const method = on ? 'addEventListener' : 'removeEventListener';
      document[method]('wheel', wheel, { passive: false });
      document[method]('touchstart', touchstart, { passive: true });
      document[method]('touchmove', touchmove, { passive: false });
    };
    const observer = new MutationObserver(() => hold(layer.open));
    observer.observe(layer, { attributes: true, attributeFilter: ['open'] });
    // Stopped while open: the page is let go
    signal.addEventListener('abort', () => {
      observer.disconnect();
      hold(false);
    });
  };


  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const toggle = root.querySelector('.kodza-sidebar__toggle');
    const panel = root.querySelector('.kodza-sidebar__panel');
    holdPage(panel, signal);
    if (!toggle || !panel) return;
    const close = panel.querySelector('.kodza-sidebar__close');
    panel.querySelectorAll('.kodza-sidebar__link').forEach((link, i) => {
      link.querySelectorAll('.kodza-sidebar__index, .kodza-sidebar__text').forEach((part) => part.style.setProperty('--i', i));
    });
    const duration = reduceMotion ? 0 : parseFloat(getComputedStyle(root).getPropertyValue('--kz-sidebar-duration')) * 1000 || 700;
    let timer = 0;

    const open = () => {
      clearTimeout(timer);
      if (!panel.open) {
        panel.showModal();
      }
      requestAnimationFrame(() => panel.classList.add('is-open'));
      toggle.setAttribute('aria-expanded', 'true');
    };

    const shut = () => {
      if (!panel.open || !panel.classList.contains('is-open')) return;
      panel.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      clearTimeout(timer);
      timer = setTimeout(() => {
        panel.close();
        toggle.focus({ preventScroll: true });
      }, duration);
    };

    toggle.addEventListener('click', open, { signal });
    close?.addEventListener('click', shut, { signal });
    panel.addEventListener('cancel', (event) => {
      event.preventDefault();
      shut();
    }, { signal });
    // A click on the dimmed page (the backdrop) lands on the dialog, outside its box
    panel.addEventListener('click', (event) => {
      if (event.target === panel && event.clientX < panel.getBoundingClientRect().left) shut();
    }, { signal });

    // Stopped while open (or closing): the dialog closes and the page scrolls again
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      if (!panel.open) return;
      panel.close();
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
