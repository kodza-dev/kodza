// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Inner Parallax Image
// Wraps the picture in its own frame, then moves it a share of the frame's height as the frame
// crosses the screen: from the frame entering at the bottom to it leaving at the top. The picture
// is zoomed by its whole travel, so its edges never show. Reduced motion, or a site pace of 0:
// the frame is laid, nothing moves. The drift is --kz-inner-parallax-image-drift (component.css),
// the smoothing just below.
(() => {
  const SELECTOR = '[data-kodza-inner-parallax-image]';
  // How long the picture takes to catch up with the scroll, in ms (times the site's pace): a soft
  // follow instead of a picture glued to the wheel. 0 glues it
  const SMOOTHING = 110;
  // The picture's own move left below this, in px, ends the loop
  const SETTLE = 0.05;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const img = root.querySelector('img');
    if (!img) return;
    // The frame goes around the picture itself (or its <picture>), inside a link if there is one,
    // and leaves the caption out
    const target = img.closest('picture') && root.contains(img.closest('picture')) ? img.closest('picture') : img;
    const frame = document.createElement('span');
    frame.className = 'kodza-inner-parallax-image__frame';
    target.replaceWith(frame);
    frame.append(target);

    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    if (still) return;
    const drift = parseFloat(getComputedStyle(root).getPropertyValue('--kz-inner-parallax-image-drift')) || 0;
    if (!drift) return;
    const zoom = 1 + 2 * Math.abs(drift);
    const smoothing = SMOOTHING * pace;

    let current = null; // the picture's offset now, in px of the frame
    let raf = 0;
    let last = 0;
    let shown = false;

    // Where the picture should be: -drift at the bottom of the screen, +drift at the top. Read in px
    // of the screen, written in px of the frame (a parent zoomed by transform must not shift it)
    const goal = () => {
      const rect = frame.getBoundingClientRect();
      const height = frame.offsetHeight;
      if (!height) return 0;
      const progress = clamp((innerHeight - rect.top) / (innerHeight + rect.height), 0, 1);
      return (progress - 0.5) * 2 * drift * height;
    };
    const write = () => {
      img.style.transform = `translate3d(0, ${current.toFixed(2)}px, 0) scale(${zoom})`;
    };
    const tick = (now) => {
      raf = 0;
      const to = goal();
      const step = last ? Math.min(now - last, 64) : 16.7;
      last = now;
      if (current === null || !smoothing) current = to;
      else current += (to - current) * (1 - Math.exp(-step / smoothing));
      if (Math.abs(to - current) < SETTLE) current = to;
      write();
      if (current !== to) raf = requestAnimationFrame(tick);
      else last = 0;
    };
    const queue = () => {
      if (!shown || raf) return;
      raf = requestAnimationFrame(tick);
    };

    // Placed before it first shows, so it never slides in from the middle
    current = goal();
    write();
    root.classList.add('is-moving');

    const io = new IntersectionObserver(([entry]) => {
      shown = entry.isIntersecting;
      if (shown) {
        current = goal(); // back on screen after a jump (an anchor, Home): placed, not chased
        write();
        queue();
      }
    });
    io.observe(frame);
    // The frame's height decides the travel: a picture that loads late, a new column width
    const resize = new ResizeObserver(queue);
    resize.observe(frame);
    window.addEventListener('scroll', queue, { passive: true, signal });
    window.addEventListener('resize', queue, { signal });
    signal.addEventListener('abort', () => {
      io.disconnect();
      resize.disconnect();
      cancelAnimationFrame(raf);
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
