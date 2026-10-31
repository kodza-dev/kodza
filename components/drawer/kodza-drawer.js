// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Sheet
// Opens the panel as a modal dialog and slides it in; closes it with the slide (close button,
// Escape, a click on the page) and gives the focus back. On phones, the sheet can be dragged by
// its grip or its header: it rests at the half or full stop nearest to where it is let go, and
// a quick flick down (or a drag below the half stop) closes it.
(() => {
  const SELECTOR = '.kodza-sheet';
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

  const phone = window.matchMedia('(max-width: 640px)');
  let uid = 0;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const trigger = root.querySelector('.kodza-sheet__trigger');
    const panel = root.querySelector('.kodza-sheet__panel');
    holdPage(panel, signal);
    if (!trigger || !panel) return;
    const title = panel.querySelector('.kodza-sheet__title');
    if (title) {
      title.id = title.id || `kodza-sheet-${++uid}`;
      panel.setAttribute('aria-labelledby', title.id);
    }
    trigger.setAttribute('aria-haspopup', 'dialog');
    // The cascade order
    [panel.querySelector('.kodza-sheet__head'), ...panel.querySelectorAll('.kodza-sheet__item'), panel.querySelector('.kodza-sheet__foot')]
      .filter(Boolean)
      .forEach((el, i) => el.style.setProperty('--i', i));
    const duration = reduceMotion ? 0 : parseFloat(getComputedStyle(root).getPropertyValue('--kz-sheet-duration')) * 1000 || 550;
    let timer = 0;

    // The half stop: how far down the sheet rests when half open, in pixels
    const halfStop = () => Math.round(panel.offsetHeight * 0.45);
    const setY = (y) => panel.style.setProperty('--kz-sheet-y', `${Math.max(0, y)}px`);

    const open = () => {
      clearTimeout(timer);
      if (!panel.open) {
        panel.showModal();
      }
      setY(phone.matches ? halfStop() : 0);
      panel.classList.add('is-moving');
      requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add('is-open')));
      trigger.setAttribute('aria-expanded', 'true');
    };

    const close = () => {
      if (!panel.open || !panel.classList.contains('is-open')) return;
      panel.classList.add('is-moving');
      panel.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      clearTimeout(timer);
      timer = setTimeout(() => {
        panel.close();
        panel.classList.remove('is-moving');
        trigger.focus({ preventScroll: true });
      }, duration);
    };

    trigger.addEventListener('click', open, { signal });
    panel.querySelector('.kodza-sheet__close')?.addEventListener('click', close, { signal });
    panel.addEventListener('cancel', (event) => {
      event.preventDefault();
      close();
    }, { signal });
    panel.addEventListener('click', (event) => {
      if (event.target !== panel) return;
      const box = panel.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close();
    }, { signal });

    // Dragging the sheet on phones
    let start = null;
    const handles = [panel.querySelector('.kodza-sheet__grip'), panel.querySelector('.kodza-sheet__head')].filter(Boolean);
    handles.forEach((handle) => {
      handle.addEventListener('pointerdown', (event) => {
        if (!phone.matches || event.target.closest('button')) return;
        const y = parseFloat(getComputedStyle(panel).getPropertyValue('--kz-sheet-y')) || 0;
        start = { pointer: event.clientY, y, time: performance.now(), last: event.clientY };
        handle.setPointerCapture(event.pointerId);
        panel.classList.remove('is-moving');
      }, { signal });
      handle.addEventListener('pointermove', (event) => {
        if (!start) return;
        const dy = event.clientY - start.pointer;
        // Above the full stop, it resists like a rubber band
        const y = start.y + dy;
        setY(y < 0 ? y / 4 : y);
        start.velocity = (event.clientY - start.last) / Math.max(1, performance.now() - start.time);
        start.last = event.clientY;
        start.time = performance.now();
      }, { signal });
      const release = () => {
        if (!start) return;
        const y = parseFloat(getComputedStyle(panel).getPropertyValue('--kz-sheet-y')) || 0;
        const half = halfStop();
        const flick = (start.velocity || 0) > 0.6;
        start = null;
        panel.classList.add('is-moving');
        if (flick || y > half + panel.offsetHeight * 0.18) return close();
        setY(y < half / 2 ? 0 : half);
      };
      handle.addEventListener('pointerup', release, { signal });
      handle.addEventListener('pointercancel', release, { signal });
    });

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
