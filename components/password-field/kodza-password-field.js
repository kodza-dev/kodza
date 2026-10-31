// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Password
// Shows or hides the password (keeping the caret where it was), scores it as you type (length,
// mixed case, digits, symbols), fills the meter, rolls the verdict and ticks the rules.
// The verdict is also read out to screen readers. Fires "kodza:strength" with { score } (0–4).
(() => {
  const SELECTOR = '.kodza-password';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WORDS = ['Type something', 'Too easy', 'Getting there', 'Solid', 'Very solid'];
  const RULES = {
    length: (value) => value.length >= 8,
    digit: (value) => /\d/.test(value),
    symbol: (value) => /[^A-Za-z0-9\s]/.test(value),
  };
  let uid = 0;

  const score = (value) => {
    if (!value) return 0;
    let points = 0;
    if (value.length >= 8) points++;
    if (value.length >= 14) points++;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) points++;
    if (/\d/.test(value)) points++;
    if (/[^A-Za-z0-9\s]/.test(value)) points++;
    return Math.max(1, Math.min(4, points));
  };

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const input = root.querySelector('.kodza-password__input');
    const toggle = root.querySelector('.kodza-password__toggle');
    const bars = [...root.querySelectorAll('.kodza-password__meter span')];
    const word = root.querySelector('.kodza-password__word');
    const status = root.querySelector('.kodza-password__status');
    const rules = [...root.querySelectorAll('.kodza-password__rule')];
    if (!input) return;
    if (status) {
      status.id = `kodza-password-${++uid}`;
      status.setAttribute('aria-live', 'polite');
      input.setAttribute('aria-describedby', status.id);
    }
    if (word) word.replaceChildren(Object.assign(document.createElement('span'), { textContent: word.textContent.trim() }));

    // The verdict rolls up when it gets better, down when it gets worse
    const roll = (text, dir) => {
      const prev = word.lastElementChild;
      if (prev.textContent === text) return;
      const span = Object.assign(document.createElement('span'), { textContent: text });
      word.append(span);
      if (reduceMotion) return prev.remove();
      const timing = { duration: 400, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
      prev.animate([{ transform: 'none' }, { transform: `translateY(${dir * -110}%)` }], { ...timing, fill: 'forwards' }).finished.then(() => prev.remove());
      span.animate([{ transform: `translateY(${dir * 110}%)` }, { transform: 'none' }], timing);
    };

    let last = 0;
    const update = () => {
      const value = input.value;
      const points = score(value);
      // Filling up goes left to right, emptying right to left, one step after the other
      bars.forEach((bar, i) => {
        const delay = points > last ? i - last : last - 1 - i;
        bar.style.setProperty('--d', `${Math.max(0, delay) * 60}ms`);
        bar.classList.toggle('is-on', i < points);
      });
      if (word) roll(WORDS[points], points >= last ? 1 : -1);
      rules.forEach((rule) => rule.classList.toggle('is-met', !!RULES[rule.dataset.rule]?.(value)));
      if (points !== last) root.dispatchEvent(new CustomEvent('kodza:strength', { detail: { score: points }, bubbles: true }));
      last = points;
    };
    input.addEventListener('input', update, { signal });

    toggle?.addEventListener('click', () => {
      const show = input.type === 'password';
      const { selectionStart, selectionEnd } = input;
      input.type = show ? 'text' : 'password';
      toggle.setAttribute('aria-pressed', String(show));
      toggle.setAttribute('aria-label', show ? 'Hide the password' : 'Show the password');
      input.focus();
      try {
        input.setSelectionRange(selectionStart, selectionEnd);
      } catch {
        /* some types refuse selections */
      }
    }, { signal });

    update();
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
