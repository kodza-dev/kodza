// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Sticky Steps
// Watches which step crosses the middle of the screen (lower down on small screens), draws
// its picture over the previous one in the direction of travel, rolls the counter and fills
// the bars. Fires "kodza:step" with { step } (0-based) on the section.
(() => {
  const SELECTOR = '.kodza-steps';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = window.matchMedia('(max-width: 860px)');
  const pad = (n) => String(n).padStart(2, '0');

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const steps = [...root.querySelectorAll('.kodza-steps__step')];
    const images = [...root.querySelectorAll('.kodza-steps__image')];
    const num = root.querySelector('.kodza-steps__num');
    const total = root.querySelector('.kodza-steps__total');
    const barsBox = root.querySelector('.kodza-steps__bars');
    if (!steps.length) return;
    const style = getComputedStyle(root);
    const duration = reduceMotion ? 0 : parseFloat(style.getPropertyValue('--kz-steps-duration')) * 1000 || 1000;

    if (total) total.textContent = `/ ${pad(steps.length)}`;
    const bars = steps.map(() => {
      const bar = document.createElement('span');
      bar.className = 'kodza-steps__bar';
      barsBox?.append(bar);
      return bar;
    });
    if (num) num.replaceChildren(Object.assign(document.createElement('span'), { textContent: pad(1) }));

    // The counter: the old number leaves upwards (or downwards going back), the new one arrives
    const roll = (text, dir) => {
      if (!num) return;
      const prev = num.lastElementChild;
      if (prev.textContent === text) return;
      const span = document.createElement('span');
      span.textContent = text;
      num.append(span);
      if (!duration) return prev.remove();
      const timing = { duration: duration * 0.7, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
      prev.animate([{ transform: 'none' }, { transform: `translateY(${dir * -110}%)` }], { ...timing, fill: 'forwards' }).finished.then(() => prev.remove());
      span.animate([{ transform: `translateY(${dir * 110}%)` }, { transform: 'none' }], timing);
    };

    let current = -1;
    let timer = 0;
    const activate = (index) => {
      if (index === current || index < 0) return;
      const dir = index > current ? 1 : -1;
      root.style.setProperty('--kz-steps-dir', dir);
      steps.forEach((step, i) => {
        step.classList.toggle('is-active', i === index);
        if (i === index) step.setAttribute('aria-current', 'step');
        else step.removeAttribute('aria-current');
      });
      bars.forEach((bar, i) => bar.classList.toggle('is-on', i <= index));

      // The new picture starts behind its curtain on the side we come from, then draws over
      const next = images[index];
      const prev = images[current];
      if (next && next !== prev) {
        images.forEach((image) => image !== prev && image !== next && image.classList.remove('is-active', 'is-leaving'));
        next.classList.remove('is-active', 'is-leaving');
        next.style.setProperty('--kz-from-top', dir > 0 ? '100%' : '0%');
        next.style.setProperty('--kz-from-bottom', dir > 0 ? '0%' : '100%');
        void next.offsetWidth;
        if (prev) {
          prev.classList.remove('is-active');
          prev.classList.add('is-leaving');
        }
        next.classList.add('is-active');
        clearTimeout(timer);
        timer = setTimeout(() => prev?.classList.remove('is-leaving'), duration);
      }
      if (current >= 0) roll(pad(index + 1), dir);
      current = index;
      root.dispatchEvent(new CustomEvent('kodza:step', { detail: { step: index }, bubbles: true }));
    };

    // The step crossing a line across the screen: the middle, or lower on small screens
    let observer;
    const watch = () => {
      observer?.disconnect();
      const margin = small.matches ? '-70% 0px -29% 0px' : '-50% 0px -49% 0px';
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => entry.isIntersecting && activate(steps.indexOf(entry.target)));
      }, { rootMargin: margin });
      steps.forEach((step) => observer.observe(step));
    };
    small.addEventListener?.('change', watch, { signal });
    watch();
    signal.addEventListener('abort', () => observer.disconnect());

    activate(0);
    requestAnimationFrame(() => !signal.aborted && root.classList.add('is-live'));
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
