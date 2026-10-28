// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Link Preview
// One card per paragraph (or per parent of the links): it opens above the link under the
// pointer, follows it with a little lag, and glides to the next link without closing, its
// picture cross-fading and its words rolling. Measured in the paragraph's own pixels, kept on
// screen. Opens on keyboard focus too; no card on touch screens.
(() => {
  const SELECTOR = '.kodza-link-preview';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const groups = new Map();

  const roll = (el, text, animate) => {
    const old = el.lastElementChild;
    if (old && old.textContent === text) return;
    const next = Object.assign(document.createElement('span'), { textContent: text });
    el.append(next);
    if (!old) return;
    if (!animate || reduceMotion) return old.remove();
    const timing = { duration: 460, easing: ease };
    old.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-100%)', opacity: 0 }], { ...timing, fill: 'forwards' }).finished.then(() => old.remove());
    next.animate([{ transform: 'translateY(100%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { ...timing, delay: 50, fill: 'backwards' });
  };

  const makeGroup = (group) => {
    const placed = getComputedStyle(group).position === 'static';
    if (placed) group.style.position = 'relative';
    const card = Object.assign(document.createElement('span'), { className: 'kodza-link-preview__card' });
    card.setAttribute('aria-hidden', 'true');
    card.innerHTML = '<span class="kodza-link-preview__body"><span class="kodza-link-preview__media"></span><span class="kodza-link-preview__title"></span><span class="kodza-link-preview__url"></span></span>';
    group.append(card);
    const media = card.querySelector('.kodza-link-preview__media');
    const title = card.querySelector('.kodza-link-preview__title');
    const url = card.querySelector('.kodza-link-preview__url');
    let current = null;
    let open = false;
    let shut = 0;
    let frame = 0;
    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    let links = 0;

    const fill = (link) => {
      const { previewImage, previewTitle = '', previewUrl = '' } = link.dataset;
      const animate = open && current && current !== link;
      if (previewImage && media.lastElementChild?.getAttribute('src') !== previewImage) {
        const img = Object.assign(document.createElement('img'), { src: previewImage, alt: '', decoding: 'async' });
        const old = [...media.children];
        media.append(img);
        if (animate && !reduceMotion) {
          img.animate([{ opacity: 0, transform: 'scale(1.08)' }, { opacity: 1, transform: 'none' }], { duration: 560, easing: ease });
          setTimeout(() => old.forEach((el) => el.remove()), 560);
        } else old.forEach((el) => el.remove());
      }
      roll(title, previewTitle, animate);
      roll(url, previewUrl, animate);
    };

    // Above the line of the link under the pointer, centred on it, kept on screen
    const aim = (link, clientX, clientY) => {
      const box = group.getBoundingClientRect();
      const k = box.width / group.offsetWidth || 1;
      const lines = [...link.getClientRects()];
      const line = lines.find((r) => clientY >= r.top && clientY <= r.bottom) || lines[0];
      const w = card.offsetWidth;
      const h = card.offsetHeight;
      const centre = ((clientX ?? line.left + line.width / 2) - box.left) / k;
      tx = Math.min((innerWidth - 12 - box.left) / k - w, Math.max((12 - box.left) / k, centre - w / 2));
      ty = (line.top - box.top) / k - h - 12;
    };
    const glide = () => {
      const k = reduceMotion ? 1 : 0.2;
      x += (tx - x) * k;
      y += (ty - y) * k;
      card.style.setProperty('--kz-preview-x', `${x.toFixed(1)}px`);
      card.style.setProperty('--kz-preview-y', `${y.toFixed(1)}px`);
      frame = Math.abs(tx - x) + Math.abs(ty - y) > 0.4 ? requestAnimationFrame(glide) : 0;
    };

    const show = (link, clientX, clientY) => {
      clearTimeout(shut);
      fill(link);
      aim(link, clientX, clientY);
      // Opening: right there, no slide from wherever it was last
      if (!open) {
        x = tx;
        y = ty;
        card.style.setProperty('--kz-preview-x', `${x}px`);
        card.style.setProperty('--kz-preview-y', `${y}px`);
      }
      current?.classList.remove('is-current');
      current = link;
      link.classList.add('is-current');
      open = true;
      card.classList.add('is-open');
      if (!frame) frame = requestAnimationFrame(glide);
    };
    const hide = (soon = true) => {
      clearTimeout(shut);
      shut = setTimeout(() => {
        open = false;
        card.classList.remove('is-open');
        current?.classList.remove('is-current');
        current = null;
      }, soon ? 140 : 0);
    };

    const add = (link, signal) => {
      links += 1;
      if (finePointer) {
        link.addEventListener('pointerenter', (event) => show(link, event.clientX, event.clientY), { signal });
        link.addEventListener('pointermove', (event) => {
          if (current !== link) return;
          aim(link, event.clientX, event.clientY);
          if (!frame) frame = requestAnimationFrame(glide);
        }, { signal });
        link.addEventListener('pointerleave', () => hide(), { signal });
      }
      link.addEventListener('focus', () => link.matches(':focus-visible') && show(link), { signal });
      link.addEventListener('blur', () => hide(false), { signal });
      link.addEventListener('keydown', (event) => event.key === 'Escape' && hide(false), { signal });
      // A link stopped: the card lets go of it, and leaves with the last one
      signal.addEventListener('abort', () => {
        if (current === link) {
          clearTimeout(shut);
          open = false;
          card.classList.remove('is-open');
          current = null;
        }
        links -= 1;
        if (links) return;
        clearTimeout(shut);
        cancelAnimationFrame(frame);
        card.remove();
        if (placed) group.style.position = '';
        groups.delete(group);
      });
    };
    return { add };
  };

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(link, signal) {
    if (!link.dataset.previewImage && !link.dataset.previewTitle) return;
    const group = link.closest('.kodza-link-preview-text') || link.parentElement;
    if (!groups.has(group)) groups.set(group, makeGroup(group));
    groups.get(group).add(link, signal);
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
