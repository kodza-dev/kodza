// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Spoiler
// The answer hidden in the sentence under a bar of ink, line by line, at its real width. A click
// parts the ink from the point touched, both ends sliding away along the reading order (across
// line breaks too); Enter or Space parts it from the first word. Again, and it closes back.
// It is a real button: a screen reader hears "Spoiler" until it is open.
// Settings: the --kz-spoiler-* variables (CSS), the word below (data-text-label), the timings below.
(() => {
  const SELECTOR = '[data-kodza-spoiler]';
  const WORDS = {
    label: 'Spoiler', // what a screen reader hears while it is hidden
  };
  const REVEAL = 0.45; // px per ms each end slides away at: a short spoiler and a long one part alike
  const HIDE = 0.8; // px per ms they come back, quicker
  const LONGEST = 1100; // ms at most, however long the text
  const SHORTEST = 600; // ms at least, however short
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const ease = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const label = root.dataset.textLabel || WORDS.label;
    const span = (name) => {
      const el = document.createElement('span');
      el.className = `kodza-spoiler__${name}`;
      return el;
    };

    const veil = span('veil');
    veil.setAttribute('aria-hidden', 'true');
    root.append(veil);
    root.setAttribute('role', 'button');
    root.setAttribute('tabindex', '0');
    root.setAttribute('aria-expanded', 'false');
    root.setAttribute('aria-label', label);
    root.classList.add('is-hidden');

    let open = false;
    let r = 0; // half the gap, along the text, in the root's own pixels
    let center = 0; // where the gap opens, along the text
    let max = 0;
    let frame = 0;
    let bars = [];
    let box = { scale: 1, left: 0, top: 0 };

    // Screen pixels to the root's own: a parent scaled by transform (a thumbnail, a theme) must not
    // shift the bars
    const measure = () => {
      const origin = veil.getBoundingClientRect();
      const width = root.getBoundingClientRect().width;
      box = { scale: root.offsetWidth ? width / root.offsetWidth : 1, left: origin.left, top: origin.top };
    };

    // One bar per line the text takes, at the line's real width; `from` is where the line starts
    // along the text, as if every line were laid end to end
    const layout = () => {
      measure();
      const lines = [...root.getClientRects()].filter((rect) => rect.width > 0.5);
      while (bars.length < lines.length) {
        const bar = span('bar');
        bar.append(span('ink'), span('ink'));
        veil.append(bar);
        bars.push({ el: bar });
      }
      bars.splice(lines.length).forEach((bar) => bar.el.remove());
      let from = 0;
      lines.forEach((rect, i) => {
        const line = {
          left: (rect.left - box.left) / box.scale,
          top: (rect.top - box.top) / box.scale,
          width: rect.width / box.scale,
          height: rect.height / box.scale,
          from,
        };
        from += line.width;
        Object.assign(bars[i], line);
        Object.assign(bars[i].el.style, {
          left: `${line.left}px`,
          top: `${line.top}px`,
          width: `${line.width}px`,
          height: `${line.height}px`,
        });
      });
      return from;
    };

    // Each bar keeps the ink before the gap and after it. Closed, it is one bar again, with no
    // seam where the two ends met
    const paint = () => {
      bars.forEach((bar) => {
        const cut = (at) => (r < 0.5 ? bar.width : Math.min(bar.width, Math.max(0, at - bar.from)));
        bar.el.style.setProperty('--kz-spoiler-before', `${cut(center - r)}px`);
        bar.el.style.setProperty('--kz-spoiler-after', `${bar.width - cut(center + r)}px`);
      });
    };
    const settle = () => {
      frame = 0;
      root.classList.remove('is-opening');
      if (open) root.classList.remove('is-hidden');
      r = open ? max : 0;
      paint();
    };

    const toggle = (point) => {
      // Already moving: it turns back from where it is, around the same point
      if (!frame) {
        const length = layout();
        center = 0;
        if (point) {
          const x = (point.x - box.left) / box.scale;
          const y = (point.y - box.top) / box.scale;
          const line = bars.reduce((best, bar) => {
            const d = Math.abs(y - bar.top - bar.height / 2);
            return !best || d < best.d ? { bar, d } : best;
          }, null)?.bar;
          if (line) center = line.from + Math.min(line.width, Math.max(0, x - line.left));
        }
        max = Math.max(center, length - center) + 1;
        r = open ? max : 0;
      }
      open = !open;
      root.setAttribute('aria-expanded', String(open));
      if (open) root.removeAttribute('aria-label');
      else root.setAttribute('aria-label', label);
      if (still) return settle();
      cancelAnimationFrame(frame);
      root.classList.add('is-hidden', 'is-opening');
      const from = r;
      const to = open ? max : 0;
      const whole = Math.min(LONGEST, Math.max(SHORTEST, max / (open ? REVEAL : HIDE)));
      const duration = whole * pace * (Math.abs(to - from) / (max || 1));
      const start = performance.now();
      paint();
      const step = (now) => {
        const t = duration ? Math.min(1, (now - start) / duration) : 1;
        r = from + (to - from) * ease(t);
        paint();
        frame = t < 1 ? requestAnimationFrame(step) : 0;
        if (!frame) settle();
      };
      frame = requestAnimationFrame(step);
    };

    root.addEventListener('click', (event) => {
      // Selecting the words once they are out is reading, not asking to hide them again
      const selection = window.getSelection();
      if (open && selection && !selection.isCollapsed && root.contains(selection.anchorNode)) return;
      if (!open && event.target.closest('a')) event.preventDefault();
      toggle(event.detail ? { x: event.clientX, y: event.clientY } : null);
    }, { signal });
    root.addEventListener('keydown', (event) => {
      if (event.target !== root || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      if (!event.repeat) toggle(null);
    }, { signal });

    // The lines move with the page (a resize, the font arriving): the bars follow them
    const relayout = () => {
      if (!frame && !open) layout();
    };
    const observer = new ResizeObserver(relayout);
    observer.observe(root.parentElement || root);
    window.addEventListener('resize', relayout, { signal });
    document.fonts?.ready.then(() => signal.aborted || relayout());
    layout();
    signal.addEventListener('abort', () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
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
