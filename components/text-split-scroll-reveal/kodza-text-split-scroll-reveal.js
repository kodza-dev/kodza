// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Text Reveal
// When the text reaches the screen, splits it into lines, words or letters and plays
// the reveal, one piece after the other. Lines are measured where the browser actually
// wraps them. Once done, the text goes back to plain text, so it reflows normally.
(() => {
  const SELECTOR = '.kodza-text-reveal';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function split(root, text, mode) {
    root.textContent = '';
    if (mode === 'chars' || mode === 'words') {
      const pieces = mode === 'chars' ? [...text] : text.split(/(\s+)/);
      let i = 0;
      pieces.forEach((piece) => {
        if (/^\s+$/.test(piece)) return root.append(piece);
        const span = document.createElement('span');
        span.className = 'kodza-text-reveal__piece';
        span.textContent = piece;
        span.style.setProperty('--i', i++);
        root.append(span);
      });
      return i;
    }
    // Lines: lay the words out, group them by height, then wrap each group
    const words = text.split(/\s+/).map((word) => {
      const span = document.createElement('span');
      span.textContent = word;
      root.append(span, ' ');
      return span;
    });
    const lines = [];
    words.forEach((word) => {
      const top = word.offsetTop;
      const line = lines.at(-1);
      if (line && Math.abs(line.top - top) < 4) line.words.push(word.textContent);
      else lines.push({ top, words: [word.textContent] });
    });
    root.textContent = '';
    lines.forEach((line, i) => {
      const outer = document.createElement('span');
      outer.className = 'kodza-text-reveal__line';
      const inner = document.createElement('span');
      inner.className = 'kodza-text-reveal__piece';
      inner.textContent = line.words.join(' ');
      inner.style.setProperty('--i', i);
      outer.append(inner);
      root.append(outer);
    });
    return lines.length;
  }

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const text = root.textContent.trim().replace(/\s+/g, ' ');
    const mode = root.dataset.split || 'lines';
    const style = getComputedStyle(root);
    const duration = parseFloat(style.getPropertyValue('--kz-text-reveal-duration')) * 1000 || 900;
    const stagger = parseFloat(style.getPropertyValue('--kz-text-reveal-stagger')) || 90;
    let timer;

    const play = () => {
      if (reduceMotion) return;
      clearTimeout(timer);
      root.classList.remove('is-playing', 'is-revealed');
      root.setAttribute('aria-label', text);
      const count = split(root, text, mode);
      void root.offsetWidth; // restart the animation, even on a replay
      root.classList.add('is-playing');
      timer = setTimeout(() => {
        root.classList.remove('is-playing');
        root.classList.add('is-revealed');
        root.removeAttribute('aria-label');
        root.textContent = text;
      }, duration + stagger * count + 50);
    };

    root.classList.add('is-ready');
    if (reduceMotion) return;
    // Hidden until it plays (the pieces are only created then, so wrap the text in one)
    split(root, text, 'words');

    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();
      document.fonts.ready.then(() => !signal.aborted && play());
    }, { threshold: 0.4 });
    observer.observe(root);
    root.addEventListener('kodza:replay', play, { signal });
    // A reveal still playing would put its plain text back into the restored markup
    signal.addEventListener('abort', () => {
      observer.disconnect();
      clearTimeout(timer);
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
