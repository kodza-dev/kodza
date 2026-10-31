// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Hero Collage
// The entrance, once the section is in view: the label and the title lines rise from their masks,
// then the pictures open one after the other, going round the title, and the words and buttons
// follow. With a mouse, the pictures then follow the pointer a little, each one by its own depth
// (--kz-hero-collage-depth), smoothed by a small loop that stops once they settle. Never on a
// touch screen, never with reduced motion. "kodza:replay" plays the entrance again.
(() => {
  const SELECTOR = '.kodza-hero-collage';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const GLIDE = 'cubic-bezier(0.6, 0, 0.1, 1)'; // slow start, long settle
  const SOFT = 'cubic-bezier(0.25, 1, 0.5, 1)';
  const OPEN = 'cubic-bezier(0.3, 0.5, 0.1, 1)'; // the curtains: a slow start would leave each picture a hairline for 200 ms
  const SMOOTH = 140; // how long the pictures take to catch the pointer, in ms (time constant)
  const decoded = (root) => Promise.all([...root.querySelectorAll('img')].map((img) => img.decode().catch(() => {})));

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const q = (name) => [...root.querySelectorAll(`.kodza-hero-collage__${name}`)];
    const shots = q('shot');

    let running = [];
    const stop = () => {
      running.forEach((a) => a.cancel());
      running = [];
    };
    const animate = (el, keyframes, options) => {
      if (el) running.push(el.animate(keyframes, { easing: GLIDE, fill: 'backwards', ...options }));
    };
    const rise = (el, delay, duration) => animate(el, [{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration, delay });
    const come = (el, delay) => animate(el, [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay, easing: SOFT });

    const play = async () => {
      await decoded(root);
      if (signal.aborted) return;
      stop();
      root.classList.add('is-shown');
      q('rise').forEach((el, i) => rise(el, i * 110, i ? 1100 : 1000));
      // In the order of the markup: round the title, from the top left
      shots.forEach((shot, i) => {
        const delay = 250 + i * 120;
        const at = (name) => shot.querySelector(`.kodza-hero-collage__${name}`);
        animate(at('curtain'), [{ transform: 'translateY(calc(-100% - 2px))' }, { transform: 'none' }], { duration: 1350, delay, easing: OPEN });
        animate(at('hold'), [{ transform: 'translateY(calc(100% + 2px))' }, { transform: 'none' }], { duration: 1350, delay, easing: OPEN });
        animate(shot.querySelector('img'), [{ transform: 'scale(1.2)' }, { transform: 'none' }], { duration: 2000, delay, easing: SOFT });
      });
      come(q('lead')[0], 650);
      come(q('actions')[0], 760);
    };

    if (reduceMotion) {
      root.classList.add('is-shown');
      return;
    }

    // The drift: the pointer from the middle of the section, from -1 to 1 on each axis, times the
    // drift and each picture's depth. They go the way the pointer goes
    const depths = shots.map((shot) => parseFloat(getComputedStyle(shot).getPropertyValue('--kz-hero-collage-depth')) || 0);
    let target = { x: 0, y: 0 };
    let now = { x: 0, y: 0 };
    let reach = 0;
    let frame = 0;
    let last = 0;
    const draw = () => shots.forEach((shot, i) => {
      const k = depths[i] * reach;
      shot.style.transform = now.x || now.y ? `translate3d(${(now.x * k).toFixed(2)}px, ${(now.y * k).toFixed(2)}px, 0)` : '';
    });
    const tick = (time) => {
      const dt = Math.min(64, time - (last || time));
      last = time;
      const ease = 1 - Math.exp(-dt / SMOOTH);
      now = { x: now.x + (target.x - now.x) * ease, y: now.y + (target.y - now.y) * ease };
      const settled = Math.abs(target.x - now.x) < 0.001 && Math.abs(target.y - now.y) < 0.001;
      if (settled) now = { ...target };
      draw();
      frame = settled ? 0 : requestAnimationFrame(tick);
    };
    const follow = (x, y) => {
      target = { x, y };
      if (frame) return;
      last = 0;
      frame = requestAnimationFrame(tick);
    };
    root.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse' || !finePointer.matches) return;
      const box = root.getBoundingClientRect();
      if (!box.width || !box.height) return;
      reach = parseFloat(getComputedStyle(root).getPropertyValue('--kz-hero-collage-drift')) || 0;
      const clamp = (v) => Math.max(-1, Math.min(1, v));
      follow(clamp(((event.clientX - box.left) / box.width) * 2 - 1), clamp(((event.clientY - box.top) / box.height) * 2 - 1));
    }, { signal });
    root.addEventListener('pointerleave', () => follow(0, 0), { signal });
    signal.addEventListener('abort', () => {
      cancelAnimationFrame(frame);
      shots.forEach((shot) => (shot.style.transform = ''));
    });

    root.addEventListener('kodza:replay', play, { signal });
    signal.addEventListener('abort', stop);
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      io.disconnect();
      play();
    }, { rootMargin: '0px 0px -15% 0px' });
    signal.addEventListener('abort', () => io.disconnect());
    Promise.all([document.fonts?.ready, decoded(root)]).then(() => {
      if (!signal.aborted) io.observe(root);
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
