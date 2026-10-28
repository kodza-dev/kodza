// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Skeleton
// Draws the bones from the content (one bar per line of text, one block per data-bone="block"),
// in the skeleton's own pixels so a scaled parent does not shift them, and redraws them when the
// size changes. When data-loading goes, the bones open in reading order: each bar swells to the
// height of its line and pulls away to the right, uncovering the words; a block lifts off its
// image, which settles from a slight zoom; an avatar pops. An image still on its way keeps its
// bone until it has loaded. Set data-loading again to go back to the bones.
(() => {
  const SELECTOR = '.kodza-skeleton';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STEP = 70; // between two bones, in reading order
  const SWELL = 220; // a bar swells to the height of its line
  const PULL = 420; // then pulls away to the right
  const inOut = 'cubic-bezier(0.76, 0, 0.24, 1)';
  const out = 'cubic-bezier(0.22, 1, 0.36, 1)';

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const parts = [...root.querySelectorAll('[data-bone]')];
    if (!parts.length) return;
    const layer = Object.assign(document.createElement('span'), { className: 'kodza-skeleton__bones' });
    layer.setAttribute('aria-hidden', 'true');
    root.append(layer);
    const bones = new Map(); // part → its bars

    const unloaded = (part) => [...(part.matches('img') ? [part] : part.querySelectorAll('img'))].some((img) => !img.complete || !img.naturalWidth);

    // One bar per line of text (a little thinner than the line), or the part's own box
    const draw = () => {
      layer.replaceChildren();
      bones.clear();
      const box = root.getBoundingClientRect();
      const k = box.width / root.offsetWidth || 1;
      root.style.setProperty('--kz-skel-w', `${root.offsetWidth}px`);
      root.style.setProperty('--kz-skel-band', `${Math.round(root.offsetWidth * 0.45)}px`);
      parts.forEach((part) => {
        if (!root.hasAttribute('data-loading') && !part.classList.contains('is-waiting')) return;
        const block = part.dataset.bone === 'block' || !part.textContent.trim();
        let rects;
        if (block) rects = [part.getBoundingClientRect()];
        else {
          const range = document.createRange();
          range.selectNodeContents(part);
          rects = [...range.getClientRects()].filter((r) => r.width > 1);
        }
        const radius = block ? getComputedStyle(part).borderRadius : '';
        const bars = rects.map((r) => {
          const x = (r.left - box.left) / k;
          const w = r.width / k;
          const full = r.height / k;
          const h = full;
          const y = (r.top - box.top) / k;
          const bar = Object.assign(document.createElement('span'), { className: 'kodza-skeleton__bone' });
          Object.assign(bar.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
          if (block) bar.style.borderRadius = radius;
          else bar.classList.add('is-line');
          bar.style.setProperty('--kz-skel-x', `${x}px`);
          layer.append(bar);
          return { bar, y, h };
        });
        bones.set(part, bars);
      });
    };

    const reveal = (list) => {
      const box = root.getBoundingClientRect();
      const k = box.width / root.offsetWidth || 1;
      const top = (el) => el.getBoundingClientRect().top;
      let order = 0;
      [...list].sort((a, b) => top(a) - top(b)).forEach((part) => {
        part.classList.remove('is-waiting');
        const bars = bones.get(part) || [];
        bones.delete(part);
        if (reduceMotion) return bars.forEach(({ bar }) => bar.remove());
        const block = part.dataset.bone === 'block' || !part.textContent.trim();
        if (block) {
          const delay = order++ * STEP;
          const img = part.matches('img') ? part : part.querySelector('img');
          // The bone lifts off, quick at first so the image never shows as a thin line under
          // it; the image settles from a slight zoom, an avatar pops
          bars.forEach(({ bar }) => {
            bar.style.transformOrigin = img ? '50% 0' : '50% 50%';
            bar.animate([{ transform: 'none' }, { transform: img ? 'scaleY(0)' : 'scale(0)' }], { duration: img ? 650 : 420, delay, easing: img ? out : inOut, fill: 'forwards' }).onfinish = () => bar.remove();
          });
          if (img) img.animate([{ transform: 'scale(1.14)' }, { transform: 'none' }], { duration: 1300, delay, easing: out, fill: 'backwards' });
          else part.animate([{ transform: 'scale(0.4)', opacity: 0 }, { transform: 'scale(1.08)', opacity: 1, offset: 0.6 }, { transform: 'none', opacity: 1 }], { duration: 520, delay: delay + 140, easing: out, fill: 'backwards' });
          return;
        }
        // Each line: the bars of a part swell together to the height of the words, which show
        // only once every bar covers its line (no ascender or descender peeks out); then each
        // bar pulls away to the right, one line after the other
        const delay = order * STEP;
        order += bars.length;
        bars.forEach(({ bar }, i) => {
          const hold = SWELL + i * STEP;
          const duration = hold + PULL;
          bar.style.transformOrigin = '100% 50%';
          bar.animate([
            { transform: 'scale(1, 0.62)', easing: out },
            { transform: 'scale(1, 1)', offset: SWELL / duration },
            { transform: 'scale(1, 1)', offset: hold / duration, easing: inOut },
            { transform: 'scale(0, 1)' },
          ], { duration, delay, fill: 'forwards' }).onfinish = () => bar.remove();
        });
        if (bars.length) part.animate({ opacity: [0, 0] }, { duration: delay + SWELL });
      });
    };

    const finish = () => {
      root.removeAttribute('aria-busy');
      // Images still on their way keep their bones, and come in on their own
      const late = parts.filter(unloaded);
      late.forEach((part) => {
        part.classList.add('is-waiting');
        part.querySelectorAll('img').forEach((img) => img.addEventListener('load', () => {
          if (!root.hasAttribute('data-loading') && part.classList.contains('is-waiting') && !unloaded(part)) reveal([part]);
        }, { once: true, signal }));
      });
      reveal(parts.filter((part) => !late.includes(part)));
    };

    const start = () => {
      root.setAttribute('aria-busy', 'true');
      // Stop a reveal still playing, but not the fade of the content under the bones
      parts.forEach((part) => {
        part.getAnimations({ subtree: true }).forEach((animation) => animation instanceof CSSTransition || animation.cancel());
      });
      draw();
      if (!reduceMotion) layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease' });
    };

    if (root.hasAttribute('data-loading')) start();
    const mutations = new MutationObserver(() => (root.hasAttribute('data-loading') ? start() : finish()));
    mutations.observe(root, { attributes: true, attributeFilter: ['data-loading'] });
    const resize = new ResizeObserver(() => (root.hasAttribute('data-loading') || parts.some((part) => part.classList.contains('is-waiting'))) && draw());
    resize.observe(root);
    signal.addEventListener('abort', () => {
      mutations.disconnect();
      resize.disconnect();
    });
    document.fonts?.ready.then(() => !signal.aborted && root.hasAttribute('data-loading') && draw());
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
