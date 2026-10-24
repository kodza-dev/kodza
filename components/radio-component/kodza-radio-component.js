// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Radio
// Adds the group's one dot and moves it to the checked ring: it travels along the line between
// the two rings and stretches in that direction on the way, then settles. Follows keyboard
// arrows as well as clicks, and resizes.
(() => {
  const SELECTOR = '.kodza-radio';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const inputs = [...root.querySelectorAll('.kodza-radio__input')];
    if (!inputs.length) return;
    const dot = document.createElement('span');
    dot.className = 'kodza-radio__dot';
    dot.setAttribute('aria-hidden', 'true');
    root.append(dot);
    const style = getComputedStyle(root);
    const duration = parseFloat(style.getPropertyValue('--kz-radio-duration')) * 1000 || 500;

    // Where the dot sits for a ring: measured from the dot's own resting place (a fieldset's
    // legend shifts what "top: 0" means, so the group's box cannot be trusted). Screen pixels are
    // divided by the group's scale, in case a parent is scaled with a transform.
    const origin = () => {
      dot.style.setProperty('--kz-dot-x', '0px');
      dot.style.setProperty('--kz-dot-y', '0px');
      const r = dot.getBoundingClientRect();
      return { x: r.left, y: r.top, scale: root.getBoundingClientRect().width / root.offsetWidth || 1 };
    };
    const spot = (input, o) => {
      const a = input.nextElementSibling.getBoundingClientRect();
      return { x: (a.left - o.x + a.width / 2) / o.scale - dot.offsetWidth / 2, y: (a.top - o.y + a.height / 2) / o.scale - dot.offsetHeight / 2 };
    };

    let current = null;
    const move = (animate) => {
      const checked = inputs.find((input) => input.checked);
      if (!checked) {
        dot.style.opacity = '0';
        current = null;
        return;
      }
      dot.getAnimations().forEach((animation) => animation.cancel());
      const o = origin();
      const to = spot(checked, o);
      dot.style.setProperty('--kz-dot-x', `${to.x}px`);
      dot.style.setProperty('--kz-dot-y', `${to.y}px`);
      if (animate && current && current !== checked && !reduceMotion) {
        const from = spot(current, o);
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const stretch = Math.min(4, 1 + Math.hypot(dx, dy) / 40);
        // The dot leaves, stretches along its path, and lands
        dot.animate([
          { transform: `translate(${from.x}px, ${from.y}px) rotate(${angle}deg) scaleX(1)` },
          { transform: `translate(${from.x + dx * 0.5}px, ${from.y + dy * 0.5}px) rotate(${angle}deg) scaleX(${stretch}) scaleY(0.7)`, offset: 0.45 },
          { transform: `translate(${to.x}px, ${to.y}px) rotate(${angle}deg) scaleX(0.85) scaleY(1.1)`, offset: 0.8 },
          { transform: `translate(${to.x}px, ${to.y}px) rotate(${angle}deg) scaleX(1)` },
        ], { duration, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' });
      } else if (animate && !current && !reduceMotion) {
        dot.animate([{ transform: `translate(${to.x}px, ${to.y}px) scale(0)` }, { transform: `translate(${to.x}px, ${to.y}px) scale(1)` }], { duration: 300, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });
      }
      dot.style.opacity = '1';
      current = checked;
    };

    inputs.forEach((input) => input.addEventListener('change', () => move(true), { signal }));
    const observer = new ResizeObserver(() => move(false));
    observer.observe(root);
    signal.addEventListener('abort', () => observer.disconnect());
    document.fonts?.ready.then(() => move(false));
    root.classList.add('is-ready');
    move(false);
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
