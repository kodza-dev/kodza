// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Hero Focus
// Plays the entrance once the section is in view (the label and title lines rise out of their
// masks, the picture opens from the top edge down while it settles), then hands over to the
// scroll: the scene pins and the focus moves from the words to the picture. The picture
// sharpens, the title passes the lens, blurs and leaves, and the readout counts the distance.
// Once the picture is sharp the notes come by themselves, one after the other: a dot on the
// detail, a wire, a card, each drawn at its own pace. A scroll that runs ahead of them hurries
// them, so they are drawn before the scene leaves. Scrolling back up closes them, the last one
// first, and plays the focus pull in reverse.
// "kodza:replay" plays the entrance again.
(() => {
  const SELECTOR = '.kodza-hero-focus';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GLIDE = 'cubic-bezier(0.6, 0, 0.1, 1)'; // slow start, long settle
  const SOFT = 'cubic-bezier(0.25, 1, 0.5, 1)';
  const TRAVEL = 'cubic-bezier(0.65, 0, 0.35, 1)'; // the big moves on the scroll
  const RISE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const NEAR = 0.4; // the readout, in metres: on the words, then on the picture
  const FAR = 6;
  const FOCUS = [0.045, 0.6]; // the focus pull, in progress of the pinned scene
  const NOTES_AT = 0.56; // the picture is sharp: the notes come by themselves; the rest holds it
  const NOTES_BY = 0.92; // a fast scroll hurries them: all drawn by here, before the scene unpins
  const NOTE_GAP = 450; // ms between two notes on the way in
  const CLOSE_GAP = 140; // ms between two notes on the way out, the last one first

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
    const q = (s) => root.querySelector(s);
    const scene = q('.kodza-hero-focus__scene');
    const img = q('.kodza-hero-focus__img');
    const notes = [...root.querySelectorAll('.kodza-hero-focus__note')];
    const value = q('.kodza-hero-focus__value');
    const readout = (distance) => `${distance.toFixed(1)} m`;

    // Each card takes the first place that stays on screen, clear of the label, the buttons and
    // the cards already placed: its own side, the other side, under its dot, above it
    const place = () => {
      const W = scene.clientWidth;
      const H = scene.clientHeight;
      const vars = getComputedStyle(root);
      const ratio = parseFloat(vars.getPropertyValue('--kz-hero-focus-ratio')) || 1;
      const cropX = parseFloat(vars.getPropertyValue('--kz-hero-focus-crop-x')) || 0;
      const cropY = parseFloat(vars.getPropertyValue('--kz-hero-focus-crop-y')) || 0;
      const inner = getComputedStyle(q('.kodza-hero-focus__inner'));
      const g = parseFloat(inner.paddingLeft) || 16;
      const top = parseFloat(inner.paddingTop) + 28;
      const bottom = H - parseFloat(inner.paddingBottom) - q('.kodza-hero-focus__foot').offsetHeight - 12;
      const fw = Math.max(W, H * ratio);
      const fh = fw / ratio;
      // Every way each card can sit on screen, its own side first
      const measure = () => notes.map((note) => {
        const s = getComputedStyle(note);
        const px = (W - fw) * cropX + parseFloat(s.getPropertyValue('--x')) * fw;
        const py = (H - fh) * cropY + parseFloat(s.getPropertyValue('--y')) * fh;
        const card = note.querySelector('.kodza-hero-focus__card');
        const cw = card.offsetWidth;
        const ch = card.offsetHeight;
        const cx = Math.min(W - g - cw, Math.max(g, px - cw / 2));
        note.style.setProperty('--shift', `${cx - px}px`);
        const rects = {
          right: [px + 50, py - ch / 2, cw, ch],
          left: [px - 50 - cw, py - ch / 2, cw, ch],
          below: [cx, py + 36, cw, ch],
          above: [cx, py - 36 - ch, cw, ch],
        };
        const side = note.dataset.side || 'right';
        const order = [side, side === 'right' ? 'left' : 'right', 'below', 'above'];
        const fits = order.filter((k) => {
          const [x, y] = rects[k];
          return x >= g && x + cw <= W - g && y >= top && y + ch <= bottom;
        });
        return (fits.length ? fits : [side]).map((k) => [k, rects[k]]);
      });
      // The first set where no two cards touch (three notes: a handful of tries)
      const clear = ([x, y, w, h], [a, b, c, d]) => x + w + 8 < a || a + c + 8 < x || y + h + 8 < b || b + d + 8 < y;
      const solve = (options, i = 0, taken = []) => {
        if (i === options.length) return taken;
        for (const o of options[i]) {
          if (taken.every((t) => clear(t[1], o[1]))) {
            const found = solve(options, i + 1, [...taken, o]);
            if (found) return found;
          }
        }
        return null;
      };
      // A scene too low for the full cards (a short frame, a phone on its side): each keeps its
      // title and the text stays for screen readers
      root.classList.remove('is-brief');
      let options = measure();
      let picks = solve(options);
      if (!picks) {
        root.classList.add('is-brief');
        options = measure();
        picks = solve(options) || options.map((o) => o[0]);
      }
      notes.forEach((note, i) => { note.dataset.place = picks[i][0]; });
    };

    // Reduced motion: the scene pins all the same, but each state comes at once when the scroll
    // reaches it (the picture sharp past the middle of the focus pull, then the notes)
    if (reduceMotion) {
      root.classList.add('is-shown');
      const pin = scrub(root, scene, signal, () => {
        place();
        return [];
      });
      const swap = () => {
        const p = pin.progress();
        const sharp = p >= (FOCUS[0] + FOCUS[1]) / 2;
        root.classList.toggle('is-sharp', sharp);
        value.textContent = readout(sharp ? FAR : NEAR);
        notes.forEach((note) => note.classList.toggle('is-open', p >= NOTES_AT));
      };
      pin.start();
      swap();
      document.addEventListener('scroll', swap, { passive: true, capture: true, signal });
      return;
    }

    // The notes play in time, not with the wheel: each one is a set of paused animations (dot,
    // wire, card, words) moved frame by frame, forward once the picture is sharp and backward when
    // it blurs again. Each part stops at its own end, so on the way out they all close at once.
    // The scroll can only move a note ahead, never pull it back
    const open = notes.map(() => false);
    const timers = [];
    const rates = notes.map(() => 0);
    let plays = notes.map(() => []);
    let lengths = notes.map(() => 0);
    let lastStart = 0;
    const end = (a) => a.effect.getComputedTiming().endTime;
    let ticking = 0;
    let before = 0;
    const tick = (time) => {
      const dt = before ? Math.min(time - before, 64) : 16;
      before = time;
      let moving = false;
      rates.forEach((rate, i) => {
        if (!rate) return;
        let still = false;
        plays[i].forEach((a) => {
          const t = Math.min(end(a), Math.max(0, a.currentTime + dt * rate));
          a.currentTime = t;
          if (rate > 0 ? t < end(a) : t > 0) still = true;
        });
        if (still) moving = true;
        else rates[i] = 0;
      });
      ticking = moving ? requestAnimationFrame(tick) : 0;
      if (!ticking) before = 0;
    };
    const move = (i, rate) => {
      rates[i] = rate;
      if (!ticking) ticking = requestAnimationFrame(tick);
    };
    // Built again when the scene changes size: each part keeps where it was
    const draw = () => {
      const kept = plays.map((set) => set.map((a) => a.currentTime || 0));
      plays.flat().forEach((a) => a.cancel());
      plays = notes.map((note, i) => {
        const where = note.dataset.place;
        const from = { right: 'inset(0 100% 0 0 round 12px)', left: 'inset(0 0 0 100% round 12px)', below: 'inset(0 0 100% 0 round 12px)', above: 'inset(100% 0 0 0 round 12px)' }[where];
        const upright = where === 'below' || where === 'above';
        let j = 0;
        const step = (el, keyframes, delay, duration, easing) => {
          const a = el.animate(keyframes, { duration, delay, easing, fill: 'both' });
          a.pause();
          a.currentTime = kept[i]?.[j++] || 0;
          return a;
        };
        return [
          step(note.querySelector('.kodza-hero-focus__dot'), [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], 0, 420, RISE),
          step(note.querySelector('.kodza-hero-focus__wire'), [{ transform: upright ? 'scaleY(0)' : 'scaleX(0)' }, { transform: 'none' }], 180, 540, TRAVEL),
          step(note.querySelector('.kodza-hero-focus__card'), [{ clipPath: from }, { clipPath: 'inset(0 0 0 0 round 12px)' }], 400, 780, TRAVEL),
          ...[...note.querySelectorAll('.kodza-hero-focus__card .kodza-hero-focus__rise')].map((el, j) => (
            step(el, [{ transform: 'translateY(105%)' }, { transform: 'none' }], 560 + j * 90, 860, RISE)
          )),
        ];
      });
      lengths = plays.map((set) => Math.max(...set.map(end)));
    };
    const run = (i, on) => {
      clearTimeout(timers[i]);
      open[i] = on;
      if (!on) {
        lastStart = 0;
        timers[i] = setTimeout(() => move(i, -1.8), (notes.length - 1 - i) * CLOSE_GAP); // they leave faster than they came
        return;
      }
      const now = performance.now();
      const wait = Math.max(0, lastStart + NOTE_GAP - now);
      lastStart = now + wait;
      timers[i] = setTimeout(() => move(i, 1), wait);
    };
    // The scroll past the picture, in progress: where the notes must be at least, played in a row
    // from NOTES_AT to NOTES_BY. A slow scroll leaves them their own pace, a fast one hurries them
    const hurryNotes = (p) => {
      const t = ((p - NOTES_AT) / (NOTES_BY - NOTES_AT)) * ((notes.length - 1) * NOTE_GAP + lengths[notes.length - 1]);
      plays.forEach((set, i) => {
        const floor = t - i * NOTE_GAP;
        if (!open[i] || floor <= 0) return;
        let behind = false;
        set.forEach((a) => {
          if (a.currentTime < Math.min(end(a), floor)) a.currentTime = Math.min(end(a), floor);
          if (a.currentTime < end(a)) behind = true;
        });
        if (rates[i] > 0 || (!behind && !rates[i])) return;
        clearTimeout(timers[i]);
        if (behind) move(i, 1);
        else rates[i] = 0;
      });
    };
    const quiet = () => {
      timers.forEach(clearTimeout);
      plays.flat().forEach((a) => a.cancel());
      plays = notes.map(() => []);
      rates.fill(0);
      cancelAnimationFrame(ticking);
      ticking = before = 0;
      open.fill(false);
      lastStart = 0;
    };

    // The scroll part, in progress: the focus pull, then the picture holds for the notes
    const timeline = () => {
      place();
      draw();
      const [a, b] = FOCUS;
      return [
        // The rack focus: the picture sharpens and settles, the words pass the lens and blur
        [img, [{ filter: 'blur(var(--kz-hero-focus-blur))', easing: TRAVEL }, { filter: 'blur(0px)' }], a, b],
        [q('.kodza-hero-focus__frame'), [{ transform: 'scale(1.08)', easing: TRAVEL }, { transform: 'scale(1)' }], a, b],
        [q('.kodza-hero-focus__veil'), [{ opacity: 1, easing: TRAVEL }, { opacity: 0 }], a, b - 0.04],
        [q('.kodza-hero-focus__copy'), [
          { filter: 'blur(0px)', transform: 'scale(1)', opacity: 1, easing: 'cubic-bezier(0.5, 0, 0.75, 0)' },
          { filter: 'blur(14px)', transform: 'scale(1.1)', opacity: 0 },
        ], a, b - 0.08],
        [q('.kodza-hero-focus__mark'), [{ transform: 'translateX(0px)', easing: TRAVEL }, { transform: 'translateX(120px)' }], a, b],
      ];
    };
    const pin = scrub(root, scene, signal, timeline);
    const sync = () => {
      const due = pin.progress() >= NOTES_AT;
      notes.forEach((note, i) => {
        if (due !== open[i]) run(i, due);
      });
    };

    // The readout follows the picture's focus, as the lens ring would, and sleeps once it rests;
    // the notes take the same smoothed progress, so a hurried one is still drawn, not cut
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    let shown = '';
    let seen = -1;
    let raf = 0;
    const read = () => {
      const a = img.getAnimations()[0];
      const time = a ? a.currentTime : 0;
      const k = Math.min(1, Math.max(0, (time / 1000 - FOCUS[0]) / (FOCUS[1] - FOCUS[0]))); // the engine's span is 1000
      const text = readout(NEAR + (FAR - NEAR) * ease(k));
      if (text !== shown) value.textContent = shown = text;
      hurryNotes(time / 1000);
      raf = time !== seen ? requestAnimationFrame(read) : 0;
      seen = time;
    };
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };

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

    // The entrance of Hero Split: label and lines rise out of their masks, the picture opens
    // from the top edge down while it settles
    const play = async () => {
      await decoded(root);
      if (signal.aborted) return;
      stop();
      pin.stop();
      quiet();
      root.classList.remove('is-live');
      root.classList.add('is-shown');
      rise(q('.kodza-hero-focus__eyebrow .kodza-hero-focus__rise'), 0, 1000);
      root.querySelectorAll('.kodza-hero-focus__title .kodza-hero-focus__rise').forEach((el, i) => rise(el, 110 + i * 125, 1170));
      animate(q('.kodza-hero-focus__media'), [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)' }], { duration: 1300, delay: 60 });
      animate(q('.kodza-hero-focus__lens'), [{ transform: 'scale(1.2)' }, { transform: 'none' }], { duration: 1800, delay: 60, easing: SOFT });
      [q('.kodza-hero-focus__lead'), q('.kodza-hero-focus__foot')].forEach((el, i) => {
        animate(el, [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: 700 + i * 110, easing: SOFT });
      });
      hurry();
      const entrance = running;
      Promise.all(entrance.map((a) => a.finished)).then(() => {
        if (entrance !== running || signal.aborted) return;
        root.classList.add('is-live');
        pin.start();
        sync();
        wake();
      }, () => {});
    };

    root.addEventListener('kodza:replay', play, { signal });
    document.addEventListener('scroll', () => {
      hurry();
      if (!root.classList.contains('is-live')) return;
      sync();
      wake();
    }, { passive: true, capture: true, signal });
    signal.addEventListener('abort', () => {
      stop();
      quiet();
      cancelAnimationFrame(raf);
    });
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
