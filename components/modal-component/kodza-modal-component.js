// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Dialog
// Opens the <dialog> out of its trigger (the panel scales from the button's position) and sends
// it back there on close, whatever closes it: a button of the form (method="dialog"), Escape, or
// a click on the page. The alert version (--alert) is an alertdialog: a click on the page makes
// it insist instead of closing, and its main button waits for the name in data-confirm.
// Fires "kodza:close" with { value } (the button's value, or "cancel").
(() => {
  const SELECTOR = '.kodza-dialog';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  let uid = 0;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const trigger = root.querySelector('.kodza-dialog__trigger');
    const panel = root.querySelector('.kodza-dialog__panel');
    holdPage(panel, signal);
    if (!trigger || !panel) return;
    const alert = root.classList.contains('kodza-dialog--alert');
    const id = `kodza-dialog-${++uid}`;
    const title = panel.querySelector('.kodza-dialog__title');
    const text = panel.querySelector('.kodza-dialog__text');
    if (title) panel.setAttribute('aria-labelledby', (title.id = `${id}-title`));
    if (text) panel.setAttribute('aria-describedby', (text.id = `${id}-text`));
    if (alert) panel.setAttribute('role', 'alertdialog');
    trigger.setAttribute('aria-haspopup', 'dialog');

    // The confirmation: the main button wakes up once the name is typed
    const confirm = panel.querySelector('.kodza-dialog__confirm');
    const go = panel.querySelector('.kodza-dialog__go');
    if (confirm && go && root.dataset.confirm) {
      confirm.addEventListener('input', () => (go.disabled = confirm.value.trim() !== root.dataset.confirm), { signal });
    }

    // A short screen: the text runs under the pinned actions, and a line shows it. Measured on
    // the form's layout height, which the lines arriving from 8px lower do not stretch
    const form = panel.querySelector('.kodza-dialog__form');
    const clip = () => form && panel.classList.toggle('is-clipped', panel.scrollTop + panel.clientHeight < form.offsetHeight - 1);
    panel.addEventListener('scroll', clip, { signal, passive: true });
    const sizes = new ResizeObserver(clip);
    sizes.observe(panel);
    if (form) sizes.observe(form);
    signal.addEventListener('abort', () => sizes.disconnect());

    // Where the trigger sits, seen from the panel: the panel grows from there
    const fromTrigger = () => {
      const a = trigger.getBoundingClientRect();
      const b = panel.getBoundingClientRect();
      const x = a.left + a.width / 2 - b.left;
      const y = a.top + a.height / 2 - b.top;
      const scale = Math.max(0.08, Math.min(a.width / b.width, a.height / b.height));
      return { origin: `${x}px ${y}px`, scale };
    };

    let closing = false;
    const open = () => {
      if (panel.open) return;
      if (confirm) {
        confirm.value = '';
        if (go) go.disabled = true;
      }
      panel.showModal();
      panel.classList.add('is-open');
      if (reduceMotion) return;
      const { origin, scale } = fromTrigger();
      panel.style.transformOrigin = origin;
      panel.animate([
        { transform: `scale(${scale})`, opacity: 0 },
        { opacity: 1, offset: 0.3 },
        { transform: 'none', opacity: 1 },
      ], { duration: 520, easing: ease });
    };

    // Back into the trigger, then really closed
    const shut = (value) => {
      if (!panel.open || closing) return;
      closing = true;
      panel.classList.remove('is-open');
      const finish = () => {
        if (signal.aborted) return;
        closing = false;
        panel.close(value);
        // Back to the button that opened it (Safari does not focus buttons on click)
        trigger.focus({ preventScroll: true });
        root.dispatchEvent(new CustomEvent('kodza:close', { detail: { value }, bubbles: true }));
      };
      if (reduceMotion) return finish();
      const { origin, scale } = fromTrigger();
      panel.style.transformOrigin = origin;
      panel.animate([
        { transform: 'none', opacity: 1 },
        { opacity: 1, offset: 0.6 },
        { transform: `scale(${scale})`, opacity: 0 },
      ], { duration: 380, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' }).finished.then(finish);
    };

    trigger.addEventListener('click', open, { signal });
    // A button of the form closes it with its value (the form would close it at once)
    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      shut(event.submitter?.value || 'cancel');
    }, { signal });
    // Enter in a field means the main button (the ink one), not the first of the form: Cancel
    form?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || event.isComposing || !/^(text|search|email|url|tel|password|number)$/.test(event.target.type || '')) return;
      const main = form.querySelector('.kodza-dialog__button--ink');
      if (!main) return;
      event.preventDefault();
      if (!main.disabled) form.requestSubmit(main);
    }, { signal });
    panel.addEventListener('cancel', (event) => {
      event.preventDefault();
      shut('cancel');
    }, { signal });
    // A click on the page: closes it, or makes an alert insist
    panel.addEventListener('click', (event) => {
      if (event.target !== panel) return;
      const box = panel.getBoundingClientRect();
      const inside = event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
      if (inside) return;
      if (!alert) return shut('cancel');
      panel.classList.remove('is-shaking');
      void panel.offsetWidth;
      panel.classList.add('is-shaking');
    }, { signal });
    panel.addEventListener('animationend', (event) => event.animationName === 'kodza-dialog-shake' && panel.classList.remove('is-shaking'), { signal });

    // Stopped while open (or closing): the dialog closes and the page scrolls again
    signal.addEventListener('abort', () => {
      if (!panel.open) return;
      panel.close();
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
