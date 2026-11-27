// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — File Tree
// Builds the rows from the nested list (icons, marks, notes), folds folders with their height,
// rolls the path of the file you point at into the bar, copies it, and answers the keyboard like
// a file explorer. Settings: the --kz-file-tree-* variables in the CSS, data-root and data-text-*
// on the root, and the constants below.
(() => {
  const SELECTOR = '[data-kodza-file-tree]';
  const FOLD = 420; // ms, a folder opening or closing
  const ENTER = 380; // ms, the rows of a folder coming in as it opens
  const CASCADE = 22; // ms between two rows coming in
  const SHIFT = 6; // px, how far above they come from
  const ROLL = 380; // ms, the part of the path that changes
  const POINT_DELAY = 80; // ms on a row before the bar shows its path, so a sweep of the pointer stays calm
  const COPIED = 1600; // ms the button says Copied (reading time: not sped up by the pace)
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const FOLD_EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';
  // Words the script writes, each one replaced by data-text-<key> on the root
  const WORDS = {
    copy: 'Copy',
    copied: 'Copied',
    failed: 'Failed',
    copyLabel: 'Copy path',
    new: 'new',
    edit: 'edited',
    removed: 'removed',
  };
  // A sign in front of a name marks it like data-mark does: "+ theme.json"
  const SIGNS = { '+': 'new', '~': 'edit', '-': 'removed', '−': 'removed' };
  const MARK_SIGN = { new: '+', edit: '~', removed: '−' };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover)');
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };

  // 16 px icons drawn with the text colour, one per kind of file
  const SVG = 'http://www.w3.org/2000/svg';
  const PAGE = 'M9 1.75H4.25a1 1 0 0 0-1 1v10.5a1 1 0 0 0 1 1h7.5a1 1 0 0 0 1-1V5.5z M9 1.75V5.5h3.75';
  const ICONS = {
    folder: 'M1.75 4.25a1.5 1.5 0 0 1 1.5-1.5h2.6l1.5 1.5h5.4a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5h-9.5a1.5 1.5 0 0 1-1.5-1.5z',
    open: 'M1.75 11.75v-7.5a1.5 1.5 0 0 1 1.5-1.5h2.6l1.5 1.5h4.4a1.5 1.5 0 0 1 1.5 1.5v1 M1.75 11.75l1.6-4.1a1.2 1.2 0 0 1 1.1-.65h9.2a.75.75 0 0 1 .7 1l-1.55 4.1a1.5 1.5 0 0 1-1.4.9h-8.15a1.5 1.5 0 0 1-1.5-1.25z',
    file: PAGE,
    code: `${PAGE} M6.75 8.5 5.5 9.75 6.75 11 M9.25 8.5l1.25 1.25L9.25 11`,
    data: `${PAGE} M6.75 8.25c-.6 0-.85.3-.85.8v.25c0 .4-.2.6-.65.6.45 0 .65.2.65.6v.25c0 .5.25.8.85.8 M9.25 8.25c.6 0 .85.3.85.8v.25c0 .4.2.6.65.6-.45 0-.65.2-.65.6v.25c0 .5-.25.8-.85.8`,
    style: `${PAGE} M6.6 8.25 6.1 11.75 M8.9 8.25l-.5 3.5 M5.4 9.25h4.2 M5.2 10.75h4.2`,
    image: `${PAGE} M4.9 12.25 7 9.6l1.4 1.4 1-1.05 1.7 2.3 M6.25 7.6a.6.6 0 1 0 0-.01`,
    text: `${PAGE} M5.5 8.5h5 M5.5 10.25h5 M5.5 12h3`,
  };
  const KINDS = {
    code: 'html htm php js mjs cjs ts tsx jsx vue svelte astro py rb go rs sh liquid twig',
    data: 'json jsonc yml yaml toml xml csv lock',
    style: 'css scss sass less',
    image: 'png jpg jpeg webp avif gif svg ico',
    text: 'md mdx txt log',
  };
  const kindOf = (name) => {
    const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
    return Object.keys(KINDS).find((kind) => KINDS[kind].split(' ').includes(ext)) || 'file';
  };
  const icon = (classes, d, box = 16) => {
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('class', classes);
    svg.setAttribute('viewBox', `0 0 ${box} ${box}`);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const path = document.createElementNS(SVG, 'path');
    path.setAttribute('d', d);
    svg.append(path);
    return svg;
  };

  async function writeText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
      document.body.append(area);
      area.select();
      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch {}
      area.remove();
      return ok;
    }
  }

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const list = root.querySelector(':scope > .kodza-file-tree__list');
    if (!list) return;
    const make = maker('kodza-file-tree');
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const base = (root.dataset.root || '').trim().replace(/\/+$/, '');

    const timers = new Set();
    const later = (fn, ms) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        fn();
      }, ms);
      timers.add(timer);
      return timer;
    };
    const running = new Set();
    signal.addEventListener('abort', () => {
      timers.forEach(clearTimeout);
      running.forEach((animation) => animation.cancel());
    });

    // The list as written: a <li> holding a list is a folder, its own text is its name, an <em>
    // is its note, data-mark (or a sign in front of the name) its mark
    const items = [];
    const build = (ul, parent, depth) => {
      const lis = [...ul.children].filter((el) => el.tagName === 'LI');
      lis.forEach((li, i) => {
        const nested = li.querySelector(':scope > ul, :scope > ol');
        const noteEl = li.querySelector(':scope > em');
        let text = '';
        li.childNodes.forEach((node) => {
          if (node !== nested && node !== noteEl) text += node.textContent;
        });
        text = text.trim().replace(/\s+/g, ' ');
        let mark = li.dataset.mark || '';
        const sign = text.match(/^([+~\-−])\s+/);
        if (sign) {
          mark = mark || SIGNS[sign[1]];
          text = text.slice(sign[0].length);
        }
        if (!MARK_SIGN[mark]) mark = '';
        const folder = !!nested || text.endsWith('/');
        const name = text.replace(/\/+$/, '');
        const note = noteEl ? noteEl.textContent.trim() : '';

        const row = make('div', 'row');
        if (nested) row.append(icon('kodza-file-tree__chev', 'M4.5 2.5 8 6l-3.5 3.5', 12));
        else row.append(make('span', 'gap'));
        const glyph = icon('kodza-file-tree__icon', ICONS[folder ? 'folder' : kindOf(name)]);
        row.append(glyph, make('span', 'name', null, name));
        if (note) row.append(make('span', 'note', null, note));
        if (mark) {
          const badge = make('span', `mark is-${mark}`);
          badge.append(make('span', 'sign', null, MARK_SIGN[mark]), make('span', 'word', null, word(mark)));
          row.append(badge);
        }

        li.replaceChildren(row, ...(nested ? [nested] : []));
        li.classList.add('kodza-file-tree__item');
        li.classList.toggle('is-removed', mark === 'removed');
        li.setAttribute('role', 'treeitem');
        li.setAttribute('aria-level', depth);
        li.setAttribute('aria-setsize', lis.length);
        li.setAttribute('aria-posinset', i + 1);
        li.setAttribute('aria-label', [name, note, mark && word(mark)].filter(Boolean).join(', '));
        li.tabIndex = -1;

        const item = { li, row, glyph, parent, depth, name, folder, ul: nested, open: false };
        item.path = [...(parent ? parent.path : []), name];
        if (nested) {
          nested.setAttribute('role', 'group');
          item.open = !li.hasAttribute('data-closed');
          li.setAttribute('aria-expanded', item.open);
          nested.hidden = !item.open;
          if (item.open) glyph.firstChild.setAttribute('d', ICONS.open);
        } else if (!folder) li.setAttribute('aria-selected', 'false');
        items.push(item);
        li.kzItem = item;
        if (nested) build(nested, item, depth + 1);
      });
    };
    build(list, null, 1);
    if (!items.length) return;
    list.setAttribute('role', 'tree');
    if (!list.hasAttribute('aria-label')) list.setAttribute('aria-label', base || 'Files');

    const shown = (item) => {
      for (let up = item.parent; up; up = up.parent) if (!up.open) return false;
      return true;
    };
    const visible = () => items.filter(shown);
    const itemOf = (el) => el?.closest?.('.kodza-file-tree__item')?.kzItem;

    // The bar on top: the root, the folders the old and new paths share, then the part that rolls
    const bar = make('div', 'bar');
    const pathBox = make('div', 'path');
    const copy = make('button', 'copy', { type: 'button', 'aria-label': word('copyLabel') });
    const words = make('span', 'words', { 'aria-hidden': 'true' });
    const doneWord = make('span', null, null, word('copied'));
    words.append(make('span', null, null, word('copy')), doneWord);
    copy.append(
      icon('kodza-file-tree__clip', 'M5.5 3.5h-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1 M6 2.5h4v2H6z'),
      icon('kodza-file-tree__done', 'M3.5 8.5 6.5 11.5 12.5 4.5'),
      words,
    );
    const status = make('span', 'status', { role: 'status' });
    bar.append(pathBox, copy);
    root.prepend(bar);
    root.append(status);

    const textOf = (item) => {
      const parts = item ? item.path : [];
      const joined = parts.join('/') + (item?.folder ? '/' : '');
      return base ? `${base}/${joined}` : joined;
    };
    // A run of segments: each folder ends with a pale slash, the end of the path is set apart
    const segments = (parts, folder, end) => {
      const span = document.createElement('span');
      parts.forEach((part, i) => {
        const last = end && i === parts.length - 1;
        span.append(last ? make('span', 'last', null, part) : document.createTextNode(part));
        if (!last || folder) span.append(make('span', 'sep', null, '/'));
      });
      return span;
    };
    let shownParts = [];
    let shownFolder = false;
    let rolling = null;
    const head = make('span', 'head', null, base ? `${base}/` : '');
    const keep = document.createElement('span');
    const tail = make('span', 'tail');
    pathBox.append(head, keep, tail);
    const fit = () => pathBox.classList.toggle('is-long', pathBox.scrollWidth > pathBox.clientWidth + 1);

    const showPath = (item, instant) => {
      const parts = item ? item.path : [];
      const folder = !!item?.folder;
      if (parts.join('/') === shownParts.join('/') && folder === shownFolder && keep.childNodes.length + tail.childNodes.length) return;
      rolling?.forEach((a) => a.finish());
      let same = 0;
      while (same < parts.length - 1 && same < shownParts.length - 1 && parts[same] === shownParts[same]) same += 1;
      const oldParts = shownParts;
      const oldFolder = shownFolder;
      shownParts = parts;
      shownFolder = folder;
      // The old rest, drawn exactly as it read, leaves from the same cell the new one enters
      const before = segments(oldParts.slice(same), oldFolder, true);
      const after = segments(parts.slice(same), folder, true);
      keep.replaceChildren(segments(parts.slice(0, same), true, false));
      const wasEmpty = !tail.childNodes.length;
      tail.replaceChildren(after);
      fit();
      if (instant || still || wasEmpty) return;
      tail.prepend(before);
      const duration = ROLL * pace;
      const out = before.animate([{ transform: 'none' }, { transform: 'translateY(-105%)' }], { duration, easing: EASE, fill: 'forwards' });
      const inn = after.animate([{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration, easing: EASE, fill: 'backwards' });
      rolling = [out, inn];
      rolling.forEach((a) => running.add(a));
      out.finished.then(() => {
        before.remove();
        fit();
      }, () => {}).finally(() => {
        rolling?.forEach((a) => running.delete(a));
        rolling = null;
      });
    };

    // The chosen file: ink row, its path in the bar when nothing is pointed at
    let chosen = items.find((item) => item.li.hasAttribute('data-selected') && !item.folder && shown(item)) || null;
    const choose = (item) => {
      if (item.folder || item === chosen) return;
      chosen?.li.setAttribute('aria-selected', 'false');
      chosen = item;
      item.li.setAttribute('aria-selected', 'true');
      root.dispatchEvent(new CustomEvent('kodza:select', { detail: { item: item.li, value: textOf(item) }, bubbles: true }));
    };
    if (chosen) chosen.li.setAttribute('aria-selected', 'true');

    // One row holds the tab stop: the chosen file, or the first row
    let current = chosen || items[0];
    current.li.tabIndex = 0;
    const settle = (item) => {
      if (current === item) return;
      current.li.tabIndex = -1;
      current = item;
      item.li.tabIndex = 0;
    };
    const focus = (item) => {
      settle(item);
      item.li.focus({ preventScroll: true });
      item.row.scrollIntoView({ block: 'nearest' });
    };

    // What the bar says: the row pointed at or focused, else the chosen file
    let pointed = null;
    let focused = null;
    let pointTimer = 0;
    const refresh = () => showPath(pointed || focused || chosen);
    const point = (item) => {
      clearTimeout(pointTimer);
      pointTimer = later(() => {
        pointed = item;
        refresh();
      }, item ? POINT_DELAY : POINT_DELAY * 2);
    };
    showPath(chosen, true);

    // Folding: the group's height moves, the rows inside come in one after the other
    const folds = new WeakMap();
    const toggle = (item, open = !item.open) => {
      if (!item.ul || item.open === open) return;
      item.open = open;
      item.li.setAttribute('aria-expanded', open);
      item.glyph.firstChild.setAttribute('d', ICONS[open ? 'open' : 'folder']);
      const ul = item.ul;
      if (!open && current !== item && item.li.contains(current.li)) settle(item);
      const from = ul.hidden ? 0 : ul.getBoundingClientRect().height / (root.getBoundingClientRect().height / root.offsetHeight || 1);
      folds.get(ul)?.cancel();
      if (still) {
        ul.hidden = !open;
        return;
      }
      ul.hidden = false;
      const to = open ? ul.scrollHeight : 0;
      ul.classList.add('is-moving');
      const fold = ul.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: FOLD * pace, easing: FOLD_EASE });
      folds.set(ul, fold);
      running.add(fold);
      fold.finished.then(() => {
        ul.classList.remove('is-moving');
        ul.hidden = !open;
      }, () => {}).finally(() => running.delete(fold));
      if (open && !from) {
        [...ul.children].forEach((li, k) => {
          const enter = li.firstElementChild?.animate(
            [{ opacity: 0, transform: `translateY(${-SHIFT}px)` }, { opacity: 1, transform: 'none' }],
            { duration: ENTER * pace, delay: Math.min(k, 8) * CASCADE * pace, easing: EASE, fill: 'backwards' },
          );
          if (enter) {
            running.add(enter);
            enter.finished.catch(() => {}).finally(() => running.delete(enter));
          }
        });
      }
    };

    const activate = (item) => (item.folder ? toggle(item) : choose(item));

    list.addEventListener('click', (event) => {
      const item = itemOf(event.target);
      if (!item || !item.row.contains(event.target)) return;
      settle(item);
      activate(item);
    }, { signal });

    list.addEventListener('pointerover', (event) => {
      if (event.pointerType === 'touch' || !canHover.matches) return;
      const item = itemOf(event.target);
      if (item && item.row.contains(event.target) && item !== pointed) point(item);
    }, { signal });
    list.addEventListener('pointerleave', () => point(null), { signal });
    list.addEventListener('focusin', (event) => {
      const item = itemOf(event.target);
      if (!item) return;
      settle(item);
      if (!event.target.matches(':focus-visible')) return;
      focused = item;
      refresh();
    }, { signal });
    list.addEventListener('focusout', (event) => {
      if (list.contains(event.relatedTarget)) return;
      focused = null;
      refresh();
    }, { signal });

    list.addEventListener('keydown', (event) => {
      const item = itemOf(event.target);
      if (!item || event.altKey || event.ctrlKey || event.metaKey) return;
      const rows = visible();
      const at = rows.indexOf(item);
      let next = null;
      const key = event.key === ' ' ? 'Enter' : event.key;
      switch (key) {
        case 'ArrowDown':
          next = rows[at + 1];
          break;
        case 'ArrowUp':
          next = rows[at - 1];
          break;
        case 'Home':
          next = rows[0];
          break;
        case 'End':
          next = rows[rows.length - 1];
          break;
        case 'ArrowRight':
          if (item.ul && !item.open) toggle(item, true);
          else if (item.ul) next = rows[at + 1];
          break;
        case 'ArrowLeft':
          if (item.ul && item.open) toggle(item, false);
          else next = item.parent;
          break;
        case 'Enter':
          activate(item);
          break;
        default: {
          // A letter goes to the next row whose name starts with it
          const single = event.key.length === 1;
          if (!single || !event.key.trim()) return;
          const letter = event.key.toLowerCase();
          const order = [...rows.slice(at + 1), ...rows.slice(0, at)];
          next = order.find((row) => row.name.toLowerCase().startsWith(letter));
          if (!next) return;
        }
      }
      event.preventDefault();
      if (next) focus(next);
    }, { signal });

    // Copy: the path of the chosen file, the word rolls to Copied and back
    let copiedTimer = 0;
    copy.addEventListener('click', async () => {
      const ok = await writeText(textOf(chosen));
      if (signal.aborted) return;
      doneWord.textContent = word(ok ? 'copied' : 'failed');
      copy.classList.add('is-copied');
      status.textContent = '';
      later(() => { status.textContent = `${word(ok ? 'copied' : 'failed')}: ${textOf(chosen)}`; }, 60);
      clearTimeout(copiedTimer);
      copiedTimer = later(() => copy.classList.remove('is-copied'), COPIED);
    }, { signal });

    const resize = new ResizeObserver(fit);
    resize.observe(pathBox);
    signal.addEventListener('abort', () => resize.disconnect());
  }

  const maker = (base) => (tag, classes, attrs, text) => {
    const el = document.createElement(tag);
    if (classes) el.className = classes.split(' ').map((c) => (c.startsWith('is-') ? c : `${base}__${c}`)).join(' ');
    if (attrs) Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    if (text != null) el.textContent = text;
    return el;
  };

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
