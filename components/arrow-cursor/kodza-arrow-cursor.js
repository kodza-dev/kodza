// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Arrow Cursor
// Over a picture you page through (data-cursor="arrows"), a disc rides beside the pointer: its
// arrow looks back on the left half and on on the right half, and swings over the top as you
// cross the middle. Under the arrow, the counter of the host ([data-cursor-count]) rolls only the
// digits that change. A click calls the host's own buttons ([data-cursor-prev], [data-cursor-next]),
// so the keyboard and a finger keep them: nothing under a finger, nothing with reduced motion. Any
// slider or carousel can carry it; this one also brings its own gallery, five frames that
// uncover from the side you go to. Settings: the --kz-arrow-cursor-* variables and the constants
// below.
(() => {
  const SELECTOR = '[data-kodza-arrow-cursor]';
  const ZONE = '[data-cursor="arrows"]';
  // How fast the disc catches up with the pointer, per frame (1 = glued to it)
  const LAG = 0.2;
  // Where the disc's centre sits from the pointer, in px: down and right, clear of the hand
  const OFFSET = 44;
  // How fast the arrow swings to its new side, per frame, and the band around the middle, in % of
  // the zone's width, where it keeps the side it had (no flicker on the line)
  const SWING = 0.14;
  const MIDDLE = 4;
  // The push the arrow gives on a click, in px and ms
  const NUDGE = 6;
  const NUDGE_TIME = 380;
  // A press that travels further than this, in px, is a drag or a selection, not a click
  const CLICK_SLOP = 6;
  // A count change this long after a click, in ms, rolls the way of that click (a slider that loops)
  const CLICK_MEMORY = 1500;
  // The gallery: how long a frame takes to come in, in ms, how far the old one slips away (% of
  // its width) and how much the new picture settles from
  const TURN = 900;
  const SLIP = 8;
  const SETTLE = 1.08;
  const TURN_EASE = 'cubic-bezier(0.76, 0, 0.24, 1)';
  // The digits and the label of the bar, in ms between two digits and for each roll
  const ROLL = 520;
  const ROLL_STAGGER = 45;
  const ROLL_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  // What keeps its own click inside the zone: the disc steps aside over it
  const CONTROL = 'a[href], button, input, select, textarea, label, summary, [tabindex], [contenteditable]';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const pad = (n) => String(n).padStart(2, '0');
  const isOff = (button) => !button || button.disabled || button.getAttribute('aria-disabled') === 'true';
  const numberIn = (text) => parseInt((text.match(/\d+/) || ['0'])[0], 10);
  const countOf = (el) => (el.getAttribute('data-cursor-count') || el.textContent).replace(/\s+/g, ' ').trim();

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    // A mouse or a pen: under a finger the host's buttons do it all
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // A text that rolls: the old one rises out of its mask while the new one comes up from below
    // (down when you go back). By digit (`whole` false): only the digits that change move
    const rolling = new WeakMap();
    const roll = (el, text, dir, whole) => {
      const from = rolling.get(el) ?? el.textContent;
      rolling.set(el, text);
      el.getAnimations({ subtree: true }).forEach((a) => a.cancel());
      if (still || !dir || from === text || !el.isConnected) {
        el.textContent = text;
        return;
      }
      const size = Math.max(from.length, text.length);
      const pairs = whole ? [[from, text]] : [...text.padStart(size)].map((c, i) => [from.padStart(size)[i], c]);
      el.textContent = '';
      const moves = [];
      let moved = 0;
      pairs.forEach(([a, b]) => {
        if (a === b) return el.append(b);
        const cell = document.createElement('span');
        cell.className = 'kodza-arrow-cursor__cell';
        const out = document.createElement('span');
        const into = document.createElement('span');
        out.textContent = a;
        into.textContent = b;
        cell.append(out, into);
        el.append(cell);
        const timing = { duration: ROLL * pace, delay: moved * ROLL_STAGGER * pace, easing: ROLL_EASE, fill: 'both' };
        moves.push(
          out.animate([{ transform: 'none' }, { transform: `translateY(${-dir * 100}%)` }], timing),
          into.animate([{ transform: `translateY(${dir * 100}%)` }, { transform: 'none' }], timing)
        );
        moved += 1;
      });
      Promise.all(moves.map((a) => a.finished)).then(() => {
        if (rolling.get(el) === text) el.textContent = text;
      }, () => {});
    };

    const gallery = galleryOf(root, signal, { pace, still, roll });
    cursor(root, signal, { pace, still, fine, roll, gallery });
  }

  // The gallery of this component: its frames stacked in one cell, the bar under them names the one
  // shown. Without the script, the frames sit in a strip that scrolls sideways
  function galleryOf(root, signal, { pace, still, roll }) {
    const stage = root.querySelector('.kodza-arrow-cursor__stage');
    const slides = stage ? [...stage.querySelectorAll('.kodza-arrow-cursor__slide')] : [];
    if (slides.length < 2) return null;
    const prev = root.querySelector('.kodza-arrow-cursor__button[data-cursor-prev]');
    const next = root.querySelector('.kodza-arrow-cursor__button[data-cursor-next]');
    const count = root.querySelector('.kodza-arrow-cursor__count');
    const label = root.querySelector('.kodza-arrow-cursor__label');
    const names = slides.map((slide) => slide.querySelector('.kodza-arrow-cursor__caption')?.textContent.trim() || '');
    const total = slides.length;
    const tally = (i) => `${pad(i + 1)} / ${pad(total)}`;
    let index = 0;
    let turning = [];

    // Screen readers hear the frame by name, once, instead of the rolling digits
    const news = document.createElement('span');
    news.className = 'kodza-arrow-cursor__news';
    news.setAttribute('aria-live', 'polite');
    root.querySelector('.kodza-arrow-cursor__bar')?.append(news);
    count?.setAttribute('aria-hidden', 'true');

    const settle = (i) => {
      slides.forEach((slide, n) => {
        const on = n === i;
        slide.classList.toggle('is-current', on);
        slide.inert = !on;
        slide.toggleAttribute('aria-hidden', !on);
      });
      [slides[i - 1], slides[i + 1]].forEach((slide) => {
        const img = slide?.querySelector('img');
        if (img) img.loading = 'eager'; // the neighbours are ready before you ask for them
      });
      prev?.setAttribute('aria-disabled', String(i === 0));
      next?.setAttribute('aria-disabled', String(i === total - 1));
    };

    slides.forEach((slide, n) => {
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', `${n + 1} of ${total}`);
    });
    stage.scrollLeft = 0;
    settle(0);
    if (count) {
      count.setAttribute('data-cursor-count', tally(0));
      count.textContent = tally(0);
    }
    if (label) label.textContent = names[0];

    async function go(to) {
      if (to < 0 || to >= total || to === index) return;
      const dir = to > index ? 1 : -1;
      const from = slides[index];
      const into = slides[to];
      turning.forEach((a) => a.finish());
      turning = [];
      index = to;

      if (count) {
        count.setAttribute('data-cursor-count', tally(to));
        roll(count, tally(to), dir, false);
      }
      if (label) roll(label, names[to], dir, true);
      news.textContent = `${to + 1} of ${total}${names[to] ? `: ${names[to]}` : ''}`;

      const img = into.querySelector('img');
      if (img) {
        img.loading = 'eager';
        if (!still) await img.decode().catch(() => {});
        if (index !== to) return; // a quicker click took over while it loaded
      }
      settle(to);
      if (still) return;

      from.classList.add('is-leaving');
      const timing = { duration: TURN * pace, easing: TURN_EASE, fill: 'both' };
      turning = [
        into.animate([{ clipPath: dir > 0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)' }, { clipPath: 'inset(0)' }], timing),
        img?.animate([{ transform: `translateX(${dir * SLIP * 0.5}%) scale(${SETTLE})` }, { transform: 'none' }], timing),
        from.querySelector('img')?.animate([{ transform: 'none' }, { transform: `translateX(${-dir * SLIP}%)` }], timing),
      ].filter(Boolean);
      const mine = turning;
      await Promise.all(mine.map((a) => a.finished)).catch(() => {});
      from.classList.remove('is-leaving');
      if (turning === mine) {
        mine.forEach((a) => a.cancel());
        turning = [];
      }
    }

    prev?.addEventListener('click', () => go(index - 1), { signal });
    next?.addEventListener('click', () => go(index + 1), { signal });
    // The arrow keys, while the focus is in the gallery (its buttons)
    root.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (e.target.closest?.('input, textarea, select, [contenteditable]')) return;
      e.preventDefault();
      go(index + (e.key === 'ArrowRight' ? 1 : -1));
    }, { signal });

    signal.addEventListener('abort', () => {
      turning.forEach((a) => a.cancel());
      news.remove();
    });
    return { go: (i) => go(i) };
  }

  // The disc: it follows any host that marks its zone, its buttons and its count
  function cursor(root, signal, { pace, still, fine, roll }) {
    const zone = root.matches(ZONE) ? root : root.querySelector(ZONE);
    const prev = root.querySelector('[data-cursor-prev]');
    const next = root.querySelector('[data-cursor-next]');
    const count = root.querySelector('[data-cursor-count]');
    if (!zone || !prev || !next || !fine || still) return;

    const disc = document.createElement('span');
    disc.className = 'kodza-arrow-cursor__disc';
    disc.setAttribute('aria-hidden', 'true');
    disc.innerHTML = '<span class="kodza-arrow-cursor__ring"><span class="kodza-arrow-cursor__arrow"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span><span class="kodza-arrow-cursor__tally"></span></span>';
    const arrow = disc.querySelector('.kodza-arrow-cursor__arrow');
    const tally = disc.querySelector('.kodza-arrow-cursor__tally');
    // The disc sits in the root: a root the page left static becomes its frame, and goes back
    const staticRoot = getComputedStyle(root).position === 'static';
    if (staticRoot) root.style.position = 'relative';
    root.append(disc);
    zone.classList.add('kodza-arrow-cursor__zone');

    let side = 1; // -1: back, 1: on
    let angle = 0;
    let over = false; // over a link or a control of the host, inside the zone
    let clicked = { dir: 0, at: -Infinity };
    let press = null;

    const aim = () => (side > 0 ? 0 : -180);
    const button = () => (side > 0 ? next : prev);
    const ends = () => {
      const end = isOff(button());
      disc.classList.toggle('is-end', end);
      zone.classList.toggle('is-end', end);
    };
    const show = (on) => disc.classList.toggle('is-on', on && !over);
    const place = (q) => {
      const rb = root.getBoundingClientRect();
      const zb = zone.getBoundingClientRect();
      const s = rb.width / root.offsetWidth || 1;
      disc.style.setProperty('--kz-arrow-cursor-x', `${(zb.left - rb.left) / s - root.clientLeft + q.lx + OFFSET}px`);
      disc.style.setProperty('--kz-arrow-cursor-y', `${(zb.top - rb.top) / s - root.clientTop + q.ly + OFFSET}px`);
    };
    const turn = () => arrow.style.setProperty('--kz-arrow-cursor-angle', `${angle.toFixed(2)}deg`);
    const sideOf = (q) => {
      const band = (q.width * MIDDLE) / 200;
      if (q.x < q.width / 2 - band) return -1;
      if (q.x > q.width / 2 + band) return 1;
      return side;
    };
    const look = (q, e) => {
      const was = side;
      side = sideOf(q);
      if (side !== was) ends();
      const hit = e?.target?.closest?.(CONTROL);
      over = !!hit && hit !== zone && zone.contains(hit);
      show(q.inside);
    };

    // The count under the arrow, read from the host: its data-cursor-count value, or its text
    const read = (dir) => {
      if (!count) return;
      const text = countOf(count);
      const before = tally.textContent;
      if (text === before) return;
      const way = performance.now() - clicked.at < CLICK_MEMORY ? clicked.dir : Math.sign(numberIn(text) - numberIn(before || text));
      roll(tally, text, before ? dir ?? way : 0, false);
    };
    read();
    const watch = new MutationObserver(() => {
      read();
      ends();
    });
    if (count) watch.observe(count, { characterData: true, childList: true, subtree: true, attributes: true, attributeFilter: ['data-cursor-count'] });
    [prev, next].forEach((b) => watch.observe(b, { attributes: true, attributeFilter: ['disabled', 'aria-disabled'] }));

    const nudge = () => {
      arrow.firstElementChild.animate(
        [{ transform: 'none' }, { transform: `translateX(${NUDGE}px)` }, { transform: 'none' }],
        { duration: NUDGE_TIME * pace, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      );
    };

    track(zone, signal, {
      lag: LAG,
      enter: (q, e) => {
        side = sideOf(q);
        angle = aim();
        turn();
        ends();
        place(q);
        look(q, e);
      },
      move: (q, e) => {
        if (e) look(q, e);
      },
      leave: () => {
        show(false);
        disc.classList.remove('is-pressed');
      },
      down: (q, e) => {
        press = { x: e.clientX, y: e.clientY };
        if (!over) disc.classList.add('is-pressed');
      },
      up: () => disc.classList.remove('is-pressed'),
      frame: (q, dt) => {
        place(q);
        const k = 1 - (1 - SWING) ** (dt * 60);
        angle += (aim() - angle) * k;
        if (Math.abs(aim() - angle) < 0.05) angle = aim();
        turn();
        return angle !== aim();
      },
    });

    zone.addEventListener('click', (e) => {
      const from = press;
      press = null;
      if (!from || e.pointerType === 'touch') return;
      if (Math.hypot(e.clientX - from.x, e.clientY - from.y) > CLICK_SLOP) return;
      const hit = e.target.closest?.(CONTROL);
      if (hit && hit !== zone && zone.contains(hit)) return;
      const target = button();
      if (isOff(target)) return;
      clicked = { dir: side, at: performance.now() };
      nudge();
      target.click();
    }, { signal });
    zone.addEventListener('dragstart', (e) => e.preventDefault(), { signal });

    signal.addEventListener('abort', () => {
      watch.disconnect();
      disc.remove();
      zone.classList.remove('kodza-arrow-cursor__zone', 'is-end');
      if (staticRoot) root.style.removeProperty('position');
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
