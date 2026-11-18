// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Spotlight Reveal
// Lays fogged glass over the hero picture, on a canvas: the picture blurred and veiled with the
// fog colour. The pointer wipes a soft circle through it, and each wiped spot closes again
// slowly behind the hand. Settings: the --kz-spotlight-reveal-* variables (fog, blur, reach,
// linger), and the constants below. With reduced motion, or without the script, no fog at all.
(() => {
  const SELECTOR = '[data-kodza-spotlight-reveal]';
  // How fast the wiping hand catches up with the pointer, per frame (1 = glued to it)
  const LAG = 0.3;
  // Wiped spots along the path, this share of the radius apart
  const SPACING = 0.16;
  // How long the fog takes to settle on the glass once the hero is first seen, in seconds
  const CONDENSE = 1.4;
  // How long the circle takes to open under a pointer that comes in, in seconds
  const OPEN = 0.35;
  // A wiped spot shrinks to this share of the radius while the fog closes it
  const CLOSE_TO = 0.55;
  // The most wiped spots kept at once: a frantic hand never slows the page
  const MAX_SPOTS = 360;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const smooth = (t) => t * t * (3 - 2 * t);

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const frame = root.querySelector('.kodza-spotlight-reveal__frame') || root;
    const img = frame.querySelector('.kodza-spotlight-reveal__picture');
    if (still || !img) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.className = 'kodza-spotlight-reveal__fog';
    canvas.setAttribute('aria-hidden', 'true');
    img.after(canvas);
    root.classList.add('is-live');
    const fog = document.createElement('canvas'); // the fogged picture, drawn once per size
    const brush = document.createElement('canvas'); // one soft round wipe, stamped along the path

    let width = 0;
    let height = 0;
    let ratio = 1;
    let radius = 120;
    let linger = 1.6;
    let built = false;
    let settled = 0; // the fog settling on the glass, 0 to 1
    let open = 0; // the circle under the pointer, 0 to 1
    let lastX = null;
    let lastY = null;
    let chasing = false; // the pointer has left, the lagging hand still finishes its path
    let spots = [];
    // The picture at its real size. With srcset, naturalWidth is scaled to the screen while the
    // canvas draws the file's own pixels: the crop would take a corner of the picture
    let picture = null;

    const read = () => {
      const style = getComputedStyle(canvas);
      radius = Math.max(parseFloat(style.textIndent) || 120, 8);
      const time = getComputedStyle(root).getPropertyValue('--kz-spotlight-reveal-linger').trim();
      linger = Math.max(time.endsWith('ms') ? parseFloat(time) / 1000 : parseFloat(time) || 1.6, 0.1);
      return style.color;
    };

    // The picture as object-fit: cover crops it, so the fog lines up with it to the pixel
    const crop = () => {
      const iw = picture.naturalWidth;
      const ih = picture.naturalHeight;
      const s = Math.max(width / iw, height / ih);
      const sw = width / s;
      const sh = height / s;
      const [px, py] = getComputedStyle(img).objectPosition.split(' ').map((v) => (v.endsWith('%') ? parseFloat(v) / 100 : 0.5));
      return [(iw - sw) * (px ?? 0.5), (ih - sh) * (py ?? 0.5), sw, sh];
    };

    // Where the canvas has no filter: halve the picture down to a few pixels, then scale it back
    // up step by step with smoothing on
    const blurred = (w, h, blur) => {
      let src = document.createElement('canvas');
      let sw = Math.max(Math.round(w / 2), 1);
      let sh = Math.max(Math.round(h / 2), 1);
      src.width = sw;
      src.height = sh;
      let c = src.getContext('2d');
      c.imageSmoothingQuality = 'high';
      c.drawImage(picture, ...crop(), 0, 0, sw, sh);
      const smallest = Math.max(w / Math.max(blur / 2, 1), 4);
      const steps = [];
      while (sw / 2 >= smallest) {
        const next = document.createElement('canvas');
        next.width = Math.max(Math.round(sw / 2), 1);
        next.height = Math.max(Math.round(sh / 2), 1);
        c = next.getContext('2d');
        c.imageSmoothingQuality = 'high';
        c.drawImage(src, 0, 0, next.width, next.height);
        steps.push(src);
        src = next;
        sw = next.width;
        sh = next.height;
      }
      // Back up through the same sizes, each pass softening the last
      for (let i = steps.length - 1; i >= 0; i--) {
        const up = steps[i];
        c = up.getContext('2d');
        c.clearRect(0, 0, up.width, up.height);
        c.drawImage(src, 0, 0, up.width, up.height);
        src = up;
      }
      return src;
    };

    const build = () => {
      if (!picture) return false;
      width = frame.offsetWidth;
      height = frame.offsetHeight;
      if (!width || !height) return false;
      const scale = frame.getBoundingClientRect().width / width || 1;
      // The fog is soft all over: no need for every device pixel
      ratio = Math.min((window.devicePixelRatio || 1) * scale, 1.5);
      const color = read();
      canvas.width = fog.width = Math.round(width * ratio);
      canvas.height = fog.height = Math.round(height * ratio);
      const f = fog.getContext('2d');
      f.clearRect(0, 0, fog.width, fog.height);
      if (picture) {
        const blur = (parseFloat(getComputedStyle(root).getPropertyValue('--kz-spotlight-reveal-blur')) || 28) * ratio;
        f.imageSmoothingQuality = 'high';
        if ('filter' in f) {
          // The sharp picture first: the blur fades out at the edges, the picture holds them
          f.drawImage(picture, ...crop(), 0, 0, fog.width, fog.height);
          f.filter = `blur(${blur}px)`;
          f.drawImage(picture, ...crop(), 0, 0, fog.width, fog.height);
          f.filter = 'none';
        } else {
          f.drawImage(blurred(fog.width, fog.height, blur), 0, 0, fog.width, fog.height);
        }
      }
      f.fillStyle = color;
      f.fillRect(0, 0, fog.width, fog.height);

      // The wipe: full in the middle, a long soft edge, so the spots melt into one path
      const size = Math.ceil(radius * 2 * ratio);
      brush.width = brush.height = size;
      const b = brush.getContext('2d');
      const g = b.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      for (let t = 0; t <= 1.0001; t += 0.05) {
        const k = t < 0.4 ? 1 : 1 - smooth((t - 0.4) / 0.6);
        g.addColorStop(Math.min(t, 1), `rgba(0, 0, 0, ${k.toFixed(3)})`);
      }
      b.clearRect(0, 0, size, size);
      b.fillStyle = g;
      b.fillRect(0, 0, size, size);
      built = true;
      return true;
    };

    const stamp = (x, y, r, alpha) => {
      if (alpha <= 0.004 || r <= 0) return;
      ctx.globalAlpha = alpha;
      ctx.drawImage(brush, x - r, y - r, r * 2, r * 2);
    };

    // One frame: the fog, then every wiped spot cut out of it, the oldest the faintest
    const draw = (p, dt) => {
      if (!built && !build()) return false;
      settled = Math.min(settled + dt / CONDENSE, 1);
      if (chasing && Math.abs(p.x - p.lx) + Math.abs(p.y - p.ly) < 1) {
        // Caught up: the spot under the hand stays behind, and closes like the others
        chasing = false;
        spots.push({ x: p.lx, y: p.ly, t: p.time, r: 1 - (1 - open) ** 3 });
        lastX = lastY = null;
      }
      const wiping = p.inside || chasing;
      open = wiping ? Math.min(open + dt / OPEN, 1) : 0;

      // New spots along the path the hand has travelled since the last frame
      if (wiping) {
        if (lastX === null) {
          lastX = p.lx;
          lastY = p.ly;
        }
        const step = radius * SPACING;
        const dx = p.lx - lastX;
        const dy = p.ly - lastY;
        const n = Math.floor(Math.hypot(dx, dy) / step);
        for (let i = 1; i <= n; i++) spots.push({ x: lastX + (dx * i) / n, y: lastY + (dy * i) / n, t: p.time, r: open });
        if (n) {
          lastX = p.lx;
          lastY = p.ly;
        }
        if (spots.length > MAX_SPOTS) spots = spots.slice(-MAX_SPOTS);
      }
      spots = spots.filter((s) => p.time - s.t < linger);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = smooth(settled);
      ctx.drawImage(fog, 0, 0);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.globalCompositeOperation = 'destination-out';
      for (const s of spots) {
        const left = 1 - (p.time - s.t) / linger;
        stamp(s.x, s.y, radius * s.r * (CLOSE_TO + (1 - CLOSE_TO) * smooth(left)), smooth(left));
      }
      // Under a pointer that rests, the glass stays wiped
      if (wiping) stamp(p.lx, p.ly, radius * (1 - (1 - open) ** 3), 1);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      return settled < 1 || spots.length > 0 || chasing || (p.inside && open < 1);
    };

    const p = track(frame, signal, {
      lag: LAG,
      touch: true,
      frame: draw,
      enter: () => {
        chasing = false;
        lastX = lastY = null;
      },
      leave: () => {
        chasing = lastX !== null;
      },
    });

    // A new picture (srcset, lazy load, a swapped source): fog it again
    const load = () => {
      const url = img.currentSrc || img.src;
      if (!url || picture?.src === url) return;
      const next = new Image();
      next.src = url;
      next.decode().then(() => {
        if (signal.aborted || (img.currentSrc || img.src) !== url) return;
        picture = next;
        built = false;
        p.wake();
      }, () => {});
    };
    if (img.complete) load();
    img.addEventListener('load', load, { signal });
    const ro = new ResizeObserver(() => {
      if (frame.offsetWidth === width && frame.offsetHeight === height) return;
      built = false;
      p.wake();
    });
    ro.observe(frame);
    // The fog takes the page colour: a theme switch fogs it again
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      built = false;
      p.wake();
    }, { signal });

    signal.addEventListener('abort', () => {
      ro.disconnect();
      canvas.width = canvas.height = fog.width = fog.height = brush.width = brush.height = 0; // the pixels go back now
      canvas.remove();
      root.classList.remove('is-live');
    });
  }

  // ---- Kodza pointer engine 1.0 ------------------------------------------------------------
  // The same copy in every component of the Cursor family (Spotlight Reveal, Image Trail, Cursor
  // Label, Drag Cursor): it follows the pointer over a zone in the zone's own pixels (a parent
  // scaled by transform does not shift it, a scroll under a still mouse is followed), with a
  // lag, the speed of the hand, and frames that run only while something asks for them and the
  // zone is seen (off-screen and in a hidden tab, nothing runs). Change it here, then copy it to
  // the others as is.
  //   track(zone, signal, { lag: share of the gap closed per frame, 1 = glued; touch: true to
  //     follow a finger too; enter(p, e), move(p, e), leave(p, e), down(p, e), up(p, e);
  //     frame(p, dt): true while it wants another frame }) → p
  //   p = { x, y: the pointer; lx, ly: the lagged hand; vx, vy: speed in px/s; inside, pressed,
  //         type: 'mouse' | 'pen' | 'touch'; width, height; time: seconds, paced; wake() }
  function track(zone, signal, o = {}) {
    const pace = paceOf(zone) || 1;
    const lag = Math.min(Math.max(o.lag ?? 1, 0.01), 1);
    const p = { x: 0, y: 0, lx: 0, ly: 0, vx: 0, vy: 0, inside: false, pressed: false, type: '', width: 0, height: 0, time: 0, wake: () => wake() };
    let raf = 0;
    let last = 0;
    let seen = false;
    let shown = !document.hidden;
    let cx = 0;
    let cy = 0;
    let at = 0;

    const locate = () => {
      const box = zone.getBoundingClientRect();
      const s = box.width / zone.offsetWidth || 1;
      p.width = zone.offsetWidth;
      p.height = zone.offsetHeight;
      p.x = (cx - box.left) / s;
      p.y = (cy - box.top) / s;
    };
    const running = () => seen && shown && !signal.aborted;
    function wake() {
      if (raf || !running()) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
    function tick(now) {
      raf = 0;
      if (!running()) return;
      const dt = Math.min(Math.max((now - last) / 1000, 0), 1 / 20) / pace; // the site's pace stretches the time
      last = now;
      p.time += dt;
      const k = 1 - (1 - lag) ** (dt * 60);
      p.lx += (p.x - p.lx) * k;
      p.ly += (p.y - p.ly) * k;
      const trailing = Math.abs(p.x - p.lx) + Math.abs(p.y - p.ly) > 0.1;
      if (!trailing) {
        p.lx = p.x;
        p.ly = p.y;
      }
      const slow = Math.exp(-dt * 10); // a hand that stops has no speed left
      p.vx *= slow;
      p.vy *= slow;
      const more = o.frame ? o.frame(p, dt) : false;
      if (more || trailing) raf = requestAnimationFrame(tick);
    }

    const follows = (e) => o.touch || e.pointerType !== 'touch';
    const take = (e) => {
      const t = e.timeStamp;
      const px = p.x;
      const py = p.y;
      cx = e.clientX;
      cy = e.clientY;
      p.type = e.pointerType;
      locate();
      const dt = (t - at) / 1000;
      if (p.inside && dt > 0 && dt < 0.1) {
        const k = Math.max(dt, 1 / 240);
        p.vx = p.vx * 0.5 + ((p.x - px) / k) * 0.5;
        p.vy = p.vy * 0.5 + ((p.y - py) / k) * 0.5;
      }
      at = t;
    };
    const enter = (e) => {
      take(e);
      p.lx = p.x;
      p.ly = p.y;
      p.vx = p.vy = 0;
      p.inside = true;
      o.enter?.(p, e);
    };
    const leave = (e) => {
      if (!p.inside) return;
      p.inside = false;
      p.pressed = false;
      o.leave?.(p, e);
      wake();
    };

    zone.addEventListener('pointermove', (e) => {
      if (!follows(e)) return;
      if (!p.inside) enter(e);
      else take(e);
      o.move?.(p, e);
      wake();
    }, { signal });
    zone.addEventListener('pointerdown', (e) => {
      if (!follows(e) || e.button > 0) return;
      if (!p.inside) enter(e);
      p.pressed = true;
      o.down?.(p, e);
      wake();
    }, { signal });
    zone.addEventListener('pointerup', (e) => {
      if (!follows(e)) return;
      p.pressed = false;
      o.up?.(p, e);
      if (e.pointerType === 'touch') leave(e); // a lifted finger is gone
      wake();
    }, { signal });
    zone.addEventListener('pointerleave', (e) => follows(e) && leave(e), { signal });
    zone.addEventListener('pointercancel', (e) => follows(e) && leave(e), { signal }); // the finger started a scroll
    // The page scrolls under a mouse that does not move: the pointer moves over the zone
    window.addEventListener('scroll', () => {
      if (!p.inside || p.type === 'touch') return;
      locate();
      o.move?.(p, null);
      wake();
    }, { passive: true, signal });

    const io = new IntersectionObserver((entries) => {
      seen = entries[entries.length - 1].isIntersecting;
      wake();
    });
    io.observe(zone);
    document.addEventListener('visibilitychange', () => {
      shown = !document.hidden;
      wake();
    }, { signal });
    signal.addEventListener('abort', () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    });
    return p;
  }
  // ---- end of the pointer engine ---------------------------------------------------------

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
