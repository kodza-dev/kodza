// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Toast
// Keeps the deck: positions (folded or spread), timers that pause while the deck is spread or
// the tab is hidden, swipe to dismiss, actions, and loading toasts that turn into successes.
// root.kodzaToast({ text, type: "success" | "error" | "info" | "loading", action, onAction,
// duration, then, promise }) returns a function that closes it. data-toast on a button does the
// same, with data-type, data-action and data-then (a loading toast's text once done).
(() => {
  const SELECTOR = '.kodza-toast';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const ICONS = {
    success: '<svg viewBox="0 0 18 18"><circle cx="9" cy="9" r="7.5"/><path class="kodza-toast__tick" d="M5.8 9.2l2.2 2.1 4.2-4.6" pathLength="1"/></svg>',
    error: '<svg viewBox="0 0 18 18"><circle cx="9" cy="9" r="7.5"/><path d="M9 5.5v4.2M9 12.3v.1"/></svg>',
    info: '<svg viewBox="0 0 18 18"><circle cx="9" cy="9" r="7.5"/><path d="M9 8.3v4.2M9 5.7v.1"/></svg>',
    loading: '<svg class="kodza-toast__spinner" viewBox="0 0 18 18"><path d="M9 1.5A7.5 7.5 0 1 1 1.5 9"/></svg><svg viewBox="0 0 18 18"><circle cx="9" cy="9" r="7.5" opacity="0"/><path class="kodza-toast__tick" d="M5.8 9.2l2.2 2.1 4.2-4.6" pathLength="1"/></svg>',
  };
  const cross = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 3l6 6M9 3 3 9"/></svg>';
  const MAX = 3;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const stack = root.querySelector('.kodza-toast__stack');
    if (!stack) return;
    stack.setAttribute('aria-live', 'polite');
    const items = [];
    let spread = false;

    // Folded: lift = index from the front. Spread: offset = heights of the newer ones plus gaps.
    const layout = () => {
      const gap = parseFloat(getComputedStyle(root).getPropertyValue('--kz-toast-gap')) || 10;
      let offset = 0;
      const front = items[0]?.el.offsetHeight || 0;
      items.forEach((toast, i) => {
        const h = toast.el.offsetHeight;
        toast.el.style.setProperty('--kz-lift', i);
        // Folded, each older toast shows its top edge above the one in front, whatever its height
        toast.el.style.setProperty('--kz-fold', `${front - h + i * 10}px`);
        toast.el.style.setProperty('--kz-offset', `${offset}px`);
        toast.el.style.setProperty('--kz-alpha', i < MAX ? 1 : 0);
        toast.el.style.zIndex = String(100 - i);
        toast.el.inert = i >= MAX;
        offset += h + gap;
      });
      stack.style.setProperty('--kz-toast-span', `${offset}px`);
    };

    const roll = (box, text) => {
      const prev = box.lastElementChild;
      const span = Object.assign(document.createElement('span'), { textContent: text });
      box.append(span);
      if (!prev) return;
      if (reduceMotion) return prev.remove();
      const timing = { duration: 380, easing: ease };
      prev.animate([{ transform: 'none' }, { transform: 'translateY(-110%)' }], { ...timing, fill: 'forwards' }).finished.then(() => prev.remove());
      span.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], timing);
    };

    const dismiss = (toast) => {
      if (toast.gone) return;
      toast.gone = true;
      clearTimeout(toast.timer);
      toast.el.classList.add('is-leaving');
      items.splice(items.indexOf(toast), 1);
      layout();
      if (!items.length) {
        spread = false;
        stack.classList.remove('is-spread');
      }
      setTimeout(() => toast.el.remove(), reduceMotion ? 0 : 360);
    };

    // The timer only runs while the deck is folded and the tab visible
    const arm = (toast) => {
      clearTimeout(toast.timer);
      if (toast.type === 'loading' || spread || document.hidden) return;
      toast.started = performance.now();
      toast.timer = setTimeout(() => dismiss(toast), toast.left);
    };
    const pause = (toast) => {
      if (!toast.started) return;
      clearTimeout(toast.timer);
      toast.left = Math.max(400, toast.left - (performance.now() - toast.started));
      toast.started = 0;
    };

    const toast = ({ text = '', type = 'info', action, onAction, duration = 4000, then, promise } = {}) => {
      const el = document.createElement('li');
      el.className = 'kodza-toast__item is-entering';
      el.dataset.type = type;
      el.setAttribute('role', type === 'error' ? 'alert' : 'status');
      el.innerHTML = `<span class="kodza-toast__icon" aria-hidden="true">${ICONS[type] || ICONS.info}</span><span class="kodza-toast__text"></span><span class="kodza-toast__end"></span><span class="kodza-toast__time" aria-hidden="true"></span>`;
      el.style.setProperty('--kz-time', `${duration}ms`);
      const words = el.querySelector('.kodza-toast__text');
      roll(words, text);
      const end = el.querySelector('.kodza-toast__end');
      const item = { el, type, left: duration, started: 0, timer: 0, gone: false };
      if (action) {
        const button = Object.assign(document.createElement('button'), { type: 'button', className: 'kodza-toast__action', textContent: action });
        button.addEventListener('click', () => {
          onAction?.();
          root.dispatchEvent(new CustomEvent('kodza:toast-action', { detail: { action, text }, bubbles: true }));
          dismiss(item);
        }, { signal });
        end.append(button);
      }
      const close = Object.assign(document.createElement('button'), { type: 'button', className: 'kodza-toast__close', innerHTML: cross });
      close.setAttribute('aria-label', 'Dismiss');
      close.addEventListener('click', () => dismiss(item), { signal });
      end.append(close);

      stack.prepend(el);
      items.unshift(item);
      layout();
      // In from below, then the timer starts
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.classList.remove('is-entering');
        arm(item);
      }));
      while (items.length > MAX + 2) dismiss(items[items.length - 1]);

      // A loading toast becomes a success (or an error) when its work is done
      const finish = (ok, message) => {
        if (item.gone) return;
        item.type = ok ? 'success' : 'error';
        el.dataset.type = item.type;
        if (message) roll(words, message);
        el.querySelector('.kodza-toast__time').replaceWith(Object.assign(document.createElement('span'), { className: 'kodza-toast__time' }));
        item.left = duration;
        arm(item);
      };
      if (type === 'loading') {
        const work = promise || new Promise((resolve) => setTimeout(resolve, 1800));
        Promise.resolve(work).then(() => finish(true, then), (error) => finish(false, error?.message || 'That did not work.'));
      }

      // Swipe to the right to dismiss
      let start = null;
      el.addEventListener('pointerdown', (event) => {
        if (event.target.closest('button')) return;
        start = { x: event.clientX, time: performance.now() };
        el.setPointerCapture(event.pointerId);
        el.classList.add('is-dragging');
      }, { signal });
      el.addEventListener('pointermove', (event) => {
        if (!start) return;
        const dx = event.clientX - start.x;
        el.style.setProperty('--kz-drag', `${dx > 0 ? dx : dx / 4}px`);
      }, { signal });
      const release = (event) => {
        if (!start) return;
        const dx = event.clientX - start.x;
        const fast = dx / Math.max(1, performance.now() - start.time) > 0.5;
        start = null;
        el.classList.remove('is-dragging');
        if (dx > 90 || (fast && dx > 30)) return dismiss(item);
        el.style.setProperty('--kz-drag', '0px');
      };
      el.addEventListener('pointerup', release, { signal });
      el.addEventListener('pointercancel', release, { signal });
      return () => dismiss(item);
    };
    root.kodzaToast = toast;
    signal.addEventListener('abort', () => delete root.kodzaToast);

    // The deck spreads under the pointer (or the keyboard), timers pause
    const setSpread = (on) => {
      if (spread === on) return;
      spread = on;
      stack.classList.toggle('is-spread', on);
      items.forEach((item) => (on ? pause(item) : arm(item)));
    };
    stack.addEventListener('pointerenter', () => setSpread(true), { signal });
    stack.addEventListener('pointerleave', () => setSpread(false), { signal });
    stack.addEventListener('focusin', () => setSpread(true), { signal });
    stack.addEventListener('focusout', (event) => !stack.contains(event.relatedTarget) && setSpread(false), { signal });
    document.addEventListener('visibilitychange', () => items.forEach((item) => (document.hidden ? pause(item) : arm(item))), { signal });

    root.querySelectorAll('[data-toast]').forEach((button) => button.addEventListener('click', () => toast({
      text: button.dataset.toast,
      type: button.dataset.type || 'info',
      action: button.dataset.action,
      then: button.dataset.then,
    }), { signal }));
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
