// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Scroll Path
// Draws one line through the steps of a section, up to the reading point: down beside each
// step, across to the next one in an S, then a ring around the button. The route is measured
// from the real blocks and redrawn whenever they change size. Three attributes lay it out:
// data-path-stop on each block the line visits, data-path-marker on the point it passes
// through (without one, the middle of the block's top edge: the line then runs behind the
// block, so give it a background) and data-path-ring on the element it ends around (in the
// last stop). The figures you can tune are the constants below; the look is in the CSS.
(() => {
  const SELECTOR = '.kodza-scroll-path';
  const READ = 0.6; // the reading point, down the screen: the line is drawn up to it
  const GLIDE = 0.12; // how much of the way the ink catches up each frame (1 = sticks to the scroll)
  const SPEED = 1600; // px of line a second, at most: a flick of the wheel is drawn, not jumped
  const CURVE = 0.5; // how round the swing between two stops is (share of the gap they leave)
  const RING_GAP = 8; // px between the button and its ring
  const RING_TIME = 900; // ms to draw the ring once the line reaches the button
  const SAMPLE = 6; // px of line between two measured points
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const pace = paceOf(root);
    // The still path: the whole line is drawn, every marker reached, the steps simply there.
    // The pace slows the pen and the ring (2 = half the speed)
    const still = reduceMotion || !pace;
    const stops = [...root.querySelectorAll('[data-path-stop]')];
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'kodza-scroll-path__svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const draw = (tag, className) => {
      const el = svg.appendChild(document.createElementNS(NS, tag));
      el.setAttribute('class', className);
      return el;
    };
    const track = draw('path', 'kodza-scroll-path__track');
    const ink = draw('path', 'kodza-scroll-path__ink');
    const pen = draw('circle', 'kodza-scroll-path__pen');
    pen.setAttribute('r', '4.5');
    root.prepend(svg);
    let route = null;
    let shown = 0;
    let ring = still ? 1 : 0;
    let frame = 0;
    let last = 0;

    // The reading point in the root's own pixels (a parent scaled by transform does not shift it).
    // Near the end of the page it slides to the bottom of the screen, so the last steps of a page
    // that cannot scroll them up to it are drawn too
    const reading = () => {
      const box = root.getBoundingClientRect();
      const left = document.documentElement.scrollHeight - scrollY - innerHeight;
      const end = Math.max(0, 1 - left / (innerHeight * (1 - READ)));
      return (innerHeight * (READ + (1 - READ) * end) - box.top) / (box.width / root.offsetWidth || 1);
    };

    const update = (now = performance.now()) => {
      frame = 0;
      if (signal.aborted || !route) return;
      const value = still ? route.line : route.lengthAt(reading());
      const dt = last ? Math.min(64, now - last) : 16;
      // The pen glides to the reading point, never faster than SPEED
      shown = still ? value : penStep(shown, value, dt, SPEED / pace, GLIDE);
      // The ring is played in time once the line reaches the button, and undone (a little faster)
      // when the reading point goes back above it
      const want = route.ring && shown >= route.line - 0.5 ? 1 : 0;
      if (!still && ring !== want) {
        const step = dt / (RING_TIME * pace);
        ring = want ? Math.min(1, ring + step) : Math.max(0, ring - step * 1.5);
      }
      const drawn = shown + inOut(ring) * route.ring;
      inkTo(ink, drawn, route.total);
      const tip = ink.getPointAtLength(drawn);
      pen.setAttribute('cx', tip.x.toFixed(1));
      pen.setAttribute('cy', tip.y.toFixed(1));
      pen.classList.toggle('is-away', still || drawn < 1 || ring === 1);
      const done = ring === 1 || (!route.ring && shown >= route.line - 0.5);
      stops.forEach((stop, i) => stop.classList.toggle('is-reached', i === stops.length - 1 && route.ring ? done : shown >= Math.max(route.marks[i] - 1, 0.5)));
      root.classList.toggle('is-complete', done);
      const moving = !still && (shown !== value || ring !== want);
      last = moving ? now : 0;
      if (moving) frame = requestAnimationFrame(update);
    };
    const schedule = () => (frame ||= requestAnimationFrame(update));

    // Measured again whenever a step changes size: the drawn line snaps to its new length
    const remeasure = () => {
      route = measure(root, stops, svg, track, ink);
      if (route && !still) shown = route.lengthAt(reading());
      schedule();
    };
    const ro = new ResizeObserver(remeasure);
    [root, ...stops, ...root.querySelectorAll('[data-path-ring]')].forEach((el) => ro.observe(el));
    signal.addEventListener('abort', () => {
      ro.disconnect();
      cancelAnimationFrame(frame);
    });

    if (!still && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-seen');
        io.unobserve(entry.target);
      }), { rootMargin: '0px 0px -10% 0px' });
      stops.forEach((stop) => io.observe(stop));
      signal.addEventListener('abort', () => io.disconnect());
      window.addEventListener('scroll', schedule, { passive: true, signal });
    } else stops.forEach((stop) => stop.classList.add('is-seen'));
    window.addEventListener('resize', schedule, { signal });
    route = measure(root, stops, svg, track, ink);
    if (route) shown = still ? route.line : route.lengthAt(reading());
    update();
  }

  // The route engine: where each stop is, the line through them, and how far along the line a
  // given height is (the line only ever goes down, so a height gives one length)
  function measure(root, stops, svg, track, ink) {
    const local = boxesIn(root);
    svg.setAttribute('width', root.offsetWidth);
    svg.setAttribute('height', root.offsetHeight);
    if (!stops.length) return null;
    const ringEl = stops[stops.length - 1].querySelector('[data-path-ring]') || (stops[stops.length - 1].matches('[data-path-ring]') ? stops[stops.length - 1] : null);
    let d = '';
    let ringD = '';
    let from = null;
    const anchors = stops.map((stop, i) => {
      const s = local(stop);
      const marker = stop.querySelector('[data-path-marker]');
      let point;
      if (i === stops.length - 1 && ringEl) {
        // The ring: the outline of the button, RING_GAP out, with its own corners (read, not assumed)
        const r = local(ringEl);
        const [L, T, R, B] = [r.x - RING_GAP, r.y - RING_GAP, r.x + r.w + RING_GAP, r.y + r.h + RING_GAP];
        const radius = parseFloat(getComputedStyle(ringEl).borderTopLeftRadius) || 0;
        const c = radius ? Math.min((B - T) / 2, (R - L) / 2, radius + RING_GAP) : 0;
        const x = (L + R) / 2;
        point = { x, y: T, top: T };
        ringD = ` H${R - c} A${c},${c} 0 0 1 ${R},${T + c} V${B - c} A${c},${c} 0 0 1 ${R - c},${B}`
          + ` H${L + c} A${c},${c} 0 0 1 ${L},${B - c} V${T + c} A${c},${c} 0 0 1 ${L + c},${T} H${x}`;
      } else if (marker) {
        const m = local(marker);
        point = { x: m.x + m.w / 2, y: m.y + m.h / 2, top: Math.min(s.y, m.y + m.h / 2) };
      } else point = { x: s.x + s.w / 2, y: s.y, top: s.y };
      if (!from) d = `M${point.x},${point.y}`;
      else {
        // An S with upright ends, across the gap the two stops leave
        const k = Math.max(0, point.top - from.y) * CURVE;
        d += ` C${from.x},${from.y + k} ${point.x},${point.top - k} ${point.x},${point.top}`;
        if (point.y > point.top) d += ` V${point.y}`;
      }
      // Down beside the stop, to its bottom edge, where the next swing starts
      if (i < stops.length - 1) {
        const bottom = Math.max(point.y, s.y + s.h);
        d += ` V${bottom}`;
        from = { x: point.x, y: bottom };
      }
      return point;
    });
    ink.setAttribute('d', d);
    const line = ink.getTotalLength();
    track.setAttribute('d', d + ringD);
    ink.setAttribute('d', d + ringD);
    const total = ink.getTotalLength();
    // The height of the line every SAMPLE px, kept rising
    const count = Math.max(1, Math.ceil(line / SAMPLE));
    const ys = [];
    for (let i = 0; i <= count; i += 1) ys.push(Math.max(ys[i - 1] ?? -Infinity, ink.getPointAtLength((line * i) / count).y));
    const lengthAt = (y) => {
      if (y <= ys[0]) return 0;
      if (y >= ys[count]) return line;
      let lo = 0;
      let hi = count;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (ys[mid] <= y) lo = mid;
        else hi = mid;
      }
      const span = ys[hi] - ys[lo];
      return ((lo + (span ? (y - ys[lo]) / span : 0)) * line) / count;
    };
    return { line, total, ring: total - line, lengthAt, marks: anchors.map((point) => lengthAt(point.y)) };
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
