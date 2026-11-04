// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Departure Board
// The next departures from a place, worked out at the place's own time. Each timetable is a
// .kodza-departure-board__day with its trips; data-from and data-to (MM-DD, a winter can run
// across the new year) give its season and data-days its days ("mon-sat", "sat,sun"), both
// optional. The script keeps the one that runs today, puts the next trip at the top ("Next boat",
// its time, where it goes, "in 2 h 05" that rolls on every minute), lets the gone ones fade and
// adds a line once the day is over. The time zone comes from data-timezone (an IANA name such as
// Europe/Paris; the visitor's own time when it's missing or unknown).
// Its words: data-next, data-later ("{label} · {day}"), data-tomorrow, data-end, data-off (a day
// with no timetable) and data-none on the root, data-in ("in {h} h {mm}"), data-in-min and data-leaving for the countdown, data-clock
// on the clock; the day names follow the page's lang. data-now ("sat 07:50", or
// "2026-07-14 07:50" for another season) pins the clock, to check a timetable before it goes live.
(() => {
  const SELECTOR = '.kodza-departure-board';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const ROLL = 640; // ms, a character or a line rolling to its new value
  const STAGGER = 45; // ms between two characters that roll together, left to right
  const GLIDE = 620; // ms, the mark sliding down to the next trip
  const AHEAD = 14; // days looked ahead for the next trip (a season that starts soon)
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const DAY = 1440; // minutes
  const WORDS = {
    next: 'Next departure',
    later: '{label} · {day}',
    tomorrow: 'tomorrow',
    end: 'No more departures today',
    off: 'No departures today',
    none: 'No departures scheduled',
    in: 'in {h} h {mm}',
    inMin: 'in {min} min',
    leaving: 'Leaving now',
    clock: 'Local time {time}',
  };

  const minutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + (m || 0);
  };
  const clock = (n) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
  // A local day is kept as its date at UTC midnight: adding days never meets a clock change
  const plus = (date, days) => new Date(date.getTime() + days * 86400000);
  const weekday = (date) => (date.getUTCDay() + 6) % 7; // mon = 0
  const monthDay = (date) => (date.getUTCMonth() + 1) * 100 + date.getUTCDate();

  // "mon-sat", "sat,sun", "fri": the days a timetable runs, every day when it's missing
  const daysOf = (text) => {
    const set = new Set();
    (text || '').toLowerCase().split(',').forEach((part) => {
      const [a, b] = part.split('-').map((d) => DAYS.indexOf(d.trim()));
      if (a < 0) return;
      for (let d = a; ; d = (d + 1) % 7) {
        set.add(d);
        if (b === undefined || b < 0 || d === b) break;
      }
    });
    return set.size ? set : null;
  };
  // "04-01" -> 401
  const dateOf = (text) => {
    const m = (text || '').match(/^(\d{1,2})-(\d{1,2})$/);
    return m ? Number(m[1]) * 100 + Number(m[2]) : null;
  };
  const runs = (timetable, date) => {
    if (timetable.days && !timetable.days.has(weekday(date))) return false;
    const { from, to } = timetable;
    if (from === null && to === null) return true;
    const d = monthDay(date);
    const a = from ?? 101;
    const b = to ?? 1231;
    return a <= b ? a <= d && d <= b : d >= a || d <= b;
  };

  // Now, at the place
  const zoned = (zone) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
    try {
      return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: zone || undefined });
    } catch {
      return new Intl.DateTimeFormat('en-GB', options);
    }
  };

  // Everything that rolls is a window: a hidden copy of the words for screen readers, and a line
  // where each digit has a window of its own (the letters stay plain text, kerned)
  const make = (tag, className, text) => Object.assign(document.createElement(tag), { className: `kodza-departure-board__${className}`, textContent: text ?? '' });
  const lineOf = (text) => {
    const line = make('span', 'line');
    line.setAttribute('aria-hidden', 'true');
    text.split(/(\d)/).forEach((part) => {
      if (!/^\d$/.test(part)) return part && line.append(part);
      const cell = make('span', 'cell');
      cell.append(make('span', 'glyph', part));
      line.append(cell);
    });
    return line;
  };
  // The same words with other digits: only the digits roll
  const sameShape = (a, b) => typeof a === 'string' && a.replace(/\d/g, '0') === b.replace(/\d/g, '0');

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root); // the clock keeps its own time: only the rolls and the glide follow it
    const still = reduceMotion || !pace;
    const words = (key) => root.dataset[key] || WORDS[key];
    const lang = root.closest('[lang]')?.lang || undefined;
    let dayName;
    try {
      dayName = new Intl.DateTimeFormat(lang, { weekday: 'short', timeZone: 'UTC' });
    } catch {
      dayName = new Intl.DateTimeFormat('en', { weekday: 'short', timeZone: 'UTC' });
    }
    const timetables = [...root.querySelectorAll('.kodza-departure-board__day')].map((el) => {
      const trips = [...el.querySelectorAll('.kodza-departure-board__trip')].map((trip) => {
        const time = trip.querySelector('.kodza-departure-board__time');
        const m = (time?.getAttribute('datetime') || time?.textContent || '').match(/(\d{1,2}):(\d{2})/);
        if (m) time.setAttribute('datetime', `${m[1].padStart(2, '0')}:${m[2]}`);
        return m ? { el: trip, at: minutes(m[0]) } : null;
      }).filter(Boolean).sort((a, b) => a.at - b.at);
      return { el, list: el.querySelector('.kodza-departure-board__list'), trips, from: dateOf(el.dataset.from), to: dateOf(el.dataset.to), days: daysOf(el.dataset.days) };
    }).filter((t) => t.list && t.trips.length);
    if (!timetables.length) return;
    const head = root.querySelector('.kodza-departure-board__head');
    const clockEl = root.querySelector('.kodza-departure-board__clock');
    const clockWords = clockEl?.dataset.clock || WORDS.clock;

    // The next trip, built here: its label, its time, where it goes and the countdown
    const next = make('div', 'next');
    const label = make('p', 'next-label');
    const row = make('div', 'next-row');
    const big = make('span', 'next-time');
    const count = make('span', 'count');
    const to = make('p', 'next-to');
    row.append(big, count);
    next.append(label, row, to);
    (head || root.firstElementChild).after(next);
    // The line once the day is over, under today's timetable (or alone on a day without one)
    const end = make('p', 'end');
    // The mark behind the next trip, one per board: it slides from one trip to the next
    const mark = make('span', 'mark');
    mark.setAttribute('aria-hidden', 'true');

    const shown = new WeakMap(); // the words each window shows
    // Writes words in a window. Moving, the characters that change roll (the old one rises out of
    // its window as the new one comes from below, left to right); words of another shape roll as a
    // whole line, and the window's width goes from one to the other
    const write = (box, text, moving) => {
      const was = shown.get(box);
      if (was === text) return;
      if (was === undefined) box.replaceChildren();
      shown.set(box, text);
      let sr = box.querySelector(':scope > .kodza-departure-board__sr');
      if (!sr) box.prepend(sr = make('span', 'sr'));
      sr.textContent = text;
      const old = box.querySelector(':scope > .kodza-departure-board__line:not(.is-leaving)');
      if (old && moving && !still && sameShape(was, text)) {
        const digits = text.match(/\d/g);
        let order = 0;
        old.querySelectorAll('.kodza-departure-board__cell').forEach((cell, i) => {
          const glyph = cell.lastElementChild;
          if (glyph.textContent === digits[i]) return;
          const y = new DOMMatrixReadOnly(getComputedStyle(glyph).transform).m42;
          [...cell.children].forEach((g) => g !== glyph && g.remove());
          glyph.getAnimations().forEach((anim) => anim.cancel());
          glyph.classList.add('is-leaving');
          const fresh = make('span', 'glyph', digits[i]);
          cell.append(fresh);
          const timing = { duration: ROLL * pace, delay: STAGGER * pace * order++, easing: EASE };
          glyph.animate([{ transform: `translateY(${y}px)` }, { transform: 'translateY(-105%)' }], { ...timing, fill: 'both' }).finished.then(() => glyph.remove(), () => {});
          fresh.animate([{ transform: 'translateY(105%)' }, { transform: 'none' }], { ...timing, fill: 'backwards' });
        });
        return;
      }
      const from = box.offsetWidth;
      box.querySelectorAll(':scope > .kodza-departure-board__line.is-leaving').forEach((el) => el.remove());
      const line = lineOf(text);
      box.append(line);
      if (!old) return;
      if (!moving || still) return old.remove();
      const y = new DOMMatrixReadOnly(getComputedStyle(old).transform).m42;
      old.getAnimations().forEach((a) => a.cancel());
      old.classList.add('is-leaving');
      const timing = { duration: ROLL * pace, easing: EASE };
      old.animate([{ transform: `translateY(${y}px)` }, { transform: 'translateY(-105%)' }], { ...timing, fill: 'forwards' }).finished.then(() => old.remove(), () => {});
      line.animate([{ transform: 'translateY(105%)' }, { transform: 'none' }], timing);
      box.getAnimations().forEach((a) => a.cancel());
      if (box.offsetWidth !== from) box.animate([{ width: `${from}px` }, { width: `${box.offsetWidth}px` }], { ...timing, duration: ROLL * 0.75 * pace });
    };
    // Where the next trip goes: its words as written (via, platform), rolling as one line
    const swap = (box, nodes, key, moving) => {
      if (shown.get(box) === key) return;
      shown.set(box, key);
      const old = box.querySelector(':scope > .kodza-departure-board__line:not(.is-leaving)');
      box.querySelectorAll(':scope > .kodza-departure-board__line.is-leaving').forEach((el) => el.remove());
      const line = make('span', 'line');
      line.append(...nodes);
      box.append(line);
      if (!old) return;
      if (!moving || still) return old.remove();
      old.classList.add('is-leaving');
      old.setAttribute('aria-hidden', 'true');
      const timing = { duration: ROLL * pace, easing: EASE };
      old.animate([{ transform: 'none' }, { transform: 'translateY(-105%)' }], { ...timing, fill: 'forwards' }).finished.then(() => old.remove(), () => {});
      line.animate([{ transform: 'translateY(105%)' }, { transform: 'none' }], timing);
    };

    let format = null;
    const now = () => {
      const pinned = (root.dataset.now || '').trim().toLowerCase();
      const parts = Object.fromEntries(format.formatToParts(new Date()).map((p) => [p.type, p.value]));
      const today = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
      const real = { date: today, at: minutes(`${parts.hour}:${parts.minute}`) };
      let m = pinned.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}:\d{2})$/);
      if (m) return { date: new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))), at: minutes(m[4]) };
      m = pinned.match(/^([a-z]{3})\s+(\d{1,2}:\d{2})$/);
      if (m && DAYS.includes(m[1])) return { date: plus(today, (DAYS.indexOf(m[1]) - weekday(today) + 7) % 7), at: minutes(m[2]) };
      return real;
    };
    const timetableOn = (date) => timetables.find((t) => runs(t, date));

    let current = null; // today's timetable
    let marked = null; // the element under the mark
    // Where an element sits in its timetable, to the subpixel (a parent scaled by a transform
    // divides it back). Its own lift is left out unless drawn: a row rising in still aims at its place
    const spot = (el, box, drawn) => {
      const r = el.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      const scale = b.height / box.offsetHeight || 1;
      const lift = drawn ? 0 : new DOMMatrixReadOnly(getComputedStyle(el).transform).m42;
      return { y: (r.top - b.top) / scale - box.clientTop - lift, h: r.height / scale };
    };
    let arrive = null; // the rows rising into a new timetable, and when: the mark comes with its own
    const place = (target, moving) => {
      const rising = arrive;
      arrive = null;
      const box = current?.el;
      if (!box) {
        marked = null;
        return mark.remove();
      }
      if (mark.parentElement !== box) box.append(mark);
      // From where it is seen, half way through a glide included
      const from = marked && mark.style.height ? spot(mark, box, true) : null;
      marked = target;
      mark.classList.toggle('is-off', !target);
      if (!target) return;
      mark.getAnimations().forEach((a) => a.cancel());
      const to = spot(target, box);
      mark.style.top = `${to.y}px`;
      mark.style.height = `${to.h}px`;
      if (moving && !still && rising) {
        mark.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: ROLL * pace, delay: rising.get(target) ?? 120 * pace, easing: EASE, fill: 'backwards' });
      }
      if (!moving || still || !from) return;
      const y = from.y - to.y;
      if (Math.abs(y) < 0.5 && Math.abs(from.h - to.h) < 0.5) return;
      mark.animate([{ transform: `translateY(${y}px)`, height: `${from.h}px` }, { transform: 'none', height: `${to.h}px` }], { duration: GLIDE * pace, easing: EASE });
    };

    // Today's timetable shows, the others wait; when the day changes, a still copy of the old one
    // rises away while the new trips rise in turn
    let parting = null;
    const show = (timetable, moving) => {
      if (timetable === current && end.isConnected) return;
      parting?.remove();
      parting = null;
      if (moving && !still && current) {
        const r = current.el.getBoundingClientRect();
        const b = root.getBoundingClientRect();
        const scale = b.height / root.offsetHeight || 1;
        const copy = current.el.cloneNode(true);
        copy.classList.add('is-parting');
        copy.setAttribute('aria-hidden', 'true');
        copy.inert = true;
        const endCopy = copy.querySelector('.kodza-departure-board__end');
        if (endCopy) endCopy.style.display = getComputedStyle(end).display;
        copy.style.top = `${(r.top - b.top) / scale - root.clientTop}px`;
        copy.style.left = `${(r.left - b.left) / scale - root.clientLeft}px`;
        copy.style.width = `${r.width / scale}px`;
        root.append(copy);
        parting = copy;
        copy.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-10px)' }], { duration: ROLL * 0.5 * pace, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' })
          .finished.then(() => copy.remove(), () => {});
      }
      timetables.forEach((t) => {
        t.el.hidden = t !== timetable;
      });
      const first = !current;
      current = timetable;
      marked = null;
      mark.style.height = '';
      (timetable ? timetable.el : root).append(end);
      root.classList.toggle('is-empty', !timetable);
      if (first || !moving || still || !timetable) return;
      arrive = new Map();
      [timetable.el.querySelector('.kodza-departure-board__title'), ...timetable.trips.map((t) => t.el)].filter(Boolean).forEach((el, i) => {
        const delay = (120 + 50 * i) * pace;
        arrive.set(el, delay);
        el.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: ROLL * pace, delay, easing: EASE, fill: 'backwards' });
      });
    };

    // The board's height goes from one state to the next (a line that comes, another timetable)
    let sizing = null;
    const grow = (before, moving) => {
      const after = root.offsetHeight;
      if (!moving || still || after === before) return;
      root.classList.add('is-sizing');
      sizing = root.animate([{ height: `${before}px` }, { height: `${after}px` }], { duration: ROLL * pace, easing: EASE });
      sizing.finished.then(() => root.classList.remove('is-sizing'), () => {});
    };

    let wasOver = false;
    const update = (moving) => {
      const before = root.offsetHeight;
      sizing?.cancel();
      root.classList.remove('is-sizing');
      const t = now();
      if (clockEl) write(clockEl, clockWords.replace('{time}', clock(t.at)), moving);
      show(timetableOn(t.date), moving);
      // The next trip: today's first one not gone yet (one that leaves this minute is still there),
      // or the first of the next day that has one
      let found = null;
      for (let d = 0; d <= AHEAD && !found; d += 1) {
        const timetable = timetableOn(plus(t.date, d));
        const trip = timetable?.trips.find((tr) => d > 0 || tr.at >= t.at);
        if (trip) found = { trip, d };
      }
      if (current) {
        current.trips.forEach((tr) => {
          tr.el.classList.toggle('is-gone', tr.at < t.at);
          tr.el.classList.toggle('is-next', found?.d === 0 && tr === found.trip);
        });
      }
      const over = Boolean(current) && found?.d !== 0;
      root.classList.toggle('is-over', over);
      next.classList.toggle('is-none', !found);
      end.textContent = words(current ? 'end' : 'off');
      // The end line rises when the last trip has gone
      if (over && !wasOver && moving && !still) {
        end.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: ROLL * pace, delay: 120 * pace, easing: EASE, fill: 'backwards' });
      }
      wasOver = over;
      if (!found) {
        write(label, words('none'), moving);
        place(null, moving);
        return grow(before, moving);
      }
      const { trip, d } = found;
      const day = d === 1 ? words('tomorrow') : dayName.format(plus(t.date, d));
      write(label, d ? words('later').replace('{label}', words('next')).replace('{day}', day) : words('next'), moving);
      write(big, clock(trip.at), moving);
      const left = d * DAY + trip.at - t.at;
      let wait = '';
      if (left === 0) wait = words('leaving');
      else if (left < 60) wait = words('inMin').replace('{min}', left);
      else if (left < DAY) wait = words('in').replace('{h}', Math.floor(left / 60)).replace('{mm}', String(left % 60).padStart(2, '0'));
      count.hidden = !wait;
      if (wait) write(count, wait, moving);
      const where = trip.el.querySelector('.kodza-departure-board__to');
      const info = trip.el.querySelector('.kodza-departure-board__info');
      const nodes = [...(where ? where.cloneNode(true).childNodes : [])];
      if (info) nodes.push(' ', make('span', 'next-info', info.textContent));
      swap(to, nodes, `${where?.textContent}|${info?.textContent}`, moving);
      place(over ? end : current && trip.el, moving);
      grow(before, moving);
    };

    format = zoned(root.dataset.timezone);
    update(false);
    // Transitions (a trip that fades once gone) only after the first paint
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => root.classList.add('is-live'));
    });

    // Every minute on the minute, and at once when the tab comes back or the timetable changes
    let timer = 0;
    const tick = () => {
      update(true);
      timer = setTimeout(tick, 60000 - (Date.now() % 60000) + 50);
    };
    timer = setTimeout(tick, 60000 - (Date.now() % 60000) + 50);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) update(true);
    }, { signal });
    const watch = new MutationObserver(() => {
      format = zoned(root.dataset.timezone);
      update(true);
    });
    watch.observe(root, { attributes: true, attributeFilter: ['data-timezone', 'data-now'] });
    // The mark follows its trip when the board changes size (a line that wraps, a late font); a
    // timetable that comes or goes is left to show()
    const sizes = new WeakMap();
    const resize = new ResizeObserver((entries) => {
      const changed = entries.filter((e) => {
        const { width, height } = e.contentRect;
        const was = sizes.get(e.target);
        sizes.set(e.target, { width, height });
        return was?.width && width && (was.width !== width || was.height !== height);
      });
      if (changed.length && marked) place(marked, false);
    });
    timetables.forEach((t) => resize.observe(t.list));
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      sizing?.cancel();
      parting?.remove();
      watch.disconnect();
      resize.disconnect();
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
