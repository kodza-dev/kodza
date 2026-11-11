// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
/* Callback Request — Kodza (kodza.dev)
   A callback form that knows its own hours. The next days are drawn as lines of time, the windows
   we can ring in sit on them, and the time already gone is hatched. Pick one: a pill of ink slides
   to it like a drop. Send: the drop flies up into the reply and becomes its answer,
   "today, 14:00–16:00".

   Settings:
   - the CSS variables --kz-callback-request-* (component.css);
   - on the root:
     data-hours     opening hours, "mon-fri 08:00-12:00, 14:00-18:00; sat 09:00-12:00"
     data-length    minutes in one window (120); the last one of a range can be shorter
     data-notice    minutes a window must still have to be offered today (30)
     data-days      days shown, 1 to 5 (3); a day with nothing free is skipped
     data-timezone  the time zone the hours are read in ("Europe/Paris"), the visitor's by default
     data-place     the city named with the clock ("10:42 in Le Havre")
     data-taken     windows already booked, by their start: "2026-11-11 10:00, thu 14:00"
     data-now       a fixed start, "2026-11-10T10:42" (demos, tests): the clock still moves on
     data-locale    the language of the dates (en-GB)
     data-send="fetch" sends with fetch to the form's action; data-failed: the error if it fails
     data-text-*    every sentence the script writes (WORDS, below): data-text-picked="…"
   - on the phone field: data-dial (+33), data-trunk (0), data-format ("## ## ## ## ##"), data-error;
   - the timings, just below SELECTOR.

   The form sends slot (the window's start in the business's time, "2026-11-10 14:00"), phone (as
   typed), phone_e164 ("+33612345678") and topic. Just before, "kodza:submit" bubbles from the form
   (detail.data, a FormData): cancel it to send it yourself, the reply shows all the same. Without
   the script, a plain field asks when suits, and the form posts. */
