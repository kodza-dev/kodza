// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Word Rotator
// Turns the words into a rotating slot: letters rise in and out one after the other (or the
// word flips with --flip), the slot eases to the new word's width, and the cycle pauses
// while the sentence is out of view or the tab hidden. With reduced motion, the first word
// simply stays. Screen readers get the words once, as a list.
(() => {
  const SELECTOR = '.kodza-rotator';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const leave = 'cubic-bezier(0.55, 0, 0.75, 0.2)';

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const slot = root.querySelector('.kodza-rotator__words');
    if (!slot) return;
    const words = [...slot.children].map((el) => el.textContent);
    if (words.length < 2) return;
    const flip = root.classList.contains('kodza-rotator--flip');
    const interval = parseInt(root.dataset.interval, 10) || 2400;
    let index = 0;
    let timer = 0;
    let visible = true;

    const sr = Object.assign(document.createElement('span'), { className: 'kodza-rotator__sr', textContent: words.join(', ') });
    slot.after(sr);
    slot.setAttribute('aria-hidden', 'true');

    const make = (text) => {
      const word = Object.assign(document.createElement('span'), { className: 'kodza-rotator__word' });
      word.append(...[...text].map((char) => Object.assign(document.createElement('span'), { textContent: char })));
      return word;
    };
    slot.replaceChildren(make(words[0]));

    const next = () => {
      const old = slot.lastElementChild;
      index = (index + 1) % words.length;
      const word = make(words[index]);
      const from = slot.offsetWidth;
      slot.append(word);
      // The slot eases to the new word's width; the old one, in the same cell, is cut by it
      const pad = slot.offsetWidth - Math.max(old.offsetWidth, word.offsetWidth);
      const to = word.offsetWidth + pad;
      slot.animate([{ width: `${from}px` }, { width: `${to}px` }], { duration: 700, easing: ease });
      if (flip) {
        old.animate([{ transform: 'none', opacity: 1 }, { transform: 'rotateX(90deg)', opacity: 0 }], { duration: 520, easing: leave, fill: 'forwards' }).finished.then(() => old.remove());
        word.animate([{ transform: 'rotateX(-90deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 760, delay: 140, easing: ease, fill: 'backwards' });
      } else {
        const gone = [...old.children].map((char, i) => char.animate([{ transform: 'none' }, { transform: 'translateY(-112%)' }], { duration: 420, delay: i * 14, easing: leave, fill: 'forwards' }).finished);
        Promise.all(gone).then(() => old.remove());
        [...word.children].forEach((char, i) => char.animate([{ transform: 'translateY(112%)' }, { transform: 'none' }], { duration: 640, delay: 90 + i * 24, easing: ease, fill: 'backwards' }));
      }
    };

    const loop = () => {
      clearTimeout(timer);
      if (!visible || document.hidden) return;
      timer = setTimeout(() => {
        next();
        loop();
      }, interval);
    };

    if (!reduceMotion) {
      const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        loop();
      });
      observer.observe(root);
      signal.addEventListener('abort', () => {
        observer.disconnect();
        clearTimeout(timer);
      });
      document.addEventListener('visibilitychange', loop, { signal });
    }
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
