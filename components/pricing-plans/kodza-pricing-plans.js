// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Pricing Plans
// Moves the pill under the chosen period and rolls each price to its new value: only the
// digits that change move, the new one rising from below while the old one leaves
// through the top, one after the other. The billing line follows. Screen readers get the plain price.
(() => {
  const SELECTOR = '.kodza-pricing';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const buttons = [...root.querySelectorAll('.kodza-pricing__toggle button')];
    const indicator = root.querySelector('.kodza-pricing__indicator');
    const amounts = [...root.querySelectorAll('.kodza-pricing__amount')];
    const style = getComputedStyle(root);
    const duration = reduceMotion ? 0 : parseFloat(style.getPropertyValue('--kz-price-duration')) * 1000 || 600;
    const ease = style.getPropertyValue('--kz-price-ease').trim() || 'ease';
    const currency = (el) => el.textContent.trim().replace(/[\d\s.,]/g, '') || '€';

    const billings = [...root.querySelectorAll('.kodza-pricing__billing')];

    // Each price becomes a small currency sign and a row of digit windows,
    // plus a plain copy for screen readers
    amounts.forEach((el) => {
      el.dataset.symbol = currency(el);
      const sr = document.createElement('span');
      sr.className = 'kodza-pricing__sr';
      el.after(sr);
      el.setAttribute('aria-hidden', 'true');
    });

    const render = (el, text, animate) => {
      const old = [...el.querySelectorAll('.kodza-pricing__char')].map((c) => c.lastElementChild?.textContent || '');
      const chars = [...text];
      const sign = document.createElement('span');
      sign.className = 'kodza-pricing__currency';
      sign.textContent = el.dataset.symbol;
      el.replaceChildren(sign, ...chars.map((char, i) => {
        const cell = document.createElement('span');
        cell.className = 'kodza-pricing__char';
        const before = old[old.length - chars.length + i];
        const next = document.createElement('span');
        next.textContent = char;
        if (animate && before !== undefined && before !== char) {
          const prev = document.createElement('span');
          prev.textContent = before;
          cell.append(prev, next);
          const delay = i * 60;
          prev.animate([{ transform: 'none' }, { transform: 'translateY(-105%)' }], { duration, delay, easing: ease, fill: 'forwards' });
          next.animate([{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration, delay, easing: ease, fill: 'backwards' });
        } else {
          cell.append(next);
        }
        return cell;
      }));
    };

    const moveIndicator = (button) => {
      if (!indicator) return;
      const right = button.parentElement.offsetWidth - button.offsetLeft - button.offsetWidth;
      indicator.style.setProperty('--kz-ind-l', `${button.offsetLeft}px`);
      indicator.style.setProperty('--kz-ind-r', `${right}px`);
    };

    const select = (period, animate = true) => {
      const button = buttons.find((b) => b.dataset.period === period) || buttons[0];
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
      moveIndicator(button);
      amounts.forEach((el) => {
        const value = el.dataset[period] ?? el.dataset.monthly;
        render(el, value, animate);
        el.nextElementSibling.textContent = `${el.dataset.symbol}${value}`;
      });
      // The billing line follows, rising into place when it changes
      billings.forEach((el) => {
        const text = el.dataset[period] ?? el.dataset.monthly ?? el.textContent;
        if (text === el.textContent) return;
        el.textContent = text;
        if (animate && duration) el.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: duration * 0.8, delay: 120, easing: ease, fill: 'backwards' });
      });
    };

    buttons.forEach((button) => button.addEventListener('click', () => select(button.dataset.period), { signal }));
    document.fonts.ready.then(() => moveIndicator(buttons.find((b) => b.getAttribute('aria-pressed') === 'true') || buttons[0]));
    const observer = new ResizeObserver(() => moveIndicator(buttons.find((b) => b.getAttribute('aria-pressed') === 'true') || buttons[0]));
    observer.observe(root);
    signal.addEventListener('abort', () => observer.disconnect());
    select(buttons.find((b) => b.getAttribute('aria-pressed') === 'true')?.dataset.period || 'monthly', false);
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
