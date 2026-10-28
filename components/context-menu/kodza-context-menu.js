// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Context Menu
// Opens the menu where the area was right-clicked (or from its corner with Shift + F10 / the
// menu key), keeps it inside the screen, moves the focus and the highlight from item to item,
// and closes on Escape, Tab, a click outside or a scroll. Picking an item fires
// "kodza:select" with { item, value } on the component.
(() => {
  const SELECTOR = '.kodza-context-menu';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const area = root.querySelector('.kodza-context-menu__area');
    const menu = root.querySelector('.kodza-context-menu__menu');
    if (!area || !menu) return;
    const items = [...menu.querySelectorAll('.kodza-context-menu__item')];
    const highlight = document.createElement('span');
    highlight.className = 'kodza-context-menu__highlight';
    highlight.setAttribute('aria-hidden', 'true');
    menu.prepend(highlight);
    items.forEach((item) => (item.tabIndex = -1));
    menu.tabIndex = -1;

    const isOpen = () => root.classList.contains('is-open');

    const light = (item) => {
      if (!item) return menu.style.setProperty('--kz-hl-on', 0);
      menu.style.setProperty('--kz-hl-y', `${item.offsetTop}px`);
      menu.style.setProperty('--kz-hl-h', `${item.offsetHeight}px`);
      menu.style.setProperty('--kz-hl-on', 1);
    };
    const focusItem = (item) => {
      if (!item) return;
      item.focus({ preventScroll: true });
      light(item);
    };

    // In a frame (a live preview on a docs page), the page that scrolls is often the parent one
    // and the wheel may never reach this window: while the menu is open, the parent page's
    // scroll closes it too, when it can be reached (same origin)
    let parentWatch = null;
    const watchParent = () => {
      const host = window.frameElement?.ownerDocument.defaultView;
      if (!host || parentWatch) return;
      parentWatch = new AbortController();
      host.addEventListener('scroll', () => close(), { passive: true, signal: parentWatch.signal });
    };
    signal.addEventListener('abort', () => parentWatch?.abort());

    // Place the menu's corner on the point, flipping it when it would leave the screen; when
    // neither side has room (a phone), it slides back inside, 8px from the edge
    const openAt = (clientX, clientY, fromKeyboard) => {
      const box = root.getBoundingClientRect();
      // Inside a scaled container, screen pixels and the menu's own pixels differ
      const scale = box.width / root.offsetWidth || 1;
      const width = menu.offsetWidth * scale;
      const height = menu.offsetHeight * scale;
      const { clientWidth: screenWidth, clientHeight: screenHeight } = document.documentElement;
      const inside = (start, size, room) => Math.max(8, Math.min(start, room - size - 8));
      const x = inside(clientX + width > screenWidth - 8 ? clientX - width : clientX, width, screenWidth);
      const up = clientY + height > screenHeight - 8 && clientY - height > 8;
      const y = inside(up ? clientY - height : clientY, height, screenHeight);
      root.style.setProperty('--kz-ctx-x', `${(x - box.left) / scale}px`);
      root.style.setProperty('--kz-ctx-y', `${(y - box.top) / scale}px`);
      // It grows from the point, wherever the point lands on it
      root.style.setProperty('--kz-ctx-origin', `${(clientX - x) / scale}px ${(clientY - y) / scale}px`);
      // Reopening elsewhere: jump there without sliding across
      menu.style.transition = 'none';
      void menu.offsetWidth;
      menu.style.transition = '';
      root.classList.remove('is-picking');
      root.classList.add('is-open');
      watchParent();
      light(null);
      if (fromKeyboard) focusItem(items[0]);
      else menu.focus({ preventScroll: true });
    };

    const close = (refocus = false) => {
      parentWatch?.abort();
      parentWatch = null;
      if (!isOpen()) return;
      root.classList.remove('is-open', 'is-picking');
      light(null);
      if (refocus) area.focus({ preventScroll: true });
    };

    const pick = (item) => {
      if (item.getAttribute('aria-disabled') === 'true') return;
      root.dispatchEvent(new CustomEvent('kodza:select', { detail: { item, value: item.textContent.trim() }, bubbles: true }));
      light(item);
      root.classList.add('is-picking');
      setTimeout(() => !signal.aborted && close(true), reduceMotion ? 0 : 320);
    };

    area.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      openAt(event.clientX, event.clientY, false);
    }, { signal });
    area.addEventListener('keydown', (event) => {
      if (event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey)) {
        event.preventDefault();
        const box = area.getBoundingClientRect();
        openAt(box.left + 24, box.top + 24, true);
      }
    }, { signal });

    items.forEach((item) => {
      item.addEventListener('click', () => pick(item), { signal });
      item.addEventListener('pointermove', () => document.activeElement !== item && focusItem(item), { signal });
    });
    menu.addEventListener('pointerleave', () => {
      if (menu.contains(document.activeElement)) menu.focus({ preventScroll: true });
      light(null);
    }, { signal });
    menu.addEventListener('contextmenu', (event) => event.preventDefault(), { signal });

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
        event.preventDefault();
        close(true);
      } else if (event.key.length === 1 && /\S/.test(event.key)) {
        const letter = event.key.toLowerCase();
        const order = [...items.slice(index + 1), ...items.slice(0, index + 1)];
        focusItem(order.find((item) => item.textContent.trim().toLowerCase().startsWith(letter)));
      }
    }, { signal });

    document.addEventListener('pointerdown', (event) => {
      if (isOpen() && !menu.contains(event.target)) close();
    }, { signal });
    addEventListener('scroll', () => close(), { passive: true, signal });
    // A wheel over the page closes it too, even when the page that scrolls is a parent one
    addEventListener('wheel', (event) => isOpen() && !menu.contains(event.target) && close(), { passive: true, signal });
    addEventListener('resize', () => close(), { signal });
    addEventListener('blur', () => close(), { signal });
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
