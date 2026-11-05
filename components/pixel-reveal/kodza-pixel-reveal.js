// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Pixel Reveal
// A lazy image comes into focus instead of dropping in. Until its file is there, a canvas laid
// over it (hidden the rest of the time) holds its place in a flat colour; once it has really
// arrived (decode()), the canvas draws it in big pixels, then finer, four steps in half a
// second, and melts into the sharp image. An image already there (from the cache), or that arrives out of view, shows sharp at
// once: no fake loading. On a figure, its own images; with data-target, every image of a content
// already on the page (a WordPress post). The steps are the constants below, the flat colour is
// --kz-pixel-reveal-placeholder, and kodza:replay plays it again on the images already there.
(() => {
  const SELECTOR = '.kodza-pixel-reveal';
  const BLOCKS = [32, 16, 8, 4]; // the size of a pixel at each step, in CSS px, big to fine
  const STEP = 120; // ms each step stays on screen
  const FADE = 160; // ms of the last step melting into the sharp image
  const WAIT = 120; // ms an image must be watched still loading to earn the effect (a wait, not motion)
  const REPLAY_HOLD = 500; // ms of flat colour before a replay (a wait, not motion)
  const MIN_SIZE = 64; // px: anything smaller (an icon, an emoji) loads as usual
  const TARGET = 'article, main, .entry-content'; // what data-target looks for when left empty
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  // An image is taken by one root only, even when two of them point at the same post
  const taken = new WeakSet();

  // data-target: the content whose images it takes over, the one the root sits in, or else the
  // nearest one found from the root up
  const contentOf = (root) => {
    const selector = root.dataset.target || TARGET;
    const inside = root.closest(selector);
    if (inside) return inside;
    let scope = root.parentElement;
    while (scope && !scope.querySelector(selector)) scope = scope.parentElement;
    return scope?.querySelector(selector);
  };

  // While it loads, the image is held back (inline and important, over any lazy-load plugin):
  // half a file never paints. Its own inline opacity, if it had one, comes back after
  const hide = (img) => {
    const before = [img.style.getPropertyValue('opacity'), img.style.getPropertyPriority('opacity')];
    img.style.setProperty('opacity', '0', 'important');
    return () => {
      img.style.removeProperty('opacity');
      if (before[0]) img.style.setProperty('opacity', ...before);
      if (!img.getAttribute('style')) img.removeAttribute('style');
    };
  };

  const sheet = (width, height) => Object.assign(document.createElement('canvas'), { width, height });

  // Where the image is drawn in its box, as the page draws it (object-fit, object-position)
  const fitOf = (img, w, h) => {
    const style = getComputedStyle(img);
    let sx = w / img.naturalWidth;
    let sy = h / img.naturalHeight;
    if (style.objectFit === 'cover') sx = sy = Math.max(sx, sy);
    if (style.objectFit === 'contain') sx = sy = Math.min(sx, sy);
    if (style.objectFit === 'scale-down') sx = sy = Math.min(1, sx, sy);
    if (style.objectFit === 'none') sx = sy = 1;
    const dw = img.naturalWidth * sx;
    const dh = img.naturalHeight * sy;
    const [x, y] = style.objectPosition.split(' ');
    const offset = (value = '50%', room) => (value.endsWith('%') ? (room * parseFloat(value)) / 100 : parseFloat(value) || 0);
    return [offset(x, w - dw), offset(y, h - dh), dw, dh];
  };

  // The image at the size of its box, then halved again and again: each half averages four
  // pixels, so a big square keeps the true colour of its patch, not one stray pixel of it
  const levelsOf = (img, w, h) => {
    const levels = [sheet(w, h)];
    const ctx = levels[0].getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, ...fitOf(img, w, h));
    while (levels.at(-1).width > 2 && levels.at(-1).height > 2) {
      const last = levels.at(-1);
      const half = sheet(Math.ceil(last.width / 2), Math.ceil(last.height / 2));
      half.getContext('2d').drawImage(last, 0, 0, half.width, half.height);
      levels.push(half);
    }
    return levels;
  };

  // The canvas on the image, whatever the layout around it: sized to it, then moved by the gap
  // measured between the two, in the parent's own pixels (a parent scaled by a transform)
  const place = (canvas, img) => {
    const w = img.offsetWidth;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${img.offsetHeight}px`;
    canvas.style.borderRadius = getComputedStyle(img).borderRadius;
    canvas.style.transform = 'none';
    const from = canvas.getBoundingClientRect();
    const to = img.getBoundingClientRect();
    const scale = to.width / w || 1;
    canvas.style.transform = `translate(${(to.left - from.left) / scale}px, ${(to.top - from.top) / scale}px)`;
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const targeted = root.hasAttribute('data-target');
    const content = targeted ? contentOf(root) : root;
    if (!content) return;
    const images = [...content.querySelectorAll('img')].filter((img) => (targeted ? !img.closest(SELECTOR) : img.closest(SELECTOR) === root) && !taken.has(img));
    // Out of the root, a canvas does not inherit its colour: it gets it from the root
    const placeholder = getComputedStyle(root).getPropertyValue('--kz-pixel-reveal-placeholder');
    const covers = new Map(); // image → { canvas, timers, pending, fade }
    const seen = new Map(); // image → when it came into view, 0 while out of it
    const big = (img) => img.offsetWidth >= MIN_SIZE && img.offsetHeight >= MIN_SIZE;

    // Each image gets its canvas once, hidden until it is needed: the markup is the same whether
    // the file was in the cache or not
    const canvases = new Map(); // image → its canvas
    const canvasOf = (img) => {
      const canvas = sheet(1, 1);
      canvas.className = 'kodza-pixel-reveal__canvas';
      canvas.setAttribute('aria-hidden', 'true');
      if (targeted) canvas.style.setProperty('--kz-pixel-reveal-placeholder', placeholder);
      canvas.style.borderRadius = getComputedStyle(img).borderRadius;
      (img.parentElement?.tagName === 'PICTURE' ? img.parentElement : img).before(canvas);
      canvases.set(img, canvas);
    };

    // The flat colour over an image, at its size; the image itself waits under it, hidden, so
    // half a file never paints
    const cover = (img, pending) => {
      const canvas = canvases.get(img);
      canvas.width = canvas.height = 1;
      canvas.classList.remove('is-drawn');
      canvas.classList.add('is-on');
      const entry = { canvas, timers: [], pending, show: hide(img) };
      covers.set(img, entry);
      place(canvas, img);
      return entry;
    };

    // Back to the plain image: the canvas hides, back to 1 px (a hidden box still widens the
    // page if a resize left it bigger than its column), the image shows
    const drop = (img) => {
      const entry = covers.get(img);
      if (!entry) return;
      covers.delete(img);
      entry.timers.forEach(clearTimeout);
      entry.fade?.cancel();
      const { canvas } = entry;
      canvas.classList.remove('is-on', 'is-drawn');
      canvas.width = canvas.height = 1;
      ['width', 'height', 'transform'].forEach((prop) => canvas.style.removeProperty(prop));
      entry.show();
    };

    // Big pixels to sharp: one step every STEP ms, then the last one melts into the image
    const play = (img, entry) => {
      const w = img.offsetWidth;
      const h = img.offsetHeight;
      if (!img.naturalWidth || !big(img)) return drop(img);
      const { canvas } = entry;
      const ctx = canvas.getContext('2d');
      const levels = levelsOf(img, w, h);
      const later = (fn, ms) => entry.timers.push(setTimeout(fn, ms * pace));
      BLOCKS.forEach((block, i) => later(() => {
        const cols = Math.max(1, Math.round(w / block));
        const rows = Math.max(1, Math.round(h / block));
        canvas.width = cols;
        canvas.height = rows;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(levels.findLast((level) => level.width >= cols && level.height >= rows) || levels[0], 0, 0, cols, rows);
        canvas.classList.add('is-drawn');
        place(canvas, img);
      }, i * STEP));
      later(() => {
        entry.show();
        entry.fade = canvas.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE * pace, easing: 'ease-out' });
        entry.fade.finished.then(() => drop(img), () => {});
      }, BLOCKS.length * STEP);
    };

    // The file is in. Once decoded (no jank on the first step), it plays if the visitor watched
    // the flat colour long enough; arrived out of view, or in a blink, it just shows
    const arrive = async (img) => {
      const entry = covers.get(img);
      if (!entry?.pending) return;
      entry.pending = false;
      await img.decode().catch(() => {});
      if (covers.get(img) !== entry) return;
      const since = seen.get(img);
      if (still || !since || performance.now() - since < WAIT) return drop(img);
      play(img, entry);
    };

    const watched = new IntersectionObserver((entries) => entries.forEach((entry) => {
      seen.set(entry.target, entry.isIntersecting ? performance.now() : 0);
    }));
    const sizes = new ResizeObserver(() => covers.forEach((entry, img) => place(entry.canvas, img)));

    images.forEach((img) => {
      taken.add(img);
      if (!big(img)) return;
      watched.observe(img);
      sizes.observe(img);
      if (img.parentElement) sizes.observe(img.parentElement);
      img.addEventListener('load', () => arrive(img), { signal });
      img.addEventListener('error', () => covers.get(img)?.pending && drop(img), { signal });
      canvasOf(img);
      // There already (from the cache), or broken: left as it is. With no file yet (a lazy
      // loader that sets src later), it waits like the others
      if (img.complete && (img.naturalWidth || img.currentSrc)) return;
      cover(img, true);
    });

    root.addEventListener('kodza:replay', () => {
      if (still) return;
      images.forEach((img) => {
        if (!img.complete || !img.naturalWidth || !big(img) || covers.get(img)?.pending) return;
        drop(img);
        const entry = cover(img, false);
        entry.timers.push(setTimeout(() => play(img, entry), REPLAY_HOLD));
      });
    }, { signal });

    signal.addEventListener('abort', () => {
      watched.disconnect();
      sizes.disconnect();
      [...covers.keys()].forEach(drop);
      canvases.forEach((canvas) => canvas.remove());
      images.forEach((img) => taken.delete(img));
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
