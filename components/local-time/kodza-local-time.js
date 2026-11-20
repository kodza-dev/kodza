// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Local Time
// The time at a place, kept to the minute: the digits that change roll on the minute, right to
// left like a counter, the gap to the visitor ("+6 h from you") is worked out in their browser,
// and with data-hours a last line says when you answer. Without the script, the place alone.
// Settings, on the root: data-timezone (an IANA zone, "Europe/Paris"; the visitor's without it),
// data-hours ("mon-fri 09:00-18:00; sat 10:00-13:00", a range may run past midnight), data-locale
// (the day names; the page's lang without it) and data-now ("2026-11-19T14:59:50", the place's
// clock starts there and runs on: demos and tests). Each word below can be set with
// data-text-<name>, {gap} and {day} are filled in. The timings are the constants under WORDS.
(() => {
  const SELECTOR = '.kodza-local-time';
  const WORDS = {
    gap: '{gap} from you',
    same: 'Same time as you',
    open: 'Replying now',
    closed: "We'll reply {day}",
    today: 'today',
    tomorrow: 'tomorrow',
  };
  const ROLL = 520; // ms: a digit, or a line, rolls
  const CARRY = 70; // ms: each changed digit starts this much after the one on its right
  const ARRIVE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const fill = (text, values) => text.replace(/\{(\w+)\}/g, (all, key) => (key in values ? values[key] : all));
  const clock = (text) => {
    const [h, m] = text.split(':').map(Number);
    return h * 60 + m;
  };

  // "mon closed; tue-fri 10:00-14:00, 16:00-19:00" → the ranges of each weekday, in minutes (a
  // range past midnight ends on the next day)
  const hoursOf = (text) => {
    const week = DAYS.map(() => []);
    (text || '').toLowerCase().split(';').forEach((part) => {
      const match = part.trim().match(/^([a-z]{3})(?:\s*-\s*([a-z]{3}))?\b(.*)$/);
      if (!match) return;
      const a = DAYS.indexOf(match[1]);
      const b = match[2] ? DAYS.indexOf(match[2]) : a;
      if (a < 0 || b < 0) return;
      const ranges = [...match[3].matchAll(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/g)].map(([, from, to]) => {
        const start = clock(from);
        const end = clock(to);
        return [start, end > start ? end : end + 1440];
      });
      for (let i = a; ; i = (i + 1) % 7) {
        week[i] = ranges;
        if (i === b) break;
      }
    });
    return week;
  };

  // The wall clock of a zone at a moment, and its offset from UTC in minutes. A zone the browser
  // does not know falls back on the visitor's
  const formats = new Map();
  const formatOf = (zone) => {
    if (!formats.has(zone)) {
      const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
      let format;
      try {
        format = new Intl.DateTimeFormat('en-CA', { ...options, timeZone: zone || undefined });
      } catch {
        format = new Intl.DateTimeFormat('en-CA', options);
      }
      formats.set(zone, format);
    }
    return formats.get(zone);
  };
  const wallAt = (time, zone) => {
    const p = {};
    formatOf(zone).formatToParts(time).forEach(({ type, value }) => { p[type] = Number(value); });
    const minute = Math.floor(time / 6e4) * 6e4;
    const offset = Math.round((Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute) - minute) / 6e4);
    const weekday = (new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay() + 6) % 7;
    return { ...p, hour: p.hour % 24, weekday, min: (p.hour % 24) * 60 + p.minute, offset };
  };
  // "2026-11-19T14:59:50" read on the place's clock → the moment it is
  const momentOf = (text, zone) => {
    const m = (text || '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (!m) return null;
    const guess = Date.UTC(m[1], m[2] - 1, m[3], m[4], m[5], m[6] || 0);
    let time = guess - wallAt(guess, zone).offset * 6e4;
    time = guess - wallAt(time, zone).offset * 6e4; // once more, across a change of summer time
    return time;
  };
  const two = (n) => String(n).padStart(2, '0');
  const offsetText = (min) => `${min < 0 ? '-' : '+'}${two(Math.floor(Math.abs(min) / 60))}:${two(Math.abs(min) % 60)}`;
  const gapText = (min) => {
    const h = Math.floor(Math.abs(min) / 60);
    const m = Math.abs(min) % 60;
    return `${min < 0 ? '−' : '+'}${h} h${m ? ` ${two(m)}` : ''}`;
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const data = root.dataset;
    const word = (key) => data[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const make = (tag, name, text) => {
      const el = document.createElement(tag);
      if (name) el.className = `kodza-local-time__${name}`;
      if (text != null) el.textContent = text;
      return el;
    };
    const time = root.querySelector('.kodza-local-time__time');
    const gap = root.querySelector('.kodza-local-time__gap');
    const status = root.querySelector('.kodza-local-time__status');
    const moving = () => !reduceMotion && paceOf(root) > 0;

    // The time: read whole by a screen reader, drawn as one window per character
    let said;
    let cells = [];
    if (time) {
      said = make('span', 'said');
      const digits = make('span', 'digits');
      digits.setAttribute('aria-hidden', 'true');
      time.replaceChildren(said, digits);
      cells = [...'00:00'].map((char) => {
        const cell = make('span', char === ':' ? 'colon' : 'cell');
        if (char === ':') cell.textContent = ':';
        else cell.append(make('span', '', ''));
        digits.append(cell);
        return cell;
      });
    }

    // The digits that change roll, the rightmost first, the others carried a beat later
    const writeTime = (text, animate) => {
      const pace = paceOf(root);
      let rank = 0;
      for (let i = cells.length - 1; i >= 0; i -= 1) {
        const cell = cells[i];
        if (!cell.classList.contains('kodza-local-time__cell')) continue;
        const prev = cell.lastElementChild;
        const char = text[i];
        if (prev.textContent === char) continue;
        const next = make('span', '', char);
        cell.append(next);
        if (!animate || !prev.textContent) {
          prev.remove();
          continue;
        }
        const timing = { duration: ROLL * pace, delay: CARRY * pace * rank, easing: ARRIVE };
        rank += 1;
        prev.animate([{ transform: 'none' }, { transform: 'translateY(-110%)' }], { ...timing, fill: 'forwards' })
          .finished.then(() => prev.remove(), () => {});
        next.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], { ...timing, fill: 'backwards' });
      }
    };

    // A line rolls the same way, and its box eases to the new width instead of jumping
    const lineOf = (box) => {
      let line = box.querySelector('.kodza-local-time__line');
      if (!line) {
        line = make('span', 'line');
        line.append(make('span', '', ''));
        box.append(line);
      }
      return line;
    };
    const writeLine = (box, text, animate) => {
      const line = lineOf(box);
      const prev = line.lastElementChild;
      if (prev.textContent === text) return;
      const from = line.offsetWidth;
      const next = make('span', '', text);
      line.append(next);
      if (!animate || !prev.textContent) {
        prev.remove();
        return;
      }
      const pace = paceOf(root);
      const timing = { duration: ROLL * pace, easing: ARRIVE };
      prev.setAttribute('aria-hidden', 'true');
      line.animate([{ width: `${from}px` }, { width: `${next.offsetWidth}px` }], timing);
      prev.animate([{ transform: 'none' }, { transform: 'translateY(-110%)' }], { ...timing, fill: 'forwards' })
        .finished.then(() => prev.remove(), () => {});
      next.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], { ...timing, fill: 'backwards' });
    };

    let zone;
    let hours;
    let shift = 0;
    let dayName;
    const read = () => {
      zone = data.timezone || '';
      hours = data.hours ? hoursOf(data.hours) : null;
      const set = momentOf(data.now, zone);
      shift = set == null ? 0 : set - Date.now();
      const lang = data.locale || root.closest('[lang]')?.lang || undefined;
      try {
        dayName = new Intl.DateTimeFormat(lang, { weekday: 'long', timeZone: 'UTC' });
      } catch {
        dayName = new Intl.DateTimeFormat('en', { weekday: 'long', timeZone: 'UTC' });
      }
    };
    const now = () => Date.now() + shift;

    // Open now, or the day of the next opening: today, tomorrow or its name
    const replyOf = (wall) => {
      const open = hours[wall.weekday].find(([start, end]) => start <= wall.min && wall.min < end)
        || hours[(wall.weekday + 6) % 7].find(([, end]) => wall.min < end - 1440);
      if (open) return { open: true, text: word('open') };
      for (let ahead = 0; ahead < 7; ahead += 1) {
        const i = (wall.weekday + ahead) % 7;
        if (!hours[i].some(([start]) => ahead > 0 || start > wall.min)) continue;
        const day = ahead === 0 ? word('today') : ahead === 1 ? word('tomorrow') : dayName.format(Date.UTC(2024, 0, 1 + i)); // 1 Jan 2024 is a Monday
        return { open: false, text: fill(word('closed'), { day }) };
      }
      return null;
    };

    const update = (animate) => {
      const at = now();
      const wall = wallAt(at, zone);
      const hhmm = `${two(wall.hour)}:${two(wall.minute)}`;
      if (time) {
        time.dateTime = `${wall.year}-${two(wall.month)}-${two(wall.day)}T${hhmm}${offsetText(wall.offset)}`;
        said.textContent = hhmm;
        writeTime(hhmm, animate);
      }
      if (gap) {
        const mine = wallAt(at).offset;
        const diff = wall.offset - mine;
        writeLine(gap, diff ? fill(word('gap'), { gap: gapText(diff) }) : word('same'), animate);
      }
      if (status) {
        const reply = hours && replyOf(wall);
        status.hidden = !reply;
        if (reply) {
          if (!status.querySelector('.kodza-local-time__mark')) status.prepend(make('span', 'mark'));
          root.classList.toggle('is-open', reply.open);
          writeLine(status, reply.text, animate);
        }
      }
    };

    read();
    update(false);
    root.classList.add('is-live');

    // On the minute, the place's minute (data-now may set seconds), and again on coming back to
    // the tab: a timer asleep in the background is late
    let timer = 0;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        update(moving());
        schedule();
      }, 60000 - (now() % 60000) + 30);
    };
    schedule();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) return;
      update(moving());
      schedule();
    }, { signal });
    const watch = new MutationObserver(() => {
      read();
      update(moving());
      schedule();
    });
    watch.observe(root, { attributes: true, attributeFilter: ['data-timezone', 'data-hours', 'data-now', 'data-locale'] });
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      watch.disconnect();
      root.classList.remove('is-live', 'is-open');
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
