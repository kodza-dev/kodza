// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Select
// Builds a listbox over the real <select> (options, groups, disabled ones), keeps both in step
// and fires "change" on the real one, so forms and frameworks see an ordinary select. Keyboard
// as in the ARIA "select-only combobox" pattern: the focus stays on the field, arrows move,
// letters jump, Enter picks, Escape closes. Options changed by the page (counts, disabled
// ones, a new list) are read again; after setting .value from a script, fire "change" on it.
(() => {
  const SELECTOR = '.kodza-select';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tick = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" pathLength="1"/></svg>';
  const chevron = '<svg class="kodza-select__chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6.5 8 10.5l4-4"/></svg>';
  let uid = 0;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const native = root.querySelector('.kodza-select__native');
    const label = root.querySelector('.kodza-select__label');
    if (!native) return;
    const id = `kodza-select-${++uid}`;

    // The field: a button that says the current value
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'kodza-select__trigger';
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', `${id}-list`);
    if (label) {
      label.id = `${id}-label`;
      trigger.setAttribute('aria-labelledby', `${id}-label`);
    }
    const value = document.createElement('span');
    value.className = 'kodza-select__value';
    // Every option, invisible, under the value: the field is as wide as the longest one, so it
    // never changes width when the value rolls (the inline version sizes itself on it)
    const sizes = document.createElement('span');
    sizes.className = 'kodza-select__sizes';
    sizes.setAttribute('aria-hidden', 'true');
    value.append(sizes);
    trigger.append(value);
    trigger.insertAdjacentHTML('beforeend', chevron);

    // The list, from the real options (built again whenever the page changes them)
    const list = document.createElement('ul');
    list.className = 'kodza-select__list';
    list.id = `${id}-list`;
    list.setAttribute('role', 'listbox');
    if (label) list.setAttribute('aria-labelledby', `${id}-label`);
    const highlight = document.createElement('li');
    highlight.className = 'kodza-select__highlight';
    highlight.setAttribute('role', 'presentation');
    list.append(highlight);
    let options = [];
    const entries = new Map();
    const build = () => {
      options = [];
      entries.clear();
      [...list.children].forEach((child) => child !== highlight && child.remove());
      sizes.replaceChildren();
      [...native.children].forEach((child) => {
        const group = child.tagName === 'OPTGROUP' ? child : null;
        if (group) {
          const head = document.createElement('li');
          head.className = 'kodza-select__group';
          head.setAttribute('role', 'presentation');
          head.textContent = group.label;
          list.append(head);
        }
        (group ? [...group.children] : [child]).forEach((option) => {
          if (option.hidden) return; // the placeholder: "nothing chosen yet" is not a choice
          const item = document.createElement('li');
          item.className = 'kodza-select__option';
          item.id = `${id}-option-${options.length}`;
          item.setAttribute('role', 'option');
          item.innerHTML = tick;
          item.append(option.textContent);
          if (option.disabled || group?.disabled) item.setAttribute('aria-disabled', 'true');
          list.append(item);
          const entry = { option, item };
          options.push(entry);
          entries.set(item, entry);
          sizes.append(Object.assign(document.createElement('span'), { textContent: option.textContent }));
        });
      });
    };
    build();
    native.after(trigger, list);
    native.tabIndex = -1;
    native.setAttribute('aria-hidden', 'true');

    const enabled = () => options.filter(({ item }) => item.getAttribute('aria-disabled') !== 'true');
    const isOpen = () => root.classList.contains('is-open');
    let active = null;

    // The value rolls to the new choice
    let shown = null;
    const show = (text, animate) => {
      const prev = shown;
      if (prev && prev.textContent === text) return;
      const span = Object.assign(document.createElement('span'), { textContent: text });
      value.append(span);
      shown = span;
      if (!prev) return;
      if (!animate || reduceMotion) return prev.remove();
      const timing = { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
      prev.animate([{ transform: 'none' }, { transform: 'translateY(-110%)' }], { ...timing, fill: 'forwards' }).finished.then(() => prev.remove());
      span.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], timing);
    };

    const sync = (animate) => {
      options.forEach(({ option, item }) => item.setAttribute('aria-selected', String(option.selected)));
      // An empty, hidden first option leaves the field empty: the label sits inside, as in Text Field
      const chosen = native.selectedOptions[0];
      const empty = !chosen || chosen.hidden || !chosen.textContent.trim();
      root.classList.toggle('is-empty', empty);
      show(empty ? '' : chosen.textContent, animate);
    };

    const light = (entry, scroll = true) => {
      active = entry;
      if (!entry) {
        trigger.removeAttribute('aria-activedescendant');
        return list.style.setProperty('--kz-hl-on', 0);
      }
      trigger.setAttribute('aria-activedescendant', entry.item.id);
      list.style.setProperty('--kz-hl-y', `${entry.item.offsetTop}px`);
      list.style.setProperty('--kz-hl-h', `${entry.item.offsetHeight}px`);
      list.style.setProperty('--kz-hl-on', 1);
      // Scroll the list only (scrollIntoView would also nudge the page), with the option's group
      // heading when it opens the group, and the list's own padding above the very first row
      if (scroll) {
        const prev = entry.item.previousElementSibling;
        const first = prev?.classList.contains('kodza-select__group') ? prev : entry.item;
        const top = first.previousElementSibling === highlight ? 0 : first.offsetTop;
        const bottom = entry.item.offsetTop + entry.item.offsetHeight;
        if (top < list.scrollTop) list.scrollTop = top;
        else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
      }
    };

    const open = () => {
      if (isOpen()) return;
      // Not enough room below and more above: the list opens upwards. A closed list that changes
      // side gets there at once, so it always unrolls from the field
      const box = trigger.getBoundingClientRect();
      const above = box.bottom + Math.min(280, list.scrollHeight) + 16 > innerHeight && box.top > innerHeight / 2;
      if (above !== root.classList.contains('is-above')) {
        list.style.transition = 'none';
        root.classList.toggle('is-above', above);
        void list.offsetWidth;
        list.style.transition = '';
      }
      root.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      light(options.find(({ option }) => option.selected) || enabled()[0]);
    };

    const close = () => {
      if (!isOpen()) return;
      root.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      light(null);
    };

    const pick = (entry) => {
      if (!entry || entry.item.getAttribute('aria-disabled') === 'true') return;
      const changed = !entry.option.selected;
      entry.option.selected = true;
      sync(true);
      close();
      if (changed) native.dispatchEvent(new Event('change', { bubbles: true }));
    };

    // Typing a few letters jumps to the first matching option
    let typed = '';
    let typedTimer = 0;
    const typeAhead = (char) => {
      clearTimeout(typedTimer);
      typed += char.toLowerCase();
      typedTimer = setTimeout(() => (typed = ''), 600);
      const pool = enabled();
      const start = active ? pool.indexOf(active) + (typed.length === 1 ? 1 : 0) : 0;
      const order = [...pool.slice(start), ...pool.slice(0, start)];
      const match = order.find(({ item }) => item.textContent.trim().toLowerCase().startsWith(typed));
      if (!match) return;
      if (isOpen()) light(match);
      else pick(match);
    };

    trigger.addEventListener('click', () => (isOpen() ? close() : open()), { signal });
    trigger.addEventListener('keydown', (event) => {
      const pool = enabled();
      const index = pool.indexOf(active);
      if (!isOpen()) {
        if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
          event.preventDefault();
          open();
        } else if (event.key.length === 1 && /\S/.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
          typeAhead(event.key);
        }
        return;
      }
      const moves = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: pool.length - 1, PageDown: index + 5, PageUp: index - 5 };
      if (event.key in moves) {
        event.preventDefault();
        light(pool[Math.max(0, Math.min(pool.length - 1, moves[event.key]))]);
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        pick(active);
      } else if (event.key === 'Tab') {
        pick(active);
      } else if (event.key.length === 1 && /\S/.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
        typeAhead(event.key);
      }
    }, { signal });

    const entryAt = (event) => entries.get(event.target.closest?.('.kodza-select__option'));
    list.addEventListener('pointermove', (event) => {
      const entry = entryAt(event);
      if (entry && active !== entry && entry.item.getAttribute('aria-disabled') !== 'true') light(entry, false);
    }, { signal });
    list.addEventListener('click', (event) => pick(entryAt(event)), { signal });
    // Keep the list from stealing the focus from the field, and the wrapping <label> from
    // sending clicks to the hidden select: a click on the label text focuses the field
    list.addEventListener('mousedown', (event) => event.preventDefault(), { signal });
    root.addEventListener('click', (event) => {
      if (trigger.contains(event.target)) return;
      event.preventDefault();
      if (!list.contains(event.target)) trigger.focus();
    }, { signal });
    document.addEventListener('pointerdown', (event) => !root.contains(event.target) && close(), { signal });
    // Escape closes it wherever the focus is: opened with a click, it stays on the field
    // (Chrome) or on the page (Safari)
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !isOpen()) return;
      event.preventDefault();
      close();
      trigger.focus();
    }, { signal });
    // The real select changed from elsewhere (a form reset, a script): follow it
    native.addEventListener('change', () => sync(true), { signal });
    native.form?.addEventListener('reset', () => setTimeout(() => sync(true)), { signal });

    // The page changed the options (counts, disabled ones, a new list): build the list again,
    // keep the highlight on the same option, and show the value without a roll
    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        if (signal.aborted) return;
        const was = active?.option;
        build();
        sync(false);
        if (isOpen()) light(options.find(({ option }) => option === was) || options.find(({ option }) => option.selected) || enabled()[0], false);
      });
    });
    observer.observe(native, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['disabled', 'hidden', 'label'] });
    signal.addEventListener('abort', () => observer.disconnect());

    // Inline version: the value starts right after the label, whatever its length
    if (label && root.classList.contains('kodza-select--inline')) {
      const inset = () => root.style.setProperty('--kz-select-inset', `${Math.ceil(label.offsetWidth)}px`);
      inset();
      const sizer = new ResizeObserver(inset);
      sizer.observe(label);
      signal.addEventListener('abort', () => sizer.disconnect());
    }

    sync(false);
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
