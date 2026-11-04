// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Date Range
// Builds one field and a calendar of two months over two real <input type="date"> (the start,
// then the end) and keeps them in step (firing "input" and "change" on them). A click on a day
// sets the start, then the ink band follows the pointer to the end, the length shown as it
// goes: what you see is what the next click takes. data-unit="night" counts nights (a stay: the
// end comes after the start), days otherwise. Shortcuts with data-presets="last-7 last-30 …"
// (the list is in PRESETS), data-months="1" for one month (one on a narrow screen anyway),
// weeks start on Monday (data-week-start="0" for Sunday), names come from data-locale (or the
// page language), min and max are read on the inputs. Arrows move by day and week, Page Up /
// Down by month, Home / End to the start and end of the week, Enter picks, Escape closes and
// gives the focus back. The words and timings are below; each word can be set per field with
// data-text-<name> (data-text-empty="…", data-text-last-7="…"), {n} is filled in.
(() => {
  const SELECTOR = '.kodza-date-range';
  const WORDS = {
    empty: 'Add date', // a half of the field, with no date yet
    first: 'Pick a start date', // under the calendar, nothing picked
    last: 'Pick an end date', // under the calendar, the start picked
    day: '{n} day',
    days: '{n} days',
    night: '{n} night',
    nights: '{n} nights',
    clear: 'Clear',
    choose: 'Choose dates', // the panel, when the field has no aria-label
    shortcuts: 'Shortcuts',
    previous: 'Previous month',
    next: 'Next month',
    'last-7': 'Last 7 days',
    'last-30': 'Last 30 days',
    'last-90': 'Last 90 days',
    'this-week': 'This week',
    'this-month': 'This month',
    'last-month': 'Last month',
    'this-year': 'This year',
    'next-7': 'Next 7 days',
    'next-30': 'Next 30 days',
  };
  // The shortcuts, from today (t) and the first day of its week (w): [start, end]
  const PRESETS = {
    'last-7': (t) => [addDays(t, -6), t],
    'last-30': (t) => [addDays(t, -29), t],
    'last-90': (t) => [addDays(t, -89), t],
    'this-week': (t, w) => [w, t],
    'this-month': (t) => [new Date(t.getFullYear(), t.getMonth(), 1), t],
    'last-month': (t) => [new Date(t.getFullYear(), t.getMonth() - 1, 1), new Date(t.getFullYear(), t.getMonth(), 0)],
    'this-year': (t) => [new Date(t.getFullYear(), 0, 1), t],
    'next-7': (t) => [t, addDays(t, 6)],
    'next-30': (t) => [t, addDays(t, 29)],
  };
  const ROLL = 420; // ms, a date or the length rolling to its new value
  const SLIDE = 450; // ms, the months sliding by one
  const JUMP = 380; // ms, the months swapped for others further away
  const CLOSE_AFTER = 380; // ms, the end landing before the panel closes
  const PRESET_CLOSE = 560; // ms, a shortcut's band landing before the panel closes
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const parse = (value) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
  };
  function addDays(d, n) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  }
  const same = (a, b) => !!a && !!b && iso(a) === iso(b);
  // Days from a to b, whatever the clocks did in between
  const between = (a, b) => Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 864e5);
  // A month as one number, so that the next one is + 1
  const monthIndex = (d) => d.getFullYear() * 12 + d.getMonth();
  const fill = (words, values) => words.replace(/\{(\w+)\}/g, (all, key) => (key in values ? values[key] : all));
  const arrow = (d) => `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="${d}"/></svg>`;
  const make = (tag, className, text) => Object.assign(document.createElement(tag), { className, ...(text !== undefined && { textContent: text }) });
  let uid = 0;

  // A word rolls to its new value (up going forward, down going back), at the instance's pace.
  // One keyframe: a word sent off while it was still arriving leaves from where it is
  const roll = (box, text, dir = 1, pace = 1) => {
    const prev = box.lastElementChild;
    if (prev && prev.textContent === text) return prev;
    const span = make('span', '', text);
    box.append(span);
    if (!prev) return span;
    if (reduceMotion || !pace) {
      box.replaceChildren(span);
      return span;
    }
    const timing = { duration: ROLL * pace, easing: ease };
    prev.animate({ transform: `translateY(${dir * -110}%)` }, { ...timing, fill: 'forwards' }).finished.then(() => prev.remove(), () => {});
    span.animate([{ transform: `translateY(${dir * 110}%)` }, { transform: 'none' }], timing);
    return span;
  };

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    // The pace is read once the field is built (end of mount): read before, the style it computes
    // would turn the field's first state into a transition
    let pace = 1;
    let still = reduceMotion; // the still path: no motion asked, by the visitor or the site
    const natives = [...root.querySelectorAll('.kodza-date-range__native')];
    if (natives.length < 2) return;
    const names = [...root.querySelectorAll('.kodza-date-range__name')];
    const id = `kodza-date-range-${++uid}`;
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const locale = root.dataset.locale || document.documentElement.lang || undefined;
    const weekStart = root.dataset.weekStart === '0' ? 0 : 1;
    const nights = root.dataset.unit === 'night';
    const short = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' });
    const withYear = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    const monthName = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
    const dayName = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const weekday = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
    const min = parse(natives[0].min || natives[1].min);
    const max = parse(natives[1].max || natives[0].max);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekOf = (d) => addDays(d, -((d.getDay() - weekStart + 7) % 7));
    const disabled = (d) => (min && d < min) || (max && d > max);
    const within = (d) => (min && d < min ? min : max && d > max ? max : d);
    const shown = (d) => (d.getFullYear() === today.getFullYear() ? short : withYear).format(d);

    // The field: two halves, the start and the end, and the tint of the one being picked
    const field = make('div', 'kodza-date-range__field');
    field.append(make('span', 'kodza-date-range__active'));
    const values = [];
    const halves = [0, 1].map((i) => {
      const half = make('button', 'kodza-date-range__half');
      half.type = 'button';
      half.setAttribute('aria-haspopup', 'dialog');
      half.setAttribute('aria-expanded', 'false');
      const caption = make('span', 'kodza-date-range__caption', names[i]?.textContent || '');
      caption.id = `${id}-caption-${i}`;
      const value = make('span', 'kodza-date-range__value');
      value.id = `${id}-value-${i}`;
      half.setAttribute('aria-labelledby', `${caption.id} ${value.id}`);
      half.append(caption, value);
      field.append(half);
      values.push(value);
      return half;
    });

    // The calendar
    const pop = make('div', 'kodza-date-range__pop');
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', root.getAttribute('aria-label') || word('choose'));
    const presets = (root.dataset.presets || '').split(/\s+/).filter((key) => PRESETS[key]).map((key) => {
      const button = make('button', 'kodza-date-range__preset', word(key));
      button.type = 'button';
      button.dataset.preset = key;
      button.setAttribute('aria-pressed', 'false');
      const [a, b] = PRESETS[key](today, weekOf(today));
      button.disabled = !!(disabled(a) || disabled(b));
      return button;
    });
    if (presets.length) {
      const group = make('div', 'kodza-date-range__presets');
      group.setAttribute('role', 'group');
      group.setAttribute('aria-label', word('shortcuts'));
      group.append(...presets);
      pop.append(group);
    }
    const cal = make('div', 'kodza-date-range__cal');
    cal.innerHTML = `
      <button class="kodza-date-range__nav" type="button" data-step="-1" aria-label="${word('previous')}">${arrow('M10 3.5 5.5 8l4.5 4.5')}</button>
      <button class="kodza-date-range__nav" type="button" data-step="1" aria-label="${word('next')}">${arrow('M6 3.5 10.5 8 6 12.5')}</button>
      <div class="kodza-date-range__view"><div class="kodza-date-range__strip"></div></div>`;
    const foot = make('div', 'kodza-date-range__foot');
    const sum = make('span', 'kodza-date-range__sum');
    sum.setAttribute('aria-live', 'polite');
    const clear = make('button', 'kodza-date-range__clear', word('clear'));
    clear.type = 'button';
    foot.append(sum, clear);
    pop.append(cal, foot);
    root.append(field, pop);
    natives.forEach((native) => {
      native.tabIndex = -1;
      native.setAttribute('aria-hidden', 'true');
    });
    const view = cal.querySelector('.kodza-date-range__view');
    let strip = cal.querySelector('.kodza-date-range__strip');

    let start = parse(natives[0].value);
    let end = parse(natives[1].value);
    if (start && end && (end < start || (nights && same(start, end)))) end = null;
    if (!start) end = null;
    let active = 'start'; // the end being picked
    let hover = null; // the day under the pointer (or the focus) while the end is picked
    let swapped = false; // which of a month's two marks is the start: they trade on a range picked backwards
    let months = root.dataset.months === '1' ? 1 : 2;
    let first = 0; // the first month shown
    let focusDay = start || within(today);
    let slide = null;
    let count = -1;
    const parts = new WeakMap();

    // One month: its title, the days, a band per week and the two ink marks
    const build = (index) => {
      const month = new Date(Math.floor(index / 12), index % 12, 1);
      const box = make('div', 'kodza-date-range__month is-fresh');
      const title = make('span', 'kodza-date-range__title', monthName.format(month));
      const head = make('div', 'kodza-date-range__weekdays');
      head.setAttribute('aria-hidden', 'true');
      for (let i = 0; i < 7; i++) head.append(make('span', '', weekday.format(new Date(2024, 0, 1 + ((weekStart + i + 6) % 7)))));
      const days = make('div', 'kodza-date-range__days');
      days.setAttribute('role', 'group');
      days.setAttribute('aria-label', monthName.format(month));
      const offset = (month.getDay() - weekStart + 7) % 7;
      const length = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
      const bands = [];
      for (let r = 0; r < 6; r++) {
        const band = make('span', 'kodza-date-range__band');
        band.style.top = `calc(var(--kz-date-range-cell) * ${r})`;
        bands.push(band);
      }
      days.append(...bands);
      // The light copy of the dates the marks carry
      const ghost = make('span', 'kodza-date-range__ghost');
      for (let n = 1; n <= length; n++) {
        const d = new Date(month.getFullYear(), month.getMonth(), n);
        const day = make('button', 'kodza-date-range__day', n);
        day.type = 'button';
        day.dataset.date = iso(d);
        day.tabIndex = -1;
        day.setAttribute('aria-label', dayName.format(d));
        if (same(d, today)) {
          day.classList.add('is-today');
          day.setAttribute('aria-current', 'date');
        }
        day.disabled = !!disabled(d);
        const copy = make('span', day.disabled ? 'is-off' : '', n);
        if (n === 1) day.style.gridColumnStart = copy.style.gridColumnStart = offset + 1;
        ghost.append(copy);
        days.append(day);
      }
      const marks = [0, 1].map(() => {
        const mark = make('span', 'kodza-date-range__mark is-hidden');
        mark.setAttribute('aria-hidden', 'true');
        mark.append(ghost.cloneNode(true));
        days.append(mark);
        return mark;
      });
      box.append(title, head, days);
      parts.set(box, { index, month, offset, length, bands, marks });
      return box;
    };

    // Where a day sits in its month: column and row
    const cellOf = (part, d) => {
      if (!d || monthIndex(d) !== part.index) return null;
      const at = part.offset + d.getDate() - 1;
      return [at % 7, Math.floor(at / 7)];
    };

    // A mark travels to its day; one coming back from hidden appears there, without travelling
    const place = (mark, cell) => {
      if (!cell) return mark.classList.add('is-hidden');
      const ghost = mark.firstElementChild;
      const appear = mark.classList.contains('is-hidden');
      if (appear) mark.style.transition = ghost.style.transition = 'none';
      mark.style.setProperty('--kz-date-range-x', cell[0]);
      mark.style.setProperty('--kz-date-range-y', cell[1]);
      if (!appear) return;
      void mark.offsetWidth;
      mark.style.transition = ghost.style.transition = '';
      mark.classList.remove('is-hidden');
    };

    // The range on screen: the one picked, or the start and the day under the pointer
    const range = () => {
      if (!start) return [null, null];
      if (active === 'end' && isOpen()) return [start, hover && !disabled(hover) ? hover : end || start];
      return [start, end];
    };

    const paintMonth = (box, from, to) => {
      const part = parts.get(box);
      const lo = from && to && to < from ? to : from;
      const hi = from && to && to < from ? from : to;
      const startMark = swapped ? 1 : 0;
      place(part.marks[startMark], cellOf(part, from));
      place(part.marks[1 - startMark], cellOf(part, to));
      const y = part.month.getFullYear();
      const m = part.month.getMonth();
      part.bands.forEach((band, r) => {
        const firstDay = Math.max(1, r * 7 - part.offset + 1);
        const lastDay = Math.min(part.length, r * 7 + 7 - part.offset);
        let l = 0;
        let right = 14; // folded on the left: the range comes from there
        if (firstDay <= lastDay && lo && hi) {
          const rowFirst = new Date(y, m, firstDay);
          const rowLast = new Date(y, m, lastDay);
          if (lo > rowLast) [l, right] = [14, 0]; // folded on the right: the range is further on
          else if (hi >= rowFirst) {
            const a = lo > rowFirst ? lo : rowFirst;
            const b = hi < rowLast ? hi : rowLast;
            const ca = cellOf(part, a)[0];
            const cb = cellOf(part, b)[0];
            // From the centre of an end of the range, from the side of a day it goes on through
            l = same(a, lo) ? 2 * ca + 1 : 2 * ca;
            right = same(b, hi) ? 13 - 2 * cb : 12 - 2 * cb;
          }
        }
        band.style.setProperty('--kz-date-range-l', l);
        band.style.setProperty('--kz-date-range-r', right);
      });
      box.querySelectorAll('.kodza-date-range__day').forEach((day) => {
        const d = parse(day.dataset.date);
        day.classList.toggle('is-mark', same(d, from) || same(d, to));
        day.setAttribute('aria-pressed', String(!!(start && end && d >= start && d <= end)));
      });
    };

    const paint = () => {
      const [from, to] = range();
      [...strip.children].forEach((box) => paintMonth(box, from, to));
      // The length, rolling up as it grows
      const length = from && to ? Math.abs(between(from, to)) + (nights ? 0 : 1) : 0;
      const text = length ? fill(word(nights ? (length === 1 ? 'night' : 'nights') : (length === 1 ? 'day' : 'days')), { n: length }) : word(start ? 'last' : 'first');
      roll(sum, text, length >= count ? 1 : -1, pace).classList.toggle('is-empty', !length);
      count = length;
      presets.forEach((button) => {
        const [a, b] = PRESETS[button.dataset.preset](today, weekOf(today));
        button.setAttribute('aria-pressed', String(same(a, start) && same(b, end)));
      });
    };

    // A month that just arrived takes its marks and bands as they are
    const settleFresh = () => {
      const fresh = strip.querySelectorAll('.is-fresh');
      if (!fresh.length) return;
      void strip.offsetWidth;
      fresh.forEach((box) => box.classList.remove('is-fresh'));
    };

    const fillStrip = () => {
      strip.replaceChildren();
      for (let i = 0; i < months; i++) strip.append(build(first + i));
    };

    // The month that slid out goes, at once if another step comes before it is out
    const settle = () => {
      if (!slide) return;
      const { animation, out } = slide;
      slide = null;
      out.remove();
      animation.cancel();
    };

    // One month on: the ribbon slides by one month. Further: the months are swapped for others
    const goTo = (target) => {
      if (target === first) return;
      settle();
      const dir = target > first ? 1 : -1;
      if (Math.abs(target - first) === 1) {
        const box = build(dir > 0 ? first + months : first - 1);
        if (dir > 0) strip.append(box);
        else strip.prepend(box);
        const out = dir > 0 ? strip.firstElementChild : strip.lastElementChild;
        first = target;
        paint();
        settleFresh();
        if (still) return out.remove();
        const step = strip.children[1].offsetLeft - strip.children[0].offsetLeft;
        const frames = [{ transform: 'none' }, { transform: `translateX(${-step}px)` }];
        const animation = strip.animate(dir > 0 ? frames : frames.reverse(), { duration: SLIDE * pace, easing: ease, fill: 'forwards' });
        slide = { animation, out };
        animation.finished.then(() => slide?.animation === animation && settle(), () => {});
        return;
      }
      const old = strip;
      strip = make('div', 'kodza-date-range__strip');
      first = target;
      fillStrip();
      old.after(strip);
      paint();
      settleFresh();
      if (still) return old.remove();
      old.inert = true;
      const timing = { duration: JUMP * pace, easing: ease };
      old.animate([{ transform: 'none', opacity: 1 }, { transform: `translateX(${dir * -40}%)`, opacity: 0 }], { ...timing, fill: 'forwards' }).finished.then(() => old.remove(), () => {});
      strip.animate([{ transform: `translateX(${dir * 40}%)`, opacity: 0 }, { transform: 'none', opacity: 1 }], timing);
    };

    // The months that show the range: the end always, the start too when they fit
    const firstFor = () => {
      if (!start) return monthIndex(focusDay);
      return Math.max(monthIndex(start), monthIndex(end || start) - (months - 1));
    };
    // Moved so that a day shows
    const showing = (d) => {
      const i = monthIndex(d);
      if (i < first) return i;
      if (i > first + months - 1) return i - (months - 1);
      return first;
    };

    const setFocusable = () => {
      strip.querySelectorAll('.kodza-date-range__day').forEach((day) => (day.tabIndex = day.dataset.date === iso(focusDay) ? 0 : -1));
    };

    const moveFocus = (d) => {
      focusDay = within(d);
      goTo(showing(focusDay));
      setFocusable();
      strip.querySelector(`[data-date="${iso(focusDay)}"]`)?.focus({ preventScroll: true });
    };

    const showValues = (animate) => {
      [start, end].forEach((d, i) => {
        const before = parse(values[i].lastElementChild?.dataset.date);
        if (!animate) values[i].replaceChildren();
        const span = roll(values[i], d ? shown(d) : word('empty'), before && d && d < before ? -1 : 1, pace);
        span.dataset.date = d ? iso(d) : '';
        span.classList.toggle('is-empty', !d);
      });
    };

    // The inputs follow, then tell the page
    const commit = () => {
      const next = [start, end].map((d) => (d ? iso(d) : ''));
      const changed = natives.filter((native, i) => native.value !== next[i]);
      natives.forEach((native, i) => (native.value = next[i]));
      changed.forEach((native) => {
        native.dispatchEvent(new Event('input', { bubbles: true }));
        native.dispatchEvent(new Event('change', { bubbles: true }));
      });
      showValues(true);
      paint();
    };

    const setActive = (which) => {
      active = which === 'end' && start ? 'end' : 'start';
      root.classList.toggle('is-on-end', active === 'end');
    };

    // Two months if they fit beside the field (lined up on its left, or on its right), one if not
    const fit = () => {
      const box = field.getBoundingClientRect();
      const scale = box.width / field.offsetWidth || 1;
      const room = document.documentElement.clientWidth;
      let n = root.dataset.months === '1' ? 1 : 2;
      let right = false;
      for (;;) {
        root.style.setProperty('--kz-date-range-n', n);
        const width = pop.offsetWidth * scale;
        if (box.left + width <= room - 8) break;
        if (box.right - width >= 8) {
          right = true;
          break;
        }
        if (n === 1) break;
        n = 1;
      }
      const height = pop.offsetHeight * scale;
      const above = box.bottom + height + 16 > innerHeight && box.top > height + 16;
      // A closed panel that changes side gets there at once, so it always unrolls from the field
      if (right !== root.classList.contains('is-right') || above !== root.classList.contains('is-above')) {
        pop.style.transition = 'none';
        root.classList.toggle('is-right', right);
        root.classList.toggle('is-above', above);
        void pop.offsetWidth;
        pop.style.transition = '';
      }
      return n;
    };

    const isOpen = () => root.classList.contains('is-open');
    const open = (which) => {
      const tint = field.querySelector('.kodza-date-range__active');
      tint.style.transition = 'none';
      setActive(which);
      void tint.offsetWidth;
      tint.style.transition = '';
      hover = null;
      focusDay = within((active === 'end' ? end : start) || start || today);
      // Rebuilt while still closed, only when other months must show: the months of the range, as many as fit
      settle();
      const shown = [first, months];
      months = fit();
      first = firstFor();
      first = showing(focusDay);
      if (first !== shown[0] || months !== shown[1]) fillStrip();
      root.classList.add('is-open');
      halves.forEach((half) => half.setAttribute('aria-expanded', 'true'));
      paint();
      settleFresh();
      setFocusable();
      requestAnimationFrame(() => isOpen() && strip.querySelector('[tabindex="0"]')?.focus({ preventScroll: true }));
    };
    const close = (refocus = true) => {
      if (!isOpen()) return;
      root.classList.remove('is-open');
      halves.forEach((half) => half.setAttribute('aria-expanded', 'false'));
      hover = null;
      paint();
      if (refocus) halves[active === 'end' ? 1 : 0].focus({ preventScroll: true });
    };

    // A day picked: the start, then the end (before the start, the range is taken backwards)
    const choose = (d) => {
      if (!d || disabled(d)) return;
      focusDay = d;
      if (active === 'start') {
        start = d;
        if (end && (end < d || (nights && same(end, d)))) end = null;
        setActive('end');
        hover = null;
        commit();
        setFocusable();
        return;
      }
      if (nights && same(d, start)) return;
      if (d < start) {
        [start, end] = [d, start];
        swapped = !swapped;
      } else end = d;
      hover = null;
      commit();
      setFocusable();
      setTimeout(() => !signal.aborted && close(), still ? 0 : CLOSE_AFTER * pace);
    };

    halves.forEach((half, i) => half.addEventListener('click', () => {
      const which = i ? 'end' : 'start';
      if (!isOpen()) return open(which);
      if (which === active || (which === 'end' && !start)) return close();
      setActive(which);
      focusDay = within((active === 'end' ? end : start) || start);
      goTo(showing(focusDay));
      hover = null;
      paint();
      setFocusable();
    }, { signal }));
    presets.forEach((button) => button.addEventListener('click', () => {
      const [a, b] = PRESETS[button.dataset.preset](today, weekOf(today));
      [start, end] = [a, b];
      hover = null;
      setActive('end');
      focusDay = b;
      goTo(firstFor());
      commit();
      setFocusable();
      setTimeout(() => !signal.aborted && close(), still ? 0 : PRESET_CLOSE * pace);
    }, { signal }));
    cal.querySelectorAll('[data-step]').forEach((button) => button.addEventListener('click', () => {
      goTo(first + Number(button.dataset.step));
      // The focusable day stays in sight: the same date in the month that came in
      const i = monthIndex(focusDay);
      if (i < first || i > first + months - 1) {
        const index = i < first ? first : first + months - 1;
        const y = Math.floor(index / 12);
        const m = index % 12;
        focusDay = within(new Date(y, m, Math.min(focusDay.getDate(), new Date(y, m + 1, 0).getDate())));
      }
      setFocusable();
    }, { signal }));
    clear.addEventListener('click', () => {
      start = end = hover = null;
      setActive('start');
      commit();
    }, { signal });
    view.addEventListener('click', (event) => {
      const day = event.target.closest('.kodza-date-range__day');
      if (day && !day.disabled && strip.contains(day)) choose(parse(day.dataset.date));
    }, { signal });
    // Picking the end, the band follows the pointer, and the focus
    const aim = (event) => {
      const day = event.target.closest?.('.kodza-date-range__day');
      if (!day || day.disabled || !strip.contains(day) || active !== 'end') return;
      const d = parse(day.dataset.date);
      if (same(d, hover)) return;
      hover = d;
      paint();
    };
    view.addEventListener('pointerover', aim, { signal });
    view.addEventListener('focusin', aim, { signal });
    // The pointer gone, the band goes back to the focused day: what Enter would take
    view.addEventListener('pointerleave', () => {
      const back = active === 'end' && view.contains(document.activeElement) ? focusDay : null;
      if (back === hover || same(back, hover)) return;
      hover = back;
      paint();
    }, { signal });
    pop.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        return close();
      }
      if (!event.target.classList.contains('kodza-date-range__day')) return;
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
        choose(focusDay);
      }
    }, { signal });
    document.addEventListener('pointerdown', (event) => !root.contains(event.target) && close(false), { signal });
    // Escape closes it even if the focus wandered off to the page
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen() && !root.contains(document.activeElement)) close();
    }, { signal });
    root.addEventListener('focusout', (event) => {
      if (isOpen() && event.relatedTarget && !root.contains(event.relatedTarget)) close(false);
    }, { signal });

    // The calendar is built right away, as many months as fit, so the panel has its real size before it first opens
    months = fit();
    first = firstFor();
    fillStrip();
    paint();
    settleFresh();
    showValues(false);
    setFocusable();
    pace = paceOf(root);
    still = reduceMotion || !pace;
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
