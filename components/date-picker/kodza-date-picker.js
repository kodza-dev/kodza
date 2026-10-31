// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Date Picker
// Builds a field and a calendar over the real <input type="date"> and keeps it in step (firing
// "input" and "change" on it). Weeks start on Monday (data-week-start="0" for Sunday), names
// come from data-locale (or the page language). The calendar is a grid of buttons with one
// focusable day: arrows move by day and week, Page Up / Down by month, Home / End to the
// start and end of the week, Enter picks, Escape closes and gives the focus back.
(() => {
  const SELECTOR = '.kodza-date';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const parse = (value) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
  };
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const same = (a, b) => a && b && iso(a) === iso(b);
  const icon = '<svg class="kodza-date__icon" viewBox="0 0 18 18" aria-hidden="true"><rect x="2.5" y="3.5" width="13" height="12" rx="2.5"/><path d="M2.5 7.5h13M6 2v3M12 2v3"/></svg>';
  const arrow = (d) => `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="${d}"/></svg>`;
  let uid = 0;

  // A word or a month name rolls to its new value (up going forward, down going back)
  const roll = (box, text, dir = 1) => {
    const prev = box.lastElementChild;
    if (prev && prev.textContent === text) return;
    const span = Object.assign(document.createElement('span'), { textContent: text });
    box.append(span);
    if (!prev) return;
    if (reduceMotion) return prev.remove();
    const timing = { duration: 420, easing: ease };
    prev.animate([{ transform: 'none' }, { transform: `translateY(${dir * -110}%)` }], { ...timing, fill: 'forwards' }).finished.then(() => prev.remove());
    span.animate([{ transform: `translateY(${dir * 110}%)` }, { transform: 'none' }], timing);
  };

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const native = root.querySelector('.kodza-date__native');
    const label = root.querySelector('.kodza-date__label');
    if (!native) return;
    const id = `kodza-date-${++uid}`;
    const locale = root.dataset.locale || document.documentElement.lang || undefined;
    const weekStart = root.dataset.weekStart === '0' ? 0 : 1;
    const long = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    const monthName = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
    const dayName = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const weekday = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
    const min = parse(native.min);
    const max = parse(native.max);
    const today = new Date();

    // The field
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'kodza-date__trigger';
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    if (label) {
      label.id = `${id}-label`;
      trigger.setAttribute('aria-labelledby', `${id}-label ${id}-value`);
    }
    const value = Object.assign(document.createElement('span'), { className: 'kodza-date__value', id: `${id}-value` });
    trigger.append(value);
    trigger.insertAdjacentHTML('beforeend', icon);

    // The calendar
    const pop = document.createElement('div');
    pop.className = 'kodza-date__pop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', label ? `${label.textContent}: choose a date` : 'Choose a date');
    pop.innerHTML = `
      <div class="kodza-date__head">
        <span class="kodza-date__month" aria-live="polite"></span>
        <span class="kodza-date__nav">
          <button type="button" data-step="-1" aria-label="Previous month">${arrow('M10 3.5 5.5 8l4.5 4.5')}</button>
          <button type="button" data-step="1" aria-label="Next month">${arrow('M6 3.5 10.5 8 6 12.5')}</button>
        </span>
      </div>
      <div class="kodza-date__weekdays" aria-hidden="true"></div>
      <div class="kodza-date__stage"></div>
      <div class="kodza-date__foot"><button class="kodza-date__today" type="button">Today</button></div>`;
    native.after(trigger, pop);
    native.tabIndex = -1;
    native.setAttribute('aria-hidden', 'true');
    const monthBox = pop.querySelector('.kodza-date__month');
    const stage = pop.querySelector('.kodza-date__stage');
    const weekdays = pop.querySelector('.kodza-date__weekdays');
    for (let i = 0; i < 7; i++) {
      const d = new Date(2024, 0, 1 + ((weekStart + i + 6) % 7));
      weekdays.append(Object.assign(document.createElement('span'), { textContent: weekday.format(d) }));
    }

    let selected = parse(native.value);
    let view = new Date((selected || today).getFullYear(), (selected || today).getMonth(), 1);
    let focusDay = selected || today;
    let grid = null;

    const disabled = (d) => (min && d < min) || (max && d > max);

    // One month: six weeks of buttons, and the ink mark on the chosen day
    const build = (month) => {
      const box = document.createElement('div');
      box.className = 'kodza-date__days';
      box.setAttribute('role', 'grid');
      const mark = Object.assign(document.createElement('span'), { className: 'kodza-date__mark is-hidden' });
      mark.setAttribute('aria-hidden', 'true');
      box.append(mark);
      const first = new Date(month.getFullYear(), month.getMonth(), 1);
      const offset = (first.getDay() - weekStart + 7) % 7;
      for (let i = 0; i < 42; i++) {
        const d = addDays(first, i - offset);
        const day = document.createElement('button');
        day.type = 'button';
        day.className = 'kodza-date__day';
        day.textContent = d.getDate();
        day.dataset.date = iso(d);
        day.tabIndex = -1;
        day.setAttribute('aria-label', dayName.format(d));
        if (d.getMonth() !== month.getMonth()) day.classList.add('is-outside');
        if (same(d, today)) {
          day.classList.add('is-today');
          day.setAttribute('aria-current', 'date');
        }
        day.disabled = !!disabled(d);
        box.append(day);
      }
      return box;
    };

    const placeMark = (box, animate) => {
      const mark = box.querySelector('.kodza-date__mark');
      const day = selected && box.querySelector(`[data-date="${iso(selected)}"]:not(.is-outside)`);
      box.querySelectorAll('.kodza-date__day').forEach((b) => b.setAttribute('aria-selected', String(b === day)));
      if (!day) return mark.classList.add('is-hidden');
      if (!animate) mark.style.transition = 'none';
      mark.style.setProperty('--kz-mark-x', `${day.offsetLeft}px`);
      mark.style.setProperty('--kz-mark-y', `${day.offsetTop}px`);
      mark.classList.remove('is-hidden');
      if (!animate) requestAnimationFrame(() => mark.style.removeProperty('transition'));
    };

    const setFocusable = () => {
      grid.querySelectorAll('.kodza-date__day').forEach((b) => (b.tabIndex = b.dataset.date === iso(focusDay) ? 0 : -1));
    };

    // Show a month: the old grid leaves on one side, the new one comes in from the other
    const render = (dir = 0) => {
      const next = build(view);
      const old = grid;
      const hadFocus = old?.contains(document.activeElement);
      grid = next;
      stage.append(next);
      roll(monthBox, monthName.format(view), dir || 1);
      placeMark(next, false);
      setFocusable();
      // The grid that held the focus is going away: the focus moves to the new one
      if (hadFocus) next.querySelector('[tabindex="0"]')?.focus({ preventScroll: true });
      if (old) {
        if (!dir || reduceMotion) old.remove();
        else {
          const timing = { duration: 380, easing: ease };
          old.animate([{ transform: 'none', opacity: 1 }, { transform: `translateX(${dir * -40}%)`, opacity: 0 }], { ...timing, fill: 'forwards' }).finished.then(() => old.remove());
          next.animate([{ transform: `translateX(${dir * 40}%)`, opacity: 0 }, { transform: 'none', opacity: 1 }], timing);
        }
      }
    };

    const showValue = (animate) => {
      const text = selected ? long.format(selected) : 'Pick a date';
      if (!animate) value.replaceChildren();
      roll(value, text, 1);
      value.lastElementChild.classList.toggle('is-empty', !selected);
    };

    const goToMonth = (d, dir) => {
      view = new Date(d.getFullYear(), d.getMonth(), 1);
      render(dir);
    };

    const moveFocus = (d) => {
      if (d.getMonth() !== view.getMonth() || d.getFullYear() !== view.getFullYear()) goToMonth(d, d > focusDay ? 1 : -1);
      focusDay = d;
      setFocusable();
      grid.querySelector(`[data-date="${iso(d)}"]`)?.focus({ preventScroll: true });
    };

    const isOpen = () => root.classList.contains('is-open');
    const open = () => {
      if (isOpen()) return;
      focusDay = selected || today;
      if (!grid || view.getMonth() !== focusDay.getMonth() || view.getFullYear() !== focusDay.getFullYear()) {
        view = new Date(focusDay.getFullYear(), focusDay.getMonth(), 1);
        grid?.remove();
        grid = null;
        render(0);
      }
      setFocusable();
      // Not enough room below: the calendar opens upwards. A closed panel that changes side gets
      // there at once, so it always unrolls from the field
      const box = trigger.getBoundingClientRect();
      const above = box.bottom + 380 > innerHeight && box.top > 380;
      if (above !== root.classList.contains('is-above')) {
        pop.style.transition = 'none';
        root.classList.toggle('is-above', above);
        void pop.offsetWidth;
        pop.style.transition = '';
      }
      root.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(() => grid.querySelector('[tabindex="0"]')?.focus({ preventScroll: true }));
    };
    const close = (refocus = true) => {
      if (!isOpen()) return;
      root.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      if (refocus) trigger.focus({ preventScroll: true });
    };

    const pick = (d) => {
      if (!d || disabled(d)) return;
      const changed = !same(d, selected);
      if (d.getMonth() !== view.getMonth() || d.getFullYear() !== view.getFullYear()) goToMonth(d, d > (selected || view) ? 1 : -1);
      selected = d;
      focusDay = d;
      placeMark(grid, true);
      setFocusable();
      native.value = iso(d);
      showValue(true);
      if (changed) {
        native.dispatchEvent(new Event('input', { bubbles: true }));
        native.dispatchEvent(new Event('change', { bubbles: true }));
      }
      // Let the mark land, then close
      setTimeout(() => !signal.aborted && close(), reduceMotion ? 0 : 320);
    };

    trigger.addEventListener('click', () => (isOpen() ? close() : open()), { signal });
    pop.querySelectorAll('[data-step]').forEach((button) => button.addEventListener('click', () => {
      const step = Number(button.dataset.step);
      goToMonth(new Date(view.getFullYear(), view.getMonth() + step, 1), step);
      focusDay = new Date(view.getFullYear(), view.getMonth(), Math.min(focusDay.getDate(), 28));
      setFocusable();
    }, { signal }));
    pop.querySelector('.kodza-date__today').addEventListener('click', () => pick(new Date(today.getFullYear(), today.getMonth(), today.getDate())), { signal });
    stage.addEventListener('click', (event) => {
      const day = event.target.closest('.kodza-date__day');
      if (day && !day.disabled) pick(parse(day.dataset.date));
    }, { signal });
    pop.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        return close();
      }
      if (!event.target.classList.contains('kodza-date__day')) return;
      const dow = (focusDay.getDay() - weekStart + 7) % 7;
      // The same day a month away, or that month's last one (31 March, then 30 April)
      const monthAway = (n) => {
        const last = new Date(focusDay.getFullYear(), focusDay.getMonth() + n + 1, 0).getDate();
        return new Date(focusDay.getFullYear(), focusDay.getMonth() + n, Math.min(focusDay.getDate(), last));
      };
      const moves = {
        ArrowLeft: () => addDays(focusDay, -1),
        ArrowRight: () => addDays(focusDay, 1),
        ArrowUp: () => addDays(focusDay, -7),
        ArrowDown: () => addDays(focusDay, 7),
        Home: () => addDays(focusDay, -dow),
        End: () => addDays(focusDay, 6 - dow),
        PageUp: () => monthAway(-1),
        PageDown: () => monthAway(1),
      };
      if (moves[event.key]) {
        event.preventDefault();
        moveFocus(moves[event.key]());
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        pick(focusDay);
      }
    }, { signal });
    // A click on the label text opens the calendar instead of reaching the hidden input
    root.addEventListener('click', (event) => {
      if (trigger.contains(event.target) || pop.contains(event.target)) return;
      event.preventDefault();
      trigger.focus();
    }, { signal });
    pop.addEventListener('click', (event) => event.preventDefault(), { signal });
    document.addEventListener('pointerdown', (event) => !root.contains(event.target) && close(false), { signal });
    // Escape closes it even if the focus wandered off to the page
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen() && !root.contains(document.activeElement)) close();
    }, { signal });
    root.addEventListener('focusout', (event) => {
      if (isOpen() && event.relatedTarget && !root.contains(event.relatedTarget)) close(false);
    }, { signal });

    // The calendar is built right away, so the panel has its real size before it first opens
    render(0);
    showValue(false);
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
