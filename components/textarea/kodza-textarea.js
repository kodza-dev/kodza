// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Textarea
// Grows the textarea to fit its text (the height eases instead of jumping), fills the counter
// ring, shows the characters left in the last fifth, and writes the error (data-error, or the
// browser's own) when the text is invalid: judged when the visitor leaves, then live.
(() => {
  const SELECTOR = '.kodza-textarea';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let uid = 0;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const input = root.querySelector('.kodza-textarea__input');
    const hint = root.querySelector('.kodza-textarea__hint');
    const error = root.querySelector('.kodza-textarea__error');
    const left = root.querySelector('.kodza-textarea__left');
    if (!input) return;
    const max = Number(root.dataset.max) || (input.maxLength > 0 ? input.maxLength : 0);
    const id = `kodza-textarea-${++uid}`;
    const described = [];
    if (hint) described.push((hint.id = `${id}-hint`));
    if (error) described.push((error.id = `${id}-error`));
    if (described.length) input.setAttribute('aria-describedby', described.join(' '));

    // The height follows the text, easing from the old height to the new one
    let height = 0;
    let growing = null;
    const fit = (animate) => {
      const from = input.offsetHeight;
      input.style.height = 'auto';
      const to = Math.max(input.scrollHeight, 44);
      input.style.height = `${to}px`;
      if (animate && !reduceMotion && height && Math.abs(to - from) > 1) {
        growing?.cancel();
        growing = input.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 220, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      }
      height = to;
    };

    // The characters left roll to their new number
    if (left) left.replaceChildren(Object.assign(document.createElement('span'), { textContent: '' }));
    const roll = (text) => {
      const prev = left.lastElementChild;
      if (prev.textContent === String(text)) return;
      const span = Object.assign(document.createElement('span'), { textContent: text });
      left.append(span);
      if (reduceMotion || !root.classList.contains('is-near')) return prev.remove();
      const timing = { duration: 220, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
      prev.animate([{ transform: 'none' }, { transform: 'translateY(-110%)' }], { ...timing, fill: 'forwards' }).finished.then(() => prev.remove());
      span.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], timing);
    };

    const count = () => {
      if (!max) return;
      const used = Math.min(1, input.value.length / max);
      root.style.setProperty('--kz-used', used.toFixed(3));
      root.classList.toggle('is-near', used >= 0.8);
      root.classList.toggle('is-full', used >= 1);
      if (left) roll(max - input.value.length);
    };

    const check = () => {
      if (!error) return;
      const bad = !input.validity.valid;
      error.textContent = bad ? input.dataset.error || input.validationMessage : '';
      input.setAttribute('aria-invalid', String(bad));
    };

    input.addEventListener('input', () => {
      fit(true);
      count();
      if (input.getAttribute('aria-invalid') === 'true') check();
    }, { signal });
    input.addEventListener('blur', check, { signal });
    window.addEventListener('resize', () => fit(false), { signal });
    document.fonts?.ready.then(() => fit(false));

    fit(false);
    count();
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
