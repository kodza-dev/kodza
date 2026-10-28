// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Star Rating
// Lights the stars up to the one under the pointer (or the checked one), rolls the word, and
// makes the stars pop in a wave when you pick. The static version fills and counts up to its
// score the first time it comes into view.
(() => {
  const SELECTOR = '.kodza-rating';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';

  const roll = (box, text, chosen, dir = 1) => {
    const prev = box.lastElementChild;
    if (prev && prev.textContent === text && prev.classList.contains('is-chosen') === chosen) return;
    const span = Object.assign(document.createElement('span'), { textContent: text });
    span.classList.toggle('is-chosen', chosen);
    box.append(span);
    if (!prev) return;
    if (reduceMotion || prev.textContent === text) return prev.remove();
    const timing = { duration: 320, easing: ease };
    prev.animate([{ transform: 'none' }, { transform: `translateY(${dir * -110}%)` }], { ...timing, fill: 'forwards' }).finished.then(() => prev.remove());
    span.animate([{ transform: `translateY(${dir * 110}%)` }, { transform: 'none' }], timing);
  };

  // The interactive stars
  function mountStars(root, signal) {
    const stars = [...root.querySelectorAll('.kodza-rating__input')];
    const word = root.querySelector('.kodza-rating__word');
    if (!stars.length) return;
    const words = stars.map((star) => (star.getAttribute('aria-label') || '').split(':').pop().trim());
    const idle = word?.textContent.trim() || '';
    stars.forEach((star, i) => star.style.setProperty('--i', i));
    let shown = 0;

    const light = (count, preview) => {
      const chosen = stars.findIndex((star) => star.checked) + 1;
      stars.forEach((star, i) => {
        star.classList.toggle('is-lit', i < (preview ? Math.min(count, chosen) : count));
        star.classList.toggle('is-preview', preview && i < count);
      });
      if (word) roll(word, count ? words[count - 1] : idle, !preview && count > 0, count >= shown ? 1 : -1);
      shown = count;
    };
    const rest = () => light(stars.findIndex((star) => star.checked) + 1, false);

    stars.forEach((star, i) => {
      star.addEventListener('pointerenter', () => light(i + 1, true), { signal });
      star.addEventListener('change', () => {
        light(i + 1, false);
        if (reduceMotion) return;
        stars.slice(0, i + 1).forEach((s, k) => s.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.28)' }, { transform: 'scale(1)' }], { duration: 380, delay: k * 45, easing: ease }));
      }, { signal });
    });
    root.querySelector('.kodza-rating__stars')?.addEventListener('pointerleave', rest, { signal });
    rest();
  }

  // The static score fills and counts up once, when it comes into view
  function mountScore(root, signal) {
    const score = parseFloat(getComputedStyle(root).getPropertyValue('--kz-score')) || 0;
    const number = root.querySelector('.kodza-rating__score');
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    root.classList.add('is-armed');
    if (number) number.textContent = '0.0';
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      root.classList.add('is-in');
      const start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / 1100);
        if (number) number.textContent = (score * (1 - Math.pow(1 - t, 3))).toFixed(1);
        if (t < 1 && !signal.aborted) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.6 });
    io.observe(root);
    signal.addEventListener('abort', () => io.disconnect());
  }

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    if (root.classList.contains('kodza-rating--static')) mountScore(root, signal);
    else mountStars(root, signal);
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
