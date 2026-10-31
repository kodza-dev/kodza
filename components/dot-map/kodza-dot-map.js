// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Dot Map
// Draws a world map in fine dots behind the hero, framed on the places listed in it: each place
// gets its dot, its label and its local time, and a ring tours them one after the other, lighting
// the dots it crosses. Without the script, the places stay a plain list, with no times.
(() => {
  const SELECTOR = '[data-kodza-dot-map]';
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

  // The land, one cell per degree from 80 N down to 58 S (Natural Earth, public domain, by way of
  // world-atlas): 360 x 138 cells, west to east from 180 W, north to south. Written as runs that
  // alternate sea and land, sea first; each run is a number in base-64 digits, five bits a digit,
  // low bits first, the sixth bit saying that another digit follows.
  const MASK = [
    '0CXHvBePjCH0EBGFCCDRD1BgBHDBtCFoEDDCXKH0BhBEDCwCClEFBBFCHDBGCKJyBzCFfNjELEECCBNVnBtCHZZXICB5CCIC',
    'QBDKYlBrCEbZ9DIKBEEBFCDBDBEVjBrCDYmBEEOC8CQBDDFBDDJBEVhBqCENEIwBKIhBC1BFBOFGEQThBpCFMEBCB1BDBGLx',
    'BMfQFFDUOeBCtBHlBGB2ClBYEPDQCDBEGEEKNCBcqBObDE9CJEHBM1BGDHBDGCFGHQYsBWOCDKCFBtDMsCBGECCJKVvBbDCC',
    'ZCuDBDGBCvCJMJSwBUCGDcBrDBHExCBBLGDCKNRJaKDKFsEFCHEBpCCEENNLSIZLDLCuEKCHnCEDCBJHNLVCaMC9EQpCICEC',
    'GDRHxBMD-EPoCQGXGwBMEpEBDCJWRC0BQJXDwBNEmEGJbJBCKtBRJDClCNGjEFEmBEQtBPKBE6BBKDCGH1DSDoBCCCSqBPP4',
    'BEOFFBB0DRGlBCZtBLQ3BDLDBEF1DSHiBDcvBHS3BDKCBDH0DSHjCxBDWwBDCDJDBBD5DTFiCBCwBDXuBECEGnEBBNEnCwBC',
    'XuBDCHCrENCqCwBBXzBGCqEBBNCqClCBCzBDDsEBC5C8BDCEE0BuECC7CBB2BBDGGxBwECB9C7BGGyBuEDB9C8BDB6BhBBEC',
    'MD1CEB9CgC7BfDDBLF0CjD5BBD-BOCOJJE1CGB9C2BEB4BQDECMMID0CGE7C1B-BMGBBEDKNHEvCJE8C1B-BMJEDJEFEIFsC',
    'KB_CyBhCKHCFDBFCYDkCBHLC-CyBhCJICGBDDDYDiCCCCDMC_CwBiCJQBEDCXFgCHDLCgDvBjCIOCGCEXEhCBCEDJDhDuBmC',
    'BGKLBGCB5CFEGFiDtBmCBDNWBC0CGDEIjDrBmCSZ0CHBDHoDnBnCTY2CJEtDlBnCYFDM2CJCvDkBnCaEHDBD4CIBxDBCgBnC',
    'kE7DBBTBEGCnC6BCoC8DBBQNClC9BCnC7DDBOODjCvBBODlC-DBCNPCiCwBCOEBC_BgEBCMQBhCyBCPDBD8BhECCKzCyBCPC',
    'DK0BCB_DCCJyC0BCVJxBDCkEIOBBE9B1BDVJuBFBmEIICIC8B2BCULSEQBDuEJGEJE5B2BDSPOFPhDByBJFEOD2B1BERPMIN',
    'DCxEJBGKBEECByB2BDQQLKMDB0EOoC3BDNSKLNNCrELnC4BEKUJMOMCxEJjC5BDJWGSLLCyEJiC6BCHYGSLLC0EHiC7BBEcF',
    'SLMD1EEiC8BgBFSCCHlFCLE1B7BGCYFTBDGNBCB0EDHKCBBBuBiCZESBFELBCC4ECCBDEBKvBhCZDBBRCFBMB-EDBTvB_BbB',
    'CBRCXD5EBCTuB_BeCRCVBBD7EUvB8BfCSCOCGC8EZrBKFsBzBDMEkFZsBBNqBwBCCEKEkFb8BmByBCCCKFjFc9BkB0BCCCHH',
    'jFd7BkB2BFFJJB4Ee7BiB4BEGJCEDC2EhB5BhB6BEFJOByEkB2BhB7BEFHCDJDxEmB1Bf8BFEHCDKCCFqEqByBd-BEICDBBB',
    'EBBCDLnEsBwBd_BDNCBBMKHB-DuBvBbhCCQBPIDD_DuBvBbjCDdKHB8DtBwBakCGZJmEsBwBarCBCCBBECLBBDDClEsBwBbv',
    'CBEBWDkEqBxBbyHpBzBb7CBJBsEnBzBcIBxCGFBtElBzBdHCwCGFDsElBzBdHCrCDBHFEsEkBzBcGEqCMFEuEiBzBcEGqCOD',
    'FVBLBsDhBzBaGGoCYgBBvDe0BYIFpCYwEe1BWJFoCbuEe1BWJFlCfPB9Dd3BVIFjCiBQB8Dc4BWHFiClBrEZ7BWIEiClBqEY',
    '9BVJDiCnBpEX_BSMBkCnBoEX_BSxCnBoEX_BSxCnBoEWhCQyCoBmEWjCO0CmBnEWjCO0CmBnEVlCM2ClBnEUmCL3CKISoETn',
    'CJ4CJLCBOoESpCC_CDQBBOoEQjGNWBxDQlGKYBvDRlGKZBuDQoGCBCcDsDMsHDtDMtHCtDJyGDYCBBuDKxGDXDxDIzGBXDxD',
    'JpHExDIqHEyDIrHCzDJ-KJ_KIpEB3GGiLGID3KGjLGkLGlLBoe',
  ].join('');
  const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let LAND = null; // decoded once, for every map on the page

  const landAt = (lon, lat) => {
    const r = Math.floor(80 - lat);
    if (r < 0 || r >= 138) return 0;
    return LAND[r * 360 + ((Math.floor(lon + 180) % 360) + 360) % 360];
  };

  const decode = () => {
    LAND = new Uint8Array(360 * 138);
    for (let i = 0, at = 0, on = 0; i < MASK.length; on ^= 1) {
      let v = 0;
      let shift = 0;
      let d;
      do {
        d = ABC.indexOf(MASK[i++]);
        v |= (d & 31) << shift;
        shift += 5;
      } while (d & 32);
      if (on) LAND.fill(1, at, at + v);
      at += v;
    }
  };

  // The map: land only, a dot every few degrees, at rest a light grey. A ring tours the places in
  // the order they are listed, holds on each, then travels to the next, opening up on the way and
  // closing in as it lands; the land around it lights up, and so does the land under the hand. Under
  // the text that light is calmed, and the land at rest goes a little lighter: the map runs on
  // behind the words without crossing them. The first time it is seen, the map spreads out from
  // the first place.
  const MAX_DOTS = 16000;   // places on the lattice across the section at most: a huge one gets wider spacing
  const LIT = 0.95;         // alpha of a dot fully lit
  const GROW = 0.3;         // and how much bigger it gets
  const LEVELS = 20;        // dots are sorted into a few alphas: thousands of arcs, a few fills
  const REST_CALM = 0.5;    // under the text, the land at rest is calmed half as much as the light
  const NORTH = 14;         // degrees under the map's top edge (80 N) over which the land fades in
  const LIGHT = 26;         // px the ring's light reaches past the ring
  const LENS_EDGE = 18;     // px of soft edge on that light
  const REACH = 96;         // px lit around the hand
  const SETTLE = 8;         // how fast that light comes and goes (1/s)
  const SPREAD = 1100;      // px per second, the map spreading out from the first place
  const SPREAD_EDGE = 160;  // px of soft edge on that front
  const RING_DELAY = 0.5;   // s after the map starts spreading
  const RING_IN = 0.6;      // s for the ring to come in
  const HOLD = 2.5;         // s on each place
  const RING_REST = 18;     // px, the ring's radius on a place
  const RING_MOVE = 34;     // px, opened up halfway
  const RING_ALPHA = 0.55;
  const LABEL = 22;         // px from a place to its label
  const EDGE = 12;          // px a label keeps from the section's edges
  const LOOK = 0.3;         // s ahead a label checks it can still be read

  const smooth = (t) => {
    const k = Math.min(Math.max(t, 0), 1);
    return k * k * (3 - 2 * k);
  };
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

  // The camera on one axis: the middle of the places when they fit, else the ring, never past them.
  // Held between `min` and `max` (the map's edges at the section's edges) as long as the places stay
  // in the frame: no bare band where the map ends
  const follow = ([lo, hi, reach, min = -Infinity, max = Infinity], at) => {
    const fits = hi - lo <= 2 * reach;
    const c = fits ? (lo + hi) / 2 : Math.min(Math.max(at, lo + reach), hi - reach);
    const held = Math.min(Math.max(c, min), max);
    return fits ? Math.min(Math.max(held, hi - reach), lo + reach) : Math.min(Math.max(held, at - reach), at + reach);
  };

  // Where the map sits. The places are fitted into their frame (the list's box, above the text),
  // with room around them for the ring and the labels. A dot every 1.2 to 2.6 degrees: closer, the
  // coasts turn to steps; wider, the continents to noise. When the places cannot all fit at that,
  // the frame follows the ring instead; and still, where nothing follows, they go back to a row
  function view(f) {
    const box = f.root.getBoundingClientRect();
    const s = box.width / f.root.offsetWidth || 1;
    const zone = f.list?.offsetWidth ? f.list.getBoundingClientRect() : box;
    const zx = (zone.left - box.left) / s;
    const zy = (zone.top - box.top) / s;
    const zw = zone.width / s;
    const zh = zone.height / s;
    const wanted = parseFloat(getComputedStyle(f.root).getPropertyValue('--kz-dot-map-gap')) || 9;
    const spacing = Math.max(wanted, Math.sqrt((f.width * f.height) / MAX_DOTS));
    const padX = Math.max(48, zw * 0.1);
    const padY = 30;
    const P = f.places;
    let lon0 = -140; // no places: the world, Europe and Africa in the middle
    let lon1 = 160;
    let lat0 = -20;
    let lat1 = 60;
    if (P.length) {
      // The shortest arc that holds every place: the globe is cut at the widest stretch without one,
      // and the longitudes are unrolled from there (a tour across the Pacific stays in one piece)
      const sorted = P.map((p) => p.lon).sort((a, b) => a - b);
      let widest = -1;
      sorted.forEach((lon, i) => {
        const gap = i ? lon - sorted[i - 1] : lon + 360 - sorted[sorted.length - 1];
        if (gap > widest) {
          widest = gap;
          lon0 = lon;
        }
      });
      lon1 = lon0 + 360 - widest;
      P.forEach((p) => { p.u = lon0 + ((((p.lon - lon0) % 360) + 360) % 360); });
      lat0 = Math.min(...P.map((p) => p.lat));
      lat1 = Math.max(...P.map((p) => p.lat));
    }
    const fit = Math.min((zw - 2 * padX) / Math.max(lon1 - lon0, 1e-6), (zh - 2 * padY) / Math.max(lat1 - lat0, 1e-6));
    // Never more than a world across (no coast twice on screen), never shorter than the section (a
    // tall one, full screen, is covered from the top down), never past a dot per degree of the mask
    const k = Math.max(Math.min(fit, spacing / 1.2), spacing / 2.6, f.width / 340, Math.min(f.height / (138 - NORTH / 2), spacing));
    // The lattice, in degrees: a whole number of dots around the globe, so it wraps without a seam
    const nLon = Math.max(Math.round((360 * k) / spacing), 1);
    const step = 360 / nLon;
    const nLat = Math.ceil(138 / step);
    let cells = f.view?.nLon === nLon ? f.view.cells : null;
    if (!cells) {
      if (!LAND) decode();
      // Land where at least a third of the cell is: the islands stay, the coasts do not bloat
      cells = new Uint8Array(nLon * nLat);
      for (let j = 0; j < nLat; j++) {
        for (let i = 0; i < nLon; i++) {
          let hits = 0;
          for (let b = 0; b < 3; b++) {
            for (let a = 0; a < 3; a++) hits += landAt(-180 + (i + (a + 0.5) / 3) * step, 80 - (j + (b + 0.5) / 3) * step);
          }
          cells[j * nLon + i] = hits >= 3 ? 1 : 0;
        }
      }
    }
    const room = (Math.ceil(f.width / (step * k)) + 4) * (Math.ceil(f.height / (step * k)) + 4);
    const sized = f.view?.x?.length >= room ? f.view : null;
    f.view = {
      k, step, nLon, nLat, cells, zx, zy, zw, zh,
      cx: zx + zw / 2,
      cy: zy + zh / 2,
      lon: [lon0, lon1, (zw / 2 - padX) / k],
      // the top of the section no further north than halfway into the fade, its foot no further south than the mask
      lat: [lat0, lat1, (zh / 2 - padY) / k, -58 + (f.height - zy - zh / 2) / k, 80 - NORTH / 2 - (zy + zh / 2) / k],
      home: P.length ? [(lon0 + lon1) / 2, (lat0 + lat1) / 2] : [0, 0], // the camera with no ring
      x: sized?.x || new Float32Array(room),
      y: sized?.y || new Float32Array(room),
      r: sized?.r || new Float32Array(room),
      level: sized?.level || new Uint8Array(room),
      order: sized?.order || new Uint32Array(room),
      counts: new Uint32Array(LEVELS + 1),
    };
    // Each label on the side where it fits at every stop of the tour it is seen at (still, there is
    // one: the ring on the first place): decided here, not while the map pans, so a label never
    // jumps across its dot
    const stops = f.still ? P.slice(0, 1) : P;
    const at = (p, s) => [zw / 2 + (p.u - follow(f.view.lon, s.u)) * k, zh / 2 - (p.lat - follow(f.view.lat, s.lat)) * k];
    P.forEach((p) => {
      p.w = p.el.offsetWidth;
      p.h = p.el.offsetHeight;
      let right = 0;
      let left = 0;
      stops.forEach((s) => {
        const [x, y] = at(p, s);
        if (x < -4 || x > zw + 4 || y < -4 || y > zh + 4) return;
        right = Math.max(right, zx + x + LABEL + p.w - (f.width - EDGE));
        left = Math.max(left, EDGE - (zx + x - LABEL - p.w));
      });
      p.left = right > 0 && left < right;
    });
    // Still, a place that cannot be read with the ring on the first one would be lost for good:
    // the places go back to a row at the foot of the map, and the map shows no ring
    const boxes = [];
    f.listed = f.still && P.some((p) => !readable(f, p, ...at(p, P[0]), boxes));
    f.root.classList.toggle('is-listed', f.listed);
  }

  // A label can be read when its place, at (x, y) in the frame, is in the frame, the label whole
  // inside the section, and neither on a label already placed (kept in `boxes`)
  function readable(f, p, x, y, boxes) {
    const { zx, zy, zw, zh } = f.view;
    if (x < -4 || x > zw + 4 || y < -4 || y > zh + 4) return false;
    const lx = zx + x + (p.left ? -LABEL - p.w : LABEL);
    if (lx < EDGE - 1 || lx + p.w > f.width - EDGE + 1) return false;
    const box = [Math.min(lx, zx + x - 6), zy + y - p.h / 2, Math.max(lx + p.w, zx + x + 6), zy + y + p.h / 2];
    if (boxes.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) return false;
    boxes.push(box);
    return true;
  }

  // How long the ring takes from a place to the next: longer the further it goes
  const legOf = (f, i) => {
    const a = f.places[i];
    const b = f.places[(i + 1) % f.places.length];
    return Math.min(1.4 + (Math.hypot(b.u - a.u, b.lat - a.lat) * f.view.k) / 700, 3.6);
  };

  // Where the ring is (`ahead` seconds from now): on a place, or between two, and which label it lights
  function ringOf(f, ahead = 0) {
    const { places: P, tour } = f;
    if (!P.length) return null;
    let { i, moving, t, length } = tour;
    t += ahead;
    if (P.length > 1 && f.time + ahead >= tour.at) {
      if (!moving && t >= HOLD) [moving, t, length] = [true, t - HOLD, legOf(f, i)];
      if (moving && t >= length) [moving, t, i] = [false, t - length, (i + 1) % P.length];
    }
    const a = P[i];
    if (!moving) return { lon: a.u, lat: a.lat, r: RING_REST, on: i };
    const next = (i + 1) % P.length;
    const b = P[next];
    const u = Math.min(t / length, 1);
    const e = ease(u);
    return {
      lon: a.u + (b.u - a.u) * e,
      lat: a.lat + (b.lat - a.lat) * e,
      r: RING_REST + (RING_MOVE - RING_REST) * Math.sin(Math.PI * u),
      on: u < 0.12 ? tour.i : u > 0.88 ? next : -1, // the label lets go as the ring leaves, lights as it lands
    };
  }

  const quietAt = (f, x, y) => {
    const c = Math.min(Math.max(Math.round((x - f.x0) / f.gap), 0), f.cols - 1);
    const r = Math.min(Math.max(Math.round((y - f.y0) / f.gap), 0), f.rows - 1);
    return f.quiet[r * f.cols + c];
  };

  const flag = (p, name, on) => {
    if (p.flags[name] === on) return;
    p.flags[name] = on;
    p.el.classList.toggle(name, on);
  };

  const map = {
    canvas: 'kodza-dot-map__canvas',
    gap: '--kz-dot-map-gap',
    quiet: '.kodza-dot-map__eyebrow, .kodza-dot-map__title, .kodza-dot-map__lead',
    calm: '--kz-dot-map-calm',
    ambient: true, // the tour goes on while it is seen

    setup(f) {
      const css = getComputedStyle(f.root);
      const read = (name, fallback) => {
        const value = parseFloat(css.getPropertyValue(`--kz-dot-map-${name}`));
        return Number.isFinite(value) ? value : fallback;
      };
      f.size = Math.max(read('size', 1.5), 0.3);
      f.rest = Math.min(Math.max(read('rest', 0.26), 0), 1);
      f.presence = f.presence || 0;
      f.list ??= f.root.querySelector('.kodza-dot-map__places');
      f.places ??= [...f.root.querySelectorAll('.kodza-dot-map__place')]
        .map((el) => ({ el, lat: parseFloat(el.dataset.lat), lon: parseFloat(el.dataset.lon), x: Infinity, y: Infinity, w: 0, flags: {} }))
        .filter((p) => Number.isFinite(p.lon) && Math.abs(p.lat) <= 90)
        .map((p) => Object.assign(p, { lon: ((((p.lon + 180) % 360) + 360) % 360) - 180 }));
      // Still: the map is all there, the ring on the first place
      f.spreadAt ??= f.still ? -Infinity : Infinity;
      f.tour ??= { i: 0, moving: false, t: 0, length: 1, at: f.still ? -Infinity : Infinity };
      view(f);
    },

    enter(f) {
      f.spreadAt = f.time;
      f.tour.at = f.time + RING_DELAY;
    },

    push(f, dt) {
      const p = f.pointer;
      f.presence += ((p.active ? 1 : 0) - f.presence) * (1 - Math.exp(-dt * SETTLE));
      const { tour, places: P } = f;
      if (f.time < tour.at || P.length < 2) return;
      tour.t += dt;
      if (!tour.moving && tour.t >= HOLD) {
        Object.assign(tour, { moving: true, t: 0, length: legOf(f, tour.i) });
      } else if (tour.moving && tour.t >= tour.length) {
        Object.assign(tour, { moving: false, t: 0, i: (tour.i + 1) % P.length });
      }
    },

    draw(f, ctx) {
      const v = f.view;
      if (!v) return;
      const { k, step, nLon, nLat, cells, cx, cy } = v;
      const ring = f.listed ? null : ringOf(f);
      const ringIn = ring ? smooth((f.time - f.tour.at) / RING_IN) : 0;
      const camLon = follow(v.lon, ring ? ring.lon : v.home[0]);
      const camLat = follow(v.lat, ring ? ring.lat : v.home[1]);
      const sx = (lon) => cx + (lon - camLon) * k;
      const sy = (lat) => cy - (lat - camLat) * k;
      const first = f.places[0];
      const ox = first ? sx(first.u) : f.width / 2;
      const oy = first ? sy(first.lat) : f.height / 2;
      const front = (f.time - f.spreadAt) * SPREAD;
      const spread = front > Math.hypot(f.width, f.height) + SPREAD_EDGE;
      const rx = ring ? sx(ring.lon) : 0;
      const ry = ring ? sy(ring.lat) : 0;
      const lens = ringIn > 0 ? ring.r + LIGHT + LENS_EDGE : 0;
      const hand = f.presence > 0.002 ? f.pointer : null;

      // The lattice over the section, one spare dot past each edge, the longitudes unrolled
      const sk = step * k;
      const iMin = Math.ceil((camLon - cx / k - step + 180) / step - 0.5);
      const iMax = Math.floor((camLon + (f.width - cx) / k + step + 180) / step - 0.5);
      const jMin = Math.max(Math.ceil((80 - camLat - cy / k - step) / step - 0.5), 0);
      const jMax = Math.min(Math.floor((80 - camLat + (f.height - cy) / k + step) / step - 0.5), nLat - 1);
      const xMin = cx + (-180 + (iMin + 0.5) * step - camLon) * k;
      const { x: X, y: Y, r: R, level: L, order, counts } = v;
      counts.fill(0);
      let n = 0;
      for (let j = jMin; j <= jMax; j++) {
        const y = cy - (80 - (j + 0.5) * step - camLat) * k;
        const north = smooth(((j + 0.5) * step) / NORTH); // the map has no hard top edge
        const row = j * nLon;
        let c = ((iMin % nLon) + nLon) % nLon;
        for (let i = iMin, x = xMin; i <= iMax; i++, x += sk, c = c + 1 === nLon ? 0 : c + 1) {
          if (!cells[row + c]) continue;
          let e = 0;
          if (lens) {
            const dx = x - rx;
            const dy = y - ry;
            if (dx < lens && dx > -lens && dy < lens && dy > -lens) e = (1 - smooth((Math.hypot(dx, dy) - ring.r - LIGHT) / LENS_EDGE)) * ringIn;
          }
          if (hand) {
            const dx = x - hand.x;
            const dy = y - hand.y;
            if (dx < REACH && dx > -REACH && dy < REACH && dy > -REACH) {
              const t = 1 - Math.hypot(dx, dy) / REACH;
              if (t > 0) e = Math.max(e, t * t * (3 - 2 * t) * f.presence);
            }
          }
          const q = quietAt(f, x, y);
          e *= q;
          let a = (f.rest * (1 - REST_CALM * (1 - q)) + (LIT - f.rest) * e) * north;
          if (!spread) a *= smooth((front - Math.hypot(x - ox, y - oy)) / SPREAD_EDGE);
          const level = Math.round(a * LEVELS);
          if (!level) continue;
          X[n] = x;
          Y[n] = y;
          R[n] = f.size * (1 + GROW * e);
          L[n] = level;
          counts[level]++;
          n++;
        }
      }

      // Sorted by alpha (a counting sort), then one path per alpha
      for (let l = 1, at = 0; l <= LEVELS; l++) {
        const count = counts[l];
        counts[l] = at;
        at += count;
      }
      for (let m = 0; m < n; m++) order[counts[L[m]]++] = m;
      ctx.fillStyle = f.ink;
      for (let l = 1; l <= LEVELS; l++) {
        if (counts[l] === counts[l - 1]) continue;
        ctx.globalAlpha = l / LEVELS;
        ctx.beginPath();
        for (let m = counts[l - 1]; m < counts[l]; m++) {
          const q = order[m];
          ctx.moveTo(X[q] + R[q], Y[q]);
          ctx.arc(X[q], Y[q], R[q], 0, Math.PI * 2);
        }
        ctx.fill();
      }
      if (ringIn > 0) {
        ctx.globalAlpha = RING_ALPHA * ringIn;
        ctx.strokeStyle = f.ink;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(rx, ry, ring.r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // The labels follow their place: written only when something changed. The one the ring is on
      // is placed first; one that cannot be read whole, now or a moment from now, waits away (it
      // leaves before the edge or another label reaches it, not after)
      const { zx, zy } = v;
      const on = ringIn > 0 ? ring.on : -1;
      const soon = f.listed ? null : ringOf(f, LOOK);
      const soonLon = follow(v.lon, soon ? soon.lon : v.home[0]);
      const soonLat = follow(v.lat, soon ? soon.lat : v.home[1]);
      const soonOn = ringIn > 0 && soon ? soon.on : -1;
      const later = [];
      const boxes = [];
      const ahead = (p, i) => { later[i] = readable(f, p, cx + (p.u - soonLon) * k - zx, cy - (p.lat - soonLat) * k - zy, boxes); };
      if (soonOn >= 0) ahead(f.places[soonOn], soonOn);
      f.places.forEach((p, i) => i !== soonOn && ahead(p, i));
      boxes.length = 0;
      const sync = (p, i) => {
        const x = sx(p.u) - zx;
        const y = sy(p.lat) - zy;
        if (Math.abs(x - p.x) > 0.05 || Math.abs(y - p.y) > 0.05) {
          p.x = x;
          p.y = y;
          p.el.style.setProperty('--kz-dot-map-x', `${x.toFixed(2)}px`);
          p.el.style.setProperty('--kz-dot-map-y', `${y.toFixed(2)}px`);
        }
        flag(p, 'is-left', p.left);
        flag(p, 'is-away', !(later[i] && readable(f, p, x, y, boxes))); // one leaving keeps no room
        flag(p, 'is-on', p.flags['is-on'] || Math.hypot(x + zx - ox, y + zy - oy) <= front);
        flag(p, 'is-active', on === i);
      };
      if (on >= 0) sync(f.places[on], on);
      f.places.forEach((p, i) => i !== on && sync(p, i));
    },
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    // Each place: its name, then its local time, kept to the minute
    const clocks = [];
    root.querySelectorAll('.kodza-dot-map__place').forEach((el) => {
      const name = document.createElement('span');
      name.className = 'kodza-dot-map__name';
      name.append(...el.childNodes);
      el.append(name);
      let format = null;
      try {
        if (el.dataset.tz) format = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: el.dataset.tz });
      } catch {
        // an unknown time zone: the place stays, without a time
      }
      if (!format) return;
      const time = document.createElement('time');
      time.className = 'kodza-dot-map__time';
      el.append(' ', time); // read as "Osaka 17:07", not "Osaka17:07"
      clocks.push([format, time]);
    });
    let timer = 0;
    const tick = () => {
      const now = new Date();
      clocks.forEach(([format, time]) => {
        const parts = Object.fromEntries(format.formatToParts(now).map((part) => [part.type, part.value]));
        const text = `${parts.hour}:${parts.minute}`;
        if (time.textContent === text) return;
        time.textContent = text;
        time.dateTime = text;
      });
      timer = setTimeout(tick, 60000 - (Date.now() % 60000) + 50);
    };
    if (clocks.length) tick();
    signal.addEventListener('abort', () => clearTimeout(timer));

    const f = field(root, signal, map);
    if (!f) return; // no canvas: the places stay a list, with their times
    // The frame the places are fitted into moves with the text (the web font, a wider column): refit
    const refit = () => {
      if (signal.aborted || !f.width) return;
      view(f);
      if (!f.still) {
        f.wake();
        return;
      }
      f.ctx.clearRect(0, 0, f.width, f.height);
      map.draw(f, f.ctx);
    };
    const ro = new ResizeObserver(refit);
    if (f.list) ro.observe(f.list);
    signal.addEventListener('abort', () => ro.disconnect());
    document.fonts?.ready.then(refit);
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
