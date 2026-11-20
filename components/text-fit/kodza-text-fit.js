// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Text Fit
// Each line of a heading (split where you put a <br>) gets the font size that makes it fill its
// column exactly, measured again when the column changes and when the font arrives. The ceiling is
// --kz-text-fit-max, in the CSS. Without the script, the heading as written, at its own size.
(() => {
  const SELECTOR = '.kodza-text-fit';
  // Size each line is measured at before it is scaled to the column
  const REF = 100;
  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    // One line per <br>, the inline markup inside (em, a, span) kept as it is
    const lines = [];
    let line = null;
    [...root.childNodes].forEach((node) => {
      if (node.nodeName === 'BR') {
        node.replaceWith(document.createTextNode(' '));
        line = null;
        return;
      }
      if (!line) {
        if (node.nodeType === Node.TEXT_NODE && !/\S/.test(node.textContent)) return;
        line = document.createElement('span');
        line.className = 'kodza-text-fit__line';
        node.before(line);
        lines.push(line);
      }
      line.append(node);
    });
    lines.forEach((el) => {
      el.normalize();
      const first = el.firstChild;
      const last = el.lastChild;
      if (first?.nodeType === Node.TEXT_NODE) first.textContent = first.textContent.replace(/^\s+/, '');
      if (last?.nodeType === Node.TEXT_NODE) last.textContent = last.textContent.replace(/\s+$/, '');
    });
    if (!lines.length) return;

    // Measured at REF, then scaled to the column. Screen pixels are divided by the scale of a parent
    // zoomed by a transform, so a scaled preview gets the same sizes
    let width = 0;
    const fit = () => {
      const style = getComputedStyle(root);
      const column = root.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      if (column <= 0) return;
      width = root.clientWidth;
      const k = root.getBoundingClientRect().width / root.offsetWidth || 1;
      const max = parseFloat(style.getPropertyValue('--kz-text-fit-max')) || Infinity;
      // Glyphs are not drawn exactly in proportion to the size (hinting, rounding): a second
      // measure at the first guess corrects what is left
      root.classList.add('is-measuring');
      let sizes = lines.map(() => REF);
      for (let pass = 0; pass < 2; pass++) {
        lines.forEach((el, i) => el.style.setProperty('--kz-text-fit-size', `${sizes[i]}px`));
        const widths = lines.map((el) => el.getBoundingClientRect().width / k);
        sizes = sizes.map((size, i) => (widths[i] ? (size * column) / widths[i] : size));
      }
      lines.forEach((el, i) => {
        const size = Math.min(max, Math.floor(sizes[i] * 100) / 100);
        el.style.setProperty('--kz-text-fit-size', `${size}px`);
      });
      root.classList.remove('is-measuring');
      root.classList.add('is-fitted');
    };

    // A new width refits. Fitting changes only the height, which calls the observer once more
    // with the same width: it stops there
    const observer = new ResizeObserver(() => {
      if (root.clientWidth !== width) fit();
    });
    observer.observe(root);
    document.fonts?.addEventListener('loadingdone', fit, { signal });
    signal.addEventListener('abort', () => observer.disconnect());
    fit();
    document.fonts?.ready.then(() => !signal.aborted && fit());
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
