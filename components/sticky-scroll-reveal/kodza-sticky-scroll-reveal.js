// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Sticky Scroll Reveal
// Gives the block one scroll segment per statement, pins it, and shows the statement of the
// current segment: the statements before it wait above their masks, the ones after below, so
// lines always leave and arrive in the direction of the scroll. One statement per gesture:
// a big scroll never skips one. Lines are cut at the current width (again on resize).
// Fires "kodza:statement" with { index } on the block.
(() => {
  const SELECTOR = '.kodza-sticky-reveal';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = (n) => String(n).padStart(2, '0');

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const texts = [...root.querySelectorAll('.kodza-sticky-reveal__text')];
    const num = root.querySelector('.kodza-sticky-reveal__num');
    const total = root.querySelector('.kodza-sticky-reveal__total');
    if (!texts.length) return;
    const originals = texts.map((text) => text.textContent.trim());
    root.style.setProperty('--kz-sreveal-n', texts.length);
    if (total) total.textContent = `/ ${pad(texts.length)}`;
    if (num) num.replaceChildren(Object.assign(document.createElement('span'), { textContent: pad(1) }));

    // Cut each statement into lines, each in its own window
    const split = () => {
      texts.forEach((text, t) => {
        text.textContent = '';
        const spans = originals[t].split(/\s+/).map((word) => {
          const span = document.createElement('span');
          span.textContent = `${word} `;
          text.append(span);
          return span;
        });
        const lines = [];
        spans.forEach((span) => {
          const last = lines[lines.length - 1];
          if (last && Math.abs(last.top - span.offsetTop) < 2) last.words.push(span.textContent);
          else lines.push({ top: span.offsetTop, words: [span.textContent] });
        });
        text.textContent = '';
        lines.forEach((line, i) => {
          const outer = document.createElement('span');
          const inner = document.createElement('span');
          outer.className = 'kodza-sticky-reveal__line';
          inner.textContent = line.words.join('').trim();
          inner.style.setProperty('--kz-line', i);
          outer.append(inner);
          text.append(outer, ' ');
        });
      });
    };

    // The counter rolls with the direction of the scroll
    const roll = (value, dir) => {
      if (!num) return;
      const prev = num.lastElementChild;
      const span = Object.assign(document.createElement('span'), { textContent: value });
      num.append(span);
      if (reduceMotion) return prev.remove();
      const timing = { duration: 500, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
      prev.animate([{ transform: 'none' }, { transform: `translateY(${dir * -110}%)` }], { ...timing, fill: 'forwards' }).finished.then(() => prev.remove());
      span.animate([{ transform: `translateY(${dir * 110}%)` }, { transform: 'none' }], timing);
    };

    let current = -1;
    const show = (index) => {
      if (index === current) return;
      const dir = index > current ? 1 : -1;
      texts.forEach((text, i) => {
        text.classList.toggle('is-active', i === index);
        text.classList.toggle('is-above', i < index);
        text.setAttribute('aria-hidden', String(i !== index));
      });
      if (current >= 0) roll(pad(index + 1), dir);
      current = index;
      root.dispatchEvent(new CustomEvent('kodza:statement', { detail: { index }, bubbles: true }));
    };

    const update = () => {
      const box = root.getBoundingClientRect();
      const length = Math.max(1, box.height - innerHeight);
      const progress = Math.min(1, Math.max(0, -box.top / length));
      root.style.setProperty('--kz-sreveal-progress', progress.toFixed(4));
      show(Math.min(texts.length - 1, Math.floor(progress * texts.length)));
    };

    // One statement per gesture: while the block is pinned, a wheel flick, a swipe or a key
    // moves exactly one statement on, and the rest of the gesture (trackpad inertia) is absorbed.
    // On the first and last statements, the page simply scrolls on, out of the block.
    // data-step="false" turns this off and lets the scroll drive the statements freely.
    if (root.dataset.step !== 'false') {
      const pinned = () => {
        const box = root.getBoundingClientRect();
        return box.top <= 1 && box.bottom >= innerHeight - 1;
      };
      const goTo = (index) => {
        const top = root.getBoundingClientRect().top + window.scrollY;
        const length = Math.max(1, root.offsetHeight - innerHeight);
        window.scrollTo({ top: Math.round(top + (length * (index + 0.5)) / texts.length), behavior: 'instant' });
        update();
      };
      let lockedUntil = 0;
      let lastWheel = 0;
      let lastDelta = 0;
      const step = (dir) => {
        const target = current + dir;
        if (target < 0 || target >= texts.length) return false;
        lockedUntil = performance.now() + 700;
        goTo(target);
        return true;
      };

      let passing = false;
      window.addEventListener('wheel', (event) => {
        if (event.ctrlKey) return;
        const dir = Math.sign(event.deltaY);
        const now = performance.now();
        // A new push: after a pause, or clearly stronger than the fading inertia. Every wheel
        // event counts, so the momentum that carries the page into the block is not a new push.
        const fresh = now - lastWheel > 180 || Math.abs(event.deltaY) > lastDelta * 1.6 + 4;
        lastWheel = now;
        lastDelta = Math.abs(event.deltaY);
        if (fresh) passing = false;
        if (!dir || !pinned()) return;
        const inside = current + dir >= 0 && current + dir < texts.length;
        // Past the first or last statement, a new push leaves the block, momentum included
        if (!inside && (passing || (fresh && now > lockedUntil))) {
          passing = true;
          return;
        }
        event.preventDefault();
        if (fresh && now > lockedUntil) step(dir);
      }, { passive: false, signal });

      window.addEventListener('keydown', (event) => {
        if (!pinned() || event.target.closest?.('input, textarea, select, [contenteditable]')) return;
        const down = ['ArrowDown', 'PageDown'].includes(event.key) || (event.key === ' ' && !event.shiftKey);
        const up = ['ArrowUp', 'PageUp'].includes(event.key) || (event.key === ' ' && event.shiftKey);
        if ((down || up) && step(down ? 1 : -1)) event.preventDefault();
      }, { signal });

      let touchY = null;
      let touchDir = 0;
      root.addEventListener('touchstart', (event) => {
        touchY = event.touches[0].clientY;
        touchDir = 0;
      }, { passive: true, signal });
      root.addEventListener('touchmove', (event) => {
        if (touchY === null || !pinned()) return;
        const dy = touchY - event.touches[0].clientY;
        if (!touchDir && Math.abs(dy) > 6) touchDir = Math.sign(dy);
        const target = current + touchDir;
        if (touchDir && target >= 0 && target < texts.length) event.preventDefault();
      }, { passive: false, signal });
      root.addEventListener('touchend', (event) => {
        if (touchY !== null && touchDir && pinned() && Math.abs(touchY - event.changedTouches[0].clientY) > 30) step(touchDir);
        touchY = null;
      }, { passive: true, signal });
    }

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (signal.aborted) return;
        ticking = false;
        update();
      });
    }, { passive: true, signal });
    let width = innerWidth;
    window.addEventListener('resize', () => {
      if (innerWidth !== width) {
        width = innerWidth;
        split();
      }
      update();
    }, { signal });

    root.classList.add('is-ready');
    split();
    document.fonts?.ready.then(split);
    update();
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
