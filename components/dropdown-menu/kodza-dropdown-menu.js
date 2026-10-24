// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Dropdown Menu
// Opens and closes the menu (click, Enter, Space, arrows), moves the focus and the highlight
// from item to item (arrows, Home, End, first letter), and closes on Escape, Tab or a click
// outside. Picking an item fires "kodza:select" with { item, value } on the dropdown.
(() => {
  const SELECTOR = '.kodza-dropdown';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const trigger = root.querySelector('.kodza-dropdown__trigger');
    const menu = root.querySelector('.kodza-dropdown__menu');
    if (!trigger || !menu) return;
    const items = [...menu.querySelectorAll('.kodza-dropdown__item')];
    const value = trigger.querySelector('.kodza-dropdown__value');
    const highlight = document.createElement('span');
    highlight.className = 'kodza-dropdown__highlight';
    highlight.setAttribute('aria-hidden', 'true');
    menu.prepend(highlight);
    items.forEach((item) => (item.tabIndex = -1));

    const isOpen = () => root.classList.contains('is-open');

    // The picked value rolls into the button: the old word leaves upwards, the new one rises
    if (value) value.replaceChildren(Object.assign(document.createElement('span'), { textContent: value.textContent.trim() }));
    // and the button eases to its new width instead of jumping
    const roll = (text) => {
      const prev = value.lastElementChild;
      if (!prev || prev.textContent === text) return;
      const from = value.offsetWidth;
      const span = document.createElement('span');
      span.textContent = text;
      value.append(span);
      if (reduceMotion) return prev.remove();
      const to = span.offsetWidth;
      const timing = { duration: 450, delay: 280, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
      prev.setAttribute('aria-hidden', 'true');
      value.animate([{ width: `${from}px` }, { width: `${to}px` }], { ...timing, fill: 'backwards' });
      prev.animate([{ transform: 'none' }, { transform: 'translateY(-110%)' }], { ...timing, fill: 'forwards' }).finished.then(() => prev.remove());
      span.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], { ...timing, fill: 'backwards' });
    };

    const light = (item) => {
      if (!item) {
        menu.style.setProperty('--kz-hl-on', 0);
        return;
      }
      menu.style.setProperty('--kz-hl-y', `${item.offsetTop}px`);
      menu.style.setProperty('--kz-hl-h', `${item.offsetHeight}px`);
      menu.style.setProperty('--kz-hl-on', 1);
    };

    const focusItem = (item) => {
      if (!item) return;
      item.focus({ preventScroll: true });
      light(item);
    };

    const open = (which = 'none') => {
      if (!isOpen()) {
        const box = trigger.getBoundingClientRect();
        const height = menu.offsetHeight + 8;
        const above = box.bottom + height > innerHeight - 8 && box.top - height > 8;
        // A closed menu that changes side gets there at once, so it always unrolls from the button
        if (above !== root.classList.contains('is-above')) {
          menu.style.transition = 'none';
          root.classList.toggle('is-above', above);
          void menu.offsetWidth;
          menu.style.transition = '';
        }
        root.classList.toggle('is-end', box.left + menu.offsetWidth > innerWidth - 8);
        root.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
      const checked = items.find((item) => item.getAttribute('aria-checked') === 'true');
      if (which === 'first') focusItem(checked || items[0]);
      else if (which === 'last') focusItem(items[items.length - 1]);
      else light(null);
    };

    const close = (refocus = false) => {
      if (!isOpen()) return;
      root.classList.remove('is-open', 'is-picking');
      trigger.setAttribute('aria-expanded', 'false');
      light(null);
      if (refocus) trigger.focus();
    };

    const pick = (item) => {
      if (item.getAttribute('aria-disabled') === 'true') return;
      if (item.getAttribute('role') === 'menuitemradio') {
        items.forEach((other) => other.getAttribute('role') === 'menuitemradio' && other.setAttribute('aria-checked', String(other === item)));
        if (value) roll(item.textContent.trim());
      }
      root.dispatchEvent(new CustomEvent('kodza:select', { detail: { item, value: item.textContent.trim() }, bubbles: true }));
      light(item);
      root.classList.add('is-picking');
      setTimeout(() => !signal.aborted && close(true), reduceMotion ? 0 : 320);
    };

    trigger.addEventListener('click', () => (isOpen() ? close() : open()), { signal });
    trigger.addEventListener('keydown', (event) => {
      if (['ArrowDown', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        open('first');
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        open('last');
      }
    }, { signal });

    items.forEach((item) => {
      item.addEventListener('click', () => pick(item), { signal });
      item.addEventListener('pointermove', () => document.activeElement !== item && focusItem(item), { signal });
    });
    menu.addEventListener('pointerleave', () => {
      if (menu.contains(document.activeElement)) menu.focus?.({ preventScroll: true });
      light(null);
    }, { signal });

    menu.addEventListener('keydown', (event) => {
      const index = items.indexOf(document.activeElement);
      const moves = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: items.length - 1 };
      if (event.key in moves) {
        event.preventDefault();
        focusItem(items[(moves[event.key] + items.length) % items.length]);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
      } else if (event.key === 'Tab') {
        close();
      } else if (event.key.length === 1 && /\S/.test(event.key)) {
        // Type a letter: jump to the next item that starts with it
        const letter = event.key.toLowerCase();
        const order = [...items.slice(index + 1), ...items.slice(0, index + 1)];
        focusItem(order.find((item) => item.textContent.trim().toLowerCase().startsWith(letter)));
      }
    }, { signal });

    document.addEventListener('pointerdown', (event) => {
      if (isOpen() && !root.contains(event.target)) close();
    }, { signal });
    // Escape closes it wherever the focus is: opened with a click, it stays on the button
    // (Chrome) or on the page (Safari), not in the menu
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !isOpen()) return;
      event.preventDefault();
      close(true);
    }, { signal });

    menu.tabIndex = -1;
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
