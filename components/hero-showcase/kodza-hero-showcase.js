// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Hero Showcase
// Plays the entrance of Hero Split once the section is in view (the label and title lines rise
// out of their masks, the thumbnails in view open from their top edge down, row after row, the
// rest follows), then hands over to the scroll: the scene pins while the wall of projects, laid
// back like prints on a table with its rows set off from one another, stands up as the rows slide
// in opposite directions and click into line, a flat wall of links, while the title rises out of
// its masks. Each row repeats its projects on both sides so it runs past both edges (the copies
// are hidden from assistive tech and left out of the tab order). Every move is a paused animation
// set from the scroll: scrolling back up plays it in reverse. "kodza:replay" plays the entrance
// again.
(() => {
  const SELECTOR = '.kodza-hero-showcase';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GLIDE = 'cubic-bezier(0.6, 0, 0.1, 1)'; // slow start, long settle
  const SOFT = 'cubic-bezier(0.25, 1, 0.5, 1)';
  const OPEN = 'cubic-bezier(0.3, 0.5, 0.1, 1)'; // the thumbnails' curtain: a slow start leaves each one a hairline for 200 ms
  const TRAVEL = 'cubic-bezier(0.45, 0, 0.55, 1)'; // the moves on the scroll: gentle, a mouse wheel goes by notches
  const SETTLE = 'cubic-bezier(0.3, 0, 0.2, 1)'; // the rows: under way at once, then a long slow stop into line
  const OFFSETS = [-1.25, 1.25, -0.75]; // how far each row sits off the line at rest, in thumbnails

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
    const scene = q('.kodza-hero-showcase__scene');
    const copy = q('.kodza-hero-showcase__copy');
    const wall = q('.kodza-hero-showcase__wall');
    const rows = [...root.querySelectorAll('.kodza-hero-showcase__row')];
    const lines = [...root.querySelectorAll('.kodza-hero-showcase__line')];
    const own = rows.map((row) => [...row.children]); // the projects as written
    const most = Math.max(1, ...own.map((items) => items.length));
    const setting = (name, fallback) => {
      const value = parseFloat(getComputedStyle(root).getPropertyValue(`--kz-hero-showcase-${name}`));
      return Number.isFinite(value) ? value : fallback;
    };

    // Each row repeats its projects on both sides, enough copies to run past both edges once it is
    // slid off the line. A copy is a twin for the eye only: hidden from assistive tech, its links
    // out of the tab order (the mouse can still follow them, they go to the same place).
    let copies = 0;
    let twins = [];
    const fill = (pitch) => {
      const k = Math.max(1, Math.ceil((scene.clientWidth / 2 / pitch + 2.25 - most / 2) / most));
      if (k === copies) return;
      copies = k;
      twins.forEach((el) => el.remove());
      twins = [];
      const twin = (li) => {
        const el = li.cloneNode(true);
        el.setAttribute('aria-hidden', 'true');
        el.querySelectorAll('a, button, [tabindex]').forEach((a) => a.setAttribute('tabindex', '-1'));
        twins.push(el);
        return el;
      };
      rows.forEach((row, r) => {
        for (let i = 0; i < k; i += 1) {
          row.prepend(...own[r].map(twin));
          row.append(...own[r].map(twin));
        }
      });
    };

    // The wall sits in its place at the centre of the scene (the CSS puts it there). At rest it
    // lies back from its top edge, that edge just under the copy, and its rows sit off the line,
    // each picture leaning the other way inside its frame: these are the transforms that take it
    // there, set inline so the entrance plays on the wall at rest. Layout boxes only (offsetTop…):
    // they ignore transforms, so a scaled page changes nothing.
    const measure = () => {
      const first = own[0][0];
      const pitch = (first?.offsetWidth || 200) + (parseFloat(getComputedStyle(rows[0]).columnGap) || 0);
      fill(pitch);
      const rest = {
        wall: `translateY(${copy.offsetTop + copy.offsetHeight - wall.offsetTop}px) perspective(${setting('depth', 1600)}px) rotateX(${setting('tilt', 38)}deg)`,
        rows: rows.map((row, r) => `translateX(${OFFSETS[r % OFFSETS.length] * pitch}px)`),
        imgs: new Map(),
      };
      wall.style.transform = rest.wall;
      rows.forEach((row, r) => {
        row.style.transform = rest.rows[r];
        const lean = OFFSETS[r % OFFSETS.length] < 0 ? 4 : -4;
        row.querySelectorAll('img').forEach((img) => {
          rest.imgs.set(img, `scale(1.1) translateX(${lean}%)`);
          img.style.transform = rest.imgs.get(img);
        });
      });
      return rest;
    };

    // The scroll part, in progress: the wall stands up while the rows slide into line, then holds
    // there, flat, for the last stretch before the page goes on
    const timeline = () => {
      const rest = measure();
      const flat = rest.wall.replace(/translateY\([^)]*\)/, 'translateY(0px)').replace(/rotateX\([^)]*\)/, 'rotateX(0deg)');
      const leave = (el, start, end) => [el, [{ opacity: 1, transform: 'translateY(0px)', easing: TRAVEL }, { opacity: 0, transform: 'translateY(-12px)' }], start, end];
      // The copy rises out of its masks as the wall comes up, the label first
      const masked = [q('.kodza-hero-showcase__eyebrow .kodza-hero-showcase__rise'), ...lines.map((l) => l.querySelector(':scope > .kodza-hero-showcase__rise'))];
      return [
        [wall, [{ transform: rest.wall, easing: TRAVEL }, { transform: flat }], 0, 0.7],
        ...rows.map((row, r) => [row, [{ transform: rest.rows[r], easing: SETTLE }, { transform: 'translateX(0px)' }], 0, 0.8]),
        ...[...rest.imgs].map(([img, t]) => [img, [{ transform: t, easing: SETTLE }, { transform: 'scale(1) translateX(0%)' }], 0, 0.8]),
        [copy, [{ transform: 'translateY(0px)', easing: TRAVEL }, { transform: `translateY(${-0.05 * scene.clientHeight}px)` }], 0, 0.4],
        ...masked.map((el, i) => [el, [{ transform: 'translateY(0%)', easing: TRAVEL }, { transform: 'translateY(-105%)' }], i * 0.03, 0.22 + i * 0.03]),
        leave(q('.kodza-hero-showcase__lead'), 0.02, 0.24),
        leave(q('.kodza-hero-showcase__actions'), 0.04, 0.26),
      ];
    };
    const pin = scrub(root, scene, signal, timeline, [copy]);

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
      const rest = measure();
      root.classList.add('is-shown');
      rise(q('.kodza-hero-showcase__eyebrow .kodza-hero-showcase__rise'), 0, 1000);
      lines.forEach((l, i) => rise(l.querySelector(':scope > .kodza-hero-showcase__rise'), 110 + i * 125, 1170));
      // The thumbnails in view open row after row, left to right, each from its top edge down,
      // settling from a slight zoom; the ones out of view are simply there
      const view = scene.getBoundingClientRect();
      rows.forEach((row, r) => {
        const seen = [...row.children].filter((li) => {
          const box = li.getBoundingClientRect();
          return box.right > view.left && box.left < view.right && box.top < view.bottom;
        });
        seen.forEach((li, c) => {
          const delay = 260 + r * 140 + c * 70;
          const img = li.querySelector('img');
          animate(li.querySelector('.kodza-hero-showcase__curtain'), [{ transform: 'translateY(calc(-100% - 2px))' }, { transform: 'none' }], { duration: 1100, delay, easing: OPEN });
          animate(li.querySelector('.kodza-hero-showcase__hold'), [{ transform: 'translateY(calc(100% + 2px))' }, { transform: 'none' }], { duration: 1100, delay, easing: OPEN });
          if (rest.imgs.has(img)) animate(img, [{ transform: rest.imgs.get(img).replace('scale(1.1)', 'scale(1.3)') }, { transform: rest.imgs.get(img) }], { duration: 1700, delay, easing: SOFT });
          rise(li.querySelector('.kodza-hero-showcase__name'), delay + 480, 900);
          rise(li.querySelector('.kodza-hero-showcase__year'), delay + 560, 900);
        });
      });
      [q('.kodza-hero-showcase__lead'), q('.kodza-hero-showcase__actions')].forEach((el, i) => {
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
    // Once the wall is coming up over the copy, the copy lets clicks through to it
    const scrolled = () => {
      hurry();
      root.classList.toggle('is-past', pin.progress() > 0.25);
    };
    document.addEventListener('scroll', scrolled, { passive: true, capture: true, signal });
    // Tabbing back to a button scrolls back to where it shows: the hero, whole
    q('.kodza-hero-showcase__foot').addEventListener('focusin', () => {
      if (pin.progress() <= 0) return;
      const box = root.getBoundingClientRect();
      const k = box.height / root.offsetHeight || 1;
      window.scrollBy(0, box.top - (parseFloat(getComputedStyle(scene).top) || 0) * k);
    }, { signal });
    // Tabbing on to a project lays the wall flat, where every link can be read
    wall.addEventListener('focusin', (event) => {
      if (event.target.matches(':focus-visible')) pin.reveal(0.8);
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
