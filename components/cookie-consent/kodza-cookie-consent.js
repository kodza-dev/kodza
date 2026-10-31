// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Cookie Consent
// Shows the card when no choice is stored (localStorage, under data-key), unfolds the categories
// on "Choose" (then the same button saves them), keeps the choice, fires "kodza:consent" with
// { necessary, analytics, … } on the card and slides it away. Elements with data-kodza-cookies
// (or data-kodza-cookies="<key>") bring it back with the stored choices ticked.
(() => {
  const SELECTOR = '.kodza-cookies';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const read = (key) => {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null');
    } catch {
      return null;
    }
  };
  const write = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* private mode: the choice lasts for this page */
    }
  };

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const key = root.dataset.key || 'kodza-consent';
    const switches = [...root.querySelectorAll('.kodza-cookies__switch')];
    const more = root.querySelector('.kodza-cookies__more');
    const words = root.querySelector('.kodza-cookies__more-words');
    root.querySelectorAll('.kodza-cookies__row').forEach((row, i) => row.style.setProperty('--i', i));

    const roll = (text) => {
      const prev = words?.lastElementChild;
      if (!prev || prev.textContent === text) return;
      const span = Object.assign(document.createElement('span'), { textContent: text });
      words.append(span);
      if (reduceMotion) return prev.remove();
      const timing = { duration: 320, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
      prev.animate([{ transform: 'none' }, { transform: 'translateY(-110%)' }], { ...timing, fill: 'forwards' }).finished.then(() => prev.remove());
      span.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], timing);
    };
    if (more && words) more.style.minWidth = `${Math.max(more.offsetWidth, 44)}px`;

    const show = () => {
      if (signal.aborted) return;
      const stored = read(key)?.choices;
      switches.forEach((input) => (input.checked = !!stored?.[input.name]));
      root.hidden = false;
      root.classList.remove('is-leaving', 'is-open');
      more?.setAttribute('aria-expanded', 'false');
      roll('Choose');
      requestAnimationFrame(() => requestAnimationFrame(() => !signal.aborted && root.classList.add('is-shown')));
    };

    const decide = (choices) => {
      write(key, { choices, at: new Date().toISOString() });
      root.dispatchEvent(new CustomEvent('kodza:consent', { detail: choices, bubbles: true }));
      root.classList.remove('is-shown');
      root.classList.add('is-leaving');
      setTimeout(() => !signal.aborted && (root.hidden = true), reduceMotion ? 0 : 450);
    };
    const all = (on) => Object.fromEntries([['necessary', true], ...switches.map((input) => [input.name, on])]);

    root.querySelectorAll('[data-choice]').forEach((button) => button.addEventListener('click', () => decide(all(button.dataset.choice === 'accept')), { signal }));
    more?.addEventListener('click', () => {
      if (root.classList.contains('is-open')) {
        return decide(Object.fromEntries([['necessary', true], ...switches.map((input) => [input.name, input.checked])]));
      }
      root.classList.add('is-open');
      more.setAttribute('aria-expanded', 'true');
      roll('Save');
    }, { signal });
    // Escape folds the categories back; a focus left on a switch that hides goes to the button
    root.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !root.classList.contains('is-open')) return;
      root.classList.remove('is-open');
      more?.setAttribute('aria-expanded', 'false');
      roll('Choose');
      if (event.target.closest('.kodza-cookies__details')) more?.focus({ preventScroll: true });
    }, { signal });
    // data-kodza-cookies opens every card, data-kodza-cookies="<key>" only the one with that key
    document.querySelectorAll('[data-kodza-cookies]').forEach((trigger) => {
      if (!trigger.dataset.kodzaCookies || trigger.dataset.kodzaCookies === key) trigger.addEventListener('click', show, { signal });
    });

    if (!read(key)) setTimeout(show, reduceMotion ? 0 : 600);
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
