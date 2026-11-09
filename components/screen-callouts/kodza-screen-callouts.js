// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Screen Callouts
// A picture and its numbered features. Each feature names its zone on the picture,
// data-zone="x y width height" in % of the picture itself, so the zone stays on its object when the
// frame crops it (--kz-screen-callouts-focus says what the crop keeps). Picking a feature (hovering
// it, focusing it with the keyboard, or clicking it to keep it) puts a veil over the rest of the
// picture: the cut-out closes in on its zone, glides from one zone to the next, and the picture
// leans in a little. The numbers on the picture pick their feature too. Escape lets it go.
// The section plays its entrance once, as it comes into view: the label rises, the title line after
// line, each out of its own mask, the intro comes up; then the picture opens from the top and the
// features come up one after another. "kodza:replay" plays it again. The timings and distances are
// the constants under SELECTOR.
(() => {
  const SELECTOR = '.kodza-screen-callouts';
  // Picking a zone, in ms (each one times the site's pace):
  const OPEN = 680; // the veil closing in on a zone, from the whole picture
  const MOVE = 560; // the cut-out gliding from one zone to the next
  const CLOSE = 620; // the veil drawing back off the picture
  const ZOOM = 1.06; // how far the picture leans in on the zone picked
  const PULL = 0.3; // how much of the way the zone comes toward the middle as it does
  const AIR = 10; // px of picture kept around a zone, inside the cut-out
  const MARK_EDGE_X = 20; // px from a number's middle to the frame's side, at the least
  const MARK_EDGE_Y = 16; // px from a number's middle to the frame's top or bottom, at the least
  const GRACE = 8; // px around a number that still count as on it, for the mouse
  // The entrance. The head, as Section Intro plays it:
  const LABEL = 1000; // the label rising out of its mask
  const TITLE = 1170; // each title line…
  const TITLE_AT = 110; // …the first one starting here…
  const TITLE_STEP = 125; // …and the next a beat later
  const INTRO = 900; // the intro coming up…
  const INTRO_AT = 450;
  // The body:
  const BOX = 1000; // the picture opening from the top…
  const IMAGE = 1400; // …while it settles…
  const SETTLE = 1.12; // …from this close
  const ROW = 760; // each feature coming up…
  const ROW_AT = 320; // …the first one here…
  const ROW_STEP = 80; // …the next ones a beat later
  const MARK = 600; // each number on the picture coming up…
  const MARK_AT = 640; // …the first one here…
  const MARK_STEP = 70; // …the next ones a beat later
  const PART = 120; // between two parts that come into view together
  const ENTER = '0px 0px -12% 0px'; // a part plays once its top is this far into the screen
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const FOLD_EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const GLIDE = 'cubic-bezier(0.6, 0, 0.1, 1)'; // slow start, long settle
  const SOFT = 'cubic-bezier(0.25, 1, 0.5, 1)';
  // Rising out of its own box, no wrapper needed: the box clips what is still below its bottom edge
  // (with room for the descenders and the side bearings)
  const RISE = [
    { transform: 'translateY(calc(100% + 0.2em))', clipPath: 'inset(-0.2em -0.1em 100% -0.1em)' },
    { transform: 'none', clipPath: 'inset(-0.2em -0.1em -0.2em -0.1em)' },
  ];
  const UP = (px) => [{ opacity: 0, transform: `translateY(${px}px)` }, { opacity: 1, transform: 'none' }];
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const q = (el, name) => el.querySelector(`.kodza-screen-callouts__${name}`);

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers, timers and animations stop on
  // its 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const head = q(root, 'head');
    const body = q(root, 'body');
    const list = q(root, 'list');
    const frame = q(root, 'frame');
    const img = frame?.querySelector('img');
    const items = list ? [...list.querySelectorAll('.kodza-screen-callouts__item')] : [];
    let marks = [];

    if (img && items.length) {
      // Each zone, as x, y, width and height in % of the picture
      const zones = items.map((item) => {
        const zone = (item.dataset.zone || '').trim().split(/[\s,]+/).map(Number);
        return zone.length === 4 && zone.every(Number.isFinite) ? zone : null;
      });
      // The picture goes on a stage that leans in, with the cut-out and the numbers over it
      const stage = document.createElement('span');
      stage.className = 'kodza-screen-callouts__stage';
      img.before(stage);
      stage.append(img);
      const hole = document.createElement('span');
      hole.className = 'kodza-screen-callouts__hole';
      const layer = document.createElement('span');
      layer.className = 'kodza-screen-callouts__marks';
      layer.setAttribute('aria-hidden', 'true');
      marks = items.map((item, i) => {
        const mark = document.createElement('span');
        mark.className = 'kodza-screen-callouts__marker';
        mark.textContent = String(i + 1).padStart(2, '0');
        if (!zones[i]) mark.hidden = true;
        layer.append(mark);
        return mark;
      });
      stage.append(hole, layer);
      // Each name becomes the button that picks its feature
      const picks = items.map((item) => {
        const name = q(item, 'name');
        if (!name) return null;
        name.innerHTML = `<button class="kodza-screen-callouts__pick" type="button" aria-pressed="false">${name.innerHTML}</button>`;
        return name.firstElementChild;
      });

      // Where the picture is drawn in its frame: object-fit: cover, at the crop's focus
      const box = () => {
        const W = img.offsetWidth;
        const H = img.offsetHeight;
        const nw = img.naturalWidth || Number(img.getAttribute('width')) || W;
        const nh = img.naturalHeight || Number(img.getAttribute('height')) || H;
        const s = Math.max(W / nw, H / nh) || 1;
        const dw = nw * s;
        const dh = nh * s;
        const [px, py = '50%'] = getComputedStyle(img).objectPosition.split(/\s+/);
        const off = (v, free) => (v.endsWith('%') ? (parseFloat(v) / 100) * free : parseFloat(v) || 0);
        return { W, H, dw, dh, ox: off(px, W - dw), oy: off(py, H - dh) };
      };
      // A zone in the frame, with some air around it, never past the frame's edges. At rest, the
      // cut-out is wider than the frame: no veil shows
      const holeOf = (i, b) => {
        const z = zones[i];
        if (!z) return { left: -AIR, top: -AIR, width: b.W + 2 * AIR, height: b.H + 2 * AIR };
        const left = clamp(b.ox + (z[0] / 100) * b.dw - AIR, -AIR, b.W + AIR);
        const top = clamp(b.oy + (z[1] / 100) * b.dh - AIR, -AIR, b.H + AIR);
        const right = clamp(b.ox + ((z[0] + z[2]) / 100) * b.dw + AIR, left, b.W + AIR);
        const bottom = clamp(b.oy + ((z[1] + z[3]) / 100) * b.dh + AIR, top, b.H + AIR);
        return { left, top, width: right - left, height: bottom - top };
      };
      // The picture leans in toward the zone, and never shows its edges
      const leanOf = (i, b, rect) => {
        if (still || !zones[i]) return { tx: 0, ty: 0, k: 1 };
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const tx = clamp(cx * (1 - ZOOM) + PULL * (b.W / 2 - cx), b.W * (1 - ZOOM), 0);
        const ty = clamp(cy * (1 - ZOOM) + PULL * (b.H / 2 - cy), b.H * (1 - ZOOM), 0);
        return { tx, ty, k: ZOOM };
      };
      const px = (rect) => Object.fromEntries(Object.entries(rect).map(([k, v]) => [k, `${v.toFixed(2)}px`]));
      // From wherever it is now, mid-way included, to where it goes
      const set = (el, to, ms, easing) => {
        const now = getComputedStyle(el);
        const from = Object.fromEntries(Object.keys(to).map((k) => [k, now[k]]));
        // Only what moves the same properties stops: an entrance under way plays on
        el.getAnimations().filter((a) => a.effect?.getKeyframes().some((k) => Object.keys(to).some((p) => p in k))).forEach((a) => a.cancel());
        Object.assign(el.style, to);
        if (ms && !still) el.animate([from, to], { duration: ms * pace, easing });
      };

      let hovered = -1;
      let focused = -1;
      let pinned = -1;
      let current = -1;
      const place = (ms, easing) => {
        const b = box();
        if (!b.W || !b.H) return;
        const rect = holeOf(current, b);
        set(hole, px(rect), ms, easing);
        const lean = leanOf(current, b, rect);
        const transform = lean.k === 1 ? 'none' : `translate(${lean.tx.toFixed(2)}px, ${lean.ty.toFixed(2)}px) scale(${lean.k})`;
        set(stage, { transform }, ms, easing);
        // Each number on the top-left corner of its zone, kept inside the frame once the picture
        // has leaned in (the numbers lean with it)
        const keep = (v, edge, size, t) => clamp(v, (edge - t) / lean.k, (size - edge - t) / lean.k);
        marks.forEach((mark, i) => {
          const z = zones[i];
          if (!z) return;
          const left = keep(b.ox + (z[0] / 100) * b.dw, MARK_EDGE_X, b.W, lean.tx);
          const top = keep(b.oy + (z[1] / 100) * b.dh, MARK_EDGE_Y, b.H, lean.ty);
          set(mark, { left: `${left.toFixed(2)}px`, top: `${top.toFixed(2)}px` }, ms, easing);
        });
      };
      const update = () => {
        const next = hovered >= 0 ? hovered : focused >= 0 ? focused : pinned;
        picks.forEach((pick, i) => pick?.setAttribute('aria-pressed', String(i === pinned)));
        if (next === current) return;
        const from = current;
        current = next;
        items.forEach((item, i) => item.classList.toggle('is-current', i === next));
        marks.forEach((mark, i) => mark.classList.toggle('is-current', i === next));
        if (next < 0 || !zones[next]) place(CLOSE, FOLD_EASE);
        else place(from < 0 || !zones[from] ? OPEN : MOVE, EASE);
      };
      const indexOf = (el) => items.findIndex((item) => item.contains(el));
      const pin = (i) => {
        pinned = pinned === i ? -1 : i;
        update();
      };

      // The mouse picks what it is over; a finger picks by tapping
      list.addEventListener('pointerover', (event) => {
        if (event.pointerType !== 'mouse') return;
        const i = indexOf(event.target);
        if (i >= 0) {
          hovered = i;
          update();
        }
      }, { signal });
      list.addEventListener('pointerleave', () => {
        hovered = -1;
        update();
      }, { signal });
      // A number leans with the picture, so it moves away from a still mouse, and the browser would
      // then flicker between "over" and "not over". The mouse is tested against the numbers here
      // instead: a number it gets to keeps it as long as it stays between where the number was
      // then and where it is now
      const near = (a, b, x, y) => x >= Math.min(a.left, b.left) - GRACE && x <= Math.max(a.right, b.right) + GRACE
        && y >= Math.min(a.top, b.top) - GRACE && y <= Math.max(a.bottom, b.bottom) + GRACE;
      let over = -1; // the number the mouse holds
      let caught = null; // where that number was when the mouse got to it
      let at = [NaN, NaN];
      const hold = (i, rect) => {
        if (i === over) return;
        over = i;
        caught = rect;
        frame.classList.toggle('is-pointing', i >= 0);
        hovered = i;
        update();
      };
      frame.addEventListener('pointermove', (event) => {
        if (event.pointerType !== 'mouse') return;
        const { clientX: x, clientY: y } = event;
        if (x === at[0] && y === at[1]) return; // the picture moved, not the mouse
        at = [x, y];
        if (over >= 0 && near(caught, marks[over].getBoundingClientRect(), x, y)) return;
        const i = marks.findIndex((mark) => {
          if (mark.hidden) return false;
          const rect = mark.getBoundingClientRect();
          return near(rect, rect, x, y);
        });
        hold(i, i >= 0 ? marks[i].getBoundingClientRect() : null);
      }, { signal });
      frame.addEventListener('pointerleave', () => hold(-1, null), { signal });
      // A click picks the number the mouse holds, a tap the number under the finger
      frame.addEventListener('click', (event) => {
        const i = over >= 0 ? over : marks.indexOf(event.target);
        if (i >= 0) pin(i);
      }, { signal });
      picks.forEach((pick, i) => pick?.addEventListener('click', () => pin(i), { signal }));
      // The keyboard shows the zone of the feature it is on
      list.addEventListener('focusin', (event) => {
        const i = picks.indexOf(event.target);
        if (i >= 0 && event.target.matches(':focus-visible')) {
          focused = i;
          update();
        }
      }, { signal });
      list.addEventListener('focusout', (event) => {
        if (picks.includes(event.relatedTarget)) return;
        focused = -1;
        update();
      }, { signal });
      root.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || (pinned < 0 && focused < 0)) return;
        pinned = -1;
        focused = -1;
        update();
      }, { signal });

      // A new size moves the zones: everything goes straight to its new place
      const ro = new ResizeObserver(() => place(0));
      ro.observe(frame);
      img.addEventListener('load', () => place(0), { signal });
      place(0);
      signal.addEventListener('abort', () => {
        ro.disconnect();
        [hole, stage].forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
      });
    }

    // The entrance
    const parts = [head, body].filter(Boolean);
    if (still) return parts.forEach((part) => part.classList.add('is-shown'));
    let running = [];
    const stop = () => {
      running.forEach((a) => a.cancel());
      running = [];
    };
    // The entrance of one part, `at` ms after the first one of its batch
    const play = (part, at) => {
      const animate = (el, keyframes, options) => {
        if (el) running.push(el.animate(keyframes, { easing: GLIDE, fill: 'backwards', ...options, duration: options.duration * pace, delay: (at + (options.delay || 0)) * pace }));
      };
      part.classList.add('is-shown');
      if (part === head) {
        animate(q(part, 'eyebrow'), RISE, { duration: LABEL });
        // The title, line after line, each out of its own mask (written as lines, like Section
        // Intro's); a title written in one piece rises in one piece
        const lines = [...part.querySelectorAll('.kodza-screen-callouts__line > .kodza-screen-callouts__rise')];
        if (lines.length) lines.forEach((line, i) => animate(line, [{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration: TITLE, delay: TITLE_AT + i * TITLE_STEP }));
        else animate(q(part, 'title'), RISE, { duration: TITLE, delay: TITLE_AT });
        // The intro waits for the last line to be on its way
        animate(q(part, 'intro'), UP(20), { duration: INTRO, delay: INTRO_AT + Math.max(0, lines.length - 2) * TITLE_STEP, easing: SOFT });
        return;
      }
      // The picture opens from the top as it settles, the features come up one after another,
      // then the numbers on the picture
      if (frame) {
        const radius = parseFloat(getComputedStyle(frame).borderTopLeftRadius) || 0;
        animate(frame, [{ clipPath: `inset(0px 0px 100% 0px round ${radius}px)` }, { clipPath: `inset(0px round ${radius}px)` }], { duration: BOX, easing: FOLD_EASE });
        animate(img, [{ transform: `scale(${SETTLE})` }, { transform: 'none' }], { duration: IMAGE, easing: EASE });
      }
      items.forEach((item, i) => animate(item, UP(14), { duration: ROW, delay: ROW_AT + i * ROW_STEP, easing: SOFT }));
      marks.filter((mark) => !mark.hidden).forEach((mark, i) => animate(mark, UP(6), { duration: MARK, delay: MARK_AT + i * MARK_STEP, easing: SOFT }));
    };

    // What comes into view together plays in the order of the page, part after part
    const io = new IntersectionObserver((entries) => {
      entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target)
        .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
        .forEach((part, i) => {
          io.unobserve(part);
          play(part, i * PART);
        });
    }, { rootMargin: ENTER });
    const watch = () => parts.forEach((part) => io.observe(part));
    signal.addEventListener('abort', () => {
      io.disconnect();
      stop();
    });
    // Replayed: the parts on screen play again now, the others wait to be scrolled to
    root.addEventListener('kodza:replay', () => {
      io.disconnect();
      stop();
      parts.forEach((part) => part.classList.remove('is-shown'));
      watch();
    }, { signal });
    Promise.resolve(document.fonts?.ready).then(() => {
      if (!signal.aborted) watch();
    });
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
