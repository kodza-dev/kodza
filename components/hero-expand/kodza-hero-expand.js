// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Hero Expand
// Plays the entrance of Hero Split once the section is in view (the label and title lines rise
// out of their masks, the picture in its slot with them), then hands over to the scroll: the
// scene pins, the picture opens to the whole screen and pushes the words beside it to the edges,
// the rest of the title fades, and a caption and a button rise on a veil before the page carries
// on. Every move is a paused animation set from the scroll: scrolling back up plays it in
// reverse. "kodza:replay" plays the entrance again.
(() => {
  const SELECTOR = '.kodza-hero-expand';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GLIDE = 'cubic-bezier(0.6, 0, 0.1, 1)'; // slow start, long settle
  const SOFT = 'cubic-bezier(0.25, 1, 0.5, 1)';
  const TRAVEL = 'cubic-bezier(0.65, 0, 0.35, 1)'; // the big moves on the scroll
  const RISE = 'cubic-bezier(0.22, 1, 0.36, 1)';

  const decoded = (root) => Promise.all([...root.querySelectorAll('img')].map((img) => img.decode().catch(() => {})));

  // ---------- Scroll engine (begin) ----------
  // The same block in every hero that plays on scroll: copy it as is, write only the timeline.
  // `root` is a tall track and `scene` sticks inside it (position: sticky, in the CSS); the
  // progress runs from 0, the scene just pinned, to 1, about to unpin. `timeline()` returns
  // tracks, [element, keyframes, from, to] with from and to in progress; each becomes a paused
  // Web Animation whose time follows the scroll, smoothed by a requestAnimationFrame loop that
  // sleeps once it has caught up. The tracks are built again when `scene` or an element of
  // `watch` changes size, so `timeline()` measures there.
  function scrub(root, scene, signal, timeline, watch = []) {
    const SPAN = 1000;
    let tracks = [];
    let live = false;
    let now = 0;
    let target = 0;
    let frame = 0;
    let last = 0;
    const geometry = () => {
      const box = root.getBoundingClientRect();
      return {
        top: box.top,
        scale: box.height / root.offsetHeight || 1, // a parent scaled by transform
        run: root.offsetHeight - scene.offsetHeight,
        stick: parseFloat(getComputedStyle(scene).top) || 0,
      };
    };
    const progress = () => {
      const { top, scale, run, stick } = geometry();
      return run > 0 ? Math.min(1, Math.max(0, (stick - top / scale) / run)) : 0;
    };
    const seek = () => tracks.forEach((a) => { a.currentTime = now * SPAN; });
    const tick = (time) => {
      const dt = last ? Math.min(time - last, 64) : 16;
      last = time;
      now += (target - now) * (1 - Math.exp(-dt / 70));
      if (Math.abs(target - now) < 0.0004) now = target;
      seek();
      frame = now === target ? 0 : requestAnimationFrame(tick);
      if (!frame) last = 0;
    };
    const update = () => {
      if (!live) return;
      target = progress();
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const clear = () => {
      tracks.forEach((a) => a.cancel());
      tracks = [];
    };
    const build = () => {
      clear();
      if (!live) return;
      tracks = timeline().filter(([el]) => el).map(([el, keyframes, from, to]) => {
        const a = el.animate(keyframes, { duration: (to - from) * SPAN, delay: from * SPAN, endDelay: (1 - to) * SPAN, fill: 'both' });
        a.pause();
        return a;
      });
      seek();
      update();
    };
    const stop = () => {
      live = false;
      cancelAnimationFrame(frame);
      frame = last = now = 0;
      clear();
    };
    // Scrolls the page so the progress is at least `p` (a focused control must show)
    const reveal = (p) => {
      const { top, scale, run, stick } = geometry();
      if (run > 0 && progress() < p) window.scrollBy(0, top - (stick - p * run) * scale);
    };

    document.addEventListener('scroll', update, { passive: true, capture: true, signal });
    window.addEventListener('resize', update, { passive: true, signal });
    let resized = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(resized);
      resized = requestAnimationFrame(build);
    });
    [scene, ...watch].forEach((el) => el && ro.observe(el));
    signal.addEventListener('abort', () => {
      ro.disconnect();
      cancelAnimationFrame(resized);
      stop();
    });
    return {
      start() {
        live = true;
        build();
      },
      stop,
      progress,
      reveal,
    };
  }
  // ---------- Scroll engine (end) ----------

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    if (reduceMotion) return root.classList.add('is-shown');
    const q = (s) => root.querySelector(s);
    const scene = q('.kodza-hero-expand__scene');
    const slot = q('.kodza-hero-expand__slot');
    const win = q('.kodza-hero-expand__window');
    const img = q('.kodza-hero-expand__window img');
    const line = slot.closest('.kodza-hero-expand__line');
    const lines = [...root.querySelectorAll('.kodza-hero-expand__line')];
    const words = [...line.querySelectorAll('.kodza-hero-expand__word')];

    // A box in the scene's own pixels, whatever scales the page
    const within = (el) => {
      const box = scene.getBoundingClientRect();
      const k = box.width / scene.offsetWidth || 1;
      const r = el.getBoundingClientRect();
      return { x: (r.left - box.left) / k, y: (r.top - box.top) / k, w: r.width / k, h: r.height / k };
    };
    // The picture covers the whole scene (on a tall screen it rises above it, its top out of
    // view); laid over the slot, it is scaled to cover it, centred on it and cut to its shape.
    // Opening it is only these three numbers going back to 0.
    const measure = () => {
      const W = scene.clientWidth;
      const H = scene.clientHeight;
      const { x, y, w, h } = within(slot);
      const round = parseFloat(getComputedStyle(slot).borderTopLeftRadius) || 0;
      const iw = img.offsetWidth;
      const ih = img.offsetHeight;
      const s = Math.max(w / iw, h / ih);
      const cx = x + w / 2 - (img.offsetLeft + iw / 2);
      const dy = y + h / 2 - (img.offsetTop + ih / 2);
      const cy = y + h / 2 - H / 2;
      const clip = (top, bottom) => `inset(${top}px ${W - x - w}px ${H - bottom}px ${x}px round ${round}px)`;
      const picture = (zoom) => `translate(${cx}px, ${dy}px) scale(${s * zoom})`;
      win.style.clipPath = clip(y, y + h);
      img.style.transform = picture(1);
      return { W, x, y, w, h, cy, clip, picture };
    };

    // The scroll part, in progress: the picture is full screen at 0.55, the panel is up at 0.84
    const timeline = () => {
      const { W, x, y, w, h, cy, clip, picture } = measure();
      return [
        [win, [{ clipPath: clip(y, y + h), easing: TRAVEL }, { clipPath: 'inset(0px 0px 0px 0px round 0px)' }], 0, 0.55],
        [img, [
          { transform: picture(1), easing: TRAVEL },
          { transform: 'translate(0px, 0px) scale(1)', offset: 0.55, easing: 'cubic-bezier(0.45, 0, 0.55, 1)' },
          { transform: 'translate(0px, 0px) scale(1.08)' },
        ], 0, 1],
        // The words beside it ride its edges out of the screen, on its centre line
        ...words.map((word) => {
          const before = word.compareDocumentPosition(slot) & Node.DOCUMENT_POSITION_FOLLOWING;
          return [word, [{ transform: 'translate(0px, 0px)', easing: TRAVEL }, { transform: `translate(${before ? -x : W - x - w}px, ${-cy}px)` }], 0, 0.55];
        }),
        ...lines.filter((l) => l !== line).map((l) => [l, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-0.2em)' }], 0.02, 0.28]),
        [q('.kodza-hero-expand__eyebrow'), [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-12px)' }], 0, 0.3],
        [q('.kodza-hero-expand__foot'), [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(12px)' }], 0, 0.3],
        [q('.kodza-hero-expand__veil'), [{ opacity: 0 }, { opacity: 1 }], 0.45, 0.62],
        // 6px more: the button's mask leaves room for the focus ring
        ...[...root.querySelectorAll('.kodza-hero-expand__panel .kodza-hero-expand__rise')].map((el, i) => (
          [el, [{ transform: 'translateY(calc(105% + 6px))', easing: RISE }, { transform: 'none' }], 0.55 + i * 0.035, 0.73 + i * 0.035]
        )),
      ];
    };
    const pin = scrub(root, scene, signal, timeline, [q('.kodza-hero-expand__title')]);

    let running = [];
    const stop = () => {
      running.forEach((a) => a.cancel());
      running = [];
    };
    const animate = (el, keyframes, options) => {
      if (el) running.push(el.animate(keyframes, { easing: GLIDE, fill: 'backwards', ...options }));
    };
    const rise = (el, delay, duration) => animate(el, [{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration, delay });
    // Scrolling during the entrance hurries it, so the scroll takes over without a wait
    const hurry = () => {
      if (running.length && !root.classList.contains('is-live') && pin.progress() > 0) running.forEach((a) => a.updatePlaybackRate(4));
    };

    const play = async () => {
      await decoded(root);
      if (signal.aborted) return;
      stop();
      pin.stop();
      root.classList.remove('is-live');
      root.classList.add('is-shown');
      const { y, h, clip, picture } = measure();
      rise(q('.kodza-hero-expand__eyebrow .kodza-hero-expand__rise'), 0, 1000);
      lines.forEach((l, i) => rise(l.querySelector(':scope > .kodza-hero-expand__rise'), 110 + i * 125, 1170));
      // The picture rises with its line, cut at the bottom of the line's mask like the words
      const travel = line.querySelector(':scope > .kodza-hero-expand__rise').offsetHeight * 1.05;
      const { y: top, h: height } = within(line);
      const edge = top + height;
      const shown = (k) => Math.min(y + h, Math.max(y, edge - travel * (1 - k)));
      const stops = [0, 1 - (edge - y) / travel, 1 - (edge - y - h) / travel, 1].map((k) => Math.min(1, Math.max(0, k)));
      animate(win, stops.map((k) => ({ offset: k, transform: `translateY(${travel * (1 - k)}px)`, clipPath: clip(y, shown(k)) })), { duration: 1170, delay: 110 + lines.indexOf(line) * 125 });
      animate(img, [{ transform: picture(1.2) }, { transform: picture(1) }], { duration: 1600, delay: 200, easing: SOFT });
      [q('.kodza-hero-expand__lead'), q('.kodza-hero-expand__hint')].forEach((el, i) => {
        animate(el, [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: 700 + i * 110, easing: SOFT });
      });
      hurry();
      const entrance = running;
      Promise.all(entrance.map((a) => a.finished)).then(() => {
        if (entrance !== running || signal.aborted) return;
        root.classList.add('is-live');
        pin.start();
      }, () => {});
    };

    root.addEventListener('kodza:replay', play, { signal });
    document.addEventListener('scroll', hurry, { passive: true, capture: true, signal });
    // Tabbing to the button scrolls to where it shows
    q('.kodza-hero-expand__panel')?.addEventListener('focusin', () => pin.reveal(0.9), { signal });
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
