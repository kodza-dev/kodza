// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Countdown
// Ticks on the second towards data-date, rolls down every digit that changes, and switches to
// data-done at zero. Change data-date and it follows. Screen readers get "3 days, 4 hours,
// 12 minutes left" (updated once a minute, not every second).
(() => {
  const SELECTOR = '.kodza-countdown';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const SPAN = { days: 86400, hours: 3600, minutes: 60, seconds: 1 };

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const values = [...root.querySelectorAll('.kodza-countdown__value')];
    const units = root.querySelector('.kodza-countdown__units');
    const hasDays = values.some((el) => el.dataset.unit === 'days');
    let timer = 0;
    let said = '';

    units.setAttribute('aria-hidden', 'true');
    const sr = Object.assign(document.createElement('span'), { className: 'kodza-countdown__sr' });
    const done = Object.assign(document.createElement('span'), { className: 'kodza-countdown__done', textContent: root.dataset.done || '' });
    root.append(done, sr);

    // A value is a row of digit windows; a digit that changes drops out, the new one comes from above
    const show = (el, text, animate) => {
      const cells = [...el.children];
      if (cells.length !== text.length) {
        el.replaceChildren(...[...text].map((char) => {
          const cell = Object.assign(document.createElement('span'), { className: 'kodza-countdown__digit' });
          cell.append(Object.assign(document.createElement('span'), { textContent: char }));
          return cell;
        }));
        return;
      }
      [...text].forEach((char, i) => {
        const cell = cells[i];
        const old = cell.lastElementChild;
        if (old.textContent === char) return;
        const next = Object.assign(document.createElement('span'), { textContent: char });
        cell.append(next);
        if (!animate || reduceMotion) return old.remove();
        const timing = { duration: 520, easing: ease };
        old.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(100%)', opacity: 0 }], { ...timing, fill: 'forwards' }).finished.then(() => old.remove());
        next.animate([{ transform: 'translateY(-100%)', opacity: 0 }, { transform: 'none', opacity: 1 }], timing);
      });
    };

    const tick = (animate = true) => {
      clearTimeout(timer);
      const target = new Date(root.dataset.date).getTime();
      if (Number.isNaN(target)) return;
      let left = Math.max(0, Math.round((target - Date.now()) / 1000));
      const over = left === 0;
      if (!over) root.classList.remove('is-done');
      const parts = {};
      ['days', 'hours', 'minutes', 'seconds'].forEach((unit) => {
        if (unit === 'days' && !hasDays) return;
        parts[unit] = Math.floor(left / SPAN[unit]);
        left -= parts[unit] * SPAN[unit];
      });
      values.forEach((el) => show(el, String(parts[el.dataset.unit] ?? 0).padStart(2, '0'), animate));
      const sentence = over
        ? root.dataset.done || 'Time is up'
        : `${hasDays ? `${parts.days} days, ` : ''}${parts.hours} hours, ${parts.minutes} minutes left`;
      if (sentence !== said) sr.textContent = said = sentence;
      // At zero, 00 lands first, then the message takes over
      if (over) {
        if (root.dataset.done && !root.classList.contains('is-done')) timer = setTimeout(() => root.classList.add('is-done'), animate && !reduceMotion ? 900 : 0);
        return;
      }
      timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 10);
    };

    tick(false);
    const observer = new MutationObserver(() => tick());
    observer.observe(root, { attributes: true, attributeFilter: ['data-date'] });
    signal.addEventListener('abort', () => {
      observer.disconnect();
      clearTimeout(timer);
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
