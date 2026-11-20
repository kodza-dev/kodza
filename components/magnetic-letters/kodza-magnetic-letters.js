// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Magnetic Letters
// Splits a big word into letters. The letters near the mouse step a few pixels away from it, tilt
// a little, and spring back to their place when it leaves: the word stays readable all along. A
// finger moves nothing. The split keeps the font's own spacing (kerning) to the hundredth of a
// pixel, so the word at rest looks exactly as written.
// Settings: the --kz-magnetic-letters-* variables in the CSS and the constants below.
(() => {
  const SELECTOR = '.kodza-magnetic-letters';
  // Spring that brings each letter to where it is pushed: pull per frame at 60 fps, and what is
  // kept of its speed from one frame to the next (lower settles sooner, higher overshoots more)
  const STIFFNESS = 0.11;
  const DAMPING = 0.74;
  // Below this, in pixels, a letter is at rest
  const REST = 0.02;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const lengthOf = (style, name, size, fallback) => {
    const value = style.getPropertyValue(name).trim();
    const n = parseFloat(value);
    if (Number.isNaN(n)) return fallback * size;
    return value.endsWith('em') ? n * size : n;
  };

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const pace = paceOf(root);
    if (reduceMotion || !pace) return;

    // Where each character of the text stands as written, read before the split
    const text = root.textContent.replace(/\s+/g, ' ').trim();
    if (!text) return;
    const words = text.split(' ');

    // The letters, drawn for the eye; the text, once, for screen readers
    const shown = document.createElement('span');
    shown.className = 'kodza-magnetic-letters__shown';
    shown.setAttribute('aria-hidden', 'true');
    const letters = [];
    words.forEach((word, w) => {
      if (w) shown.append(' ');
      const box = document.createElement('span');
      box.className = 'kodza-magnetic-letters__word';
      [...word].forEach((char) => {
        const el = document.createElement('span');
        el.className = 'kodza-magnetic-letters__char';
        el.textContent = char;
        box.append(el);
        letters.push({ el, char, x: 0, y: 0, dx: 0, dy: 0, vx: 0, vy: 0, kern: 0 });
      });
      shown.append(box);
    });
    const sr = document.createElement('span');
    sr.className = 'kodza-magnetic-letters__sr';
    sr.textContent = text;
    // A copy of the text in one run, hidden behind the letters: the font spaces it as written, and
    // each letter is set where its twin stands
    const twin = document.createElement('span');
    twin.className = 'kodza-magnetic-letters__twin';
    twin.setAttribute('aria-hidden', 'true');
    twin.textContent = words.join(' ');
    root.replaceChildren(shown, twin, sr);
    root.classList.add('is-live');

    // k: screen pixels per CSS pixel (a parent scaled with a transform must not shift the pointer)
    const scale = () => {
      const ratio = root.getBoundingClientRect().width / root.offsetWidth || 1;
      return Math.abs(ratio - 1) < 0.01 ? 1 : ratio;
    };
    let k = 1;
    let reach = 0;
    let push = 0;
    let tilt = 0;
    const measure = () => {
      k = scale();
      letters.forEach((l) => {
        l.el.style.marginLeft = '';
        l.el.style.transform = '';
      });
      const range = document.createRange();
      const node = twin.firstChild;
      let at = 0;
      const box = root.getBoundingClientRect();
      letters.forEach((l, i) => {
        while (node.data[at] === ' ') at++;
        range.setStart(node, at);
        range.setEnd(node, at + l.char.length);
        at += l.char.length;
        const want = range.getBoundingClientRect();
        const has = l.el.getBoundingClientRect();
        // The gap the font puts between two letters of a run (its kerning), set back as a margin
        l.kern = i && want.top === letters[i - 1].top ? (want.left - has.left) / k : 0;
        l.top = want.top;
        l.el.style.marginLeft = l.kern ? `${l.kern.toFixed(2)}px` : '';
        l.x = (want.left + want.width / 2 - box.left) / k;
        l.y = (want.top + want.height / 2 - box.top) / k;
      });
      const style = getComputedStyle(root);
      const size = parseFloat(style.fontSize) || 16;
      reach = lengthOf(style, '--kz-magnetic-letters-reach', size, 1.4);
      push = lengthOf(style, '--kz-magnetic-letters-push', size, 0.07);
      tilt = parseFloat(style.getPropertyValue('--kz-magnetic-letters-tilt')) || 0;
      paint();
    };

    let pointer = null;
    let frame = 0;
    let last = 0;
    // Where a letter is pushed: away from the mouse, the most right under it, nothing past `reach`
    const target = (l) => {
      if (!pointer) return [0, 0];
      const ax = l.x - pointer.x;
      const ay = l.y - pointer.y;
      const d = Math.hypot(ax, ay);
      if (d >= reach) return [0, 0];
      const f = 1 - d / reach;
      const s = f * f * (3 - 2 * f) * push;
      return d < 0.5 ? [0, -s] : [(ax / d) * s, (ay / d) * s];
    };
    const paint = () => {
      letters.forEach((l) => {
        const turn = push ? (l.dx / push) * tilt : 0;
        l.el.style.transform = l.dx || l.dy
          ? `translate(${l.dx.toFixed(2)}px, ${l.dy.toFixed(2)}px) rotate(${turn.toFixed(2)}deg)`
          : '';
      });
    };
    const tick = (now) => {
      const step = (last ? Math.min(64, now - last) : 16.7) / 16.7 / pace;
      last = now;
      const pull = 1 - Math.pow(1 - STIFFNESS, step);
      const keep = Math.pow(DAMPING, step);
      let moving = false;
      letters.forEach((l) => {
        const [tx, ty] = target(l);
        l.vx = (l.vx + (tx - l.dx) * pull) * keep;
        l.vy = (l.vy + (ty - l.dy) * pull) * keep;
        l.dx += l.vx * step;
        l.dy += l.vy * step;
        if (Math.abs(tx - l.dx) < REST && Math.abs(ty - l.dy) < REST && Math.abs(l.vx) + Math.abs(l.vy) < REST) {
          l.dx = tx;
          l.dy = ty;
          l.vx = 0;
          l.vy = 0;
        } else moving = true;
      });
      paint();
      frame = moving ? requestAnimationFrame(tick) : 0;
      if (!frame) last = 0;
    };
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    // The mouse is followed from the page, so the letters feel it coming before it is on the word
    const move = (event) => {
      if (event.pointerType === 'touch') return;
      const box = root.getBoundingClientRect();
      const x = (event.clientX - box.left) / k;
      const y = (event.clientY - box.top) / k;
      const w = box.width / k;
      const h = box.height / k;
      const near = x > -reach && x < w + reach && y > -reach && y < h + reach;
      if (!near && !pointer) return;
      pointer = near ? { x, y } : null;
      wake();
    };
    const leave = () => {
      if (!pointer) return;
      pointer = null;
      wake();
    };
    document.addEventListener('pointermove', move, { signal, passive: true });
    document.documentElement.addEventListener('pointerleave', leave, { signal });
    window.addEventListener('blur', leave, { signal });
    // The page scrolled under a still mouse: the letters it was pushing go back
    window.addEventListener('scroll', leave, { signal, passive: true });

    let width = 0;
    const observer = new ResizeObserver(() => {
      if (root.offsetWidth === width) return;
      width = root.offsetWidth;
      measure();
    });
    observer.observe(root);
    document.fonts?.ready.then(() => !signal.aborted && measure());
    signal.addEventListener('abort', () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
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
