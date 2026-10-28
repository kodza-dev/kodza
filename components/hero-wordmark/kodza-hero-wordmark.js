// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Hero Wordmark
// Sets the name across the whole column, ink edge to ink edge: each letter goes in its own mask,
// the name is measured at 100px (in the page, and on a canvas for the ink around each glyph) and
// sized to the column, again whenever its width changes or a font comes in. Then the entrance,
// once the section is in view: the letters rise one after the other from the baseline, the picture
// opens from that same line down, the words and buttons follow. "kodza:replay" plays it again.
(() => {
  const SELECTOR = '.kodza-hero-wordmark';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GLIDE = 'cubic-bezier(0.6, 0, 0.1, 1)'; // slow start, long settle
  const SOFT = 'cubic-bezier(0.25, 1, 0.5, 1)';
  const OPEN = 'cubic-bezier(0.3, 0.5, 0.1, 1)'; // the curtain: a slow start would leave the picture a hairline for 200 ms
  const REF = 100; // the size the name is measured at, in px
  const VARS = ['size', 'height', 'lift', 'shift', 'mask'].map((name) => `--kz-hero-wordmark-${name}`);

  const decoded = (root) => Promise.all([...root.querySelectorAll('img')].map((img) => img.decode().catch(() => {})));
  const span = (name) => {
    const el = document.createElement('span');
    el.className = `kodza-hero-wordmark__${name}`;
    return el;
  };

  // The ink of one glyph at the reference size, from its origin: where it starts and ends, how
  // far it rises above the baseline and drops below it
  let context;
  const ink = (char, font) => {
    context ||= document.createElement('canvas').getContext('2d');
    context.font = font;
    const m = context.measureText(char);
    return { left: -m.actualBoundingBoxLeft, right: m.actualBoundingBoxRight, ascent: m.actualBoundingBoxAscent, descent: Math.max(0, m.actualBoundingBoxDescent) };
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const q = (s) => root.querySelector(s);
    const title = q('.kodza-hero-wordmark__title');
    if (!title) return;

    // One mask per letter; screen readers keep the name whole
    const text = title.textContent.trim();
    const chars = [...text];
    const word = span('word');
    word.setAttribute('aria-hidden', 'true');
    const glyphs = chars.map((char) => {
      const letter = span('letter');
      const glyph = span('glyph');
      glyph.textContent = char;
      letter.append(glyph);
      word.append(letter);
      return glyph;
    });
    const base = span('base');
    glyphs[0]?.after(base);
    title.setAttribute('aria-label', text);
    title.replaceChildren(word);

    // Measured at the reference size, then scaled: the ink of the first letter on the left edge,
    // the last one on the right edge, the box from the top of the ink to its bottom. Screen
    // pixels are divided by the scale of a parent that would be zoomed by a transform
    let width = 0;
    const fit = () => {
      const w = title.clientWidth;
      if (!w || !glyphs.length) return;
      width = w;
      VARS.forEach((name) => title.style.removeProperty(name));
      title.style.setProperty(VARS[0], `${REF}px`);
      const style = getComputedStyle(title);
      const font = `${style.fontStyle} ${style.fontWeight} ${REF}px ${style.fontFamily}`;
      const marks = chars.map((char) => ink(char, font));
      const scale = title.getBoundingClientRect().width / title.offsetWidth || 1;
      const row = word.getBoundingClientRect();
      const from = (el) => (el.getBoundingClientRect().left - row.left) / scale;
      const left = from(glyphs[0]) + marks[0].left;
      const right = from(glyphs.at(-1)) + marks.at(-1).right;
      const baseline = (base.getBoundingClientRect().top - row.top) / scale;
      const top = baseline - Math.max(...marks.map((m) => m.ascent));
      const bottom = baseline + Math.max(...marks.map((m) => m.descent));
      const k = w / (right - left);
      [REF, bottom - top, top, left, bottom].forEach((value, i) => title.style.setProperty(VARS[i], `${value * k}px`));
    };

    // A new width refits on the next frame, outside the observer
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (title.clientWidth !== width) fit();
      });
    });
    observer.observe(title);
    document.fonts?.addEventListener('loadingdone', fit, { signal });
    signal.addEventListener('abort', () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    });
    fit();

    let running = [];
    const stop = () => {
      running.forEach((a) => a.cancel());
      running = [];
    };
    const animate = (el, keyframes, options) => {
      if (el) running.push(el.animate(keyframes, { easing: GLIDE, fill: 'backwards', ...options }));
    };
    const rise = (el, delay, duration) => animate(el, [{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration, delay });

    const play = async () => {
      await decoded(root);
      if (signal.aborted) return;
      stop();
      root.classList.add('is-shown');
      rise(q('.kodza-hero-wordmark__eyebrow .kodza-hero-wordmark__rise'), 0, 1000);
      // A long name keeps the same overall pace
      const step = Math.min(70, 420 / Math.max(1, glyphs.length - 1));
      glyphs.forEach((glyph, i) => rise(glyph, 120 + i * step, 1100));
      // The curtain opens from the baseline down while the picture settles from a slight zoom
      animate(q('.kodza-hero-wordmark__curtain'), [{ transform: 'translateY(calc(-100% - 2px))' }, { transform: 'none' }], { duration: 1350, delay: 450, easing: OPEN });
      animate(q('.kodza-hero-wordmark__hold'), [{ transform: 'translateY(calc(100% + 2px))' }, { transform: 'none' }], { duration: 1350, delay: 450, easing: OPEN });
      animate(q('.kodza-hero-wordmark__media img'), [{ transform: 'scale(1.2)' }, { transform: 'none' }], { duration: 2000, delay: 450, easing: SOFT });
      [q('.kodza-hero-wordmark__lead'), q('.kodza-hero-wordmark__actions')].forEach((el, i) => {
        animate(el, [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: 700 + i * 110, easing: SOFT });
      });
    };

    if (reduceMotion) {
      root.classList.add('is-shown');
      document.fonts?.ready.then(() => !signal.aborted && fit());
      return;
    }
    root.addEventListener('kodza:replay', play, { signal });
    signal.addEventListener('abort', stop);
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      io.disconnect();
      play();
    }, { rootMargin: '0px 0px -15% 0px' });
    signal.addEventListener('abort', () => io.disconnect());
    Promise.all([document.fonts?.ready, decoded(root)]).then(() => {
      if (signal.aborted) return;
      fit();
      io.observe(root);
    });
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
    // Rendered by React (data-kodza-manual): React starts it, with an init aimed at that markup once
    // it has hydrated it. Any earlier start would change markup React has not taken over yet
    const owner = root.closest('[data-kodza-manual]');
    if (owner && !(scope && owner.contains(scope))) return;
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
