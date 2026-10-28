// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Footer Wordmark
// The footer waits under the page. As it scrolls into view, its content comes up slower than the
// page, inside its own clipped box, and the shade the page casts on it lifts: paused animations
// set from the scroll, so scrolling back up plays them in reverse. The name is set across the
// whole width, ink edge to ink edge (measured like Hero Wordmark), and once a quarter of it is on
// screen it rises from its masks: called by the scroll but played in time, so a page that stops a
// few pixels short never leaves it halfway. data-split on the name sets how: "chars" (the default)
// one letter after the other, "words" one word after the other, "lines" the whole name from one
// mask. The year of the © is written by the script.
(() => {
  const SELECTOR = '.kodza-footer-wordmark';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GLIDE = 'cubic-bezier(0.6, 0, 0.1, 1)'; // slow start, long settle
  const REF = 100; // the size the name is measured at, in px
  const VARS = ['size', 'height', 'lift', 'shift', 'mask'].map((name) => `--kz-footer-wordmark-${name}`);

  const span = (name) => {
    const el = document.createElement('span');
    el.className = `kodza-footer-wordmark__${name}`;
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

  // ---------- Scroll engine (begin) ----------
  // Hero Expand's engine, with its geometry turned for a footer, which does not pin: the progress
  // runs from 0, the top of the footer on the bottom of the screen, to 1, its bottom there (the
  // end of the page). `timeline()` returns tracks, [element, keyframes, from, to] with from and
  // to in progress; each becomes a paused Web Animation whose time follows the scroll, smoothed
  // by a requestAnimationFrame loop that sleeps once it has caught up, and `moved()` runs after
  // each step. The tracks are built again when the footer or the screen changes size, so
  // `timeline()` measures there.
  function scrub(root, signal, timeline, moved) {
    const SPAN = 1000;
    let tracks = [];
    let live = false;
    let now = 0;
    let target = 0;
    let frame = 0;
    let last = 0;
    const geometry = () => {
      const box = root.getBoundingClientRect();
      return {
        top: box.top,
        scale: box.height / root.offsetHeight || 1, // a parent scaled by transform
        run: root.offsetHeight,
      };
    };
    const progress = () => {
      const { top, scale, run } = geometry();
      return run > 0 ? Math.min(1, Math.max(0, (window.innerHeight - top) / scale / run)) : 0;
    };
    const seek = () => {
      tracks.forEach((a) => { a.currentTime = now * SPAN; });
      moved();
    };
    const tick = (time) => {
      const dt = last ? Math.min(time - last, 64) : 16;
      last = time;
      now += (target - now) * (1 - Math.exp(-dt / 70));
      if (Math.abs(target - now) < 0.0004) now = target;
      seek();
      frame = now === target ? 0 : requestAnimationFrame(tick);
      if (!frame) last = 0;
    };
    const update = () => {
      if (!live) return;
      target = progress();
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const clear = () => {
      tracks.forEach((a) => a.cancel());
      tracks = [];
    };
    const build = () => {
      clear();
      if (!live) return;
      tracks = timeline().filter(([el]) => el).map(([el, keyframes, from, to]) => {
        const a = el.animate(keyframes, { duration: (to - from) * SPAN, delay: from * SPAN, endDelay: (1 - to) * SPAN, fill: 'both' });
        a.pause();
        return a;
      });
      seek();
      update();
    };
    const stop = () => {
      live = false;
      cancelAnimationFrame(frame);
      frame = last = now = 0;
      clear();
    };
    // Scrolls the page so the progress is at least `p` (a focused link must show)
    const reveal = (p) => {
      const { top, scale, run } = geometry();
      if (run > 0 && progress() < p) window.scrollBy(0, top - (window.innerHeight - p * run * scale));
    };

    document.addEventListener('scroll', update, { passive: true, capture: true, signal });
    // The screen's height sets how far the content waits: a new one builds the tracks again
    let resized = 0;
    const rebuild = () => {
      cancelAnimationFrame(resized);
      resized = requestAnimationFrame(build);
    };
    window.addEventListener('resize', rebuild, { passive: true, signal });
    const ro = new ResizeObserver(rebuild);
    ro.observe(root);
    signal.addEventListener('abort', () => {
      ro.disconnect();
      cancelAnimationFrame(resized);
      stop();
    });
    return {
      start() {
        live = true;
        build();
      },
      stop,
      progress,
      reveal,
    };
  }
  // ---------- Scroll engine (end) ----------

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const q = (s) => root.querySelector(s);
    const year = String(new Date().getFullYear());
    root.querySelectorAll('.kodza-footer-wordmark__year').forEach((el) => { el.textContent = year; });
    const name = q('.kodza-footer-wordmark__name');
    if (!name) return;

    // One mask per letter
    const chars = [...name.textContent.trim()];
    const word = span('word');
    const glyphs = chars.map((char) => {
      const letter = span('letter');
      const glyph = span('glyph');
      glyph.textContent = char;
      letter.append(glyph);
      word.append(letter);
      return glyph;
    });
    const base = span('base-line');
    glyphs[0]?.after(base);
    name.replaceChildren(word);

    // Measured at the reference size, then scaled: the ink of the first letter on the left edge,
    // the last one on the right edge, the box from the top of the ink to its bottom. Screen
    // pixels are divided by the scale of a parent that would be zoomed by a transform
    let width = 0;
    const fit = () => {
      const w = name.clientWidth;
      if (!w || !glyphs.length) return;
      width = w;
      VARS.forEach((v) => name.style.removeProperty(v));
      name.style.setProperty(VARS[0], `${REF}px`);
      const style = getComputedStyle(name);
      const font = `${style.fontStyle} ${style.fontWeight} ${REF}px ${style.fontFamily}`;
      const marks = chars.map((char) => ink(char, font));
      const scale = name.getBoundingClientRect().width / name.offsetWidth || 1;
      const row = word.getBoundingClientRect();
      const from = (el) => (el.getBoundingClientRect().left - row.left) / scale;
      const left = from(glyphs[0]) + marks[0].left;
      const right = from(glyphs.at(-1)) + marks.at(-1).right;
      const baseline = (base.getBoundingClientRect().top - row.top) / scale;
      const top = baseline - Math.max(...marks.map((m) => m.ascent));
      const bottom = baseline + Math.max(...marks.map((m) => m.descent));
      const k = w / (right - left);
      [REF, bottom - top, top, left, bottom].forEach((value, i) => name.style.setProperty(VARS[i], `${value * k}px`));
    };

    // A new width refits on the next frame, outside the observer
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (name.clientWidth !== width) fit();
      });
    });
    observer.observe(name);
    document.fonts?.addEventListener('loadingdone', fit, { signal });
    signal.addEventListener('abort', () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    });
    fit();
    document.fonts?.ready.then(() => !signal.aborted && fit());
    if (reduceMotion) return;

    const inner = q('.kodza-footer-wordmark__inner');
    const veil = q('.kodza-footer-wordmark__veil');
    const style = getComputedStyle(root);
    const setting = (key, fallback) => {
      const value = parseFloat(style.getPropertyValue(`--kz-footer-wordmark-${key}`));
      return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback;
    };

    // The content starts `depth` of the way back and is in place once the footer is all on
    // screen (a footer taller than the screen: once its top reaches the top), at `ready`
    let ready = 1;
    const timeline = () => {
      const height = root.offsetHeight;
      const scale = root.getBoundingClientRect().height / height || 1;
      const reach = Math.min(height, window.innerHeight / scale);
      ready = height ? reach / height : 1;
      return [
        [inner, [{ transform: `translateY(${-setting('depth', 0.55) * reach}px)` }, { transform: 'none' }], 0, ready],
        [veil, [{ opacity: setting('shade', 0.85) }, { opacity: 0 }], 0, 0.8 * ready],
      ];
    };

    // Each letter has its own mask, all cut at the same height: the letters of a word, or of the
    // whole name, rising together read as one mask. Its place in the order, by letter or by word
    const split = name.dataset.split || 'chars';
    let words = 0;
    const order = chars.map((char, i) => {
      if (/\S/.test(char) && (i === 0 || /\s/.test(chars[i - 1]))) words += 1;
      return split === 'lines' ? 0 : split === 'words' ? Math.max(0, words - 1) : i;
    });
    const last = Math.max(...order);

    // The name rises once a quarter of it is on screen, and goes back down out of sight, below it
    let rising = [];
    const call = () => {
      root.classList.add('is-called');
      // A long name keeps the same overall pace
      const step = Math.min(split === 'words' ? 140 : 70, 420 / Math.max(1, last));
      rising = glyphs.map((glyph, i) => glyph.animate([{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration: 1100, delay: order[i] * step, easing: GLIDE, fill: 'backwards' }));
    };
    const dismiss = () => {
      rising.forEach((a) => a.cancel());
      rising = [];
      root.classList.remove('is-called');
    };
    const moved = () => {
      const box = name.getBoundingClientRect();
      const called = root.classList.contains('is-called');
      if (!called && box.height && box.top + box.height / 4 <= window.innerHeight) call();
      else if (called && box.top >= window.innerHeight) dismiss();
    };

    const pin = scrub(root, signal, timeline, moved);
    // Tabbing in scrolls on until the content is in place; a click leaves the page where it is
    root.addEventListener('focusin', (event) => {
      if (event.target.matches?.(':focus-visible')) pin.reveal(ready);
    }, { signal });
    signal.addEventListener('abort', () => {
      dismiss();
      root.classList.remove('is-live');
    });
    root.classList.add('is-live');
    pin.start();
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
