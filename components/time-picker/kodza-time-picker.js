// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Time Picker
// Builds a field and a panel over the real <input type="time"> and keeps it in step (firing
// "input" and "change" on it). 12 or 24 hours as data-locale (or the page language) says,
// data-clock="12" or "24" to force it; min, max and step are read on the input. The panel is a
// wheel: hours, minutes (and AM / PM), each column a listbox that scrolls and snaps. Arrows turn
// a column by one, Page Up / Down by five, Home / End to the ends, Left / Right to the next
// column, Enter takes it. Once the wheel stops, the time is taken on its own, and a time out of
// min / max glides back to the nearest one allowed. With .kodza-time--slots, the panel lists the
// slots of a day instead (min to max, or DAY_START to DAY_END, every step, or SLOT_STEP), and the
// times in data-taken="10:00 11:30" are struck out. Escape closes and gives the focus back.
// The words and timings are below; each word can be set per field with data-text-<name>
// (data-text-empty="…"), {free}, {total} and {time} are filled in.
(() => {
  const SELECTOR = '.kodza-time';
  const WORDS = {
    empty: 'Pick a time', // the field, with no time yet
    choose: 'choose a time', // the panel, read after the label
    hours: 'Hours',
    minutes: 'Minutes',
    period: 'AM or PM',
    done: 'Done',
    free: '{free} of {total} free', // above the slots
    taken: '{time}, taken', // a taken slot, read out
  };
  const ROLL = 420; // ms, a part of the field rolling to its new value
  const GLIDE = 360; // ms, the wheel gliding to a time (a click, the keys, back into min / max)
  const SETTLE = 160; // ms of stillness before the wheel takes its time (a wait, not a motion)
  const CLOSE_AFTER = 320; // ms, the mark landing on a slot before the panel closes
  const PAGE = 5; // lines per Page Up / Page Down
  const WHEEL_STEP = 300; // s, the wheel's minutes when the input has no step (every 5 minutes)
  const SLOT_STEP = 1800; // s, the slots when the input has no step (every 30 minutes)
  const DAY_START = '09:00'; // the first slot of a day, when the input has no min
  const DAY_END = '17:00'; // and the last one, when it has no max
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const easeOut = (x) => 1 - (1 - x) ** 4;
  const DAY = 1440; // minutes
  // A time is counted in minutes from midnight
  const toMinutes = (value) => {
    const m = /^(\d{1,2}):(\d{2})/.exec(value || '');
    if (!m) return null;
    const h = Number(m[1]);
    const min = Number(m[2]);
    return h < 24 && min < 60 ? h * 60 + min : null;
  };
  const toText = (t) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  const at = (t) => new Date(2000, 0, 1, Math.floor(t / 60), t % 60);
  const fill = (words, values) => words.replace(/\{(\w+)\}/g, (all, key) => (key in values ? values[key] : all));
  const icon = '<svg class="kodza-time__icon" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="6.5"/><path d="M9 5.5V9l2.5 1.5"/></svg>';
  let uid = 0;

  // A part of the time rolls to its new face (up when the time goes forward, down when it goes
  // back), and its box follows the new width
  const swap = (box, next, dir, pace) => {
    const from = box.offsetWidth;
    const prev = box.lastElementChild;
    box.append(next);
    if (!prev) return;
    if (reduceMotion || !pace) return prev.remove();
    const to = next.offsetWidth;
    const timing = { duration: ROLL * pace, easing: ease };
    const fit = from !== to ? box.animate([{ width: `${from}px` }, { width: `${to}px` }], { ...timing, fill: 'forwards' }) : null;
    // One keyframe: a face sent off while it was still arriving leaves from where it is
    prev.animate({ transform: `translateY(${dir * -110}%)` }, { ...timing, fill: 'forwards' }).finished.then(() => {
      prev.remove();
      fit?.cancel();
    }, () => {});
    next.animate([{ transform: `translateY(${dir * 110}%)` }, { transform: 'none' }], timing);
  };

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    // The pace is read once the field is built (end of mount): read before, the style it computes
    // would turn the field's first state into a transition
    let pace = 1;
    let still = reduceMotion; // the still path: no motion asked, by the visitor or the site
    const native = root.querySelector('.kodza-time__native');
    const label = root.querySelector('.kodza-time__label');
    if (!native) return;
    const id = `kodza-time-${++uid}`;
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const locale = root.dataset.locale || document.documentElement.lang || undefined;
    const slots = root.classList.contains('kodza-time--slots');
    // 12 or 24 hours: data-clock, or what the locale uses
    const h12 = root.dataset.clock ? root.dataset.clock === '12' : (() => {
      const options = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions();
      return options.hourCycle ? options.hourCycle === 'h11' || options.hourCycle === 'h12' : !!options.hour12;
    })();
    const shown = new Intl.DateTimeFormat(locale, h12 ? { hour: 'numeric', minute: '2-digit', hourCycle: 'h12' } : { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    const min = toMinutes(native.min);
    const max = toMinutes(native.max);
    const wraps = min !== null && max !== null && min > max; // a range past midnight (22:00 to 02:00)
    const allowed = (t) => (wraps ? t >= min || t <= max : (min === null || t >= min) && (max === null || t <= max));
    const step = Math.max(1, Math.round((parseFloat(native.step) || (slots ? SLOT_STEP : WHEEL_STEP)) / 60));
    let current = toMinutes(native.value);

    // The field
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'kodza-time__trigger';
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    if (label) {
      label.id = `${id}-label`;
      trigger.setAttribute('aria-labelledby', `${id}-label ${id}-value`);
    }
    const value = Object.assign(document.createElement('span'), { className: 'kodza-time__value', id: `${id}-value` });
    trigger.append(value);
    trigger.insertAdjacentHTML('beforeend', icon);

    // The panel
    const pop = document.createElement('div');
    pop.className = 'kodza-time__pop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', label ? `${label.textContent}: ${word('choose')}` : word('choose').replace(/^./, (c) => c.toUpperCase()));
    native.after(trigger, pop);
    native.tabIndex = -1;
    native.setAttribute('aria-hidden', 'true');

    // The time in the field, part by part (hours, the colon, minutes, AM / PM), so each part can
    // roll on its own
    let shownTime;
    const line = (t) => {
      if (t === null) {
        const empty = Object.assign(document.createElement('span'), { className: 'is-empty', textContent: word('empty') });
        empty.dataset.shape = 'empty';
        return empty;
      }
      const parts = shown.formatToParts(at(t));
      const box = Object.assign(document.createElement('span'), { className: 'kodza-time__line' });
      box.dataset.shape = parts.map((p) => p.type).join(' ');
      parts.forEach((p) => {
        const part = Object.assign(document.createElement('span'), { className: 'kodza-time__part' });
        part.append(Object.assign(document.createElement('span'), { textContent: p.value }));
        box.append(part);
      });
      return box;
    };
    const show = (t, animate) => {
      if (t === shownTime) return;
      const dir = t !== null && shownTime != null && t < shownTime ? -1 : 1;
      shownTime = t;
      const next = line(t);
      const old = value.lastElementChild;
      if (!animate || !old) return value.replaceChildren(next);
      // A time after a time: only the parts that change roll
      if (old.classList.contains('kodza-time__line') && old.dataset.shape === next.dataset.shape) {
        [...next.children].forEach((part, i) => {
          const face = part.firstElementChild;
          if (old.children[i].lastElementChild.textContent !== face.textContent) swap(old.children[i], face, dir, pace);
        });
        return;
      }
      swap(value, next, dir, pace);
    };

    // Take a time: the real input and its events, then the field
    let busy = false;
    const commit = (t) => {
      if (t !== current) {
        current = t;
        native.value = t === null ? '' : toText(t);
        busy = true;
        try {
          native.dispatchEvent(new Event('input', { bubbles: true }));
          native.dispatchEvent(new Event('change', { bubbles: true }));
        } finally {
          busy = false;
        }
      }
      show(t, true);
    };

    const isOpen = () => root.classList.contains('is-open');
    let timer = 0;
    let frame = 0;
    let prepare; // sets the panel for the time, gives what takes the focus
    let flush = () => {}; // takes what the panel holds, as it closes
    let follow = () => {}; // the time was changed from outside

    if (!slots) {
      // The wheel. Its times: every step from min (or midnight), within min / max
      const base = min ?? 0;
      const grid = [];
      const faces = new Set();
      for (let t = base % step; t < DAY; t += step) {
        faces.add(t % 60);
        if (allowed(t)) grid.push(t);
      }
      const valid = new Set(grid);
      const minutes = [...faces].sort((a, b) => a - b);
      const gap = (a, b) => {
        const d = Math.abs(a - b);
        return wraps ? Math.min(d, DAY - d) : d;
      };
      const nearest = (t) => (valid.has(t) || !grid.length ? t : grid.reduce((best, g) => (gap(g, t) < gap(best, t) ? g : best)));
      const now = () => {
        const d = new Date();
        return d.getHours() * 60 + d.getMinutes();
      };

      // The columns
      const two = new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false });
      const one = new Intl.NumberFormat(locale, { useGrouping: false });
      const sample = shown.formatToParts(at(0));
      const hourAt = sample.findIndex((p) => p.type === 'hour');
      const sep = (sample[hourAt + 1]?.type === 'literal' && sample[hourAt + 1].value.trim()) || ':';
      const column = (name, labels) => {
        const col = Object.assign(document.createElement('div'), { className: 'kodza-time__col' });
        const list = Object.assign(document.createElement('div'), { className: 'kodza-time__list', tabIndex: 0 });
        list.setAttribute('role', 'listbox');
        list.setAttribute('aria-label', word(name));
        const items = labels.map((text, i) => {
          const item = Object.assign(document.createElement('div'), { className: 'kodza-time__item', textContent: text, id: `${id}-${name}-${i}` });
          item.setAttribute('role', 'option');
          item.setAttribute('aria-selected', 'false');
          item.dataset.index = i;
          list.append(item);
          return item;
        });
        // The lens: a white copy of the column, cut to the band, moved with the scroll
        const lens = Object.assign(document.createElement('div'), { className: 'kodza-time__lens' });
        const reel = Object.assign(document.createElement('div'), { className: 'kodza-time__reel' });
        lens.setAttribute('aria-hidden', 'true');
        const ghosts = labels.map((text) => reel.appendChild(Object.assign(document.createElement('span'), { className: 'kodza-time__ghost', textContent: text })));
        lens.append(reel);
        col.append(list, lens);
        return { name, col, list, items, reel, ghosts, index: -1, to: 0 };
      };
      const hours = column('hours', Array.from({ length: h12 ? 12 : 24 }, (_, i) => (h12 ? one.format(i || 12) : two.format(i))));
      const mins = column('minutes', minutes.map((m) => two.format(m)));
      const period = h12 ? column('period', [0, 720].map((t) => shown.formatToParts(at(t)).find((p) => p.type === 'dayPeriod')?.value || (t ? 'PM' : 'AM'))) : null;
      // AM / PM goes first where the locale writes it first
      const periodFirst = period && sample.findIndex((p) => p.type === 'dayPeriod') < hourAt;
      const cols = (periodFirst ? [period, hours, mins] : [hours, mins, period]).filter(Boolean);

      const wheel = Object.assign(document.createElement('div'), { className: 'kodza-time__wheel' });
      const band = Object.assign(document.createElement('span'), { className: 'kodza-time__band' });
      const colon = Object.assign(document.createElement('span'), { className: 'kodza-time__sep', textContent: sep });
      band.setAttribute('aria-hidden', 'true');
      colon.setAttribute('aria-hidden', 'true');
      wheel.append(band, ...cols.map((c) => c.col));
      hours.col.after(colon);
      const foot = Object.assign(document.createElement('div'), { className: 'kodza-time__foot' });
      const doneButton = Object.assign(document.createElement('button'), { type: 'button', className: 'kodza-time__done', textContent: word('done') });
      foot.append(doneButton);
      pop.append(wheel, foot);

      // Where a line sits when it is on the band, and the line on the band now
      const topOf = (c, i) => c.items[i].offsetTop - (c.list.clientHeight - c.items[i].offsetHeight) / 2;
      const indexAt = (c) => Math.max(0, Math.min(c.items.length - 1, Math.round((c.list.scrollTop - topOf(c, 0)) / c.items[0].offsetHeight)));
      const point = (c, i) => {
        if (c.index === i) return false;
        c.items[c.index]?.setAttribute('aria-selected', 'false');
        c.index = i;
        c.items[i].setAttribute('aria-selected', 'true');
        c.list.setAttribute('aria-activedescendant', c.items[i].id);
        return true;
      };
      // The lens follows its column, in the same frame
      const paint = (c) => (c.reel.style.transform = `translateY(${-c.list.scrollTop}px)`);
      const hourOf = (i, p) => (h12 ? (i % 12) + 12 * p : i);
      // The time the columns say: on the band now (index), or where they are going (to)
      const timeAt = (pick) => hourOf(pick(hours), period ? pick(period) : 0) * 60 + minutes[pick(mins)];
      const timeOf = () => timeAt((c) => c.index);
      const target = () => timeAt((c) => c.to);
      const indicesOf = (t) => {
        const h = Math.floor(t / 60);
        const lines = { hours: h12 ? h % 12 : h, minutes: Math.max(0, minutes.indexOf(t % 60)), period: Math.floor(h / 12) };
        return cols.map((c) => lines[c.name]);
      };
      // What min / max leave out stays on the wheel, faded, and the wheel glides back off it
      const off = (c, i, yes) => {
        c.items[i].classList.toggle('is-off', yes);
        c.ghosts[i].classList.toggle('is-off', yes);
        if (yes) c.items[i].setAttribute('aria-disabled', 'true');
        else c.items[i].removeAttribute('aria-disabled');
      };
      const opens = (h) => minutes.some((m) => valid.has(h * 60 + m));
      const fence = () => {
        const p = period ? period.index : 0;
        hours.items.forEach((_, i) => off(hours, i, !opens(hourOf(i, p))));
        mins.items.forEach((_, i) => off(mins, i, !valid.has(hourOf(hours.index, p) * 60 + minutes[i])));
        period?.items.forEach((_, i) => off(period, i, !hours.items.some((__, j) => opens(hourOf(j, i)))));
      };
      const place = (t) => {
        indicesOf(t).forEach((i, n) => {
          const c = cols[n];
          point(c, i);
          c.to = i;
          c.list.scrollTop = topOf(c, i);
          paint(c);
        });
        fence();
      };

      let gliding = false;
      let dirty = false; // the wheel moved since its time was last taken
      let held = false; // a finger is on the wheel
      const stopGlide = () => {
        cancelAnimationFrame(frame);
        if (!gliding) return;
        gliding = false;
        cols.forEach((c) => c.list.classList.remove('is-gliding'));
      };
      // Sent to a time, the columns glide there together, snapping off on the way
      const glideTo = (targets) => {
        stopGlide();
        clearTimeout(timer);
        dirty = true;
        const runs = [];
        cols.forEach((c, n) => {
          c.to = targets[n];
          const from = c.list.scrollTop;
          const to = topOf(c, targets[n]);
          if (Math.abs(to - from) > 0.5) runs.push({ c, from, to });
        });
        const end = () => {
          gliding = false;
          runs.forEach(({ c, to }) => {
            c.list.scrollTop = to;
            c.list.classList.remove('is-gliding');
            paint(c);
          });
          cols.forEach((c) => point(c, c.to));
          fence();
          settle(true);
        };
        if (!runs.length || still) return end();
        gliding = true;
        runs.forEach(({ c }) => c.list.classList.add('is-gliding'));
        const start = performance.now();
        const duration = GLIDE * pace;
        const tick = (time) => {
          const x = Math.min(1, (time - start) / duration);
          runs.forEach(({ c, from, to }) => {
            c.list.scrollTop = from + (to - from) * easeOut(x);
            paint(c);
          });
          if (x < 1) frame = requestAnimationFrame(tick);
          else end();
        };
        frame = requestAnimationFrame(tick);
      };
      // The wheel has stopped: it takes the nearest time allowed, gliding there first when it is
      // not on it (out of min / max, or left between two lines)
      const settle = (afterGlide = false) => {
        clearTimeout(timer);
        if (gliding || held || !isOpen()) return;
        const goal = nearest(timeOf());
        const targets = indicesOf(goal);
        const away = cols.some((c, n) => c.index !== targets[n] || (!afterGlide && Math.abs(c.list.scrollTop - topOf(c, targets[n])) > 1));
        if (away) return glideTo(targets);
        if (!dirty) return;
        dirty = false;
        commit(goal);
      };
      const arm = () => {
        clearTimeout(timer);
        timer = setTimeout(() => !signal.aborted && settle(), SETTLE);
      };
      const moved = (c) => {
        const i = indexAt(c);
        if (point(c, i)) fence();
        if (gliding) return;
        if (c.to !== i) {
          c.to = i;
          dirty = true;
        }
        if (dirty) arm();
      };
      // One column sent to a line: the wheel glides to the nearest time allowed from there
      const go = (c, i) => glideTo(indicesOf(nearest(timeAt((k) => (k === c ? i : k.to)))));
      // The first line that is not faded, from i on that way, then back the other way
      const reach = (c, i, dir) => {
        const last = c.items.length - 1;
        const from = Math.max(0, Math.min(last, i));
        for (let k = from; k >= 0 && k <= last; k += dir) if (!c.items[k].classList.contains('is-off')) return k;
        for (let k = from - dir; k >= 0 && k <= last; k -= dir) if (!c.items[k].classList.contains('is-off')) return k;
        return c.to;
      };
      const done = () => {
        const t = nearest(target());
        stopGlide();
        clearTimeout(timer);
        dirty = false;
        commit(t);
        close();
      };

      prepare = () => {
        stopGlide();
        dirty = false;
        place(nearest(current ?? now()));
        return cols[0].list;
      };
      flush = () => {
        clearTimeout(timer);
        if (!dirty && !gliding) return;
        const t = nearest(target());
        stopGlide();
        dirty = false;
        commit(t);
      };
      follow = () => {
        if (!isOpen()) return;
        stopGlide();
        dirty = false;
        place(nearest(current ?? now()));
      };

      cols.forEach((c, n) => {
        const { list } = c;
        list.addEventListener('scroll', () => {
          paint(c);
          moved(c);
        }, { passive: true, signal });
        list.addEventListener('scrollend', () => settle(), { signal });
        // A hand on the wheel stops a glide where it is
        list.addEventListener('wheel', stopGlide, { passive: true, signal });
        list.addEventListener('pointerdown', stopGlide, { signal });
        list.addEventListener('touchstart', () => {
          held = true;
          stopGlide();
        }, { passive: true, signal });
        // A click on a line sends the wheel there, a click on the line on the band takes it
        list.addEventListener('click', (event) => {
          const item = event.target.closest('.kodza-time__item');
          if (!item || item.classList.contains('is-off')) return;
          const i = Number(item.dataset.index);
          if (i === c.index && !gliding) return done();
          go(c, i);
        }, { signal });
        list.addEventListener('keydown', (event) => {
          const moves = {
            ArrowUp: [c.to - 1, -1],
            ArrowDown: [c.to + 1, 1],
            PageUp: [c.to - PAGE, -1],
            PageDown: [c.to + PAGE, 1],
            Home: [0, 1],
            End: [c.items.length - 1, -1],
          };
          if (moves[event.key]) {
            event.preventDefault();
            go(c, reach(c, ...moves[event.key]));
          } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            cols[n + (event.key === 'ArrowLeft' ? -1 : 1)]?.list.focus({ preventScroll: true });
          } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            done();
          }
        }, { signal });
      });
      const release = () => {
        if (!held) return;
        held = false;
        if (dirty) arm();
      };
      document.addEventListener('touchend', release, { signal });
      document.addEventListener('touchcancel', release, { signal });
      doneButton.addEventListener('click', done, { signal });
    } else {
      // The slots of a day: every step from min to max (or DAY_START to DAY_END)
      const start = min ?? toMinutes(DAY_START);
      let end = max ?? toMinutes(DAY_END);
      if (end < start) end += DAY;
      const taken = new Set((root.dataset.taken || '').split(/[\s,]+/).map(toMinutes).filter((t) => t !== null));
      const count = Object.assign(document.createElement('p'), { className: 'kodza-time__count' });
      const list = Object.assign(document.createElement('div'), { className: 'kodza-time__slots' });
      list.setAttribute('role', 'group');
      if (label) list.setAttribute('aria-labelledby', label.id);
      const mark = Object.assign(document.createElement('span'), { className: 'kodza-time__mark is-hidden' });
      mark.setAttribute('aria-hidden', 'true');
      list.append(mark);
      const buttons = [];
      for (let t = start; t <= end; t += step) {
        const time = t % DAY;
        const b = Object.assign(document.createElement('button'), { type: 'button', className: 'kodza-time__slot', textContent: shown.format(at(time)), tabIndex: -1 });
        b.dataset.time = toText(time);
        if (taken.has(time)) {
          b.disabled = true;
          b.setAttribute('aria-label', fill(word('taken'), { time: b.textContent }));
        } else b.setAttribute('aria-pressed', 'false');
        list.append(b);
        buttons.push(b);
      }
      const free = buttons.filter((b) => !b.disabled);
      count.textContent = fill(word('free'), { free: free.length, total: buttons.length });
      pop.append(count, list);

      // The ink mark under the chosen slot: it travels from one to the next, and grows in on the first
      const chosenSlot = () => (current === null ? null : free.find((b) => b.dataset.time === toText(current)) || null);
      const placeMark = (animate) => {
        const chosen = chosenSlot();
        free.forEach((b) => b.setAttribute('aria-pressed', String(b === chosen)));
        if (!chosen) return mark.classList.add('is-hidden');
        const jump = !animate || mark.classList.contains('is-hidden');
        if (jump) mark.style.transition = 'none';
        mark.style.setProperty('--kz-mark-x', `${chosen.offsetLeft}px`);
        mark.style.setProperty('--kz-mark-y', `${chosen.offsetTop}px`);
        mark.style.setProperty('--kz-mark-w', `${chosen.offsetWidth}px`);
        mark.style.setProperty('--kz-mark-h', `${chosen.offsetHeight}px`);
        if (!animate) mark.classList.remove('is-hidden');
        if (jump) {
          void mark.offsetWidth;
          mark.style.transition = '';
        }
        mark.classList.remove('is-hidden');
      };
      // One slot takes the Tab key, the arrows move it; the box scrolls itself (the page never moves)
      let active = null;
      const rove = (b) => {
        if (active) active.tabIndex = -1;
        active = b;
        if (b) b.tabIndex = 0;
      };
      const reveal = (b) => {
        const top = b.offsetTop - 6;
        const bottom = b.offsetTop + b.offsetHeight + 6;
        if (top < list.scrollTop) list.scrollTop = top;
        else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
      };

      prepare = () => {
        placeMark(false);
        const chosen = chosenSlot() || free[0] || null;
        rove(chosen);
        if (chosen) list.scrollTop = chosen.offsetTop - (list.clientHeight - chosen.offsetHeight) / 2;
        return chosen;
      };
      follow = () => placeMark(isOpen());

      list.addEventListener('click', (event) => {
        const b = event.target.closest('.kodza-time__slot');
        if (!b || b.disabled) return;
        rove(b);
        commit(toMinutes(b.dataset.time));
        placeMark(true);
        // Let the mark land, then close
        clearTimeout(timer);
        timer = setTimeout(() => !signal.aborted && close(), still ? 0 : CLOSE_AFTER * pace);
      }, { signal });
      list.addEventListener('keydown', (event) => {
        const b = event.target.closest('.kodza-time__slot');
        if (!b) return;
        const i = free.indexOf(b);
        let next;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') next = free[i + (event.key === 'ArrowLeft' ? -1 : 1)];
        else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
          // The free slot of the nearest row that way, closest to the same column
          const down = event.key === 'ArrowDown';
          const beyond = free.filter((x) => (down ? x.offsetTop > b.offsetTop : x.offsetTop < b.offsetTop));
          const row = Math.min(...beyond.map((x) => Math.abs(x.offsetTop - b.offsetTop)));
          next = beyond
            .filter((x) => Math.abs(x.offsetTop - b.offsetTop) === row)
            .sort((x, y) => Math.abs(x.offsetLeft - b.offsetLeft) - Math.abs(y.offsetLeft - b.offsetLeft))[0];
        } else if (event.key === 'Home') next = free[0];
        else if (event.key === 'End') next = free[free.length - 1];
        else return;
        event.preventDefault();
        if (!next) return;
        rove(next);
        next.focus({ preventScroll: true });
        reveal(next);
      }, { signal });
    }

    const open = () => {
      if (isOpen()) return;
      const focusTarget = prepare();
      // Not enough room below: the panel opens upwards. A closed panel that changes side gets
      // there at once, so it always unrolls from the field
      const box = trigger.getBoundingClientRect();
      const need = pop.offsetHeight + 16;
      const above = box.bottom + need > innerHeight && box.top > need;
      if (above !== root.classList.contains('is-above')) {
        pop.style.transition = 'none';
        root.classList.toggle('is-above', above);
        void pop.offsetWidth;
        pop.style.transition = '';
      }
      root.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(() => isOpen() && focusTarget?.focus({ preventScroll: true }));
    };
    const close = (refocus = true) => {
      if (!isOpen()) return;
      flush();
      clearTimeout(timer);
      root.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      if (refocus) trigger.focus({ preventScroll: true });
    };

    // The input changed by the page (a script that sets .value then fires "change", a form reset)
    const sync = () => {
      if (busy) return;
      current = toMinutes(native.value);
      show(current, true);
      follow();
    };

    trigger.addEventListener('click', () => (isOpen() ? close() : open()), { signal });
    root.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !isOpen()) return;
      event.preventDefault();
      close();
    }, { signal });
    // A click on the label text opens the panel instead of reaching the hidden input
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
    native.addEventListener('change', sync, { signal });
    native.form?.addEventListener('reset', () => setTimeout(() => !signal.aborted && sync()), { signal });
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    });

    show(current, false);
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
