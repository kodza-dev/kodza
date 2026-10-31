// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Search Autocomplete
// Turns the field into an ARIA combobox: reads the suggestions from its own <datalist> (or from
// root.kodzaSearch(query), an async function returning [{ label, meta }]), filters them by
// letters in order, underlines the matches, groups them by meta, and lets the arrows, Enter and
// Escape drive. "/" focuses the first search of the page. Fires "kodza:search" with { value }.
(() => {
  const SELECTOR = '.kodza-search';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cross = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 3l6 6M9 3 3 9"/></svg>';
  let uid = 0;
  let slashTaken = false;

  // Positions of the query's letters in the text, in order, or null
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
    const input = root.querySelector('.kodza-search__input');
    const box = root.querySelector('.kodza-search__box');
    const datalist = root.querySelector('.kodza-search__options');
    if (!input || !box) return;
    const id = `kodza-search-${++uid}`;
    const local = datalist ? [...datalist.options].map((option) => ({ label: option.value, meta: option.label || '' })) : [];
    // The custom list replaces the browser's own
    input.removeAttribute('list');

    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'kodza-search__clear';
    clear.tabIndex = -1;
    clear.setAttribute('aria-label', 'Clear the search');
    clear.innerHTML = cross;
    box.append(clear);

    const panel = document.createElement('div');
    panel.className = 'kodza-search__panel';
    const list = document.createElement('ul');
    list.className = 'kodza-search__list';
    list.id = `${id}-list`;
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', 'Suggestions');
    // A list that scrolls is reachable with Tab in Chrome: here the arrows drive it, from the field
    list.tabIndex = -1;
    panel.append(list);
    const live = Object.assign(document.createElement('span'), { className: 'kodza-search__live' });
    live.setAttribute('aria-live', 'polite');
    root.append(panel, live);

    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', list.id);
    input.setAttribute('aria-autocomplete', 'list');

    let items = [];
    let active = null;
    let resize = null;
    let token = 0;

    const light = (entry, scroll = true) => {
      active = entry;
      items.forEach((it) => it.el.setAttribute('aria-selected', String(it === entry)));
      if (!entry) {
        input.removeAttribute('aria-activedescendant');
        return list.style.setProperty('--kz-hl-on', 0);
      }
      input.setAttribute('aria-activedescendant', entry.el.id);
      list.style.setProperty('--kz-hl-y', `${entry.el.offsetTop}px`);
      list.style.setProperty('--kz-hl-h', `${entry.el.offsetHeight}px`);
      list.style.setProperty('--kz-hl-on', 1);
      // Scroll the list only (scrollIntoView would also nudge the page), with the row's group
      // heading when it opens the group, and the list's own padding above the very first row
      if (scroll) {
        const prev = entry.el.previousElementSibling;
        const first = prev?.classList.contains('kodza-search__group') ? prev : entry.el;
        const top = first.previousElementSibling?.classList.contains('kodza-search__highlight') ? 0 : first.offsetTop;
        const bottom = entry.el.offsetTop + entry.el.offsetHeight;
        if (top < list.scrollTop) list.scrollTop = top;
        else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
      }
    };

    // Draw the results, grouped by meta; the panel eases to its new height
    const draw = (results, query) => {
      const from = panel.offsetHeight;
      const highlight = Object.assign(document.createElement('li'), { className: 'kodza-search__highlight' });
      highlight.setAttribute('role', 'presentation');
      list.replaceChildren(highlight);
      items = [];
      const groups = new Map();
      results.forEach((result) => {
        const key = result.meta || '';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(result);
      });
      groups.forEach((group, meta) => {
        if (meta && groups.size > 1) {
          const head = Object.assign(document.createElement('li'), { className: 'kodza-search__group', textContent: meta });
          head.setAttribute('role', 'presentation');
          list.append(head);
        }
        group.forEach((result) => {
          const el = document.createElement('li');
          el.className = 'kodza-search__option';
          el.id = `${id}-option-${items.length}`;
          el.setAttribute('role', 'option');
          const label = document.createElement('span');
          const hits = query ? match(result.label.toLowerCase(), query) || [] : [];
          let last = 0;
          hits.forEach((at) => {
            label.append(result.label.slice(last, at), Object.assign(document.createElement('mark'), { textContent: result.label[at] }));
            last = at + 1;
          });
          label.append(result.label.slice(last));
          // The meta is said once by the group heading; alone, each row says it
          el.append(label, Object.assign(document.createElement('span'), { className: 'kodza-search__meta', textContent: groups.size > 1 ? '' : result.meta || '' }));
          const entry = { el, result };
          el.addEventListener('pointermove', () => active !== entry && light(entry, false), { signal });
          el.addEventListener('click', () => choose(entry), { signal });
          list.append(el);
          items.push(entry);
        });
      });
      if (!results.length) {
        const empty = Object.assign(document.createElement('li'), { className: 'kodza-search__empty', textContent: 'Nothing found. Not even a bug.' });
        empty.setAttribute('role', 'presentation');
        list.append(empty);
      }
      live.textContent = results.length ? `${results.length} suggestion${results.length > 1 ? 's' : ''}` : 'No suggestions';
      light(query ? items[0] || null : null, false);
      if (!reduceMotion && root.classList.contains('is-open')) {
        resize?.cancel();
        const to = panel.offsetHeight;
        if (Math.abs(to - from) > 1) resize = panel.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 260, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      }
    };

    const search = async () => {
      const query = input.value.trim().toLowerCase();
      root.classList.toggle('has-value', input.value !== '');
      const mine = ++token;
      let results;
      if (typeof root.kodzaSearch === 'function') {
        try {
          results = await root.kodzaSearch(query);
        } catch {
          results = [];
        }
        if (mine !== token) return;
      } else {
        results = query ? local.filter((item) => match(item.label.toLowerCase(), query)) : local.slice(0, 5);
      }
      draw(results, query);
    };

    const open = () => {
      if (root.classList.contains('is-open')) return;
      search();
      // Not enough room below and more above: the suggestions open upwards. A closed panel that
      // changes side gets there at once, so it always unrolls from the field
      const field = box.getBoundingClientRect();
      const above = field.bottom + Math.min(332, panel.scrollHeight) + 16 > innerHeight && field.top > innerHeight / 2;
      if (above !== root.classList.contains('is-above')) {
        panel.style.transition = 'none';
        root.classList.toggle('is-above', above);
        void panel.offsetWidth;
        panel.style.transition = '';
      }
      root.classList.add('is-open');
      input.setAttribute('aria-expanded', 'true');
    };
    const close = () => {
      root.classList.remove('is-open');
      input.setAttribute('aria-expanded', 'false');
      light(null);
    };
    const choose = (entry) => {
      if (!entry) return;
      input.value = entry.result.label;
      root.classList.add('has-value');
      close();
      root.dispatchEvent(new CustomEvent('kodza:search', { detail: { value: entry.result.label, item: entry.result }, bubbles: true }));
    };

    input.addEventListener('focus', open, { signal });
    input.addEventListener('input', () => {
      if (!root.classList.contains('is-open')) open();
      else search();
    }, { signal });
    input.addEventListener('keydown', (event) => {
      const index = items.indexOf(active);
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        open();
        // From nothing highlighted, the first one down or the last one up
        const to = index < 0 ? (event.key === 'ArrowDown' ? 0 : -1) : index + (event.key === 'ArrowDown' ? 1 : -1);
        if (items.length) light(items[(to + items.length) % items.length]);
      } else if (event.key === 'Enter') {
        if (active && root.classList.contains('is-open')) {
          event.preventDefault();
          choose(active);
        }
      } else if (event.key === 'Escape') {
        if (root.classList.contains('is-open')) close();
        else {
          input.value = '';
          root.classList.remove('has-value');
        }
      } else if (event.key === 'Tab') {
        close();
      }
    }, { signal });
    clear.addEventListener('click', () => {
      input.value = '';
      root.classList.remove('has-value');
      input.focus();
      search();
    }, { signal });
    panel.addEventListener('mousedown', (event) => event.preventDefault(), { signal });
    document.addEventListener('pointerdown', (event) => !root.contains(event.target) && close(), { signal });

    if (!slashTaken) {
      slashTaken = true;
      document.addEventListener('keydown', (event) => {
        if (event.key !== '/' || event.target.closest?.('input, textarea, select, [contenteditable]')) return;
        event.preventDefault();
        input.focus();
      }, { signal });
      // Stopped, it hands "/" to the next search started
      signal.addEventListener('abort', () => (slashTaken = false));
    }

    root.classList.toggle('has-value', input.value !== '');
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
