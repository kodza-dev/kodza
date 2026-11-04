// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Combobox
// Lays a text field over the real <select> (options, groups, disabled ones) and keeps both in
// step: typing filters the list, accents and case don't matter, the matched letters are
// underlined and the best match is lit, ready for Enter. The code on the right of an option
// (data-meta) is searched too. Leaving the field takes the only match, or an exact one, or puts
// the last choice back and says why under the field; an empty field takes the empty option.
// "change" fires on the real select, so forms and frameworks see an ordinary one. Options
// changed by the page are read again; after setting .value from a script, fire "change" on it.
// The words and timings are below; each word can be set per field with data-text-<name>
// (data-text-nomatch="…"), {query} and {count} are filled in.
(() => {
  const SELECTOR = '.kodza-combobox';
  const WORDS = {
    placeholder: 'Start typing',
    empty: 'No match. Typo?', // the list, when nothing matches
    nomatch: 'No match for “{query}”. Typo?', // under the field, when it is left on no match
    required: 'Pick one from the list.',
    count: '{count} options', // read out as the list filters
    one: '1 option',
  };
  const ROLL = 420; // ms, the value rolling to a new choice
  const RESIZE = 240; // ms, the list changing height as it filters
  const ANNOUNCE = 400; // ms of quiet before the count is read out (a wait, not a motion)
  const PAGE = 5; // rows per PageUp / PageDown
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const tick = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" pathLength="1"/></svg>';
  const chevron = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6.5 8 10.5l4-4"/></svg>';
  let uid = 0;

  // Text as it is searched: lower case, no accents, the typographic minus and apostrophes as
  // typed on a keyboard. `at` gives, for each folded character, its place in the original text
  const fold = (value) => {
    let text = '';
    const at = [];
    let i = 0;
    for (const char of value) {
      const folded = char.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/−/g, '-').replace(/[‘’]/g, "'");
      for (let n = 0; n < folded.length; n += 1) at.push(i);
      text += folded;
      i += char.length;
    }
    at.push(value.length);
    return { text, at };
  };
  // Where the query starts a word ("york" in "new york"), or -1
  const wordAt = (text, query) => {
    for (let s = text.indexOf(query); s >= 0; s = text.indexOf(query, s + 1)) {
      if (!s || !/[\p{L}\p{N}]/u.test(text[s - 1])) return s;
    }
    return -1;
  };
  const fill = (words, values) => words.replace(/\{(\w+)\}/g, (all, key) => (key in values ? values[key] : all));

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const box = root.querySelector('.kodza-combobox__box');
    const native = root.querySelector('.kodza-combobox__native');
    const label = root.querySelector('.kodza-combobox__label');
    const hint = root.querySelector('.kodza-combobox__hint');
    const error = root.querySelector('.kodza-combobox__error');
    if (!box || !native) return;
    const id = `kodza-combobox-${++uid}`;
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];

    // The field: a text input on the value line, the old value rolling out above it (ghost)
    const value = document.createElement('span');
    value.className = 'kodza-combobox__value';
    const input = document.createElement('input');
    input.className = 'kodza-combobox__input';
    input.type = 'text';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.placeholder = word('placeholder');
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', `${id}-list`);
    if (label) {
      label.id = `${id}-label`;
      input.setAttribute('aria-labelledby', `${id}-label`);
    }
    const described = [];
    if (hint) described.push((hint.id = `${id}-hint`));
    if (error) described.push((error.id = `${id}-error`));
    if (described.length) input.setAttribute('aria-describedby', described.join(' '));
    const ghost = document.createElement('span');
    ghost.className = 'kodza-combobox__ghost';
    ghost.setAttribute('aria-hidden', 'true');
    value.append(input, ghost);
    // Before the real select: the <label> around them now points at the text field
    native.before(value);
    native.tabIndex = -1;
    native.setAttribute('aria-hidden', 'true');
    const toggle = document.createElement('span');
    toggle.className = 'kodza-combobox__toggle';
    toggle.setAttribute('aria-hidden', 'true');
    toggle.innerHTML = chevron;
    box.append(toggle);

    // The list, from the real options (built again whenever the page changes them)
    const list = document.createElement('ul');
    list.className = 'kodza-combobox__list';
    list.id = `${id}-list`;
    list.tabIndex = -1;
    list.setAttribute('role', 'listbox');
    if (label) list.setAttribute('aria-labelledby', `${id}-label`);
    const highlight = document.createElement('li');
    highlight.className = 'kodza-combobox__highlight';
    highlight.setAttribute('role', 'presentation');
    const empty = document.createElement('li');
    empty.className = 'kodza-combobox__empty';
    empty.setAttribute('role', 'presentation');
    empty.hidden = true;
    empty.textContent = word('empty');
    list.append(highlight, empty);
    box.after(list);
    const live = document.createElement('span');
    live.className = 'kodza-combobox__live';
    live.setAttribute('aria-live', 'polite');
    root.append(live);

    // Sections in the order of the select: a group with its heading, or a run of options
    // outside any group. Each entry keeps its folded name and code for the search
    let sections = [];
    let options = [];
    const entries = new Map();
    const build = () => {
      sections = [];
      options = [];
      entries.clear();
      [...list.children].forEach((child) => child !== highlight && child !== empty && child.remove());
      let loose = null;
      [...native.children].forEach((child) => {
        const group = child.tagName === 'OPTGROUP' ? child : null;
        if (!group && child.tagName !== 'OPTION') return;
        let section = loose;
        if (group) {
          const head = document.createElement('li');
          head.className = 'kodza-combobox__group';
          head.setAttribute('role', 'presentation');
          head.textContent = group.label;
          section = { head, entries: [] };
          sections.push(section);
          loose = null;
        } else if (!section) {
          section = loose = { head: null, entries: [] };
          sections.push(section);
        }
        (group ? [...group.children] : [child]).forEach((option) => {
          const text = option.textContent.trim();
          if (option.hidden || !text) return; // the placeholder: "nothing chosen yet" is not a choice
          const item = document.createElement('li');
          item.className = 'kodza-combobox__option';
          item.id = `${id}-option-${options.length}`;
          item.setAttribute('role', 'option');
          item.innerHTML = tick;
          const name = document.createElement('span');
          name.className = 'kodza-combobox__text';
          name.textContent = text;
          item.append(name);
          const meta = option.dataset.meta?.trim() || '';
          let code = null;
          if (meta) {
            code = document.createElement('span');
            code.className = 'kodza-combobox__meta';
            code.textContent = meta;
            item.append(code);
          }
          const disabled = option.disabled || !!group?.disabled;
          if (disabled) item.setAttribute('aria-disabled', 'true');
          const entry = { option, item, text, meta, name, code, disabled, order: options.length, folded: fold(text), metaFolded: fold(meta) };
          section.entries.push(entry);
          options.push(entry);
          entries.set(item, entry);
        });
      });
      sections = sections.filter((section) => section.entries.length);
      sections.forEach(({ head, entries: rows }) => {
        if (head) list.insertBefore(head, empty);
        rows.forEach(({ item }) => list.insertBefore(item, empty));
      });
    };
    build();

    const isOpen = () => root.classList.contains('is-open');
    let active = null;
    let firstShown = null;
    let hits = []; // the enabled rows the query matches, best first
    let shown = []; // the same, in the order of the list (for the arrows)
    let typing = false; // the field holds a query, not the chosen option

    // The matched letters, underlined (a slice of the original text, accents and all)
    const mark = (el, text, folded, start, length) => {
      if (start < 0) return el.replaceChildren(text);
      const from = folded.at[start];
      const to = Math.max(folded.at[start + length], folded.at[start + length - 1] + 1);
      const marked = document.createElement('mark');
      marked.textContent = text.slice(from, to);
      el.replaceChildren(text.slice(0, from), marked, text.slice(to));
    };

    // The list for a query: each section keeps its place, its matches come best first (the name
    // starts with it, then a word of the name or of the code does, then the name or the code
    // holds it), the rest hide. The list changes height smoothly while it is open
    let resize = null;
    let announced = 0;
    const render = (query, speak = true) => {
      const q = fold(query.trim()).text;
      const still = reduceMotion || !paceOf(root);
      const from = isOpen() && !still ? list.offsetHeight : 0;
      resize?.cancel();
      const ranked = [];
      firstShown = null;
      sections.forEach(({ head, entries: rows }) => {
        const found = [];
        const missed = [];
        rows.forEach((entry) => {
          const { text, meta, name, code, folded, metaFolded } = entry;
          let rank = -1;
          let inName = -1;
          let inCode = -1;
          if (!q) rank = 0;
          else if (folded.text.startsWith(q)) [rank, inName] = [0, 0];
          else if ((inName = wordAt(folded.text, q)) >= 0) rank = 1;
          else if ((inCode = wordAt(metaFolded.text, q)) >= 0) rank = 1;
          else if ((inName = folded.text.indexOf(q)) >= 0) rank = 2;
          else if ((inCode = metaFolded.text.indexOf(q)) >= 0) rank = 3;
          mark(name, text, folded, q ? inName : -1, q.length);
          if (code) mark(code, meta, metaFolded, q ? inCode : -1, q.length);
          entry.item.hidden = rank < 0;
          (rank < 0 ? missed : found).push({ entry, rank });
        });
        found.sort((a, b) => a.rank - b.rank || a.entry.order - b.entry.order);
        if (head) {
          head.hidden = !found.length;
          list.insertBefore(head, empty);
          if (found.length && !firstShown) firstShown = head;
        }
        found.forEach(({ entry }) => {
          list.insertBefore(entry.item, empty);
          if (!firstShown) firstShown = entry.item;
        });
        missed.forEach(({ entry }) => list.insertBefore(entry.item, empty));
        ranked.push(...found);
      });
      shown = ranked.filter(({ entry }) => !entry.disabled);
      hits = shown.slice().sort((a, b) => a.rank - b.rank).map(({ entry }) => entry);
      shown = shown.map(({ entry }) => entry);
      empty.hidden = ranked.length > 0;
      if (!ranked.length) firstShown = empty;
      list.scrollTop = 0;
      if (from) {
        const to = list.offsetHeight;
        if (Math.abs(to - from) > 0.5) {
          list.style.overflowY = 'hidden';
          resize = list.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: RESIZE * paceOf(root), easing: ease });
          const done = () => {
            list.style.overflowY = '';
            resize = null;
          };
          resize.onfinish = done;
          resize.oncancel = done;
        }
      }
      // Read out how many are left, once the typing pauses
      clearTimeout(announced);
      const count = ranked.length;
      if (speak) announced = setTimeout(() => {
        live.textContent = !count ? word('empty') : count === 1 ? word('one') : fill(word('count'), { count });
      }, ANNOUNCE);
      return hits[0] || null;
    };

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
      // Scroll the list only (scrollIntoView would also nudge the page), with the option's group
      // heading when it opens the group, and the list's own padding above the very first row
      if (scroll) {
        const prev = entry.item.previousElementSibling;
        const first = prev?.classList.contains('kodza-combobox__group') ? prev : entry.item;
        const top = first === firstShown ? 0 : first.offsetTop;
        const bottom = entry.item.offsetTop + entry.item.offsetHeight;
        if (top < list.scrollTop) list.scrollTop = top;
        else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
      }
    };

    const open = () => {
      if (isOpen() || input.disabled) return;
      // Not enough room below and more above: the list opens upwards. A closed list that changes
      // side gets there at once, so it always unrolls from the field. Measuring also settles the
      // highlight where it was put, before the open list starts animating it
      const rect = box.getBoundingClientRect();
      const room = Math.min(parseFloat(getComputedStyle(list).maxHeight) || 280, list.scrollHeight);
      const above = rect.bottom + room + 16 > innerHeight && rect.top > innerHeight / 2;
      if (above !== root.classList.contains('is-above')) {
        list.style.transition = 'none';
        root.classList.toggle('is-above', above);
        void list.offsetWidth;
        list.style.transition = '';
      }
      root.classList.add('is-open');
      input.setAttribute('aria-expanded', 'true');
    };

    // The whole list, lit on the current choice
    const openAll = () => {
      if (isOpen() || input.disabled) return;
      render('');
      const chosen = options.find(({ option }) => option.selected);
      light(chosen && !chosen.disabled ? chosen : hits[0] || null);
      open();
    };

    const close = () => {
      resize?.cancel();
      clearTimeout(announced);
      if (!isOpen()) return;
      root.classList.remove('is-open');
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
    };

    // The value rolls to the new text: the old one goes up, the new one comes from below
    let rolls = [];
    const setText = (text, roll) => {
      const before = input.value;
      if (before === text) return;
      input.value = text;
      rolls.forEach((animation) => animation.cancel());
      rolls = [];
      // Read when the value rolls: read at mount, the style it computes would turn the field's first
      // state (its label folded over a chosen value) into a transition
      const pace = paceOf(root);
      if (!roll || !before || reduceMotion || !pace) return;
      ghost.textContent = before;
      const timing = { duration: ROLL * pace, easing: ease };
      const out = ghost.animate([{ transform: 'none' }, { transform: 'translateY(-110%)' }], { ...timing, fill: 'forwards' });
      const done = () => {
        if (rolls.includes(out)) ghost.textContent = '';
      };
      out.onfinish = done;
      out.oncancel = () => (ghost.textContent = '');
      rolls = [out, input.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], timing)];
    };

    // The field follows the real select
    const sync = (roll) => {
      options.forEach(({ option, item }) => item.setAttribute('aria-selected', String(option.selected)));
      input.disabled = native.disabled;
      root.classList.toggle('is-disabled', native.disabled);
      input.setAttribute('aria-required', String(native.required));
      if (typing) return;
      const chosen = native.selectedOptions[0];
      const text = !chosen || chosen.hidden ? '' : chosen.textContent.trim();
      root.classList.toggle('is-empty', !text);
      setText(text, roll);
    };

    // Hint and error share the line under the field
    const say = (text) => {
      if (!error) return;
      error.textContent = text;
      root.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
    };
    const clearError = () => {
      root.classList.remove('is-invalid');
      input.removeAttribute('aria-invalid');
    };

    const pick = (option) => {
      if (!option || option.disabled || option.parentElement?.disabled) return;
      const changed = !option.selected;
      option.selected = true;
      typing = false;
      clearError();
      sync(true);
      close();
      if (changed) native.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const revert = () => {
      typing = false;
      sync(true);
    };

    // Leaving the field: the only match, or one named exactly, is taken; an empty field takes the
    // empty option; anything else puts the last choice back and says why
    const commit = () => {
      if (!typing) return close();
      const query = input.value.trim();
      const q = fold(query).text;
      if (!q) {
        const blank = [...native.options].find((option) => option.value === '' && !option.disabled);
        if (blank) pick(blank);
        else revert();
        close();
        if (native.required && !native.value) say(word('required'));
        return;
      }
      const exact = hits.find(({ folded, metaFolded }) => folded.text === q || metaFolded.text === q);
      if (exact || hits.length === 1) return pick((exact || hits[0]).option);
      const none = !empty.hidden; // nothing matches at all (a disabled match is not a typo)
      revert();
      close();
      if (none) say(fill(word('nomatch'), { query }));
    };

    // Typing filters, lit on the best match
    input.addEventListener('input', () => {
      typing = true;
      clearError();
      root.classList.remove('is-empty');
      light(render(input.value));
      open();
    }, { signal });

    input.addEventListener('keydown', (event) => {
      if (event.isComposing) return;
      const moves = { ArrowDown: 1, ArrowUp: -1, PageDown: PAGE, PageUp: -PAGE };
      if (event.key in moves) {
        event.preventDefault();
        if (!isOpen()) return openAll();
        if (!shown.length) return;
        const index = shown.indexOf(active);
        const step = moves[event.key];
        const next = index < 0 ? (step > 0 ? 0 : shown.length - 1) : Math.max(0, Math.min(shown.length - 1, index + step));
        light(shown[next]);
      } else if (event.key === 'Enter' && isOpen()) {
        event.preventDefault();
        if (active) pick(active.option);
        else commit();
      } else if (event.key === 'Tab' && isOpen() && active) {
        pick(active.option);
      } else if (event.key === 'Escape' && (isOpen() || typing)) {
        event.preventDefault();
        revert();
        close();
      }
    }, { signal });

    // A click in the field opens the whole list, with the text selected, ready to be typed over
    let pointed = false;
    input.addEventListener('pointerdown', () => (pointed = document.activeElement !== input), { signal });
    input.addEventListener('mouseup', (event) => {
      if (!pointed) return;
      pointed = false;
      event.preventDefault(); // keeps the selection made on focus
    }, { signal });
    input.addEventListener('focus', () => input.select(), { signal });
    input.addEventListener('click', () => !isOpen() && openAll(), { signal });
    input.addEventListener('blur', () => {
      if (document.activeElement === input) return; // the window lost the focus, not the field
      commit();
    }, { signal });

    // The rest of the box (label, padding, chevron) works the field: the focus stays in it and the
    // wrapping <label> never sends the click to the hidden select
    box.addEventListener('mousedown', (event) => event.target !== input && event.preventDefault(), { signal });
    box.addEventListener('click', (event) => {
      if (event.target === input) return;
      event.preventDefault();
      if (input.disabled) return;
      if (toggle.contains(event.target) && isOpen()) {
        revert();
        return close();
      }
      if (document.activeElement !== input) input.focus();
      openAll();
    }, { signal });

    const entryAt = (event) => entries.get(event.target.closest?.('.kodza-combobox__option'));
    list.addEventListener('pointermove', (event) => {
      const entry = entryAt(event);
      if (entry && active !== entry && !entry.disabled) light(entry, false);
    }, { signal });
    list.addEventListener('click', (event) => {
      const entry = entryAt(event);
      if (entry && !entry.disabled) pick(entry.option);
    }, { signal });
    list.addEventListener('mousedown', (event) => event.preventDefault(), { signal });

    // Sent without a choice: the field says it, not the browser's bubble on the hidden select
    native.addEventListener('invalid', (event) => {
      event.preventDefault();
      say(native.validity.customError ? native.validationMessage : word('required'));
      const first = native.form && [...native.form.elements].find((el) => el.willValidate && !el.validity.valid);
      if (!native.form || first === native) input.focus();
    }, { signal });
    // The real select changed from elsewhere (a form reset, a script): follow it
    native.addEventListener('change', () => {
      typing = false;
      sync(true);
    }, { signal });
    native.form?.addEventListener('reset', () => setTimeout(() => {
      typing = false;
      clearError();
      sync(true);
    }), { signal });

    // The page changed the options (counts, disabled ones, a new list): build the list again and
    // filter it as it was, with the value shown without a roll
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
        if (!isOpen()) return;
        const best = render(typing ? input.value : '', false);
        const again = shown.find(({ option }) => option === was);
        light(again || best, false);
      });
    });
    observer.observe(native, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['disabled', 'hidden', 'label', 'data-meta', 'required'] });
    signal.addEventListener('abort', () => {
      observer.disconnect();
      clearTimeout(announced);
      resize?.cancel();
      rolls.forEach((animation) => animation.cancel());
    });

    render('', false);
    sync(false);
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
