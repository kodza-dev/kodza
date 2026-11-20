// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Drop Cap
// Takes the first letter of the paragraph into an element of its own and sets it over two or three
// lines from the fonts themselves: its cap height on the cap height of the first line, its
// baseline on the baseline of the last one, its ink on the left edge of the text. Set again when
// the fonts load or the paragraph changes width. When the paragraph reaches the screen, the letter
// rises from behind its baseline, then the text shows from the top down. Send "kodza:replay" to
// play it again. Settings: the --kz-drop-cap-* variables in the CSS, data-lines="2" on the
// paragraph, and the constants below.
(() => {
  const SELECTOR = '.kodza-drop-cap';
  // How much of the screen the paragraph has to enter before it plays
  const ENTER = '0px 0px -12% 0px';
  // The paragraph follows the letter in --kz-drop-cap-sweep for six lines, and takes longer the
  // longer it is, within these bounds
  const SWEEP_LINES = 6;
  const SWEEP_MIN = 0.75;
  const SWEEP_MAX = 1.6;
  // Played again: the letter sinks and the text hides first, in this long
  const REWIND = 450;
  // The first letter, with the opening quote or bracket that comes before it
  const FIRST = /^(\s*)([\p{Ps}\p{Pi}"'«]*[\p{L}\p{N}])/u;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const ms = (value, fallback) => {
    const n = parseFloat(value);
    if (!(n >= 0)) return fallback;
    return /ms\s*$/.test(value) ? n : n * 1000;
  };

  // The fonts are read on a canvas: the ink of a letter, and the ascent and descent the browser
  // lays a line out with
  const ctx = document.createElement('canvas').getContext('2d');
  const metrics = (style, size, text) => {
    ctx.font = `${style.fontStyle} ${style.fontWeight} ${size}px ${style.fontFamily}`;
    const m = ctx.measureText(text);
    return {
      ascent: m.fontBoundingBoxAscent ?? size * 0.92,
      descent: m.fontBoundingBoxDescent ?? size * 0.24,
      top: m.actualBoundingBoxAscent,
      bottom: m.actualBoundingBoxDescent,
      left: m.actualBoundingBoxLeft,
      right: m.actualBoundingBoxRight,
    };
  };
  const cased = (text, transform) => {
    if (transform === 'uppercase') return text.toUpperCase();
    if (transform === 'lowercase') return text.toLowerCase();
    return text;
  };
  const px = (n) => `${n.toFixed(2)}px`;

  // The first text of the paragraph, wherever it is (a link, a strong)
  const firstText = (root) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.data.trim()) return node;
    }
    return null;
  };

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const node = firstText(root);
    const found = node && node.data.match(FIRST);
    if (!found) return;
    const rest = node.splitText(found[1].length);
    rest.splitText(found[2].length);
    const letter = document.createElement('span');
    letter.className = 'kodza-drop-cap__letter';
    const glyph = document.createElement('span');
    glyph.className = 'kodza-drop-cap__glyph';
    glyph.append(rest);
    letter.append(glyph);
    node.after(letter);
    root.classList.add('is-live');

    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    let from = 0; // how far below its place the letter starts, to be hidden whole
    let lineHeight = 0;

    // The maths of a typesetter: line 1's cap height and line n's baseline, from the text's font;
    // the size that gives the letter that cap height, from the letter's font
    const layout = () => {
      const text = getComputedStyle(root);
      const size = parseFloat(text.fontSize);
      const body = metrics(text, size, 'H');
      lineHeight = parseFloat(text.lineHeight);
      if (!(lineHeight > 0)) lineHeight = body.ascent + body.descent;
      const lines = Math.max(1, Math.round(parseFloat(text.getPropertyValue('--kz-drop-cap-lines')) || 3));
      const first = (lineHeight - body.ascent - body.descent) / 2 + body.ascent;
      const last = first + (lines - 1) * lineHeight;
      const capTop = first - body.top;
      const style = getComputedStyle(glyph);
      const shown = cased(glyph.textContent, style.textTransform);
      const cap = metrics(style, 100, 'H').top / 100;
      if (!cap) return;
      const fontSize = (last - capTop) / cap;
      const ink = metrics(style, fontSize, shown);
      const height = lines * lineHeight - 1;
      // With a line height of 1, the baseline sits half the leading plus the ascent down the box
      const baseline = (fontSize - ink.ascent - ink.descent) / 2 + ink.ascent;
      from = ink.top + ink.bottom + 3;
      const set = {
        '--kz-drop-cap-size': px(fontSize),
        '--kz-drop-cap-top': px(last - baseline),
        '--kz-drop-cap-left': px(ink.left),
        '--kz-drop-cap-w': px(Math.max(1, ink.left + ink.right)),
        '--kz-drop-cap-h': px(height),
        '--kz-drop-cap-clip': px(height - last - ink.bottom - 1),
        '--kz-drop-cap-from': px(from),
        '--kz-drop-cap-band': px(lineHeight * 2),
      };
      Object.entries(set).forEach(([name, value]) => root.style.setProperty(name, value));
    };
    layout();
    document.fonts.ready.then(() => !signal.aborted && layout());
    document.fonts.addEventListener('loadingdone', layout, { signal });
    let width = root.offsetWidth;
    const resize = new ResizeObserver(() => {
      if (Math.abs(root.offsetWidth - width) < 1) return;
      width = root.offsetWidth;
      layout();
    });
    resize.observe(root);
    signal.addEventListener('abort', () => resize.disconnect());
    if (still) return;

    const style = getComputedStyle(root);
    const rise = ms(style.getPropertyValue('--kz-drop-cap-rise'), 900) * pace;
    const follow = ms(style.getPropertyValue('--kz-drop-cap-follow'), 300) * pace;
    const sweep = ms(style.getPropertyValue('--kz-drop-cap-sweep'), 1100) * pace;
    const HIDDEN = '0 0, 0 100%';
    const SHOWN = '0 0, 0 0';
    const mask = (position) => ({ maskPosition: position, webkitMaskPosition: position });
    let state = 'waiting';
    let running = [];
    const stop = () => {
      running.forEach((animation) => animation.cancel());
      running = [];
    };
    const after = (animation, then) => {
      running.push(animation);
      animation.finished.then(() => !signal.aborted && then(), () => {});
    };
    root.classList.add('is-waiting');

    const play = () => {
      stop();
      layout();
      const lines = root.offsetHeight / lineHeight;
      const length = sweep * Math.min(SWEEP_MAX, Math.max(SWEEP_MIN, lines / SWEEP_LINES));
      root.classList.remove('is-waiting');
      root.classList.add('is-rising', 'is-following');
      state = 'playing';
      after(glyph.animate([{ transform: `translateY(${from}px)` }, { transform: 'none' }], {
        duration: rise, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards',
      }), () => root.classList.remove('is-rising'));
      after(root.animate([mask(HIDDEN), mask(SHOWN)], {
        duration: length, delay: follow, easing: 'cubic-bezier(0.33, 0, 0.2, 1)', fill: 'both',
      }), () => {
        root.classList.remove('is-following');
        stop();
        state = 'done';
      });
    };
    // Played again: the letter sinks and the text hides from the bottom up, rather than at once
    const replay = () => {
      if (state !== 'done') return play();
      stop();
      state = 'rewinding';
      root.classList.add('is-rising', 'is-following');
      const options = { duration: REWIND * pace, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' };
      after(root.animate([mask(SHOWN), mask(HIDDEN)], options), () => {});
      after(glyph.animate([{ transform: 'none' }, { transform: `translateY(${from}px)` }], options), play);
    };

    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();
      document.fonts.ready.then(() => !signal.aborted && state === 'waiting' && play());
    }, { rootMargin: ENTER });
    observer.observe(root);
    root.addEventListener('kodza:replay', replay, { signal });
    signal.addEventListener('abort', () => {
      observer.disconnect();
      stop();
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
