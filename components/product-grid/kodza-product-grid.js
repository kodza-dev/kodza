// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Product Grid
// A shop's product grid. The filters are a plain GET form (category, colour, sort) that a page
// can answer on the server; with the script nothing reloads. The category pill slides, the cards
// that go step back, the ones that stay glide to their new place (measured before and after),
// the new ones come in one by one, the grid eases to its new height and the count rolls. A colour
// turns every card left to it, each photo wiped in place. The address keeps the filters (the
// first grid of the page; data-url="off" on the root leaves it alone). Fires "kodza:filter" { category, colour, sort, count }.
// The cards are Product Card's, copied under this block's classes: second photo under the
// pointer, swipe on phones, colours, Add and the sizes, sent to the cart by the Cart engine below.
// Settings: the --kz-product-grid-* variables in the CSS, data-text-* on the root, the constants
// below. Give each item data-category (several, space-separated), data-colours and data-price.
(() => {
  const SELECTOR = '.kodza-product-grid';

  // Timings, in milliseconds (times the site's pace)
  const OUT = 220; // the cards that go, stepping back
  const MOVE = 650; // the cards that stay gliding to their place, the grid easing to its height
  const IN = 80; // the first new card's wait; each next one waits STAGGER more
  const STAGGER = 60;
  const COUNT = 450; // the count rolling
  const ROLL = 420; // a word rolling in a card's button
  const SWAP = 640; // the old photo of a colour, wiped away
  // Not motion, so not paced
  const HOLD = 1600; // how long "Added" stays before "Add" comes back

  // What the script writes, in English unless the root says otherwise (data-text-<key>)
  const WORDS = {
    one: 'product', // after the count, for one
    many: 'products', // after the count, for any other number
    added: 'Added', // in a card's button, once it is in the cart
    photo: 'Photo {n} of {count}', // the dots of the swipe, read by screen readers
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';

  const ADDRESS = Symbol.for('kodza product-grid address'); // the grid that keeps the address
  const finger = window.matchMedia('(hover: none)');
  const FORMS = 'form[action$="/cart/add"], form[data-kodza-cart-add]';
  // The picture of what was added: in the form, or around it, without leaving its own card
  const pictureFor = (source) => {
    for (let el = source, i = 0; el instanceof Element && i < 4; el = el.parentElement, i++) {
      if (i && el.querySelectorAll(FORMS).length > 1) break;
      const img = el.querySelector('img');
      if (img) return img;
    }
    return null;
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const ms = (t) => (still ? 0 : t * pace);
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const q = (name) => root.querySelector(`.kodza-product-grid__${name}`);
    const all = (name) => [...root.querySelectorAll(`.kodza-product-grid__${name}`)];

    root.querySelectorAll('.kodza-product-grid__card').forEach((card) => mountCard(card, signal, root));

    const form = q('filters');
    const pillsBox = q('pills');
    const list = q('list');
    const results = q('results');
    const empty = q('empty');
    const num = q('num');
    const unit = q('unit');
    const items = all('item');
    if (!form || !list || !results) return;
    const categories = [...form.querySelectorAll('input[name="category"]')];
    const tones = [...form.querySelectorAll('input[name="colour"]')];
    const sorter = form.querySelector('select[name="sort"]');
    const featured = new Map(items.map((item, i) => [item, i]));
    const words = (item, name) => (item.dataset[name] || '').toLowerCase().split(/\s+/).filter(Boolean);

    // ---------- The state, in the form (and in the address) ----------
    const state = () => ({
      category: categories.find((input) => input.checked)?.value || 'all',
      colour: tones.find((input) => input.checked)?.value || '',
      sort: sorter?.value || 'featured',
    });
    // One grid keeps the address: the first one started on the page, unless it says data-url="off"
    const own = root.dataset.url !== 'off' && !(window[ADDRESS]?.isConnected && window[ADDRESS] !== root);
    if (own) {
      window[ADDRESS] = root;
      signal.addEventListener('abort', () => window[ADDRESS] === root && delete window[ADDRESS]);
      const params = new URLSearchParams(location.search);
      const set = (inputs, value) => value != null && inputs.forEach((input) => (input.checked = input.value === value));
      set(categories, params.get('category'));
      set(tones, params.get('colour'));
      if (sorter && params.has('sort') && [...sorter.options].some((o) => o.value === params.get('sort'))) sorter.value = params.get('sort');
    }
    // The sort, dressed as Kodza's Select once the address has set it
    const sortBox = form.querySelector('.kodza-product-grid__select');
    if (sortBox) mountSelect(sortBox, signal);
    const write = ({ category, colour, sort }) => {
      if (!own) return;
      const url = new URL(location.href);
      const keep = (name, value, rest) => (value && value !== rest ? url.searchParams.set(name, value) : url.searchParams.delete(name));
      keep('category', category, 'all');
      keep('colour', colour, '');
      keep('sort', sort, 'featured');
      // A sandboxed frame can refuse the address: the filters still work
      try {
        if (url.href !== location.href) history.replaceState(history.state, '', url);
      } catch {}
    };
    const matches = (item, { category, colour }) =>
      (category === 'all' || words(item, 'category').includes(category)) && (!colour || words(item, 'colours').includes(colour));
    const order = ({ sort }) => {
      const price = (item) => Number(item.dataset.price) || 0;
      const sorted = [...items].sort((a, b) => featured.get(a) - featured.get(b));
      if (sort === 'price-asc') sorted.sort((a, b) => price(a) - price(b));
      if (sort === 'price-desc') sorted.sort((a, b) => price(b) - price(a));
      return sorted;
    };

    // ---------- The pill: ink cut to the chosen one, and a white copy of the labels cut the same ----------
    const pills = categories.map((input) => input.closest('.kodza-product-grid__pill'));
    let mirror = null;
    if (pillsBox && pills.every(Boolean)) {
      mirror = document.createElement('span');
      mirror.className = 'kodza-product-grid__mirror';
      mirror.setAttribute('aria-hidden', 'true');
      mirror.append(...pills.map((pill) => Object.assign(document.createElement('span'), { className: 'kodza-product-grid__ghost', textContent: pill.textContent.trim() })));
      pillsBox.append(mirror);
    }
    const place = () => {
      const pill = pills[categories.findIndex((input) => input.checked)];
      if (!mirror || !pill) return;
      pillsBox.style.setProperty('--kz-ind-w', `${pillsBox.scrollWidth}px`);
      pillsBox.style.setProperty('--kz-ind-l', `${pill.offsetLeft}px`);
      pillsBox.style.setProperty('--kz-ind-r', `${pillsBox.scrollWidth - pill.offsetLeft - pill.offsetWidth}px`);
      // On a narrow screen the pills scroll: the chosen one comes into view
      const { scrollLeft, clientWidth } = pillsBox;
      if (pill.offsetLeft < scrollLeft || pill.offsetLeft + pill.offsetWidth > scrollLeft + clientWidth) {
        pillsBox.scrollTo({ left: pill.offsetLeft - 4, behavior: still ? 'auto' : 'smooth' });
      }
    };

    // ---------- The count rolls to its new number ----------
    if (num) num.replaceChildren(Object.assign(document.createElement('span'), { textContent: num.textContent.trim() }));
    const count = (value) => {
      if (unit) unit.textContent = word(value === 1 ? 'one' : 'many');
      if (!num) return;
      const prev = num.lastElementChild;
      if (prev.textContent === String(value)) return;
      const span = Object.assign(document.createElement('span'), { textContent: value });
      num.append(span);
      if (still) return prev.remove();
      const timing = { duration: ms(COUNT), easing: ease };
      prev.animate([{ transform: 'none' }, { transform: 'translateY(-110%)' }], { ...timing, fill: 'forwards' }).finished.then(() => prev.remove(), () => prev.remove());
      span.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], timing);
    };

    // A colour chosen: every card left turns to it, each photo wiped in place (the card's own swap)
    const tint = (shown, colour) => {
      if (!colour) return;
      shown.forEach((item) => {
        const input = [...item.querySelectorAll('.kodza-product-grid__swatch input')].find((el) => el.value.toLowerCase() === colour);
        if (!input || input.checked) return;
        input.checked = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    };

    // ---------- The change, in two beats ----------
    let running = [];
    let outs = [];
    let token = 0;
    signal.addEventListener('abort', () => [...running, ...outs].forEach((animation) => animation.cancel()));
    const apply = async (now) => {
      const id = ++token;
      const filters = state();
      // A change still running: the cards on their way out come back, the rest lands at once
      outs.forEach((animation) => animation.cancel());
      running.forEach((animation) => animation.finish());
      outs = [];
      running = [];
      const wanted = items.filter((item) => matches(item, filters));
      const sorted = order(filters);
      const leaving = items.filter((item) => !item.hidden && !wanted.includes(item));
      const entering = wanted.filter((item) => item.hidden);
      const staying = wanted.filter((item) => !item.hidden);
      const layout = () => {
        items.forEach((item) => (item.hidden = !wanted.includes(item)));
        if (sorted.some((item, i) => list.children[i] !== item)) list.append(...sorted);
        if (empty) empty.hidden = wanted.length > 0;
      };
      count(wanted.length);
      write(filters);
      root.dispatchEvent(new CustomEvent('kodza:filter', { bubbles: true, detail: { ...filters, count: wanted.length } }));
      if (still || now) {
        layout();
        tint(wanted, filters.colour);
        return;
      }

      // Beat one: the cards that go step back
      if (leaving.length) {
        outs = leaving.map((item) => item.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(0.94)' }], { duration: ms(OUT), easing: 'ease-in', fill: 'forwards' }));
        await Promise.all(outs.map((animation) => animation.finished.catch(() => {})));
        if (id !== token || signal.aborted) return;
      }

      // Beat two: the layout changes; what stays glides there, what comes arrives, the grid eases
      const before = new Map(staying.map((item) => [item, item.getBoundingClientRect()]));
      const wasEmpty = empty && !empty.hidden;
      const from = results.offsetHeight;
      layout();
      outs.forEach((animation) => animation.cancel());
      outs = [];
      tint(wanted, filters.colour);
      const to = results.offsetHeight;
      // Screen pixels back to the grid's own (a parent may be scaled with a transform)
      const k = list.getBoundingClientRect().width / list.offsetWidth || 1;
      staying.forEach((item) => {
        const a = before.get(item);
        const b = item.getBoundingClientRect();
        if (Math.abs(a.left - b.left) + Math.abs(a.top - b.top) < 1) return;
        running.push(item.animate([{ transform: `translate(${(a.left - b.left) / k}px, ${(a.top - b.top) / k}px)` }, { transform: 'none' }], { duration: ms(MOVE), easing: ease }));
      });
      entering
        .sort((a, b) => a.offsetTop - b.offsetTop || a.offsetLeft - b.offsetLeft)
        .forEach((item, i) => running.push(item.animate([{ opacity: 0, transform: 'translateY(16px) scale(0.96)' }, { opacity: 1, transform: 'none' }], { duration: ms(MOVE), delay: ms(IN + i * STAGGER), easing: ease, fill: 'backwards' })));
      if (empty && !empty.hidden && !wasEmpty) {
        running.push(empty.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: ms(MOVE), delay: ms(IN), easing: ease, fill: 'backwards' }));
      }
      if (from !== to) running.push(results.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: ms(MOVE), easing: ease }));
    };

    // ---------- The controls ----------
    // Without the script the form is sent; with it, every change applies at once
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      apply();
    }, { signal });
    categories.forEach((input) => input.addEventListener('change', () => {
      place();
      apply();
    }, { signal }));
    sorter?.addEventListener('change', () => apply(), { signal });
    // A colour chosen again lets go of it (a click, or Space on it): its click comes while the
    // colour already applied is still its own, before any change
    let chosen = state().colour;
    tones.forEach((input) => {
      input.addEventListener('click', () => {
        if (input.value !== chosen) return;
        input.checked = false;
        chosen = '';
        apply();
      }, { signal });
      input.addEventListener('change', () => {
        chosen = input.value;
        apply();
      }, { signal });
    });
    q('clear')?.addEventListener('click', () => {
      const fromKeys = q('clear').matches(':focus-visible');
      categories.forEach((input) => (input.checked = input.value === 'all'));
      tones.forEach((input) => (input.checked = false));
      chosen = '';
      place();
      apply();
      // The button goes with the empty state: the focus goes to the filters
      if (fromKeys) categories.find((input) => input.checked)?.focus({ preventScroll: true });
    }, { signal });

    apply(true);
    place();
    const observer = new ResizeObserver(place);
    if (pillsBox) observer.observe(pillsBox);
    signal.addEventListener('abort', () => observer.disconnect());
    document.fonts?.ready.then(() => !signal.aborted && place());
    requestAnimationFrame(() => !signal.aborted && root.classList.add('is-live'));
  }

  // ---------- Custom Select, as kodza-product-grid__select (begin) ----------
  // The sort is Kodza's Select, copied whole: a listbox over the real <select>, kept in step,
  // firing "change" on it, so the grid's own listener and the form see an ordinary select
  const selectTick = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" pathLength="1"/></svg>';
  const selectChevron = '<svg class="kodza-product-grid__select-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6.5 8 10.5l4-4"/></svg>';
  let selectUid = 0;

  function mountSelect(root, signal) {
    const native = root.querySelector('.kodza-product-grid__select-native');
    const label = root.querySelector('.kodza-product-grid__select-label');
    if (!native) return;
    const id = `kodza-product-grid__select-${++selectUid}`;

    // The field: a button that says the current value
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'kodza-product-grid__select-trigger';
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', `${id}-list`);
    if (label) {
      label.id = `${id}-label`;
      trigger.setAttribute('aria-labelledby', `${id}-label`);
    }
    const value = document.createElement('span');
    value.className = 'kodza-product-grid__select-value';
    // Every option, invisible, under the value: the field is as wide as the longest one, so it
    // never changes width when the value rolls (the inline version sizes itself on it)
    const sizes = document.createElement('span');
    sizes.className = 'kodza-product-grid__select-sizes';
    sizes.setAttribute('aria-hidden', 'true');
    value.append(sizes);
    trigger.append(value);
    trigger.insertAdjacentHTML('beforeend', selectChevron);

    // The list, from the real options (built again whenever the page changes them)
    const list = document.createElement('ul');
    list.className = 'kodza-product-grid__select-list';
    list.id = `${id}-list`;
    list.setAttribute('role', 'listbox');
    if (label) list.setAttribute('aria-labelledby', `${id}-label`);
    const highlight = document.createElement('li');
    highlight.className = 'kodza-product-grid__select-highlight';
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
          head.className = 'kodza-product-grid__select-group';
          head.setAttribute('role', 'presentation');
          head.textContent = group.label;
          list.append(head);
        }
        (group ? [...group.children] : [child]).forEach((option) => {
          if (option.hidden) return; // the placeholder: "nothing chosen yet" is not a choice
          const item = document.createElement('li');
          item.className = 'kodza-product-grid__select-option';
          item.id = `${id}-option-${options.length}`;
          item.setAttribute('role', 'option');
          item.innerHTML = selectTick;
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
      // Read when the value rolls: read at mount, the style it computes would turn the field's first
      // state (its label folded over a chosen value) into a transition
      const pace = paceOf(root);
      if (!animate || reduceMotion || !pace) return prev.remove();
      const timing = { duration: 420 * pace, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
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
        return list.style.setProperty('--kz-product-grid-select-hl-on', 0);
      }
      trigger.setAttribute('aria-activedescendant', entry.item.id);
      list.style.setProperty('--kz-product-grid-select-hl-y', `${entry.item.offsetTop}px`);
      list.style.setProperty('--kz-product-grid-select-hl-h', `${entry.item.offsetHeight}px`);
      list.style.setProperty('--kz-product-grid-select-hl-on', 1);
      // Scroll the list only (scrollIntoView would also nudge the page), with the option's group
      // heading when it opens the group, and the list's own padding above the very first row
      if (scroll) {
        const prev = entry.item.previousElementSibling;
        const first = prev?.classList.contains('kodza-product-grid__select-group') ? prev : entry.item;
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

    const entryAt = (event) => entries.get(event.target.closest?.('.kodza-product-grid__select-option'));
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
    if (label && root.classList.contains('kodza-product-grid__select--inline')) {
      const inset = () => root.style.setProperty('--kz-product-grid-select-inset', `${Math.ceil(label.offsetWidth)}px`);
      inset();
      const sizer = new ResizeObserver(inset);
      sizer.observe(label);
      signal.addEventListener('abort', () => sizer.disconnect());
    }

    sync(false);
    // Started: the real select steps back (the grid's markup is put back on kodza:destroy)
    root.classList.add('is-ready');
  }
  // ---------- Custom Select (end) ----------

  // ---------- A card (Product Card's script, copied under this block's classes) ----------
  // Its words come from the grid's root (data-text-added, data-text-photo)
  function mountCard(root, signal, grid) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const ms = (t) => (still ? 0 : t * pace);
    const word = (key) => grid.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const fill = (text, values) => text.replace(/\{(\w+)\}/g, (all, name) => values[name] ?? all);

    const q = (name) => root.querySelector(`.kodza-product-grid__${name}`);
    const media = q('media');
    const track = q('track');
    const link = q('link');
    const open = q('open');
    const add = q('add');
    const images = [...root.querySelectorAll('.kodza-product-grid__image')];
    const [main, second] = [images[0], root.querySelector('.kodza-product-grid__image--second')];
    const sizes = [...root.querySelectorAll('.kodza-product-grid__size')];
    const timers = new Set();
    const moving = new Set();
    const later = (fn, t) => {
      const id = setTimeout(() => {
        timers.delete(id);
        fn();
      }, t);
      timers.add(id);
      return id;
    };
    const play = (el, frames, options) => {
      const animation = el.animate(frames, options);
      moving.add(animation);
      animation.finished.then(() => moving.delete(animation), () => moving.delete(animation));
      return animation;
    };
    signal.addEventListener('abort', () => {
      timers.forEach(clearTimeout);
      moving.forEach((animation) => animation.cancel());
    });

    // ---------- The second photo, under the pointer ----------
    if (second && media) {
      const over = (event) => {
        if (event.pointerType !== 'mouse') return;
        const box = media.getBoundingClientRect();
        const inside = event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
        root.classList.toggle('is-peek', inside);
      };
      root.addEventListener('pointermove', over, { signal });
      root.addEventListener('pointerleave', () => root.classList.remove('is-peek'), { signal });
    }

    // ---------- The swipe, with a finger ----------
    let dots = null;
    const current = () => (track && track.clientWidth ? Math.round(track.scrollLeft / track.clientWidth) : 0);
    const mark = () => {
      if (!dots) return;
      const n = current();
      [...dots.children].forEach((dot, i) => dot.classList.toggle('is-current', i === n));
      dots.setAttribute('aria-label', fill(word('photo'), { n: n + 1, count: images.length }));
    };
    const swipe = () => {
      const on = finger.matches && images.length > 1 && track;
      if (on && !dots) {
        dots = document.createElement('span');
        dots.className = 'kodza-product-grid__dots';
        dots.setAttribute('role', 'img');
        dots.innerHTML = images.map(() => '<span class="kodza-product-grid__dot"></span>').join('');
        media.append(dots);
        mark();
      } else if (!on && dots) {
        dots.remove();
        dots = null;
        if (track) track.scrollLeft = 0;
      }
    };
    swipe();
    finger.addEventListener('change', swipe, { signal });
    track?.addEventListener('scroll', mark, { signal, passive: true });
    // With a finger the photos sit above the card's link (to swipe): a tap on them follows it
    media?.addEventListener('click', (event) => {
      if (!finger.matches || !link || event.target.closest('a, button, input, label')) return;
      link.click();
    }, { signal });

    // ---------- Colours ----------
    const swatches = [...root.querySelectorAll('.kodza-product-grid__swatch input')];
    let chosen = swatches.findIndex((input) => input.checked);
    let swapping = 0;
    const swap = async (input) => {
      const at = swatches.indexOf(input);
      const forward = at > chosen;
      chosen = at;
      const { image, imageSecond, alt } = input.dataset;
      if (!image || !main || main.getAttribute('src') === image) return;
      const turn = ++swapping;
      let leaving = null;
      if (!still && main.complete && main.naturalWidth) {
        // The old photo stays on top, as it is, while the new one loads underneath
        leaving = document.createElement('img');
        leaving.className = 'kodza-product-grid__leaving';
        leaving.alt = '';
        leaving.src = (dots && current() && second ? second : main).currentSrc;
        media.querySelector('.kodza-product-grid__leaving')?.remove();
        track.after(leaving);
      }
      if (track) track.scrollLeft = 0;
      main.removeAttribute('srcset');
      main.src = image;
      if (alt != null) main.alt = alt;
      if (second && imageSecond) {
        second.removeAttribute('srcset');
        second.src = imageSecond;
      }
      mark();
      if (!leaving) return;
      try {
        await main.decode();
      } catch {}
      if (turn !== swapping || signal.aborted) return leaving.remove();
      // Wiped away towards the new swatch: the new colour comes from where you clicked
      const out = forward ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)';
      const options = { duration: ms(SWAP), easing: 'cubic-bezier(0.65, 0, 0.35, 1)' };
      play(main, [{ transform: 'scale(1.06)' }, { transform: 'none' }], { ...options, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      play(leaving, [{ clipPath: 'inset(0 0 0 0)' }, { clipPath: out }], { ...options, fill: 'forwards' })
        .finished.then(() => leaving.remove(), () => leaving.remove());
    };
    swatches.forEach((input) => input.addEventListener('change', () => input.checked && swap(input), { signal }));

    // ---------- Add, and the sizes ----------
    if (!open) return;
    let label = open.querySelector('.kodza-product-grid__word');
    const first = label?.textContent || '';
    // A word rolling: the old one goes up, the new one comes from below
    // `swap`: the button is out of sight (the sizes are showing), so the word just changes and
    // the button brings it back down: one motion, not a roll inside a slide
    const roll = (text, swap) => {
      if (!label || label.textContent === text) return;
      const next = label.cloneNode(false);
      next.textContent = text;
      const old = label;
      label = next;
      open.querySelectorAll('.kodza-product-grid__word').forEach((el) => el !== old && el.remove());
      if (still || swap) return old.replaceWith(next);
      open.append(next);
      const options = { duration: ms(ROLL), easing: 'cubic-bezier(0.65, 0, 0.35, 1)' };
      // Far enough to leave its box: 130% of a word alone stays inside a tall button
      const far = `${Math.max(old.offsetHeight * 1.3, (open.clientHeight + old.offsetHeight) / 2 + 2)}px`;
      play(old, [{ transform: 'none' }, { transform: `translateY(-${far})` }], { ...options, fill: 'forwards' })
        .finished.then(() => old.remove(), () => old.remove());
      play(next, [{ transform: `translateY(${far})` }, { transform: 'none' }], options);
    };

    sizes.forEach((size, i) => size.style.setProperty('--kz-product-grid-i', i));
    const picking = () => root.classList.contains('is-picking');
    const pick = (on, focus) => {
      if (!sizes.length || on === picking()) return;
      root.classList.toggle('is-picking', on);
      open.setAttribute('aria-expanded', String(on));
      if (on && focus) sizes.find((size) => !size.disabled)?.focus({ preventScroll: true });
      // Closed while a size had the focus: it goes back to Add
      if (!on && add.contains(document.activeElement) && document.activeElement !== open) open.focus({ preventScroll: true });
    };
    if (sizes.length) {
      // event.detail is 0 for a click made with the keyboard
      open.addEventListener('click', (event) => pick(true, event.detail === 0), { signal });
      root.addEventListener('pointerleave', (event) => event.pointerType === 'mouse' && pick(false), { signal });
      add.addEventListener('focusout', (event) => {
        if (!add.contains(event.relatedTarget) && event.relatedTarget) pick(false);
      }, { signal });
      add.addEventListener('keydown', (event) => {
        if (!picking()) return;
        if (event.key === 'Escape') {
          event.preventDefault();
          pick(false);
          open.focus({ preventScroll: true });
        } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          const live = sizes.filter((size) => !size.disabled);
          const at = live.indexOf(document.activeElement);
          if (at < 0) return;
          event.preventDefault();
          live[(at + (event.key === 'ArrowRight' ? 1 : live.length - 1)) % live.length].focus();
        }
      }, { signal });
    }

    // In the cart: Added, then Add again. A refused request brings Add back at once
    let back = null;
    root.addEventListener('kodza:cart-add', (event) => {
      if (event.target !== root) return;
      const focused = add.contains(document.activeElement);
      const fromSizes = picking();
      root.classList.add('is-added');
      pick(false);
      if (focused) open.focus({ preventScroll: true });
      roll(word('added'), fromSizes);
      clearTimeout(back);
      timers.delete(back);
      const reset = () => {
        root.classList.remove('is-added');
        roll(first);
      };
      // The platform passes its request to wait() while the event runs: read it just after
      queueMicrotask(() => {
        Promise.resolve(event.detail?.request).then(
          () => !signal.aborted && (back = later(reset, HOLD)),
          () => !signal.aborted && reset(),
        );
      });
    }, { signal });
  }

  // ---------- Cart engine (begin) ----------
  // The same block in every component of the E-commerce family, copied as is: the first one loaded
  // sets up window.kodzaCart, the next ones find it, so three components pasted make one cart.
  // It speaks in events on document, which bubble:
  //   kodza:cart-add     (cancelable) { id, variant, title, options, price, currency, quantity, image, url, wait(promise) }
  //   kodza:cart-update  (cancelable) { key, quantity }, 0 removes the line
  //   kodza:cart-change  the whole cart { items, count, subtotal, currency }, prices in cents
  //   kodza:cart-open    opens the Cart Drawer nearest to where it was sent from
  // Until a platform answers, a small cart kept in localStorage takes the adds. A platform
  // (Shopify, WooCommerce) cancels the add, makes its request, passes the promise to wait(), then
  // sends kodza:cart-change with its own cart: from then on the small cart only listens.
  // An add-to-cart <form action="/cart/add"> (name="id" or "add-to-cart", name="quantity",
  // options[Name]) works without the script; with it, its submit becomes a kodza:cart-add.
  const cart = window.kodzaCart || (window.kodzaCart = (() => {
    const STORE = 'kodza-cart';
    const COUNTS = '.kodza-header-shop__cart, .kodza-add-to-cart__cart, [data-kodza-cart-count]';
    let items = [];
    let listening = false;
    let sending = false;
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (Array.isArray(saved?.items)) items = saved.items;
    } catch {}
    const keyOf = (item) => String(item.key ?? item.variant ?? item.id ?? item.title);
    const whole = (n, fallback) => (Number.isFinite(Number(n)) ? Math.round(Number(n)) : fallback);
    const get = () => {
      const list = items.map((item) => ({ ...item, options: { ...item.options } }));
      return {
        items: list,
        count: list.reduce((n, item) => n + item.quantity, 0),
        subtotal: list.reduce((n, item) => n + item.price * item.quantity, 0),
        currency: list[0]?.currency || '',
      };
    };
    const counts = (n) => document.querySelectorAll(COUNTS).forEach((el) => {
      if (el.dataset.count !== String(n)) el.dataset.count = String(n);
    });
    const send = () => {
      const detail = get();
      counts(detail.count);
      sending = true;
      document.dispatchEvent(new CustomEvent('kodza:cart-change', { detail }));
      sending = false;
      if (!listening) {
        try {
          localStorage.setItem(STORE, JSON.stringify({ items }));
        } catch {}
      }
    };
    const formats = new Map();
    const format = (cents, currency, locale) => {
      const lang = locale || document.documentElement.lang || undefined;
      const id = `${lang}|${currency}`;
      if (!formats.has(id)) {
        try {
          formats.set(id, new Intl.NumberFormat(lang, currency ? { style: 'currency', currency } : { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        } catch {
          formats.set(id, new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        }
      }
      return formats.get(id).format((Number(cents) || 0) / 100);
    };
    const add = (item, source = document) => {
      const detail = { ...item, wait: (promise) => { detail.request = Promise.resolve(promise); } };
      source.dispatchEvent(new CustomEvent('kodza:cart-add', { bubbles: true, cancelable: true, detail }));
      return detail.request || Promise.resolve();
    };
    const update = (key, quantity, source = document) => {
      source.dispatchEvent(new CustomEvent('kodza:cart-update', { bubbles: true, cancelable: true, detail: { key: String(key), quantity } }));
    };
    // The small cart answers last (on window), once the page's own listeners had their say
    window.addEventListener('kodza:cart-add', (event) => {
      if (event.defaultPrevented || listening) return;
      const d = event.detail || {};
      const key = keyOf(d);
      const quantity = Math.max(1, whole(d.quantity, 1));
      const found = items.find((item) => item.key === key);
      if (found) found.quantity = Math.min(99, found.quantity + quantity);
      else {
        const item = {
          key, id: d.id ?? null, variant: d.variant ?? null, title: String(d.title || ''), options: { ...d.options },
          price: whole(d.price, 0), currency: d.currency || items[0]?.currency || '', quantity: Math.min(99, quantity),
          image: d.image || '', url: d.url || '',
        };
        items.splice(Number.isInteger(d.at) ? Math.min(d.at, items.length) : 0, 0, item);
      }
      send();
    });
    window.addEventListener('kodza:cart-update', (event) => {
      if (event.defaultPrevented || listening) return;
      const { key, quantity } = event.detail || {};
      const found = items.find((item) => item.key === String(key));
      if (!found) return;
      const n = Math.max(0, Math.min(99, whole(quantity, found.quantity)));
      if (n) found.quantity = n;
      else items = items.filter((item) => item !== found);
      send();
    });
    // A cart sent from elsewhere: a platform owns it now
    document.addEventListener('kodza:cart-change', (event) => {
      if (sending) return;
      listening = true;
      const d = event.detail || {};
      items = (d.items || []).map((item) => ({ ...item, key: keyOf(item), options: { ...item.options } }));
      counts(Math.max(0, whole(d.count, items.reduce((n, item) => n + item.quantity, 0))));
    });
    // An add-to-cart form sends its add instead of leaving the page
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (event.defaultPrevented || !(form instanceof HTMLFormElement) || !form.matches(FORMS)) return;
      event.preventDefault();
      const data = new FormData(form, event.submitter);
      const options = {};
      data.forEach((value, name) => {
        const match = /^options\[(.+)\]$/.exec(name);
        if (match) options[match[1]] = String(value);
      });
      const id = form.dataset.id || data.get('product-id') || data.get('add-to-cart') || data.get('id');
      const variant = data.get('variation_id') || data.get('id') || [id, ...Object.values(options)].join(' / ');
      const own = form.dataset;
      const picture = own.image ? null : pictureFor(form);
      add({
        id, variant, title: own.title || '', options, price: whole(own.price, 0), currency: own.currency || '',
        quantity: whole(data.get('quantity'), 1), image: own.image || picture?.currentSrc || picture?.src || '', url: own.url || '',
      }, form);
    });
    // Any [data-kodza-cart-open] (a bag link in a header) opens the drawer
    document.addEventListener('click', (event) => {
      const opener = event.target.closest?.('[data-kodza-cart-open]');
      if (!opener) return;
      event.preventDefault();
      opener.dispatchEvent(new CustomEvent('kodza:cart-open', { bubbles: true }));
    });
    const ready = () => counts(get().count);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
    else ready();
    return { get, add, update, format, send };
  })());
  // ---------- Cart engine (end) ----------

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
