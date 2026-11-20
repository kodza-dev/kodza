// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Scramble Text
// A label or a short title that decodes when it reaches the screen, and decodes again whenever its
// text changes: set its textContent ("Deploying…" → "Live") and the new text settles letter by
// letter, from left to right. data-scramble="flap" rolls each letter through the alphabet (or the
// digits) like a split-flap board, and a letter that stays the same does not move (14:32 → 14:33).
// Each letter keeps the width of its real character, and a one-line text slides to its new width.
// Screen readers read the final text only. Tuned with the constants below and --kz-scramble-text-*.
(() => {
  const SELECTOR = '.kodza-scramble-text';
  const SYMBOLS = '!<>-_\\/[]{}=+*^?#%&01';
  const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';
  const DIGITS = '0123456789';
  const SWAP_EVERY = 50; // ms between two characters of an unsettled letter, not every frame
  const FIRST = 0.25; // the first letter settles at this share of the duration, the last one at the end
  const ON_SCREEN = 0.6; // share of the text in view before it decodes
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const setOf = (char) => (DIGITS.includes(char) ? DIGITS : ALPHABET.includes(char.toLowerCase()) ? ALPHABET : null);

  // What an unsettled letter shows, for each style
  const STYLES = {
    symbols: (slot) => pick(slot.fits || SYMBOLS),
    // The next character of its set: it starts just enough steps back to land on its own at the
    // moment it settles
    flap: (slot, every) => {
      const set = setOf(slot.char);
      if (!set) return slot.char;
      const lower = slot.char.toLowerCase();
      if (slot.flap === undefined) {
        const steps = Math.max(1, Math.round(slot.settle / every));
        slot.flap = (set.indexOf(lower) - (steps % set.length) + set.length) % set.length;
      } else {
        slot.flap = (slot.flap + 1) % set.length;
      }
      const char = set[slot.flap];
      return slot.char === lower ? char : char.toUpperCase();
    },
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    // Without motion the text stays the page's own: a new textContent simply shows
    if (still) return;
    const style = STYLES[root.dataset.scramble] || STYLES.symbols;
    const every = SWAP_EVERY * pace;
    const durationOf = () => (parseFloat(getComputedStyle(root).getPropertyValue('--kz-scramble-text-duration')) * 1000 || 900) * pace;
    // Screen pixels per CSS pixel: a parent scaled with a transform must not change the widths.
    // Below 1 %, it is the rounding of offsetWidth, not a scale
    const scale = () => {
      const ratio = root.getBoundingClientRect().width / root.offsetWidth || 1;
      return Math.abs(ratio - 1) < 0.01 ? 1 : ratio;
    };

    let text = null;
    let sr = null;
    let slots = [];
    let frame = 0;
    let resize = null;
    let seen = false;
    // The size of the text as last measured, in CSS pixels: once replaced, the old one is gone
    let box = null;

    // Each letter takes the width of its real character, whatever it shows
    const measure = () => {
      const k = scale();
      const shown = slots.map((slot) => slot.el.textContent);
      slots.forEach((slot) => {
        slot.el.style.width = '';
        slot.el.textContent = slot.char;
      });
      const widths = slots.map((slot) => slot.el.getBoundingClientRect().width / k);
      // A symbol wider than its letter would spill onto the next one: each letter shows only the
      // symbols that fit in it (the narrowest few, for an i or a dot)
      const probe = slots.find((slot) => /\S/.test(slot.char));
      const symbols = probe
        ? [...SYMBOLS].map((char) => {
            probe.el.textContent = char;
            return { char, width: probe.el.getBoundingClientRect().width / k };
          }).sort((a, b) => a.width - b.width)
        : [];
      if (probe) probe.el.textContent = probe.char;
      slots.forEach((slot, i) => {
        const fits = symbols.filter((symbol) => symbol.width <= widths[i] * 1.05);
        slot.fits = (fits.length >= 3 ? fits : symbols.slice(0, 3)).map((symbol) => symbol.char).join('');
        slot.el.style.width = `${widths[i].toFixed(3)}px`;
        slot.el.textContent = shown[i];
      });
      const rect = text.getBoundingClientRect();
      box = { width: rect.width / k, height: rect.height / k };
    };

    // The text split into words (they wrap as a whole) of letters
    const build = (value) => {
      text = document.createElement('span');
      text.className = 'kodza-scramble-text__text';
      text.setAttribute('aria-hidden', 'true');
      slots = [];
      value.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) return text.append(' ');
        const word = document.createElement('span');
        word.className = 'kodza-scramble-text__word';
        [...part].forEach((char) => {
          const el = document.createElement('span');
          el.className = 'kodza-scramble-text__letter';
          el.textContent = char;
          word.append(el);
          slots.push({ el, char });
        });
        text.append(word);
      });
      sr = document.createElement('span');
      sr.className = 'kodza-scramble-text__sr';
      sr.textContent = value;
      root.replaceChildren(text, sr);
      observer.takeRecords();
    };

    // The changing letters settle one after the other, left to right
    const play = (changing) => {
      cancelAnimationFrame(frame);
      const duration = durationOf();
      const moving = slots.filter((slot, i) => changing[i]);
      moving.forEach((slot, rank) => {
        slot.flap = undefined;
        slot.settle = duration * (FIRST + (1 - FIRST) * (moving.length > 1 ? rank / (moving.length - 1) : 0.4));
      });
      slots.forEach((slot, i) => {
        slot.done = !changing[i];
        slot.el.classList.toggle('is-scrambled', changing[i]);
        if (changing[i]) slot.el.textContent = style(slot, every);
      });
      if (!moving.length) return;
      const start = performance.now();
      let last = start;
      const tick = (now) => {
        const swap = now - last >= every;
        if (swap) last = now;
        let left = 0;
        moving.forEach((slot) => {
          if (slot.done) return;
          if (now - start >= slot.settle) {
            slot.done = true;
            slot.el.textContent = slot.char;
            slot.el.classList.remove('is-scrambled');
          } else {
            left++;
            if (swap) slot.el.textContent = style(slot, every);
          }
        });
        if (left) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const decode = () => play(slots.map((slot) => /\S/.test(slot.char)));

    // A new text set on the root (textContent, innerText): it takes the place of the old one
    const change = () => {
      if (text && text.parentNode === root && sr.parentNode === root && root.childNodes.length === 2) return;
      const value = root.textContent.trim().replace(/\s+/g, ' ');
      const old = slots.map((slot) => slot.char);
      const before = box;
      resize?.cancel();
      build(value);
      measure();
      if (!seen) return decode();
      play(slots.map((slot, i) => /\S/.test(slot.char) && slot.char !== old[i]));
      // One line before and after: it slides to its new width instead of jumping
      const after = box;
      const line = parseFloat(getComputedStyle(text).lineHeight) || after.height;
      if (!before || Math.abs(before.height - after.height) > 1 || after.height > line * 1.5) return;
      text.classList.add('is-resizing');
      resize = text.animate([{ width: `${before.width}px` }, { width: `${after.width}px` }], {
        duration: durationOf() * 0.7,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      });
      const done = text;
      resize.finished.then(() => done.classList.remove('is-resizing'), () => done.classList.remove('is-resizing'));
    };

    const observer = new MutationObserver(change);
    build(root.textContent.trim().replace(/\s+/g, ' '));
    // The page's font changes the widths: measured again once it has arrived
    measure();
    // Waiting to be seen, each letter shows a symbol picked from its place, not at random: the
    // same text renders the same way twice (server and client, two copies)
    slots.forEach((slot, i) => {
      if (!/\S/.test(slot.char)) return;
      slot.el.textContent = slot.fits[(i * 7 + slot.char.charCodeAt(0)) % slot.fits.length];
      slot.el.classList.add('is-scrambled');
    });
    document.fonts.ready.then(() => !signal.aborted && measure());
    observer.observe(root, { childList: true });

    const view = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      view.disconnect();
      seen = true;
      decode();
    }, { threshold: ON_SCREEN });
    view.observe(root);

    let width = window.innerWidth;
    window.addEventListener('resize', () => {
      if (window.innerWidth === width) return;
      width = window.innerWidth;
      measure();
    }, { signal });
    // kodza:replay on the root decodes it again, from scratch
    root.addEventListener('kodza:replay', () => {
      seen = true;
      decode();
    }, { signal });
    signal.addEventListener('abort', () => {
      cancelAnimationFrame(frame);
      resize?.cancel();
      observer.disconnect();
      view.disconnect();
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
