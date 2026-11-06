// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Section Tone Shift
// Measures how much of a band around the middle of the screen the marked sections cover, and
// writes it, with a soft follow, as the mix of the two tones (--kz-section-tone-shift-mix): the
// background follows the scroll. Halfway, the text and the hairlines change side (is-shifted), the
// root says which tone the page is in (data-header-tone, read by Scroll Header) and sends
// kodza:tone, for a header of your own. Reduced motion, or a site pace of 0: each marked section
// wears the other tone on its own, and says so in data-header-tone.
(() => {
  const SELECTOR = '[data-kodza-section-tone-shift]';
  // The band around the middle of the screen, as a share of its height: the page shifts while the
  // edge of a marked section crosses it, and holds the other tone while the section covers it
  const BAND = 0.4;
  // The text changes side once the band is this covered, and back below the second: the gap keeps
  // it from flickering when the scroll stops right on the edge
  const SHIFT_IN = 0.55;
  const SHIFT_OUT = 0.45;
  // Between these mixes the page is a mid grey: the soft text (labels, paragraphs) takes the full
  // ink, so it stays readable if the scroll stops there
  const CROSSING_FROM = 0.2;
  const CROSSING_TO = 0.8;
  // How long the background takes to catch up with the scroll, in ms (times the site's pace): a
  // soft follow instead of a colour glued to the wheel. 0 glues it
  const SMOOTHING = 120;
  // The mix left to travel below this ends the loop
  const SETTLE = 0.0005;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  // Slow out of one tone, slow into the other
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

  // 'dark' or 'light', for any CSS colour (hex, rgb, oklch…): painted on a 1px canvas and read back,
  // then dark when white text would contrast more with it than black text
  let pixel = null;
  const toneOf = (color) => {
    pixel ??= Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true });
    pixel.clearRect(0, 0, 1, 1);
    pixel.fillStyle = '#fff';
    pixel.fillStyle = color.trim() || '#fff';
    pixel.fillRect(0, 0, 1, 1);
    const [r, g, b] = pixel.getImageData(0, 0, 1, 1).data;
    const linear = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b) < 0.179 ? 'dark' : 'light';
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const marked = [...root.querySelectorAll('[data-tone-shift]')];
    if (!marked.length) return;
    const styles = getComputedStyle(root);
    const toneAt = (end) => toneOf(styles.getPropertyValue(`--kz-section-tone-shift-${end}`));

    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    if (still) {
      root.dataset.headerTone = toneAt('from');
      marked.forEach((section) => { section.dataset.headerTone = toneAt('to'); });
      return;
    }
    const smoothing = SMOOTHING * pace;

    let current = null; // the mix written now
    let shifted = null; // which side the text is on
    let raf = 0;
    let last = 0;
    let shown = false;

    // How much of the band the marked sections cover, eased: 0 the page's own tone, 1 the other one
    const goal = () => {
      const top = (innerHeight * (1 - BAND)) / 2;
      const bottom = innerHeight - top;
      let covered = 0;
      marked.forEach((section) => {
        const rect = section.getBoundingClientRect();
        covered += Math.max(0, Math.min(rect.bottom, bottom) - Math.max(rect.top, top));
      });
      return ease(clamp(covered / (bottom - top), 0, 1));
    };
    // Decided on the scroll itself, before the next frame: a header that reads the tone in its own
    // frame (Scroll Header) already finds the new one
    const decide = (value) => {
      const next = shifted ? value > SHIFT_OUT : value >= SHIFT_IN;
      if (next === shifted) return;
      shifted = next;
      root.classList.toggle('is-shifted', next);
      const tone = toneAt(next ? 'to' : 'from');
      root.dataset.headerTone = tone;
      root.dispatchEvent(new CustomEvent('kodza:tone', { bubbles: true, detail: { tone, shifted: next } }));
    };
    const write = () => {
      root.style.setProperty('--kz-section-tone-shift-mix', current.toFixed(4));
      root.classList.toggle('is-crossing', current > CROSSING_FROM && current < CROSSING_TO);
    };
    const tick = (now) => {
      raf = 0;
      const to = goal();
      const step = last ? Math.min(now - last, 64) : 16.7;
      last = now;
      if (current === null || !smoothing) current = to;
      else current += (to - current) * (1 - Math.exp(-step / smoothing));
      if (Math.abs(to - current) < SETTLE) current = to;
      write();
      decide(current);
      if (current !== to) raf = requestAnimationFrame(tick);
      else last = 0;
    };
    const queue = () => {
      if (!shown || raf) return;
      raf = requestAnimationFrame(tick);
    };
    const follow = () => {
      if (!shown) return;
      queue();
    };
    // Placed at once, without the crossing: on load, or back on screen after a jump (an anchor, Home)
    const place = () => {
      current = goal();
      write();
      decide(current);
    };

    root.classList.add('is-shifting');
    place();
    // Next frame, once the first tone is painted: from now on the text crosses instead of jumping
    requestAnimationFrame(() => root.classList.add('is-moving'));

    const io = new IntersectionObserver(([entry]) => {
      shown = entry.isIntersecting;
      if (shown) {
        place();
        queue();
      }
    });
    io.observe(root);
    const resize = new ResizeObserver(follow);
    resize.observe(root);
    window.addEventListener('scroll', follow, { passive: true, signal });
    window.addEventListener('resize', follow, { signal });
    signal.addEventListener('abort', () => {
      io.disconnect();
      resize.disconnect();
      cancelAnimationFrame(raf);
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
