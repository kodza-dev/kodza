// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Drag Cursor
// On a zone you can grab (data-cursor="drag"), a "Drag" disc rides beside the hand, a step
// behind it: it tightens when you press and the arrow on the side you pull leans out. The system
// cursor stays (a grab hand). A zone that scrolls sideways is lent a mouse drag, which lets its
// scroll snap settle on release; a zone with a drag of its own (a slider, Before / After) keeps
// it. The strip glides after the hand and settles on a slide, and each picture drifts inside its
// frame as it travels. Settings: the --kz-drag-cursor-* variables and the constants below. Nothing
// under a finger, where the swipe is native (the pictures still drift); with reduced motion the
// disc stays away, nothing drifts and the drag still works.
(() => {
  const SELECTOR = '[data-kodza-drag-cursor]';
  const ZONE = '[data-cursor="drag"]';
  // How fast the disc catches up with the pointer, per frame (1 = glued to it)
  const LAG = 0.22;
  // Where the disc's centre sits from the pointer, in px: down and right, clear of the hand
  const OFFSET = 40;
  // How far the arrow on the side you pull leans out, in px, and the speed that gets it there
  const LEAN = 8;
  const LEAN_SPEED = 1400;
  // How fast the strip catches up with the hand while held, and with its slide once let go, per
  // frame (1 = no glide)
  const HOLD_EASE = 0.3;
  const SETTLE_EASE = 0.1;
  // A release carries the hand's speed this long, in s, before the strip picks its slide
  const FLICK = 0.3;
  // How far a picture drifts inside its frame, in % of its width, from one edge of the strip to the
  // other (keep it under (zoom - 1) / 2, or the frame shows its edge)
  const DRIFT = 7;
  // The frames tighten when you grab, and a little more with the strip's speed (px/s)
  const GRAB_SQUASH = 0.965;
  const SPEED_SQUASH = 0.025;
  const SQUASH_SPEED = 3000;
  // A drag longer than this, in px, swallows the click that ends it (a link under the hand)
  const CLICK_SLOP = 6;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    // A mouse or a pen: a finger swipes the strip natively
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const disc = root.querySelector('.kodza-drag-cursor__disc');
    const zones = [...root.querySelectorAll(ZONE)];

    // Each picture drifts inside its frame by how far its slide sits from the middle of the strip,
    // under a mouse as under a finger
    const strips = new Map();
    zones.forEach((zone) => {
      const slides = [...zone.querySelectorAll('.kodza-drag-cursor__slide')];
      const strip = { marks: [] };
      let raf = 0;
      const drift = () => {
        raf = 0;
        const mid = zone.scrollLeft + zone.clientWidth / 2;
        const span = zone.clientWidth || 1;
        strip.marks.forEach(({ slide, left, width }) => {
          const d = Math.max(-1, Math.min(1, (left + width / 2 - mid) / span));
          slide.style.setProperty('--kz-drag-cursor-shift', `${(-d * DRIFT).toFixed(2)}%`);
        });
      };
      const measure = () => {
        strip.marks = slides.map((slide) => ({ slide, left: slide.offsetLeft, width: slide.offsetWidth }));
        if (!still) drift();
      };
      strips.set(zone, strip);
      measure();
      if (still) return;
      zone.addEventListener('scroll', () => {
        if (!raf) raf = requestAnimationFrame(drift);
      }, { passive: true, signal });
      const ro = new ResizeObserver(measure);
      ro.observe(zone);
      signal.addEventListener('abort', () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        slides.forEach((slide) => slide.style.removeProperty('--kz-drag-cursor-shift'));
      });
    });
    if (!still && zones.length) {
      root.classList.add('is-drifting');
      signal.addEventListener('abort', () => root.classList.remove('is-drifting'));
    }

    if (!fine || !zones.length) return;
    root.classList.add('is-live');

    let lean = 0;
    const show = (on) => root.classList.toggle('is-on', on && !still);

    zones.forEach((zone) => {
      const strip = strips.get(zone);
      let grab = null;
      // The strip's own glide: `to` is where the hand (or the slide picked on release) wants it,
      // `at` where it is drawn
      const glide = { to: 0, at: 0, ease: HOLD_EASE, raf: 0, last: 0, speed: 0, squash: 1 };
      const room = () => Math.max(0, zone.scrollWidth - zone.clientWidth);

      const restore = () => {
        if (!glide.snap) return;
        zone.style.scrollSnapType = glide.snap.type;
        zone.style.scrollBehavior = glide.snap.behavior;
        glide.snap = null;
      };
      const stop = () => {
        cancelAnimationFrame(glide.raf);
        glide.raf = 0;
        glide.squash = 1;
        root.style.removeProperty('--kz-drag-cursor-squash');
        restore();
      };
      const step = (now) => {
        const dt = Math.min(0.05, (now - glide.last) / 1000 || 1 / 60) / pace;
        glide.last = now;
        const k = 1 - (1 - glide.ease) ** (dt * 60);
        const before = glide.at;
        glide.at += (glide.to - glide.at) * k;
        const done = !grab && Math.abs(glide.to - glide.at) < 0.5;
        if (done) glide.at = glide.to;
        zone.scrollLeft = glide.at;
        glide.speed = (glide.at - before) / (dt * pace || 1 / 60);
        const tight = (grab ? GRAB_SQUASH : 1) - Math.min(1, Math.abs(glide.speed) / SQUASH_SPEED) * SPEED_SQUASH;
        glide.squash += (tight - glide.squash) * k;
        root.style.setProperty('--kz-drag-cursor-squash', glide.squash.toFixed(4));
        if (done && Math.abs(glide.squash - 1) < 0.001) return stop();
        glide.raf = requestAnimationFrame(step);
      };
      const run = () => {
        if (glide.raf) return;
        glide.last = performance.now();
        glide.raf = requestAnimationFrame(step);
      };
      // A wheel or a key takes the strip back from the glide
      ['wheel', 'keydown'].forEach((type) => zone.addEventListener(type, () => {
        if (!grab && glide.raf) stop();
      }, { passive: true, signal }));

      const place = (q) => {
        const rb = root.getBoundingClientRect();
        const zb = zone.getBoundingClientRect();
        const s = rb.width / root.offsetWidth || 1;
        disc.style.setProperty('--kz-drag-cursor-x', `${(zb.left - rb.left) / s + q.lx + OFFSET}px`);
        disc.style.setProperty('--kz-drag-cursor-y', `${(zb.top - rb.top) / s + q.ly + OFFSET}px`);
      };

      const p = track(zone, signal, {
        lag: LAG,
        enter: (q) => {
          if (disc && !still) place(q);
          show(true);
        },
        leave: () => {
          if (!grab) show(false);
        },
        down: (q, e) => {
          root.classList.add('is-pressed');
          if (zone.scrollWidth <= zone.clientWidth + 1) return; // it has a drag of its own
          grab = { x: q.x, moved: 0 };
          if (!glide.snap) glide.snap = { type: zone.style.scrollSnapType, behavior: zone.style.scrollBehavior };
          zone.style.scrollSnapType = 'none';
          zone.style.scrollBehavior = 'auto';
          if (!glide.raf) glide.at = zone.scrollLeft;
          glide.to = glide.at;
          glide.ease = HOLD_EASE;
          zone.classList.add('is-grabbing');
          try {
            zone.setPointerCapture(e.pointerId); // the drag goes on past the zone's edge
          } catch {}
          e.preventDefault();
          if (!still) run();
        },
        move: (q) => {
          if (!grab || !q.pressed) return;
          const dx = q.x - grab.x;
          grab.x = q.x;
          grab.moved += Math.abs(dx);
          if (still) {
            zone.scrollLeft -= dx;
            return;
          }
          glide.to = Math.max(0, Math.min(room(), glide.to - dx));
        },
        up: (q) => release(q),
        frame: (q) => {
          if (!disc || still) return false;
          place(q);
          const want = q.pressed ? Math.max(-1, Math.min(1, q.vx / LEAN_SPEED)) : 0;
          lean += (want - lean) * 0.25;
          if (Math.abs(lean) < 0.01 && !want) lean = 0;
          disc.style.setProperty('--kz-drag-cursor-lean-prev', `${Math.max(0, -lean) * LEAN}px`);
          disc.style.setProperty('--kz-drag-cursor-lean-next', `${Math.max(0, lean) * LEAN}px`);
          return lean !== 0;
        },
      });

      // Where the strip lands: the hand's speed carries it on, then the nearest slide's start
      function landing(from, vx) {
        const max = room();
        const aim = Math.max(0, Math.min(max, from - vx * FLICK));
        if (!strip.marks.length) return aim;
        let best = max;
        strip.marks.forEach(({ left }) => {
          const at = Math.min(left, max);
          if (Math.abs(at - aim) < Math.abs(best - aim)) best = at;
        });
        return best;
      }

      function release(q) {
        root.classList.remove('is-pressed');
        if (!grab) return;
        const { moved } = grab;
        grab = null;
        zone.classList.remove('is-grabbing');
        if (still) {
          restore();
        } else {
          glide.to = landing(glide.to, q.vx);
          glide.ease = SETTLE_EASE;
          run();
        }
        if (moved > CLICK_SLOP) {
          // The click that ends a drag is not a click on what lies under the hand
          const swallow = (e) => {
            e.preventDefault();
            e.stopPropagation();
          };
          zone.addEventListener('click', swallow, { capture: true, once: true, signal });
          setTimeout(() => zone.removeEventListener('click', swallow, true), 0);
        }
        if (!q.inside) show(false);
      }

      zone.addEventListener('pointercancel', () => release(p), { signal });
      zone.addEventListener('lostpointercapture', () => grab && release(p), { signal });
      zone.addEventListener('dragstart', (e) => e.preventDefault(), { signal });
      signal.addEventListener('abort', () => {
        stop();
      });
    });

    signal.addEventListener('abort', () => {
      root.classList.remove('is-live', 'is-on', 'is-pressed');
      if (disc) {
        ['x', 'y', 'lean-prev', 'lean-next'].forEach((k) => disc.style.removeProperty(`--kz-drag-cursor-${k}`));
      }
      zones.forEach((zone) => zone.classList.remove('is-grabbing'));
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
