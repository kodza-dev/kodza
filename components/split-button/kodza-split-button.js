// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Split Button
// Slides the hover tint from half to half, opens and closes the menu of the arrow (click,
// Enter, Space, arrows), moves the focus and the highlight from item to item (arrows, Home,
// End, first letter), and closes on Escape, Tab or a click outside. Picking an item fires
// "kodza:select" with { item, value } on the split button; a way of doing the main action
// (menuitemradio) also becomes the main button's label and value, so its own click does that.
(() => {
  const SELECTOR = '.kodza-split';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const main = root.querySelector('.kodza-split__main');
    const toggle = root.querySelector('.kodza-split__toggle');
    const menu = root.querySelector('.kodza-split__menu');
    if (!main || !toggle || !menu) return;
    const label = main.querySelector('.kodza-split__label');
    const items = [...menu.querySelectorAll('.kodza-split__item')];
    const tint = document.createElement('span');
    tint.className = 'kodza-split__tint';
    tint.setAttribute('aria-hidden', 'true');
    root.prepend(tint);
    const highlight = document.createElement('span');
    highlight.className = 'kodza-split__highlight';
    highlight.setAttribute('aria-hidden', 'true');
    menu.prepend(highlight);
    items.forEach((item) => (item.tabIndex = -1));
    if (label) label.replaceChildren(Object.assign(document.createElement('span'), { textContent: label.textContent.trim() }));

    const isOpen = () => root.classList.contains('is-open');
    const valueOf = (item) => item.value || item.firstChild.textContent.trim();

    // The tint: placed at once the first time, then it glides from half to half
    let tinted = null;
    // (edges measured from the tint's own box, 4px inside the button; 3px of air at the line)
    const place = (half) => {
      const inner = root.clientWidth - 8;
      const left = half === main ? 0 : toggle.offsetLeft + 3 - 4;
      const right = half === main ? inner - (main.offsetWidth - 3 - 4) : 0;
      root.style.setProperty('--kz-split-tint-l', `${left}px`);
      root.style.setProperty('--kz-split-tint-r', `${right}px`);
    };
    const tintOn = (half) => {
      if (half.disabled) return tintOff();
      if (!tinted) {
        root.classList.remove('is-gliding');
        place(half);
        void getComputedStyle(tint).clipPath;
        root.classList.add('is-gliding');
      } else {
        place(half);
      }
      root.style.setProperty('--kz-split-tint-on', 1);
      tinted = half;
    };
    const tintOff = () => {
      root.style.setProperty('--kz-split-tint-on', 0);
      tinted = null;
    };
    // Its edges follow the button when its width changes (a new label, a narrower column)
    if (window.ResizeObserver) {
      const watch = new ResizeObserver(() => tinted && place(tinted));
      watch.observe(root);
      signal.addEventListener('abort', () => watch.disconnect());
    }

    // A new way of doing it rolls into the main button: the old words leave upwards, the new
    // ones rise, and the button eases to its new width instead of jumping
    let rolls = 0;
    const roll = (text) => {
      const prev = label.lastElementChild;
      if (!prev || prev.textContent === text) return;
      const from = label.offsetWidth;
      const span = Object.assign(document.createElement('span'), { textContent: text });
      label.append(span);
      if (reduceMotion) return prev.remove();
      const to = span.offsetWidth;
      const timing = { duration: 450, delay: 280, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
      prev.setAttribute('aria-hidden', 'true');
      // (held at its end until the old words are gone: the grid would be as wide as both for a frame.
      // Wider, it opens ahead of the new words so they are not cut on the way in; narrower, it
      // eases in and out so the old ones are not cut before they have left)
      const fitTiming = to > from
        ? { duration: 300, delay: 140, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
        : { ...timing, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' };
      const fit = label.animate([{ width: `${from}px` }, { width: `${to}px` }], { ...fitTiming, fill: 'both' });
      // The tint stays tied to its half while the arrow moves: no glide of its own meanwhile
      root.classList.remove('is-gliding');
      const id = ++rolls;
      const done = () => {
        prev.remove();
        fit.cancel();
        if (id === rolls && !signal.aborted) root.classList.add('is-gliding');
      };
      prev.animate([{ transform: 'none' }, { transform: 'translateY(-110%)' }], { ...timing, fill: 'forwards' }).finished.then(done, done);
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
        const box = root.getBoundingClientRect();
        const height = menu.offsetHeight + 8;
        const above = box.bottom + height > innerHeight - 8 && box.top - height > 8;
        // A closed menu that changes side gets there at once, so it always unrolls from the button
        if (above !== root.classList.contains('is-above')) {
          menu.style.transition = 'none';
          root.classList.toggle('is-above', above);
          void menu.offsetWidth;
          menu.style.transition = '';
        }
        // Under the arrow, its right edges lined up; no room on the left: from the button's left
        // edge, moved back in if it would cross the right edge of the screen. Screen pixels
        // divided by the button's scale (a parent enlarged by transform)
        const scale = box.width / root.offsetWidth || 1;
        const width = menu.offsetWidth * scale;
        const start = box.right - width < 8;
        root.classList.toggle('is-start', start);
        // (the page's width, not innerWidth: on a phone it grows with whatever overflows)
        const over = start ? Math.max(0, box.left + width - (document.documentElement.clientWidth - 8)) : 0;
        root.style.setProperty('--kz-split-shift', `${-Math.min(over, Math.max(0, box.left - 8)) / scale}px`);
        root.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
        tintOn(toggle);
      }
      const checked = items.find((item) => item.getAttribute('aria-checked') === 'true');
      if (which === 'first') focusItem(checked || items[0]);
      else if (which === 'last') focusItem(items[items.length - 1]);
      else light(null);
    };

    const close = (refocus = false) => {
      if (!isOpen()) return;
      root.classList.remove('is-open', 'is-picking');
      toggle.setAttribute('aria-expanded', 'false');
      light(null);
      if (refocus) toggle.focus();
      // The tint goes to the half under the pointer, or leaves with it
      const under = [main, toggle].find((half) => half.matches(':hover'));
      if (under) tintOn(under);
      else if (!root.matches(':hover')) tintOff();
    };

    const pick = (item) => {
      if (item.getAttribute('aria-disabled') === 'true') return;
      const value = valueOf(item);
      if (item.getAttribute('role') === 'menuitemradio') {
        items.forEach((other) => other.getAttribute('role') === 'menuitemradio' && other.setAttribute('aria-checked', String(other === item)));
        if (label) roll(item.firstChild.textContent.trim());
        main.value = value;
      }
      root.dispatchEvent(new CustomEvent('kodza:select', { detail: { item, value }, bubbles: true }));
      light(item);
      root.classList.add('is-picking');
      setTimeout(() => !signal.aborted && close(true), reduceMotion ? 0 : 320);
    };

    [main, toggle].forEach((half) => half.addEventListener('pointerenter', () => tintOn(isOpen() ? toggle : half), { signal }));
    root.addEventListener('pointerleave', () => !isOpen() && tintOff(), { signal });
    menu.addEventListener('pointerenter', () => tintOn(toggle), { signal });

    toggle.addEventListener('click', () => (isOpen() ? close() : open()), { signal });
    toggle.addEventListener('keydown', (event) => {
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
      if (menu.contains(document.activeElement)) menu.focus({ preventScroll: true });
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

    // (the main half is inside the root too: doing the action closes the menu as well)
    document.addEventListener('pointerdown', (event) => {
      if (isOpen() && (!root.contains(event.target) || main.contains(event.target))) close();
    }, { signal });
    // Escape closes it wherever the focus is: opened with a click, it stays on the arrow
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
