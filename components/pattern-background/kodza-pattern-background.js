// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Pattern Background
// The pattern itself is CSS. The script lines it up on the content: it measures the content, fits
// a frame of whole cells around it, adds the four hairlines and the corner crosses, and moves the
// pattern so its lines run along the frame. It measures again whenever the section or its content
// changes size. With --draw, a section that starts below the fold waits there until it scrolls
// in, so the trace plays in front of the reader, not off-screen.
(() => {
  const SELECTOR = '[data-kodza-pattern-background]';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EDGE = 8; // a frame line never closer than this to the edge of the section
  const FOLD = 2.5; // kodza:replay folds the trace away this many times faster than it draws

  // One axis of the frame: whole cells, centred on the content, about `air` away from it. Fewer
  // cells when the section has no room for more (on a phone), never fewer than the content needs.
  const fit = (start, length, extent, cell, air) => {
    const least = Math.max(1, Math.ceil(length / cell));
    let cells = Math.max(least, Math.round((length + air * 2) / cell));
    if ((cells * cell - length) / 2 < air / 2) cells++;
    for (; cells > least; cells--) {
      const from = start - (cells * cell - length) / 2;
      if (from >= EDGE && from + cells * cell <= extent - EDGE) break;
    }
    return [Math.round(start - (cells * cell - length) / 2), cells * cell];
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const content = root.querySelector('.kodza-pattern-background__content');
    if (!content) return;

    const frame = document.createElement('div');
    frame.className = 'kodza-pattern-background__frame';
    frame.setAttribute('aria-hidden', 'true');
    frame.innerHTML = '<span class="kodza-pattern-background__mark"></span>'.repeat(4);
    root.prepend(frame);
    signal.addEventListener('abort', () => frame.remove());

    // Measured in the section's own pixels: a parent that scales it (a preview, a theme) is
    // divided out. --cross repeats every two cells, so its frame takes pairs of cells when the
    // section has room for them.
    const place = () => {
      const style = getComputedStyle(root);
      const size = parseFloat(style.getPropertyValue('--kz-pattern-background-size')) || 40;
      const air = parseFloat(style.getPropertyValue('--kz-pattern-background-air')) || 0;
      const unit = root.classList.contains('kodza-pattern-background--cross') ? size * 2 : size;
      const outer = root.getBoundingClientRect();
      const inner = content.getBoundingClientRect();
      const scale = outer.width / root.offsetWidth || 1;
      const axis = (start, length, extent) => {
        const box = fit(start, length, extent, unit, air);
        return box[0] >= 0 && box[0] + box[1] <= extent ? box : fit(start, length, extent, size, air);
      };
      const left = (inner.left - outer.left) / scale - root.clientLeft;
      const [x, w] = axis(left, inner.width / scale, root.clientWidth);
      const [y, h] = axis((inner.top - outer.top) / scale - root.clientTop, inner.height / scale, root.clientHeight);
      // Too close to the lines (a phone): the words step in, the box and the frame stay put
      const room = Math.min(left - x, x + w - left - inner.width / scale);
      root.style.setProperty('--kz-pattern-background-squeeze', `${Math.max(0, Math.ceil(air / 2 - room))}px`);
      root.style.setProperty('--kz-pattern-background-frame-x', `${x}px`);
      root.style.setProperty('--kz-pattern-background-frame-y', `${y}px`);
      root.style.setProperty('--kz-pattern-background-frame-w', `${w}px`);
      root.style.setProperty('--kz-pattern-background-frame-h', `${h}px`);
      root.classList.add('is-framed');
    };
    place();
    const resize = new ResizeObserver(place);
    resize.observe(root);
    resize.observe(content, { box: 'border-box' });
    signal.addEventListener('abort', () => resize.disconnect());

    const drawing = root.classList.contains('kodza-pattern-background--draw') && !reduceMotion;

    // kodza:replay folds the trace back into the content, measures again and draws it once more
    // (a demo that swaps the pattern, a slide that comes back): nothing vanishes at once. A
    // function passed as event.detail runs in between, while nothing is drawn.
    const then = [];
    let folding = false;
    const draw = () => {
      folding = false;
      if (signal.aborted) return;
      then.splice(0).forEach((fn) => fn());
      place();
      if (!drawing) return;
      root.classList.add('is-waiting');
      void root.offsetWidth;
      root.classList.remove('is-waiting');
    };
    root.addEventListener('kodza:replay', (event) => {
      if (typeof event.detail === 'function') then.push(event.detail);
      if (folding) return;
      const trace = drawing ? root.getAnimations({ subtree: true }).filter((a) => a.animationName?.startsWith('kodza-pattern-background-')) : [];
      if (!trace.length) return draw();
      // Played backwards on one shared clock, from wherever the trace is: the pattern folds first,
      // then the crosses, then the lines run back into the content
      const at = Math.max(...trace.map((a) => a.currentTime));
      folding = true;
      trace.forEach((a) => {
        const { endTime } = a.effect.getComputedTiming();
        if (at > endTime) a.effect.updateTiming({ endDelay: at - endTime });
        a.currentTime = at;
        a.playbackRate = -FOLD;
        a.play();
      });
      Promise.all(trace.map((a) => a.finished)).then(draw, draw);
    }, { signal });

    if (!drawing) return;

    // Already in view: the trace that CSS started on load plays on
    const box = root.getBoundingClientRect();
    if (box.top < innerHeight * 0.75 && box.bottom > 0) return;

    root.classList.add('is-waiting');
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();
      root.classList.remove('is-waiting');
    }, { rootMargin: '0px 0px -25% 0px' });
    observer.observe(root);
    signal.addEventListener('abort', () => observer.disconnect());
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
