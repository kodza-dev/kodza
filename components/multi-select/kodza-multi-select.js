// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Multi Select
// Builds a field of tags and a filterable list over the real <select multiple>, and keeps both in
// step (firing "change" on the real one). In the filter input: arrows move, Enter toggles,
// Escape closes, Backspace on an empty input removes the last tag. Removals are animated: the
// tag shrinks away, the others glide into place, the field eases to its new height.
(() => {
  const SELECTOR = '.kodza-multi';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const tick = '<svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" pathLength="1"/></svg>';
  const cross = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 3l6 6M9 3 3 9"/></svg>';
  let uid = 0;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const native = root.querySelector('.kodza-multi__native');
    const label = root.querySelector('.kodza-multi__label');
    if (!native) return;
    const id = `kodza-multi-${++uid}`;
    if (label) label.id = `${id}-label`;

    const field = document.createElement('div');
    field.className = 'kodza-multi__field';
    const input = document.createElement('input');
    input.className = 'kodza-multi__input';
    input.type = 'text';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.placeholder = root.dataset.placeholder || 'Add…';
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', `${id}-list`);
    input.setAttribute('aria-autocomplete', 'list');
    if (label) input.setAttribute('aria-labelledby', `${id}-label`);
    field.append(input);
    field.insertAdjacentHTML('beforeend', '<svg class="kodza-multi__chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6.5 8 10.5l4-4"/></svg>');

    const list = document.createElement('ul');
    list.className = 'kodza-multi__list';
    list.id = `${id}-list`;
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-multiselectable', 'true');
    if (label) list.setAttribute('aria-labelledby', `${id}-label`);
    const highlight = Object.assign(document.createElement('li'), { className: 'kodza-multi__highlight' });
    highlight.setAttribute('role', 'presentation');
    const empty = Object.assign(document.createElement('li'), { className: 'kodza-multi__empty', textContent: 'Nothing matches. Yet.', hidden: true });
    empty.setAttribute('role', 'presentation');
    list.append(highlight);
    const entries = [...native.options].map((option, i) => {
      const item = document.createElement('li');
      item.className = 'kodza-multi__option';
      item.id = `${id}-option-${i}`;
      item.setAttribute('role', 'option');
      item.innerHTML = `<span class="kodza-multi__box" aria-hidden="true">${tick}</span><span class="kodza-multi__text"></span>`;
      item.querySelector('.kodza-multi__text').textContent = option.textContent;
      if (option.disabled) item.setAttribute('aria-disabled', 'true');
      list.append(item);
      return { option, item, text: option.textContent, tag: null };
    });
    list.append(empty);
    native.after(field, list);
    native.tabIndex = -1;
    native.setAttribute('aria-hidden', 'true');

    const live = Object.assign(document.createElement('span'), { className: 'kodza-multi__live' });
    live.setAttribute('aria-live', 'polite');
    root.append(live);

    const isOpen = () => root.classList.contains('is-open');
    const shown = () => entries.filter(({ item }) => !item.hidden && item.getAttribute('aria-disabled') !== 'true');
    let active = null;

    const light = (entry, scroll = true) => {
      active = entry;
      if (!entry) {
        input.removeAttribute('aria-activedescendant');
        return list.style.setProperty('--kz-hl-on', 0);
      }
      input.setAttribute('aria-activedescendant', entry.item.id);
      list.style.setProperty('--kz-hl-y', `${entry.item.offsetTop}px`);
      list.style.setProperty('--kz-hl-h', `${entry.item.offsetHeight}px`);
      list.style.setProperty('--kz-hl-on', 1);
      // Scroll the list only (scrollIntoView would also nudge the page), with the list's own
      // padding above the first row still shown (rows filtered out above it don't count)
      if (scroll) {
        let prev = entry.item.previousElementSibling;
        while (prev?.hidden) prev = prev.previousElementSibling;
        const top = prev === highlight ? 0 : entry.item.offsetTop;
        const bottom = entry.item.offsetTop + entry.item.offsetHeight;
        if (top < list.scrollTop) list.scrollTop = top;
        else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
      }
    };

    // Everything that moves in the field, measured before and after a change, glides
    const glide = (change) => {
      const before = new Map([...field.children].map((el) => [el, el.getBoundingClientRect()]));
      const height = field.offsetHeight;
      change();
      if (reduceMotion) return;
      // Screen pixels back to the field's own (a parent may be scaled with a transform)
      const k = field.getBoundingClientRect().width / field.offsetWidth || 1;
      [...field.children].forEach((el) => {
        const a = before.get(el);
        if (!a || el.classList.contains('is-new')) return;
        const b = el.getBoundingClientRect();
        const dx = (a.left - b.left) / k;
        const dy = (a.top - b.top) / k;
        if (Math.abs(dx) + Math.abs(dy) > 0.5) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 420, easing: ease });
      });
      const to = field.offsetHeight;
      if (to !== height) field.animate([{ height: `${height}px` }, { height: `${to}px` }], { duration: 420, easing: ease });
    };

    const makeTag = (entry, fresh) => {
      const tag = document.createElement('span');
      tag.className = `kodza-multi__tag${fresh && !reduceMotion ? ' is-new' : ''}`;
      tag.append(entry.text);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'kodza-multi__remove';
      remove.tabIndex = -1;
      remove.setAttribute('aria-label', `Remove ${entry.text}`);
      remove.innerHTML = cross;
      remove.addEventListener('click', (event) => {
        event.stopPropagation();
        toggle(entry, false);
        input.focus();
      }, { signal });
      tag.append(remove);
      tag.addEventListener('animationend', () => tag.classList.remove('is-new'), { signal });
      return tag;
    };

    const toggle = (entry, on = !entry.option.selected) => {
      if (!entry || entry.item.getAttribute('aria-disabled') === 'true' || entry.option.selected === on) return;
      entry.option.selected = on;
      entry.item.setAttribute('aria-selected', String(on));
      if (on) {
        entry.tag = makeTag(entry, true);
        glide(() => input.before(entry.tag));
      } else if (entry.tag) {
        const tag = entry.tag;
        entry.tag = null;
        const out = () => glide(() => tag.remove());
        if (reduceMotion) out();
        else tag.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(0.6)' }], { duration: 160, easing: 'ease-in', fill: 'forwards' }).finished.then(out);
      }
      live.textContent = `${entry.text} ${on ? 'added' : 'removed'}`;
      native.dispatchEvent(new Event('change', { bubbles: true }));
    };

    // Filter: letters anywhere in the name, underlined
    const filter = () => {
      const query = input.value.trim().toLowerCase();
      entries.forEach((entry) => {
        const at = query ? entry.text.toLowerCase().indexOf(query) : -1;
        entry.item.hidden = query !== '' && at < 0;
        const text = entry.item.querySelector('.kodza-multi__text');
        if (at < 0) return (text.textContent = entry.text);
        const mark = Object.assign(document.createElement('mark'), { textContent: entry.text.slice(at, at + query.length) });
        text.replaceChildren(entry.text.slice(0, at), mark, entry.text.slice(at + query.length));
      });
      empty.hidden = shown().length > 0;
      light(shown()[0] || null);
    };

    const open = () => {
      if (isOpen()) return;
      // Not enough room below and more above: the list opens upwards. A closed list that changes
      // side gets there at once, so it always unrolls from the field
      const box = field.getBoundingClientRect();
      const above = box.bottom + Math.min(272, list.scrollHeight) + 16 > innerHeight && box.top > innerHeight / 2;
      if (above !== root.classList.contains('is-above')) {
        list.style.transition = 'none';
        root.classList.toggle('is-above', above);
        void list.offsetWidth;
        list.style.transition = '';
      }
      root.classList.add('is-open');
      input.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(() => light(shown()[0] || null, false));
    };
    const close = () => {
      if (!isOpen()) return;
      root.classList.remove('is-open');
      input.setAttribute('aria-expanded', 'false');
      light(null);
    };

    input.addEventListener('focus', open, { signal });
    input.addEventListener('input', () => {
      open();
      filter();
    }, { signal });
    input.addEventListener('keydown', (event) => {
      const pool = shown();
      const index = pool.indexOf(active);
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        open();
        if (pool.length) light(pool[(index + (event.key === 'ArrowDown' ? 1 : -1) + pool.length) % pool.length]);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (isOpen() && active) toggle(active);
      } else if (event.key === 'Escape') {
        close();
      } else if (event.key === 'Backspace' && input.value === '') {
        // The last tag shown (they line up in the order they were picked, not the list's)
        const owner = new Map(entries.filter((entry) => entry.tag).map((entry) => [entry.tag, entry]));
        const last = [...field.querySelectorAll('.kodza-multi__tag')].reverse().map((tag) => owner.get(tag)).find(Boolean);
        if (last) toggle(last, false);
      } else if (event.key === 'Tab') {
        close();
      }
    }, { signal });

    entries.forEach((entry) => {
      entry.item.addEventListener('pointermove', () => active !== entry && entry.item.getAttribute('aria-disabled') !== 'true' && light(entry, false), { signal });
      entry.item.addEventListener('click', () => {
        toggle(entry);
        input.focus();
      }, { signal });
    });
    list.addEventListener('mousedown', (event) => event.preventDefault(), { signal });
    root.addEventListener('click', (event) => {
      if (event.target === input) return;
      event.preventDefault();
      if (!list.contains(event.target)) input.focus();
    }, { signal });
    document.addEventListener('pointerdown', (event) => !root.contains(event.target) && close(), { signal });

    // The tags of the options already chosen
    entries.forEach((entry) => {
      entry.item.setAttribute('aria-selected', String(entry.option.selected));
      if (entry.option.selected) input.before((entry.tag = makeTag(entry, false)));
    });
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
