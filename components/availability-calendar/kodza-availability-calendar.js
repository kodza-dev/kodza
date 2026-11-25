// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Availability Calendar
// Turns a list of booked dates into a calendar of one or two months: a booked day carries a soft
// band and a struck number, the arrows walk from month to month, and the line under the title
// gives the next free night. Each <li> of the list holds one <time datetime="YYYY-MM-DD">, or two
// for a range; data-booked on the root takes the same dates as text ("2026-12-24/2026-12-26, …").
// data-unit="night" (a rental): a range runs from arrival to departure, so the departure day is
// free from the afternoon, a day where one guest leaves and the next arrives shows half and half.
// data-unit="day" (the default: a person, a room by the day): a range covers both of its ends.
// data-months: months side by side (2 by default, 1 under 600 px wide). data-from, data-until
// (YYYY-MM): the first and the last month the arrows reach, this month and the eleven after it by
// default. data-locale: the month and day names. Without the script, the list simply shows.
// Settings: the --kz-availability-* variables in the CSS, the words below (data-text-<key> on the
// root), the constants under them.
(() => {
  const SELECTOR = '.kodza-availability';
  const WORDS = {
    free: 'Free',
    booked: 'Booked',
    half: 'Changeover', // the legend, nights only: one guest leaves, the next one arrives
    taken: 'booked', // read out after the number of a booked day
    checkIn: 'check-in only', // the night before is booked, this one is free
    checkOut: 'check-out only', // this night is booked, the one before is free
    today: 'today',
    nextNight: 'Next free night: {date}',
    nextDay: 'Next free day: {date}',
    none: 'Fully booked for now',
    prev: 'Previous month',
    next: 'Next month',
    calendar: 'Availability', // the name of the calendar, when it has no title
  };
  const WIDE = 600; // px, under this width one month shows
  const NARROW = 440; // px, under this width the card tightens its padding
  const SLIDE = 560; // ms, the months sliding by one
  const DRAW_AT = 0.4; // the share of the slide before the new month draws its bands
  const ENTER_AT = 0.4; // the share of the calendar in view before the bands draw
  const DAY = 86400000;
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const arrow = (d) => `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="${d}"/></svg>`;

  // Days are counted from 1 Jan 1970 and months from year 0, in UTC: no time zone, no summer time
  const dayOf = (text) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(text || '').trim());
    return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / DAY : null;
  };
  const monthOf = (text) => {
    const m = /^(\d{4})-(\d{2})/.exec(String(text || '').trim());
    return m ? +m[1] * 12 + (+m[2] - 1) : null;
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const make = maker('kodza-availability');
    const nights = root.dataset.unit === 'night';
    const locale = root.dataset.locale || document.documentElement.lang || undefined;
    const weekStart = root.dataset.weekStart === '0' ? 0 : 1;
    const wanted = Math.max(1, Math.min(3, parseInt(root.dataset.months, 10) || 2));
    const timers = new Set();
    const later = (fn, ms) => {
      const t = setTimeout(() => {
        timers.delete(t);
        fn();
      }, ms);
      timers.add(t);
    };
    signal.addEventListener('abort', () => timers.forEach(clearTimeout));

    // The booked nights or days, and in nights the arrival and departure days, to tell a
    // changeover from a day that is booked through
    const taken = new Set();
    const arrivals = new Set();
    const departures = new Set();
    const add = (a, b) => {
      if (a == null || (b != null && (b < a || b - a > 800))) return;
      const end = b == null ? a : nights ? b - 1 : b;
      for (let d = a; d <= end; d++) taken.add(d);
      arrivals.add(a);
      departures.add(nights ? end + 1 : end);
    };
    const list = root.querySelector('.kodza-availability__booked');
    list?.querySelectorAll('li').forEach((li) => {
      const [a, b] = [...li.querySelectorAll('time')].map((t) => dayOf(t.getAttribute('datetime') || t.textContent));
      add(a, b);
    });
    (root.dataset.booked || '').split(',').forEach((item) => {
      const [a, b] = item.split('/').map(dayOf);
      add(a, b);
    });
    const stateOf = (d) => {
      if (!nights) return taken.has(d) ? 'booked' : '';
      const night = taken.has(d);
      const before = taken.has(d - 1);
      if (night && before) return arrivals.has(d) && departures.has(d) ? 'turn' : 'booked';
      return night ? 'in' : before ? 'out' : '';
    };
    // A band runs on into the next day when both ends meet: a booked day ends full, a check-in
    // day starts empty
    const fullRight = (s) => s === 'booked' || s === 'turn' || s === 'in';
    const fullLeft = (s) => s === 'booked' || s === 'turn' || s === 'out';

    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY;
    const first = monthOf(root.dataset.from) ?? now.getFullYear() * 12 + now.getMonth();
    const last = Math.max(first, monthOf(root.dataset.until) ?? first + 11);
    const monthName = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' });
    const dayLong = new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' });
    const dayLetter = new Intl.DateTimeFormat(locale, { weekday: 'narrow', timeZone: 'UTC' });
    const short = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
    const startOf = (m) => Date.UTC(Math.floor(m / 12), m % 12, 1) / DAY;

    // The card: title and next free night, the arrows, the months, the note and the legend
    const title = root.querySelector('.kodza-availability__title');
    const note = root.querySelector('.kodza-availability__note');
    const head = make('div', 'head');
    const heading = make('div', 'heading');
    const status = make('p', 'status');
    if (title) heading.append(title);
    heading.append(status);
    const nav = make('div', 'nav');
    const prev = make('button', 'arrow', { type: 'button', 'aria-label': word('prev') });
    const next = make('button', 'arrow', { type: 'button', 'aria-label': word('next') });
    prev.innerHTML = arrow('M10 3.5 5.5 8l4.5 4.5');
    next.innerHTML = arrow('M6 3.5 10.5 8 6 12.5');
    nav.append(prev, next);
    head.append(heading, nav);
    const stage = make('div', 'stage');
    const track = make('div', 'track');
    stage.append(track);
    const foot = make('div', 'foot');
    const legend = make('p', 'legend', { 'aria-hidden': 'true' });
    const key = (kind, text) => {
      const item = make('span', 'key');
      item.append(make('span', `swatch swatch--${kind}`), text);
      return item;
    };
    legend.append(key('free', word('free')), key('booked', word('booked')));
    if (nights) legend.append(key('half', word('half')));
    if (note) foot.append(note);
    foot.append(legend);
    const live = make('p', 'live', { 'aria-live': 'polite' });
    root.append(head, stage, foot, live);
    root.setAttribute('role', 'group');
    root.setAttribute('aria-label', title?.textContent.trim() || word('calendar'));

    // The next free night or day, from today to the last month the arrows reach
    const end = startOf(last + 1);
    let free = null;
    for (let d = Math.max(today, startOf(first)); d < end; d++) {
      if (!taken.has(d)) {
        free = d;
        break;
      }
    }
    status.textContent = free === null ? word('none') : word(nights ? 'nextNight' : 'nextDay').replace('{date}', short.format(free * DAY));

    // One month: a real table, always six weeks tall so the card never changes height
    const build = (m) => {
      const start = startOf(m);
      const length = (startOf(m + 1) - start);
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
          const state = stateOf(d);
          const td = make('td', 'day');
          td.append(make('span', 'num', null, i + 1));
          const said = [];
          if (state) {
            td.classList.add(`is-${state}`);
            td.style.setProperty('--kz-availability-at', order++);
            const before = i > 0 && c > 0 ? stateOf(d - 1) : '';
            const after = i < length - 1 && c < 6 ? stateOf(d + 1) : '';
            if (fullLeft(state) && !fullRight(before)) td.classList.add('is-cap-start');
            if (fullRight(state) && !fullLeft(after)) td.classList.add('is-cap-end');
            said.push(word(state === 'in' ? 'checkOut' : state === 'out' ? 'checkIn' : 'taken'));
          }
          if (d < today) td.classList.add('is-past');
          if (d === today) {
            td.classList.add('is-today');
            td.setAttribute('aria-current', 'date');
            said.unshift(word('today'));
          }
          if (said.length) td.append(make('span', 'hidden', null, `, ${said.join(', ')}`));
          tr.append(td);
        }
        tbody.append(tr);
      }
      table.append(thead, tbody);
      month.append(table);
      month.dataset.count = order;
      return month;
    };

    let at = 0; // the first month shown, counted from `first`
    let shown = root.clientWidth < WIDE ? 1 : wanted;
    let drawn = false;
    let anim = null;
    let pending = null; // what is left of a slide: dropping the month that left
    const settle = () => {
      const done = pending;
      pending = null;
      done?.();
    };
    const sync = () => {
      prev.setAttribute('aria-disabled', String(at <= 0));
      next.setAttribute('aria-disabled', String(first + at + shown - 1 >= last));
    };
    const names = () => [...track.children].map((el) => el.querySelector('caption').textContent).join(' – ');
    const draw = (month, instant) => {
      month.classList.toggle('is-instant', instant);
      month.classList.add('is-drawn');
    };
    const render = () => {
      settle();
      track.style.setProperty('--kz-availability-shown', shown);
      track.replaceChildren(...Array.from({ length: shown }, (_, i) => build(first + at + i)));
      if (drawn) [...track.children].forEach((month) => draw(month, true));
      sync();
    };

    // The months slide by exactly one: the new one joins on the side you go, the track moves, then
    // the one that left is dropped and the track put back, in the same frame
    const move = (step) => {
      settle();
      const target = at + step;
      if (target < 0 || first + target + shown - 1 > last) return;
      at = target;
      if (still) {
        render();
        live.textContent = names();
        return;
      }
      const incoming = build(step > 0 ? first + at + shown - 1 : first + at);
      if (step > 0) track.append(incoming);
      else track.prepend(incoming);
      const outgoing = step > 0 ? track.firstElementChild : track.lastElementChild;
      const width = track.children[1].offsetLeft - track.children[0].offsetLeft;
      const moved = `translateX(${-width}px)`;
      anim = track.animate(
        step > 0 ? [{ transform: 'none' }, { transform: moved }] : [{ transform: moved }, { transform: 'none' }],
        { duration: SLIDE * pace, easing: ease, fill: 'forwards' },
      );
      const done = () => {
        outgoing.remove();
        anim?.cancel();
        anim = null;
        if (drawn) draw(incoming, false);
        live.textContent = names();
      };
      pending = done;
      anim.onfinish = () => pending === done && settle();
      if (drawn) later(() => pending === done && draw(incoming, false), SLIDE * pace * DRAW_AT);
      sync();
    };
    prev.addEventListener('click', () => prev.getAttribute('aria-disabled') !== 'true' && move(-1), { signal });
    next.addEventListener('click', () => next.getAttribute('aria-disabled') !== 'true' && move(1), { signal });
    signal.addEventListener('abort', () => anim?.cancel());

    // The bands draw in reading order, the second month after the first
    const enter = () => {
      drawn = true;
      let lead = 0;
      [...track.children].forEach((month) => {
        month.style.setProperty('--kz-availability-lead', lead);
        lead += +month.dataset.count;
        draw(month, still);
      });
    };

    render();
    const resize = new ResizeObserver(() => {
      const width = root.clientWidth;
      root.classList.toggle('is-narrow', width < NARROW);
      const count = width < WIDE ? 1 : wanted;
      if (count === shown) return;
      shown = count;
      at = Math.max(0, Math.min(at, last - first - shown + 1));
      render();
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
    });

    // kodza:replay on the root draws the bands again
    root.addEventListener('kodza:replay', () => {
      if (!drawn) return;
      settle();
      [...track.children].forEach((month) => month.classList.remove('is-drawn', 'is-instant'));
      root.offsetWidth;
      enter();
    }, { signal });
  }

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
