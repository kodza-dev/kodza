// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Interactive Dots
// Draws the field of dots on a canvas behind the hero: the pointer pushes them aside, springs
// bring them home, a click sends a wave. Without the script, the CSS dots stay, still.
(() => {
  const SELECTOR = '[data-kodza-interactive-dots]';
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

  // The dots: the hand presses a hollow and piles the dots in a ridge around it, a fast hand
  // plows them along, and each pulse is a ring that sweeps outward, shoving and inking the dots
  // it crosses. The ring is drawn directly, not through the springs: it stays a crisp circle.
  const PRESS = 7;         // how hard the hand pushes, against springs of strength 1
  const DRAG = 1.1;        // how much a moving hand carries the dots with it
  const SETTLE = 14;       // how fast the hand lands and lifts (1/s): the hollow opens in ~150 ms
  const WAVE = 9;          // how far the ring shoves the dots (px)
  const WAVE_SPEED = 560;  // px per second
  const WAVE_WIDTH = 84;   // px, each side of the crest
  const WAVE_LIFE = 2.6;   // seconds
  const STIFFNESS = 46;
  const SHADES = 6;        // dots are sorted into a few shades: thousands of arcs, a few fills
  const QUIET = 4;         // and a few steps of calm under the text

  const dots = {
    canvas: 'kodza-interactive-dots__canvas',
    gap: '--kz-interactive-dots-gap',
    spring: [STIFFNESS, 8.5],
    quiet: '.kodza-interactive-dots__eyebrow, .kodza-interactive-dots__title, .kodza-interactive-dots__lead',
    calm: '--kz-interactive-dots-calm',
    pulseLife: WAVE_LIFE,

    setup(f) {
      const css = getComputedStyle(f.root);
      const read = (name, fallback) => {
        const value = parseFloat(css.getPropertyValue(`--kz-interactive-dots-${name}`));
        return Number.isFinite(value) ? value : fallback;
      };
      f.size = read('size', 1.2);
      f.rest = Math.min(Math.max(read('rest', 0.24), 0), 1);
      f.lift = Math.min(Math.max(read('lift', 0.7), 0), 1);
      f.grow = Math.max(read('grow', 0), 0);
      f.reach = read('reach', 104);
      f.presence = f.presence || 0;
      f.shade = new Uint8Array(f.count);
      ['wx', 'wy', 'we', 'grain'].forEach((key) => { f[key] = new Float32Array(f.count); });
      // A fixed grain per dot, so the dots piled on the rim never stack exactly on one another
      for (let i = 0; i < f.count; i++) {
        const n = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
        f.grain[i] = (n - Math.floor(n)) * 2 - 1;
      }
    },

    // The first time it is seen, one soft wave from the middle says it is alive
    enter(f) {
      f.pulse(f.width / 2, f.height * 0.4, 0.6);
    },

    push(f, dt) {
      const { hx, hy, ox, oy, fx, fy, cols, rows, gap, x0, y0, grain, pointer: p } = f;
      const k = STIFFNESS;
      f.presence += ((p.active ? 1 : 0) - f.presence) * (1 - Math.exp(-dt * SETTLE));
      if (f.presence > 0.002) {
        const R = f.reach;
        const span = R + gap * 2;
        const c0 = Math.max(0, Math.floor((p.x - span - x0) / gap));
        const c1 = Math.min(cols - 1, Math.ceil((p.x + span - x0) / gap));
        const r0 = Math.max(0, Math.floor((p.y - span - y0) / gap));
        const r1 = Math.min(rows - 1, Math.ceil((p.y + span - y0) / gap));
        for (let r = r0; r <= r1; r++) {
          for (let c = c0, i = r * cols + c0; c <= c1; c++, i++) {
            const dx = hx[i] + ox[i] - p.x;
            const dy = hy[i] + oy[i] - p.y;
            const d = Math.hypot(dx, dy);
            if (d >= R) continue;
            const t = 1 - d / R;
            const weight = t * t * (3 - 2 * t) * f.presence; // no hard edge at the rim
            const s = d > 0.5 ? (k * PRESS * (R - d) * weight) / d : 0;
            const side = s * grain[i] * 0.3; // a little sideways, like grains rolling off
            fx[i] += dx * s - dy * side + p.vx * DRAG * weight;
            fy[i] += dy * s + dx * side + p.vy * DRAG * weight;
          }
        }
      }
      // The rings, computed from scratch each frame
      const { wx, wy, we } = f;
      wx.fill(0);
      wy.fill(0);
      we.fill(0);
      for (const q of f.pulses) {
        const age = f.time - q.t;
        const front = age * WAVE_SPEED;
        const fade = (1 - (age / WAVE_LIFE) ** 2) * q.power; // holds, then lets go: it crosses the whole field
        const outer = (front + WAVE_WIDTH) ** 2;
        const inner = Math.max(front - WAVE_WIDTH, 0) ** 2;
        for (let i = 0; i < f.count; i++) {
          const dx = hx[i] - q.x; // from home: the ring stays round
          const dy = hy[i] - q.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > outer || d2 < inner) continue;
          const d = Math.sqrt(d2) || 1;
          const crest = Math.cos(((d - front) / WAVE_WIDTH) * (Math.PI / 2)) ** 2 * fade;
          wx[i] += (dx / d) * WAVE * crest;
          wy[i] += (dy / d) * WAVE * crest;
          we[i] = Math.max(we[i], crest);
        }
      }
    },

    // A dot pushed further is darker (same size by default): the ridge and the ring read at a glance.
    // Under the text only that lift is calmed: at rest, the field runs on behind the words
    draw(f, ctx) {
      const { hx, hy, ox, oy, wx, wy, we, quiet, calm, count, shade, size, rest, lift, grow } = f;
      const used = new Uint16Array(SHADES * QUIET);
      const open = calm < 1 ? 1 / (1 - calm) : 0;
      for (let i = 0; i < count; i++) {
        const e = Math.round(Math.min(Math.hypot(ox[i], oy[i]) / 22 + we[i], 1) * (SHADES - 1));
        const q = e ? Math.round((quiet[i] - calm) * open * (QUIET - 1)) : QUIET - 1;
        shade[i] = e * QUIET + q;
        used[shade[i]]++;
      }
      ctx.fillStyle = f.ink;
      const peak = rest + (1 - rest) * lift;
      for (let level = 0; level < SHADES * QUIET; level++) {
        if (!used[level]) continue;
        const e = Math.floor(level / QUIET) / (SHADES - 1);
        const q = open ? calm + (1 - calm) * ((level % QUIET) / (QUIET - 1)) : 1;
        const radius = size * (1 + grow * e * q);
        ctx.globalAlpha = rest + (peak - rest) * e * q;
        ctx.beginPath();
        for (let i = 0; i < count; i++) {
          if (shade[i] !== level) continue;
          const x = hx[i] + ox[i] + wx[i];
          const y = hy[i] + oy[i] + wy[i];
          ctx.moveTo(x + radius, y);
          ctx.arc(x, y, radius, 0, Math.PI * 2);
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
    field(root, signal, dots);
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
