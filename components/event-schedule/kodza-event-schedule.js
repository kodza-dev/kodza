// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Event Schedule
// The programme of an event, read against the venue's clock: one tab per day (an ink pill that
// slides, the day sliding in from the side you go to), the venue time ticking in the bar, the
// sessions already over greyed out, the one on stage marked Live, the next one counting down,
// and a "Now" marker that moves down the rail as the day goes. Each session opens on its summary
// and an "Add to calendar" button that saves a .ics file.
// Markup: .kodza-event-schedule__day blocks, each with an h3 <time datetime="YYYY-MM-DD"> and an
// <ol> of sessions (a "when" line with one or two <time datetime="…T09:30">, a title, a meta line,
// an optional summary). Without the script, the days simply stack.
// Settings: the --kz-event-schedule-* variables in the CSS, the texts and constants below, and on
// the root: data-timezone (the venue's IANA zone, default the visitor's), data-place (the city in
// "Le Havre time"), data-now ("2027-03-18 11:18" pins the clock there, and it keeps ticking),
// data-url (a link written in every saved event), data-text-* (any of the texts below).
(() => {
  const SELECTOR = '[data-kodza-event-schedule]';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };

  // Texts the script writes, in English by default: data-text-* on the root replaces any of them
  // (data-text-soon="dans {n} min"); {place}, {n} and {title} are filled in
  const WORDS = {
    days: 'Days of the programme', // the tab list, for screen readers
    clock: '{place} time',
    venue: 'Venue time', // when there is no data-place
    now: 'Now',
    live: 'Live',
    soon: 'in {n} min',
    next: 'Next',
    add: 'Add to calendar',
    added: 'Saved as .ics',
    saved: '{title} saved to your downloads', // read out after a download
  };
  const SOON = 60; // minutes: below this the next session counts down, above it just says Next
  const MOVE = 600; // ms, a day sliding in, its height following
  const SHIFT = 22; // px, how far the days slide
  const CASCADE = 30; // ms between two sessions sliding in
  const ROLL = 640; // ms, a digit or a label rolling
  const STAGGER = 45; // ms between two digits that roll
  const ADDED = 1800; // ms "Saved as .ics" stays: a reading time, not motion
  const HALF = 30 * 60000; // a session with no end and nothing after it lasts half an hour
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const SWING = 'cubic-bezier(0.65, 0, 0.35, 1)';

  const DATE = /^(\d{4})-(\d{2})-(\d{2})/;
  const TIME = /(?:^|[T\s])(\d{1,2}):(\d{2})(?::(\d{2}))?/;
  // Every time is a wall clock time, kept as if it were UTC: 09:30 on the 18th reads 09:30 on the
  // 18th whatever the visitor's zone, and two of them subtract into minutes
  const wallOf = (text, day) => {
    const date = DATE.exec(text);
    const time = TIME.exec(text);
    if (!date && day == null) return NaN;
    const base = date ? Date.UTC(+date[1], date[2] - 1, +date[3]) : day;
    return time ? base + ((+time[1] * 60 + +time[2]) * 60 + +(time[3] || 0)) * 1000 : base;
  };
  const dayOf = (wall) => wall - (((wall % 86400000) + 86400000) % 86400000);
  const pad = (n) => String(n).padStart(2, '0');

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const make = maker('kodza-event-schedule');
    const word = (key, fill = {}) => (root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key])
      .replace(/\{(\w+)\}/g, (all, name) => (name in fill ? fill[name] : all));
    const lang = root.closest('[lang]')?.lang || 'en';
    const timers = new Set();
    const later = (fn, ms) => { const timer = setTimeout(() => { timers.delete(timer); fn(); }, ms); timers.add(timer); return timer; };
    const frames = new Set();
    const frame = (fn) => { const id = requestAnimationFrame(() => { frames.delete(id); fn(); }); frames.add(id); };
    const running = [];
    let token = 0;

    // The venue's clock: its zone read once, the visitor's when it is missing or unknown
    let zone;
    const zoneOf = () => {
      try {
        zone = new Intl.DateTimeFormat('en-GB', { timeZone: root.dataset.timezone || undefined, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
      } catch {
        zone = new Intl.DateTimeFormat('en-GB', { hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
    };
    const wallAt = (instant) => {
      const p = Object.fromEntries(zone.formatToParts(new Date(instant)).map((part) => [part.type, part.value]));
      return Date.UTC(+p.year, p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
    };
    // The real instant of a wall time at the venue, for the calendar file (two passes settle a
    // change of summer time)
    const instantOf = (wall) => {
      let guess = wall;
      for (let i = 0; i < 3; i += 1) guess = wall - (wallAt(guess) - guess);
      return guess;
    };
    let offset = 0;
    const pin = () => {
      zoneOf();
      const pinned = root.dataset.now ? wallOf(root.dataset.now) : NaN;
      offset = Number.isNaN(pinned) ? 0 : pinned - wallAt(Date.now());
    };
    const now = () => wallAt(Date.now()) + offset;
    pin();

    const status = make('span', 'announce', { role: 'status' });
    let saying = 0;
    const say = (text) => { clearTimeout(saying); status.textContent = ''; saying = later(() => { status.textContent = text; }, 60); };

    // A rolling line of text: digits that change roll one by one, other words roll as one line
    const shown = new WeakMap();
    const lineOf = (text) => {
      const line = make('span', 'line', { 'aria-hidden': 'true' });
      text.split(/(\d)/).forEach((part) => {
        if (!/^\d$/.test(part)) return part && line.append(part);
        const cell = make('span', 'cell');
        cell.append(make('span', 'glyph', null, part));
        line.append(cell);
      });
      return line;
    };
    const sameShape = (a, b) => typeof a === 'string' && a.replace(/\d/g, '0') === b.replace(/\d/g, '0');
    const write = (box, text, moving) => {
      const was = shown.get(box);
      if (was === text) return;
      if (was === undefined) box.replaceChildren();
      shown.set(box, text);
      let sr = box.querySelector(':scope > .kodza-event-schedule__sr');
      if (!sr) box.prepend(sr = make('span', 'sr'));
      sr.textContent = text;
      const old = box.querySelector(':scope > .kodza-event-schedule__line:not(.is-leaving)');
      const roll = moving && !still;
      if (old && roll && sameShape(was, text)) {
        const digits = text.match(/\d/g);
        let order = 0;
        old.querySelectorAll('.kodza-event-schedule__cell').forEach((cell, i) => {
          const glyph = cell.lastElementChild;
          if (glyph.textContent === digits[i]) return;
          const y = new DOMMatrixReadOnly(getComputedStyle(glyph).transform).m42;
          [...cell.children].forEach((g) => g !== glyph && g.remove());
          glyph.getAnimations().forEach((anim) => anim.cancel());
          glyph.classList.add('is-leaving');
          const fresh = make('span', 'glyph', null, digits[i]);
          cell.append(fresh);
          const timing = { duration: ROLL * pace, delay: STAGGER * pace * order++, easing: EASE };
          glyph.animate([{ transform: `translateY(${y}px)` }, { transform: 'translateY(-105%)' }], { ...timing, fill: 'both' }).finished.then(() => glyph.remove(), () => {});
          fresh.animate([{ transform: 'translateY(105%)' }, { transform: 'none' }], { ...timing, fill: 'backwards' });
        });
        return;
      }
      const from = box.offsetWidth;
      box.querySelectorAll(':scope > .kodza-event-schedule__line.is-leaving').forEach((el) => el.remove());
      const line = lineOf(text);
      box.append(line);
      if (!old) return;
      if (!roll) return old.remove();
      const y = new DOMMatrixReadOnly(getComputedStyle(old).transform).m42;
      old.getAnimations().forEach((anim) => anim.cancel());
      old.classList.add('is-leaving');
      const timing = { duration: ROLL * pace, easing: EASE };
      old.animate([{ transform: `translateY(${y}px)` }, { transform: 'translateY(-105%)' }], { ...timing, fill: 'forwards' }).finished.then(() => old.remove(), () => {});
      line.animate([{ transform: 'translateY(105%)' }, { transform: 'none' }], timing);
      box.getAnimations().forEach((anim) => anim.cancel());
      if (box.offsetWidth !== from) box.animate([{ width: `${from}px` }, { width: `${box.offsetWidth}px` }], { ...timing, duration: ROLL * 0.75 * pace });
    };

    // The programme as written
    const days = [...root.querySelectorAll(':scope > .kodza-event-schedule__day')].map((el) => {
      const ol = el.querySelector(':scope > .kodza-event-schedule__sessions');
      const heading = el.querySelector(':scope > .kodza-event-schedule__date');
      const stamp = heading?.querySelector('time')?.getAttribute('datetime') || '';
      const rows = ol ? [...ol.children].filter((li) => li.matches('.kodza-event-schedule__session')) : [];
      let date = DATE.test(stamp) ? wallOf(stamp) : NaN;
      if (Number.isNaN(date)) {
        const first = rows[0]?.querySelector('.kodza-event-schedule__when time')?.getAttribute('datetime') || '';
        date = DATE.test(first) ? dayOf(wallOf(first)) : NaN;
      }
      return { el, ol, heading, date, rows, sessions: [] };
    }).filter((day) => day.ol && !Number.isNaN(day.date));
    if (!days.length) return;

    const uid = Math.random().toString(36).slice(2, 8);
    const chevron = '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 6l4 4 4-4"/></svg>';
    const calendar = '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="2.5" y="3.5" width="11" height="10" rx="2"/><path d="M2.5 7h11M5.5 2v3M10.5 2v3"/></svg>';

    days.forEach((day, d) => {
      const list = make('div', 'list');
      day.ol.before(list);
      const rail = make('div', 'rail', { 'aria-hidden': 'true' });
      rail.append(make('span', 'elapsed'), make('span', 'now', null, word('now')));
      list.append(rail, day.ol);
      day.rail = rail;
      day.marker = rail.lastElementChild;
      day.elapsed = rail.firstElementChild;

      day.sessions = day.rows.map((li, i) => {
        const when = li.querySelector(':scope > .kodza-event-schedule__when');
        const times = when ? [...when.querySelectorAll('time')] : [];
        const start = wallOf(times[0]?.getAttribute('datetime') || '', day.date);
        const end = wallOf(times[1]?.getAttribute('datetime') || '', day.date);
        const title = li.querySelector(':scope > .kodza-event-schedule__title');
        const meta = li.querySelector(':scope > .kodza-event-schedule__meta');
        const summary = li.querySelector(':scope > .kodza-event-schedule__summary');
        const head = make('div', 'head');
        const main = make('div', 'main');
        const badge = make('span', 'status');
        const text = make('span', 'badge-text');
        badge.append(make('span', 'pulse', { 'aria-hidden': 'true' }), text);
        badge.hidden = true;
        li.prepend(make('span', 'dot', { 'aria-hidden': 'true' }), head);
        if (when) head.append(when);
        if (title) main.append(title);
        if (meta) main.append(meta);
        head.append(main, badge);
        const session = { li, head, badge, text, start, end, title: title?.textContent.trim() || '', state: '' };
        if (summary && title) {
          const toggle = make('button', 'toggle', { type: 'button', 'aria-expanded': 'false', 'aria-controls': `kodza-es-${uid}-${d}-${i}` });
          toggle.append(...title.childNodes);
          title.append(toggle);
          const chev = make('span', 'chev');
          chev.innerHTML = chevron;
          head.append(chev);
          const detail = make('div', 'detail', { id: `kodza-es-${uid}-${d}-${i}`, inert: '' });
          const inner = make('div', 'detail-inner');
          const body = make('div', 'detail-body');
          const add = make('button', 'add', { type: 'button' });
          add.innerHTML = calendar;
          const label = make('span', 'add-label');
          add.append(label);
          write(label, word('add'), false);
          body.append(summary, add);
          inner.append(body);
          detail.append(inner);
          li.append(detail);
          li.classList.add('is-expandable');
          Object.assign(session, { toggle, detail, add, label, speaker: meta?.querySelector('.kodza-event-schedule__speaker')?.textContent.trim() || '', room: meta?.querySelector('.kodza-event-schedule__room')?.textContent.trim() || '', summary: summary.textContent.trim() });
        }
        return session;
      }).filter((s) => !Number.isNaN(s.start));
      // A session with no end ends when the next one starts
      day.sessions.forEach((s, i) => {
        if (!Number.isNaN(s.end) && s.end > s.start) return;
        const next = day.sessions.slice(i + 1).find((other) => other.start > s.start);
        s.end = next ? next.start : s.start + HALF;
      });
    });

    // The bar: the days as tabs (two or more), the venue clock
    const bar = make('div', 'bar');
    const clock = make('p', 'clock');
    const place = make('span', 'clock-place', null, root.dataset.place ? word('clock', { place: root.dataset.place }) : word('venue'));
    const time = make('span', 'clock-time');
    clock.append(place, make('span', 'sep', { 'aria-hidden': 'true' }), time);
    let tabsBox = null;
    let tabs = [];
    let current = 0;
    let chosen = false; // a visitor picked a day: the clock no longer moves them
    const dayLabel = new Intl.DateTimeFormat(lang, { weekday: 'short', timeZone: 'UTC' });
    const dayNum = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', timeZone: 'UTC' });

    const glide = (tab) => {
      const end = tabs[tabs.length - 1];
      const full = Math.max(tabsBox.clientWidth, end.offsetLeft + end.offsetWidth + parseFloat(getComputedStyle(tabsBox).paddingRight));
      tabsBox.style.setProperty('--kz-ind-w', `${full}px`);
      tabsBox.style.setProperty('--kz-ind-l', `${tab.offsetLeft}px`);
      tabsBox.style.setProperty('--kz-ind-r', `${full - tab.offsetLeft - tab.offsetWidth}px`);
    };

    if (days.length > 1) {
      root.classList.add('has-tabs');
      tabsBox = make('div', 'tabs', { role: 'tablist', 'aria-label': word('days') });
      tabsBox.append(make('span', 'indicator', { 'aria-hidden': 'true' }));
      const mirror = make('span', 'mirror', { 'aria-hidden': 'true' });
      tabs = days.map((day, d) => {
        const label = day.el.dataset.label || dayLabel.format(day.date);
        const num = dayNum.format(day.date);
        const tab = make('button', 'tab', { type: 'button', role: 'tab', id: `kodza-es-${uid}-tab-${d}`, 'aria-controls': `kodza-es-${uid}-day-${d}`, 'aria-selected': 'false', tabindex: '-1', 'aria-label': day.heading?.textContent.trim() || `${label} ${num}` });
        tab.append(make('span', null, null, label), make('span', 'num', null, num));
        const ghost = make('span', 'ghost');
        ghost.append(make('span', null, null, label), make('span', 'num', null, num));
        tabsBox.append(tab);
        mirror.append(ghost);
        Object.assign(day.el, { id: `kodza-es-${uid}-day-${d}` });
        day.el.setAttribute('role', 'tabpanel');
        day.el.setAttribute('aria-labelledby', tab.id);
        day.el.setAttribute('tabindex', '-1');
        return tab;
      });
      tabsBox.append(mirror);
      bar.append(tabsBox);
    }
    bar.append(clock);
    root.prepend(bar);
    const daysBox = make('div', 'days');
    bar.after(daysBox);
    daysBox.append(...days.map((day) => day.el));
    root.append(status);

    // Where the day stands now: the sessions over, on stage and next; the marker on the rail
    const anchor = (s) => s.li.offsetTop + 29.5;
    const track = (day) => {
      if (day.el.hidden) return;
      const t = now();
      const today = dayOf(t);
      const height = day.ol.offsetHeight;
      let fill = day.date < today ? 1 : 0;
      let at = 0;
      const here = day.date === today && day.sessions.length > 0;
      if (here) {
        const list = day.sessions;
        const live = [...list].reverse().find((s) => s.start <= t && t < s.end);
        if (live) {
          const first = list.findIndex((s) => s.start === live.start);
          const after = list.findIndex((s) => s.start > live.start);
          const from = anchor(list[first]);
          const to = after < 0 ? height - 10 : anchor(list[after]);
          at = from + ((to - from) * (t - live.start)) / (live.end - live.start);
        } else {
          const next = list.findIndex((s) => s.start > t);
          at = next < 0 ? height - 10 : next === 0 ? 10 : list[next].li.offsetTop;
        }
        at = Math.min(Math.max(at, 10), height - 10);
        fill = height ? at / height : 0;
      }
      day.rail.classList.toggle('is-today', here);
      day.rail.style.setProperty('--kz-es-fill', fill.toFixed(4));
      day.rail.style.setProperty('--kz-es-at', `${at.toFixed(1)}px`);
    };

    const badgeTo = (s, state, text, moving) => {
      const was = s.state;
      if (was === state && (!text || shown.get(s.text) === text)) return;
      s.state = state;
      const roll = moving && !still;
      s.badge.getAnimations().forEach((anim) => anim.cancel());
      if (!state) {
        if (!roll || !was) { s.badge.hidden = true; return; }
        const out = s.badge.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(0.9)' }], { duration: 260 * pace, easing: EASE, fill: 'forwards' });
        out.finished.then(() => { if (!s.state) s.badge.hidden = true; out.cancel(); }, () => {});
        return;
      }
      s.badge.dataset.state = state;
      if (!was || s.badge.hidden) {
        s.badge.hidden = false;
        shown.delete(s.text);
        write(s.text, text, false);
        if (roll) s.badge.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: ROLL * pace, easing: EASE });
        return;
      }
      write(s.text, text, roll);
    };

    const refresh = (moving) => {
      const t = now();
      const today = dayOf(t);
      write(time, `${pad(Math.floor((t % 86400000) / 3600000))}:${pad(Math.floor((t % 3600000) / 60000))}`, moving);
      days.forEach((day) => {
        const isToday = day.date === today;
        const upcoming = isToday ? day.sessions.find((s) => s.start > t)?.start : undefined;
        day.sessions.forEach((s) => {
          const past = day.date < today || (isToday && s.end <= t);
          const live = isToday && s.start <= t && t < s.end;
          s.li.classList.toggle('is-past', past);
          s.li.classList.toggle('is-live', live);
          if (live) return badgeTo(s, 'live', word('live'), moving);
          if (s.start === upcoming) {
            const minutes = Math.ceil((s.start - t) / 60000);
            return badgeTo(s, 'soon', minutes <= SOON ? word('soon', { n: minutes }) : word('next'), moving);
          }
          return badgeTo(s, '', '', moving);
        });
      });
      track(days[current]);
    };

    // The day you land on: today, or the next day of the programme, or the first one
    const arrival = () => {
      const today = dayOf(now());
      const at = days.findIndex((day) => day.date >= today);
      return at < 0 ? 0 : at;
    };

    const select = (index) => {
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
      });
      if (!tabsBox) return;
      const tab = tabs[index];
      glide(tab);
      if (tabsBox.scrollWidth > tabsBox.clientWidth + 1) tabsBox.scrollTo({ left: tab.offsetLeft - (tabsBox.clientWidth - tab.offsetWidth) / 2, behavior: still ? 'auto' : 'smooth' });
    };

    const show = (index, moving) => {
      if (index === current) return;
      const dir = index > current ? 1 : -1;
      const from = daysBox.offsetHeight;
      running.splice(0).forEach((anim) => anim.cancel());
      root.classList.remove('is-moving');
      const old = days[current];
      const fresh = days[index];
      days.forEach((day, i) => { day.el.classList.remove('is-going'); day.el.hidden = i !== current && i !== index; });
      current = index;
      token += 1;
      select(index);
      fresh.el.hidden = false;
      track(fresh);
      root.dispatchEvent(new CustomEvent('kodza:day', { detail: { index, date: new Date(fresh.date).toISOString().slice(0, 10) }, bubbles: true }));
      if (!moving || still) { old.el.hidden = true; return; }
      const id = token;
      old.el.classList.add('is-going');
      const to = daysBox.offsetHeight;
      const out = old.el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-dir * SHIFT}px)` }], { duration: MOVE * 0.5 * pace, easing: 'cubic-bezier(0.4, 0, 0.7, 1)', fill: 'forwards' });
      running.push(out);
      out.finished.then(() => {
        if (id !== token) return;
        old.el.hidden = true;
        old.el.classList.remove('is-going');
        out.cancel();
      }, () => {});
      fresh.sessions.forEach((s, k) => running.push(s.li.animate([{ opacity: 0, transform: `translateX(${dir * SHIFT}px)` }, { opacity: 1, transform: 'none' }], { duration: MOVE * pace, delay: (MOVE * 0.12 + Math.min(k, 8) * CASCADE) * pace, easing: EASE, fill: 'backwards' })));
      // The time already gone fills the rail again as the day arrives
      running.push(fresh.elapsed.animate([{ transform: 'scaleY(0)' }, { transform: `scaleY(${getComputedStyle(fresh.rail).getPropertyValue('--kz-es-fill') || 0})` }], { duration: MOVE * 1.4 * pace, delay: 120 * pace, easing: EASE, fill: 'backwards' }));
      if (fresh.rail.classList.contains('is-today')) running.push(fresh.marker.animate([{ opacity: 0 }, { opacity: 1 }], { duration: MOVE * pace, delay: 300 * pace, easing: EASE, fill: 'backwards' }));
      if (from !== to) {
        root.classList.add('is-moving');
        const height = daysBox.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: MOVE * 1.25 * pace, easing: SWING });
        running.push(height);
        height.finished.then(() => id === token && root.classList.remove('is-moving'), () => {});
      }
    };

    // Open and close a session on its summary
    const open = (s, on) => {
      s.toggle.setAttribute('aria-expanded', String(on));
      s.li.classList.toggle('is-open', on);
      s.detail.inert = !on;
    };

    // The .ics file: one event, in UTC, lines folded at 75 octets as the format asks
    const esc = (text) => text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
    const fold = (line) => {
      const out = [];
      let rest = line;
      while (rest.length > 73) { out.push(rest.slice(0, 73)); rest = ` ${rest.slice(73)}`; }
      out.push(rest);
      return out.join('\r\n');
    };
    const utc = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const fileOf = (s) => {
      const where = [s.room, root.dataset.place].filter(Boolean).join(', ');
      const about = [s.speaker, s.summary].filter(Boolean).join('\n\n');
      const link = /^https?:\/\//.test(root.dataset.url || '') ? root.dataset.url : '';
      return [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kodza//Event Schedule//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${utc(instantOf(s.start))}-${s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}@kodza`,
        `DTSTAMP:${utc(Date.now())}`,
        `DTSTART:${utc(instantOf(s.start))}`,
        `DTEND:${utc(instantOf(s.end))}`,
        `SUMMARY:${esc(s.title)}`,
        where && `LOCATION:${esc(where)}`,
        about && `DESCRIPTION:${esc(about)}`,
        link && `URL:${link}`,
        'END:VEVENT', 'END:VCALENDAR',
      ].filter(Boolean).map(fold).join('\r\n') + '\r\n';
    };
    const save = (s) => {
      const text = fileOf(s);
      // A site that sends it elsewhere (its own calendar links) cancels the event
      const go = root.dispatchEvent(new CustomEvent('kodza:add', { detail: { title: s.title, start: new Date(instantOf(s.start)), end: new Date(instantOf(s.end)), ics: text }, bubbles: true, cancelable: true }));
      if (go) {
        const href = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = href;
        link.download = `${s.title.replace(/[^\w\s-]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'event'}.ics`;
        link.hidden = true;
        root.append(link);
        link.click();
        link.remove();
        later(() => URL.revokeObjectURL(href), 4000);
        say(word('saved', { title: s.title }));
      }
      write(s.label, word('added'), true);
      clearTimeout(s.back);
      s.back = later(() => write(s.label, word('add'), true), ADDED);
    };

    root.addEventListener('click', (event) => {
      const tab = event.target.closest('.kodza-event-schedule__tab');
      if (tab && tabsBox?.contains(tab)) { chosen = true; return show(tabs.indexOf(tab), true); }
      const s = days[current].sessions.find((x) => x.toggle?.contains(event.target) || x.add?.contains(event.target));
      if (!s) return;
      if (s.add.contains(event.target)) return save(s);
      open(s, s.toggle.getAttribute('aria-expanded') !== 'true');
    }, { signal });

    // The tabs move with the arrows: the focus and the day together
    tabsBox?.addEventListener('keydown', (event) => {
      const at = tabs.indexOf(document.activeElement);
      if (at < 0) return;
      const keys = { ArrowRight: (at + 1) % tabs.length, ArrowLeft: (at - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 };
      if (!(event.key in keys)) return;
      event.preventDefault();
      chosen = true;
      tabs[keys[event.key]].focus();
      show(keys[event.key], true);
    }, { signal });

    // First paint: the right day, no motion; then the transitions come alive
    root.classList.add('is-instant');
    current = arrival();
    days.forEach((day, i) => { day.el.hidden = i !== current; });
    select(current);
    refresh(false);
    const first = requestAnimationFrame(() => {
      root.offsetWidth;
      if (!still) root.classList.remove('is-instant');
      root.classList.add('is-live');
    });

    // The clock: once a minute, on the minute
    let tick = 0;
    const schedule = () => {
      clearTimeout(tick);
      tick = later(() => {
        refresh(true);
        if (!chosen && arrival() !== current) show(arrival(), true);
        schedule();
      }, 60000 - (((now() % 60000) + 60000) % 60000) + 40);
    };
    schedule();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) return;
      refresh(false);
      schedule();
    }, { signal });
    const watch = new MutationObserver(() => {
      pin();
      refresh(true);
      if (!chosen && arrival() !== current) show(arrival(), true);
      schedule();
    });
    watch.observe(root, { attributes: true, attributeFilter: ['data-now', 'data-timezone'] });

    // The rail follows the rows as they open, close or rewrap, without its glide
    let quiet = 0;
    const resize = new ResizeObserver(() => {
      root.classList.add('is-tracking');
      track(days[current]);
      if (tabsBox) glide(tabs[current]);
      quiet += 1;
      const mine = quiet;
      frame(() => frame(() => mine === quiet && root.classList.remove('is-tracking')));
    });
    days.forEach((day) => resize.observe(day.ol));
    if (tabsBox) resize.observe(tabsBox);
    document.fonts?.ready.then(() => !signal.aborted && tabsBox && glide(tabs[current]));

    // kodza:replay: everything closed, back to the day of arrival
    root.addEventListener('kodza:replay', () => {
      chosen = false;
      days.forEach((day) => day.sessions.forEach((s) => s.toggle && open(s, false)));
      const back = arrival();
      if (back !== current) show(back, true);
    }, { signal });

    signal.addEventListener('abort', () => {
      token += 1;
      cancelAnimationFrame(first);
      frames.forEach(cancelAnimationFrame);
      timers.forEach(clearTimeout);
      running.forEach((anim) => anim.cancel());
      watch.disconnect();
      resize.disconnect();
    });
  }

  // Builds an element with classes under one prefix ('pill is-on' → kodza-…__pill kodza-…__is-on)
  const maker = (base) => (tag, classes, attrs, text) => {
    const el = document.createElement(tag);
    if (classes) el.className = classes.split(' ').map((c) => `${base}__${c}`).join(' ');
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
