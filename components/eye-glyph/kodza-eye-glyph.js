// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Eye Glyph
// Each letter marked __eye becomes an eye. Its hole, measured on its own font at any size, gets a
// pupil that follows the pointer (or looks around when nothing moves), lashes grow on top of the
// letter, and two lids close the hole on a curved line when it blinks. "kodza:replay" on the
// root makes it blink.
(() => {
  const SELECTOR = '[data-kodza-eye-glyph]';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const CLOSE = 'cubic-bezier(0.55, 0, 0.85, 0.35)';
  const OPEN = 'cubic-bezier(0.15, 0.7, 0.3, 1)';

  const svg = (tag, attrs = {}) => {
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    return node;
  };
  const time = (value, fallback) => {
    const n = parseFloat(value);
    if (Number.isNaN(n)) return fallback;
    return /ms\s*$/.test(value) ? n : n * 1000;
  };

  // The letter drawn on a canvas, in its own font: the hole row by row, the stroke width, and the
  // top of the outline where the lashes grow. In px, from the glyph origin and its baseline.
  function measure(el) {
    const cs = getComputedStyle(el);
    let char = el.textContent.trim().charAt(0);
    if (cs.textTransform === 'uppercase') char = char.toUpperCase();
    if (cs.textTransform === 'lowercase') char = char.toLowerCase();
    if (!char) return null;
    const S = 240;
    const font = `${cs.fontStyle} ${cs.fontWeight} ${S}px ${cs.fontFamily}`;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.font = font;
    const m = ctx.measureText(char);
    const pad = 4;
    const w = Math.ceil(m.actualBoundingBoxLeft + m.actualBoundingBoxRight) + pad * 2;
    const h = Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) + pad * 2;
    if (w < 8 || h < 8) return null;
    canvas.width = w;
    canvas.height = h;
    ctx.font = font;
    const ox = m.actualBoundingBoxLeft + pad;
    const oy = m.actualBoundingBoxAscent + pad;
    ctx.fillText(char, ox, oy);
    const px = ctx.getImageData(0, 0, w, h).data;
    const ink = (x, y) => px[(y * w + x) * 4 + 3] > 127;
    const cx = Math.round(w / 2);
    const cy = Math.round(h / 2);
    if (ink(cx, cy)) return null; // no hole in the middle (a slashed zero, an L): no eye

    let [t, b] = [cy, cy];
    while (t > 0 && !ink(cx, t - 1)) t--;
    while (b < h - 1 && !ink(cx, b + 1)) b++;
    if (t === 0 || b === h - 1) return null; // an open shape (a C, a U): not a hole
    const rows = [];
    for (let y = t; y <= b; y++) {
      let [l, r] = [cx, cx];
      while (l > 0 && !ink(l - 1, y)) l--;
      while (r < w - 1 && !ink(r + 1, y)) r++;
      rows.push([y, l, r + 1]);
    }
    const mid = rows[Math.round((b - t) / 2)];
    let outL = mid[1];
    while (outL > 0 && ink(outL - 1, mid[0])) outL--;
    let outR = mid[2];
    while (outR < w && ink(outR, mid[0])) outR++;
    const top = (x) => {
      let y = 0;
      while (y < t && !ink(x, y)) y++;
      return y;
    };

    const k = parseFloat(cs.fontSize) / S;
    const X = (x) => (x - ox) * k;
    const Y = (y) => (y - oy) * k;
    const oc = (outL + outR) / 2;
    const orx = (outR - outL) / 2;
    // Lashes grow where the top of the outline faces the sky, each along its normal
    const lashes = [-0.62, -0.31, 0, 0.31, 0.62].map((f) => {
      const x = Math.round(oc + f * orx);
      const dy = top(x + 3) - top(x - 3);
      const n = Math.hypot(6, dy);
      return { x: X(x), y: Y(top(x)), nx: dy / n, ny: -6 / n, f };
    });
    return {
      rows: rows.map(([y, l, r]) => [Y(y), X(l), X(r)]),
      x: X((mid[1] + mid[2]) / 2),
      y: Y((t + b + 1) / 2),
      rx: ((mid[2] - mid[1]) / 2) * k,
      ry: ((b + 1 - t) / 2) * k,
      stroke: (mid[1] - outL) * k,
      em: parseFloat(cs.fontSize),
      lashes,
    };
  }

  // One eye: its pupil, lids and lashes, laid on the hole of its letter
  function makeEye(el, root) {
    const base = document.createElement('i');
    base.className = 'kodza-eye-glyph__base';
    const pupil = document.createElement('i');
    pupil.className = 'kodza-eye-glyph__pupil';
    pupil.setAttribute('aria-hidden', 'true');
    const lids = svg('svg', { class: 'kodza-eye-glyph__lids', 'aria-hidden': 'true', focusable: 'false' });
    const upper = svg('path');
    const lower = svg('path');
    lids.append(upper, lower);
    const lashes = svg('svg', { class: 'kodza-eye-glyph__lashes', 'aria-hidden': 'true', focusable: 'false' });
    const lashSet = svg('g');
    lashes.append(lashSet);
    el.prepend(base);
    el.append(pupil, lids, lashes);

    const eye = {
      el,
      geo: null, // the pupil: its centre and how far it travels, in px
      lid: null, // the lids: open and shut, in px
      at: { x: 0, y: 0 }, // where the pupil is, from -1 to 1 on each axis
      look: { x: 0, y: 0 }, // where it is heading
    };

    eye.place = () => {
      // A framework can take the letter out of the page before kodza:destroy: nothing to measure
      if (!el.isConnected) return;
      const z = measure(el);
      if (!z) {
        eye.geo = null;
        el.classList.remove('is-open');
        return;
      }
      const cs = getComputedStyle(root);
      const bx = base.offsetLeft;
      const by = base.offsetTop;

      // The pupil
      const size = parseFloat(cs.getPropertyValue('--kz-eye-glyph-pupil'));
      const d = Math.min(z.rx, z.ry) * 2 * (Number.isNaN(size) ? 0.55 : size);
      const gap = d * 0.14;
      eye.geo = {
        x: bx + z.x,
        y: by + z.y,
        tx: Math.max(0, z.rx - d / 2 - gap),
        ty: Math.max(0, z.ry - d / 2 - gap),
      };
      el.style.setProperty('--kz-eye-glyph-x', `${eye.geo.x}px`);
      el.style.setProperty('--kz-eye-glyph-y', `${eye.geo.y}px`);
      el.style.setProperty('--kz-eye-glyph-d', `${d}px`);

      // The lids: a layer the size of the hole (a little more, under the stroke), cut to its shape
      const e = z.stroke * 0.4;
      const x0 = Math.min(...z.rows.map((r) => r[1])) - e;
      const y0 = z.rows[0][0] - e;
      const W = Math.max(...z.rows.map((r) => r[2])) + e - x0;
      const H = z.rows[z.rows.length - 1][0] + e - y0;
      const step = Math.max(1, Math.round(z.rows.length / 48));
      const sample = z.rows.filter((_, i) => i % step === 0 || i === z.rows.length - 1);
      const pt = (x, y) => `${(x - x0).toFixed(1)}px ${(y - y0).toFixed(1)}px`;
      const first = sample[0];
      const last = sample[sample.length - 1];
      const shape = [
        pt(first[1] - e, y0),
        ...sample.map(([y, l]) => pt(l - e, y)),
        pt(last[1] - e, y0 + H),
        pt(last[2] + e, y0 + H),
        ...sample.slice().reverse().map(([y, , r]) => pt(r + e, y)),
        pt(first[2] + e, y0),
      ];
      Object.assign(lids.style, {
        left: `${bx + x0}px`,
        top: `${by + y0}px`,
        width: `${W}px`,
        height: `${H}px`,
        clipPath: `polygon(${shape.join(', ')})`,
      });
      lids.setAttribute('viewBox', `0 0 ${W} ${H}`);
      // Both lids share one edge, dipping in the middle: shut, a thin curved line is left (‿)
      const sag = Math.min(W * 0.3, H * 0.16);
      const p = W * 0.08;
      const edge = `Q ${W / 2} ${sag * 2} ${-p} 0`;
      upper.setAttribute('d', `M ${-p} ${-3 * H} H ${W + p} V 0 ${edge} Z`);
      lower.setAttribute('d', `M ${-p} ${3 * H} H ${W + p} V 0 ${edge} Z`);
      const shut = H * 0.7 - sag; // the closing line, three quarters down the hole
      eye.lid = {
        upperOpen: -sag - 2,
        upperShut: shut,
        lowerOpen: H + 2,
        lowerShut: shut + z.em * 0.007,
        dip: z.em * 0.02,
      };
      upper.style.transform = `translateY(${eye.lid.upperOpen}px)`;
      lower.style.transform = `translateY(${eye.lid.lowerOpen}px)`;

      // The lashes: planted in the top of the outline, a little wider than its normal and curled
      // outwards, like real ones; round ends
      const scale = parseFloat(cs.getPropertyValue('--kz-eye-glyph-lashes'));
      const len = z.em * 0.095 * (Number.isNaN(scale) ? 1 : scale);
      const into = z.em * 0.05;
      Object.assign(lashes.style, { width: `${el.offsetWidth}px`, height: `${el.offsetHeight}px` });
      lashes.setAttribute('viewBox', `0 0 ${el.offsetWidth} ${el.offsetHeight}`);
      lashes.style.setProperty('--kz-eye-glyph-lash-width', `${z.em * 0.032}px`);
      const f2 = (n) => n.toFixed(1);
      lashSet.replaceChildren(
        ...(len > 0
          ? z.lashes.map(({ x, y, nx, ny, f }) => {
              const a = f * 0.3;
              const ux = nx * Math.cos(a) - ny * Math.sin(a);
              const uy = nx * Math.sin(a) + ny * Math.cos(a);
              const l = len * (1 - Math.abs(f) * 0.25);
              const curl = -Math.sign(f) * l * 0.2; // outwards, square to the lash
              const [ax, ay] = [bx + x - ux * into, by + y - uy * into];
              const [qx, qy] = [bx + x + ux * l * 0.55 - uy * curl, by + y + uy * l * 0.55 + ux * curl];
              const [tx, ty] = [bx + x + ux * l, by + y + uy * l];
              return svg('path', { d: `M ${f2(ax)} ${f2(ay)} Q ${f2(qx)} ${f2(qy)} ${f2(tx)} ${f2(ty)}` });
            })
          : [])
      );

      el.classList.add('is-open');
      eye.draw();
    };

    eye.draw = () => {
      if (eye.geo) pupil.style.transform = `translate(${eye.at.x * eye.geo.tx}px, ${eye.at.y * eye.geo.ty}px)`;
    };

    // The blink: the upper lid drops fast, the lower one rises a little, they meet on a curved
    // line, then the eye opens again more slowly; the lashes follow the lid
    eye.blink = (duration, then) => {
      if (!eye.lid) return;
      const { upperOpen, upperShut, lowerOpen, lowerShut, dip } = eye.lid;
      const move = (from, to) => [
        { transform: `translateY(${from}px)`, easing: CLOSE },
        { transform: `translateY(${to}px)`, offset: 0.34 },
        { transform: `translateY(${to}px)`, offset: 0.44, easing: OPEN },
        { transform: `translateY(${from}px)` },
      ];
      const a = upper.animate(move(upperOpen, upperShut), duration);
      lower.animate(move(lowerOpen, lowerShut), duration);
      lashSet.animate(
        [
          { transform: 'none', easing: CLOSE },
          { transform: `translateY(${dip}px) scaleY(0.82)`, offset: 0.34 },
          { transform: `translateY(${dip}px) scaleY(0.82)`, offset: 0.44, easing: OPEN },
          { transform: `translateY(${-dip * 0.2}px)`, offset: 0.8 },
          { transform: 'none' },
        ],
        duration
      );
      if (then) a.onfinish = then;
    };

    return eye;
  }

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const eyes = [...root.querySelectorAll('.kodza-eye-glyph__eye')].map((el) => makeEye(el, root));
    if (!eyes.length) return;
    const timers = new Set();
    const later = (fn, ms) => {
      const t = setTimeout(() => {
        timers.delete(t);
        fn();
      }, ms);
      timers.add(t);
    };
    let raf = 0;
    let speed = 0.16;
    let visible = false;
    let awake = false;
    let lastMove = 0;

    const placeAll = () => eyes.forEach((eye) => eye.place());
    placeAll();
    document.fonts?.ready.then(() => !signal.aborted && placeAll());
    const ro = new ResizeObserver((entries) =>
      entries.forEach((entry) => eyes.find((eye) => eye.el === entry.target)?.place())
    );
    eyes.forEach((eye) => ro.observe(eye.el));
    signal.addEventListener('abort', () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    });
    if (reduceMotion) return; // the eyes stay open and look straight ahead

    const frame = () => {
      let moving = false;
      eyes.forEach((eye) => {
        eye.at.x += (eye.look.x - eye.at.x) * speed;
        eye.at.y += (eye.look.y - eye.at.y) * speed;
        if (Math.abs(eye.look.x - eye.at.x) < 0.002 && Math.abs(eye.look.y - eye.at.y) < 0.002) {
          eye.at.x = eye.look.x;
          eye.at.y = eye.look.y;
        } else moving = true;
        eye.draw();
      });
      raf = moving ? requestAnimationFrame(frame) : 0;
    };
    const go = (s) => {
      speed = s;
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const set = (eye, x, y) => {
      const n = Math.hypot(x, y);
      eye.look.x = n > 1 ? x / n : x;
      eye.look.y = n > 1 ? y / n : y;
    };

    // Each eye looks at the pointer on its own: a little away, the pupil is already near the edge
    // of the hole; right on the eye, it aims true; two eyes cross when the pointer is between them
    window.addEventListener(
      'pointermove',
      (event) => {
        if (event.pointerType === 'touch' || !visible) return;
        lastMove = performance.now();
        eyes.forEach((eye) => {
          if (!eye.geo) return;
          const box = eye.el.getBoundingClientRect();
          const scale = box.width / eye.el.offsetWidth || 1;
          const dx = event.clientX - (box.left + eye.geo.x * scale);
          const dy = event.clientY - (box.top + eye.geo.y * scale);
          const d = Math.hypot(dx, dy);
          const near = parseFloat(getComputedStyle(eye.el).fontSize) * 0.25 * scale;
          const m = d < 0.5 ? 0 : 1 / (d + near);
          set(eye, dx * m, dy * m);
        });
        go(0.16);
      },
      { signal, passive: true }
    );

    // Blinks: all the eyes of a word together, from time to time, twice in a row one time in four
    const duration = () => time(getComputedStyle(root).getPropertyValue('--kz-eye-glyph-blink'), 340);
    const blinkAll = (twice) => {
      const d = duration();
      eyes.forEach((eye, i) => eye.blink(d, twice && i === 0 ? () => later(() => blinkAll(false), 90) : null));
    };
    let quiet = 0; // after a wink, no blink on its own for a while: the wink stays readable
    const blinks = () => {
      if (visible && !document.hidden && performance.now() > quiet) blinkAll(Math.random() < 0.25);
      const every = time(getComputedStyle(root).getPropertyValue('--kz-eye-glyph-every'), 4200);
      later(blinks, every * (0.55 + Math.random() * 0.9));
    };
    // Poke one: it winks, on its own. "kodza:replay" on the root blinks them all, on cue
    eyes.forEach((eye) =>
      eye.el.addEventListener(
        'pointerdown',
        () => {
          quiet = performance.now() + 1800;
          eye.blink(duration());
        },
        { signal }
      )
    );
    root.addEventListener('kodza:replay', () => blinkAll(false), { signal });

    // With no pointer moving, they look around in small jumps, and sometimes back at you
    const wander = () => {
      if (visible && !document.hidden && performance.now() - lastMove > 2600) {
        if (Math.random() < 0.3) eyes.forEach((eye) => set(eye, 0, 0));
        else {
          const angle = Math.random() * Math.PI * 2;
          const r = 0.55 + Math.random() * 0.45;
          eyes.forEach((eye) => set(eye, Math.cos(angle) * r, Math.sin(angle) * r));
        }
        go(0.3);
      }
      later(wander, 1400 + Math.random() * 2000);
    };

    // They wake up the first time they are seen: a double blink, then the rest of their life
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible || awake) return;
      awake = true;
      later(() => {
        blinkAll(true);
        later(blinks, 2400);
        later(wander, 1800);
      }, 450);
    });
    io.observe(root);
    signal.addEventListener('abort', () => io.disconnect());
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
