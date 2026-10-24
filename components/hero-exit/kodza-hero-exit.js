// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Hero Exit
// Plays the entrance of Hero Split once the section is in view (the label and title lines rise
// out of their masks, the rest follows), then hands over to the scroll: the scene pins and takes
// itself apart, the top line rising and the bottom one dropping out of the screen while a
// picture opens in the gap between them and tightens into a card that steps back; the next
// section then slides over it. Every move is a paused animation set from the scroll: scrolling
// back up plays it in reverse. "kodza:replay" plays the entrance again.
(() => {
  const SELECTOR = '.kodza-hero-exit';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GLIDE = 'cubic-bezier(0.6, 0, 0.1, 1)'; // slow start, long settle
  const SOFT = 'cubic-bezier(0.25, 1, 0.5, 1)';
  const TRAVEL = 'cubic-bezier(0.45, 0, 0.55, 1)'; // the moves on the scroll: gentle, a mouse wheel goes by notches

  const decoded = (root) => Promise.all([...root.querySelectorAll('img')].map((img) => img.decode().catch(() => {})));

  // An easing curve as a function, to shape several edges of one clip-path apart
  const bezier = (x1, y1, x2, y2) => (t) => {
    let u = t;
    for (let i = 0; i < 8; i++) {
      const x = 3 * (1 - u) ** 2 * u * x1 + 3 * (1 - u) * u ** 2 * x2 + u ** 3 - t;
      const dx = 3 * (1 - u) ** 2 * x1 + 6 * (1 - u) * u * (x2 - x1) + 3 * u ** 2 * (1 - x2);
      if (Math.abs(x) < 1e-5 || !dx) break;
      u = Math.min(1, Math.max(0, u - x / dx));
    }
    return 3 * (1 - u) ** 2 * u * y1 + 3 * (1 - u) * u ** 2 * y2 + u ** 3;
  };
  const travel = bezier(0.45, 0, 0.55, 1);
  const part = (t, from, to) => travel(Math.min(1, Math.max(0, (t - from) / (to - from))));

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
    const track = q('.kodza-hero-exit__track');
    const scene = q('.kodza-hero-exit__scene');
    const slot = q('.kodza-hero-exit__slot');
    const win = q('.kodza-hero-exit__window');
    const img = q('.kodza-hero-exit__window img');
    const card = q('.kodza-hero-exit__card');
    const lines = [...root.querySelectorAll('.kodza-hero-exit__line')];
    const above = (el) => el.compareDocumentPosition(slot) & Node.DOCUMENT_POSITION_FOLLOWING;

    // A box in the scene's own pixels, whatever scales the page
    const within = (el) => {
      const box = scene.getBoundingClientRect();
      const k = box.width / scene.offsetWidth || 1;
      const r = el.getBoundingClientRect();
      return { x: (r.left - box.left) / k, y: (r.top - box.top) / k, w: r.width / k, h: r.height / k };
    };
    // The picture covers the whole scene; the window cuts it to nothing at the seam between the
    // lines (the slot), opens there as wide as the scene, then closes in on the card.
    const measure = () => {
      const W = scene.clientWidth;
      const H = scene.clientHeight;
      const seam = within(slot).y;
      const to = within(card);
      const round = parseFloat(getComputedStyle(card).borderTopLeftRadius) || 0;
      // t from 0 (shut) to 1 (the card): the height opens first, the sides follow. Under 40px
      // tall the band fades with its height, so it never shrinks to a hairline across the screen
      const shape = (t) => {
        const v = part(t, 0, 0.78);
        const h = part(t, 0.3, 1);
        const top = seam + (to.y - seam) * v;
        const bottom = H - seam - (to.y + to.h - seam) * v;
        return {
          clipPath: `inset(${top}px ${(W - to.x - to.w) * h}px ${bottom}px ${to.x * h}px round ${round * h}px)`,
          opacity: Math.min(1, (to.h * v) / 40),
        };
      };
      win.style.clipPath = shape(0).clipPath;
      return { H, shape };
    };

    // The scroll part, in progress. The track is one screen longer than the hold: from `cover`
    // on, the next section slides over the scene, and the card sinks under it.
    const timeline = () => {
      const { H, shape } = measure();
      const run = track.offsetHeight - scene.offsetHeight;
      const cover = run > 0 ? Math.max(0.2, (run - scene.offsetHeight) / run) : 1;
      // Everything above the seam rises by one distance, everything below drops by one: the
      // small print leaves a little ahead of the lines and never gets caught up
      const words = [q('.kodza-hero-exit__eyebrow'), ...lines, q('.kodza-hero-exit__foot'), q('.kodza-hero-exit__hint')].filter(Boolean);
      const lift = Math.max(...words.filter(above).map((el) => within(el)).map(({ y, h }) => y + h + 24));
      const drop = Math.max(...words.filter((el) => !above(el)).map((el) => H - within(el).y + 24));
      const away = (el, start, end) => [el, [
        { transform: 'translateY(0px)', easing: TRAVEL },
        { transform: `translateY(${above(el) ? -lift : drop}px)` },
      ], start * cover, end * cover];
      return [
        // The lines part, the small print just ahead of them
        away(q('.kodza-hero-exit__eyebrow'), 0, 0.62),
        ...lines.map((line) => away(line, 0, 0.76)),
        away(q('.kodza-hero-exit__foot'), 0, 0.62),
        away(q('.kodza-hero-exit__hint'), 0, 0.4),
        // The picture opens in the gap they leave, settling from a slight zoom, then becomes a card
        [win, Array.from({ length: 41 }, (_, i) => shape(i / 40)), 0, 0.9 * cover],
        [img, [{ transform: 'scale(1.18)', easing: TRAVEL }, { transform: 'scale(1)' }], 0, 0.9 * cover],
        // It steps back, then sinks under the next section
        [win, [
          { transform: 'translateY(0px) scale(1)', easing: TRAVEL },
          { transform: 'translateY(0px) scale(0.94)', offset: (cover * 0.3) / (1 - cover * 0.7), easing: TRAVEL },
          { transform: 'translateY(-9%) scale(0.86)' },
        ], cover * 0.7, 1],
        [q('.kodza-hero-exit__shade'), [{ opacity: 0 }, { opacity: 0.45 }], cover * 0.9, 1],
      ];
    };
    const pin = scrub(track, scene, signal, timeline, [q('.kodza-hero-exit__title')]);

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
      measure();
      rise(q('.kodza-hero-exit__eyebrow .kodza-hero-exit__rise'), 0, 1000);
      lines.forEach((l, i) => rise(l.querySelector(':scope > .kodza-hero-exit__rise'), 110 + i * 125, 1170));
      rise(q('.kodza-hero-exit__hint .kodza-hero-exit__rise'), 760, 1000);
      [q('.kodza-hero-exit__lead'), q('.kodza-hero-exit__actions')].forEach((el, i) => {
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
    // Tabbing back to a button scrolls back to where it shows: the hero, whole
    q('.kodza-hero-exit__foot').addEventListener('focusin', () => {
      if (pin.progress() <= 0) return;
      const box = root.getBoundingClientRect();
      const k = box.height / root.offsetHeight || 1;
      window.scrollBy(0, box.top - (parseFloat(getComputedStyle(scene).top) || 0) * k);
    }, { signal });
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
