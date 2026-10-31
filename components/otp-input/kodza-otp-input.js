// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — OTP Input
// Draws the cells (a dash in the middle), keeps the input to digits, shows each digit in its
// cell (the new one rising), marks the cell waiting for the next one, and plays the "done"
// state once the code is complete. Fires "kodza:complete" with { code }. The resend button
// counts down from data-resend seconds (30) before it can be used, and fires "kodza:resend".
(() => {
  const SELECTOR = '.kodza-otp';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const input = root.querySelector('.kodza-otp__input');
    const box = root.querySelector('.kodza-otp__cells');
    const done = root.querySelector('.kodza-otp__done');
    const resend = root.querySelector('.kodza-otp__resend');
    const count = root.querySelector('.kodza-otp__count');
    if (!input || !box) return;
    const length = Number(root.dataset.length) || Number(input.maxLength) || 6;
    input.maxLength = length;

    const cells = Array.from({ length }, (_, i) => {
      const cell = document.createElement('span');
      cell.className = 'kodza-otp__cell';
      cell.style.setProperty('--i', i);
      return cell;
    });
    const half = Math.floor(length / 2);
    box.append(...cells.slice(0, half), Object.assign(document.createElement('span'), { className: 'kodza-otp__sep' }), ...cells.slice(half));

    let shown = '';
    const render = () => {
      const value = input.value.replace(/\D/g, '').slice(0, length);
      if (value !== input.value) input.value = value;
      cells.forEach((cell, i) => {
        const digit = value[i] || '';
        if (digit !== (shown[i] || '')) {
          const span = document.createElement('span');
          span.textContent = digit;
          if (digit && !reduceMotion) span.classList.add('is-new');
          cell.replaceChildren(span);
          cell.dataset.digit = digit;
        }
        cell.classList.toggle('is-active', i === Math.min(value.length, length - 1) && value.length < length);
      });
      const complete = value.length === length;
      if (complete && !root.classList.contains('is-done')) {
        root.classList.add('is-done');
        if (done) done.textContent = root.dataset.done || 'Code accepted. Welcome back.';
        root.dispatchEvent(new CustomEvent('kodza:complete', { detail: { code: value }, bubbles: true }));
      } else if (!complete) {
        root.classList.remove('is-done');
        if (done) done.textContent = '';
      }
      shown = value;
    };
    input.addEventListener('input', render, { signal });
    // The caret always sits at the end: the cells read left to right
    const end = () => input.setSelectionRange(input.value.length, input.value.length);
    input.addEventListener('focus', () => requestAnimationFrame(end), { signal });
    input.addEventListener('click', end, { signal });
    input.addEventListener('keydown', (event) => ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) && event.preventDefault(), { signal });

    // Resend: a countdown that rolls, then a link
    const seconds = Number(root.dataset.resend) || 30;
    let left = 0;
    let timer = 0;
    const roll = (value) => {
      if (!count) return;
      const prev = count.lastElementChild;
      const span = Object.assign(document.createElement('span'), { textContent: value });
      count.append(span);
      if (!prev) return;
      if (reduceMotion) return prev.remove();
      const timing = { duration: 350, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
      prev.animate([{ transform: 'none' }, { transform: 'translateY(-110%)' }], { ...timing, fill: 'forwards' }).finished.then(() => prev.remove());
      span.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], timing);
    };
    const tick = () => {
      left -= 1;
      if (left <= 0) {
        clearInterval(timer);
        resend.disabled = false;
        resend.replaceChildren('Resend code');
        return;
      }
      roll(left);
    };
    const start = () => {
      if (!resend) return;
      left = seconds;
      resend.disabled = true;
      if (count) {
        count.replaceChildren();
        roll(left);
        resend.replaceChildren('Resend in ', count, 's');
      }
      clearInterval(timer);
      timer = setInterval(tick, 1000);
    };
    signal.addEventListener('abort', () => clearInterval(timer));
    resend?.addEventListener('click', () => {
      root.dispatchEvent(new CustomEvent('kodza:resend', { bubbles: true }));
      start();
      input.focus();
    }, { signal });

    render();
    start();
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
