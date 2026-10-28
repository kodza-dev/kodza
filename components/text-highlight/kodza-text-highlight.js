// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Annotated Text
// Draws an SVG mark on each [data-annotate] word, at its real size, with a little
// randomness so no two strokes are the same (each mark keeps its own, so a replay or a
// reflow redraws the same stroke). When the paragraph reaches the screen,
// the marks draw themselves in order; played again, they are taken back before being redrawn.
// Redrawn at the right size when the text reflows.
(() => {
  const SELECTOR = '.kodza-annotate-text';
  const SVG = 'http://www.w3.org/2000/svg';

  // A wobble, so the line looks drawn by hand. Each mark draws from its own seed (mulberry32):
  // every stroke differs, but the same mark redrawn keeps its shape
  const seeds = new WeakMap();
  let next = Math.random;
  const seeded = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const wobble = (amount) => (next() - 0.5) * 2 * amount;

  const SHAPES = {
    underline: (w, h) => {
      const y = h - h * 0.12;
      return `M ${w * 0.04} ${y + wobble(1.5)} Q ${w * 0.5} ${y + 3 + wobble(2)} ${w * 0.97} ${y - 1 + wobble(1.5)}`;
    },
    strike: (w, h) => {
      const y = h * 0.55;
      return `M ${w * 0.03} ${y + 2 + wobble(1)} L ${w * 0.97} ${y - 2 + wobble(1)}`;
    },
    marker: (w, h) => {
      const y = h * 0.58;
      return `M ${w * 0.04} ${y + wobble(1)} L ${w * 0.96} ${y + wobble(1)}`;
    },
    // An ellipse drawn in one go, which overshoots its start like a real pen
    circle: (w, h) => {
      const cx = w / 2, cy = h / 2, rx = w / 2 + 2, ry = h / 2 + 1;
      const points = [];
      for (let a = -0.35; a <= Math.PI * 2 + 0.25; a += 0.18) {
        const r = 1 + wobble(0.035);
        points.push(`${(cx + Math.cos(a) * rx * r).toFixed(1)} ${(cy + Math.sin(a) * ry * r - a * 0.6).toFixed(1)}`);
      }
      return `M ${points.join(' L ')}`;
    },
  };

  // k: screen pixels per CSS pixel (a parent scaled with a transform must not change the stroke)
  function draw(mark, k = 1) {
    const shape = SHAPES[mark.dataset.annotate] || SHAPES.underline;
    let svg = mark.querySelector('.kodza-annotate__svg');
    if (!svg) {
      svg = document.createElementNS(SVG, 'svg');
      svg.setAttribute('class', 'kodza-annotate__svg');
      svg.setAttribute('aria-hidden', 'true');
      svg.append(document.createElementNS(SVG, 'path'));
      mark.append(svg);
    }
    const box = svg.getBoundingClientRect();
    const width = box.width / k;
    const height = box.height / k;
    if (!width || !height) return;
    svg.setAttribute('viewBox', `0 0 ${width.toFixed(1)} ${height.toFixed(1)}`);
    const path = svg.firstChild;
    if (!seeds.has(mark)) seeds.set(mark, (Math.random() * 2 ** 32) >>> 0);
    next = seeded(seeds.get(mark));
    path.setAttribute('d', shape(width, height));
    path.setAttribute('pathLength', '1');
  }

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const marks = [...root.querySelectorAll('[data-annotate]')];
    marks.forEach((mark, i) => mark.style.setProperty('--i', i));

    const render = () => {
      const k = root.getBoundingClientRect().width / root.offsetWidth || 1;
      marks.forEach((mark) => draw(mark, k));
    };
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let wait = 0;
    const start = () => {
      root.classList.remove('is-drawn', 'is-erasing');
      render();
      void root.offsetWidth; // start from an empty page
      root.classList.add('is-drawn');
    };
    // Played again: the pen takes the marks back first, rather than wiping them at once
    const play = () => {
      clearTimeout(wait);
      if (!root.classList.contains('is-drawn') || reduceMotion) return start();
      root.classList.add('is-erasing');
      wait = setTimeout(start, 420);
    };

    // Marks are measured on the real font: drawn once it has loaded, redrawn on resize after that
    let fontsReady = false;
    document.fonts.ready.then(() => {
      if (signal.aborted) return;
      fontsReady = true;
      render();
      const observer = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        play();
      }, { threshold: 0.6 });
      observer.observe(root);
      signal.addEventListener('abort', () => observer.disconnect());
    });

    let width = 0;
    const resize = new ResizeObserver(([entry]) => {
      if (Math.abs(entry.contentRect.width - width) < 1) return;
      width = entry.contentRect.width;
      if (fontsReady) render();
    });
    resize.observe(root);
    signal.addEventListener('abort', () => {
      resize.disconnect();
      clearTimeout(wait);
    });
    root.addEventListener('kodza:replay', play, { signal });
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
