// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Signature Pad
// A box to sign in with a finger, a mouse or a stylus. The ink thins as the pen speeds up and
// thickens as it slows, like a nib. Undo makes the last stroke back out along its own path; Clear
// wipes the box from left to right. With a keyboard, the name typed on the line is the signature.
// Under the line, "Sign here" rolls to "Signed 4 Nov 2026" once signed. The form gets a trimmed
// PNG (a data URL) from the hidden input, printed in --kz-signature-print on a transparent ground,
// and the typed name under the field's own name; a required field asks for one or the other.
// Settings: --kz-signature-* in the CSS (the pen widths too), data-locale (the language of the
// date, else the page's). The words and timings are below; each word can be set per pad with
// data-text-<name> (data-text-sign="…"), {date} is filled in.
(() => {
  const SELECTOR = '.kodza-signature';
  const WORDS = {
    sign: 'Sign here', // under the line, before anything
    type: 'Type your name', // under the line, while the name field has the focus
    signed: 'Signed {date}', // under the line, once signed
    required: 'Sign first. Or type your name.',
    undone: 'Last stroke removed', // read out
    cleared: 'Signature cleared', // read out
  };
  const UNDO = 400; // ms, the last stroke backing out
  const SWEEP = 600; // ms, Clear wiping the box
  const SWEEP_EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const ROLL = 420; // ms, the words under the line rolling
  const SMOOTHING = 0.7; // how much the newest pen speed counts against the one before (0 to 1)
  const MIN_STEP = 1.5; // px, a point closer than this to the last one is skipped
  const STEP = 0.5; // px between two dabs of ink along a stroke
  const MARGIN = 8; // px around the signature in the image the form gets
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  // SWEEP_EASE for a stroke drawn frame by frame
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const mid = (p, q) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });
  // Dabs of ink along a quadratic curve from a to c, bent by b, the width going the same way
  const curve = (out, a, b, c, wa, wb, wc) => {
    const length = Math.hypot(b.x - a.x, b.y - a.y) + Math.hypot(c.x - b.x, c.y - b.y);
    const steps = Math.max(1, Math.ceil(length / STEP));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const u = 1 - t;
      out.push(u * u * a.x + 2 * u * t * b.x + t * t * c.x, u * u * a.y + 2 * u * t * b.y + t * t * c.y, u * u * wa + 2 * u * t * wb + t * t * wc);
    }
  };
  // The pieces of a stroke its points now settle: a dab at the start, a line to the first
  // midpoint, one curve per point from midpoint to midpoint, and the last line once the pen lifts
  const extend = (line, ended) => {
    const { points: p, samples } = line;
    const n = p.length;
    if (!samples.length && n) samples.push(p[0].x, p[0].y, p[0].w);
    for (; line.pieces < n - 1; line.pieces++) {
      const k = line.pieces;
      if (!k) {
        const m = mid(p[0], p[1]);
        curve(samples, p[0], mid(p[0], m), m, p[0].w, (3 * p[0].w + p[1].w) / 4, (p[0].w + p[1].w) / 2);
      } else curve(samples, mid(p[k - 1], p[k]), p[k], mid(p[k], p[k + 1]), (p[k - 1].w + p[k].w) / 2, p[k].w, (p[k].w + p[k + 1].w) / 2);
    }
    if (ended && n > 1) {
      const m = mid(p[n - 2], p[n - 1]);
      curve(samples, m, mid(m, p[n - 1]), p[n - 1], (p[n - 2].w + p[n - 1].w) / 2, (p[n - 2].w + 3 * p[n - 1].w) / 4, p[n - 1].w);
    }
  };
  // One round dab per sample, filled at once: [x, y, width, x, y, width, …]
  const paint = (context, samples, from = 0, to = samples.length) => {
    context.beginPath();
    for (let i = from; i < to; i += 3) {
      const r = samples[i + 2] / 2;
      context.moveTo(samples[i] + r, samples[i + 1]);
      context.arc(samples[i], samples[i + 1], r, 0, Math.PI * 2);
    }
    context.fill();
  };
  let uid = 0;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const pad = root.querySelector('.kodza-signature__pad');
    const type = root.querySelector('.kodza-signature__type');
    const prompt = root.querySelector('.kodza-signature__prompt');
    const undo = root.querySelector('.kodza-signature__undo');
    const clear = root.querySelector('.kodza-signature__clear');
    const value = root.querySelector('.kodza-signature__value');
    const hint = root.querySelector('.kodza-signature__hint');
    const error = root.querySelector('.kodza-signature__error');
    if (!pad || !type) return;
    const id = `kodza-signature-${++uid}`;
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const lang = root.dataset.locale || root.closest('[lang]')?.lang || navigator.language || 'en';
    const today = () => {
      try {
        return new Intl.DateTimeFormat(lang, { dateStyle: 'medium' }).format(new Date());
      } catch {
        return new Date().toLocaleDateString();
      }
    };

    const described = [];
    if (hint) described.push((hint.id = `${id}-hint`));
    if (error) described.push((error.id = `${id}-error`));
    if (described.length) type.setAttribute('aria-describedby', described.join(' '));
    // Required means a drawing or a name: the script checks for either one
    const required = type.required;
    if (required) {
      type.required = false;
      type.setAttribute('aria-required', 'true');
    }

    const canvas = document.createElement('canvas');
    canvas.className = 'kodza-signature__ink';
    canvas.setAttribute('aria-hidden', 'true');
    pad.prepend(canvas);
    const ctx = canvas.getContext('2d');
    // The strokes that stay, drawn once while the last one backs out over them
    const base = document.createElement('canvas');
    const baseCtx = base.getContext('2d');
    const live = document.createElement('span');
    live.className = 'kodza-signature__live';
    live.setAttribute('aria-live', 'polite');
    root.append(live);

    let width = 0;
    let height = 0;
    let ratio = 0;
    let strokes = []; // each { points: [{ x, y, t, w }], samples: [x, y, w, …], pieces }
    let stroke = null; // the one being drawn
    let pointer = null;
    let velocity = 0;
    let pens = [0.8, 3.2];
    let backing = 0; // the frame of the stroke backing out
    let textGoing = false; // the typed name is being wiped
    const wipes = new Set();
    let shown = prompt?.querySelector('.kodza-signature__say');

    const style = () => getComputedStyle(root);
    const inkOf = () => getComputedStyle(canvas).color;
    const typed = () => !textGoing && type.value.trim() !== '';

    const redraw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = inkOf();
      strokes.forEach((line) => paint(ctx, line.samples));
    };

    // The canvas at the box's size, in device pixels (times the scale of a parent's transform);
    // the strokes follow a new width, held on the line near the bottom
    const size = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (!w || !h) return;
      const r = (window.devicePixelRatio || 1) * (canvas.getBoundingClientRect().width / w || 1);
      if (w === width && h === height && r === ratio) return;
      if (width && w !== width) {
        const k = w / width;
        strokes.forEach((line) => {
          line.points.forEach((point) => {
            point.x *= k;
            point.y = h - (height - point.y) * k;
          });
          line.samples = [];
          line.pieces = 0;
          extend(line, true);
        });
      }
      width = w;
      height = h;
      ratio = r;
      [canvas, base].forEach((each) => {
        each.width = Math.round(w * r);
        each.height = Math.round(h * r);
      });
      ctx.setTransform(r, 0, 0, r, 0, 0);
      baseCtx.setTransform(r, 0, 0, r, 0, 0);
      redraw();
    };

    // Under the line, the old words go up as the new ones come in from below
    const roll = (text, animate = true) => {
      if (!shown || shown.textContent === text) return;
      const pace = paceOf(root);
      if (!animate || reduceMotion || !pace) {
        shown.textContent = text;
        return;
      }
      const old = shown;
      shown = old.cloneNode();
      shown.textContent = text;
      prompt.append(shown);
      const timing = { duration: ROLL * pace, easing: ease };
      const gone = () => old.remove();
      old.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-100%)', opacity: 0 }], { ...timing, fill: 'forwards' }).finished.then(gone, gone);
      shown.animate([{ transform: 'translateY(100%)', opacity: 0 }, { transform: 'none', opacity: 1 }], timing);
    };

    // Hint and error share the line under the box
    const say = (text) => {
      if (!error) return;
      error.textContent = text;
      root.classList.add('is-invalid');
      type.setAttribute('aria-invalid', 'true');
    };
    const clearError = () => {
      root.classList.remove('is-invalid');
      type.removeAttribute('aria-invalid');
    };

    // A tool that hides under the keyboard's focus hands it on: to Clear while it shows, else to
    // the name field. Under the mouse it is let go
    const handOn = (tool) => {
      if (!tool || document.activeElement !== tool || !tool.matches(':focus-visible')) return;
      (tool !== clear && clear && root.classList.contains('is-filled') ? clear : type).focus({ preventScroll: true });
    };

    const sync = (animate = true) => {
      const inked = strokes.length > 0;
      const signed = inked || typed();
      root.classList.toggle('is-inked', inked);
      root.classList.toggle('is-typed', typed());
      root.classList.toggle('is-filled', signed);
      if (!inked) handOn(undo);
      if (!signed) handOn(clear);
      roll(signed ? word('signed').replace('{date}', today()) : document.activeElement === type ? word('type') : word('sign'), animate);
      if (required) type.setCustomValidity(signed ? '' : word('required'));
      if (signed) clearError();
    };

    // The image the form gets: the ink, or the typed name in the field's font, trimmed to it, at
    // twice the size. A hidden input sends no event of its own: "change" bubbles from it
    const output = () => {
      if (!value) return;
      const name = typed() ? type.value.trim() : '';
      let data = '';
      if (strokes.length || name) {
        const sheet = document.createElement('canvas');
        const pen = sheet.getContext('2d');
        let left = Infinity;
        let top = Infinity;
        let right = -Infinity;
        let bottom = -Infinity;
        let metrics = null;
        const font = getComputedStyle(type);
        const text = font.textTransform === 'uppercase' ? name.toUpperCase() : font.textTransform === 'lowercase' ? name.toLowerCase() : name;
        const setFont = () => {
          pen.font = `${font.fontStyle} ${font.fontWeight} ${font.fontSize} ${font.fontFamily}`;
          if ('letterSpacing' in pen) pen.letterSpacing = font.letterSpacing === 'normal' ? '0px' : font.letterSpacing;
        };
        if (strokes.length) {
          strokes.forEach(({ samples }) => {
            for (let i = 0; i < samples.length; i += 3) {
              const r = samples[i + 2] / 2;
              left = Math.min(left, samples[i] - r);
              right = Math.max(right, samples[i] + r);
              top = Math.min(top, samples[i + 1] - r);
              bottom = Math.max(bottom, samples[i + 1] + r);
            }
          });
        } else {
          setFont();
          metrics = pen.measureText(text);
          left = -metrics.actualBoundingBoxLeft;
          right = metrics.actualBoundingBoxRight;
          top = -metrics.actualBoundingBoxAscent;
          bottom = metrics.actualBoundingBoxDescent;
        }
        sheet.width = Math.ceil((right - left + MARGIN * 2) * 2);
        sheet.height = Math.ceil((bottom - top + MARGIN * 2) * 2);
        pen.setTransform(2, 0, 0, 2, (MARGIN - left) * 2, (MARGIN - top) * 2);
        pen.fillStyle = '#0a0a0a';
        pen.fillStyle = style().getPropertyValue('--kz-signature-print').trim() || '#0a0a0a';
        if (metrics) {
          setFont();
          pen.fillText(text, 0, 0);
        } else strokes.forEach(({ samples }) => paint(pen, samples));
        data = sheet.toDataURL('image/png');
      }
      if (value.value === data) return;
      value.value = data;
      value.dispatchEvent(new Event('change', { bubbles: true }));
    };

    // Clear's sweep, from left to right, on the ink or the typed name; `done` runs underneath it
    // just before it lifts, at its end or as soon as something new starts
    const wipe = (el, done) => {
      const pace = paceOf(root);
      if (reduceMotion || !pace) return done();
      const anim = el.animate([{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 0 0 100%)' }], { duration: SWEEP * pace, easing: SWEEP_EASE, fill: 'forwards' });
      const entry = { anim, finish: () => {
        if (!wipes.delete(entry)) return;
        done();
        anim.cancel();
        sync();
        output();
      } };
      wipes.add(entry);
      anim.finished.then(entry.finish, () => {});
    };
    const settle = () => [...wipes].forEach((entry) => entry.finish());

    const stopBacking = () => {
      if (!backing) return;
      cancelAnimationFrame(backing);
      backing = 0;
      redraw();
    };
    const dropInk = () => {
      if (!strokes.length) return;
      stopBacking();
      strokes = [];
      wipe(canvas, redraw);
    };
    const dropName = () => {
      if (!typed()) return;
      textGoing = true;
      wipe(type, () => {
        type.value = '';
        textGoing = false;
      });
    };

    // Drawing. The pointer's place is divided by the scale of a parent's transform
    const at = (event, rect) => {
      const scale = rect.width / canvas.offsetWidth || 1;
      return { x: (event.clientX - rect.left) / scale, y: (event.clientY - rect.top) / scale, t: event.timeStamp };
    };
    // The width from the pen's speed (px/ms), smoothed: fast and thin, slow and full
    const add = (point) => {
      const points = stroke.points;
      const last = points[points.length - 1];
      if (last) {
        const distance = Math.hypot(point.x - last.x, point.y - last.y);
        if (distance < MIN_STEP) return;
        velocity = SMOOTHING * (distance / Math.max(point.t - last.t, 1)) + (1 - SMOOTHING) * velocity;
        point.w = Math.max(pens[1] / (velocity + 1), pens[0]);
      } else {
        velocity = 0;
        point.w = (pens[0] + pens[1]) / 2;
      }
      points.push(point);
      const from = stroke.samples.length;
      extend(stroke, false);
      paint(ctx, stroke.samples, from);
    };

    canvas.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || stroke || type.matches(':disabled')) return;
      event.preventDefault();
      settle();
      stopBacking();
      size();
      if (document.activeElement === type) type.blur();
      dropName();
      pointer = event.pointerId;
      try {
        canvas.setPointerCapture(pointer);
      } catch {}
      const css = style();
      const min = parseFloat(css.getPropertyValue('--kz-signature-pen-min'));
      const max = parseFloat(css.getPropertyValue('--kz-signature-pen-max'));
      pens = [min > 0 ? min : 0.8, max > 0 ? max : 3.2];
      ctx.fillStyle = inkOf();
      stroke = { points: [], samples: [], pieces: 0 };
      strokes.push(stroke);
      add(at(event, canvas.getBoundingClientRect()));
    }, { signal });

    canvas.addEventListener('pointermove', (event) => {
      if (!stroke || event.pointerId !== pointer) return;
      const rect = canvas.getBoundingClientRect();
      const events = event.getCoalescedEvents?.() || [];
      (events.length ? events : [event]).forEach((each) => add(at(each, rect)));
    }, { signal });

    const end = (event) => {
      if (!stroke || event.pointerId !== pointer) return;
      const line = stroke;
      stroke = null;
      pointer = null;
      const from = line.samples.length;
      extend(line, true);
      paint(ctx, line.samples, from);
      sync();
      output();
    };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((name) => canvas.addEventListener(name, end, { signal }));

    // Undo: the last stroke runs back along its own path, over the ones that stay
    undo?.addEventListener('click', () => {
      if (stroke || !strokes.length) return;
      settle();
      stopBacking();
      const line = strokes.pop();
      live.textContent = word('undone');
      sync();
      output();
      const pace = paceOf(root);
      if (reduceMotion || !pace) return redraw();
      baseCtx.clearRect(0, 0, width, height);
      baseCtx.fillStyle = inkOf();
      strokes.forEach((other) => paint(baseCtx, other.samples));
      ctx.fillStyle = baseCtx.fillStyle;
      const count = line.samples.length / 3;
      const start = performance.now();
      const frame = (now) => {
        const progress = Math.min((now - start) / (UNDO * pace), 1);
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(base, 0, 0, width, height);
        const keep = Math.round(count * (1 - easeInOut(progress)));
        if (keep) paint(ctx, line.samples, 0, keep * 3);
        backing = progress < 1 ? requestAnimationFrame(frame) : 0;
      };
      backing = requestAnimationFrame(frame);
    }, { signal });

    clear?.addEventListener('click', () => {
      if (stroke || !root.classList.contains('is-filled')) return;
      settle();
      dropInk();
      dropName();
      live.textContent = word('cleared');
      sync();
      output();
    }, { signal });

    // Typing: a key first settles a sweep still running; a name wipes the ink away
    type.addEventListener('beforeinput', settle, { signal });
    type.addEventListener('input', () => {
      if (type.value.trim()) dropInk();
      sync();
      output();
    }, { signal });
    type.addEventListener('focus', () => sync(), { signal });
    type.addEventListener('blur', () => sync(), { signal });
    // Sent empty: the message goes under the box, and the focus to the field when it is the
    // first one the form stops on
    type.addEventListener('invalid', (event) => {
      event.preventDefault();
      say(word('required'));
      const firstInvalid = type.form && [...type.form.elements].find((el) => el.willValidate && !el.validity.valid);
      if (!type.form || firstInvalid === type) type.focus();
    }, { signal });
    // A form reset empties the field after this event: the pad follows on the next turn
    type.form?.addEventListener('reset', () => setTimeout(() => {
      if (signal.aborted) return;
      settle();
      stopBacking();
      strokes = [];
      redraw();
      clearError();
      sync();
      output();
    }), { signal });

    const observer = new ResizeObserver(size);
    observer.observe(canvas);
    signal.addEventListener('abort', () => {
      observer.disconnect();
      cancelAnimationFrame(backing);
      wipes.forEach(({ anim }) => anim.cancel());
      wipes.clear();
    });

    size();
    sync(false);
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
