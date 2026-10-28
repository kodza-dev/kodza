// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Carousel
// The row scrolls natively and snaps (that is the CSS). On top of it: buttons that turn a page
// and dim at the ends, a count that rolls, a progress bar that follows the scroll, dots with an
// ink pill that stretches to the next one, mouse dragging with a throw that glides onto a slide
// (a small spring, in requestAnimationFrame), arrow keys, labels and polite announcements, and
// an optional autoplay. The vertical wheel is never taken. Positions are measured in the row's
// own pixels, so a scaled parent does not shift them.
(() => {
  const SELECTOR = '.kodza-carousel';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const STIFF = 9; // how quickly a glide settles (per second)
  const THROW = 0.3; // how far a throw carries: this many seconds of its speed
  const PILL = 18; // the dot pill, in px
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const pad = (n) => String(n).padStart(2, '0');
  const fill = (template, values) => template.replace(/\{(\w+)\}/g, (_, key) => values[key]);
  const make = (tag, className) => Object.assign(document.createElement(tag), { className });
  // Where an element is right now, even mid-animation, to start its next move from there
  const now = (el, prop) => getComputedStyle(el)[prop];
  // Past an end, a drag meets more and more resistance
  const rubber = (d) => (d * 0.55 * 220) / (220 + d * 0.55);

  // Old number up, new one from below (the other way round when going back)
  const roll = (el, text, dir) => {
    const old = el.lastElementChild;
    if (old?.textContent === text) return;
    const next = Object.assign(document.createElement('span'), { textContent: text });
    el.append(next);
    if (!old) return;
    if (!dir || reduceMotion) return [...el.children].slice(0, -1).forEach((child) => child.remove());
    const timing = { duration: 520, easing: ease };
    const from = now(old, 'transform');
    old.getAnimations().forEach((a) => a.cancel());
    old.animate([{ transform: from }, { transform: `translateY(${-110 * dir}%)` }], { ...timing, fill: 'forwards' })
      .finished.then(() => old.remove(), () => {});
    next.animate([{ transform: `translateY(${110 * dir}%)` }, { transform: 'none' }], timing);
  };

  // A critically damped spring from `from` (moving at `velocity` px/s) to `to`. From rest it eases
  // in and out; thrown at omega × distance, it is a plain ease-out that keeps the hand's speed
  const spring = (from, to, velocity, omega, onFrame, onDone) => {
    const x0 = from - to;
    const b = velocity + omega * x0;
    const start = performance.now();
    let raf = 0;
    const state = { x: from, v: velocity, stop: () => cancelAnimationFrame(raf) };
    const step = (time) => {
      const t = Math.max(0, (time - start) / 1000);
      const decay = Math.exp(-omega * t);
      state.x = to + (x0 + b * t) * decay;
      state.v = (velocity - omega * b * t) * decay;
      const done = (Math.abs(state.x - to) < 1 && Math.abs(state.v) < 30) || t > 3;
      if (done) state.x = to;
      onFrame(state.x);
      if (done) onDone();
      else raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return state;
  };

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const viewport = root.querySelector('.kodza-carousel__viewport');
    const slides = viewport ? [...viewport.children].filter((el) => el.classList.contains('kodza-carousel__slide')) : [];
    if (!slides.length) return;
    const prev = root.querySelector('.kodza-carousel__prev');
    const next = root.querySelector('.kodza-carousel__next');
    const count = root.querySelector('.kodza-carousel__count');
    const progress = root.querySelector('.kodza-carousel__progress');
    const thumb = progress?.querySelector('.kodza-carousel__thumb');
    const dotsBox = root.querySelector('.kodza-carousel__dots');
    const total = slides.length;
    const text = {
      slide: root.dataset.slideLabel || '{n} of {total}',
      one: root.dataset.statusOne || 'Slide {from} of {total}',
      many: root.dataset.statusMany || 'Slides {from} to {to} of {total}',
      dot: root.dataset.dotLabel || 'Go to slide {n}',
      pause: root.dataset.pauseLabel || 'Pause autoplay',
      play: root.dataset.playLabel || 'Play autoplay',
    };

    slides.forEach((slide, i) => {
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', fill(text.slide, { n: i + 1, total }));
    });
    const status = make('span', 'kodza-carousel__status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    root.append(status);

    // The count: first and last slide in view, over the total
    let first = null;
    let last = null;
    if (count) {
      first = make('span', 'kodza-carousel__num');
      last = make('span', 'kodza-carousel__num');
      count.replaceChildren(first, Object.assign(make('span', 'kodza-carousel__dash'), { textContent: '–' }), last,
        Object.assign(make('span', 'kodza-carousel__total'), { textContent: `/ ${pad(total)}` }));
    }

    // Measured: where each slide lines up with the start, and what fits in view
    let stops = [0]; // scroll positions a slide can line up at
    let stopOf = []; // the stop of each slide
    let starts = [];
    let ends = [];
    let max = 0;
    let inset = 0;
    let column = 0;
    let scale = 1;
    const measure = () => {
      const box = viewport.getBoundingClientRect();
      scale = box.width / viewport.offsetWidth || 1;
      inset = parseFloat(getComputedStyle(viewport).paddingLeft) || 0;
      max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      column = viewport.clientWidth - inset * 2;
      const origin = viewport.scrollLeft - viewport.clientLeft;
      starts = [];
      ends = [];
      slides.forEach((slide) => {
        const r = slide.getBoundingClientRect();
        starts.push((r.left - box.left) / scale + origin);
        ends.push((r.right - box.left) / scale + origin);
      });
      stops = [];
      stopOf = starts.map((start) => {
        const at = clamp(start - inset, 0, max);
        if (!stops.length || at - stops[stops.length - 1] > 1) stops.push(at);
        return stops.length - 1;
      });
      root.classList.toggle('is-static', max < 1);
      if (thumb) thumb.style.width = `${Math.max(24, progress.clientWidth * Math.min(1, column / (column + max)))}px`;
    };
    const nearest = (x) => stops.reduce((best, stop, i) => (Math.abs(stop - x) < Math.abs(stops[best] - x) ? i : best), 0);
    // The slides fully in view at a scroll position
    const range = (x) => {
      let from = -1;
      let to = -1;
      starts.forEach((start, i) => {
        if (start >= x + inset - 2 && ends[i] <= x + inset + column + 2) {
          if (from < 0) from = i;
          to = i;
        }
      });
      if (from < 0) from = to = stopOf.indexOf(nearest(x));
      return { from, to };
    };

    // Moving the row: a glide, or a drag past an end that springs back
    let motion = null; // the running glide
    let aim = 0; // the stop it is heading to
    let pull = 0;
    let pulling = null;
    let stale = false; // resized while moving: measure again once it stops
    const setPull = (px) => {
      if (px === pull) return;
      pull = px;
      slides.forEach((slide) => { slide.style.translate = px ? `${px}px 0` : ''; });
    };
    // Snapping waits (is-gliding) until the glide and the spring back are both over
    const settle = () => {
      if (motion || pulling) return;
      root.classList.remove('is-gliding');
      if (stale) refresh();
      announce();
    };
    const halt = () => {
      if (!motion) return;
      motion.stop();
      motion = null;
      settle();
    };
    const glide = (to, velocity) => {
      to = clamp(to, 0, max);
      const from = motion ? motion.x : viewport.scrollLeft;
      if (reduceMotion || Math.abs(to - from) < 1) {
        motion?.stop();
        motion = null;
        viewport.scrollLeft = to;
        settle();
        return;
      }
      let v = velocity;
      let omega = STIFF;
      if (v === undefined) {
        // A button or a key: from rest, or from the speed of the glide it takes over
        v = motion ? motion.v : 0;
      } else if (Math.sign(v) === Math.sign(to - from)) {
        // A throw: keep the hand's speed and ease out from there
        omega = clamp(Math.abs(v / (to - from)), 7, 16);
      }
      motion?.stop();
      root.classList.add('is-gliding');
      motion = spring(from, to, v, omega, (x) => { viewport.scrollLeft = x; }, () => {
        motion = null;
        settle();
      });
    };
    const go = (i) => {
      aim = clamp(i, 0, stops.length - 1);
      glide(stops[aim]);
      render();
      restartClock();
    };
    const here = () => (motion ? aim : nearest(viewport.scrollLeft));

    // Buttons turn a page: the first slide after (or before) the ones in view
    const page = (dir) => {
      const { from, to } = range(motion ? stops[aim] : viewport.scrollLeft);
      const size = to - from + 1;
      const slide = clamp(dir > 0 ? to + 1 : from - size, 0, total - 1);
      return stopOf[slide];
    };
    // The arrow leaves on the side it points to and comes back from the other one
    const nudge = (button, dir) => {
      const icon = button.querySelector('svg');
      if (!icon || reduceMotion) return;
      icon.getAnimations().forEach((a) => a.cancel());
      icon.animate([
        { transform: 'none', easing: 'cubic-bezier(0.55, 0, 0.75, 0.2)' },
        { transform: `translateX(${dir * 30}px)`, offset: 0.42 },
        { transform: `translateX(${-dir * 30}px)`, offset: 0.4201, easing: ease },
        { transform: 'none' },
      ], { duration: 620 });
    };
    [[prev, -1], [next, 1]].forEach(([button, dir]) => {
      button?.addEventListener('click', () => {
        if (button.getAttribute('aria-disabled') === 'true') return;
        nudge(button, dir);
        go(page(dir));
      }, { signal });
    });

    // Dots, one per stop, and the ink pill over the current one
    let dots = [];
    let pill = null;
    let pillAt = -1;
    const clip = (i) => {
      const dot = dots[i];
      const c = dot.offsetLeft + dot.offsetWidth / 2;
      const y = (dotsBox.clientHeight - 6) / 2;
      return `inset(${y}px ${dotsBox.clientWidth - c - PILL / 2}px ${y}px ${c - PILL / 2}px round 3px)`;
    };
    const placePill = (i, animate) => {
      if (!pill || i === pillAt) return;
      const to = clip(i);
      const dir = Math.sign(i - pillAt);
      if (animate && pillAt >= 0 && !reduceMotion) {
        const from = now(pill, 'clipPath');
        // Halfway, the leading edge is nearly there and the trailing one has barely left
        const a = clip(pillAt).match(/[\d.-]+px/g).map(parseFloat);
        const b = to.match(/[\d.-]+px/g).map(parseFloat);
        const mid = dir > 0 ? [b[0], b[1] + (a[1] - b[1]) * 0.12, b[2], a[3] + (b[3] - a[3]) * 0.25]
          : [b[0], a[1] + (b[1] - a[1]) * 0.25, b[2], b[3] + (a[3] - b[3]) * 0.12];
        pill.getAnimations().forEach((anim) => anim.cancel());
        pill.animate([
          { clipPath: from },
          { clipPath: `inset(${mid.map((v) => `${v}px`).join(' ')} round 3px)`, offset: 0.5 },
          { clipPath: to },
        ], { duration: 560, easing: 'cubic-bezier(0.45, 0, 0.2, 1)' });
      }
      pill.style.clipPath = to;
      pillAt = i;
      dots.forEach((dot, k) => (k === i ? dot.setAttribute('aria-current', 'true') : dot.removeAttribute('aria-current')));
    };
    const buildDots = () => {
      if (!dotsBox || dots.length === stops.length) return;
      dots = stops.map((_, i) => {
        const dot = make('button', 'kodza-carousel__dot');
        dot.type = 'button';
        dot.setAttribute('aria-label', fill(text.dot, { n: stopOf.indexOf(i) + 1, total }));
        dot.addEventListener('click', () => go(i), { signal });
        return dot;
      });
      pill = make('span', 'kodza-carousel__pill');
      pill.setAttribute('aria-hidden', 'true');
      pillAt = -1;
      dotsBox.replaceChildren(...(toggle ? [toggle] : []), ...dots, pill);
    };
    if (dotsBox) {
      dotsBox.setAttribute('role', 'group');
      dotsBox.setAttribute('aria-label', root.dataset.dotsLabel || 'Choose a slide');
    }

    // What the screen reader hears once the row comes to rest (not when the focus moved it: the
    // slide's own label is read then)
    let said = '';
    let sayTimer = 0;
    const message = ({ from, to }) => (from === to ? fill(text.one, { from: from + 1, total }) : fill(text.many, { from: from + 1, to: to + 1, total }));
    const announce = () => {
      clearTimeout(sayTimer);
      sayTimer = setTimeout(() => {
        if (motion || drag || pulling) return; // it speaks when it settles
        const words = message(range(viewport.scrollLeft));
        if (words === said) return;
        said = words;
        if (playing() || viewport.contains(document.activeElement) && document.activeElement !== viewport) return;
        status.textContent = words;
      }, 450);
    };

    // Everything that follows the scroll. The bar follows it to the pixel; the count, the dots and
    // the buttons say where it is heading (the stop it glides to, or the nearest one), so they
    // change once, as it leaves, rather than catching up with it
    let frame = 0;
    let shown = { from: -1, to: -1 };
    const render = (animate = true) => {
      frame = 0;
      const x = viewport.scrollLeft;
      if (thumb) {
        const room = progress.clientWidth - thumb.offsetWidth;
        thumb.style.transform = `translateX(${max > 0 ? (x / max) * room : 0}px)`;
      }
      const stop = motion ? aim : nearest(x);
      const at = stops[stop];
      if (prev) prev.setAttribute('aria-disabled', String(at <= 1));
      if (next) next.setAttribute('aria-disabled', String(at >= max - 1));
      placePill(stop, animate);
      const view = range(at);
      if (view.from !== shown.from || view.to !== shown.to) {
        const dir = animate ? Math.sign(view.from - shown.from || view.to - shown.to) : 0;
        if (count) {
          count.classList.toggle('is-single', view.from === view.to);
          roll(first, pad(view.from + 1), dir);
          roll(last, pad(view.to + 1), dir);
        }
        if (!animate) said = message(view);
        else announce();
        shown = view;
      }
    };
    viewport.addEventListener('scroll', () => {
      if (!frame) frame = requestAnimationFrame(() => render());
    }, { signal, passive: true });

    // Mouse dragging; touch, pen and trackpads scroll natively
    let drag = null;
    let dragged = false;
    viewport.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'mouse' || event.button !== 0 || max < 1) return;
      if (event.target.closest('input, textarea, select, [contenteditable]')) return;
      // Caught while gliding: it stops under the hand, and letting go settles it like a drag
      const caught = !!(motion || pulling);
      motion?.stop();
      pulling?.stop();
      motion = null;
      pulling = null;
      if (caught) {
        root.classList.add('is-dragging');
        try { viewport.setPointerCapture(event.pointerId); } catch {}
      }
      drag = { id: event.pointerId, x: event.clientX, left: viewport.scrollLeft - pull, start: viewport.scrollLeft, moved: caught, trail: [] };
    }, { signal });
    window.addEventListener('pointermove', (event) => {
      if (!drag || event.pointerId !== drag.id) return;
      const dx = (event.clientX - drag.x) / scale;
      if (!drag.moved) {
        if (Math.abs(dx) < 6) return;
        // Starts from here, so the row does not jump by the threshold
        drag.moved = true;
        drag.x = event.clientX;
        root.classList.add('is-dragging');
        window.getSelection()?.removeAllRanges();
        try { viewport.setPointerCapture(event.pointerId); } catch {}
        return;
      }
      const left = drag.left - dx;
      viewport.scrollLeft = clamp(left, 0, max);
      setPull(left < 0 ? rubber(-left) : left > max ? -rubber(left - max) : 0);
      drag.trail.push([event.timeStamp, left]);
      while (drag.trail.length > 2 && event.timeStamp - drag.trail[0][0] > 90) drag.trail.shift();
    }, { signal });
    const release = (event) => {
      if (!drag || event.pointerId !== drag.id) return;
      const { moved, trail, start } = drag;
      drag = null;
      if (!moved) {
        if (stale) refresh();
        return;
      }
      // Snapping stays off in between: it would catch the row before the glide starts
      root.classList.add('is-gliding');
      root.classList.remove('is-dragging');
      dragged = true;
      setTimeout(() => { dragged = false; });
      // The speed of the last moments; none if the hand stopped before letting go
      const [t0, x0] = trail[0] || [0, 0];
      const [t1, x1] = trail[trail.length - 1] || [0, 0];
      const velocity = t1 > t0 && event.timeStamp - t1 < 60 ? ((x1 - x0) / (t1 - t0)) * 1000 : 0;
      if (pull && reduceMotion) setPull(0);
      else if (pull) {
        pulling = spring(pull, 0, 0, 13, setPull, () => {
          pulling = null;
          settle();
        });
      }
      const x = viewport.scrollLeft;
      let i = nearest(x + velocity * THROW);
      // A deliberate drag always turns at least one slide
      const before = nearest(start);
      if (i === before && Math.abs(x - start) > 40) i = clamp(before + Math.sign(x - start), 0, stops.length - 1);
      aim = i;
      glide(stops[i], velocity);
      settle();
      render();
      restartClock();
    };
    window.addEventListener('pointerup', release, { signal });
    window.addEventListener('pointercancel', release, { signal });
    // A drag is not a click on the card under it, and pictures and links are not dragged away
    viewport.addEventListener('click', (event) => {
      if (!dragged) return;
      event.preventDefault();
      event.stopPropagation();
    }, { signal, capture: true });
    viewport.addEventListener('dragstart', (event) => event.preventDefault(), { signal });

    // A sideways wheel or a finger takes over from a glide; the vertical wheel is left alone
    viewport.addEventListener('wheel', (event) => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) halt();
    }, { signal, passive: true });
    viewport.addEventListener('touchstart', halt, { signal, passive: true });
    viewport.addEventListener('focusin', (event) => { if (event.target !== viewport) halt(); }, { signal });

    // Arrow keys, Home and End when the row itself has the focus
    viewport.addEventListener('keydown', (event) => {
      if (event.target !== viewport || event.altKey || event.ctrlKey || event.metaKey) return;
      const to = { ArrowLeft: here() - 1, ArrowRight: here() + 1, Home: 0, End: stops.length - 1 }[event.key];
      if (to === undefined) return;
      event.preventDefault();
      go(to);
    }, { signal });

    // Autoplay, only when asked: stops while pointed at or focused, and under a pause button
    const delay = parseFloat(root.dataset.autoplay);
    let toggle = null;
    let clock = null;
    let wanted = false;
    let hover = false;
    let focus = false;
    let seen = true;
    const playing = () => !!clock && wanted && !hover && !focus && seen && !document.hidden;
    const sync = () => {
      if (!clock) return;
      if (playing()) clock.play();
      else clock.pause();
      status.setAttribute('aria-live', playing() ? 'off' : 'polite');
      toggle.classList.toggle('is-paused', !wanted);
      toggle.setAttribute('aria-label', wanted ? text.pause : text.play);
    };
    function restartClock() {
      if (!clock) return;
      clock.currentTime = 0;
      sync();
    }
    if (delay > 0) {
      toggle = make('button', 'kodza-carousel__toggle');
      toggle.type = 'button';
      toggle.innerHTML = '<svg class="kodza-carousel__ring" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19.25" pathLength="1"/></svg>'
        + '<svg class="kodza-carousel__pause" viewBox="0 0 16 16" aria-hidden="true"><rect x="4" y="3" width="2.6" height="10" rx="1"/><rect x="9.4" y="3" width="2.6" height="10" rx="1"/></svg>'
        + '<svg class="kodza-carousel__play" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.4v9.2a.6.6 0 0 0 .9.5l7.4-4.6a.6.6 0 0 0 0-1L5.9 2.9a.6.6 0 0 0-.9.5z"/></svg>';
      const controls = root.querySelector('.kodza-carousel__controls');
      if (controls) controls.insertBefore(toggle, prev || next || null);
      else if (!dotsBox) viewport.after(toggle);
      clock = toggle.querySelector('circle').animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: delay, fill: 'forwards' });
      clock.pause();
      clock.onfinish = () => {
        if (signal.aborted) return;
        go(here() >= stops.length - 1 ? 0 : here() + 1);
      };
      wanted = !reduceMotion;
      toggle.addEventListener('click', () => {
        wanted = !wanted;
        // Pressing play means it: play now, even with the pointer or the focus still here
        hover = false;
        focus = false;
        sync();
      }, { signal });
      root.addEventListener('pointerenter', (event) => { if (event.pointerType === 'mouse') { hover = true; sync(); } }, { signal });
      root.addEventListener('pointerleave', () => { hover = false; sync(); }, { signal });
      // Keyboard focus only: a click on a button is not a reason to stop for good
      root.addEventListener('focusin', (event) => {
        if (event.target.matches(':focus-visible')) { focus = true; sync(); }
      }, { signal });
      root.addEventListener('focusout', (event) => {
        if (!root.contains(event.relatedTarget)) { focus = false; sync(); }
      }, { signal });
      document.addEventListener('visibilitychange', sync, { signal });
      const onScreen = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; sync(); });
      onScreen.observe(root);
      signal.addEventListener('abort', () => { onScreen.disconnect(); clock.cancel(); });
    }

    function refresh() {
      stale = false;
      measure();
      buildDots();
      render(false);
    }
    refresh();
    if (clock) sync();
    const resize = new ResizeObserver(() => {
      if (drag || motion) stale = true;
      else refresh();
    });
    resize.observe(viewport);

    signal.addEventListener('abort', () => {
      resize.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(sayTimer);
      motion?.stop();
      pulling?.stop();
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
