// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Section Curve
// The section's top edge comes up curved and pulls flat as it lands: deepest while its top is
// low on the screen, flat once it has come up to TO, and it bends again when you scroll back up.
// A last section the page can't bring up that far (a footer) is flat at the bottom of the page.
// The edge follows the scroll with a little give, like cloth (GLIDE). Reduced motion, or the
// site's pace at 0: the curve stays as it is. The figures you can tune are the constants below;
// the colours and the depth of the curve are in the CSS.
(() => {
  const SELECTOR = '.kodza-section-curve';
  const FROM = 1; // the curve is at its deepest while the section's top is below this share of the screen…
  const TO = 0.2; // …and flat once its top is above this one
  const GLIDE = 0.16; // how much of the way the edge catches up with the scroll each frame
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, the frame stops on its 'abort' event),
  // so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    if (still) return;
    let target = 1; // how curved the edge should be where the page is now, 1 to 0…
    let shown = 1; // …and how curved it is
    let frame = 0;
    let last = 0;
    const measure = () => {
      const screen = window.innerHeight;
      const top = root.getBoundingClientRect().top;
      // Where its top stops once the page can't scroll any further: lower than TO, it lands there
      const page = document.documentElement;
      const end = top + window.scrollY - (page.scrollHeight - page.clientHeight);
      const span = Math.max(screen * FROM - Math.max(screen * TO, end), 1);
      const p = Math.min(Math.max((screen * FROM - top) / span, 0), 1);
      target = 1 - p * p * (3 - 2 * p); // it starts and ends softly
    };
    const render = () => root.style.setProperty('--kz-section-curve-k', shown.toFixed(4));
    // The edge catches up GLIDE of the way each 60th of a second (more slowly at a slower pace)
    const tick = (now) => {
      const dt = last ? Math.min(now - last, 64) : 1000 / 60;
      last = now;
      shown += (target - shown) * (1 - (1 - GLIDE) ** (dt / (1000 / 60) / pace));
      if (Math.abs(target - shown) < 0.0005) {
        shown = target;
        frame = 0;
        last = 0;
      } else frame = requestAnimationFrame(tick);
      render();
    };
    const follow = () => {
      measure();
      if (!frame) frame = requestAnimationFrame(tick);
    };
    window.addEventListener('scroll', follow, { passive: true, signal });
    window.addEventListener('resize', follow, { passive: true, signal });
    // The page above can still move once its images and fonts are in
    if (document.readyState !== 'complete') window.addEventListener('load', follow, { once: true, signal });
    document.fonts?.ready.then(() => signal.aborted || follow());
    signal.addEventListener('abort', () => cancelAnimationFrame(frame));
    // On load, the edge is already where the page puts it
    measure();
    shown = target;
    render();
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
