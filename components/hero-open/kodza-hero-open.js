// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Hero Open
// Works out, at the place's own time, whether it's open: the week's hours are read from
// data-hours ("mon closed; tue-thu 12:00-14:30, 18:00-23:00; fri 18:00-01:00", a later rule
// replaces an earlier one for its days, an end before the start runs past midnight) and its
// time zone from data-timezone (an IANA name such as Europe/Paris; the visitor's own time when
// it's missing or unknown). The status then reads "Open now · closes 23:00", "Closes in 25 min"
// in the last hour (data-soon, in minutes), "Closed · opens Wed 12:00" or "Opens in 20 min".
// Its words come from the status's data-open, data-closing, data-closed and data-opening, with
// {time}, {min} and {when} in them, and the day names follow the page's lang. It's written again
// on every minute; a change of words rolls the line, a change of minutes rolls the number.
// data-now ("tue 22:35") pins the clock, to check a schedule before it goes live.
(() => {
  const SELECTOR = '.kodza-hero-open';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const DAY = 1440; // minutes
  const WEEK = 7 * DAY;
  const WORDS = {
    open: 'Open now · closes {time}',
    closing: 'Closes in {min} min',
    closed: 'Closed · opens {when}',
    opening: 'Opens in {min} min',
    always: 'Open 24/7',
  };

  const minutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + (m || 0);
  };
  const clock = (n) => {
    const m = ((n % DAY) + DAY) % DAY;
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  };

  // The open stretches of three weeks running (the one before and the one after catch the
  // nights across Sunday), in minutes from this Monday 00:00, joined where one runs into the next
  const stretches = (text) => {
    const week = new Map();
    (text || '').toLowerCase().split(';').forEach((rule) => {
      const m = rule.trim().match(/^([a-z]{3})(?:\s*-\s*([a-z]{3}))?\b(.*)$/);
      const from = DAYS.indexOf(m?.[1]);
      const to = m?.[2] ? DAYS.indexOf(m[2]) : from;
      if (from < 0 || to < 0) return;
      const ranges = [...m[3].matchAll(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/g)].map(([, a, b]) => [minutes(a), minutes(b)]);
      for (let d = from; ; d = (d + 1) % 7) {
        week.set(d, ranges);
        if (d === to) break;
      }
    });
    const all = [];
    [-WEEK, 0, WEEK].forEach((shift) => week.forEach((ranges, d) => ranges.forEach(([a, b]) => {
      const start = shift + d * DAY + a;
      all.push([start, start + ((b - a + DAY - 1) % DAY) + 1]);
    })));
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

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const status = root.querySelector('.kodza-hero-open__status');
    const text = status?.querySelector('.kodza-hero-open__text');
    if (!text) return;
    const words = (key) => status.dataset[key] || WORDS[key];
    const lang = root.closest('[lang]')?.lang || undefined;
    let dayName;
    try {
      dayName = new Intl.DateTimeFormat(lang, { weekday: 'short', timeZone: 'UTC' });
    } catch {
      dayName = new Intl.DateTimeFormat('en', { weekday: 'short', timeZone: 'UTC' });
    }
    const day = (n) => dayName.format(new Date(Date.UTC(2024, 0, 1 + Math.floor((((n % WEEK) + WEEK) % WEEK) / DAY))));

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
      const timing = { duration: 700, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
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
        const num = Object.assign(document.createElement('span'), { className: 'kodza-hero-open__num' });
        num.append(span(values.min));
        el.append(num);
      });
      return el;
    };

    let open = [];
    let format = null;
    let shown = '';
    const now = () => {
      const pinned = at(root.dataset.now);
      if (pinned !== null) return pinned;
      const parts = Object.fromEntries(format.formatToParts(new Date()).map((p) => [p.type, p.value]));
      return DAYS.indexOf(parts.weekday.toLowerCase()) * DAY + minutes(`${parts.hour}:${parts.minute}`);
    };
    const read = () => {
      open = stretches(root.dataset.hours);
      format = zoned(root.dataset.timezone);
    };

    const update = (moving) => {
      if (!open.length) return;
      const t = now();
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
        const today = Math.floor(next[0] / DAY) === Math.floor(t / DAY);
        values = { min: String(next[0] - t), when: today ? clock(next[0]) : `${day(next[0])} ${clock(next[0])}` };
      }
      root.classList.toggle('is-open', Boolean(current));
      root.classList.toggle('is-closed', !current);
      const template = words(key);
      const same = `${key}|${template}|${values?.time}|${values?.when}`;
      if (same === shown && template.includes('{min}')) {
        // Only the minutes moved: they roll on their own
        const num = text.lastElementChild?.querySelector('.kodza-hero-open__num');
        if (num && num.lastElementChild?.textContent !== values.min) roll(num, span(values.min), moving);
        return;
      }
      if (same === shown) return;
      shown = same;
      roll(text, line(template, values ?? {}), moving);
    };

    // The words as written stay for a first paint without the script; they're replaced at once
    text.replaceChildren();
    read();
    update(false);

    // Every minute on the minute, and at once when the tab comes back or the hours change
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
    watch.observe(root, { attributes: true, attributeFilter: ['data-hours', 'data-timezone', 'data-now', 'data-soon'] });
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      watch.disconnect();
    });
  }

  // Kodza lifecycle, the same in every component: `kodza:init` starts the instances inside
  // event.detail.root (the whole page by default), `kodza:destroy` stops them and puts their
  // markup back. For themes and apps that swap content without a page load. Each running root
  // keeps its markup as written under KODZA, shared by every Kodza script on the page: a Kodza
  // component inside another one is saved as written, not half-started, and stopped with it.
  const KODZA = Symbol.for('kodza');
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
    if (root.classList.contains('is-ready')) return; // already running, maybe from another copy of this script
    // Rendered by React (data-kodza-manual): React starts it, with an init aimed at that markup once
    // it has hydrated it. Any earlier start would change markup React has not taken over yet
    const owner = root.closest('[data-kodza-manual]');
    if (owner && !(scope && owner.contains(scope))) return;
    const controller = new AbortController();
    const saved = { html: written(root), attrs: attrsOf(root), stop: () => destroy(root) };
    instances.set(root, { controller, saved });
    root[KODZA] = saved;
    mount(root, controller.signal);
    root.classList.add('is-ready');
  });
  const destroy = (scope) => find(scope).forEach((root) => {
    const instance = instances.get(root);
    if (!instance) return;
    instances.delete(root);
    // The Kodza components running inside it stop first: once its markup is put back, their own
    // script could not find them any more
    root.querySelectorAll('*').forEach((el) => el[KODZA]?.stop());
    instance.controller.abort();
    delete root[KODZA];
    put(root, instance.saved);
  });
  document.addEventListener('kodza:init', (event) => init(event.detail?.root));
  document.addEventListener('kodza:destroy', (event) => destroy(event.detail?.root));
  init();
  // Loaded in <head>, the script runs before the markup exists: once more when it is parsed
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(), { once: true });
})();
