// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Book a Visit
// A booking form that needs no call. The days to come sit in a row (closed ones greyed out), an
// ink pill slides to the one you pick, and its free times appear below. The times come from the
// opening hours and the length of a visit; those already past, too soon or taken are struck out.
// On send, the form rolls up and the answer takes its place: the day, the time and the place,
// with Add to calendar (an .ics file made on the spot) and Book another.
// The form is a real one: it goes to its `action` (date=YYYY-MM-DD, time=HH:MM, name, email),
// the usual way, or with fetch under data-send="fetch". Without the script, a date and a time field
// stand in for the days and the times.
// Settings, on the form: data-hours ("mon closed; tue-fri 10:00-14:00, 16:00-19:00; sat 10:00-14:00"),
// data-length (minutes per visit), data-timezone (the place's, such as "Europe/Madrid": the times
// are the place's, wherever the visitor is), data-days (how many days are offered), data-notice
// (minutes: a time closer than that is too soon), data-taken ("thu 10:40, 2026-11-12 16:00": the
// times already booked, by weekday or by date), data-place and data-address (in the answer and
// the calendar event), data-failed (the message when a fetch send fails), data-locale (days and
// months, "en-GB" by default), data-now ("2026-11-05T09:30", to freeze the clock in a demo).
// The title's data-done is its line once booked, {name} the visitor's first name. The words of
// the script, and the timings, are the constants below.
// The page hears kodza:submit (cancelable, event.detail.data the FormData) before the send.
(() => {
  const SELECTOR = '.kodza-book-visit';
  const WORDS = {
    count: '{free} of {total} free', // beside "Time"
    closed: '{day}, closed',
    full: '{day}, nothing free',
    taken: '{time}, taken',
    soon: '{time}, too soon',
    none: 'No free visits in the coming days.',
    pickDay: 'Pick a day.',
    pickTime: 'Pick a time.',
    name: 'Your name, so we know who to expect.',
    email: 'That email does not look right.',
    failed: 'That did not go through. Try again.',
    event: 'Visit · {place}', // the calendar event's title
    details: 'Booked by {name}, {email}.',
  };
  const LENGTH = 40; // minutes per visit, without data-length
  const AHEAD = 7; // days offered, without data-days
  const NOTICE = 60; // minutes: a time closer than that is too soon, without data-notice
  const LOCALE = 'en-GB'; // the names of days and months, without data-locale
  const STAGE = 900; // ms: the form rolls up and the answer comes in
  const LAG_IN = 60; // ms: the answer starts this much after the form
  const SLIDE = 450; // ms: the times of one day make way for another's
  const SHIFT = 24; // px: how far they slide, towards the day picked
  const WORD = 500; // ms: a word rolls (the month, the count of free times)
  const ROLL = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const ARRIVE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  // The pill under the days, Segmented Control's: its front edge leads, the back one catches up
  const LEAD = 0.7; // the front edge arrives in this share of the slide
  const LAG = 0.14; // the back edge waits this share of the slide before it follows
  const SAMPLES = 30; // keyframes per slide: each edge follows its own curve
  const ease = (t) => 1 - (1 - t) ** 4; // close to cubic-bezier(0.22, 1, 0.36, 1)

  const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const DAY = 864e5;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const seconds = (value) => {
    const n = parseFloat(value);
    if (!(n >= 0)) return 0.55;
    return /ms\s*$/.test(value) ? n / 1000 : n;
  };
  const fill = (text, values) => text.replace(/\{(\w+)\}/g, (all, key) => (key in values ? values[key] : all));
  const clock = (text) => {
    const [h, m] = text.split(':').map(Number);
    return h * 60 + m;
  };
  const hhmm = (min) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

  // "mon closed; tue-fri 10:00-14:00, 16:00-19:00" → the opening ranges of each weekday, in
  // minutes (a range past midnight ends on the next day)
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
  // A visit starts at the opening, then every `length` minutes, and ends before the closing
  const startsOf = (ranges, length) => {
    const starts = [];
    ranges.forEach(([open, close]) => {
      for (let t = open; t + length <= close && t < 1440; t += length) starts.push(t);
    });
    return starts;
  };
  // The date and the minute of the day at a moment, in a time zone (the visitor's without one)
  const partsAt = (date, zone) => {
    const parts = {};
    new Intl.DateTimeFormat('en-CA', {
      timeZone: zone || undefined, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(date).forEach(({ type, value }) => { parts[type] = value; });
    return { day: `${parts.year}-${parts.month}-${parts.day}`, min: (Number(parts.hour) % 24) * 60 + Number(parts.minute) };
  };
  const keyOf = (date) => date.toISOString().slice(0, 10);
  // .ics text: commas, semicolons and line breaks escaped, long lines folded
  const icsText = (text) => String(text).replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, '\\n');
  const fold = (line) => {
    const parts = [];
    for (let i = 0; i < line.length; i += 73) parts.push((i ? ' ' : '') + line.slice(i, i + 73));
    return parts.join('\r\n');
  };
  const stamp = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const q = (name) => root.querySelector(`.kodza-book-visit__${name}`);
    const title = q('title');
    const stage = q('stage');
    const panel = q('form');
    const done = q('done');
    const native = q('fields--when');
    const note = q('note');
    const error = q('error');
    const button = q('send');
    const calendar = q('calendar');
    const nameInput = root.elements.name;
    const emailInput = root.elements.email;
    if (!stage || !panel || !done || !native || !button || !nameInput || !emailInput) return;
    const duration = seconds(getComputedStyle(root).getPropertyValue('--kz-book-visit-duration')) * pace * 1000;

    const data = root.dataset;
    const week = hoursOf(data.hours);
    const length = Math.max(5, parseInt(data.length, 10) || LENGTH);
    const ahead = Math.min(14, Math.max(1, parseInt(data.days, 10) || AHEAD));
    const notice = Number.isFinite(parseFloat(data.notice)) ? parseFloat(data.notice) : NOTICE;
    const zone = data.timezone || '';
    const locale = data.locale || LOCALE;
    const taken = new Set();
    (data.taken || '').toLowerCase().split(',').forEach((item) => {
      const match = item.trim().match(/^([a-z]{3}|\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})$/);
      if (match) taken.add(`${match[1]} ${hhmm(clock(match[2]))}`);
    });
    const nowAt = () => {
      const fixed = (data.now || '').match(/^(\d{4}-\d{2}-\d{2})T(\d{1,2}:\d{2})/);
      if (fixed) return { day: fixed[1], min: clock(fixed[2]) };
      try {
        return partsAt(new Date(), zone);
      } catch {
        return partsAt(new Date());
      }
    };
    const format = (options) => new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...options });
    const weekdayOf = format({ weekday: 'short' });
    const dateOf = format({ day: 'numeric' });
    const monthOf = format({ month: 'long' });
    const longOf = format({ weekday: 'long', day: 'numeric', month: 'long' });

    // The days to come, from the place's today, and the times of each
    const today = Date.parse(`${nowAt().day}T00:00:00Z`);
    const days = Array.from({ length: ahead }, (_, i) => {
      const date = new Date(today + i * DAY);
      const weekday = (date.getUTCDay() + 6) % 7;
      return { date, key: keyOf(date), weekday, starts: startsOf(week[weekday], length) };
    });

    const make = (tag, name, text) => {
      const el = document.createElement(tag);
      if (name) el.className = name.split(' ').map((part) => `kodza-book-visit__${part}`).join(' ');
      if (text != null) el.textContent = text;
      return el;
    };
    const legend = (caption, value) => {
      const el = make('legend', 'legend');
      const roll = make('span', 'roll');
      roll.append(make('span', 'word', value));
      el.append(make('span', 'caption', caption), roll);
      return { el, roll };
    };

    // The days: real radios in a row, under Segmented Control's ink pill
    const dayGroup = make('fieldset', 'group group--day');
    const dayLegend = legend(native.querySelector('[name="date"] ~ .kodza-book-visit__label')?.textContent.trim() || 'Day', monthOf.format(days[0].date));
    const track = make('div', 'days');
    track.style.setProperty('--kz-book-visit-count', String(ahead));
    const options = days.map((day) => {
      const option = make('label', 'day');
      const input = make('input', 'radio');
      input.type = 'radio';
      input.name = 'date';
      input.value = day.key;
      option.append(input, make('span', 'weekday', weekdayOf.format(day.date)), make('span', 'date', dateOf.format(day.date)));
      track.append(option);
      return option;
    });
    const dayInputs = options.map((option) => option.querySelector('input'));
    dayGroup.append(dayLegend.el, track);

    // The pill over the days: the lane, the window cut at its left edge (pill), the window cut at
    // its right edge (edge), and the ink with the white copy of the days (mirror)
    const lane = make('span', 'lane');
    lane.setAttribute('aria-hidden', 'true');
    const pill = make('span', 'pill');
    const edge = make('span', 'edge');
    const mirror = make('span', 'mirror');
    const ghosts = options.map((option) => {
      const ghost = make('span', 'ghost');
      ghost.append(...[...option.querySelectorAll('span')].map((span) => span.cloneNode(true)));
      return ghost;
    });
    mirror.append(...ghosts);
    edge.append(mirror);
    pill.append(edge);
    lane.append(pill);
    track.append(lane);

    // The times: one grid per day, stacked in one place, a mark under the time picked
    const timeGroup = make('fieldset', 'group group--time');
    const timeLegend = legend(native.querySelector('[name="time"] ~ .kodza-book-visit__label')?.textContent.trim() || 'Time', '');
    const times = make('div', 'times');
    const rows = Math.ceil(Math.max(1, ...days.map((day) => day.starts.length)) / 4);
    times.style.setProperty('--kz-book-visit-rows', String(rows));
    const grids = days.map((day) => {
      const grid = make('div', 'slots');
      grid.hidden = true;
      const mark = make('span', 'mark is-hidden');
      mark.setAttribute('aria-hidden', 'true');
      grid.append(mark);
      day.slots = day.starts.map((t) => {
        const slot = make('label', 'slot');
        const input = make('input', 'radio');
        input.type = 'radio';
        input.name = 'time';
        input.value = hhmm(t);
        slot.append(input, make('span', 'time', hhmm(t)));
        grid.append(slot);
        return { t, slot, input, state: 'free' };
      });
      times.append(grid);
      return grid;
    });
    const empty = make('p', 'empty', WORDS.none);
    empty.hidden = true;
    times.append(empty);
    timeGroup.append(timeLegend.el, times);

    // The date and time fields stand down: the radios carry the values now
    native.hidden = true;
    native.querySelectorAll('input').forEach((input) => { input.disabled = true; });
    panel.prepend(dayGroup, timeGroup);

    // The state of every time: past and too soon, taken, or free; a day with nothing free goes grey
    const refresh = () => {
      const now = nowAt();
      const base = Date.parse(`${now.day}T00:00:00Z`);
      days.forEach((day, i) => {
        const index = Math.round((day.date.getTime() - base) / DAY);
        day.slots.forEach((item) => {
          const time = hhmm(item.t);
          item.state = index * 1440 + item.t < now.min + notice ? 'soon'
            : taken.has(`${day.key} ${time}`) || taken.has(`${DAYS[day.weekday]} ${time}`) ? 'taken' : 'free';
          item.slot.classList.toggle('is-off', item.state !== 'free');
          if (item.state === 'free') item.input.removeAttribute('aria-label');
          else item.input.setAttribute('aria-label', fill(WORDS[item.state], { time }));
        });
        day.free = day.slots.filter((item) => item.state === 'free').length;
        const off = !day.free;
        const long = longOf.format(day.date);
        dayInputs[i].disabled = off;
        dayInputs[i].setAttribute('aria-label', off ? fill(day.starts.length ? WORDS.full : WORDS.closed, { day: long }) : long);
        options[i].classList.toggle('is-off', off);
        ghosts[i].classList.toggle('is-off', off);
      });
    };

    // Only the times of the day shown can be picked (arrow keys stay in it)
    let shown = -1;
    const enable = (index) => days.forEach((day, i) => day.slots.forEach((item) => {
      item.input.disabled = i !== index || item.state !== 'free';
    }));

    // A word that changes rolls: the old one goes up, the new one comes from below, the width follows
    const roll = (box, text) => {
      const old = box.lastElementChild;
      if (old?.textContent === text) return;
      box.getAnimations({ subtree: true }).forEach((animation) => animation.finish());
      [...box.children].slice(0, -1).forEach((el) => el.remove());
      const word = make('span', 'word', text);
      if (still || !old || !box.offsetParent) {
        box.replaceChildren(word);
        return;
      }
      const from = box.offsetWidth;
      box.append(word);
      old.setAttribute('aria-hidden', 'true');
      old.classList.add('is-leaving');
      const to = word.offsetWidth;
      const timing = { duration: WORD * pace, easing: ARRIVE };
      box.animate([{ width: `${from}px` }, { width: `${to}px` }], timing);
      old.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-110%)' }], { ...timing, fill: 'forwards' });
      word.animate([{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }], timing).onfinish = () => old.remove();
    };

    // The mark under the time picked glides to it; from nothing, it grows in place
    const placeMark = (grid, instant) => {
      const mark = grid.firstElementChild;
      const checked = grid.querySelector('.kodza-book-visit__radio:checked');
      if (!checked) {
        mark.classList.add('is-hidden');
        return;
      }
      const slot = checked.closest('.kodza-book-visit__slot');
      const hidden = mark.classList.contains('is-hidden');
      if (instant || hidden) mark.classList.add('is-instant');
      mark.style.setProperty('--kz-book-visit-mark-x', `${slot.offsetLeft}px`);
      mark.style.setProperty('--kz-book-visit-mark-y', `${slot.offsetTop}px`);
      mark.style.setProperty('--kz-book-visit-mark-w', `${slot.offsetWidth}px`);
      mark.style.setProperty('--kz-book-visit-mark-h', `${slot.offsetHeight}px`);
      if (instant || hidden) {
        void mark.offsetWidth;
        mark.classList.remove('is-instant');
      }
      mark.classList.remove('is-hidden');
    };

    // Another day: its times slide in from the side of that day, the others slide out
    const showDay = (next, instant) => {
      const before = shown;
      shown = next;
      enable(next);
      empty.hidden = next >= 0;
      const chosen = root.querySelector('.kodza-book-visit__slots .kodza-book-visit__radio:checked');
      if (chosen && next >= 0) {
        const twin = days[next].slots.find((item) => item.input.value === chosen.value && item.state === 'free');
        if (twin) twin.input.checked = true;
        else chosen.checked = false;
      } else if (chosen) chosen.checked = false;
      if (next >= 0) {
        roll(dayLegend.roll, monthOf.format(days[next].date));
        roll(timeLegend.roll, fill(WORDS.count, { free: days[next].free, total: days[next].slots.length }));
      } else {
        roll(timeLegend.roll, '');
      }
      const dir = before >= 0 && next >= 0 && next < before ? -1 : 1;
      grids.forEach((grid, i) => {
        if (i === next) {
          grid.getAnimations().forEach((animation) => animation.cancel());
          grid.hidden = false;
          grid.inert = false;
          placeMark(grid, true);
          if (!instant && !still && before !== next && before >= 0) {
            grid.animate([
              { transform: `translateX(${SHIFT * dir}px)`, opacity: 0 },
              { transform: 'none', opacity: 1 },
            ], { duration: SLIDE * pace, delay: SLIDE * pace * 0.25, easing: ARRIVE, fill: 'backwards' });
          }
          return;
        }
        if (i === before && !instant && !still && !grid.hidden) {
          grid.inert = true;
          // Gone before the new times show, so the two grids never read on top of each other
          grid.animate([{ opacity: 1 }, { opacity: 0 }], { duration: SLIDE * pace * 0.3, easing: 'linear', fill: 'forwards' });
          grid.animate([
            { transform: 'none' },
            { transform: `translateX(${-SHIFT * dir}px)` },
          ], { duration: SLIDE * pace * 0.5, easing: 'cubic-bezier(0.55, 0, 1, 0.45)', fill: 'forwards' }).onfinish = () => {
            if (shown === i) return;
            grid.hidden = true;
            grid.getAnimations().forEach((animation) => animation.cancel());
          };
          return;
        }
        grid.getAnimations().forEach((animation) => animation.cancel());
        grid.hidden = true;
      });
    };

    // Each day's place in the lane, in its own pixels (a parent scaled by a transform, like a
    // thumbnail, changes nothing)
    let boxes = [];
    const measure = () => {
      const box = lane.getBoundingClientRect();
      const scale = box.width / lane.offsetWidth || 1;
      const full = lane.offsetWidth;
      boxes = options.map((option) => {
        const rect = option.getBoundingClientRect();
        const left = (rect.left - box.left) / scale;
        const width = rect.width / scale;
        return { left, width, right: full - left - width };
      });
      ghosts.forEach((ghost, i) => {
        ghost.style.left = `${boxes[i].left}px`;
        ghost.style.width = `${boxes[i].width}px`;
      });
    };
    // The three moving layers for given edges: the windows put their cuts there, the ink cancels
    // their shift and stays put
    const shifts = ({ left, right }) => [left, -left - right, right];
    const rest = (edges) => {
      track.style.setProperty('--kz-book-visit-l', `${edges.left}px`);
      track.style.setProperty('--kz-book-visit-r', `${edges.right}px`);
    };
    // The edges at a point of a slide: the front edge (the side it goes to) leads, the back
    // edge follows, so the pill stretches on the way and shrinks back as it lands
    let move = null;
    const edgesAt = ({ from, to, forward, grow }, t) => {
      const front = ease(grow ? t : Math.min(1, t / LEAD));
      const back = grow ? front : ease(Math.max(0, (t - LAG) / (1 - LAG)));
      return {
        left: from.left + (to.left - from.left) * (forward ? back : front),
        right: from.right + (to.right - from.right) * (forward ? front : back),
      };
    };
    const now = () => {
      const t = move?.animations[0].currentTime;
      return move && t != null && move.animations[0].playState === 'running' ? edgesAt(move, Math.min(1, t / duration)) : null;
    };
    const stop = () => {
      move?.animations.forEach((animation) => animation.cancel());
      move = null;
    };
    // From nothing chosen, the pill opens from the middle of the day
    const slide = (from, to) => {
      stop();
      rest(to);
      if (still || !duration) return;
      const grow = !from;
      if (grow) from = { left: to.left + to.width / 2, right: to.right + to.width / 2 };
      const plan = { from, to, grow, forward: to.left > from.left };
      const frames = [[], [], []];
      for (let i = 0; i <= SAMPLES; i += 1) {
        shifts(edgesAt(plan, i / SAMPLES)).forEach((x, n) => frames[n].push({ transform: `translateX(${x}px)` }));
      }
      const timing = { duration, easing: 'linear' };
      move = { ...plan, animations: [pill, edge, mirror].map((el, n) => el.animate(frames[n], timing)) };
      move.animations[0].onfinish = () => { move = null; };
    };
    const clear = () => {
      stop();
      track.style.removeProperty('--kz-book-visit-l');
      track.style.removeProperty('--kz-book-visit-r');
    };
    let current = -1;
    const update = (instant) => {
      const next = dayInputs.findIndex((input) => input.checked);
      if (next === current && !instant) return;
      const from = instant ? null : now() || boxes[current] || null;
      current = next;
      if (next < 0) clear();
      else if (instant) {
        stop();
        rest(boxes[next]);
      } else slide(from, boxes[next]);
      showDay(next, instant);
    };
    const place = () => {
      const before = boxes;
      measure();
      const same = move && boxes.every((box, i) => Math.abs(box.left - before[i].left) < 0.5 && Math.abs(box.width - before[i].width) < 0.5);
      if (!same) {
        stop();
        if (current >= 0) rest(boxes[current]);
        else clear();
      }
      if (shown >= 0) placeMark(grids[shown], true);
    };

    // The first day with something free is picked at the start, and after a reset
    const pickFirst = () => {
      const first = days.findIndex((day) => day.free);
      dayInputs.forEach((input, i) => { input.defaultChecked = i === first; });
      if (first >= 0) dayInputs[first].checked = true;
    };

    // What is missing, said under the button (the help line gives way to it), the field focused
    let errorField = null;
    const clean = () => {
      errorField?.removeAttribute('aria-invalid');
      errorField = null;
      root.classList.remove('is-error');
    };
    const fail = (field, message, focus = field) => {
      clean();
      error.textContent = message;
      root.classList.add('is-error');
      errorField = field;
      if (field.matches('input:not([type="radio"])')) field.setAttribute('aria-invalid', 'true');
      focus?.focus();
    };
    const invalid = () => {
      const day = dayInputs.find((input) => input.checked);
      if (!day) return fail(dayInputs[0], WORDS.pickDay, dayInputs.find((input) => !input.disabled)) || true;
      const free = days[shown]?.slots.find((item) => item.state === 'free');
      if (!root.querySelector('.kodza-book-visit__slots .kodza-book-visit__radio:checked')) return fail(free?.input || dayInputs[0], WORDS.pickTime, free?.input) || true;
      if (!nameInput.value.trim()) return fail(nameInput, WORDS.name) || true;
      if (!emailInput.value.trim() || !emailInput.validity.valid) return fail(emailInput, WORDS.email) || true;
      return false;
    };
    root.noValidate = true;
    const settle = () => {
      if (!errorField) return;
      const fixed = errorField.type === 'radio' ? root.querySelector(`[name="${errorField.name}"]:checked`) : errorField === nameInput ? nameInput.value.trim() : emailInput.value.trim() && emailInput.validity.valid;
      if (fixed) clean();
    };
    root.addEventListener('input', settle, { signal });

    // Two blocks in one place: the one leaving rolls up (down on the way back), the other follows,
    // and the box between them changes height with them
    const swap = (box, out, into, back) => {
      box.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
      out.hidden = false;
      into.hidden = false;
      if (still) {
        out.hidden = true;
        return;
      }
      const hOut = out.offsetHeight;
      const hIn = into.offsetHeight;
      box.classList.add('is-rolling');
      const timing = { duration: STAGE * pace, easing: ROLL };
      const travel = back ? [hIn, -hIn] : [-hOut, hOut];
      // The height holds until the new content has landed, its lag included
      const grow = box.animate(
        [{ height: `${Math.max(hOut, 1)}px` }, { height: `${Math.max(hIn, 1)}px` }],
        { ...timing, fill: 'forwards' },
      );
      // The tail of the block leaving fades, so no edge of it lingers over the one coming in
      out.animate([
        { transform: 'translateY(0)', opacity: 1 },
        { opacity: 1, offset: 0.6 },
        { transform: `translateY(${travel[0]}px)`, opacity: 0 },
      ], { ...timing, fill: 'forwards' });
      into.animate([{ transform: `translateY(${travel[1]}px)` }, { transform: 'translateY(0)' }], {
        ...timing, delay: LAG_IN * pace, fill: 'backwards',
      }).onfinish = () => {
        out.hidden = true;
        box.classList.remove('is-rolling');
        out.getAnimations().forEach((animation) => animation.cancel());
        grow.cancel();
      };
    };

    // The title gets its thanks line next to the first one, for the swap
    const lines = make('span', 'lines');
    const first = make('span', 'line');
    if (title) first.append(...title.childNodes);
    const thanks = make('span', 'line');
    thanks.hidden = true;
    lines.append(first, thanks);
    if (title) title.append(lines);

    // The answer, and its calendar file
    let booked = false;
    let file = '';
    const revoke = () => {
      if (file) URL.revokeObjectURL(file);
      file = '';
    };
    const utc = (key, min) => {
      // The place's wall clock to a moment: guess as UTC, then correct by the zone's offset, twice
      // (a day that changes the clock)
      const wall = Date.parse(`${key}T00:00:00Z`) + min * 6e4;
      let at = wall;
      for (let i = 0; i < 2; i += 1) {
        try {
          const parts = partsAt(new Date(at), zone);
          at += wall - (Date.parse(`${parts.day}T00:00:00Z`) + parts.min * 6e4);
        } catch {
          break;
        }
      }
      return new Date(at);
    };
    const ics = (values) => {
      const start = utc(values.date, clock(values.time));
      const end = new Date(start.getTime() + length * 6e4);
      const lines = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kodza//Book a Visit//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}@${location.hostname || 'kodza'}`,
        `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
        `SUMMARY:${icsText(fill(WORDS.event, values))}`,
        data.address || data.place ? `LOCATION:${icsText([data.place, data.address].filter(Boolean).join(', '))}` : '',
        `DESCRIPTION:${icsText(fill(WORDS.details, values))}`,
        'END:VEVENT', 'END:VCALENDAR',
      ].filter(Boolean).map(fold);
      return new Blob([`${lines.join('\r\n')}\r\n`], { type: 'text/calendar;charset=utf-8' });
    };
    const finish = (form) => {
      booked = true;
      const values = {
        date: form.get('date'), time: form.get('time'), name: String(form.get('name') || '').trim(), email: String(form.get('email') || '').trim(), place: data.place || '',
      };
      taken.add(`${values.date} ${values.time}`);
      const day = days.find((item) => item.key === values.date);
      const when = q('when');
      if (when) when.textContent = [day ? `${weekdayOf.format(day.date)} ${dateOf.format(day.date)}` : values.date, values.time, values.place].filter(Boolean).join(' · ');
      done.querySelectorAll('[data-value]').forEach((el) => {
        if (values[el.dataset.value]) el.textContent = values[el.dataset.value];
      });
      if (calendar) {
        revoke();
        file = URL.createObjectURL(ics(values));
        calendar.href = file;
        calendar.download = `${(values.place || 'visit').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'visit'}-visit.ics`;
      }
      thanks.textContent = fill(title?.dataset.done || '', { name: values.name.split(/\s+/)[0] });
      if (thanks.textContent) swap(lines, first, thanks);
      swap(stage, panel, done);
      if (title) {
        title.tabIndex = -1;
        title.focus({ preventScroll: true });
      }
    };

    // The send: kodza:submit first (the page can take it over), then the form's action, the usual
    // way, or with fetch under data-send="fetch"
    let sending = false;
    const send = async (form) => {
      sending = true;
      button.setAttribute('aria-busy', 'true');
      const method = (root.getAttribute('method') || 'get').toUpperCase();
      const url = method === 'GET' ? `${root.action}${root.action.includes('?') ? '&' : '?'}${new URLSearchParams(form)}` : root.action;
      try {
        const response = await fetch(url, { method, body: method === 'GET' ? undefined : form, headers: { Accept: 'application/json' }, signal });
        if (!response.ok) throw new Error(String(response.status));
        sending = false;
        finish(form);
      } catch {
        if (signal.aborted) return;
        sending = false;
        fail(button, data.failed || WORDS.failed, null);
      }
      button.removeAttribute('aria-busy');
    };
    root.addEventListener('submit', (event) => {
      if (booked || sending || invalid()) {
        event.preventDefault();
        return;
      }
      clean();
      const form = new FormData(root);
      if (!root.dispatchEvent(new CustomEvent('kodza:submit', { detail: { data: form }, bubbles: true, cancelable: true }))) {
        event.preventDefault();
        finish(form);
        return;
      }
      if (data.send !== 'fetch') return; // sent the usual way
      event.preventDefault();
      send(form);
    }, { signal });

    // A day picked: the pill slides, its times come in. A time picked: the mark glides to it
    root.addEventListener('change', (event) => {
      if (dayInputs.includes(event.target)) update();
      else if (event.target.name === 'time') placeMark(event.target.closest('.kodza-book-visit__slots'));
      settle();
    }, { signal });

    // Up and down move a row in the times; Home and End go to the first and last free one
    times.addEventListener('keydown', (event) => {
      if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key) || shown < 0) return;
      const free = days[shown].slots.filter((item) => item.state === 'free').map((item) => item.input);
      const at = free.indexOf(event.target);
      if (at < 0) return;
      event.preventDefault();
      let next = event.key === 'Home' ? free[0] : event.key === 'End' ? free[free.length - 1] : null;
      if (!next) {
        const all = days[shown].slots.map((item) => item.input);
        const columns = getComputedStyle(grids[shown]).gridTemplateColumns.split(' ').length || 4;
        const step = event.key === 'ArrowDown' ? columns : -columns;
        for (let i = all.indexOf(event.target) + step; i >= 0 && i < all.length; i += step) {
          if (!all[i].disabled) {
            next = all[i];
            break;
          }
        }
      }
      if (!next || next === event.target) return;
      next.checked = true;
      next.dispatchEvent(new Event('change', { bubbles: true }));
      next.focus();
    }, { signal });

    // Book another (the form's reset): the day and the times come back, the time just booked taken
    root.addEventListener('reset', () => requestAnimationFrame(() => {
      if (signal.aborted) return;
      const inside = done.contains(document.activeElement) || document.activeElement === title;
      const wasBooked = booked;
      booked = false;
      clean();
      revoke();
      refresh();
      const fallback = dayInputs.findIndex((input) => input.defaultChecked);
      if (fallback < 0 || dayInputs[fallback].disabled) pickFirst();
      else dayInputs[fallback].checked = true;
      update(true);
      if (wasBooked) {
        swap(stage, done, panel, true);
        if (!thanks.hidden) swap(lines, thanks, first, true);
        title?.removeAttribute('tabindex');
      }
      if (inside) dayInputs.find((input) => input.checked)?.focus({ preventScroll: true });
    }), { signal });

    refresh();
    pickFirst();
    measure();
    update(true);
    const observer = new ResizeObserver(place);
    observer.observe(track);
    observer.observe(times);
    // A time that is going by while the page stays open: once a minute, the states are redone
    const timer = setInterval(() => {
      if (booked) return;
      refresh();
      enable(shown);
      const chosen = root.querySelector('.kodza-book-visit__slots .kodza-book-visit__radio:checked');
      if (chosen?.disabled) {
        chosen.checked = false;
        if (shown >= 0) placeMark(grids[shown]);
      }
      if (shown >= 0) roll(timeLegend.roll, fill(WORDS.count, { free: days[shown].free, total: days[shown].slots.length }));
    }, 60000);
    signal.addEventListener('abort', () => {
      observer.disconnect();
      clearInterval(timer);
      stop();
      revoke();
    });
    document.fonts?.ready.then(() => !signal.aborted && place());
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
