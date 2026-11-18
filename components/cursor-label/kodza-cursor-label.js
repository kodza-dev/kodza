// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Cursor Label
// Each card's name tag follows the pointer inside the card, a step behind it, cut by the card's
// edge: it grows as the hand comes in and leaves by the edge the hand leaves by. The system
// cursor stays. Settings: the --kz-cursor-label-* variables (colours, sizes, corner) and the
// constants below. With the keyboard the tag settles in the card's corner (CSS); under a
// finger, with reduced motion, or without the script, it sits there all along.
(() => {
  const SELECTOR = '[data-kodza-cursor-label]';
  const CARD = '.kodza-cursor-label__card';
  // How fast the tag catches up with the pointer, per frame (1 = glued to it)
  const LAG = 0.14;
  // Where the tag sits from the pointer, in px: right of it and under it, clear of the arrow
  const OFFSET_X = 16;
  const OFFSET_Y = 20;
  // How far past the card's edge the tag goes when the hand leaves, in px
  const PAST = 24;

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
    // The follow is a pointer effect: a mouse or a pen. A finger keeps the tag in its corner
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const cards = [...root.querySelectorAll(CARD)];
    if (still || !fine || !cards.length) return;
    root.classList.add('is-live');

    cards.forEach((card) => {
      const label = card.querySelector('.kodza-cursor-label__label');
      if (!label) return;
      let shown = false;
      let keepX = 0;
      let keepY = 0;
      const place = (x, y) => {
        label.style.setProperty('--kz-cursor-label-x', `${x + OFFSET_X}px`);
        label.style.setProperty('--kz-cursor-label-y', `${y + OFFSET_Y}px`);
      };

      track(card, signal, {
        lag: LAG,
        enter: (p) => {
          if (shown) {
            // Still on its way out: it turns back from where it is, no jump
            p.lx = keepX;
            p.ly = keepY;
          } else {
            place(p.x, p.y);
          }
          shown = true;
          card.classList.add('is-on');
        },
        leave: (p) => {
          // The hand left by the nearest edge: the tag carries on through it
          const w = label.offsetWidth;
          const h = label.offsetHeight;
          const edges = [
            [p.x, -OFFSET_X - w - PAST, p.y],
            [p.width - p.x, p.width + PAST, p.y],
            [p.y, p.x, -OFFSET_Y - h - PAST],
            [p.height - p.y, p.x, p.height + PAST],
          ];
          const [, x, y] = edges.reduce((a, b) => (b[0] < a[0] ? b : a));
          p.x = x;
          p.y = y;
        },
        frame: (p) => {
          if (!shown) return false;
          keepX = p.lx;
          keepY = p.ly;
          place(p.lx, p.ly);
          if (!p.inside) {
            const x = p.lx + OFFSET_X;
            const y = p.ly + OFFSET_Y;
            const out = x > p.width || y > p.height || x + label.offsetWidth < 0 || y + label.offsetHeight < 0;
            if (out) {
              shown = false;
              card.classList.remove('is-on');
              return false;
            }
          }
          return false;
        },
      });
    });

    signal.addEventListener('abort', () => {
      root.classList.remove('is-live');
      cards.forEach((card) => {
        card.classList.remove('is-on');
        card.querySelector('.kodza-cursor-label__label')?.style.removeProperty('--kz-cursor-label-x');
        card.querySelector('.kodza-cursor-label__label')?.style.removeProperty('--kz-cursor-label-y');
      });
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
