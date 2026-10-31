// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Tooltip
// One bubble per group, described by every trigger's data-tip (and data-keys). The first hover
// waits --kz-tip-delay; within 400 ms of leaving a trigger, the next one is instant and the
// bubble glides over, its words rolling. Focus shows it at once, Escape hides it. Positions are
// measured in the group's own pixels, so a scaled parent does not shift it.
(() => {
  const SELECTOR = '.kodza-tooltip';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let uid = 0;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const triggers = [...root.querySelectorAll('.kodza-tooltip__trigger[data-tip]')];
    if (!triggers.length) return;
    const below = root.classList.contains('kodza-tooltip--bottom');
    const delay = parseFloat(getComputedStyle(root).getPropertyValue('--kz-tip-delay')) || 500;

    const bubble = document.createElement('span');
    bubble.className = 'kodza-tooltip__bubble';
    bubble.id = `kodza-tooltip-${++uid}`;
    bubble.setAttribute('role', 'tooltip');
    bubble.innerHTML = '<span class="kodza-tooltip__words"><span></span></span><span class="kodza-tooltip__keys"></span>';
    root.append(bubble);
    const words = bubble.querySelector('.kodza-tooltip__words');
    const keys = bubble.querySelector('.kodza-tooltip__keys');

    let current = null;
    let warm = false;
    let timer = 0;
    let cool = 0;

    const write = (trigger, roll) => {
      const text = trigger.dataset.tip;
      const prev = words.lastElementChild;
      const span = Object.assign(document.createElement('span'), { textContent: text });
      words.append(span);
      if (!roll || reduceMotion) prev.remove();
      else {
        // The leaving word steps out of the flow: the bubble sizes itself to the new one only
        prev.classList.add('is-leaving');
        const dir = triggers.indexOf(trigger) > triggers.indexOf(current) ? 1 : -1;
        const timing = { duration: 220, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
        prev.animate([{ transform: 'none', opacity: 1 }, { transform: `translateX(${dir * -40}%)`, opacity: 0 }], { ...timing, fill: 'forwards' }).finished.then(() => prev.remove());
        span.animate([{ transform: `translateX(${dir * 40}%)`, opacity: 0 }, { transform: 'none', opacity: 1 }], timing);
      }
      keys.replaceChildren(...(trigger.dataset.keys || '').split(/\s+/).filter(Boolean).map((key) => Object.assign(document.createElement('kbd'), { textContent: key })));
      bubble.classList.toggle('is-wrapping', text.length > 40);
    };

    // Above (or below) the trigger, centred, kept inside the screen, arrow on the trigger
    const place = (trigger) => {
      const k = root.getBoundingClientRect().width / root.offsetWidth || 1;
      const r = root.getBoundingClientRect();
      const t = trigger.getBoundingClientRect();
      const w = bubble.offsetWidth;
      const h = bubble.offsetHeight;
      const roomAbove = t.top - h * k - 12 > 0;
      const roomBelow = t.bottom + h * k + 12 < innerHeight;
      const side = below ? (roomBelow || !roomAbove ? 'bottom' : 'top') : (roomAbove || !roomBelow ? 'top' : 'bottom');
      const centre = (t.left + t.width / 2 - r.left) / k;
      const minX = (8 - r.left) / k;
      const maxX = (innerWidth - 8 - r.left) / k - w;
      const x = Math.min(maxX, Math.max(minX, centre - w / 2));
      const y = side === 'top' ? (t.top - r.top) / k - h - 10 : (t.bottom - r.top) / k + 10;
      bubble.dataset.side = side;
      bubble.style.setProperty('--kz-tip-x', `${x}px`);
      bubble.style.setProperty('--kz-tip-y', `${y}px`);
      bubble.style.setProperty('--kz-tip-arrow', `${centre - x}px`);
    };

    const show = (trigger) => {
      clearTimeout(timer);
      clearTimeout(cool);
      const gliding = bubble.classList.contains('is-on') && current && current !== trigger;
      // The content width (the one `width` sets), read mid-glide if one is running
      const width = () => parseFloat(getComputedStyle(bubble).width);
      const from = width();
      write(trigger, gliding);
      bubble.classList.toggle('is-gliding', gliding);
      // The bubble eases to its new width
      if (gliding && !reduceMotion) {
        const to = width();
        if (Math.abs(to - from) > 1) bubble.animate([{ width: `${from}px` }, { width: `${to}px` }], { duration: 250, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      }
      place(trigger);
      current?.removeAttribute('aria-describedby');
      trigger.setAttribute('aria-describedby', bubble.id);
      current = trigger;
      bubble.classList.add('is-on');
      warm = true;
    };

    const hide = (soon = true) => {
      clearTimeout(timer);
      bubble.classList.remove('is-on', 'is-gliding');
      current?.removeAttribute('aria-describedby');
      // Coming back to a neighbour quickly skips the wait
      clearTimeout(cool);
      cool = setTimeout(() => (warm = false), soon ? 400 : 0);
    };

    triggers.forEach((trigger) => {
      trigger.addEventListener('pointerenter', () => {
        clearTimeout(timer);
        if (warm) show(trigger);
        else timer = setTimeout(() => show(trigger), delay);
      }, { signal });
      trigger.addEventListener('pointerleave', () => {
        clearTimeout(timer);
        timer = setTimeout(() => hide(), 60);
      }, { signal });
      trigger.addEventListener('focus', () => show(trigger), { signal });
      trigger.addEventListener('blur', () => hide(), { signal });
      trigger.addEventListener('pointerdown', () => hide(false), { signal });
    });
    root.addEventListener('keydown', (event) => event.key === 'Escape' && hide(false), { signal });
    // A toolbar moves with the arrow keys
    if (root.getAttribute('role') === 'toolbar') {
      triggers.forEach((trigger, i) => (trigger.tabIndex = i === 0 ? 0 : -1));
      root.addEventListener('keydown', (event) => {
        const index = triggers.indexOf(document.activeElement);
        const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
        if (index < 0 || !step) return;
        event.preventDefault();
        const next = triggers[(index + step + triggers.length) % triggers.length];
        triggers.forEach((trigger) => (trigger.tabIndex = trigger === next ? 0 : -1));
        next.focus();
      }, { signal });
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
