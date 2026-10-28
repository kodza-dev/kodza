// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Stepper
// Moves between the steps (Next, Back, or a click on a finished step), fills the line, marks
// the steps and swaps the panels: the old one leaves while the new one comes in from the side
// you are heading to. After the last step, Next shows the .kodza-stepper__done panel and
// becomes "Start over", its label rolling to the new word. Fires "kodza:step" with { step }
// (0-based; steps.length means done).
(() => {
  const SELECTOR = '.kodza-stepper';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const steps = [...root.querySelectorAll('.kodza-stepper__step')];
    const panels = [...root.querySelectorAll('.kodza-stepper__panel:not(.kodza-stepper__done)')];
    const done = root.querySelector('.kodza-stepper__done');
    const back = root.querySelector('.kodza-stepper__back');
    const next = root.querySelector('.kodza-stepper__next');
    if (!steps.length || !next) return;
    const all = [...panels, done].filter(Boolean);
    const labels = { next: next.textContent.trim(), last: next.dataset.last || 'Finish', again: next.dataset.again || 'Start over' };
    const style = getComputedStyle(root);
    const duration = parseFloat(style.getPropertyValue('--kz-stepper-duration')) * 1000 || 600;
    const ease = style.getPropertyValue('--kz-stepper-ease').trim() || 'ease';
    root.style.setProperty('--kz-stepper-n', steps.length);

    // The label sits in a little window, and the button is as wide as its longest label
    const roll = document.createElement('span');
    roll.className = 'kodza-stepper__roll';
    const word = document.createElement('span');
    word.textContent = labels.next;
    roll.append(word);
    next.replaceChildren(roll);
    next.style.minWidth = `${Math.max(...[labels.next, labels.last, labels.again].map((text) => {
      word.textContent = text;
      return next.offsetWidth;
    }))}px`;
    word.textContent = labels.next;

    const setLabel = (text) => {
      const prev = roll.lastElementChild;
      if (prev.textContent === text) return;
      const span = document.createElement('span');
      span.textContent = text;
      roll.append(span);
      if (reduceMotion) return prev.remove();
      prev.setAttribute('aria-hidden', 'true');
      prev.animate([{ transform: 'none' }, { transform: 'translateY(-110%)' }], { duration: duration * 0.8, easing: ease, fill: 'forwards' }).finished.then(() => prev.remove());
      span.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], { duration: duration * 0.8, easing: ease });
    };

    let current = -1;
    const go = (index) => {
      const target = Math.max(0, Math.min(steps.length, index));
      if (target === current) return;
      const forward = target > current;
      const finished = target === steps.length;
      steps.forEach((step, i) => {
        step.classList.toggle('is-done', i < target);
        step.classList.toggle('is-current', i === target);
        const dot = step.querySelector('.kodza-stepper__dot');
        const label = step.querySelector('.kodza-stepper__label')?.textContent.trim() || `Step ${i + 1}`;
        dot.disabled = i >= target;
        dot.setAttribute('aria-label', `${label}, step ${i + 1} of ${steps.length}${i < target ? ', done' : i === target ? ', current' : ''}`);
        if (i === target) step.setAttribute('aria-current', 'step');
        else step.removeAttribute('aria-current');
      });
      root.style.setProperty('--kz-stepper-progress', steps.length > 1 ? Math.min(target, steps.length - 1) / (steps.length - 1) : 1);

      // The old panel leaves on the side you come from, the new one enters from the other
      const show = finished ? done : panels[target];
      root.style.setProperty('--kz-stepper-leave', forward ? -1 : 1);
      all.forEach((panel) => {
        if (panel !== show) panel.classList.remove('is-active');
      });
      if (show) {
        if (current >= 0) {
          show.classList.add('is-from');
          void show.offsetWidth;
          show.classList.remove('is-from');
        }
        show.classList.add('is-active');
      }

      if (back) back.disabled = target === 0 || finished;
      setLabel(finished ? labels.again : target === steps.length - 1 ? labels.last : labels.next);
      current = target;
      root.dispatchEvent(new CustomEvent('kodza:step', { detail: { step: target }, bubbles: true }));
    };

    next.addEventListener('click', () => go(current === steps.length ? 0 : current + 1), { signal });
    back?.addEventListener('click', () => go(current - 1), { signal });
    steps.forEach((step, i) => step.querySelector('.kodza-stepper__dot')?.addEventListener('click', () => go(i), { signal }));

    // From here, the panels are shown by the script (stacked), not by the hidden attribute
    all.forEach((panel) => panel.removeAttribute('hidden'));
    root.classList.add('is-ready');
    go(0);
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
