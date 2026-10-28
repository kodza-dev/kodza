// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Image Gallery
// Each [data-kodza-gallery] gets its own viewer. Open: the thumbnail grows into place.
// Navigate: a curtain wipe. Close: the image flies back to its thumbnail.
(() => {
  const SELECTOR = '[data-kodza-gallery]';
  // The page behind stays put while it is open: a wheel or a swipe only scrolls what can
  // scroll inside, under the pointer. Listening only while open costs nothing the rest of the time.
  const holdPage = (layer, signal) => {
    const inside = (target, x, y, dy) => {
      for (let el = target; el instanceof Element && layer.contains(el); el = el.parentElement) {
        const box = el.getBoundingClientRect();
        if (x < box.left || x > box.right || y < box.top || y > box.bottom) continue;
        if (!/(auto|scroll)/.test(getComputedStyle(el).overflowY) || el.scrollHeight <= el.clientHeight + 1) continue;
        if (dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return true;
      }
      return false;
    };
    let last = 0;
    const wheel = (event) => !inside(event.target, event.clientX, event.clientY, event.deltaY) && event.preventDefault();
    const touchstart = (event) => (last = event.touches[0].clientY);
    const touchmove = (event) => {
      const touch = event.touches[0];
      const dy = last - touch.clientY;
      last = touch.clientY;
      if (!inside(event.target, touch.clientX, touch.clientY, dy)) event.preventDefault();
    };
    const hold = (on) => {
      const method = on ? 'addEventListener' : 'removeEventListener';
      document[method]('wheel', wheel, { passive: false });
      document[method]('touchstart', touchstart, { passive: true });
      document[method]('touchmove', touchmove, { passive: false });
    };
    const observer = new MutationObserver(() => hold(layer.open));
    observer.observe(layer, { attributes: true, attributeFilter: ['open'] });
    // Stopped while open: the page is let go
    signal.addEventListener('abort', () => {
      observer.disconnect();
      hold(false);
    });
  };

  const ICONS = {
    close: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    prev: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    next: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = (n) => String(n).padStart(2, '0');

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const items = [...root.querySelectorAll('.kodza-gallery__item')].map((figure) => {
      const img = figure.querySelector('.kodza-gallery__img');
      return {
        button: figure.querySelector('.kodza-gallery__open'),
        img,
        full: img.dataset.full || img.currentSrc || img.src,
        title: figure.querySelector('.kodza-gallery__title')?.textContent.trim() || img.alt,
        meta: figure.querySelector('.kodza-gallery__meta')?.textContent.trim() || '',
      };
    });
    if (!items.length) return;

    // ---------- Viewer ----------
    const viewer = document.createElement('dialog');
    viewer.className = 'kodza-gallery__viewer';
    holdPage(viewer, signal);
    viewer.setAttribute('aria-label', 'Image viewer');
    viewer.innerHTML = `
      <div class="kodza-gallery__backdrop"></div>
      <div class="kodza-gallery__stage"></div>
      <div class="kodza-gallery__bar">
        <span class="kodza-gallery__count"><b>01</b> / ${pad(items.length)}</span>
        <button class="kodza-gallery__close" type="button">Close ${ICONS.close}</button>
      </div>
      <div class="kodza-gallery__info" aria-live="polite">
        <p class="kodza-gallery__info-title kodza-gallery__line"><span></span></p>
        <p class="kodza-gallery__info-meta kodza-gallery__line"><span></span></p>
      </div>
      <div class="kodza-gallery__nav">
        <button type="button" data-dir="-1" aria-label="Previous image">${ICONS.prev}</button>
        <button type="button" data-dir="1" aria-label="Next image">${ICONS.next}</button>
      </div>`;
    root.append(viewer);

    const $ = (sel) => viewer.querySelector(sel);
    const backdrop = $('.kodza-gallery__backdrop');
    const stage = $('.kodza-gallery__stage');
    const countEl = $('.kodza-gallery__count b');
    const lines = [...viewer.querySelectorAll('.kodza-gallery__line > span')];
    const chrome = [$('.kodza-gallery__bar'), $('.kodza-gallery__nav')];

    const style = getComputedStyle(root);
    const duration = reduceMotion ? 0 : parseFloat(style.getPropertyValue('--kz-gal-duration')) || 900;
    const ease = style.getPropertyValue('--kz-gal-ease').trim() || 'cubic-bezier(0.76, 0, 0.24, 1)';

    let current = 0;
    let frame = null;
    let busy = false;

    // ---------- Geometry ----------
    const ratioOf = (item) => (item.img.naturalWidth || item.img.width) / (item.img.naturalHeight || item.img.height) || 1.5;

    function fitRect(item) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const padX = Math.max(20, vw * 0.06);
      const top = 78;
      const bottom = vw < 720 ? 168 : 132;
      const maxW = vw - padX * 2;
      const maxH = vh - top - bottom;
      const ratio = ratioOf(item);
      let width = maxW;
      let height = width / ratio;
      if (height > maxH) {
        height = maxH;
        width = height * ratio;
      }
      return { left: (vw - width) / 2, top: top + (maxH - height) / 2, width, height };
    }

    const box = (r) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });

    function makeFrame(item) {
      const el = document.createElement('div');
      el.className = 'kodza-gallery__frame';
      const img = document.createElement('img');
      img.alt = item.img.alt;
      img.src = item.img.currentSrc || item.img.src;
      // The thumbnail shows instantly; the large file takes over once loaded
      if (item.full && item.full !== img.src) {
        const hi = new Image();
        hi.onload = () => (img.src = item.full);
        hi.src = item.full;
      }
      el.append(img);
      Object.assign(el.style, box(fitRect(item)));
      stage.append(el);
      return el;
    }

    // ---------- Caption ----------
    function setCaption(item, animate = true) {
      const values = [item.title, item.meta];
      countEl.textContent = pad(current + 1);
      lines.forEach((span, i) => {
        span.textContent = values[i];
        if (animate && duration) {
          span.animate(
            [{ transform: 'translateY(105%)' }, { transform: 'translateY(0)' }],
            { duration: duration * 0.8, delay: duration * 0.35 + i * 70, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' }
          );
        }
      });
    }

    // ---------- Open ----------
    async function open(index) {
      if (busy || viewer.open) return;
      busy = true;
      current = index;
      const item = items[index];
      frame = makeFrame(item);
      // Wait until the flying image is ready to paint, so the thumbnail never blinks
      await frame.firstChild.decode().catch(() => {});
      if (signal.aborted) return;
      const from = item.img.getBoundingClientRect();
      viewer.showModal();
      item.img.style.visibility = 'hidden';
      setCaption(item);

      const to = fitRect(item);
      const flight = frame.animate([box(from), box(to)], { duration, easing: ease });
      backdrop.animate([{ opacity: 0 }, { opacity: 1 }], { duration: duration * 0.7, easing: 'ease-out' });
      chrome.forEach((el) =>
        el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: duration * 0.6, delay: duration * 0.4, fill: 'backwards' })
      );
      flight.finished.then(() => (busy = false));
    }

    // ---------- Close ----------
    function close() {
      if (busy || !viewer.open) return;
      busy = true;
      const item = items[current];
      // The page behind cannot scroll, but we can bring the thumbnail into view for the landing
      const rect = item.img.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) item.button.scrollIntoView({ block: 'center' });
      const to = item.img.getBoundingClientRect();

      const flight = frame.animate([box(frame.getBoundingClientRect()), box(to)], { duration, easing: ease, fill: 'forwards' });
      backdrop.animate([{ opacity: 1 }, { opacity: 0 }], { duration: duration * 0.8, easing: 'ease-in', fill: 'forwards' });
      [...chrome, ...lines.map((l) => l.parentElement)].forEach((el) =>
        el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: duration * 0.3, fill: 'forwards' })
      );

      flight.finished.then(() => {
        if (signal.aborted) return;
        item.img.style.visibility = '';
        viewer.close();
        stage.replaceChildren();
        viewer.getAnimations({ subtree: true }).forEach((a) => a.cancel());
        item.button.focus({ preventScroll: true });
        frame = null;
        busy = false;
      });
    }

    // ---------- Navigate : curtain wipe ----------
    async function go(dir) {
      if (busy || !viewer.open || items.length < 2) return;
      busy = true;
      const prevItem = items[current];
      current = (current + dir + items.length) % items.length;
      const item = items[current];

      const old = frame;
      frame = makeFrame(item);
      frame.style.clipPath = dir > 0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)';
      await frame.firstChild.decode().catch(() => {});
      frame.style.clipPath = '';
      prevItem.img.style.visibility = '';
      item.img.style.visibility = 'hidden';
      // Push: the new image wipes in while the old one is wiped out by the same edge.
      // Each image only moves inside its own frame, so nothing spills outside.
      const speed = duration * 0.9;
      const timing = { duration: speed, easing: ease };
      const enter = dir > 0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)';
      const leave = dir > 0 ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)';
      const wipeIn = frame.animate([{ clipPath: enter }, { clipPath: 'inset(0 0 0 0)' }], timing);
      frame.firstChild.animate(
        [{ transform: `translateX(${dir * 12}%) scale(1.12)` }, { transform: 'none' }],
        timing
      );
      const wipeOut = old.animate([{ clipPath: 'inset(0 0 0 0)' }, { clipPath: leave }], { ...timing, fill: 'forwards' });
      old.firstChild.animate(
        [{ transform: 'none', opacity: 1 }, { transform: `translateX(${-dir * 18}%)`, opacity: 0.4 }],
        { ...timing, fill: 'forwards' }
      );
      lines.forEach((span) =>
        span.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-105%)' }], {
          duration: speed * 0.35,
          easing: 'ease-in',
        })
      );
      setTimeout(() => setCaption(item), speed * 0.3);
      Promise.all([wipeIn.finished, wipeOut.finished]).then(() => {
        old.remove();
        busy = false;
      });
    }

    // ---------- Events ----------
    items.forEach((item, i) => {
      item.button.addEventListener('click', () => open(i), { signal });
      // Warm the large file as soon as the visitor shows interest
      const warm = () => {
        if (item.full) new Image().src = item.full;
      };
      item.button.addEventListener('pointerenter', warm, { once: true, signal });
      item.button.addEventListener('focus', warm, { once: true, signal });
    });

    $('.kodza-gallery__close').addEventListener('click', close, { signal });
    viewer.querySelectorAll('.kodza-gallery__nav button').forEach((b) =>
      b.addEventListener('click', () => go(Number(b.dataset.dir)), { signal })
    );
    backdrop.addEventListener('click', close, { signal });
    viewer.addEventListener('cancel', (event) => {
      event.preventDefault();
      close();
    }, { signal });
    viewer.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') go(1);
      if (event.key === 'ArrowLeft') go(-1);
    }, { signal });

    // Swipe on touch screens
    let startX = null;
    viewer.addEventListener('pointerdown', (event) => (startX = event.clientX), { signal });
    viewer.addEventListener('pointerup', (event) => {
      if (startX === null) return;
      const dx = event.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    }, { signal });

    window.addEventListener('resize', () => {
      if (frame && !busy) Object.assign(frame.style, box(fitRect(items[current])));
    }, { signal });

    // Stopped while open: the viewer closes at once and the page scrolls again
    signal.addEventListener('abort', () => {
      if (!viewer.open) return;
      viewer.close();
    });
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