(() => {
  const SELECTOR = '.kodza-callback-request';

  // What the script writes, each one replaced by the root's data-text-* if there is one
  const WORDS = {
    today: 'today',
    tomorrow: 'tomorrow',
    onDay: 'on {day}',
    open: 'Lines open',
    closed: 'Lines closed',
    at: '{time} in {place}',
    atPlain: '{time}, our time',
    zone: '{place} time',
    zonePlain: 'Our time',
    live: 'Now–{to}',
    liveShort: 'Now',
    window: '{day}, {from} to {to}',
    windowLive: '{day}, now to {to}',
    booked: '{window}, booked',
    picked: 'We ring {day} between {from} and {to}.',
    pickedLive: 'We ring {day}, before {to}.',
    gone: 'That window just closed. Pick another one.',
    markLive: 'before {to}',
    soon: 'Any minute now',
    in: 'In {h} h {m} min',
    inMin: 'In {m} min',
    none: 'No window left this week. Ring us instead.',
    required: 'Pick a window. We ring inside it.',
    phone: 'A full number, so we can ring it.',
    failed: 'That did not go through. Call {phone} instead.',
    failedPlain: 'That did not go through. Try again in a minute.',
  };

  const SLIDE = 520; // ms, the pill of ink going from one window to another
  const LEAD = 0.7; // share of a slide the front edge takes; the back edge follows
  const LAG = 0.14; // how late the back edge starts, as a share of the slide
  const SAMPLES = 30; // keyframes in a slide or a flight
  const FLY = 1100; // ms, the form folding into the reply
  const FLIGHT = 0.7; // share of FLY the drop takes to reach the reply
  const LEAVE_UNTIL = 0.35; // share of FLY the form takes to leave
  const HEAD_AT = 0.28; // when the reply's first word rises
  const WORD_GAP = 0.035; // between two words
  const SWAP_AT = 0.62; // share of the flight when the window's text, carried by the drop, rolls up out of it...
  const MARK_AT = 0.46; // ...while the answer's text rises in the drop (share of FLY)
  const ETA_AT = 0.5; // when the line under the reply arrives
  const END_AT = 0.55; // when the last lines arrive
  const BACK_FROM = 0.5; // Start over: the windows come back over the last 50 % of FLY, as the answer's words finish sinking
  const LINE = 450; // ms, a line that rolls
  const ROOM = 24; // px kept above the reply when the page scrolls back up to it
  const REFRESH = 30000; // ms between two looks at the clock (a wait, not a motion: never scaled)
  const AHEAD = 14; // days looked through for windows
  const LOCALE = 'en-GB';

  const ROLL = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const ARRIVE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const LEAVE = 'cubic-bezier(0.55, 0, 1, 0.45)';
  const ease = (t) => 1 - (1 - t) ** 4;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace: --kz-motion-scale on the page (1 = Kodza, 2 = twice as slow, 0 = no motion)
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const fill = (text, values) => text.replace(/\{(\w+)\}/g, (all, key) => (key in values ? values[key] : all));

  // Time, in minutes from midnight, and days as UTC midnights (a calendar, not a moment)
  const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const DAY = 864e5;
  const clock = (text) => {
    const [h, m] = text.split(':').map(Number);
    return h * 60 + m;
  };
  const hhmm = (min) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
  const hour = (min) => (min % 60 ? hhmm(min) : String(Math.floor(min / 60) % 24).padStart(2, '0'));
  // "mon-fri 08:00-12:00, 14:00-18:00; sat 09:00-12:00" → for each day, its ranges in minutes
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
  // The day and the minute it is now in a time zone
  const partsAt = (date, zone) => {
    const parts = {};
    new Intl.DateTimeFormat('en-CA', { timeZone: zone || undefined, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(date)
      .forEach(({ type, value }) => { parts[type] = value; });
    return { day: `${parts.year}-${parts.month}-${parts.day}`, min: (Number(parts.hour) % 24) * 60 + Number(parts.minute) };
  };
  const keyOf = (date) => date.toISOString().slice(0, 10);

  const C = 'kodza-callback-request';

  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace;
    const q = (name) => root.querySelector(`.${C}__${name}`);
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const make = (tag, name, text) => {
      const el = document.createElement(tag);
      if (name) el.className = `${C}__${name}`;
      if (text != null) el.textContent = text;
      return el;
    };

    const form = q('form');
    const stage = q('stage');
    const panel = q('panel');
    const done = q('done');
    const slots = q('slots');
    const grid = q('grid');
    const fields = q('fields');
    const foot = q('foot');
    const privacy = q('privacy');
    const help = root.querySelector(`.${C}__help .${C}__roll`);
    const error = q('error');
    const button = q('send');
    const reply = q('reply');
    const eta = q('eta');
    const end = q('end');
    const phone = q('phone');
    const e164 = q('e164');
    if (!form || !stage || !panel || !done || !grid || !phone || !reply) return;
    const phoneBox = phone.closest(`.${C}__box`);
    const dialMark = q('dial');
    const meta = q('meta');
    const dot = q('dot');
    const state = q('state');
    const clockLine = q('clock');
    const call = q('call');

    // The settings, read once
    const data = root.dataset;
    const number = (value, fallback) => (Number.isFinite(parseInt(value, 10)) ? parseInt(value, 10) : fallback);
    const week = hoursOf(data.hours || 'mon-fri 09:00-18:00');
    const length = Math.max(15, number(data.length, 120));
    const notice = Math.max(0, number(data.notice, 30));
    const count = Math.min(5, Math.max(1, number(data.days, 3)));
    const zone = data.timezone || undefined;
    const place = data.place || '';
    const locale = data.locale || LOCALE;
    const taken = new Set();
    (data.taken || '').toLowerCase().split(',').forEach((item) => {
      const match = item.trim().match(/^([a-z]{3}|\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})$/);
      if (match) taken.add(`${match[1]} ${hhmm(clock(match[2]))}`);
    });
    const format = (options) => {
      try {
        return new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...options });
      } catch {
        return new Intl.DateTimeFormat(LOCALE, { timeZone: 'UTC', ...options });
      }
    };
    const dayName = format({ weekday: 'long' });
    const dayDate = format({ day: 'numeric', month: 'short' });
    const fullDate = format({ weekday: 'long', day: 'numeric', month: 'long' });

    // Now, in the business's time zone. A fixed data-now moves on with the real clock
    const born = Date.now();
    const nowAt = () => {
      const fixed = (data.now || '').match(/^(\d{4}-\d{2}-\d{2})T(\d{1,2}:\d{2})/);
      if (fixed) {
        const total = clock(fixed[2]) + Math.floor((Date.now() - born) / 60000);
        const day = keyOf(new Date(Date.parse(`${fixed[1]}T00:00:00Z`) + Math.floor(total / 1440) * DAY));
        return { day, min: total % 1440 };
      }
      try {
        return partsAt(new Date(), zone);
      } catch {
        return partsAt(new Date());
      }
    };

    // The days to show and their windows. Today's are kept while they still have `notice` minutes;
    // the one running is "now"
    const planOf = () => {
      const now = nowAt();
      const start = Date.parse(`${now.day}T00:00:00Z`);
      const days = [];
      let lo = Infinity;
      let hi = -Infinity;
      for (let i = 0; i < AHEAD && days.length < count; i += 1) {
        const date = new Date(start + i * DAY);
        const key = keyOf(date);
        const weekday = (date.getUTCDay() + 6) % 7;
        const list = [];
        week[weekday].forEach(([from, to]) => {
          for (let at = from; at < to; at += length) {
            const until = Math.min(to, at + length);
            if (i === 0 && until - now.min < notice) continue;
            const value = `${key} ${hhmm(at)}`;
            list.push({ from: at, to: until, value, live: i === 0 && at <= now.min, booked: taken.has(value) || taken.has(`${DAYS[weekday]} ${hhmm(at)}`) });
          }
        });
        if (!list.some((item) => !item.booked)) continue;
        week[weekday].forEach(([from, to]) => {
          lo = Math.min(lo, from);
          hi = Math.max(hi, to);
        });
        days.push({ key, date, ahead: i, slots: list });
      }
      // The scale: whole hours, a tick every hour up to 6 h, every 2 h up to 12 h, else every 3 h
      const span = Math.ceil(hi / 60) - Math.floor(lo / 60);
      const step = span <= 6 ? 60 : span <= 12 ? 120 : 180;
      if (days.length) {
        lo = Math.floor(lo / step) * step;
        hi = Math.ceil(hi / step) * step;
      }
      const open = week[(new Date(start).getUTCDay() + 6) % 7].some(([from, to]) => now.min >= from && now.min < to);
      const sign = `${lo} ${hi} ${days.map((day) => `${day.key}:${day.slots.map((item) => `${item.value}${item.live ? '*' : ''}${item.booked ? '!' : ''}`).join()}`).join('|')}`;
      return { now, days, lo, hi, step, open, sign };
    };

    // The words a window is said with
    const dayOf = (day) => (day.ahead === 0 ? word('today') : day.ahead === 1 ? word('tomorrow') : fill(word('onDay'), { day: dayName.format(day.date) }));
    const nameOf = (day) => {
      const text = day.ahead === 0 ? word('today') : day.ahead === 1 ? word('tomorrow') : dayName.format(day.date);
      return text[0].toUpperCase() + text.slice(1);
    };

    // The header: the lines open or closed, and the time it is where the phone rings
    const roll = (box, text) => {
      if (!box) return;
      const old = box.lastElementChild;
      if (old?.textContent === text) return;
      box.getAnimations({ subtree: true }).filter((a) => a.effect?.getTiming().iterations !== Infinity).forEach((a) => a.finish());
      [...box.children].slice(0, -1).forEach((el) => el.remove());
      const line = make('span', 'said', text);
      if (still || !old || !box.offsetParent) {
        box.replaceChildren(line);
        return;
      }
      const from = box.offsetHeight;
      box.append(line);
      old.setAttribute('aria-hidden', 'true');
      const to = line.offsetHeight;
      box.classList.add('is-rolling');
      const timing = { duration: LINE * pace, easing: ARRIVE };
      if (from !== to) box.animate([{ height: `${from}px` }, { height: `${to}px` }], timing);
      old.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-110%)' }], { ...timing, fill: 'forwards' });
      line.animate([{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }], timing).onfinish = () => {
        old.remove();
        if (box.lastElementChild === line) box.classList.remove('is-rolling');
      };
    };
    const header = (plan) => {
      if (!meta) return;
      meta.hidden = false;
      dot?.classList.toggle('is-closed', !plan.open);
      roll(state, word(plan.open ? 'open' : 'closed'));
      if (clockLine) clockLine.textContent = place ? fill(word('at'), { time: hhmm(plan.now.min), place }) : fill(word('atPlain'), { time: hhmm(plan.now.min) });
    };

    // The lines of time, drawn from the plan; the plain field written in the HTML gives way to them
    const facts = new WeakMap();
    let plan = null;
    let inked = null;
    const at = (min) => Math.min(1, Math.max(0, (min - plan.lo) / (plan.hi - plan.lo)));
    const draw = () => {
      const made = [];
      if (!plan.days.length) {
        made.push(make('p', 'none', word('none')));
      } else {
        const scale = make('div', 'scale');
        scale.setAttribute('aria-hidden', 'true');
        const ticks = make('span', 'ticks');
        for (let min = plan.lo; min <= plan.hi; min += plan.step) {
          const tick = make('span', 'tick', hhmm(min));
          tick.style.setProperty('--kz-callback-request-at', at(min));
          ticks.append(tick);
        }
        scale.append(make('span', 'zone', place ? fill(word('zone'), { place }) : word('zonePlain')), ticks);
        made.push(scale);
      }
      plan.days.forEach((day) => {
        const row = make('div', 'day');
        const when = make('p', 'when');
        when.append(make('span', 'name', nameOf(day)), make('span', 'date', dayDate.format(day.date)));
        const track = make('div', 'track');
        if (day.ahead === 0) {
          const past = make('span', 'past');
          const line = make('span', 'now');
          [past, line].forEach((el) => el.setAttribute('aria-hidden', 'true'));
          track.append(past, line);
        }
        day.slots.forEach((item) => {
          const slot = make('label', 'slot');
          slot.classList.toggle('is-booked', item.booked);
          slot.classList.toggle('is-live', item.live);
          slot.style.setProperty('--kz-callback-request-to', at(item.to));
          const radio = make('input', 'radio');
          radio.type = 'radio';
          radio.name = 'slot';
          radio.value = item.value;
          radio.disabled = item.booked;
          const said = item.live ? fill(word('windowLive'), { day: nameOf(day), to: hhmm(item.to) }) : fill(word('window'), { day: nameOf(day), from: hhmm(item.from), to: hhmm(item.to) });
          radio.setAttribute('aria-label', item.booked ? fill(word('booked'), { window: said }) : said);
          const time = make('span', 'time');
          time.setAttribute('aria-hidden', 'true');
          time.append(
            make('span', 'long', item.live ? fill(word('live'), { to: hhmm(item.to) }) : `${hhmm(item.from)}–${hhmm(item.to)}`),
            make('span', 'short', item.live ? word('liveShort') : `${hour(item.from)}–${hour(item.to)}`),
          );
          slot.append(radio, time);
          track.append(slot);
          facts.set(radio, { ...item, day });
        });
        row.append(when, track);
        made.push(row);
      });
      grid.replaceChildren(...made);
      tick();
    };
    // What moves with the clock: the hatched past, the line of now, the start of the window running
    const tick = () => {
      const today = plan.days[0]?.ahead === 0 ? grid.querySelector(`.${C}__day`) : null;
      const now = at(plan.now.min);
      today?.querySelector(`.${C}__track`)?.style.setProperty('--kz-callback-request-now', now);
      grid.querySelectorAll(`:scope > .${C}__day .${C}__slot`).forEach((slot) => {
        const item = facts.get(slot.querySelector(`.${C}__radio`));
        if (item) slot.style.setProperty('--kz-callback-request-from', item.live ? Math.max(now, at(item.from)) : at(item.from));
      });
      // The ink layer: the same lines again, in ink, without their inputs
      inked?.remove();
      inked = make('div', 'inked');
      inked.setAttribute('aria-hidden', 'true');
      inked.inert = true;
      [...grid.children].forEach((el) => inked.append(el.cloneNode(true)));
      inked.querySelectorAll('input').forEach((el) => el.remove());
      grid.append(inked);
    };

    // The pill: the ink layer cut to the picked window, its front edge ahead, the back one behind
    let current = null;
    let move = null;
    const scaleOf = () => grid.getBoundingClientRect().width / grid.offsetWidth || 1;
    const boxOf = (el) => {
      const k = scaleOf();
      const outer = grid.getBoundingClientRect();
      const inner = el.getBoundingClientRect();
      return {
        top: (inner.top - outer.top) / k,
        left: (inner.left - outer.left) / k,
        right: (outer.right - inner.right) / k,
        bottom: (outer.bottom - inner.bottom) / k,
        radius: parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0,
      };
    };
    const clipOf = (edges, radius) => `inset(${edges.top}px ${edges.right}px ${edges.bottom}px ${edges.left}px round ${radius}px)`;
    const middle = (to) => {
      const width = grid.offsetWidth - to.left - to.right;
      const height = grid.offsetHeight - to.top - to.bottom;
      return { ...to, top: to.top + height / 2, bottom: to.bottom + height / 2, left: to.left + width / 2, right: to.right + width / 2 };
    };
    const edgesAt = ({ from, to, grow }, t) => {
      const front = ease(grow ? t : Math.min(1, t / LEAD));
      const back = grow ? front : ease(Math.max(0, (t - LAG) / (1 - LAG)));
      const right = to.left > from.left;
      const down = to.top > from.top;
      const mix = (key, k) => from[key] + (to[key] - from[key]) * k;
      return {
        top: mix('top', down ? back : front),
        right: mix('right', right ? front : back),
        bottom: mix('bottom', down ? front : back),
        left: mix('left', right ? back : front),
        radius: mix('radius', front),
      };
    };
    const paint = () => {
      if (inked) inked.style.clipPath = current ? clipOf(current, current.radius) : 'inset(50%)';
    };
    const stop = () => {
      move?.animation.cancel();
      move = null;
    };
    const whereNow = () => {
      const animation = move?.animation;
      if (!animation || animation.playState !== 'running' || animation.currentTime == null) return null;
      return edgesAt(move, Math.min(1, animation.currentTime / move.duration));
    };
    // From nothing picked, the pill swells from the middle of the window; to nothing, it shrinks back
    const slide = (to) => {
      const from = whereNow() || current;
      stop();
      current = to;
      paint();
      if (still || !inked || (!from && !to)) return;
      const plan = to ? { from: from || middle(to), to, grow: !from } : { from, to: middle(from), grow: true };
      const duration = SLIDE * pace;
      const frames = [];
      for (let i = 0; i <= SAMPLES; i += 1) {
        const edges = edgesAt(plan, i / SAMPLES);
        frames.push({ clipPath: clipOf(edges, edges.radius) });
      }
      move = { ...plan, duration, animation: inked.animate(frames, { duration, easing: 'linear' }) };
      move.animation.onfinish = () => { move = null; };
    };

    // The help line under the slots says the window picked, in words
    const helpLine = help?.textContent.trim() || '';
    const radios = () => [...grid.querySelectorAll(`.${C}__radio`)];
    const picked = () => grid.querySelector(`.${C}__radio:checked`);
    const sayPick = (radio) => {
      const item = facts.get(radio);
      if (!item) return helpLine;
      return item.live ? fill(word('pickedLive'), { day: dayOf(item.day), to: hhmm(item.to) }) : fill(word('picked'), { day: dayOf(item.day), from: hhmm(item.from), to: hhmm(item.to) });
    };
    const update = () => {
      const radio = picked();
      slide(radio ? boxOf(radio.closest(`.${C}__slot`)) : null);
      roll(help, radio ? sayPick(radio) : helpLine);
    };
    grid.addEventListener('change', (event) => {
      if (event.target.matches?.(`.${C}__radio`)) update();
    }, { signal });

    // Left and Right go to the previous or next free window, day after day; Up and Down to the line
    // above or below, onto the free window nearest in time
    const pick = (next) => {
      next.focus();
      next.checked = true;
      next.dispatchEvent(new Event('input', { bubbles: true }));
      next.dispatchEvent(new Event('change', { bubbles: true }));
    };
    grid.addEventListener('keydown', (event) => {
      const radio = event.target.closest?.(`.${C}__radio`);
      if (!radio || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        const free = radios().filter((el) => !el.disabled);
        const next = free[free.indexOf(radio) + (event.key === 'ArrowRight' ? 1 : -1)];
        if (next) pick(next);
        return;
      }
      const rows = [...grid.querySelectorAll(`:scope > .${C}__day`)];
      const centre = (el) => {
        const box = el.closest(`.${C}__slot`).getBoundingClientRect();
        return box.left + box.width / 2;
      };
      const x = centre(radio);
      const step = event.key === 'ArrowDown' ? 1 : -1;
      for (let n = rows.indexOf(radio.closest(`.${C}__day`)) + step; n >= 0 && n < rows.length; n += step) {
        const free = [...rows[n].querySelectorAll(`.${C}__radio:not(:disabled)`)];
        if (!free.length) continue;
        pick(free.reduce((a, b) => (Math.abs(centre(b) - x) < Math.abs(centre(a) - x) ? b : a)));
        return;
      }
    }, { signal });

    // A look at the clock: the header, then the lines if a window opened, closed or ran out
    const look = () => {
      const next = planOf();
      header(next);
      if (plan && next.sign === plan.sign) {
        plan = next;
        tick();
        const on = current && picked();
        current = on ? boxOf(on.closest(`.${C}__slot`)) : null;
        stop();
        paint();
        return;
      }
      const kept = picked()?.value;
      const focused = grid.contains(document.activeElement);
      plan = next;
      draw();
      stop();
      current = null;
      if (kept) {
        const radio = radios().find((el) => el.value === kept && !el.disabled);
        if (radio) {
          radio.checked = true;
          if (focused) radio.focus({ preventScroll: true });
          current = boxOf(radio.closest(`.${C}__slot`));
        } else {
          roll(help, word('gone'));
          if (focused) radios().find((el) => !el.disabled)?.focus({ preventScroll: true });
        }
      }
      paint();
    };
    look();
    const timer = setInterval(look, REFRESH);
    signal.addEventListener('abort', () => clearInterval(timer));
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) look();
    }, { signal });
    const resize = new ResizeObserver(() => {
      const radio = picked();
      stop();
      current = radio ? boxOf(radio.closest(`.${C}__slot`)) : null;
      paint();
      dial();
    });
    resize.observe(grid);
    signal.addEventListener('abort', () => resize.disconnect());

    // The phone: grouped as it is typed (data-format), the country code in front of it. A number
    // that starts with + or 00 is kept as typed. Deleting a space deletes the digit before it
    const code = phone.dataset.dial || '';
    const trunk = phone.dataset.trunk || '';
    const pattern = phone.dataset.format || '';
    const slotsOf = (pattern.match(/#/g) || []).length;
    const digitsOf = (text) => text.replace(/\D/g, '');
    const abroad = (text) => /^\s*(\+|00)/.test(text);
    const group = (digits) => {
      if (!slotsOf || digits.length > slotsOf) return digits;
      let out = '';
      let i = 0;
      for (const char of pattern) {
        if (i >= digits.length) break;
        if (char === '#') {
          out += digits[i];
          i += 1;
        } else out += char;
      }
      return out;
    };
    const caretAt = (text, n) => {
      if (!n) return 0;
      let seen = 0;
      for (let i = 0; i < text.length; i += 1) {
        if (/\d/.test(text[i])) {
          seen += 1;
          if (seen === n) return i + 1;
        }
      }
      return text.length;
    };
    const full = () => {
      const text = phone.value;
      const digits = digitsOf(text);
      if (abroad(text)) {
        const n = digits.replace(/^00/, '').length;
        return n >= 8 && n <= 15;
      }
      if (!code) return digits.length >= 6 && digits.length <= 15;
      const need = slotsOf || 10;
      return trunk && !digits.startsWith(trunk) ? digits.length === need - trunk.length : digits.length === need;
    };
    const international = () => {
      const text = phone.value;
      const digits = digitsOf(text);
      if (!digits) return '';
      if (abroad(text)) return `+${text.trim().startsWith('+') ? digits : digits.replace(/^00/, '')}`;
      return code ? `${code}${trunk && digits.startsWith(trunk) ? digits.slice(trunk.length) : digits}` : digits;
    };
    let typed = phone.value;
    const shape = (event) => {
      const value = phone.value;
      const away = abroad(value);
      phoneBox?.classList.toggle('is-intl', away);
      if (away) {
        const clean = value.replace(/[^\d+ ]/g, '').replace(/(?!^)\+/g, '').replace(/ {2,}/g, ' ');
        if (clean !== value) phone.value = clean;
      } else {
        const caret = phone.selectionStart ?? value.length;
        let digits = digitsOf(value);
        let before = digitsOf(value.slice(0, caret)).length;
        // A space taken out: the digit before it goes too
        if (event?.inputType === 'deleteContentBackward' && digits.length === digitsOf(typed).length && before > 0 && !abroad(typed)) {
          digits = digits.slice(0, before - 1) + digits.slice(before);
          before -= 1;
        }
        const shaped = group(digits);
        if (shaped !== value) {
          phone.value = shaped;
          if (document.activeElement === phone) phone.setSelectionRange(caretAt(shaped, before), caretAt(shaped, before));
        }
      }
      typed = phone.value;
      if (e164) e164.value = international();
      phone.setCustomValidity(!phone.value || full() ? '' : phone.dataset.error || word('phone'));
    };
    phone.addEventListener('input', shape, { signal });
    // The country code takes its own width in front of the number
    const dial = () => {
      if (!dialMark || !phoneBox) return;
      const width = dialMark.getBoundingClientRect().width / scaleOf();
      if (width) phoneBox.style.setProperty('--kz-callback-request-dial', `${width}px`);
    };
    dial();
    document.fonts?.ready.then(() => {
      if (!signal.aborted) dial();
    });

    // What is missing, said under the button (the help line gives way to it), the field focused
    let errorField = null;
    const marked = (field) => (field.matches('fieldset') ? [...field.querySelectorAll('input')] : [field]);
    const clean = () => {
      if (errorField) {
        errorField.classList.remove('is-error');
        marked(errorField).forEach((el) => el.removeAttribute('aria-invalid'));
      }
      errorField = null;
      form.classList.remove('is-error');
    };
    const fail = (field, message, focus = field) => {
      clean();
      if (error) error.textContent = message;
      form.classList.add('is-error');
      errorField = field;
      if (field.matches('fieldset')) field.classList.add('is-error');
      marked(field).forEach((el) => el.setAttribute('aria-invalid', 'true'));
      focus?.focus();
    };
    const invalid = () => {
      if (!picked()) {
        const free = radios().find((el) => !el.disabled);
        if (!free) return fail(button, word('none'), call) || true;
        return fail(slots, slots.dataset.error || word('required'), free) || true;
      }
      if (!phone.value.trim() || !full()) return fail(phone, phone.dataset.error || word('phone')) || true;
      return false;
    };
    form.noValidate = true;
    form.addEventListener('input', (event) => {
      if (!errorField) return;
      const fixed = errorField.matches('fieldset') ? !!errorField.querySelector('input:checked') : errorField === event.target && full();
      if (fixed) clean();
    }, { signal });

    // The reply, as written: its words each in a mask, the window's answer in the ink
    const written = reply.innerHTML;
    const glue = (a, b) => {
      if (a.parentElement?.classList.contains(`${C}__tie`)) return;
      const tie = make('span', 'tie');
      a.before(tie);
      tie.append(a, b);
    };
    const kept = ['mark', 'w', 'tie'].map((name) => `${C}__${name}`);
    const split = (el) => [...el.childNodes].forEach((node) => {
      if (node.nodeType === 1) {
        if (!kept.some((name) => node.classList.contains(name))) split(node);
        return;
      }
      if (node.nodeType !== 3) return;
      const text = node.textContent.replace(/[ \t\n\r\f]+/g, ' ');
      if (!text.trim()) {
        node.textContent = text;
        return;
      }
      const made = text.split(/( )/).filter(Boolean).map((part) => {
        if (part === ' ') return document.createTextNode(' ');
        const mask = make('span', 'w');
        mask.append(make('span', 'wi', part));
        return mask;
      });
      const before = node.previousSibling;
      const after = node.nextSibling;
      node.replaceWith(...made);
      if (made[0].nodeType === 1 && before?.nodeType === 1) glue(before, made[0]);
      const last = made[made.length - 1];
      if (last.nodeType === 1 && after?.nodeType === 1) glue(last, after);
    });
    const dress = (said) => {
      reply.innerHTML = written;
      done.querySelectorAll('[data-value]').forEach((el) => {
        if (el.dataset.value in said) el.textContent = said[el.dataset.value];
      });
      const mark = reply.querySelector(`.${C}__mark`);
      if (mark) mark.replaceChildren(make('span', 'rise', mark.textContent));
      reply.querySelectorAll('[data-value]:not(.' + `${C}__mark)`).forEach((el) => {
        const mask = make('span', 'w');
        el.before(mask);
        mask.append(el);
        el.classList.add(`${C}__wi`);
      });
      split(reply);
    };

    // The form folds into the reply: the stage takes the reply's height, the form's lines leave, the
    // drop of ink flies from the window up into the sentence, and the words rise around it. Back,
    // the same in reverse, without the drop: the answer sinks and its ink closes to its middle
    let folding = [];
    let flight = null;
    const land = () => {
      flight?.remove();
      flight = null;
      reply.querySelector(`.${C}__mark`)?.classList.remove('is-flying');
    };
    const fold = (back, ended) => {
      folding.forEach((a) => a.cancel());
      folding = [];
      land();
      root.classList.remove('is-morphing');
      panel.hidden = false;
      done.hidden = false;
      const close = () => {
        (back ? done : panel).hidden = true;
        root.classList.remove('is-morphing');
        folding.forEach((a) => a.cancel());
        folding = [];
        land();
        ended?.();
      };
      if (still) {
        close();
        return;
      }
      const box = stage.getBoundingClientRect();
      const ratio = box.height / stage.offsetHeight || 1;
      const rect = (el) => {
        const r = el.getBoundingClientRect();
        return { top: (r.top - box.top) / ratio, left: (r.left - box.left) / ratio, width: r.width / ratio, height: r.height / ratio };
      };
      const tall = { panel: panel.offsetHeight, done: done.offsetHeight };
      const play = (el, frames, from, size, easing) => {
        const animation = el?.animate(frames, { duration: size * FLY * pace, delay: (back ? 1 - from - size : from) * FLY * pace, easing, direction: back ? 'reverse' : 'normal', fill: 'both' });
        if (animation) folding.push(animation);
        return animation;
      };
      const shift = (y) => `translateY(${y}px)`;
      const footTop = foot ? rect(foot).top : tall.panel;
      const endTop = end ? rect(end).top : tall.done;
      const mark = reply.querySelector(`.${C}__mark`);
      const slot = picked()?.closest(`.${C}__slot`);
      root.classList.add('is-morphing');

      const main = play(stage, [{ height: `${tall.panel}px` }, { height: `${tall.done}px` }], 0, 1, ROLL);
      // On the way back, the windows come in from the moment the answer's words have sunk
      const leave = back ? BACK_FROM : LEAVE_UNTIL;
      [slots, fields].forEach((el) => play(el, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-8px)' }], 0, leave, LEAVE));
      [foot, privacy].forEach((el) => {
        play(el, [{ transform: 'none' }, { transform: shift(endTop - footTop) }], 0, 1, ROLL);
        play(el, [{ opacity: 1 }, { opacity: 0 }], 0, leave, LEAVE);
      });
      play(end, [{ transform: shift(footTop - endTop) }, { transform: 'none' }], 0, 1, ROLL);
      [...(end?.children || [])].forEach((el, i) => play(el, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], END_AT + i * 0.05, 0.4, ARRIVE));
      play(eta, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], ETA_AT, 0.45, ARRIVE);
      // (back: the last word sinks first, and the first one is down before the windows come in)
      [...reply.querySelectorAll(`.${C}__wi`)].forEach((el, i) => play(el, [{ transform: 'translateY(110%)' }, { transform: 'none' }], back ? Math.min(BACK_FROM - 0.05 + i * WORD_GAP, 0.65) : Math.min(HEAD_AT + i * WORD_GAP, 0.6), 0.35, ARRIVE));
      play(mark?.firstElementChild, [{ transform: 'translateY(110%)' }, { transform: 'none' }], MARK_AT, 0.3, ARRIVE);

      if (back) {
        // The answer's ink closes to its middle once its text has sunk
        const radius = mark ? parseFloat(getComputedStyle(mark).borderTopLeftRadius) || 0 : 0;
        play(mark, [{ clipPath: `inset(0 50% 0 50% round ${radius}px)` }, { clipPath: `inset(0 0% 0 0% round ${radius}px)` }], MARK_AT - 0.02, 0.2, ARRIVE);
      } else if (slot && mark) {
        // The drop: the pill's ink, from the window to the answer, its front edge ahead
        const W = stage.offsetWidth;
        const H = Math.max(tall.panel, tall.done);
        const edges = (r, radius) => ({ top: r.top, left: r.left, right: W - r.left - r.width, bottom: H - r.top - r.height, radius });
        const a = rect(slot);
        const course = {
          from: edges(a, parseFloat(getComputedStyle(slot).borderTopLeftRadius) || 0),
          to: edges(rect(mark), parseFloat(getComputedStyle(mark).borderTopLeftRadius) || 0),
          grow: false,
        };
        flight = make('span', 'flight');
        flight.setAttribute('aria-hidden', 'true');
        flight.style.width = `${W}px`;
        flight.style.height = `${H}px`;
        const label = make('span', 'flown', [...slot.querySelectorAll(`.${C}__long, .${C}__short`)].find((el) => el.offsetParent)?.textContent || '');
        Object.assign(label.style, { top: `${a.top}px`, left: `${a.left}px`, width: `${a.width}px`, height: `${a.height}px` });
        flight.append(label);
        stage.append(flight);
        // The window's text rides in the middle of the drop, then rolls up out of it once landed
        const lift = H - course.to.top - course.to.bottom;
        const frames = [];
        const rides = [];
        for (let i = 0; i <= SAMPLES; i += 1) {
          const t = i / SAMPLES;
          const at = edgesAt(course, t);
          const out = Math.max(0, (t - SWAP_AT) / (1 - SWAP_AT)) ** 2;
          const x = (at.left + W - at.right) / 2 - (a.left + a.width / 2);
          const y = (at.top + H - at.bottom) / 2 - (a.top + a.height / 2) - out * lift;
          frames.push({ clipPath: clipOf(at, at.radius) });
          rides.push({ transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)` });
        }
        const timing = { duration: FLIGHT * FLY * pace, easing: 'linear', fill: 'both' };
        const flying = flight.animate(frames, timing);
        folding.push(flying, label.animate(rides, timing));
        mark.classList.add('is-flying');
        flying.onfinish = land;
        // The drop leaves the line it sat on
        stop();
        current = null;
        paint();
      }
      main.onfinish = close;
    };

    // Sent: the reply says when, in how long, and on which number
    let sent = false;
    let sending = false;
    const finish = () => {
      sent = true;
      const radio = picked();
      const item = facts.get(radio);
      const now = nowAt();
      let soon = '';
      if (item) {
        if (item.day.ahead === 0) {
          const wait = item.from - now.min;
          if (item.live || wait <= 0) soon = word('soon');
          else soon = Math.floor(wait / 60) ? fill(word('in'), { h: Math.floor(wait / 60), m: wait % 60 }) : fill(word('inMin'), { m: wait });
        } else soon = fullDate.format(item.day.date);
      }
      dress({
        day: item ? dayOf(item.day) : '',
        when: item ? (item.live ? fill(word('markLive'), { to: hhmm(item.to) }) : `${hhmm(item.from)}–${hhmm(item.to)}`) : '',
        eta: soon,
        phone: phone.value.trim(),
      });
      const top = stage.getBoundingClientRect().top;
      if (top < ROOM) window.scrollBy({ top: top - ROOM, behavior: still ? 'instant' : 'smooth' });
      fold(false);
      reply.focus({ preventScroll: true });
    };
    const send = async (values) => {
      sending = true;
      button?.setAttribute('aria-busy', 'true');
      const method = (form.getAttribute('method') || 'get').toUpperCase();
      let url = form.action;
      let body;
      if (method === 'GET') {
        const query = new URLSearchParams(values).toString();
        url = `${url.split('?')[0]}?${query}`;
      } else body = values;
      try {
        const response = await fetch(url, { method, body, headers: { Accept: 'application/json' }, signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        finish();
      } catch {
        if (signal.aborted) return;
        const number = call?.textContent.trim();
        fail(button, data.failed || (number ? fill(word('failed'), { phone: number }) : word('failedPlain')), null);
      } finally {
        sending = false;
        button?.removeAttribute('aria-busy');
      }
    };
    form.addEventListener('submit', (event) => {
      if (sent || sending || invalid()) {
        event.preventDefault();
        return;
      }
      clean();
      if (e164) e164.value = international();
      const values = new FormData(form);
      // A robot filled the field no person sees: it gets a reply, nothing is sent
      if (values.get('website')) {
        event.preventDefault();
        finish();
        return;
      }
      values.delete('website');
      const told = form.dispatchEvent(new CustomEvent('kodza:submit', { detail: { data: values }, bubbles: true, cancelable: true }));
      if (!told) {
        event.preventDefault();
        finish();
        return;
      }
      if (data.send !== 'fetch') return;
      event.preventDefault();
      send(values);
    }, { signal });

    // Start over: the lines come back as they are now, nothing picked
    form.addEventListener('reset', () => requestAnimationFrame(() => {
      if (signal.aborted) return;
      clean();
      if (e164) e164.value = '';
      phoneBox?.classList.remove('is-intl');
      phone.setCustomValidity('');
      typed = '';
      stop();
      current = null;
      look();
      paint();
      roll(help, helpLine);
      if (!sent) return;
      const inside = done.contains(document.activeElement);
      sent = false;
      fold(true);
      if (inside) radios().find((el) => !el.disabled)?.focus({ preventScroll: true });
    }), { signal });
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
