// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Lightbox
// Turns each picture of the content into a button, and opens a <dialog> where the picture
// grows from its own place to fit the screen (the sharper data-full swaps in once loaded).
// Arrows, buttons or a swipe move to the next one; Escape, a click, a scroll or a swipe down
// send it back to its place. Screen readers hear the caption and "2 of 3".
(() => {
  const SELECTOR = '.kodza-lightbox';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const icon = (d) => `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="${d}"/></svg>`;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const triggers = [...root.querySelectorAll('img')]
      .filter((img) => !img.closest('a, button') && !img.hasAttribute('data-no-lightbox'))
      .map((img) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'kodza-lightbox__trigger';
        button.setAttribute('aria-label', `Enlarge: ${img.alt || 'picture'}`);
        img.replaceWith(button);
        button.append(img);
        return button;
      });
    if (!triggers.length) return;

    // The viewer
    const viewer = document.createElement('dialog');
    viewer.className = 'kodza-lightbox__viewer';
    viewer.setAttribute('aria-label', 'Picture viewer');
    viewer.innerHTML = `<div class="kodza-lightbox__shade"></div>
      <div class="kodza-lightbox__bar">
        <p class="kodza-lightbox__caption" aria-live="polite"><span></span></p>
        <div class="kodza-lightbox__nav">
          <span class="kodza-lightbox__count" aria-hidden="true"><span></span></span>
          <button class="kodza-lightbox__button" type="button" data-step="-1" aria-label="Previous picture">${icon('M10 3.5 5.5 8l4.5 4.5')}</button>
          <button class="kodza-lightbox__button" type="button" data-step="1" aria-label="Next picture">${icon('M6 3.5 10.5 8 6 12.5')}</button>
        </div>
      </div>
      <button class="kodza-lightbox__button kodza-lightbox__close" type="button" aria-label="Close">${icon('M4 4l8 8M12 4l-8 8')}</button>`;
    root.append(viewer);
    viewer.classList.toggle('is-single', triggers.length < 2);
    const shade = viewer.querySelector('.kodza-lightbox__shade');
    const bar = viewer.querySelector('.kodza-lightbox__bar');
    const close = viewer.querySelector('.kodza-lightbox__close');
    const caption = viewer.querySelector('.kodza-lightbox__caption');
    const count = viewer.querySelector('.kodza-lightbox__count');
    let index = 0;
    let image = null;
    let closing = false;
    let opened = 0;
    let wheeled = 0;

    const textOf = (i) => {
      const img = triggers[i].querySelector('img');
      return img.closest('figure')?.querySelector('figcaption')?.textContent.trim() || img.alt || '';
    };

    // Where the picture fits on screen: room kept for the close button above and the bar below
    const fit = (img) => {
      const ratio = (img.naturalWidth || img.width) / (img.naturalHeight || img.height) || 1;
      const above = 68;
      const below = 84;
      const w = innerWidth - 48;
      const h = innerHeight - above - below;
      const width = Math.min(w, h * ratio);
      const height = width / ratio;
      return { left: (innerWidth - width) / 2, top: above + (h - height) / 2, width, height };
    };
    const place = (el, box) => Object.assign(el.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });
    // The transform that puts a box of the screen onto a picture of the article
    const from = (box, rect) => `translate(${rect.left - box.left}px, ${rect.top - box.top}px) scale(${rect.width / box.width}, ${rect.height / box.height})`;

    // A word that rolls: the old one up, the new one from below (or the other way)
    const roll = (el, text, dir) => {
      const old = el.lastElementChild;
      if (old.textContent === text) return;
      // On opening (no direction) or without motion, the word simply changes in place
      if (reduceMotion || !dir) {
        old.textContent = text;
        return;
      }
      const next = Object.assign(document.createElement('span'), { textContent: text });
      el.append(next);
      const timing = { duration: 420, easing: ease };
      old.animate([{ transform: 'none', opacity: 1 }, { transform: `translateY(${-dir * 100}%)`, opacity: 0 }], { ...timing, fill: 'forwards' }).finished.then(() => old.remove());
      next.animate([{ transform: `translateY(${dir * 100}%)`, opacity: 0 }, { transform: 'none', opacity: 1 }], timing);
    };
    const label = (dir) => {
      roll(caption, textOf(index), dir);
      roll(count, `${index + 1} / ${triggers.length}`, dir);
    };

    const make = (i) => {
      const source = triggers[i].querySelector('img');
      const img = new Image();
      img.className = 'kodza-lightbox__image';
      img.alt = source.alt;
      img.src = source.currentSrc || source.src;
      img.width = source.naturalWidth || source.width;
      img.height = source.naturalHeight || source.height;
      const full = source.dataset.full;
      if (full) {
        const sharp = new Image();
        sharp.onload = () => (img.src = full);
        sharp.src = full;
      }
      return img;
    };

    // Fades that stayed at their end (fill forwards) after a close are let go before reopening
    const settle = () => [shade, bar, close].forEach((el) => el.getAnimations().forEach((animation) => animation.cancel()));

    const open = (i) => {
      wheeled = 0;
      index = i;
      closing = false;
      opened = Date.now();
      settle();
      image = make(i);
      const box = fit(image);
      place(image, box);
      shade.after(image);
      viewer.showModal();
      triggers[i].classList.add('is-away');
      label(0);
      if (reduceMotion) return;
      const rect = triggers[i].querySelector('img').getBoundingClientRect();
      image.animate([{ transform: from(box, rect), borderRadius: '12px' }, { transform: 'none', borderRadius: '6px' }], { duration: 620, easing: ease });
      shade.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: 'ease' });
      [bar, close].forEach((el) => el.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 480, delay: 200, easing: ease, fill: 'backwards' }));
    };

    const shut = () => {
      if (closing || !viewer.open) return;
      closing = true;
      const trigger = triggers[index];
      const done = () => {
        trigger.classList.remove('is-away');
        image?.remove();
        image = null;
        viewer.close();
        settle();
      };
      if (reduceMotion) return done();
      const box = image.getBoundingClientRect();
      const rect = trigger.querySelector('img').getBoundingClientRect();
      const seen = rect.bottom > 0 && rect.top < innerHeight;
      // Back to its place if that place is on screen; otherwise it simply fades
      image.animate(seen
        ? [{ transform: getComputedStyle(image).transform === 'none' ? 'none' : getComputedStyle(image).transform }, { transform: from(box, rect), borderRadius: '12px' }]
        : [{ opacity: 1 }, { opacity: 0, transform: 'scale(0.96)' }], { duration: 520, easing: ease, fill: 'forwards' }).onfinish = done;
      shade.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, easing: 'ease', fill: 'forwards' });
      [bar, close].forEach((el) => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }));
    };

    const go = (step) => {
      if (closing || triggers.length < 2) return;
      const old = image;
      triggers[index].classList.remove('is-away');
      index = (index + step + triggers.length) % triggers.length;
      triggers[index].classList.add('is-away');
      image = make(index);
      place(image, fit(image));
      old.after(image);
      label(step);
      if (reduceMotion) return old.remove();
      // A push: both move together by one screen, so they never cross
      const push = { duration: 680, easing: 'cubic-bezier(0.76, 0, 0.24, 1)' };
      old.getAnimations().forEach((animation) => animation.cancel());
      old.animate([{ transform: 'none' }, { transform: `translateX(${-step * innerWidth}px)` }], { ...push, fill: 'forwards' }).onfinish = () => old.remove();
      image.animate([{ transform: `translateX(${step * innerWidth}px)` }, { transform: 'none' }], push);
    };

    triggers.forEach((trigger, i) => trigger.addEventListener('click', () => open(i), { signal }));
    viewer.querySelectorAll('[data-step]').forEach((button) => button.addEventListener('click', () => go(Number(button.dataset.step)), { signal }));
    close.addEventListener('click', shut, { signal });
    shade.addEventListener('click', shut, { signal });
    viewer.addEventListener('cancel', (event) => {
      event.preventDefault();
      shut();
    }, { signal });
    viewer.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') go(1);
      if (event.key === 'ArrowLeft') go(-1);
    }, { signal });
    // A scroll closes it, but the page does not move underneath, and the end of the scroll that
    // brought the reader here (trackpad inertia) does not close it again at once
    viewer.addEventListener('wheel', (event) => {
      event.preventDefault();
      if (Date.now() - opened < 600) return;
      wheeled += Math.abs(event.deltaY) + Math.abs(event.deltaX);
      if (wheeled > 40) {
        wheeled = 0;
        shut();
      }
    }, { passive: false, signal });
    viewer.addEventListener('touchmove', (event) => event.preventDefault(), { passive: false, signal });

    // A swipe: sideways for the next one, down to close; a tap closes
    let start = null;
    viewer.addEventListener('pointerdown', (event) => {
      if (event.target === image) start = { x: event.clientX, y: event.clientY };
    }, { signal });
    viewer.addEventListener('pointerup', (event) => {
      if (!start) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      start = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
      else if (dy > 80 || (Math.abs(dx) < 6 && Math.abs(dy) < 6)) shut();
    }, { signal });
    addEventListener('resize', () => image && !closing && place(image, fit(image)), { signal });

    // Stopped while open (or closing): the viewer closes at once
    signal.addEventListener('abort', () => viewer.open && viewer.close());
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
