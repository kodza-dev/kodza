// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Horizontal Scroll
// Gives the section the height it needs (its sideways distance plus a screen), then maps the
// vertical scroll onto the track: position, drift of each picture, counter and bar. Tabbing
// to a card brings the page to it. On touch screens (or narrow ones) it becomes a plain
// sideways swipe instead.
(() => {
  const SELECTOR = '.kodza-hscroll';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const swipe = window.matchMedia('(hover: none), (max-width: 760px)');
  const pad = (n) => String(n).padStart(2, '0');

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const viewport = root.querySelector('.kodza-hscroll__viewport');
    const track = root.querySelector('.kodza-hscroll__track');
    const items = [...root.querySelectorAll('.kodza-hscroll__item')];
    const num = root.querySelector('.kodza-hscroll__num');
    const total = root.querySelector('.kodza-hscroll__total');
    if (!viewport || !track || !items.length) return;
    if (total) total.textContent = `/ ${pad(items.length)}`;
    if (num) num.replaceChildren(Object.assign(document.createElement('span'), { textContent: pad(1) }));

    let distance = 0;
    let index = -1;

    // The counter rolls: up going forward, down going back
    const roll = (next) => {
      if (next === index) return;
      const dir = next > index ? 1 : -1;
      const first = index < 0;
      index = next;
      if (!num || first) return;
      const prev = num.lastElementChild;
      const span = document.createElement('span');
      span.textContent = pad(next + 1);
      num.append(span);
      if (reduceMotion) return prev.remove();
      const timing = { duration: 450, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
      prev.animate([{ transform: 'none' }, { transform: `translateY(${dir * -110}%)` }], { ...timing, fill: 'forwards' }).finished.then(() => prev.remove());
      span.animate([{ transform: `translateY(${dir * 110}%)` }, { transform: 'none' }], timing);
    };

    const update = () => {
      const swiping = root.classList.contains('is-swipe');
      const x = swiping ? viewport.scrollLeft : Math.min(distance, Math.max(0, -root.getBoundingClientRect().top));
      const progress = distance > 0 ? x / distance : 0;
      if (!swiping) root.style.setProperty('--kz-hscroll-x', x.toFixed(1));
      root.style.setProperty('--kz-hscroll-progress', progress.toFixed(4));
      // Each picture drifts against the track, by its distance to the middle of the screen
      const middle = innerWidth / 2;
      items.forEach((item) => {
        const box = item.getBoundingClientRect();
        const drift = Math.max(-1, Math.min(1, (box.left + box.width / 2 - middle) / innerWidth));
        item.style.setProperty('--kz-drift', reduceMotion ? 0 : (-drift).toFixed(3));
      });
      roll(Math.min(items.length - 1, Math.round(progress * (items.length - 1))));
    };

    const measure = () => {
      root.classList.toggle('is-swipe', swipe.matches);
      if (swipe.matches) {
        root.style.removeProperty('--kz-hscroll-height');
        distance = viewport.scrollWidth - viewport.clientWidth;
      } else {
        distance = Math.max(0, track.scrollWidth - innerWidth);
        root.style.setProperty('--kz-hscroll-height', `${distance + innerHeight}px`);
      }
      update();
    };

    // A card reached with the keyboard is brought into view
    track.addEventListener('focusin', (event) => {
      if (root.classList.contains('is-swipe')) return;
      const item = event.target.closest('.kodza-hscroll__item');
      if (!item) return;
      const target = Math.min(distance, Math.max(0, item.offsetLeft - (innerWidth - item.offsetWidth) / 2));
      window.scrollTo({ top: root.getBoundingClientRect().top + window.scrollY + target, behavior: reduceMotion ? 'auto' : 'smooth' });
    }, { signal });

    let ticking = false;
    const queue = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (signal.aborted) return;
        ticking = false;
        update();
      });
    };
    window.addEventListener('scroll', queue, { passive: true, signal });
    viewport.addEventListener('scroll', queue, { passive: true, signal });
    window.addEventListener('resize', measure, { signal });
    swipe.addEventListener?.('change', measure, { signal });
    track.querySelectorAll('img').forEach((img) => img.complete || img.addEventListener('load', measure, { once: true, signal }));
    measure();
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
