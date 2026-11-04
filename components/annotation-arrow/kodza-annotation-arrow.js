// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Annotation Arrow
// A note that draws a hand-drawn arrow to the real thing it is about: data-target is a CSS
// selector, and the closest match around the note is the target. The script works out the curve
// between the two boxes, bows it out on the side where it crosses neither, and draws it when the
// note enters the screen: the note is written, then the line, then its tip. It redraws itself
// when the layout moves (a new width, a font that loads, the note put under its target on a
// phone). data-mark="ring" circles the target instead, in the same stroke as the line.
// `kodza:replay` on the root draws it again. The figures you can tune are the constants below;
// the colour, the line and the note are in the CSS.
(() => {
  const SELECTOR = '.kodza-annotation-arrow';
  const SPEED = 460; // px of line a second
  const WRITE = 340; // px of note a second, written from left to right
  const RAMP = 160; // ms the pen takes to reach its speed, and to stop
  const LIFT = 150; // ms between the note, the line and its tip
  const GAP = 10; // px of air between the line and the boxes it joins
  const BEND = 0.3; // how far the line bows out, as a share of its length…
  const BOW = [16, 110]; // …kept between these, in px
  const TIP = [12, 9.5]; // px, the two strokes of the tip…
  const TIP_ANGLE = 28; // …and their angle to the line, in degrees
  const RING = [10, 10]; // px the ring stands off the target, at its sides and above and below…
  const CLEAR = 2; // …and the least it keeps off the target's corners, leaning and closing in
  const ROOM = 16; // px the line may run past the note and the target before it counts as a detour
  const TURN = 1.1; // turns of the ring: a hand closes it a little past where it started
  const TILT = -4; // degrees the ring leans
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

  // A little plane geometry: points, the middle of a box, a box's edge and the ring around one
  const pt = (x, y) => ({ x, y });
  const along = (a, b, k) => pt(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k);
  const middle = (box) => pt(box.x + box.w / 2, box.y + box.h / 2);
  const turn = (x, y, a) => pt(x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a));
  const fixed = (p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  // Where the ray from the middle of `box` towards `to` comes out of it, `gap` px past its edge
  const edge = (box, to, gap) => {
    const c = middle(box);
    const dx = to.x - c.x || 1e-6;
    const dy = to.y - c.y || 1e-6;
    const k = Math.min((box.w / 2 + gap) / Math.abs(dx), (box.h / 2 + gap) / Math.abs(dy));
    return pt(c.x + dx * k, c.y + dy * k);
  };
  // The ring around `box`: an oval a little wider than it, leaning by TILT, that a hand opens a
  // little wide and closes a little tight. `touch(p, shift)` is where a line from p runs into it
  // (the point facing p, `shift` radians round), which way it then goes round and the way it is
  // heading there (`t`), `loop` the ring drawn from there, `inside(p, size)` whether p falls in
  // it (grown by `size`),
  // `box` the box it fills
  const ringOf = (box) => {
    const c = middle(box);
    const lean = (TILT * Math.PI) / 180;
    const OPEN = 1.06; // the ring's first point, as a share of its size…
    const SHUT = 0.96; // …and its last
    // Grown as a whole until the target's corners, turned with its lean, stay CLEAR px inside it
    // where the hand closes it tightest: a long word would cut through its ends otherwise
    const base = [box.w / 2 + RING[0], (box.h / 2) * 1.3 + RING[1]];
    const corners = [1, -1].map((side) => turn(box.w / 2 + CLEAR, side * (box.h / 2 + CLEAR), -lean));
    const grow = Math.max(1, ...corners.map((q) => Math.hypot(q.x / base[0], q.y / base[1]) / SHUT));
    const rx = base[0] * grow;
    const ry = base[1] * grow;
    const at = (angle, grow = 1) => {
      const p = turn(Math.cos(angle) * rx * grow, Math.sin(angle) * ry * grow, lean);
      return pt(c.x + p.x, c.y + p.y);
    };
    // p in the ring's own frame, where it is a circle of radius 1
    const unit = (p) => {
      const q = turn(p.x - c.x, p.y - c.y, -lean);
      return pt(q.x / rx, q.y / ry);
    };
    const touch = (p, shift) => {
      const u = unit(p);
      const angle = Math.atan2(u.y, u.x) + shift;
      // Round the way the line from p is heading when it gets there
      const v = pt(Math.cos(angle) * OPEN - u.x, Math.sin(angle) * OPEN - u.y);
      const dir = Math.sign(v.y * Math.cos(angle) - v.x * Math.sin(angle)) || 1;
      const t = turn(-Math.sin(angle) * rx * dir, Math.cos(angle) * ry * dir, lean);
      const size = Math.hypot(t.x, t.y) || 1;
      return { p: at(angle, OPEN), angle, dir, t: pt(t.x / size, t.y / size) };
    };
    const loop = (angle, dir) => {
      const steps = Math.ceil(48 * TURN);
      return Array.from({ length: steps + 1 }, (_, i) => at(angle + (dir * 2 * Math.PI * TURN * i) / steps, OPEN + ((SHUT - OPEN) * i) / steps));
    };
    const inside = (p, size = 1) => {
      const u = unit(p);
      return u.x ** 2 + u.y ** 2 < size ** 2;
    };
    return { touch, loop, inside, box: { x: c.x - rx, y: c.y - ry, w: 2 * rx, h: 2 * ry } };
  };
  // A smooth path through points (Catmull-Rom, written as cubic curves)
  const through = (points) => {
    let d = '';
    for (let i = 0; i < points.length - 1; i += 1) {
      const [a, b, c, e] = [points[i - 1] || points[i], points[i], points[i + 1], points[i + 2] || points[i + 1]];
      d += ` C ${fixed(pt(b.x + (c.x - a.x) / 6, b.y + (c.y - a.y) / 6))} ${fixed(pt(c.x - (e.x - b.x) / 6, c.y - (e.y - b.y) / 6))} ${fixed(c)}`;
    }
    return d;
  };

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const note = root.querySelector('.kodza-annotation-arrow__note');
    const selector = root.dataset.target;
    const match = (el) => {
      try {
        return el.querySelector(selector);
      } catch {
        return null; // a selector that does not parse points at nothing
      }
    };
    // The closest match around the note: one note per button, as many as the page has
    let scope = root.parentElement;
    while (selector && scope && !match(scope)) scope = scope.parentElement;
    const target = scope && match(scope);
    if (!note || !target) return;
    const pace = paceOf(root);
    // The still path: drawn at once (and still redrawn when the layout moves). The pace slows the pen
    const still = reduceMotion || !pace;
    const ringed = root.dataset.mark === 'ring';

    // The drawing, in an svg laid at the root's corner and counted in the root's own pixels: the
    // line (and the ring, in the same stroke) and the tip
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'kodza-annotation-arrow__svg');
    svg.setAttribute('aria-hidden', 'true');
    const draw = (name) => {
      const el = svg.appendChild(document.createElementNS(NS, 'path'));
      el.setAttribute('class', `kodza-annotation-arrow__${name}`);
      return el;
    };
    const line = draw('line');
    const tip = ringed ? null : draw('tip');
    root.prepend(svg);

    // The curve from `from` to `to`, bowed out on `side` (1 or -1): it leaves at a slant and
    // comes in almost straight, like a hand that aims at the end
    const bowed = (from, to, side) => {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const length = Math.hypot(dx, dy) || 1;
      const bow = Math.min(Math.max(length * BEND, BOW[0]), BOW[1]) * side;
      const a = along(from, to, 0.28);
      const b = along(from, to, 0.72);
      return [pt(a.x - (dy / length) * bow, a.y + (dx / length) * bow), pt(b.x - (dy / length) * bow * 0.4, b.y + (dx / length) * bow * 0.4)];
    };
    const bezier = (p, k) => {
      const s = 1 - k;
      const w = [s * s * s, 3 * s * s * k, 3 * s * k * k, k * k * k];
      return pt(p.reduce((sum, q, i) => sum + q.x * w[i], 0), p.reduce((sum, q, i) => sum + q.y * w[i], 0));
    };
    const within = (box, p) => p.x > box.x - 2 && p.x < box.x + box.w + 2 && p.y > box.y - 2 && p.y < box.y + box.h + 2;

    // The geometry, from where the note and the target are now. Each way the line can go (bowed
    // to one side or the other, and for the ring, joining it at the point that faces the note or
    // a little round either way) is tried: the
    // one that crosses neither box wins, then the one that takes no detour around them, then
    // (for an arrow) the one that bows upwards like a thrown line, then the shorter one
    const solve = () => {
      const at = boxesIn(root);
      const corner = at(svg);
      const local = (el) => {
        const box = at(el);
        return { x: box.x - corner.x, y: box.y - corner.y, w: box.w, h: box.h };
      };
      const from = local(note);
      const to = local(target);
      const ring = ringed && ringOf(to);
      const apart = from.x > to.x + to.w + GAP || to.x > from.x + from.w + GAP || from.y > to.y + to.h + GAP || to.y > from.y + from.h + GAP;
      line.setAttribute('d', '');
      tip?.setAttribute('d', '');
      if (!apart) return from; // a note on its target: nothing to point at

      const reach = ring ? ring.box : to;
      const left = Math.min(from.x, reach.x) - ROOM;
      const right = Math.max(from.x + from.w, reach.x + reach.w) + ROOM;
      const top = Math.min(from.y, reach.y) - ROOM;
      const bottom = Math.max(from.y + from.h, reach.y + reach.h) + ROOM;
      const ways = [];
      (ring ? [1] : [1, -1]).forEach((side) => (ring ? [-0.6, -0.3, 0, 0.3, 0.6] : [0]).forEach((shift) => {
        // The line comes into the target GAP px out of it, aimed at its middle, or swings into the
        // ring along it in a single bend, so the two read as one stroke
        const land = (toward) => (ring ? ring.touch(toward, shift) : { p: edge(to, toward, GAP) });
        const aim = (start, end) => {
          if (!ring) return bowed(start, end.p, side);
          const reach = Math.min(Math.max(Math.hypot(end.p.x - start.x, end.p.y - start.y) * 0.25, 20), 56);
          const join = pt(end.p.x - end.t.x * reach, end.p.y - end.t.y * reach);
          return [along(start, join, 0.45), join];
        };
        let start = edge(from, middle(to), GAP);
        let end = land(middle(from));
        let bend = aim(start, end);
        for (let i = 0; i < 3; i += 1) {
          start = edge(from, bend[0], GAP);
          end = land(ring ? start : bend[1]);
          bend = aim(start, end);
        }
        const curve = [start, bend[0], bend[1], end.p];
        let cost = 0;
        for (let k = 1; k < 40; k += 1) {
          const p = bezier(curve, k / 40);
          // Into the ring, the line keeps clear of it until its last stretch, where it joins it
          if (within(from, p) || (ring ? ring.inside(p, k < 34 ? 1.25 : 1) : within(to, p))) cost += 1;
          else if (p.x < left || p.x > right || p.y < top || p.y > bottom) cost += 0.25;
        }
        // An arrow bows upwards, like a thrown line. Then the shorter way
        const bulge = bezier(curve, 0.5);
        if (!ring && bulge.y > (start.y + end.p.y) / 2 + 1) cost += 0.5;
        cost += Math.hypot(end.p.x - start.x, end.p.y - start.y) / 4000;
        ways.push({ curve, end, cost });
      }));
      const way = ways.reduce((best, next) => (next.cost < best.cost ? next : best));
      const [start, b1, b2, end] = way.curve;
      let d = `M ${fixed(start)} C ${fixed(b1)} ${fixed(b2)} ${fixed(end)}`;
      if (ring) d += through(ring.loop(way.end.angle, way.end.dir));
      line.setAttribute('d', d);
      if (tip) {
        // Two short strokes back from the end, either side of the way the line came in
        const length = Math.hypot(end.x - b2.x, end.y - b2.y) || 1;
        const back = (deg, size) => {
          const p = turn(((b2.x - end.x) / length) * size, ((b2.y - end.y) / length) * size, (deg * Math.PI) / 180);
          return pt(end.x + p.x, end.y + p.y);
        };
        tip.setAttribute('d', `M ${fixed(back(TIP_ANGLE, TIP[0]))} L ${fixed(end)} L ${fixed(back(-TIP_ANGLE, TIP[1]))}`);
      }
      return from;
    };

    // The timeline, in ms: the note written at WRITE, then each stroke at SPEED, a lift between
    let parts = [];
    let write = 0;
    let total = 0;
    const time = (from) => {
      write = Math.max((from.w / WRITE) * 1000 * pace, 1);
      let clock = write;
      parts = [line, tip].filter(Boolean).map((el) => {
        const units = el.getAttribute('d') ? el.getTotalLength() : 0;
        const start = clock + LIFT * pace;
        const span = Math.max((units / SPEED) * 1000 * pace, 1) + RAMP * pace;
        clock = start + span;
        return { el, units, start, span };
      });
      total = clock;
    };

    // The drawing at `t` ms of its timeline: the note written up to the pen, the strokes before it
    // down, the one under it inked by its length, the next ones not started
    let shown = 0;
    const render = (t) => {
      shown = t;
      root.style.setProperty('--kz-annotation-arrow-written', hand(t, write, RAMP * pace).toFixed(3));
      parts.forEach((part) => {
        const u = hand(t - part.start, part.span, RAMP * pace);
        if (u < 1) inkTo(part.el, u * part.units, part.units);
        else part.el.style.strokeDasharray = part.el.style.visibility = '';
      });
    };

    let frame = 0;
    let queued = 0;
    signal.addEventListener('abort', () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(queued);
    });

    // On entering the screen: the pen starts once, from the note. At the foot of a page the note
    // may never get that far up: once the page goes no further down, a note in full view starts
    let seen = null;
    const wait = new AbortController();
    signal.addEventListener('abort', () => wait.abort());
    const play = () => {
      seen?.disconnect();
      wait.abort();
      cancelAnimationFrame(frame);
      if (still) return render(total);
      const begin = performance.now();
      const tick = (now) => {
        render(Math.min(now - begin, total));
        frame = shown < total ? requestAnimationFrame(tick) : 0;
      };
      render(0);
      frame = requestAnimationFrame(tick);
    };

    // The layout moved (a width, a font, the note sent under its target): the curve is worked out
    // again and drawn as far as the pen had gone, all of it once done
    const redo = () => {
      cancelAnimationFrame(queued);
      queued = requestAnimationFrame(() => {
        const done = shown >= total;
        time(solve());
        render(done ? total : shown);
      });
    };

    time(solve());
    render(still ? total : 0);
    if (!still) {
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
    }
    root.addEventListener('kodza:replay', play, { signal });
    const moved = new ResizeObserver(redo);
    [root, target, scope].forEach((el) => moved.observe(el));
    signal.addEventListener('abort', () => moved.disconnect());
    window.addEventListener('resize', redo, { passive: true, signal });
    document.fonts?.ready.then(() => signal.aborted || redo());
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
