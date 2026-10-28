// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Fullscreen Slider
// Curtain transitions between full-bleed slides: the next one wipes in from an edge while
// the current one is pushed out by the same edge, each image drifting inside its own
// frame. Buttons, arrow keys (when the slider has focus or the pointer) and swipe.
(() => {
  const SELECTOR = '.kodza-slider';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = (n) => String(n).padStart(2, '0');

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const slides = [...root.querySelectorAll('.kodza-slider__slide')];
    const count = root.querySelector('.kodza-slider__count b');
    if (slides.length < 2) return;
    const vertical = root.dataset.direction === 'vertical';
    const style = getComputedStyle(root);
    const duration = reduceMotion ? 0 : parseFloat(style.getPropertyValue('--kz-slider-duration')) * 1000 || 1000;
    const ease = style.getPropertyValue('--kz-slider-ease').trim() || 'ease';
    let current = 0;
    let busy = false;

    // Caption lines get their own mask, so they can rise into place
    slides.forEach((slide) => {
      slide.querySelectorAll('.kodza-slider__title, .kodza-slider__text').forEach((el) => {
        const line = document.createElement('span');
        line.className = 'kodza-slider__line';
        line.append(...el.childNodes);
        el.append(line);
      });
    });
    slides[0].classList.add('is-current');
    root.classList.add('is-ready');

    // Clip-path insets for each edge: [top, right, bottom, left]
    const inset = (side, amount) => {
      const v = ['0', '0', '0', '0'];
      v[side] = amount;
      return `inset(${v.join(' ')})`;
    };

    async function go(dir) {
      if (busy) return;
      busy = true;
      const from = slides[current];
      current = (current + dir + slides.length) % slides.length;
      const to = slides[current];
      const img = to.querySelector('img');
      img.loading = 'eager';
      await img.decode().catch(() => {});

      // Forward: the new slide comes from the right (or the bottom) and the old one leaves by the left (or the top)
      const enterSide = vertical ? (dir > 0 ? 0 : 2) : dir > 0 ? 3 : 1;
      const leaveSide = vertical ? (dir > 0 ? 2 : 0) : dir > 0 ? 1 : 3;
      const axis = vertical ? 'Y' : 'X';
      const timing = { duration, easing: ease, fill: 'forwards' };

      from.classList.replace('is-current', 'is-leaving');
      to.classList.add('is-current');
      to.style.zIndex = 1;
      from.style.zIndex = 0;
      if (count) count.textContent = pad(current + 1);

      const wipeIn = to.animate([{ clipPath: inset(enterSide, '100%') }, { clipPath: inset(enterSide, '0%') }], timing);
      to.querySelector('img').animate([{ transform: `translate${axis}(${dir * 14}%) scale(1.1)` }, { transform: 'none' }], timing);
      from.animate([{ clipPath: inset(leaveSide, '0%') }, { clipPath: inset(leaveSide, '100%') }], timing);
      from.querySelector('img').animate([{ transform: 'none' }, { transform: `translate${axis}(${-dir * 18}%)` }], timing);
      to.querySelectorAll('.kodza-slider__line').forEach((line, i) => {
        line.animate([{ transform: 'translateY(105%)' }, { transform: 'none' }], {
          duration: duration * 0.8,
          delay: duration * 0.45 + i * 90,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'backwards',
        });
      });

      await wipeIn.finished.catch(() => {});
      from.classList.remove('is-leaving');
      [from, to].forEach((slide) => {
        slide.getAnimations({ subtree: true }).forEach((a) => a.cancel());
        slide.style.zIndex = '';
      });
      busy = false;
    }

    root.querySelectorAll('.kodza-slider__nav button').forEach((button) =>
      button.addEventListener('click', () => go(Number(button.dataset.dir)), { signal })
    );

    // Arrow keys work while the pointer is over the slider or the focus is inside it
    let pointerInside = false;
    root.addEventListener('pointerenter', () => (pointerInside = true), { signal });
    root.addEventListener('pointerleave', () => (pointerInside = false), { signal });
    document.addEventListener('keydown', (event) => {
      if (!pointerInside && !root.contains(document.activeElement)) return;
      const next = vertical ? 'ArrowDown' : 'ArrowRight';
      const prev = vertical ? 'ArrowUp' : 'ArrowLeft';
      if (event.key === next || event.key === prev) {
        event.preventDefault();
        go(event.key === next ? 1 : -1);
      }
    }, { signal });

    // Swipe along the slider's own direction
    let start = null;
    root.addEventListener('pointerdown', (event) => (start = { x: event.clientX, y: event.clientY }), { signal });
    root.addEventListener('pointerup', (event) => {
      if (!start) return;
      const delta = vertical ? event.clientY - start.y : event.clientX - start.x;
      start = null;
      if (Math.abs(delta) > 50) go(delta < 0 ? 1 : -1);
    }, { signal });
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
