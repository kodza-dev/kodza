// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Reading Progress
// Finds the article (data-target, or the closest article / main / .entry-content), measures it,
// and fills the line from the moment its top reaches the header to the moment its end reaches the
// bottom of the screen. The line comes in with the article and leaves once it has gone by. The
// notches (data-headings, default h2) are cut where the fill meets each heading as it passes under
// the header. data-time adds the minutes left, which roll when they change. The look is in the
// --kz-reading-progress-* variables (component.css), the reading speed just below.
(() => {
  const SELECTOR = '[data-kodza-reading-progress]';
  const WORDS_PER_MINUTE = 230; // reading speed for the time left
  const ROLL = 380; // ms, a word of the time left rolling to the next (times pace)
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const timeline = window.CSS?.supports?.('animation-timeline: scroll()') ?? false;

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const bar = root.querySelector('.kodza-reading-progress__bar');
    if (!bar) return;
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', '100');
    bar.setAttribute('aria-valuenow', '0');
    const selector = root.dataset.target || 'article, main, .entry-content';
    // The article around the line, or the closest one beside it
    let article = root.closest(selector);
    for (let scope = root.parentElement; !article && scope; scope = scope.parentElement) article = scope.querySelector(selector);
    if (!article) return;
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: the line follows, nothing rolls
    const words = article.textContent.trim().split(/\s+/).length;

    // The time left: a pill under the line, each change rolling in from below
    let time = null;
    let cell = null;
    if (root.hasAttribute('data-time')) {
      time = document.createElement('span');
      time.className = 'kodza-reading-progress__time';
      time.setAttribute('aria-hidden', 'true');
      cell = document.createElement('span');
      cell.className = 'kodza-reading-progress__words';
      time.append(cell);
      root.append(time);
    }
    const format = root.dataset.time || '{n} min left';
    const done = root.dataset.done || 'Done';
    let said = '';
    const say = (text) => {
      if (text === said || !cell) return;
      const first = !said;
      said = text;
      const word = document.createElement('span');
      word.className = 'kodza-reading-progress__word';
      word.textContent = text;
      const old = [...cell.children].filter((el) => !el.classList.contains('is-leaving'));
      const from = cell.offsetWidth;
      cell.append(word);
      if (first || still || !time.offsetWidth) {
        old.forEach((el) => el.remove());
        return;
      }
      // the cell holds both while they cross: its width goes from the old word to the new one
      old.forEach((el) => el.classList.add('is-leaving'));
      const to = word.offsetWidth;
      const ms = ROLL * pace;
      const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
      cell.animate([{ width: `${from}px` }, { width: `${to}px` }], { duration: ms, easing: ease });
      word.animate([{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration: ms, easing: ease });
      old.forEach((el) => {
        el.animate([{ transform: 'none' }, { transform: 'translateY(-105%)' }], { duration: ms, easing: ease, fill: 'forwards' })
          .finished.then(() => el.remove(), () => {});
      });
    };

    // Geometry, measured once and again when the page or the article changes size
    let start = 0;
    let end = 1;
    let offset = 0;
    const measure = () => {
      offset = parseFloat(getComputedStyle(bar).top) || 0;
      const box = article.getBoundingClientRect();
      const top = box.top + scrollY;
      start = top - offset;
      end = Math.max(start + 1, top + box.height - innerHeight);
      if (timeline) {
        root.style.setProperty('--kz-reading-progress-start', `${start.toFixed(1)}px`);
        root.style.setProperty('--kz-reading-progress-end', `${end.toFixed(1)}px`);
      }
      // a notch where the fill meets each heading as it passes under the header
      const cut = parseFloat(getComputedStyle(root).getPropertyValue('--kz-reading-progress-notch')) || 0;
      const rtl = getComputedStyle(root).direction === 'rtl';
      const at = [...article.querySelectorAll(root.dataset.headings || 'h2')]
        .map((h) => (h.getBoundingClientRect().top + scrollY - offset - start) / (end - start))
        .filter((p) => p > 0.01 && p < 0.99)
        .map((p) => (rtl ? 1 - p : p) * 100)
        .sort((a, b) => a - b);
      const mask = cut && at.length
        ? `linear-gradient(90deg, #000 0, ${at.map((p) => `#000 ${p.toFixed(3)}%, transparent ${p.toFixed(3)}%, transparent calc(${p.toFixed(3)}% + ${cut}px), #000 calc(${p.toFixed(3)}% + ${cut}px)`).join(', ')}, #000 100%)`
        : '';
      bar.style.maskImage = mask;
      bar.style.webkitMaskImage = mask;
      update();
    };

    let reading = false;
    let percent = -1;
    const update = () => {
      const box = article.getBoundingClientRect();
      // from the article reaching the header to the article having gone above it
      const now = box.top <= offset + 1 && box.bottom > offset;
      if (now !== reading) {
        reading = now;
        root.classList.toggle('is-reading', now);
      }
      const progress = clamp((scrollY - start) / (end - start), 0, 1);
      if (!timeline) root.style.setProperty('--kz-reading-progress-value', progress.toFixed(4));
      const value = Math.round(progress * 100);
      if (value !== percent) {
        percent = value;
        bar.setAttribute('aria-valuenow', value);
      }
      if (cell) {
        const left = Math.max(1, Math.round((words * (1 - progress)) / WORDS_PER_MINUTE));
        say(progress >= 0.995 || !left ? done : format.replace('{n}', left));
      }
    };

    let raf = 0;
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); });
    };
    root.classList.toggle('is-timeline', timeline);
    measure();
    window.addEventListener('scroll', queue, { passive: true, signal });
    window.addEventListener('resize', measure, { signal });
    // the article grows as its pictures load, and moves when something above it does
    const resize = new ResizeObserver(() => measure());
    resize.observe(article);
    resize.observe(document.documentElement);
    signal.addEventListener('abort', () => {
      resize.disconnect();
      cancelAnimationFrame(raf);
    });
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
