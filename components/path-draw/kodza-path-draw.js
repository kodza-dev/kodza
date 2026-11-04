// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Path Draw
// Any SVG drawn with strokes, put inside, draws itself as if someone drew it in front of you:
// stroke by stroke in the order of the markup, at a pen's steady speed (a stroke lasts as long
// as it is long on screen), lifting the pen between two strokes, then its fills come in. On
// entering the screen, once (the default), or tied to the scroll with data-draw="scroll" (it
// undraws when you scroll back). `kodza:replay` on the root draws it again. The figures you can
// tune are the constants below; the colour and the fills are in the CSS.
(() => {
  const SELECTOR = '.kodza-path-draw';
  const SPEED = 520; // px of stroke a second, on screen
  const RAMP = 160; // ms the pen takes to reach that speed, and to stop at the end of a stroke
  const LIFT = 160; // ms the pen is lifted between two strokes
  const START = 0.9; // tied to the scroll: nothing is drawn while its top is below this share of the screen…
  const END = 0.45; // …and everything once its middle is above this one
  const GLIDE = 0.14; // tied to the scroll: how much of the way the pen catches up each frame
  const FOLLOW = 3; // tied to the scroll: how much faster than SPEED the pen may catch up
  const SHAPES = 'path, line, polyline, polygon, circle, ellipse, rect'; // what draws, when it has a stroke
  const BORROWED = 'defs, clipPath, mask, symbol, marker, pattern'; // shapes inside these are not drawn
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  // How far a hand is along a stroke `time` ms long, `t` ms in (0 to 1): it picks up speed over
  // `ramp` ms, runs at a steady speed, and slows down over the last `ramp` ms
  const hand = (t, time, ramp) => {
    const r = Math.min(ramp, time / 2);
    const run = time - r; // the length, in ms at full speed
    if (t <= 0) return 0;
    if (t >= time) return 1;
    if (t < r) return (t * t) / (2 * r) / run;
    if (t <= time - r) return (t - r / 2) / run;
    return 1 - (time - t) ** 2 / (2 * r) / run;
  };

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const pace = paceOf(root);
    // The still path: drawn and filled at once. The pace slows the pen (2 = half the speed)
    const still = reduceMotion || !pace;
    const scrolled = root.dataset.draw === 'scroll';
    const strokes = [...root.querySelectorAll(SHAPES)]
      .filter((el) => !el.closest(BORROWED) && getComputedStyle(el).stroke !== 'none')
      .map((el) => ({ el, units: parseFloat(el.getAttribute('pathLength')) || el.getTotalLength() }));
    const fill = (on) => root.classList.toggle('is-filled', on);
    if (still || !strokes.length) {
      fill(true);
      return;
    }

    // The timeline, in ms: each stroke lasts its length on screen at SPEED, a lift between two
    let total = 0;
    const time = () => {
      total = 0;
      strokes.forEach((stroke, i) => {
        const m = stroke.el.getCTM(); // the stroke's scale, inside the svg (viewBox and transforms)
        const px = stroke.el.getTotalLength() * (m ? Math.hypot(m.a, m.b) : 1);
        stroke.start = total + (i ? LIFT * pace : 0);
        stroke.time = Math.max((px / SPEED) * 1000 * pace, 1) + RAMP * pace; // the ramps on top of the run
        total = stroke.start + stroke.time;
      });
    };

    // The drawing at `t` ms of its timeline: the strokes before it down (their own dashes back),
    // the one under the pen inked by its length, the next ones not started, the fills at the end
    let shown = -1;
    const render = (t) => {
      if (t === shown) return;
      shown = t;
      strokes.forEach((stroke) => {
        const u = hand(t - stroke.start, stroke.time, RAMP * pace);
        if (u < 1) inkTo(stroke.el, u * stroke.units, stroke.units);
        else stroke.el.style.strokeDasharray = stroke.el.style.visibility = '';
      });
      fill(t >= total);
    };

    let frame = 0;
    signal.addEventListener('abort', () => cancelAnimationFrame(frame));

    // Tied to the scroll: the drawing follows where it sits on the screen, the pen gliding after it
    let target = 0;
    let last = 0;
    const place = () => {
      const box = root.getBoundingClientRect();
      const from = window.innerHeight * START; // its top there: nothing drawn
      const to = window.innerHeight * END - box.height / 2; // its top there: all drawn
      target = Math.min(Math.max((from - box.top) / (from - to), 0), 1) * total;
    };
    const follow = (now) => {
      const dt = Math.min(now - last, 50);
      last = now;
      render(penStep(shown, target, dt, FOLLOW * 1000, GLIDE));
      frame = shown === target ? 0 : requestAnimationFrame(follow);
    };
    const kick = () => {
      place();
      if (frame || shown === target) return;
      last = performance.now();
      frame = requestAnimationFrame(follow);
    };

    // On entering the screen: the pen starts once, from the first stroke. At the foot of a page
    // the drawing may never get that far up: once the page goes no further down, a drawing in
    // full view starts
    let seen = null;
    const wait = new AbortController();
    signal.addEventListener('abort', () => wait.abort());
    const play = () => {
      seen?.disconnect();
      wait.abort();
      cancelAnimationFrame(frame);
      const begin = performance.now();
      const tick = (now) => {
        render(Math.min(now - begin, total));
        frame = shown < total ? requestAnimationFrame(tick) : 0;
      };
      render(0);
      frame = requestAnimationFrame(tick);
    };

    time();
    if (scrolled) {
      place();
      render(target);
      window.addEventListener('scroll', kick, { passive: true, signal });
      window.addEventListener('resize', kick, { passive: true, signal });
    } else {
      render(0);
      seen = new IntersectionObserver((entries) => entries.some((entry) => entry.isIntersecting) && play(), {
        rootMargin: '0px 0px -15% 0px',
        threshold: 0.6,
      });
      seen.observe(root);
      signal.addEventListener('abort', () => seen.disconnect());
      const foot = () => {
        const box = root.getBoundingClientRect();
        const end = document.documentElement.scrollHeight - innerHeight - scrollY <= 1;
        if (end && box.height && box.top >= 0 && box.bottom <= innerHeight) play();
      };
      window.addEventListener('scroll', foot, { passive: true, signal: wait.signal });
      foot(); // a page too short to scroll never sends a scroll event
      root.addEventListener('kodza:replay', play, { signal });
    }

    // A new size changes how long each stroke is on screen (the pen's timing) and where it sits
    const resized = new ResizeObserver(() => {
      const done = shown >= total;
      time();
      if (scrolled) kick();
      else if (done) render(total);
    });
    resized.observe(root);
    signal.addEventListener('abort', () => resized.disconnect());
  }

  // ---------- Pen engine: the same block in Scroll Path, Path Draw and Annotation Arrow ----------
  // Boxes measured in a root's own pixels, a line inked by its length (stroke-dasharray: the `d`
  // of a path is never animated, Safari would not play it) and a pen that moves along it at a
  // steady speed. Nothing in it knows the component around it
  const NS = 'http://www.w3.org/2000/svg';
  const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  // Where an element sits in `root`, in the root's own pixels: a parent scaled by transform (a
  // thumbnail, a theme) does not shift the drawing
  const boxesIn = (root) => {
    const box = root.getBoundingClientRect();
    const scale = box.width / root.offsetWidth || 1;
    return (el) => {
      const r = el.getBoundingClientRect();
      return { x: (r.left - box.left) / scale, y: (r.top - box.top) / scale, w: r.width / scale, h: r.height / scale };
    };
  };
  // Inks a shape up to `length` px along its outline (`total` px long)
  const inkTo = (el, length, total) => {
    el.style.strokeDasharray = `${length.toFixed(1)} ${Math.ceil(total + 2)}`;
    el.style.visibility = length > 0.5 ? '' : 'hidden';
  };
  // One frame of the pen (`dt` ms): from `shown` towards `target`, at most `speed` px a second,
  // a little faster when it lifts the ink off. `glide` eases it in (1: a steady speed)
  const penStep = (shown, target, dt, speed, glide = 1) => {
    const cap = ((speed * dt) / 1000) * (target < shown ? 1.5 : 1);
    const next = shown + Math.sign(target - shown) * Math.min(Math.abs(target - shown) * glide, cap);
    return Math.abs(target - next) < 0.5 ? target : next;
  };
  // ---------- End of the pen engine ----------


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
