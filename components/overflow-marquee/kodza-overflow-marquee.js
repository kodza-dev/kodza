// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Overflow Marquee
// Wraps the title's text so it can glide, measures how much of it the box hides, and plays the
// glide while the title (or the link or button around it) is hovered or focused from the keyboard.
// Speed and soft edge are CSS variables; the waits are the constants below.
(() => {
  const SELECTOR = '.kodza-overflow-marquee';
  // Time to read the end, then the start, before it glides again (reading time: not paced)
  const HOLD_END = 1400;
  const HOLD_START = 900;
  // A pointer that only crosses the title does not start it
  const INTENT = 160;
  // Shortest glide, in ms. Once the pointer has left, the text glides back at the same speed
  const MIN_GLIDE = 450;
  const GLIDE = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const MASK = CSS.supports('mask-position', '0 0') ? 'maskPosition' : 'webkitMaskPosition';

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    // The element that answers the pointer: data-host (a selector), else the link or button
    // around the title, else the title itself
    const host = root.closest(root.dataset.host || 'a, button') || root;

    const text = document.createElement('span');
    text.className = 'kodza-overflow-marquee__text';
    text.append(...root.childNodes);
    root.append(text);

    let distance = 0;
    let moves = [];
    let timer = 0;
    let hovered = false;
    let focused = false;

    // How far the text goes past the box, in CSS pixels (offsetWidth ignores a scaled parent)
    const measure = () => {
      root.classList.add('is-moving');
      const style = getComputedStyle(root);
      const inner = root.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      distance = Math.max(0, text.offsetWidth - inner);
      if (distance < 1) root.classList.remove('is-moving');
      return distance >= 1;
    };
    const glideTime = (share) => {
      const speed = parseFloat(getComputedStyle(root).getPropertyValue('--kz-overflow-marquee-speed')) || 90;
      return Math.max(MIN_GLIDE, (distance / speed) * 1000) * share * pace;
    };
    // Where the text is now, from 0 (its start) to 1 (its end in view)
    const position = () => {
      if (!distance || !root.classList.contains('is-moving')) return 0;
      const x = new DOMMatrixReadOnly(getComputedStyle(text).transform).m41;
      return Math.min(1, Math.max(0, -x / distance));
    };
    const stop = () => {
      moves.forEach((move) => move.cancel());
      moves = [];
    };
    // The text and the soft edges move together: the left edge fades in as the start leaves
    const run = (keys, options) => {
      stop();
      const at = (key, value) => ({ offset: key.offset, easing: key.easing || 'linear', ...value });
      moves = [
        text.animate(keys.map((key) => at(key, { transform: `translateX(${(-key.to * distance).toFixed(2)}px)` })), options),
        root.animate(keys.map((key) => at(key, { [MASK]: `${(100 - 100 * key.to).toFixed(2)}% 0` })), options),
      ];
      return moves[0].finished;
    };

    // While it is hovered: to the end, wait, back to the start, wait, and again
    const loop = () => {
      const glide = glideTime(1);
      const cycle = HOLD_END + glide + HOLD_START + glide;
      run([
        { to: 1, offset: 0 },
        { to: 1, offset: HOLD_END / cycle, easing: GLIDE },
        { to: 0, offset: (HOLD_END + glide) / cycle },
        { to: 0, offset: (HOLD_END + glide + HOLD_START) / cycle, easing: GLIDE },
        { to: 1, offset: 1 },
      ], { duration: cycle, iterations: Infinity });
    };
    const start = () => {
      const from = position();
      if (!from && !measure()) return;
      run([{ to: from, easing: GLIDE }, { to: 1 }], { duration: glideTime(1 - from), fill: 'forwards' }).then(loop, () => {});
    };
    const back = () => {
      if (!root.classList.contains('is-moving')) return;
      const from = position();
      run([{ to: from, easing: GLIDE }, { to: 0 }], { duration: glideTime(from), fill: 'forwards' }).then(() => {
        stop();
        root.classList.remove('is-moving');
      }, () => {});
    };

    // Still: nothing moves, the browser's tooltip gives the whole title
    let titled = false;
    const update = () => {
      clearTimeout(timer);
      const on = hovered || focused;
      if (still) {
        if (on && !root.title && text.scrollWidth > text.clientWidth + 1) {
          root.title = text.textContent.trim();
          titled = true;
        }
        return;
      }
      if (on) timer = setTimeout(start, focused ? 0 : INTENT);
      else back();
    };

    // A finger taps through: only a mouse or a pen starts it, and the keyboard
    host.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'touch') return;
      hovered = true;
      update();
    }, { signal });
    host.addEventListener('pointerleave', () => {
      if (!hovered) return;
      hovered = false;
      update();
    }, { signal });
    host.addEventListener('focusin', () => {
      if (!host.matches(':focus-visible') && !host.querySelector(':focus-visible')) return;
      focused = true;
      update();
    }, { signal });
    host.addEventListener('focusout', (event) => {
      if (host.contains(event.relatedTarget)) return;
      focused = false;
      update();
    }, { signal });

    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      stop();
      if (titled) root.removeAttribute('title');
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
