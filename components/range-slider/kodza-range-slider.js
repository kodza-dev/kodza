// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Range Slider
// Draws the fill between the handles (or from the start), writes the value in the output and in
// a bubble over the moving handle, darkens the ticks, and keeps two handles from crossing: the
// one you move pushes the other along when they meet.
(() => {
  const SELECTOR = '.kodza-range';
  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const track = root.querySelector('.kodza-range__track');
    const inputs = [...root.querySelectorAll('.kodza-range__input')];
    const output = root.querySelector('.kodza-range__output');
    if (!track || !inputs.length) return;
    const dual = inputs.length > 1;
    if (dual) root.setAttribute('data-dual', '');
    const prefix = root.dataset.prefix || '';
    const suffix = root.dataset.suffix || '';
    const format = (value) => `${prefix}${Number(value).toLocaleString()}${suffix}`;
    const min = Number(inputs[0].min) || 0;
    const max = Number(inputs[0].max) || 100;
    const step = Number(inputs[0].step) || 1;
    const share = (value) => (Number(value) - min) / (max - min || 1);

    // One bubble per handle
    const bubbles = inputs.map(() => {
      const bubble = document.createElement('span');
      bubble.className = 'kodza-range__bubble';
      bubble.setAttribute('aria-hidden', 'true');
      track.append(bubble);
      return bubble;
    });

    // Ticks, one per step, when asked for
    let ticks = [];
    if (root.hasAttribute('data-ticks')) {
      const box = document.createElement('div');
      box.className = 'kodza-range__ticks';
      box.setAttribute('aria-hidden', 'true');
      const count = Math.round((max - min) / step) + 1;
      ticks = Array.from({ length: count }, () => box.appendChild(document.createElement('span')));
      track.after(box);
    }

    const paint = () => {
      const values = inputs.map((input) => Number(input.value));
      const from = dual ? share(values[0]) : 0;
      const to = share(values[values.length - 1]);
      root.style.setProperty('--kz-from', from);
      root.style.setProperty('--kz-to', to);
      inputs.forEach((input, i) => {
        bubbles[i].style.setProperty('--kz-at', share(input.value));
        bubbles[i].textContent = format(input.value);
        input.setAttribute('aria-valuetext', format(input.value));
      });
      ticks.forEach((tick, i) => tick.classList.toggle('is-on', min + i * step <= values[values.length - 1] && min + i * step >= (dual ? values[0] : min)));
      if (output) output.textContent = values.map(format).join(' – ');
    };

    inputs.forEach((input, i) => {
      input.addEventListener('input', () => {
        if (dual) {
          // The handle you move pushes the other one when they meet
          const [a, b] = inputs.map((el) => Number(el.value));
          if (a > b) {
            if (i === 0) inputs[1].value = Math.min(max, a);
            else inputs[0].value = Math.max(min, b);
          }
          // The one you hold stays on top
          inputs.forEach((el) => (el.style.zIndex = el === input ? 2 : 1));
        }
        bubbles[i].classList.add('is-on');
        paint();
      }, { signal });
      const hide = () => bubbles[i].classList.remove('is-on');
      input.addEventListener('pointerup', hide, { signal });
      input.addEventListener('blur', hide, { signal });
      input.addEventListener('focus', () => input.matches(':focus-visible') && bubbles[i].classList.add('is-on'), { signal });
      input.addEventListener('pointerdown', () => bubbles[i].classList.add('is-on'), { signal });
    });
    document.addEventListener('pointerup', () => bubbles.forEach((bubble, i) => document.activeElement !== inputs[i] && bubble.classList.remove('is-on')), { signal });

    paint();
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
