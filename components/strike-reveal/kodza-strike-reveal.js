// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Strike Reveal
// Pairs each <del> with the <ins> right after it. When the title reaches the screen, a pen strikes
// the old word, which dims, then the line opens to make room and the new word rises from its mask.
// Several pairs play in turn; titles of one block that come in together queue up. A line that
// would wrap differently once open keeps the room from the start, so nothing jumps. Send
// "kodza:replay" to play it again. Settings: the --kz-strike-reveal-* variables in the CSS,
// data-strike="scribble" on the title, and the constants below.
(() => {
  const SELECTOR = '.kodza-strike-reveal';
  const SVG = 'http://www.w3.org/2000/svg';
  // How much of the screen the title has to enter before it plays
  const ENTER = '0px 0px -12% 0px';
  // Played again: the time the pen takes everything back, all pairs together (keep it in step
  // with the rewind animations of the CSS)
  const REWIND = 550;
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
  // Per block (the parent of the titles): the moment its queue is free again
  const queues = new WeakMap();

  // A wobble, so the stroke looks drawn by hand. Each word draws from its own seed (mulberry32):
  // every stroke differs, but the same word redrawn keeps its shape
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
    // One line, a little uphill, past both ends of the word
    strike: (w, h) => {
      const y = h * 0.56;
      return `M ${w * 0.03} ${y + h * 0.04 + wobble(1)} L ${w * 0.97} ${y - h * 0.04 + wobble(1)}`;
    },
    // Scratched out: three passes, back and forth
    scribble: (w, h) => {
      const y = h * 0.56, a = h * 0.1;
      const left = (n) => w * (0.05 + n * 0.03), right = (n) => w * (0.95 - n * 0.03);
      return `M ${left(0)} ${y - a + wobble(1)} L ${right(0)} ${y - a * 1.5 + wobble(1)} `
        + `L ${left(1)} ${y + a * 0.2 + wobble(1)} L ${right(1)} ${y - a * 0.3 + wobble(1)} `
        + `L ${left(2)} ${y + a * 1.5 + wobble(1)} L ${right(2)} ${y + a + wobble(1)}`;
    },
  };

  // k: screen pixels per CSS pixel (a parent scaled with a transform must not change the stroke)
  function draw(del, shape, k) {
    const svg = del.querySelector('.kodza-strike-reveal__svg');
    const box = svg.getBoundingClientRect();
    const width = box.width / k;
    const height = box.height / k;
    if (!width || !height) return;
    svg.setAttribute('viewBox', `0 0 ${width.toFixed(1)} ${height.toFixed(1)}`);
    if (!seeds.has(del)) seeds.set(del, (Math.random() * 2 ** 32) >>> 0);
    next = seeded(seeds.get(del));
    svg.firstChild.setAttribute('d', shape(width, height));
  }

  // The words of a <del> or an <ins> moved into a span, so they can dim or rise on their own
  const wrap = (el, name) => {
    const span = document.createElement('span');
    span.className = `kodza-strike-reveal__${name}`;
    span.append(...el.childNodes);
    el.append(span);
  };

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const pairs = [];
    root.querySelectorAll('del, ins').forEach((el) => {
      const last = pairs.at(-1);
      if (el.localName === 'ins' && last?.del && !last.ins && el.previousElementSibling === last.del) last.ins = el;
      else pairs.push(el.localName === 'del' ? { del: el } : { ins: el });
    });
    if (!pairs.length) return;
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const shape = SHAPES[root.dataset.strike] || SHAPES.strike;
    pairs.forEach((pair, i) => {
      if (pair.del) {
        wrap(pair.del, 'old');
        const svg = document.createElementNS(SVG, 'svg');
        svg.setAttribute('class', 'kodza-strike-reveal__svg');
        svg.setAttribute('aria-hidden', 'true');
        const path = document.createElementNS(SVG, 'path');
        path.setAttribute('pathLength', '1');
        svg.append(path);
        pair.del.append(svg);
        pair.del.style.setProperty('--i', i);
      }
      if (pair.ins) {
        wrap(pair.ins, 'new');
        pair.ins.style.setProperty('--i', i);
      }
    });
    root.classList.add('is-live');
    const scale = () => root.getBoundingClientRect().width / root.offsetWidth || 1;
    const render = () => {
      const k = scale();
      pairs.forEach((pair) => pair.del && draw(pair.del, shape, k));
    };

    // The room each new word takes once there, and the space before it, so the line can open from
    // nothing. If the closed line wraps another way, every new word keeps its room from the start
    const measure = (waiting) => {
      const k = scale();
      const box = (el) => el.getBoundingClientRect();
      root.classList.remove('is-waiting');
      pairs.forEach((pair) => pair.ins?.classList.remove('is-held'));
      const height = box(root).height;
      const tops = pairs.map((pair) => {
        if (!pair.ins) return 0;
        const ins = box(pair.ins);
        const del = pair.del && box(pair.del);
        const gap = del && Math.abs(del.top - ins.top) < 2 ? ins.left - del.right : 0;
        pair.ins.style.setProperty('--w', `${(ins.width / k).toFixed(2)}px`);
        pair.ins.style.setProperty('--gap', `${(gap / k).toFixed(2)}px`);
        return ins.top;
      });
      root.classList.add('is-waiting');
      const moved = Math.abs(box(root).height - height) > 1
        || pairs.some((pair, i) => pair.ins && Math.abs(box(pair.ins).top - tops[i]) > 2);
      if (moved) pairs.forEach((pair) => pair.ins?.classList.add('is-held'));
      if (!waiting) root.classList.remove('is-waiting');
    };

    if (still) {
      document.fonts.ready.then(() => !signal.aborted && render());
    } else {
      measure(true);
    }
    const style = getComputedStyle(root);
    const stroke = ms(style.getPropertyValue('--kz-strike-reveal-draw'), 550);
    const rise = ms(style.getPropertyValue('--kz-strike-reveal-rise'), 700);
    const stagger = ms(style.getPropertyValue('--kz-strike-reveal-stagger'), 900);
    // When the last new word starts to rise, then when it has risen (the CSS sets the same times)
    const lastRise = ((pairs.length - 1) * stagger + stroke * 0.7 + 150) * pace;
    const total = lastRise + rise * pace;
    let state = still ? 'done' : 'waiting';
    let timers = [];
    const clear = () => {
      timers.forEach(clearTimeout);
      timers = [];
    };

    const done = () => {
      clear();
      root.classList.remove('is-playing', 'is-rewinding', 'is-waiting');
      root.style.removeProperty('--wait');
      state = 'done';
    };
    // One timeline: a title waiting its turn plays at once, with its wait as a delay, so the page
    // can be paused, sped up or finished as a whole (getAnimations)
    const start = () => {
      clear();
      root.classList.remove('is-playing', 'is-rewinding');
      render();
      measure(true);
      const now = performance.now();
      const block = root.parentElement || document;
      const wait = Math.max(0, (queues.get(block) || 0) - now);
      queues.set(block, now + wait + lastRise);
      root.style.setProperty('--wait', `${Math.round(wait)}ms`);
      root.style.setProperty('--clock', `${Math.round(total)}ms`);
      void root.offsetWidth;
      root.classList.remove('is-waiting');
      root.classList.add('is-playing');
      state = 'playing';
      // In case an animation never ends (a tab in the background)
      timers.push(setTimeout(done, wait + total + 300));
    };
    // Played again: the pen takes everything back first, rather than wiping it at once
    const play = () => {
      if (still) return;
      if (state !== 'done') return start();
      clear();
      measure(false);
      root.classList.add('is-rewinding');
      state = 'rewinding';
      timers.push(setTimeout(start, REWIND * pace + 300));
    };
    root.addEventListener('animationend', (event) => {
      if (event.target !== root) return;
      if (event.animationName === 'kodza-strike-reveal-clock' && state === 'playing') done();
      if (event.animationName === 'kodza-strike-reveal-rewind' && state === 'rewinding') start();
    }, { signal });

    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();
      document.fonts.ready.then(() => !signal.aborted && state === 'waiting' && start());
    }, { rootMargin: ENTER });
    if (!still) observer.observe(root);

    // The strokes follow the text when it reflows; still waiting, the room is measured again
    let width = root.offsetWidth;
    const resize = new ResizeObserver(() => {
      if (Math.abs(root.offsetWidth - width) < 1) return;
      width = root.offsetWidth;
      if (state === 'waiting') measure(true);
      if (state !== 'playing' && state !== 'rewinding') render();
    });
    resize.observe(root);
    root.addEventListener('kodza:replay', play, { signal });
    signal.addEventListener('abort', () => {
      observer.disconnect();
      resize.disconnect();
      clear();
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
