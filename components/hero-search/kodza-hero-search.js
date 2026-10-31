// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Hero Search
// Buy and Rent stay native radios: an ink pill, with a paper copy of the labels cut to the same
// shape, slides from one to the other. Type and Budget keep their real <select>: the list of Kodza
// Select is built over each one (options read again when the page changes them, "change" fired on
// the real one) and its value rolls. A field may hold one select per mode (data-mode): the chosen
// mode's one is on, the other disabled, so the form only sends one; the listing's price, written
// per mode, rolls with it. While the place is empty and nothing in the form is in use, its
// examples (data-examples) roll one after the other, the placeholder saying the one on screen. A
// number the page writes into the count rolls in, the button easing to its new width. The
// entrance is Hero Split's, played once the section is in view, its picture decoded and the fonts
// in; "kodza:replay" plays it again, from the first example.
(() => {
  const SELECTOR = '.kodza-hero-search';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GLIDE = 'cubic-bezier(0.6, 0, 0.1, 1)'; // slow start, long settle
  const SOFT = 'cubic-bezier(0.25, 1, 0.5, 1)';
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const EVERY = 2600; // ms between two examples
  const FIRST = 3200; // ms from the start of the entrance to the first example
  const tick = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" pathLength="1"/></svg>';
  const chevron = '<svg class="kodza-hero-search__chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6.5 8 10.5l4-4"/></svg>';
  let uid = 0;

  const decoded = (root) => Promise.all([...root.querySelectorAll('img')].map((img) => img.decode().catch(() => {})));
  const span = (text) => Object.assign(document.createElement('span'), { textContent: text });
  const letter = (event) => event.key.length === 1 && /\S/.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey;

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const q = (s) => root.querySelector(s);
    const form = q('.kodza-hero-search__form');
    const modes = q('.kodza-hero-search__modes');
    const radios = [...root.querySelectorAll('.kodza-hero-search__radio')];
    const input = q('.kodza-hero-search__input');
    const where = input?.closest('.kodza-hero-search__field');
    const count = q('.kodza-hero-search__count');
    const prices = [...root.querySelectorAll('.kodza-hero-search__price > [data-mode]')];
    const fields = [];
    const entrance = [];

    const stop = (list) => {
      list.forEach((a) => a.cancel());
      list.length = 0;
    };
    const animate = (list, el, keyframes, options) => {
      if (!el) return null;
      const animation = el.animate(keyframes, { easing: GLIDE, fill: 'backwards', ...options });
      list.push(animation);
      return animation;
    };

    // The old text rises out of its window as the new one comes from below. A change that lands
    // mid-roll drops the one already leaving, and the old one leaves from where it stands
    const roll = (box, text, moving, duration = 700) => {
      const old = box.lastElementChild;
      if (old?.textContent === text) return;
      [...box.children].forEach((el) => el !== old && el.remove());
      const next = span(text);
      box.append(next);
      if (!old) return;
      if (!moving || reduceMotion) return old.remove();
      const y = new DOMMatrixReadOnly(getComputedStyle(old).transform).m42;
      old.getAnimations().forEach((a) => a.cancel());
      const timing = { duration, easing: EASE };
      old.animate([{ transform: `translateY(${y}px)` }, { transform: 'translateY(-110%)' }], { ...timing, fill: 'forwards' }).finished.then(() => old.remove(), () => {});
      next.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], timing);
    };

    // Buy / Rent: the pill and its paper copy are cut to the chosen label
    const indicator = Object.assign(document.createElement('span'), { className: 'kodza-hero-search__indicator' });
    const mirror = Object.assign(document.createElement('span'), { className: 'kodza-hero-search__mirror' });
    [indicator, mirror].forEach((el) => el.setAttribute('aria-hidden', 'true'));
    radios.forEach((radio) => {
      const ghost = span(radio.closest('label')?.textContent.trim() ?? '');
      ghost.className = 'kodza-hero-search__ghost';
      mirror.append(ghost);
    });
    modes?.prepend(indicator);
    modes?.append(mirror);
    const chosen = () => radios.find((radio) => radio.checked) ?? radios[0];
    const mode = () => chosen()?.value;
    const place = () => {
      const label = chosen()?.closest('label');
      if (!label || !modes.offsetWidth) return;
      modes.style.setProperty('--kz-hero-search-l', `${label.offsetLeft}px`);
      modes.style.setProperty('--kz-hero-search-r', `${modes.offsetWidth - label.offsetLeft - label.offsetWidth}px`);
    };
    place();
    // The pill only slides once it stands in place: never on arrival or after a resize
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!signal.aborted) root.classList.add('is-live');
    }));
    const resize = new ResizeObserver(() => place());
    if (modes) resize.observe(modes);

    // Where: its examples roll while it is empty, nothing in the form has the focus, no list is
    // open, and the section is on screen with the tab in front
    const examples = (input?.dataset.examples ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    const example = Object.assign(document.createElement('span'), { className: 'kodza-hero-search__example' });
    example.setAttribute('aria-hidden', 'true');
    let index = 0;
    let timer = 0;
    let shown = false;
    let visible = false;
    const rolling = examples.length > 1 && !reduceMotion;
    const busy = () => form?.contains(document.activeElement) || fields.some((field) => field.isOpen());
    const free = () => rolling && shown && visible && !document.hidden && !input.value && !busy();
    const schedule = (delay = EVERY) => {
      clearTimeout(timer);
      where?.classList.toggle('is-rolling', rolling && !input.value && document.activeElement !== input);
      if (free()) timer = setTimeout(next, delay);
    };
    const next = () => {
      if (!free()) return;
      index = (index + 1) % examples.length;
      input.placeholder = examples[index];
      roll(example, examples[index], true);
      schedule();
    };
    if (rolling) {
      input.placeholder = examples[0];
      example.append(span(examples[0]));
      input.after(example);
      input.addEventListener('input', () => schedule(), { signal });
      ['focusin', 'focusout'].forEach((type) => form?.addEventListener(type, () => schedule(), { signal }));
      document.addEventListener('visibilitychange', () => schedule(), { signal });
      const seen = new IntersectionObserver((entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        schedule();
      });
      seen.observe(input);
      signal.addEventListener('abort', () => seen.disconnect());
    }

    // Type and Budget: the list of Kodza Select over the real select. Keyboard as in the ARIA
    // "select-only combobox" pattern: the focus stays on the field, arrows move, letters jump,
    // Enter picks, Escape closes
    const dress = (field) => {
      const natives = [...field.querySelectorAll('.kodza-hero-search__native')];
      if (!natives.length) return;
      const label = field.querySelector('.kodza-hero-search__label');
      const id = `kodza-hero-search-${++uid}`;
      const current = () => natives.find((select) => select.dataset.mode === mode()) ?? natives[0];
      let native = current();

      // The field: a button that says the current value
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'kodza-hero-search__trigger';
      trigger.setAttribute('role', 'combobox');
      trigger.setAttribute('aria-haspopup', 'listbox');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-controls', `${id}-list`);
      if (label) {
        label.id = `${id}-label`;
        trigger.setAttribute('aria-labelledby', `${id}-label`);
      }
      const value = Object.assign(document.createElement('span'), { className: 'kodza-hero-search__value' });
      trigger.append(value);
      trigger.insertAdjacentHTML('beforeend', chevron);

      // The list, from the real options (built again whenever the page changes them)
      const list = document.createElement('ul');
      list.className = 'kodza-hero-search__list';
      list.id = `${id}-list`;
      list.setAttribute('role', 'listbox');
      if (label) list.setAttribute('aria-labelledby', `${id}-label`);
      const highlight = document.createElement('li');
      highlight.className = 'kodza-hero-search__highlight';
      highlight.setAttribute('role', 'presentation');
      list.append(highlight);
      let options = [];
      const entries = new Map();
      const build = () => {
        options = [];
        entries.clear();
        [...list.children].forEach((child) => child !== highlight && child.remove());
        [...native.options].forEach((option) => {
          if (option.hidden) return; // a placeholder: "nothing chosen yet" is not a choice
          const item = document.createElement('li');
          item.className = 'kodza-hero-search__option';
          item.id = `${id}-option-${options.length}`;
          item.setAttribute('role', 'option');
          item.innerHTML = tick;
          item.append(option.textContent.trim());
          if (option.disabled || option.closest('optgroup')?.disabled) item.setAttribute('aria-disabled', 'true');
          list.append(item);
          const entry = { option, item };
          options.push(entry);
          entries.set(item, entry);
        });
      };
      build();
      natives.at(-1).after(trigger, list);
      natives.forEach((select) => {
        select.tabIndex = -1;
        select.setAttribute('aria-hidden', 'true');
      });

      const enabled = () => options.filter(({ item }) => item.getAttribute('aria-disabled') !== 'true');
      const isOpen = () => field.classList.contains('is-open');
      let active = null;

      const sync = (moving) => {
        options.forEach(({ option, item }) => item.setAttribute('aria-selected', String(option.selected)));
        const picked = native.selectedOptions[0];
        roll(value, picked && !picked.hidden ? picked.textContent.trim() : '', moving, 420);
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
        // Scroll the list only (scrollIntoView would also nudge the page), with the list's own
        // padding above the very first row
        if (scroll) {
          const top = entry.item.previousElementSibling === highlight ? 0 : entry.item.offsetTop;
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
        if (above !== field.classList.contains('is-above')) {
          list.style.transition = 'none';
          field.classList.toggle('is-above', above);
          void list.offsetWidth;
          list.style.transition = '';
        }
        field.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        light(options.find(({ option }) => option.selected) || enabled()[0]);
        schedule();
      };

      const close = () => {
        if (!isOpen()) return;
        field.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
        light(null);
        schedule();
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
        const at = pool.indexOf(active);
        if (!isOpen()) {
          if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
            event.preventDefault();
            open();
          } else if (letter(event)) {
            typeAhead(event.key);
          }
          return;
        }
        const moves = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: pool.length - 1, PageDown: at + 5, PageUp: at - 5 };
        if (event.key in moves) {
          event.preventDefault();
          light(pool[Math.max(0, Math.min(pool.length - 1, moves[event.key]))]);
        } else if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          pick(active);
        } else if (event.key === 'Tab') {
          pick(active);
        } else if (letter(event)) {
          typeAhead(event.key);
        }
      }, { signal });

      const entryAt = (event) => entries.get(event.target.closest?.('.kodza-hero-search__option'));
      list.addEventListener('pointermove', (event) => {
        const entry = entryAt(event);
        if (entry && active !== entry && entry.item.getAttribute('aria-disabled') !== 'true') light(entry, false);
      }, { signal });
      list.addEventListener('click', (event) => pick(entryAt(event)), { signal });
      // Keep the list from stealing the focus from the field, and the wrapping <label> from
      // sending clicks to the hidden select: a click on the label text focuses the field
      list.addEventListener('mousedown', (event) => event.preventDefault(), { signal });
      field.addEventListener('click', (event) => {
        if (trigger.contains(event.target)) return;
        event.preventDefault();
        if (!list.contains(event.target)) trigger.focus();
      }, { signal });
      document.addEventListener('pointerdown', (event) => !field.contains(event.target) && close(), { signal });
      // Escape closes it wherever the focus is: opened with a click, it stays on the field
      // (Chrome) or on the page (Safari)
      document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || !isOpen()) return;
        event.preventDefault();
        close();
        trigger.focus();
      }, { signal });
      // The real select changed from elsewhere (a form reset, a script): follow it
      natives.forEach((select) => select.addEventListener('change', () => select === native && sync(true), { signal }));
      native.form?.addEventListener('reset', () => setTimeout(() => sync(true)), { signal });

      // The page changed the options (counts, disabled ones, a new list): build the list again,
      // keep the highlight on the same option, and show the value without a roll. An attribute
      // written again with the value it already had changes nothing
      let queued = false;
      const changed = (record) => record.type !== 'attributes' || record.oldValue !== record.target.getAttribute(record.attributeName);
      const observer = new MutationObserver((records) => {
        if (queued || !records.some(changed)) return;
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
      natives.forEach((select) => observer.observe(select, { childList: true, subtree: true, characterData: true, attributes: true, attributeOldValue: true, attributeFilter: ['disabled', 'hidden', 'label'] }));
      signal.addEventListener('abort', () => observer.disconnect());

      // The mode changed: its own select comes on, the other one is switched off, and the value rolls
      const follow = (moving) => {
        const on = current();
        natives.forEach((select) => {
          select.hidden = select !== on;
          select.disabled = select !== on;
        });
        observer.takeRecords();
        if (on === native) return;
        native = on;
        close();
        build();
        sync(moving);
      };
      follow(false);
      sync(false);
      fields.push({ isOpen, close, follow });
    };
    root.querySelectorAll('.kodza-hero-search__select').forEach(dress);

    // The listing's price: the chosen mode's one, rolling in when the mode changes
    const price = (moving) => {
      const on = prices.find((el) => el.dataset.mode === mode()) ?? prices[0];
      const was = prices.find((el) => el.classList.contains('is-on'));
      prices.forEach((el) => el.classList.toggle('is-on', el === on));
      if (!moving || reduceMotion || !was || was === on) return;
      const y = new DOMMatrixReadOnly(getComputedStyle(was).transform).m42;
      prices.forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
      const timing = { duration: 700, easing: EASE };
      was.animate([{ visibility: 'visible', transform: `translateY(${y}px)` }, { visibility: 'visible', transform: 'translateY(-110%)' }], timing);
      on.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], timing);
    };
    price(false);

    radios.forEach((radio) => radio.addEventListener('change', () => {
      place();
      fields.forEach((field) => field.follow(true));
      price(true);
    }, { signal }));

    // The count: a number the page writes in rolls, and the button eases to its new width
    if (count) {
      let current = span(count.textContent.trim());
      count.replaceChildren(current);
      const counted = new MutationObserver(() => {
        const fresh = [...count.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE);
        if (!fresh.length) return; // our own spans coming and going
        const text = fresh.map((node) => node.textContent).join('').trim();
        count.replaceChildren(current);
        const from = count.offsetWidth;
        roll(count, text, true, 420);
        current = count.lastElementChild;
        const to = current.offsetWidth;
        counted.takeRecords();
        if (reduceMotion || from === to) return;
        count.getAnimations().forEach((a) => a.cancel());
        count.animate([{ width: `${from}px` }, { width: `${to}px` }], { duration: 420, easing: EASE });
      });
      counted.observe(count, { childList: true });
      signal.addEventListener('abort', () => counted.disconnect());
    }

    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      resize.disconnect();
      stop(entrance);
    });

    if (reduceMotion) {
      root.classList.add('is-shown');
      return;
    }

    const rise = (el, delay, duration) => animate(entrance, el, [{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration, delay });
    const play = async () => {
      await decoded(root);
      if (signal.aborted) return;
      stop(entrance);
      fields.forEach((field) => field.close());
      // The examples start again from the first one, hidden while the form comes in
      if (rolling) {
        clearTimeout(timer);
        index = 0;
        input.placeholder = examples[0];
        roll(example, examples[0], false);
      }
      root.classList.add('is-shown');
      rise(q('.kodza-hero-search__eyebrow .kodza-hero-search__rise'), 0, 1000);
      root.querySelectorAll('.kodza-hero-search__line .kodza-hero-search__rise').forEach((line, i) => rise(line, 110 + i * 125, 1170));
      // The curtain: both layers on transforms, the picture settles from a slight zoom
      animate(entrance, q('.kodza-hero-search__curtain'), [{ transform: 'translateY(-100%)' }, { transform: 'none' }], { duration: 1350, delay: 200 });
      animate(entrance, q('.kodza-hero-search__hold'), [{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: 1350, delay: 200 });
      animate(entrance, q('.kodza-hero-search__frame img'), [{ transform: 'scale(1.2)' }, { transform: 'none' }], { duration: 2000, delay: 200, easing: SOFT });
      [q('.kodza-hero-search__lead'), form].forEach((el, i) => {
        animate(entrance, el, [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: 700 + i * 110, easing: SOFT });
      });
      // The listing's tag lands once the picture is uncovered
      animate(entrance, q('.kodza-hero-search__tag'), [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: 1150, easing: SOFT });
      // The faint caption is fully there halfway up: never read half-faded
      animate(entrance, q('.kodza-hero-search__caption'), [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, offset: 0.5 }, { opacity: 1, transform: 'none' }], { duration: 900, delay: 920, easing: SOFT });
      // The examples wait for the card to settle
      shown = true;
      if (rolling) schedule(FIRST);
    };

    root.addEventListener('kodza:replay', play, { signal });
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      io.disconnect();
      play();
    }, { rootMargin: '0px 0px -15% 0px' });
    signal.addEventListener('abort', () => io.disconnect());
    Promise.all([document.fonts?.ready, decoded(root)]).then(() => {
      if (!signal.aborted) io.observe(root);
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
