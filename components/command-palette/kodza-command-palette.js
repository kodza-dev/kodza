// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Command Palette
// Opens the dialog (button or ⌘K / Ctrl K, for the first palette of the page), filters the
// options as you type (letters in order, not necessarily side by side), keeps one option
// active for the arrow keys, and fires "kodza:command" with { value } when one is picked.
(() => {
  const SELECTOR = '.kodza-command';
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

  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  let uid = 0;
  let shortcutTaken = false;

  // The positions of the query's letters in the text, in order, or null
  const match = (text, query) => {
    const hits = [];
    let from = 0;
    for (const char of query) {
      const at = text.indexOf(char, from);
      if (at < 0) return null;
      hits.push(at);
      from = at + 1;
    }
    return hits;
  };

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const trigger = root.querySelector('.kodza-command__trigger');
    const dialog = root.querySelector('.kodza-command__dialog');
    holdPage(dialog, signal);
    const input = root.querySelector('.kodza-command__input');
    const list = root.querySelector('.kodza-command__list');
    const empty = root.querySelector('.kodza-command__empty');
    if (!trigger || !dialog || !input || !list) return;
    const groups = [...list.querySelectorAll('.kodza-command__group')];
    const options = [...list.querySelectorAll('.kodza-command__option')];
    const labels = new Map(options.map((option) => [option, option.querySelector('.kodza-command__text') || option]));
    const texts = new Map(options.map((option) => [option, labels.get(option).textContent]));
    const duration = reduceMotion ? 0 : parseFloat(getComputedStyle(root).getPropertyValue('--kz-cmdk-duration')) * 1000 || 280;

    // ids for the combobox wiring, made here so the copied HTML has none
    const prefix = `kodza-command-${++uid}`;
    list.id = `${prefix}-list`;
    options.forEach((option, i) => (option.id = `${prefix}-option-${i}`));
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-expanded', 'true');
    input.setAttribute('aria-controls', list.id);
    input.setAttribute('aria-autocomplete', 'list');

    if (!isMac) root.querySelectorAll('.kodza-command__shortcut').forEach((kbd) => (kbd.textContent = 'Ctrl K'));

    const highlight = document.createElement('span');
    highlight.className = 'kodza-command__highlight';
    highlight.setAttribute('aria-hidden', 'true');
    list.prepend(highlight);

    let active = null;
    const visible = () => options.filter((option) => !option.hidden);

    const activate = (option, scroll = true) => {
      options.forEach((other) => other.setAttribute('aria-selected', String(other === option)));
      active = option;
      if (!option) {
        input.removeAttribute('aria-activedescendant');
        list.style.setProperty('--kz-hl-on', 0);
        return;
      }
      input.setAttribute('aria-activedescendant', option.id);
      list.style.setProperty('--kz-hl-y', `${option.offsetTop}px`);
      list.style.setProperty('--kz-hl-h', `${option.offsetHeight}px`);
      list.style.setProperty('--kz-hl-on', 1);
      if (scroll) option.scrollIntoView({ block: 'nearest' });
    };

    const body = root.querySelector('.kodza-command__body');
    let resize = null;
    const filter = (animate = false) => {
      const from = body && animate ? body.offsetHeight : 0;
      const query = input.value.trim().toLowerCase();
      options.forEach((option) => {
        const text = texts.get(option);
        const hits = query ? match(text.toLowerCase(), query) : [];
        option.hidden = hits === null;
        // Underline the matched letters
        const label = labels.get(option);
        if (!hits || !hits.length) {
          label.textContent = text;
          return;
        }
        const parts = [];
        let last = 0;
        hits.forEach((at) => {
          if (at > last) parts.push(text.slice(last, at));
          const mark = document.createElement('mark');
          mark.textContent = text[at];
          parts.push(mark);
          last = at + 1;
        });
        parts.push(text.slice(last));
        label.replaceChildren(...parts);
      });
      groups.forEach((group) => (group.hidden = !group.querySelector('.kodza-command__option:not([hidden])')));
      const shown = visible();
      if (empty) empty.hidden = shown.length > 0;
      list.hidden = !shown.length;
      activate(shown[0] || null);
      // The box grows or shrinks to the new results instead of jumping
      if (body && animate && !reduceMotion) {
        resize?.cancel();
        const to = body.offsetHeight;
        if (Math.abs(to - from) > 1) resize = body.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 240, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      }
    };

    let closing = 0;
    const open = () => {
      // Reopened while it was closing: it simply comes back
      if (dialog.open) {
        clearTimeout(closing);
        dialog.classList.add('is-open');
        input.focus();
        return;
      }
      input.value = '';
      filter();
      dialog.showModal();
      requestAnimationFrame(() => {
        dialog.classList.add('is-open');
        activate(visible()[0] || null, false);
      });
      input.focus();
    };

    const close = () => {
      if (!dialog.open || !dialog.classList.contains('is-open')) return;
      dialog.classList.remove('is-open');
      clearTimeout(closing);
      closing = setTimeout(() => {
        dialog.close();
        trigger.focus({ preventScroll: true });
      }, duration);
    };

    const pick = (option) => {
      if (!option) return;
      root.dispatchEvent(new CustomEvent('kodza:command', { detail: { value: texts.get(option) }, bubbles: true }));
      close();
    };

    trigger.addEventListener('click', open, { signal });
    input.addEventListener('input', () => filter(true), { signal });
    input.addEventListener('keydown', (event) => {
      const shown = visible();
      const index = shown.indexOf(active);
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (shown.length) activate(shown[(index + (event.key === 'ArrowDown' ? 1 : -1) + shown.length) % shown.length]);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        pick(active);
      }
    }, { signal });
    options.forEach((option) => {
      option.addEventListener('pointermove', () => active !== option && activate(option, false), { signal });
      option.addEventListener('click', () => pick(option), { signal });
    });

    // Escape and clicks on the backdrop close it, with the animation
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      close();
    }, { signal });
    dialog.addEventListener('click', (event) => {
      const box = dialog.getBoundingClientRect();
      const inside = event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
      if (!inside) close();
    }, { signal });

    if (!shortcutTaken) {
      shortcutTaken = true;
      document.addEventListener('keydown', (event) => {
        if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          dialog.open ? close() : open();
        }
      }, { signal });
      // Stopped, it hands the shortcut to the next palette started
      signal.addEventListener('abort', () => (shortcutTaken = false));
    }

    // Stopped while open: the page is released at once
    signal.addEventListener('abort', () => {
      clearTimeout(closing);
      if (dialog.open) dialog.close();
    });
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
