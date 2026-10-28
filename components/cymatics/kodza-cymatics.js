// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Cymatics
// A speaker drawn in sand: the frame, the screws and the rubber surround hold their lines, and the
// cone rings. The tone sweeps up and back down; at each step the sand on the cone slides to its
// still circles, one at the lowest tone, five at the highest, and dances in between. It also jumps
// where the pointer passes. A woofer, or the whole box with kodza-cymatics--cabinet. Without the
// script, the section stays plain.
(() => {
  const SELECTOR = '[data-kodza-cymatics]';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Kodza field engine 1.1 ------------------------------------------------------------
  // The same copy in every canvas background of the family (Halftone Fade, Plus Pattern, Square
  // Grid Hover…): it owns the canvas, a grid of points on springs, the pointer, the pulses and the
  // pauses (off-screen, hidden tab, nothing moving). A background hands it a layer that says how
  // the points are pushed and drawn. Change it here, then copy it to the others as is.
  //   layer = { canvas: 'kodza-…__canvas', gap: '--kz-…-gap', spring: [stiffness, damping],
  //             quiet: '<the text over the field>', calm: '--kz-…-calm',
  //             pulseLife: seconds, ambient: true to never sleep while seen,
  //             setup(f), enter(f), push(f, dt), draw(f, ctx) }
  const MAX_POINTS = 5000;

  function field(root, signal, layer) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null; // the still field drawn in CSS stays
    canvas.className = layer.canvas;
    canvas.setAttribute('aria-hidden', 'true');
    root.prepend(canvas);
    root.classList.add('is-live');

    const [stiffness, damping] = layer.spring || [46, 8.5];
    const f = {
      root, canvas, ctx, still: reduceMotion, time: 0, scale: 1,
      width: 0, height: 0, gap: 0, cols: 0, rows: 0, count: 0, x0: 0, y0: 0, ink: '', bg: '',
      pointer: { x: 0, y: 0, vx: 0, vy: 0, active: false, t: 0 },
      pulses: [],
      pulse(x, y, power = 1) {
        if (f.still) return;
        f.pulses.push({ x, y, power, t: f.time });
        if (f.pulses.length > 6) f.pulses.shift();
        wake();
      },
      wake: () => wake(),
    };
    let raf = 0;
    let last = 0;
    let onScreen = false;
    let shown = !document.hidden;
    let entered = false;
    let size = '';

    const colors = () => {
      f.ink = getComputedStyle(canvas).color;
      f.bg = getComputedStyle(root).backgroundColor;
    };
    // Screen pixels to the root's own: a parent scaled by transform must not shift the hand
    const scaleOf = () => root.getBoundingClientRect().width / root.offsetWidth || 1;

    // Under the text the field calms down (f.quiet: 1 in the open, `calm` under a line of text),
    // so the headline stays readable at the busiest moment. Feathered: never a visible box
    const quietZones = () => {
      f.quiet = new Float32Array(f.count).fill(1);
      const calm = parseFloat(getComputedStyle(root).getPropertyValue(layer.calm));
      f.calm = Number.isFinite(calm) ? Math.min(Math.max(calm, 0), 1) : 1;
      if (!layer.quiet || f.calm === 1) return;
      const box = root.getBoundingClientRect();
      const s = box.width / root.offsetWidth || 1;
      const range = document.createRange();
      const lines = [];
      // The lines of text only: a block inside (a span per line) is as wide as its column
      root.querySelectorAll(layer.quiet).forEach((el) => {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (!node.data.trim()) continue;
          range.selectNodeContents(node);
          for (const r of range.getClientRects()) {
            if (r.width && r.height) lines.push([(r.left - box.left) / s, (r.top - box.top) / s, (r.right - box.left) / s, (r.bottom - box.top) / s]);
          }
        }
      });
      const feather = f.gap * 1.5;
      for (let i = 0; i < f.count; i++) {
        let near = Infinity;
        for (const [l, t, r, b] of lines) {
          near = Math.min(near, Math.hypot(Math.max(l - f.hx[i], 0, f.hx[i] - r), Math.max(t - f.hy[i], 0, f.hy[i] - b)));
        }
        const k = Math.min(Math.max(near - f.gap / 2, 0) / feather, 1);
        f.quiet[i] = f.calm + (1 - f.calm) * k * k * (3 - 2 * k);
      }
    };

    // The grid is centred like the CSS dots (one on the centre), with a spare row past each edge
    const build = () => {
      const w = root.offsetWidth;
      const h = root.offsetHeight;
      if (!w || !h) return false;
      size = `${w}x${h}`;
      f.scale = scaleOf();
      const ratio = Math.min((window.devicePixelRatio || 1) * f.scale, 3);
      canvas.width = Math.round(w * ratio);
      canvas.height = Math.round(h * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const wanted = parseFloat(getComputedStyle(root).getPropertyValue(layer.gap)) || 24;
      const gap = Math.max(wanted, Math.sqrt((w * h) / MAX_POINTS)); // a huge section gets fewer dots, not a slow one
      const x0 = ((w / 2) % gap) - gap;
      const y0 = ((h / 2) % gap) - gap;
      const cols = Math.ceil((w - x0) / gap) + 1;
      const rows = Math.ceil((h - y0) / gap) + 1;
      const count = cols * rows;
      Object.assign(f, { width: w, height: h, gap, cols, rows, count, x0, y0 });
      ['hx', 'hy', 'ox', 'oy', 'vx', 'vy', 'fx', 'fy'].forEach((key) => { f[key] = new Float32Array(count); });
      for (let r = 0, i = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++, i++) {
          f.hx[i] = x0 + c * gap;
          f.hy[i] = y0 + r * gap;
        }
      }
      colors();
      quietZones();
      layer.setup?.(f);
      return true;
    };

    const paint = () => {
      ctx.clearRect(0, 0, f.width, f.height);
      layer.draw(f, ctx);
    };

    const running = () => onScreen && shown && !f.still;

    function wake() {
      if (raf || !running()) return;
      if (Math.abs(scaleOf() - f.scale) > 0.01) build(); // zoomed since: redraw at the new sharpness
      colors(); // the theme may have changed while asleep
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function frame(now) {
      raf = 0;
      if (signal.aborted || !running()) return;
      const dt = Math.min(Math.max((now - last) / 1000, 0), 1 / 30); // a frame stamp can predate the wake
      last = now;
      f.time += dt;
      const p = f.pointer;
      const slow = Math.exp(-dt * 8); // a hand that stops stops pushing forward
      p.vx *= slow;
      p.vy *= slow;
      f.fx.fill(0);
      f.fy.fill(0);
      layer.push(f, dt);

      // Springs back home, integrated semi-implicitly (stable at 30 fps too)
      const { ox, oy, vx, vy, fx, fy, count } = f;
      let moving = 0;
      let away = 0;
      for (let i = 0; i < count; i++) {
        vx[i] += (fx[i] - stiffness * ox[i] - damping * vx[i]) * dt;
        vy[i] += (fy[i] - stiffness * oy[i] - damping * vy[i]) * dt;
        ox[i] += vx[i] * dt;
        oy[i] += vy[i] * dt;
        moving = Math.max(moving, Math.abs(vx[i]) + Math.abs(vy[i]));
        away = Math.max(away, Math.abs(ox[i]) + Math.abs(oy[i]));
      }
      const life = layer.pulseLife || 2.5;
      f.pulses = f.pulses.filter((q) => f.time - q.t < life);

      // Asleep once it has all settled: no frame is drawn for nothing
      const settled = !layer.ambient && !f.pulses.length && moving < 1 && Math.abs(p.vx) + Math.abs(p.vy) < 4;
      if (settled && !p.active && away < 0.3) {
        ox.fill(0);
        oy.fill(0);
        vx.fill(0);
        vy.fill(0);
      }
      paint();
      if (!settled) raf = requestAnimationFrame(frame);
    }

    if (!f.still) {
      const local = (e) => {
        const box = root.getBoundingClientRect();
        const s = box.width / root.offsetWidth || 1;
        return [(e.clientX - box.left) / s, (e.clientY - box.top) / s];
      };
      root.addEventListener('pointermove', (e) => {
        const [x, y] = local(e);
        const p = f.pointer;
        const dt = (e.timeStamp - p.t) / 1000;
        if (p.active && dt > 0 && dt < 0.1) {
          const k = Math.max(dt, 1 / 240);
          p.vx = p.vx * 0.5 + ((x - p.x) / k) * 0.5;
          p.vy = p.vy * 0.5 + ((y - p.y) / k) * 0.5;
        }
        Object.assign(p, { x, y, t: e.timeStamp, active: true });
        wake();
      }, { signal });
      const leave = () => {
        f.pointer.active = false;
        wake();
      };
      root.addEventListener('pointerleave', leave, { signal });
      root.addEventListener('pointercancel', leave, { signal }); // the finger started a scroll
      root.addEventListener('pointerdown', (e) => {
        if (e.button > 0) return;
        f.pulse(...local(e));
      }, { signal });
      // A click from the keyboard sends its pulse from the control itself
      root.addEventListener('click', (e) => {
        if (e.detail !== 0 || !(e.target instanceof Element) || e.target === root) return;
        const box = e.target.getBoundingClientRect();
        f.pulse(...local({ clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 }));
      }, { signal });
    }

    const io = new IntersectionObserver((entries) => {
      onScreen = entries[entries.length - 1].isIntersecting;
      if (onScreen && !entered && !f.still) {
        entered = true;
        layer.enter?.(f);
      }
      wake();
    });
    io.observe(root);
    document.addEventListener('visibilitychange', () => {
      shown = !document.hidden;
      wake();
    }, { signal });
    const ro = new ResizeObserver(() => {
      if (`${root.offsetWidth}x${root.offsetHeight}` !== size && build()) paint();
    });
    ro.observe(root);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      colors();
      paint();
    }, { signal });

    signal.addEventListener('abort', () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      canvas.width = 0; // hands the pixels back now, not at the next garbage collection
      canvas.height = 0;
      canvas.remove();
    });

    if (build()) paint();
    // The text moves once the web font is in: calm the field under its final lines
    document.fonts?.ready.then(() => {
      if (signal.aborted || !f.count) return;
      quietZones();
      paint();
    });
    return f;
  }
  // ---- end of the field engine -----------------------------------------------------------

  // The speaker is drawn in sand: the frame, its screws and the rubber surround hold their lines,
  // the cone rings. A round cone stands still on circles where J0, the Bessel function, crosses
  // zero: one circle at the lowest tone, two at the next… five at the highest. The sand on the
  // cone slides to them and dances where the cone moves the most.
  // The sand is its own: far more grains than the engine's grid (which stays as the map of calm
  // under the text).
  const ZEROS = [2.405, 5.52, 8.654, 11.792, 14.931, 18.071];
  const HZ = [60, 94, 128, 162, 196]; // the tones that give one circle, two… five
  const ROUND = 2 * (HZ.length - 1);  // up through the tones, then back down
  const CIRCLE = 0;          // the parts of the drawing: a line of sand around a circle,
  const BOX = 1;             // or around a rounded box,
  const DISC = 2;            // or sand spread over a disc,
  const BAND = 3;            // or over the ring between two circles
  const STRIDE = 7;          // [type, x, y, radius or half-width, inner radius or half-height, corner, weight]
  const CONE = -1;           // a grain on the cone
  const LOOSE = -2;          // a grain loose on the plate
  const MAX_SAND = 40000;    // a huge section gets sparser sand, not a slow one
  const PER_PX = 3;          // at most this many grains for each px of line in the drawing
  const FILL = 0.023;        // the sand each part holds, for 1 per px of line: per px² of surround and cap,
  const CONE_FILL = 0.028;   // per px² of cone,
  const DUST = 0.0009;       // and per px² of the rest of the plate
  const PULL = 2.1;          // how fast a grain on the cone slides to the nearest still circle (1/s)
  const HOLD = 3.4;          // how fast a grain of the frame slides back to its line (1/s)
  const RUN = 0.3;           // a grain's top speed, in speaker sizes per second
  const JUMP = 0.011;        // how far a grain jumps in a frame at 60 fps where the cone moves most, in speaker sizes
  const BED = 0.12;          // even on a still circle, the grains shiver a little
  const FIRM = 0.05;         // the frame barely does
  const DRIFT = 0.08;        // nor does the loose sand
  const NEAR = 0.28;         // how close to a tone (share of the sweep) the circles hold half their pull
  const DANCE = 0.7;         // between two tones, every grain on the cone bounces this hard
  const HAND = 2.4;          // how hard the speaker shakes under the pointer
  const SETTLE = 10;         // how fast the hand lands and lifts (1/s)
  const RING = 4;            // a tap: a ring of shaking that crosses the plate
  const RING_SPEED = 620;    // px per second
  const RING_WIDTH = 70;     // px, each side of the crest
  const RING_LIFE = 1.8;     // seconds
  const SPACE = 7;           // px between two still circles at least: a small cone shows fewer
  const SPREAD = 0.1;        // at first the sand lies this far around the drawing, in speaker sizes
  const ALPHA = 0.82;
  const QUIET = 4;           // the grains are drawn in a few steps of calm under the text
  const ARRIVE = 0.9;        // seconds for the sand to show on the plate, while it gathers on its lines

  // The drawing, from --kz-cymatics-x, -y (the speaker's centre) and -speaker (its size): a
  // woofer, or with kodza-cymatics--cabinet the whole two-way box
  function speaker(f) {
    const css = getComputedStyle(f.root);
    const { width: w, height: h } = f;
    const length = (name, of, fallback) => {
      const raw = css.getPropertyValue(`--kz-cymatics-${name}`).trim();
      const value = parseFloat(raw);
      if (!Number.isFinite(value)) return fallback;
      return raw.endsWith('%') ? (value / 100) * of : value;
    };
    const cx = length('x', w, 0.76 * w);
    const cy = length('y', h, 0.5 * h);
    const S = Math.max(length('speaker', h, 760), 40);
    const parts = [];
    const add = (type, x, y, a, b = 0, c = 0, weight = 1) => parts.push(type, x, y, a, b, c, weight);
    let cone = null;
    // A driver of radius R: the frame and its screws, the rubber surround, the cone, the dust cap
    const driver = (x, y, R, screws) => {
      add(CIRCLE, x, y, R);
      add(CIRCLE, x, y, 0.86 * R);
      for (let i = 0; i < screws; i++) {
        const t = ((i + 0.5) / screws) * Math.PI * 2;
        add(CIRCLE, x + Math.cos(t) * 0.93 * R, y + Math.sin(t) * 0.93 * R, 0.028 * R, 0, 0, 1.6);
      }
      add(CIRCLE, x, y, 0.83 * R);
      add(CIRCLE, x, y, 0.74 * R);
      add(BAND, x, y, 0.83 * R, 0.74 * R);
      add(CIRCLE, x, y, 0.25 * R);
      add(DISC, x, y, 0.25 * R);
      cone = { x, y, r0: 0.25 * R, r1: 0.74 * R };
    };
    if (f.root.classList.contains('kodza-cymatics--cabinet')) {
      // In heights of the box: its sides and the baffle, the woofer low, the bass port's slot
      // above it and the tweeter on top
      add(BOX, cx, cy, 0.362 * S, 0.5 * S, 0.036 * S);
      add(BOX, cx, cy, 0.333 * S, 0.471 * S, 0.022 * S, 0.8);
      driver(cx, cy + 0.21 * S, 0.235 * S, 6);
      add(BOX, cx, cy - 0.11 * S, 0.123 * S, 0.018 * S, 0.018 * S, 0.9);
      const R = 0.109 * S;
      const y = cy - 0.283 * S;
      add(CIRCLE, cx, y, R);
      for (let i = 0; i < 4; i++) {
        const t = ((i + 0.5) / 4) * Math.PI * 2;
        add(CIRCLE, cx + Math.cos(t) * 0.86 * R, y + Math.sin(t) * 0.86 * R, 0.05 * R, 0, 0, 1.6);
      }
      add(CIRCLE, cx, y, 0.62 * R);
      add(CIRCLE, cx, y, 0.5 * R);
      add(DISC, cx, y, 0.5 * R);
    } else {
      driver(cx, cy, S / 2, 8);
    }
    // The still circles of each tone, spread over the cone like the zeros of J0; a cone too
    // small for them all keeps as many as fit
    const span = cone.r1 - cone.r0;
    cone.modes = HZ.map((hz, k) => {
      const n = Math.max(Math.min(k + 1, Math.floor(span / SPACE) - 1), 1);
      return Array.from({ length: n }, (_, j) => cone.r0 + (span * ZEROS[j]) / ZEROS[n]);
    });
    cone.half = cone.modes.map((rings) => span / (2 * (rings.length + 1)));
    return { parts: Float32Array.from(parts), cone, size: S };
  }

  // A point taken evenly on (a line) or in (a fill) part k of the drawing
  function sample(parts, k) {
    const o = k * STRIDE;
    const [type, x, y, a, b, c] = parts.subarray(o, o + 6);
    const t = Math.random() * Math.PI * 2;
    if (type === CIRCLE) return [x + Math.cos(t) * a, y + Math.sin(t) * a];
    if (type === DISC || type === BAND) {
      const r = Math.sqrt(b * b + Math.random() * (a * a - b * b));
      return [x + Math.cos(t) * r, y + Math.sin(t) * r];
    }
    // A box: a point near its outline, kept with a chance as even as its length, then put on it
    for (let i = 0; i < 400; i++) {
      const px = (Math.random() * 2 - 1) * (a + 1);
      const py = (Math.random() * 2 - 1) * (b + 1);
      const [mx, my] = toBox(px, py, a, b, c);
      if (Math.abs(mx) + Math.abs(my) < 1) return [x + px + mx, y + py + my];
    }
    return [x + a, y];
  }

  // From (px, py), seen from a box's centre, to the nearest point of its rounded outline
  function toBox(px, py, hw, hh, c) {
    const ax = Math.abs(px);
    const ay = Math.abs(py);
    const qx = ax - (hw - c);
    const qy = ay - (hh - c);
    let nx = ax;
    let ny = hh;
    if (qx > 0 && qy > 0) {
      const d = Math.hypot(qx, qy);
      nx = hw - c + (qx / d) * c;
      ny = hh - c + (qy / d) * c;
    } else if (qx > qy) {
      nx = hw;
      ny = ay;
    }
    return [(nx - ax) * (px < 0 ? -1 : 1), (ny - ay) * (py < 0 ? -1 : 1)];
  }

  const inside = (f, [x, y]) => x >= 0 && x <= f.width && y >= 0 && y <= f.height;

  // One step of sand on the speaker, for every grain. `focus` is how close the tone is to the
  // one of `index`: 1 on it, near 0 halfway to the next
  function shake(f, index, dt, focus, hand) {
    const { sx, sy, own, grains, parts, cone, width: w, height: h, pointer: p, size: S } = f;
    const jump = JUMP * S * Math.sqrt(dt * 60); // a random walk: the same spread at any frame rate
    const run = RUN * S * dt;
    const pull = 1 - Math.exp(-PULL * focus * dt);
    const hold = 1 - Math.exp(-HOLD * dt);
    const circles = cone.modes[index];
    const half = cone.half[index];
    const { x: ox, y: oy, r0, r1 } = cone;
    const reach = f.reach;
    const near = hand && f.presence > 0.002;
    const rings = hand ? f.pulses.map((q) => {
      const age = f.time - q.t;
      return [q.x, q.y, age * RING_SPEED, (1 - (age / RING_LIFE) ** 2) * q.power * RING];
    }) : [];
    for (let i = 0; i < grains; i++) {
      let x = sx[i];
      let y = sy[i];
      const k = own[i];
      let mx = 0;
      let my = 0;
      let a = DRIFT;
      if (k >= 0) {
        // The frame: back to the nearest point of the grain's own line, or into its fill
        const o = k * STRIDE;
        const type = parts[o];
        const px = x - parts[o + 1];
        const py = y - parts[o + 2];
        if (type === BOX) {
          [mx, my] = toBox(px, py, parts[o + 3], parts[o + 4], parts[o + 5]);
        } else {
          const d = Math.hypot(px, py) || 1e-6;
          let to = parts[o + 3];
          if (type === DISC) to = Math.min(d, to);
          else if (type === BAND) to = Math.min(Math.max(d, parts[o + 4]), to);
          mx = (px * (to - d)) / d;
          my = (py * (to - d)) / d;
        }
        mx *= hold;
        my *= hold;
        a = FIRM;
      } else if (k === CONE) {
        // The cone: along the radius to the nearest still circle of the tone
        const px = x - ox;
        const py = y - oy;
        const r = Math.hypot(px, py) || 1e-6;
        let to = circles[0];
        for (let j = 1; j < circles.length; j++) if (Math.abs(circles[j] - r) < Math.abs(to - r)) to = circles[j];
        const dr = to - r;
        mx = (px * dr * pull) / r;
        my = (py * dr * pull) / r;
        a = Math.min(Math.abs(dr) / half, 1) * 1.2 * focus + BED + DANCE * (1 - focus);
      }
      const dl = Math.hypot(mx, my);
      if (dl > run) {
        mx *= run / dl;
        my *= run / dl;
      }
      if (near) {
        const d = Math.hypot(x - p.x, y - p.y);
        if (d < reach) {
          const t = 1 - d / reach;
          a += HAND * t * t * (3 - 2 * t) * f.presence;
        }
      }
      for (const [qx, qy, front, power] of rings) {
        const d = Math.hypot(x - qx, y - qy) - front;
        if (d > -RING_WIDTH && d < RING_WIDTH) a += Math.cos((d / RING_WIDTH) * (Math.PI / 2)) ** 2 * power;
      }
      const s = a * jump;
      x += mx + (Math.random() - 0.5) * s;
      y += my + (Math.random() - 0.5) * s;
      if (k === CONE) {
        // The cone's sand stays on the cone: it bounces off the cap and the surround
        const px = x - ox;
        const py = y - oy;
        const r = Math.hypot(px, py) || 1e-6;
        const to = r < r0 ? 2 * r0 - r : r > r1 ? 2 * r1 - r : r;
        if (to !== r) {
          x = ox + (px * to) / r;
          y = oy + (py * to) / r;
        }
      }
      // And all of it on the part of the plate we see
      if (x < 0) x = -x; else if (x > w) x = 2 * w - x;
      if (y < 0) y = -y; else if (y > h) y = 2 * h - y;
      sx[i] = Math.min(Math.max(x, 0), w);
      sy[i] = Math.min(Math.max(y, 0), h);
    }
  }

  // The k-th tone on the way: 0 up to 4, then back down to 1, and round again
  const stop = (k) => {
    const r = k % ROUND;
    return r < HZ.length ? r : ROUND - r;
  };
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

  // The tone, written out where the markup asks for it: it counts through every sweep
  function write(f, value) {
    if (!f.hz || f.shown === value) return;
    f.shown = value;
    f.hz.textContent = String(value);
  }

  const sand = {
    canvas: 'kodza-cymatics__canvas',
    gap: '--kz-cymatics-gap',
    spring: [0, 0],
    quiet: '.kodza-cymatics__note, .kodza-cymatics__eyebrow, .kodza-cymatics__title, .kodza-cymatics__lead',
    calm: '--kz-cymatics-calm',
    pulseLife: RING_LIFE,
    ambient: true,

    setup(f) {
      const css = getComputedStyle(f.root);
      const read = (name, fallback) => {
        const value = parseFloat(css.getPropertyValue(`--kz-cymatics-${name}`));
        return Number.isFinite(value) ? value : fallback;
      };
      const { width: w, height: h } = f;
      const gap = Math.max(read('gap', 5), 1);
      f.grain = read('size', 1.2);
      f.reach = read('reach', 110);
      f.hold = Math.max(read('hold', 3), 0.5);
      f.sweep = Math.max(read('sweep', 2.2), 0.5);
      f.presence = f.presence || 0;
      Object.assign(f, speaker(f));
      const { parts, cone } = f;
      const count = parts.length / STRIDE;

      // How much sand each part holds: its length or area, as much of it as shows
      const seen = (pick) => {
        let hits = 0;
        for (let i = 0; i < 64; i++) hits += inside(f, pick());
        return hits / 64;
      };
      const mass = [];
      for (let k = 0; k < count; k++) {
        const [type, , , a, b, c, weight] = parts.subarray(k * STRIDE, k * STRIDE + STRIDE);
        const size = type === CIRCLE ? 2 * Math.PI * a
          : type === BOX ? 4 * (a + b) - (8 - 2 * Math.PI) * c
          : Math.PI * (a * a - b * b) * FILL;
        mass.push(size * weight * seen(() => sample(parts, k)));
      }
      const ring = () => {
        const t = Math.random() * Math.PI * 2;
        const r = Math.sqrt(cone.r0 ** 2 + Math.random() * (cone.r1 ** 2 - cone.r0 ** 2));
        return [cone.x + Math.cos(t) * r, cone.y + Math.sin(t) * r];
      };
      mass.push(Math.PI * (cone.r1 ** 2 - cone.r0 ** 2) * CONE_FILL * seen(ring), w * h * DUST);
      const total = mass.reduce((sum, m) => sum + m, 0);
      f.grains = Math.min(Math.round((w * h) / (gap * gap)), MAX_SAND, Math.round(total * PER_PX));
      f.sx = new Float32Array(f.grains);
      f.sy = new Float32Array(f.grains);
      f.own = new Int16Array(f.grains);
      f.level = new Uint8Array(f.grains);
      f.hz = f.root.querySelector('.kodza-cymatics__hz');
      if (f.mode === undefined) {
        f.mode = 0;
        write(f, HZ[0]);
      }

      // Each part gets its share. Still (reduced motion), or rebuilt after a resize, the sand is
      // already on the drawing; at first it lies around it, and finds its lines as the cone starts
      const settled = f.still || f.time > 0;
      const spread = settled ? 0 : SPREAD * f.size;
      let i = 0;
      mass.forEach((m, k) => {
        const kind = k < count ? k : k === count ? CONE : LOOSE;
        const end = k === mass.length - 1 ? f.grains : Math.min(i + Math.round((m / total) * f.grains), f.grains);
        for (; i < end; i++) {
          let point;
          for (let tries = 0; tries < 12; tries++) {
            point = kind >= 0 ? sample(parts, kind) : kind === CONE ? ring() : [Math.random() * w, Math.random() * h];
            if (inside(f, point)) break;
          }
          const t = Math.random() * Math.PI * 2;
          const r = kind >= 0 ? Math.sqrt(Math.random()) * spread : 0;
          f.sx[i] = Math.min(Math.max(point[0] + Math.cos(t) * r, 0), w);
          f.sy[i] = Math.min(Math.max(point[1] + Math.sin(t) * r, 0), h);
          f.own[i] = kind;
        }
      });
      if (settled) {
        for (let k = 0; k < 40; k++) shake(f, f.mode, 1 / 60, 1, false);
      }
    },

    // Each step holds a tone, then sweeps to the next: the circles let go as the tone leaves
    // and the next ones draw the sand in as it arrives
    push(f, dt) {
      const step = f.hold + f.sweep;
      const k = Math.floor(f.time / step);
      const into = f.time - k * step - f.hold;
      let index = stop(k);
      let tone = HZ[index];
      let focus = 1;
      if (into > 0) {
        const next = stop(k + 1);
        const e = ease(into / f.sweep);
        const d = Math.min(e, 1 - e) * 2;
        tone += (HZ[next] - tone) * e;
        focus = 1 / (1 + (d / NEAR) ** 2);
        if (e >= 0.5) index = next;
      }
      f.mode = index;
      write(f, Math.round(tone));
      f.presence += ((f.pointer.active ? 1 : 0) - f.presence) * (1 - Math.exp(-dt * SETTLE));
      shake(f, index, dt, focus, true);
    },

    // Fine square grains in a few batches: under the text the sand fades to `calm`
    draw(f, ctx) {
      const { sx, sy, grains, level, quiet, calm, cols, rows, gap, x0, y0, grain: size } = f;
      const used = new Uint32Array(QUIET);
      const open = calm < 1 ? 1 / (1 - calm) : 0;
      const arrive = f.still ? 1 : ease(Math.min(f.time / ARRIVE, 1));
      for (let i = 0; i < grains; i++) {
        const c = Math.min(Math.max(Math.round((sx[i] - x0) / gap), 0), cols - 1);
        const r = Math.min(Math.max(Math.round((sy[i] - y0) / gap), 0), rows - 1);
        level[i] = open ? Math.round((quiet[r * cols + c] - calm) * open * (QUIET - 1)) : QUIET - 1;
        used[level[i]]++;
      }
      ctx.fillStyle = f.ink;
      const half = size / 2;
      for (let l = 0; l < QUIET; l++) {
        if (!used[l]) continue;
        ctx.globalAlpha = ALPHA * arrive * (open ? calm + (1 - calm) * (l / (QUIET - 1)) : 1);
        ctx.beginPath();
        for (let i = 0; i < grains; i++) {
          if (level[i] === l) ctx.rect(sx[i] - half, sy[i] - half, size, size);
        }
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    field(root, signal, sand);
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
