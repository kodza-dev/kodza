// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Footer Venue
// Works out, at the place's own time, whether it's open. The hours are the week as written:
// each row (data-day="mon"…"sun") holds pairs of <time datetime="12:00">, an end before the
// start runs past midnight, and a row without them is a day off. The time zone comes from
// data-timezone (an IANA name such as Europe/Paris; the visitor's own time when it's missing or
// unknown). The status then reads "Open now · closes 22:30", "Closes in 25 min" in the last hour
// (data-soon, in minutes), "Closed · opens Wed 12:00" or "Opens in 20 min": its words come from
// the status's data-open, data-closing, data-closed and data-opening, with {time}, {min} and
// {when} in them, and {when} takes the day's name as written in its row. It's written again on
// every minute; a change of words rolls the line, a change of minutes rolls the number.
// Today's row goes under an ink pill, which slides to the next row when the day changes. On
// phones the week folds to today's row, and All hours unfolds it around it.
// data-now ("tue 22:35") pins the clock, to check a schedule before it goes live.
(() => {
  const SELECTOR = '.kodza-footer-venue';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const DAY = 1440; // minutes
  const WEEK = 7 * DAY;
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const WORDS = {
    open: 'Open now · closes {time}',
    closing: 'Closes in {min} min',
    closed: 'Closed · opens {when}',
    opening: 'Opens in {min} min',
    always: 'Open 24/7',
  };

  const minutes = (time) => {
    const [h, m] = String(time).trim().split(':').map(Number);
    return h * 60 + (m || 0);
  };
  const clock = (n) => {
    const m = ((n % DAY) + DAY) % DAY;
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  };

  // The open stretches of three weeks running (the one before and the one after catch the
  // nights across Sunday), in minutes from this Monday 00:00, joined where one runs into the next
  const stretches = (rows) => {
    const all = [];
    rows.forEach((row) => {
      const d = DAYS.indexOf(row.dataset.day);
      const times = [...row.querySelectorAll('time')].map((t) => minutes(t.getAttribute('datetime') || t.textContent));
      if (d < 0 || times.some(Number.isNaN)) return;
      for (let i = 0; i + 1 < times.length; i += 2) {
        const [a, b] = [times[i], times[i + 1]];
        [-WEEK, 0, WEEK].forEach((shift) => {
          const start = shift + d * DAY + a;
          all.push([start, start + ((b - a + DAY - 1) % DAY) + 1]);
        });
      }
    });
    all.sort((a, b) => a[0] - b[0]);
    return all.reduce((joined, [a, b]) => {
      const last = joined[joined.length - 1];
      if (last && a <= last[1]) last[1] = Math.max(last[1], b);
      else joined.push([a, b]);
      return joined;
    }, []);
  };

  // Now, at the place: minutes from Monday 00:00
  const zoned = (zone) => {
    const options = { weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
    try {
      return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: zone || undefined });
    } catch {
      return new Intl.DateTimeFormat('en-GB', options);
    }
  };
  const at = (text) => {
    const m = (text || '').trim().toLowerCase().match(/^([a-z]{3})\s+(\d{1,2}:\d{2})$/);
    return m && DAYS.includes(m[1]) ? DAYS.indexOf(m[1]) * DAY + minutes(m[2]) : null;
  };

  const span = (text) => Object.assign(document.createElement('span'), { textContent: text });
  const shown = (el) => Boolean(el) && getComputedStyle(el).display !== 'none';

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    root.querySelectorAll('.kodza-footer-venue__year').forEach((year) => {
      year.textContent = String(new Date().getFullYear());
    });

    const status = root.querySelector('.kodza-footer-venue__status');
    const text = status?.querySelector('.kodza-footer-venue__text');
    const frame = root.querySelector('.kodza-footer-venue__window');
    const week = frame?.querySelector('.kodza-footer-venue__week');
    const rows = week ? [...week.querySelectorAll('.kodza-footer-venue__day')] : [];
    const all = root.querySelector('.kodza-footer-venue__all');
    if (!text || !rows.length) return;
    const words = (key) => status.dataset[key] || WORDS[key];
    const rowOf = (d) => rows.find((row) => row.dataset.day === DAYS[d]);
    const nameOf = (d) => rowOf(d)?.querySelector('.kodza-footer-venue__name')?.textContent.trim() || DAYS[d];

    // The pill, and in it a copy of the week in the paper colour: the copy moves against the pill,
    // so the words turn exactly at its edges
    const pill = Object.assign(document.createElement('span'), { className: 'kodza-footer-venue__pill' });
    pill.setAttribute('aria-hidden', 'true');
    const ghost = week.cloneNode(true);
    ghost.classList.add('kodza-footer-venue__ghost');
    ghost.removeAttribute('aria-label');
    pill.append(ghost);
    frame.append(pill);

    // The old words rise out of their window as the new ones come from below, and the window's
    // width goes from one to the other. A change that lands mid-roll drops the words already
    // leaving, and the old ones leave from where they stand
    const roll = (box, next, moving) => {
      const old = box.lastElementChild;
      const from = box.offsetWidth;
      [...box.children].forEach((el) => el !== old && el.remove());
      box.append(next);
      if (!old) return;
      if (!moving || reduceMotion) return old.remove();
      const y = new DOMMatrixReadOnly(getComputedStyle(old).transform).m42;
      old.getAnimations().forEach((a) => a.cancel());
      old.classList.add('is-leaving');
      old.setAttribute('aria-hidden', 'true');
      const timing = { duration: 700, easing: EASE };
      old.animate([{ transform: `translateY(${y}px)` }, { transform: 'translateY(-100%)' }], { ...timing, fill: 'forwards' }).finished.then(() => old.remove(), () => {});
      next.animate([{ transform: 'translateY(100%)' }, { transform: 'none' }], timing);
      // The window opens a little ahead of the words, so their end isn't cut for long
      box.getAnimations().forEach((a) => a.cancel());
      box.animate([{ width: `${from}px` }, { width: `${box.offsetWidth}px` }], { ...timing, duration: 480 });
    };

    // A line of words, with the minutes in their own window
    const line = (template, values) => {
      const el = document.createElement('span');
      template.split(/(\{min\})/).forEach((part) => {
        if (part !== '{min}') return el.append(part.replace(/\{(time|when)\}/g, (_, key) => values[key]));
        const num = Object.assign(document.createElement('span'), { className: 'kodza-footer-venue__num' });
        num.append(span(values.min));
        el.append(num);
      });
      return el;
    };

    // Today's row: where the pill stands, and on phones what the folded window shows
    let today = -1;
    let place = { y: 0, h: 0 };
    const measure = () => {
      const row = rowOf(today);
      place = row ? { y: row.offsetTop, h: row.offsetHeight } : { y: 0, h: 0 };
      frame.style.setProperty('--kz-footer-venue-today-y', `${place.y}px`);
      frame.style.setProperty('--kz-footer-venue-today-h', `${place.h}px`);
    };
    const folded = () => shown(all) && !root.classList.contains('is-all');
    // Folded, the other days are out of sight: out of the reading order too
    const hide = () => rows.forEach((row) => {
      if (folded() && row !== rowOf(today)) row.setAttribute('aria-hidden', 'true');
      else row.removeAttribute('aria-hidden');
    });
    const slide = (from, timing) => {
      const ghostKeys = [{ transform: `translateY(${-from.y}px)` }, { transform: `translateY(${-place.y}px)` }];
      pill.animate([{ transform: `translateY(${from.y}px)`, height: `${from.h}px` }, { transform: `translateY(${place.y}px)`, height: `${place.h}px` }], timing);
      ghost.animate(ghostKeys, timing);
    };
    const mark = (d, moving) => {
      if (d === today) return;
      const before = today >= 0 ? place : null;
      today = d;
      rows.forEach((row) => (row === rowOf(d) ? row.setAttribute('aria-current', 'date') : row.removeAttribute('aria-current')));
      root.classList.toggle('has-today', Boolean(rowOf(d)));
      measure();
      hide();
      if (!before || !moving || reduceMotion || !rowOf(d)) return;
      const timing = { duration: 700, easing: EASE };
      slide(before, timing);
      // Folded, the week rolls under the window instead: the new day comes in where the old one was
      if (!folded()) return;
      const shift = [{ translate: `0 ${-before.y}px` }, { translate: `0 ${-place.y}px` }];
      week.animate(shift, timing);
      pill.animate(shift, timing);
      frame.animate([{ height: `${before.h}px` }, { height: `${place.h}px` }], timing);
    };

    let open = [];
    let format = null;
    let said = '';
    const now = () => {
      const pinned = at(root.dataset.now);
      if (pinned !== null) return pinned;
      const parts = Object.fromEntries(format.formatToParts(new Date()).map((p) => [p.type, p.value]));
      return DAYS.indexOf(parts.weekday.toLowerCase()) * DAY + minutes(`${parts.hour}:${parts.minute}`);
    };
    const read = () => {
      open = stretches(rows);
      format = zoned(root.dataset.timezone);
    };

    const update = (moving) => {
      const t = now();
      mark(Math.floor((((t % WEEK) + WEEK) % WEEK) / DAY), moving);
      if (!open.length) return;
      const soon = Number(root.dataset.soon) || 60;
      const current = open.find(([a, b]) => a <= t && t < b);
      const next = open.find(([a]) => a > t);
      let key;
      let values;
      if (current && current[1] - current[0] >= 2 * WEEK) {
        key = 'always';
      } else if (current) {
        key = current[1] - t < soon ? 'closing' : 'open';
        values = { time: clock(current[1]), min: String(current[1] - t) };
      } else {
        key = next[0] - t < soon ? 'opening' : 'closed';
        const day = Math.floor(next[0] / DAY);
        values = { min: String(next[0] - t), when: day === Math.floor(t / DAY) ? clock(next[0]) : `${nameOf(((day % 7) + 7) % 7)} ${clock(next[0])}` };
      }
      status.classList.toggle('is-open', Boolean(current));
      const template = words(key);
      const same = `${key}|${template}|${values?.time}|${values?.when}`;
      if (same === said && template.includes('{min}')) {
        // Only the minutes moved: they roll on their own
        const num = text.lastElementChild?.querySelector('.kodza-footer-venue__num');
        if (num && num.lastElementChild?.textContent !== values.min) roll(num, span(values.min), moving);
        return;
      }
      if (same === said) return;
      said = same;
      roll(text, line(template, values ?? {}), moving);
    };

    // All hours: the window opens to the whole week and the week slides back to its place, so the
    // days come out above and below today's row; closing folds it back the same way
    all?.addEventListener('click', () => {
      const opening = !root.classList.contains('is-all');
      const from = frame.offsetHeight;
      root.classList.toggle('is-all', opening);
      all.setAttribute('aria-expanded', String(opening));
      hide();
      if (reduceMotion) return;
      const to = opening ? week.offsetHeight : place.h;
      const shift = [{ translate: `0 ${opening ? -place.y : 0}px` }, { translate: `0 ${opening ? 0 : -place.y}px` }];
      const timing = { duration: 600, easing: EASE };
      [frame, week, pill].forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
      root.classList.add('is-folding');
      frame.animate([{ height: `${from}px` }, { height: `${to}px` }], timing).finished.then(() => root.classList.remove('is-folding'), () => {});
      week.animate(shift, timing);
      pill.animate(shift, timing);
    }, { signal });

    // The words as written stay for a first paint without the script; they're replaced at once
    text.replaceChildren();
    read();
    update(false);

    // The rows may wrap on another line when the width changes, and the phone layout comes and goes
    const sized = new ResizeObserver(() => {
      measure();
      hide();
    });
    sized.observe(root);

    // Every minute on the minute, and at once when the tab comes back or the clock changes
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
      read();
      update(true);
    });
    watch.observe(root, { attributes: true, attributeFilter: ['data-timezone', 'data-now', 'data-soon'] });
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      watch.disconnect();
      sized.disconnect();
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
