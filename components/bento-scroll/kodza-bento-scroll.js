// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Bento Scroll
// A bento grid whose main picture opens the section full screen, with the head written on it. The
// entrance plays once, as the section comes into view: the picture opens from its top edge and
// settles from a little closer, the label and the title lines rise out of their masks. Then the
// scroll takes over: the scene pins, the picture goes back into its box (the head turns back to
// ink exactly where the picture's edge leaves it) while the other boxes rise around it in the
// order they are read, a figure rolling to its value, and the page carries on. Every move is a
// paused animation set from the scroll: scrolling back up plays it in reverse. Where the grid
// cannot hold on one screen (a narrow section, a low window, a box whose text would not fit),
// nothing pins: the boxes open as they come into view, like Bento Grid. With reduced motion, the
// grid is just there. "kodza:replay" plays the entrance again. The settings: the
// --kz-bento-scroll-* variables in the CSS, and the constants under SELECTOR.
(() => {
  const SELECTOR = '.kodza-bento-scroll';
  // When it pins: the whole grid holds on one screen
  const PIN_WIDTH = 960; // px, the section at least…
  const PIN_HEIGHT = 520; // …and the window
  // The scroll, in progress: 0 is the scene just pinned, 1 the page about to carry on
  const BACK_FROM = 0.04; // the picture going back into its box…
  const BACK_TO = 0.52; // …is in it here
  const VEIL_FROM = 0.3; // the veil under the head fading out
  const BOXES_FROM = 0.26; // the first other box rising…
  const BOX_STEP = 0.09; // …the next ones after it, in the order they are read
  const BOX_SPAN = 0.22; // a box rising
  const BOX_LIFT = 56; // px, how far below it starts
  const TAG_FROM = 0.6; // the caption of the main picture, last; after it, time to read
  const FOCUS_AT = 0.85; // tabbing into the grid scrolls to here, every box shown
  // The entrance, in ms (each one times the site's pace). Pinned, the picture:
  const OPEN = 1200; // opening from its top edge…
  const SETTLE = 1500; // …and settling from a little closer
  const HEAD_AT = 320; // the head rising on it
  // The head, as Section Intro plays it:
  const LABEL = 1000; // a label rising out of its mask
  const TITLE = 1170; // each title line…
  const TITLE_AT = 110; // …the first one starting here…
  const TITLE_STEP = 125; // …and the next a beat later
  const INTRO_AT = 450; // the intro coming up
  const TEXT = 900; // a text coming up
  // Not pinned, the boxes, as Bento Grid plays them:
  const BOX = 1000; // a box opening from its top edge
  const IMAGE = 1400; // its image settling from a little closer
  const LABEL_AT = 120; // its label…
  const NAME = 1000; // …its name rising out of its own box…
  const NAME_AT = 200;
  const TEXT_AT = 320; // …its text…
  const TAG_AT = 500; // …the caption on an image
  const ROLL = 1500; // a figure rolling to its value…
  const ROLL_STEP = 160; // …each digit a little longer than the one on its left
  const ROLL_AT = 150;
  const HEAD_STEP = 300; // between the head and the first box that comes into view with it…
  const STEP = 90; // …and between two boxes, in the order they are read
  const ENTER = '0px 0px -12% 0px'; // a box plays once its top is this far into the screen
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const GLIDE = 'cubic-bezier(0.6, 0, 0.1, 1)'; // slow start, long settle
  const SOFT = 'cubic-bezier(0.25, 1, 0.5, 1)';
  const TRAVEL = 'cubic-bezier(0.65, 0, 0.35, 1)'; // the big moves on the scroll
  const ARRIVE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const ROLLED = 'cubic-bezier(0.16, 1, 0.3, 1)'; // a figure: fast, then a long slow landing
  // Rising out of its own box, no wrapper needed: the box clips what is still below its bottom edge
  // (with room for the descenders and the side bearings)
  const RISE = [
    { transform: 'translateY(calc(100% + 0.2em))', clipPath: 'inset(-0.2em -0.1em 100% -0.1em)' },
    { transform: 'none', clipPath: 'inset(-0.2em -0.1em -0.2em -0.1em)' },
  ];
  const UP = (px) => [{ opacity: 0, transform: `translateY(${px}px)` }, { opacity: 1, transform: 'none' }];
  const DIGIT = 1.1; // the height of a digit's window, in em (the CSS sets the same)

  const span = (name, text) => {
    const el = document.createElement('span');
    if (name) el.className = `kodza-bento-scroll__${name}`;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const layer = (name) => {
    const el = document.createElement('div');
    el.className = `kodza-bento-scroll__${name}`;
    return el;
  };
  // A figure, set as digits that roll: each digit in its own window, over a strip of 0 to 9 that
  // turns once or more (more to the right) and lands on it. Screen readers keep the figure as
  // written. The strips are left landed: the roll plays from 0 back to there
  const split = (figure) => {
    const text = figure.textContent.trim();
    const count = [...text].filter((ch) => /\d/.test(ch)).length;
    const shown = span();
    shown.setAttribute('aria-hidden', 'true');
    const strips = [];
    [...text].forEach((ch) => {
      if (!/\d/.test(ch)) return shown.append(span('char', ch));
      const rank = strips.length;
      const turns = 1 + Math.round((rank / Math.max(1, count - 1)) * 2);
      const stop = turns * 10 + Number(ch);
      const strip = span('strip');
      for (let i = 0; i < (turns + 1) * 10; i += 1) strip.append(span(null, String(i % 10)));
      strip.style.transform = `translateY(${-stop * DIGIT}em)`;
      const digit = span('digit');
      digit.append(span('fit', ch), strip);
      shown.append(digit);
      strips.push({ strip, stop, rank });
    });
    figure.replaceChildren(shown, span('sr', text));
    return strips;
  };
  const decoded = (root) => Promise.all([...root.querySelectorAll('img')].map((img) => img.decode().catch(() => {})));

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const q = (s) => root.querySelector(s);
    const scene = q('.kodza-bento-scroll__scene');
    const list = q('.kodza-bento-scroll__list');
    const head = q('.kodza-bento-scroll__head');
    const cells = [...root.querySelectorAll('.kodza-bento-scroll__cell')];
    const lead = q('.kodza-bento-scroll__cell--lead');
    const picture = lead?.querySelector('.kodza-bento-scroll__media img');
    const figures = new Map();
    cells.forEach((cell) => {
      const strips = [...cell.querySelectorAll('.kodza-bento-scroll__figure')].flatMap(split);
      if (strips.length) figures.set(cell, strips);
    });
    if (still) return root.classList.add('is-still');

    // A box in the scene's own pixels, whatever scales the page
    const within = (el) => {
      const box = scene.getBoundingClientRect();
      const k = box.width / scene.offsetWidth || 1;
      const r = el.getBoundingClientRect();
      return { x: (r.left - box.left) / k, y: (r.top - box.top) / k, w: r.width / k, h: r.height / k };
    };
    // The head's entrance, as Section Intro plays it, `at` ms in, with the `animate` of the mode
    const playHead = (part, animate, at = 0) => {
      const p = (s) => part.querySelector(`:scope > ${s}`);
      animate(p('.kodza-bento-scroll__eyebrow'), RISE, { duration: LABEL, delay: at });
      // The title, line after line, each out of its own mask; a title written in one piece rises in one piece
      const lines = [...part.querySelectorAll('.kodza-bento-scroll__line > .kodza-bento-scroll__rise')];
      if (lines.length) lines.forEach((line, i) => animate(line, [{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration: TITLE, delay: at + TITLE_AT + i * TITLE_STEP }));
      else animate(p('.kodza-bento-scroll__title'), RISE, { duration: TITLE, delay: at + TITLE_AT });
      // The intro waits for the last line to be on its way
      animate(p('.kodza-bento-scroll__intro'), UP(20), { duration: TEXT, delay: at + INTRO_AT + Math.max(0, lines.length - 2) * TITLE_STEP, easing: SOFT });
    };
    let played = false; // the entrance has played: a mode taken over later shows at once

    // Pinned: the picture full screen, then back into its box on the scroll. Over the scene, the
    // script sets a window cut to the picture, with a copy of the picture, a veil and a copy of the
    // head in the colour that reads on the picture: the window's edge cuts the copy exactly where
    // it leaves the real head
    const pinned = (signal, shown) => {
      const win = layer('window');
      win.setAttribute('aria-hidden', 'true');
      const photo = layer('photo');
      const img = picture.cloneNode();
      img.alt = '';
      const veil = layer('veil');
      photo.append(img, veil);
      const double = head?.cloneNode(true);
      if (double) {
        double.classList.add('kodza-bento-scroll__double');
        double.inert = true;
        photo.append(double);
      }
      win.append(photo);
      scene.append(win);
      root.classList.add('is-pinned');
      const others = cells.filter((cell) => cell !== lead);
      const place = () => {
        if (!double) return;
        const { x, y, w } = within(head);
        Object.assign(double.style, { left: `${x}px`, top: `${y}px`, width: `${w}px` });
      };

      // The scroll part: the picture full screen shrinks into its box (scaled to cover it, centred
      // on it, cut to its shape), and the other boxes rise around it
      const rollAt = new Map(); // a box → the progress where its figure rolls, set by the timeline
      const timeline = () => {
        place();
        const W = scene.clientWidth;
        const H = scene.clientHeight;
        const { x, y, w, h } = within(lead);
        const round = parseFloat(getComputedStyle(lead).borderTopLeftRadius) || 0;
        const s = Math.max(w / W, h / H);
        const tracks = [
          [win, [{ clipPath: 'inset(0px 0px 0px 0px round 0px)', easing: TRAVEL }, { clipPath: `inset(${y}px ${W - x - w}px ${H - y - h}px ${x}px round ${round}px)` }], BACK_FROM, BACK_TO],
          [img, [{ transform: 'translate(0px, 0px) scale(1)', easing: TRAVEL }, { transform: `translate(${x + w / 2 - W / 2}px, ${y + h / 2 - H / 2}px) scale(${s})` }], BACK_FROM, BACK_TO],
          [veil, [{ opacity: 1 }, { opacity: 0 }], VEIL_FROM, BACK_TO],
          [lead.querySelector('.kodza-bento-scroll__tag'), [{ ...UP(10)[0], easing: SOFT }, UP(10)[1]], TAG_FROM, TAG_FROM + 0.12],
        ];
        // In the order they are read: from the top, and at the same height from the left
        others.map((cell) => [cell, within(cell)])
          .sort(([, a], [, b]) => (Math.abs(a.y - b.y) < 2 ? a.x - b.x : a.y - b.y))
          .forEach(([cell], i) => {
            const at = BOXES_FROM + i * BOX_STEP;
            const c = (s) => cell.querySelector(s);
            const add = (el, [from, to], start, end, easing = GLIDE) => tracks.push([el, [{ ...from, easing }, to], at + start, at + end]);
            add(cell, [{ opacity: 0, transform: `translateY(${BOX_LIFT}px)` }, { opacity: 1, transform: 'none' }], 0, BOX_SPAN, ARRIVE);
            add(c('.kodza-bento-scroll__media img'), [{ transform: 'scale(1.12)' }, { transform: 'none' }], 0, 0.3, SOFT);
            add(c('.kodza-bento-scroll__label'), RISE, 0.03, 0.2);
            add(c('.kodza-bento-scroll__name'), RISE, 0.05, 0.22);
            add(c('.kodza-bento-scroll__text'), UP(14), 0.07, 0.24, SOFT);
            add(c('.kodza-bento-scroll__tag'), UP(10), 0.1, 0.24, SOFT);
            if (figures.has(cell)) rollAt.set(cell, at + 0.02);
          });
        return tracks;
      };
      const pin = scrub(root, scene, signal, timeline, [head, lead]);

      // A figure rolls in time once its box has risen, and back once the box is scrolled under:
      // followed by the scroll, a digit stopped halfway would sit cut between two
      let rolls = new Map(); // a box → { up, animations }
      const unroll = () => {
        rolls.forEach(({ animations }) => animations.forEach((a) => a.cancel()));
        rolls = new Map();
      };
      const roll = () => {
        if (!root.classList.contains('is-live')) return;
        const p = pin.progress();
        rollAt.forEach((at, cell) => {
          let state = rolls.get(cell);
          if (!state) {
            const animations = figures.get(cell).map(({ strip, stop, rank }) => strip.animate(
              [{ transform: 'translateY(0)' }, { transform: `translateY(${-stop * DIGIT}em)` }],
              { duration: (ROLL + rank * ROLL_STEP) * pace, easing: ROLLED, fill: 'both' }
            ));
            animations.forEach((a) => a.pause());
            state = { up: false, animations };
            rolls.set(cell, state);
          }
          const up = p >= at;
          if (state.up === up) return;
          state.up = up;
          state.animations.forEach((a) => {
            a.playbackRate = up ? 1 : -2;
            a.play();
          });
        });
      };
      document.addEventListener('scroll', roll, { passive: true, capture: true, signal });

      let running = [];
      const stop = () => {
        running.forEach((a) => a.cancel());
        running = [];
      };
      // Every duration and delay of the entrance at the site's pace
      const animate = (el, keyframes, { duration, delay = 0, ...options }) => {
        if (el) running.push(el.animate(keyframes, { easing: GLIDE, fill: 'backwards', ...options, duration: duration * pace, delay: delay * pace }));
      };
      // Scrolling during the entrance hurries it, so the scroll takes over without a wait
      const hurry = () => {
        if (running.length && !root.classList.contains('is-live') && pin.progress() > 0) running.forEach((a) => a.updatePlaybackRate(4));
      };
      const play = async () => {
        await decoded(root);
        if (signal.aborted) return;
        played = true;
        stop();
        pin.stop();
        unroll();
        root.classList.remove('is-live');
        root.classList.add('is-shown');
        place();
        animate(photo, [{ clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)' }], { duration: OPEN });
        animate(img, [{ transform: 'scale(1.08)' }, { transform: 'none' }], { duration: SETTLE, easing: SOFT });
        [head, double].forEach((part) => part && playHead(part, animate, HEAD_AT));
        hurry();
        const entrance = running;
        Promise.all(entrance.map((a) => a.finished)).then(() => {
          if (entrance !== running || signal.aborted) return;
          root.classList.add('is-live');
          pin.start();
          roll();
        }, () => {});
      };

      document.addEventListener('scroll', hurry, { passive: true, capture: true, signal });
      // Tabbing into the grid scrolls to where every box shows
      list.addEventListener('focusin', (event) => {
        if (event.target.matches(':focus-visible')) pin.reveal(FOCUS_AT);
      }, { signal });
      const io = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        io.disconnect();
        play();
      }, { rootMargin: '0px 0px -15% 0px' });
      signal.addEventListener('abort', () => {
        io.disconnect();
        stop();
        unroll();
        win.remove();
        root.classList.remove('is-pinned', 'is-shown', 'is-live');
      });
      if (shown) {
        root.classList.add('is-shown', 'is-live');
        pin.start();
        roll();
      } else {
        Promise.all([document.fonts?.ready, decoded(root)]).then(() => {
          if (!signal.aborted) io.observe(root);
        });
      }
      return play;
    };

    // Not pinned: the head, then each box as it comes into view, as Bento Grid plays them
    const flat = (signal, shown) => {
      const parts = head ? [head, ...cells] : cells;
      root.classList.add('is-flat');
      let running = [];
      const track = (animation) => {
        running.push(animation);
        animation.onfinish = () => {
          running = running.filter((a) => a !== animation);
        };
      };
      const stop = () => {
        running.forEach((a) => a.cancel());
        running = [];
      };
      // The entrance of the head or of one box, `at` ms after the first one of its batch
      const play = (part, at) => {
        const animate = (el, keyframes, options) => {
          if (el) track(el.animate(keyframes, { easing: GLIDE, fill: 'backwards', ...options, duration: options.duration * pace, delay: (at + (options.delay || 0)) * pace }));
        };
        played = true;
        part.classList.add('is-shown');
        if (part === head) return playHead(part, animate);
        const c = (s) => part.querySelector(s);
        // The box opens from its top edge, its corners kept round all the way
        const round = getComputedStyle(part).borderTopLeftRadius;
        animate(part, [{ clipPath: `inset(0px 0px 100% 0px round ${round})` }, { clipPath: `inset(0px 0px 0px 0px round ${round})` }], { duration: BOX });
        animate(c('.kodza-bento-scroll__media img'), [{ transform: 'scale(1.12)' }, { transform: 'none' }], { duration: IMAGE });
        animate(c('.kodza-bento-scroll__label'), RISE, { duration: LABEL, delay: LABEL_AT });
        animate(c('.kodza-bento-scroll__name'), RISE, { duration: NAME, delay: NAME_AT });
        animate(c('.kodza-bento-scroll__text'), UP(14), { duration: TEXT, delay: TEXT_AT, easing: SOFT });
        animate(c('.kodza-bento-scroll__tag'), UP(10), { duration: TEXT, delay: TAG_AT, easing: SOFT });
        (figures.get(part) || []).forEach(({ strip, stop: landed, rank }) => animate(strip, [{ transform: 'translateY(0)' }, { transform: `translateY(${-landed * DIGIT}em)` }], { duration: ROLL + rank * ROLL_STEP, delay: ROLL_AT, easing: ROLLED }));
      };
      // What comes into view together plays in the order it is read: from the top, and at the same
      // height from the left
      const io = new IntersectionObserver((entries) => {
        let at = 0;
        entries.filter((entry) => entry.isIntersecting)
          .sort((a, b) => {
            const dy = a.boundingClientRect.top - b.boundingClientRect.top;
            return Math.abs(dy) < 2 ? a.boundingClientRect.left - b.boundingClientRect.left : dy;
          })
          .forEach(({ target }) => {
            io.unobserve(target);
            play(target, at);
            at += target === head ? HEAD_STEP : STEP;
          });
      }, { rootMargin: ENTER });
      // A box jumped past (End key, a link further down, a reload halfway) never crosses the screen,
      // so the observer never sees it: it is simply there when you scroll back up to it
      let ticking = false;
      const passed = () => {
        ticking = false;
        if (signal.aborted) return;
        parts.forEach((part) => {
          if (part.classList.contains('is-shown') || part.getBoundingClientRect().bottom > 0) return;
          io.unobserve(part);
          part.classList.add('is-shown');
        });
      };
      window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(passed);
      }, { passive: true, signal });
      const watch = () => {
        parts.forEach((part) => io.observe(part));
        passed();
      };
      signal.addEventListener('abort', () => {
        io.disconnect();
        stop();
        root.classList.remove('is-flat');
        parts.forEach((part) => part.classList.remove('is-shown'));
      });
      if (shown) parts.forEach((part) => part.classList.add('is-shown'));
      else {
        Promise.resolve(document.fonts?.ready).then(() => {
          if (!signal.aborted) watch();
        });
      }
      // Replayed: the boxes on screen play again now, the others wait to be scrolled to
      return () => {
        io.disconnect();
        stop();
        parts.forEach((part) => part.classList.remove('is-shown'));
        watch();
      };
    };

    // Pinned only if every box holds its text in the pinned grid: measured with the pinned layout
    // set for a moment, before anything is drawn
    const fits = () => {
      if (!picture || root.clientWidth < PIN_WIDTH || window.innerHeight < PIN_HEIGHT) return false;
      const was = root.classList.contains('is-pinned');
      root.classList.add('is-pinned');
      const ok = cells.every((cell) => cell.scrollHeight <= cell.clientHeight + 1);
      if (!was) root.classList.remove('is-pinned');
      return ok;
    };
    let mode = '';
    let current = null; // the running mode: its controller, and its replay
    const run = () => {
      const next = fits() ? 'pinned' : 'flat';
      if (next === mode) return;
      current?.controller.abort();
      mode = next;
      const controller = new AbortController();
      signal.addEventListener('abort', () => controller.abort(), { signal: controller.signal });
      current = { controller, replay: (next === 'pinned' ? pinned : flat)(controller.signal, played) };
    };
    let frame = 0;
    const again = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(run);
    };
    window.addEventListener('resize', again, { passive: true, signal });
    root.addEventListener('kodza:replay', () => current?.replay(), { signal });
    signal.addEventListener('abort', () => cancelAnimationFrame(frame));
    run();
    // The text set in its font may no longer fit
    Promise.resolve(document.fonts?.ready).then(() => {
      if (!signal.aborted) again();
    });
  }

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
