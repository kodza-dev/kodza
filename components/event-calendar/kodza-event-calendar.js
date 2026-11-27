// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Event Calendar
// Turns a list of events into a month: a day with events carries one ink dot per event (three at
// most, then "+2"), a click or Enter on a day rolls its list in beside the grid (under it on a
// phone), the arrows slide the months by one, and the Month / List switch slides over to the
// upcoming events grouped by month. Each event is an <article class="kodza-event-calendar__event">
// holding a <time datetime="YYYY-MM-DDTHH:MM"> (a second <time> the same day gives the end), its
// title in .kodza-event-calendar__name (keep the link in it) and its place in
// .kodza-event-calendar__place. Times are read as written, in the venue's clock: no time zone.
// data-from, data-until (YYYY-MM): the first and the last month the arrows reach (by default the
// months of the first and the last event, this month included). data-locale: the month, day and
// time formats. data-week-start="0": weeks start on Sunday. Without the script, the list simply
// shows. Settings: the --kz-event-calendar-* variables in the CSS, the words below (data-text-<key>
// on the root), the constants under them.
(() => {
  const SELECTOR = '.kodza-event-calendar';
  const WORDS = {
    month: 'Month',
    list: 'List',
    view: 'View', // the name of the Month / List switch
    nextUp: 'Next up: {date} · {title}',
    none: 'Nothing coming up. Yet.',
    empty: 'Nothing on. Pick a day with a dot.',
    one: '1 event',
    many: '{n} events',
    allDay: 'All day',
    today: 'today',
    prev: 'Previous month',
    next: 'Next month',
    calendar: 'Events', // the name of the calendar, when it has no title
  };
  const WIDE = 720; // px, from this width the day's list sits beside the month
  const NARROW = 440; // px, under this width the card tightens its padding
  const SLIDE = 560; // ms, the months sliding by one, and the views
  const ROLL = 520; // ms, a line of the day's list rising into place
  const OUT = 340; // ms, a line of the previous day leaving
  const STAGGER = 45; // ms, from one line of the list to the next
  const DOTS = 3; // dots under a day before "+N"
  const DRAW_AT = 0.4; // the share of the slide before the new month draws its dots
  const ENTER_AT = 0.4; // the share of the calendar in view before the dots draw
  const DAY = 86400000;
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const leave = 'cubic-bezier(0.65, 0, 0.35, 1)';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const arrow = (d) => `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="${d}"/></svg>`;

  // Days are counted from 1 Jan 1970 and months from year 0, in UTC: no time zone, no summer time
  const parse = (text) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(String(text || '').trim());
    if (!m) return null;
    return { day: Date.UTC(+m[1], +m[2] - 1, +m[3]) / DAY, min: m[4] == null ? null : +m[4] * 60 + +m[5] };
  };
  const monthOf = (text) => {
    const m = /^(\d{4})-(\d{2})/.exec(String(text || '').trim());
    return m ? +m[1] * 12 + (+m[2] - 1) : null;
  };
  const monthOfDay = (d) => {
    const t = new Date(d * DAY);
    return t.getUTCFullYear() * 12 + t.getUTCMonth();
  };
  const startOf = (m) => Date.UTC(Math.floor(m / 12), m % 12, 1) / DAY;

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const make = maker('kodza-event-calendar');
    const locale = root.dataset.locale || document.documentElement.lang || undefined;
    const weekStart = root.dataset.weekStart === '0' ? 0 : 1;
    const timers = new Set();
    const later = (fn, ms) => {
      const t = setTimeout(() => {
        timers.delete(t);
        fn();
      }, ms);
      timers.add(t);
    };
    const anims = new Set();
    const play = (el, frames, options) => {
      const anim = el.animate(frames, options);
      anims.add(anim);
      return anim;
    };
    signal.addEventListener('abort', () => {
      timers.forEach(clearTimeout);
      anims.forEach((anim) => anim.cancel());
    });

    const events = [];
    root.querySelectorAll('.kodza-event-calendar__event').forEach((article) => {
      const [a, b] = [...article.querySelectorAll('time')].map((t) => parse(t.getAttribute('datetime') || t.textContent));
      if (!a) return;
      const name = article.querySelector('.kodza-event-calendar__name');
      events.push({
        day: a.day,
        start: a.min,
        end: b && b.day === a.day && a.min != null && b.min > a.min ? b.min : null,
        name,
        title: (name?.textContent || '').trim(),
        place: (article.querySelector('.kodza-event-calendar__place')?.textContent || '').trim(),
      });
    });
    events.sort((x, y) => x.day - y.day || (x.start ?? -1) - (y.start ?? -1));
    const byDay = new Map();
    events.forEach((e) => {
      if (!byDay.has(e.day)) byDay.set(e.day, []);
      byDay.get(e.day).push(e);
    });

    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY;
    const minute = now.getHours() * 60 + now.getMinutes();
    // Started or over, by the venue's clock: an all-day event lasts the day
    const gone = (e) => e.day < today || (e.day === today && (e.end ?? e.start ?? 1440) <= minute);
    const thisMonth = now.getFullYear() * 12 + now.getMonth();
    const first = monthOf(root.dataset.from) ?? Math.min(thisMonth, events.length ? monthOfDay(events[0].day) : thisMonth);
    const last = Math.max(first, monthOf(root.dataset.until) ?? Math.max(thisMonth, events.length ? monthOfDay(events[events.length - 1].day) : thisMonth));

    const monthName = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' });
    const dayLong = new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' });
    const dayLetter = new Intl.DateTimeFormat(locale, { weekday: 'narrow', timeZone: 'UTC' });
    const dayShort = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
    const dayTitle = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
    const short = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
    const clock = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    const at = (min) => clock.format(min * 60000);
    const timeOf = (e) => (e.start == null ? word('allDay') : e.end != null ? `${at(e.start)}–${at(e.end)}` : at(e.start));
    const count = (n) => (n === 1 ? word('one') : word('many').replace('{n}', n));
    const nameOf = (e) => {
      const p = make('p', 'what');
      if (e.name) e.name.childNodes.forEach((node) => p.append(node.cloneNode(true)));
      else p.textContent = e.title;
      return p;
    };

    // The card: title and next event, the Month / List switch, then the views
    const title = root.querySelector('.kodza-event-calendar__title');
    const head = make('div', 'head');
    const heading = make('div', 'heading');
    const status = make('p', 'status');
    if (title) heading.append(title);
    heading.append(status);
    const switcher = make('div', 'switch', { role: 'tablist', 'aria-label': word('view') });
    const indicator = make('span', 'indicator', { 'aria-hidden': 'true' });
    const mirror = make('span', 'mirror', { 'aria-hidden': 'true' });
    const tabs = ['month', 'list'].map((key, i) => {
      mirror.append(make('span', 'ghost', null, word(key)));
      return make('button', 'tab', { type: 'button', role: 'tab', 'aria-selected': String(!i), tabindex: i ? '-1' : '0' }, word(key));
    });
    switcher.append(indicator, ...tabs, mirror);
    head.append(heading, switcher);

    const views = make('div', 'views');
    const monthView = make('div', 'view view--month', { role: 'tabpanel', 'aria-label': word('month') });
    const listView = make('div', 'view view--list is-hidden', { role: 'tabpanel', 'aria-label': word('list') });
    listView.inert = true;
    const calendar = make('div', 'calendar');
    const stage = make('div', 'stage');
    const track = make('div', 'track');
    stage.append(track);
    const nav = make('div', 'nav');
    const prev = make('button', 'arrow', { type: 'button', 'aria-label': word('prev') });
    const next = make('button', 'arrow', { type: 'button', 'aria-label': word('next') });
    prev.innerHTML = arrow('M10 3.5 5.5 8l4.5 4.5');
    next.innerHTML = arrow('M6 3.5 10.5 8 6 12.5');
    nav.append(prev, next);
    calendar.append(stage, nav);
    const agenda = make('div', 'agenda');
    const stack = make('div', 'stack');
    agenda.append(stack);
    monthView.append(calendar, agenda);
    views.append(monthView, listView);
    const live = make('p', 'live', { 'aria-live': 'polite' });
    root.append(head, views, live);
    root.setAttribute('role', 'group');
    root.setAttribute('aria-label', title?.textContent.trim() || word('calendar'));

    const upcoming = events.find((e) => !gone(e));
    status.textContent = upcoming ? word('nextUp').replace('{date}', short.format(upcoming.day * DAY)).replace('{title}', upcoming.title) : word('none');

    // One month: a real table, always six weeks tall so the card never changes height. Under it an
    // ink mark, over it a copy in the mark's own colour, both cut to the chosen day
    const build = (m) => {
      const start = startOf(m);
      const length = startOf(m + 1) - start;
      const lead = (new Date(start * DAY).getUTCDay() - weekStart + 7) % 7;
      const month = make('div', 'month');
      const table = make('table', 'grid');
      table.append(make('caption', 'caption', null, monthName.format(start * DAY)));
      const row = make('tr');
      for (let c = 0; c < 7; c++) {
        const d = (start - lead + c) * DAY;
        const th = make('th', 'weekday', { scope: 'col' });
        th.append(make('span', null, { 'aria-hidden': 'true' }, dayLetter.format(d)), make('span', 'hidden', null, dayLong.format(d)));
        row.append(th);
      }
      const thead = make('thead');
      thead.append(row);
      const tbody = make('tbody');
      const days = new Map();
      let order = 0;
      for (let w = 0; w < 6; w++) {
        const tr = make('tr');
        for (let c = 0; c < 7; c++) {
          const i = w * 7 + c - lead;
          if (i < 0 || i >= length) {
            tr.append(make('td', 'blank'));
            continue;
          }
          const d = start + i;
          const list = byDay.get(d) || [];
          const td = make('td', 'cell');
          const day = make('button', 'day', { type: 'button', tabindex: '-1', 'aria-pressed': 'false' });
          day.append(make('span', 'num', { 'aria-hidden': 'true' }, i + 1));
          const dots = make('span', 'dots', { 'aria-hidden': 'true' });
          for (let k = 0; k < Math.min(list.length, DOTS); k++) {
            const dot = make('span', 'dot');
            dot.style.setProperty('--kz-event-calendar-at', order++);
            dots.append(dot);
          }
          if (list.length > DOTS) {
            const more = make('span', 'more', null, `+${list.length - DOTS}`);
            more.style.setProperty('--kz-event-calendar-at', order++);
            dots.append(more);
          }
          day.append(dots);
          const said = [dayTitle.format(d * DAY)];
          if (d === today) {
            day.classList.add('is-today');
            day.setAttribute('aria-current', 'date');
            said.push(word('today'));
          }
          if (list.length) said.push(count(list.length));
          if (d < today) day.classList.add('is-past');
          day.append(make('span', 'hidden', null, said.join(', ')));
          days.set(d, day);
          td.append(day);
          tr.append(td);
        }
        tbody.append(tr);
      }
      table.append(thead, tbody);
      const copy = make('div', 'copy', { 'aria-hidden': 'true' });
      copy.inert = true;
      copy.append(table.cloneNode(true));
      month.append(make('span', 'mark', { 'aria-hidden': 'true' }), table, copy);
      month.dataset.count = order;
      return { el: month, m, days };
    };

    // The mark and the copy are cut to the chosen day with clip-path: they glide together, so the
    // number turns to the mark's colour exactly at its edges
    const place = (month, d, glide) => {
      const day = month.days.get(d);
      const el = month.el;
      el.classList.toggle('is-gliding', Boolean(glide && !still));
      if (!day) {
        ['t', 'r', 'b', 'l'].forEach((side) => el.style.setProperty(`--kz-event-calendar-${side}`, '50%'));
        return;
      }
      const box = el.getBoundingClientRect();
      const rect = day.getBoundingClientRect();
      const scale = box.width / el.offsetWidth || 1;
      const t = (rect.top - box.top) / scale;
      const l = (rect.left - box.left) / scale;
      el.style.setProperty('--kz-event-calendar-t', `${t}px`);
      el.style.setProperty('--kz-event-calendar-l', `${l}px`);
      el.style.setProperty('--kz-event-calendar-r', `${el.offsetWidth - l - rect.width / scale}px`);
      el.style.setProperty('--kz-event-calendar-b', `${el.offsetHeight - t - rect.height / scale}px`);
    };

    // The list of one day: its date and count, then a line per event
    const page = (d) => {
      const list = byDay.get(d) || [];
      const el = make('div', 'page');
      const top = make('div', 'line line--head');
      const line = make('div', 'in');
      line.append(make('p', 'date', null, dayTitle.format(d * DAY)), make('p', 'count', null, list.length ? count(list.length) : ''));
      top.append(line);
      el.append(top);
      if (!list.length) {
        const empty = make('div', 'line');
        empty.append(make('p', 'in empty', null, word('empty')));
        el.append(empty);
        return el;
      }
      const rows = make('ul', 'rows');
      list.forEach((e) => {
        const row = make('li', 'line row');
        if (gone(e)) row.classList.add('is-gone');
        const inner = make('div', 'in');
        inner.append(make('p', 'time', null, timeOf(e)), nameOf(e));
        if (e.place) inner.append(make('p', 'place', null, e.place));
        row.append(inner);
        rows.append(row);
      });
      el.append(rows);
      return el;
    };

    // A new day: the old lines leave the way you go while the new ones rise from behind their own
    // mask, line after line. On a phone the list's height follows
    let swap = null; // what is left of a swap: dropping the old day
    const roll = (d, dir) => {
      swap?.();
      const fresh = page(d);
      const old = stack.firstElementChild;
      if (!old || still) {
        stack.replaceChildren(fresh);
        stack.scrollTop = 0;
        return;
      }
      const from = stack.offsetHeight;
      old.style.top = `${-stack.scrollTop}px`;
      old.classList.add('is-leaving', 'is-moving');
      fresh.classList.add('is-moving');
      stack.classList.add('is-swapping');
      stack.append(fresh);
      stack.scrollTop = 0;
      const way = dir < 0 ? 1 : -1;
      const moving = [];
      let end = 0;
      old.querySelectorAll('.kodza-event-calendar__in').forEach((el, i) => {
        const delay = i * STAGGER * 0.5 * pace;
        moving.push(play(el, [{ transform: 'none' }, { transform: `translateY(${way * 110}%)` }], { duration: OUT * pace, delay, easing: leave, fill: 'forwards' }));
        end = Math.max(end, delay + OUT * pace);
      });
      fresh.querySelectorAll('.kodza-event-calendar__in').forEach((el, i) => {
        const delay = (90 + i * STAGGER) * pace;
        moving.push(play(el, [{ transform: `translateY(${-way * 110}%)` }, { transform: 'none' }], { duration: ROLL * pace, delay, easing: ease, fill: 'backwards' }));
        end = Math.max(end, delay + ROLL * pace);
      });
      if (!root.classList.contains('is-wide')) {
        const to = fresh.offsetHeight;
        if (to !== from) moving.push(play(stack, [{ height: `${from}px` }, { height: `${to}px` }], { duration: SLIDE * pace, easing: ease }));
      }
      const done = () => {
        swap = null;
        moving.forEach((anim) => {
          anim.cancel();
          anims.delete(anim);
        });
        old.remove();
        fresh.classList.remove('is-moving');
        stack.classList.remove('is-swapping');
      };
      swap = done;
      later(() => swap === done && done(), Math.max(end, SLIDE * pace));
    };

    let index = Math.max(0, Math.min(thisMonth - first, last - first)); // the month shown, counted from `first`
    let shown = build(first + index);
    let selected = null;
    let focusable = null;
    let drawn = false;
    track.append(shown.el);

    const reach = (d) => {
      const day = shown.days.get(d);
      if (!day) return null;
      if (focusable && focusable !== day) focusable.setAttribute('tabindex', '-1');
      day.setAttribute('tabindex', '0');
      focusable = day;
      return day;
    };
    const select = (d, glide) => {
      if (d === selected && shown.days.get(d)?.getAttribute('aria-pressed') === 'true') return;
      const dir = selected == null ? 1 : Math.sign(d - selected) || 1;
      selected = d;
      shown.days.forEach((day, key) => day.setAttribute('aria-pressed', String(key === d)));
      reach(d);
      place(shown, d, glide);
      roll(d, dir);
      const list = byDay.get(d) || [];
      live.textContent = `${dayTitle.format(d * DAY)}: ${list.length ? count(list.length) : word('empty')}`;
    };
    // The day a month opens on: the first one with events from today, else today, else the first
    // one with events, else the 1st
    const opening = (m) => {
      const start = startOf(m);
      const end = startOf(m + 1);
      const here = today >= start && today < end;
      for (let d = here ? today : start; d < end; d++) if (byDay.has(d)) return d;
      if (here) return today;
      for (let d = start; d < end; d++) if (byDay.has(d)) return d;
      return start;
    };

    const draw = (month, instant) => {
      month.el.classList.toggle('is-instant', instant);
      month.el.classList.add('is-drawn');
    };
    const sync = () => {
      prev.setAttribute('aria-disabled', String(index <= 0));
      next.setAttribute('aria-disabled', String(first + index >= last));
    };

    // The months slide by exactly one: the new one joins on the side you go, the track moves, then
    // the one that left is dropped and the track put back, in the same frame
    let slide = null;
    let pending = null; // what is left of a slide: dropping the month that left
    const settle = () => {
      const done = pending;
      pending = null;
      done?.();
    };
    const move = (step, target) => {
      settle();
      const to = index + step;
      if (to < 0 || first + to > last) return false;
      index = to;
      const incoming = build(first + index);
      const outgoing = shown;
      if (step > 0) track.append(incoming.el);
      else track.prepend(incoming.el);
      shown = incoming;
      focusable = null;
      select(target ?? opening(incoming.m), false);
      sync();
      if (still) {
        outgoing.el.remove();
        if (drawn) draw(incoming, true);
        return true;
      }
      const width = track.children[1].offsetLeft - track.children[0].offsetLeft;
      const moved = `translateX(${-width}px)`;
      slide = play(track, step > 0 ? [{ transform: 'none' }, { transform: moved }] : [{ transform: moved }, { transform: 'none' }], {
        duration: SLIDE * pace,
        easing: ease,
        fill: 'forwards',
      });
      const done = () => {
        outgoing.el.remove();
        slide?.cancel();
        anims.delete(slide);
        slide = null;
        if (drawn) draw(incoming, false);
      };
      pending = done;
      slide.onfinish = () => pending === done && settle();
      if (drawn) later(() => pending === done && draw(incoming, false), SLIDE * pace * DRAW_AT);
      return true;
    };
    prev.addEventListener('click', () => prev.getAttribute('aria-disabled') !== 'true' && move(-1), { signal });
    next.addEventListener('click', () => next.getAttribute('aria-disabled') !== 'true' && move(1), { signal });

    track.addEventListener('click', (event) => {
      const day = event.target.closest?.('.kodza-event-calendar__day');
      const key = [...shown.days].find(([, el]) => el === day)?.[0];
      if (key != null) select(key, true);
    }, { signal });

    // The arrow keys walk the days and cross into the next month, Enter or Space opens a day
    const sameDay = (d, step) => {
      const t = new Date(d * DAY);
      const m = t.getUTCFullYear() * 12 + t.getUTCMonth() + step;
      return startOf(m) + Math.min(t.getUTCDate(), startOf(m + 1) - startOf(m)) - 1;
    };
    track.addEventListener('keydown', (event) => {
      const key = [...shown.days].find(([, el]) => el === event.target)?.[0];
      if (key == null) return;
      const column = (new Date(key * DAY).getUTCDay() - weekStart + 7) % 7;
      let to;
      switch (event.key) {
        case 'ArrowLeft': to = key - 1; break;
        case 'ArrowRight': to = key + 1; break;
        case 'ArrowUp': to = key - 7; break;
        case 'ArrowDown': to = key + 7; break;
        case 'Home': to = key - column; break;
        case 'End': to = key + 6 - column; break;
        case 'PageUp': to = sameDay(key, -1); break;
        case 'PageDown': to = sameDay(key, 1); break;
        default: return;
      }
      event.preventDefault();
      to = Math.max(startOf(first), Math.min(startOf(last + 1) - 1, to));
      const m = monthOfDay(to);
      if (m !== shown.m) move(m > shown.m ? 1 : -1, to);
      reach(to)?.focus({ preventScroll: true });
    }, { signal });

    // The upcoming events, grouped by month
    const coming = events.filter((e) => e.day >= today);
    if (!coming.length) listView.append(make('p', 'empty', null, word('none')));
    let group = null;
    let groupMonth = null;
    coming.forEach((e) => {
      const m = monthOfDay(e.day);
      if (m !== groupMonth) {
        groupMonth = m;
        const section = make('section', 'group');
        section.append(make('p', 'group-title', null, monthName.format(startOf(m) * DAY)));
        group = make('ul', 'items');
        section.append(group);
        listView.append(section);
      }
      const item = make('li', 'item');
      if (gone(e)) item.classList.add('is-gone');
      const when = make('p', 'when');
      when.append(make('span', 'big', null, new Date(e.day * DAY).getUTCDate()), make('span', 'wd', null, dayShort.format(e.day * DAY)));
      const body = make('div', 'body');
      body.append(nameOf(e), make('p', 'meta', null, [timeOf(e), e.place].filter(Boolean).join(' · ')));
      item.append(when, body);
      group.append(item);
    });

    // Month / List: the ink pill and its copy of the labels glide to the chosen view, and the views
    // slide over, the one you leave going out on the side you come from
    let view = 0;
    let shift = null; // what is left of a switch
    const glide = () => {
      const tab = tabs[view];
      const full = switcher.scrollWidth;
      switcher.style.setProperty('--kz-event-calendar-sw', `${full}px`);
      switcher.style.setProperty('--kz-event-calendar-sl', `${tab.offsetLeft}px`);
      switcher.style.setProperty('--kz-event-calendar-sr', `${full - tab.offsetLeft - tab.offsetWidth}px`);
    };
    const show = (to) => {
      if (to === view) return;
      shift?.();
      const dir = to > view ? 1 : -1;
      view = to;
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === to));
        tab.setAttribute('tabindex', i === to ? '0' : '-1');
      });
      glide();
      const incoming = to ? listView : monthView;
      const outgoing = to ? monthView : listView;
      incoming.classList.remove('is-hidden');
      incoming.inert = false;
      outgoing.inert = true;
      if (to) listView.scrollTop = 0;
      if (still) {
        outgoing.classList.add('is-hidden');
        return;
      }
      views.classList.add('is-switching');
      const options = { duration: SLIDE * pace, easing: ease, fill: 'both' };
      const moving = [
        play(outgoing, [{ transform: 'none' }, { transform: `translateX(${-dir * 100}%)` }], options),
        play(incoming, [{ transform: `translateX(${dir * 100}%)` }, { transform: 'none' }], options),
      ];
      const done = () => {
        shift = null;
        moving.forEach((anim) => {
          anim.cancel();
          anims.delete(anim);
        });
        outgoing.classList.add('is-hidden');
        views.classList.remove('is-switching');
      };
      shift = done;
      later(() => shift === done && done(), SLIDE * pace);
    };
    tabs.forEach((tab, i) => tab.addEventListener('click', () => show(i), { signal }));
    switcher.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const to = event.key === 'ArrowRight' ? 1 : 0;
      tabs[to].focus();
      show(to);
    }, { signal });

    // The dots draw in reading order when the calendar comes into view
    const enter = () => {
      drawn = true;
      draw(shown, still);
    };

    const layout = () => {
      const width = root.clientWidth;
      root.classList.toggle('is-narrow', width < NARROW);
      root.classList.toggle('is-wide', width >= WIDE);
    };
    layout();
    sync();
    select(opening(shown.m), false);
    glide();
    requestAnimationFrame(() => !signal.aborted && switcher.classList.add('is-live'));
    document.fonts?.ready.then(() => {
      if (signal.aborted) return;
      glide();
      place(shown, selected, false);
    });

    let width = root.clientWidth;
    let frame = 0;
    const resize = new ResizeObserver(() => {
      if (root.clientWidth === width) return;
      width = root.clientWidth;
      cancelAnimationFrame(frame);
      // A frame later: the classes change the card's height, which would otherwise be observed
      // again in the same frame
      frame = requestAnimationFrame(() => {
        layout();
        place(shown, selected, false);
        glide();
      });
    });
    resize.observe(root);
    const watch = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      watch.disconnect();
      enter();
    }, { threshold: ENTER_AT });
    watch.observe(root);
    signal.addEventListener('abort', () => {
      resize.disconnect();
      watch.disconnect();
      cancelAnimationFrame(frame);
    });

    // kodza:replay on the root draws the dots again
    root.addEventListener('kodza:replay', () => {
      if (!drawn) return;
      settle();
      shown.el.classList.remove('is-drawn', 'is-instant');
      root.offsetWidth;
      enter();
    }, { signal });
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
