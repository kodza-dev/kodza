// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Relative Time
// "3 minutes ago" on a real <time datetime>: the gap is written in the page's language
// (Intl.RelativeTimeFormat), kept up to date on the right beat (each minute the first hour, then
// each hour, then each day), and only the part that changes rolls. Hover, focus or a tap shows the
// exact date in the visitor's time zone. Without the script, the text inside <time>.
// Settings, on each <time>: datetime (with its zone: "2026-11-19T09:40:00Z" or "+01:00"),
// data-style ("long", "short" or "narrow"), data-limit (past that many days, the date itself),
// data-locale (the page's lang without it) and data-now (the clock starts there and runs on: demos
// and tests). Each word below can be set with data-text-<name>. The timings are the constants
// under WORDS.
(() => {
  const SELECTOR = '.kodza-relative-time';
  const WORDS = {
    now: 'just now',
  };
  const ROLL = 520; // ms: a part of the line rolls
  const HOVER_IN = 120; // ms: the pointer rests on the date before the bubble opens
  const HOVER_OUT = 160; // ms: and leaves it before it closes
  const EDGE = 8; // px: the bubble keeps this far from the edges of the screen
  const ARRIVE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  // The unit each gap is written in, up to how many seconds, and how often it changes
  const MINUTE = 60;
  const HOUR = 3600;
  const DAY = 86400;
  const UNITS = [
    ['minute', HOUR, MINUTE],
    ['hour', DAY, HOUR],
    ['day', 7 * DAY, DAY],
    ['week', 30 * DAY, 7 * DAY],
    ['month', 365 * DAY, 30.4375 * DAY],
    ['year', Infinity, 365.25 * DAY],
  ];

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  let uid = 0;

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const data = root.dataset;
    const word = (key) => data[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const make = (tag, name, text) => {
      const el = document.createElement(tag);
      if (name) el.className = `kodza-relative-time__${name}`;
      if (text != null) el.textContent = text;
      return el;
    };
    const moving = () => !reduceMotion && paceOf(root) > 0;

    // The line read by a screen reader, the line drawn in three parts (the words before the
    // number, the number, the words after it), and the bubble with the exact date
    const said = make('span', 'said');
    const face = make('span', 'face');
    face.setAttribute('aria-hidden', 'true');
    const parts = ['head', 'number', 'tail'].map((name) => {
      const part = make('span', `part kodza-relative-time__${name}`);
      part.append(make('span', '', ''));
      face.append(part);
      return part;
    });
    const tip = make('span', 'tip');
    tip.id = `kodza-relative-time-${(uid += 1)}`;
    tip.setAttribute('role', 'tooltip');
    tip.hidden = true;
    const day = make('span', 'day');
    const hour = make('span', 'hour');
    tip.append(day, hour);
    root.replaceChildren(said, face, tip);
    root.setAttribute('aria-describedby', tip.id);
    // Inside a link or a button, that one takes the focus; on its own, the date does
    const host = root.parentElement?.closest('a[href], button, summary, [tabindex]');
    if (!host) root.tabIndex = 0;

    // A part rolls when its words change, and its box eases to the new width instead of jumping.
    // A part that comes or goes opens from nothing or closes to nothing
    const write = (part, text, animate) => {
      const prev = part.lastElementChild;
      if (prev.textContent === text) return;
      const from = part.offsetWidth;
      const next = make('span', '', text);
      part.append(next);
      if (!animate) {
        prev.remove();
        return;
      }
      const timing = { duration: ROLL * paceOf(root), easing: ARRIVE };
      part.animate([{ width: `${from}px` }, { width: `${next.offsetWidth}px` }], timing);
      prev.animate([{ transform: 'none' }, { transform: 'translateY(-110%)' }], { ...timing, fill: 'forwards' })
        .finished.then(() => prev.remove(), () => {});
      next.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], { ...timing, fill: 'backwards' });
    };

    let moment;
    let shift = 0;
    let lang;
    let words;
    let dateOnly;
    let dayFormat;
    let hourFormat;
    const read = () => {
      moment = Date.parse(root.getAttribute('datetime') || '');
      const set = Date.parse(data.now || '');
      shift = Number.isNaN(set) ? 0 : set - Date.now();
      lang = data.locale || root.closest('[lang]')?.lang || undefined;
      const style = ['long', 'short', 'narrow'].includes(data.style) ? data.style : 'long';
      try {
        words = new Intl.RelativeTimeFormat(lang, { numeric: 'auto', style });
      } catch {
        lang = undefined;
        words = new Intl.RelativeTimeFormat(lang, { numeric: 'auto', style });
      }
      dateOnly = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', year: 'numeric' });
      dayFormat = new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      hourFormat = new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
    };
    const now = () => Date.now() + shift;

    // The gap → its three parts, and in how many ms it next changes (0: it never does)
    const gapOf = (at) => {
      const seconds = (moment - at) / 1000; // in the future above 0
      const past = seconds <= 0;
      const span = Math.abs(seconds);
      const limit = parseFloat(data.limit);
      if (past && limit >= 0 && span >= limit * DAY) return { parts: ['', '', dateOnly.format(moment)], wait: 0 };
      if (span < MINUTE) {
        if (past) return { parts: ['', '', word('now')], wait: (MINUTE - span) * 1000 };
      }
      const [unit, , step] = UNITS.find(([, upTo]) => span < upTo);
      const count = Math.max(1, Math.floor(span / step));
      const text = words.formatToParts(past ? -count : count, unit);
      const at0 = text.findIndex((p) => p.type !== 'literal');
      const number = text.filter((p) => p.type !== 'literal').map((p) => p.value).join('');
      const head = at0 < 0 ? '' : text.slice(0, at0).map((p) => p.value).join('');
      const tail = text.slice(at0 < 0 ? 0 : at0).filter((p) => p.type === 'literal').map((p) => p.value).join('');
      const into = span % step;
      const wait = past ? step - into : into || step;
      return { parts: [head, number, tail], wait: wait * 1000 };
    };

    let timer = 0;
    const update = (animate) => {
      clearTimeout(timer);
      if (Number.isNaN(moment)) return;
      const at = now();
      const gap = gapOf(at);
      said.textContent = gap.parts.join('');
      parts.forEach((part, i) => write(part, gap.parts[i], animate));
      day.textContent = dayFormat.format(moment);
      hour.textContent = hourFormat.format(moment);
      // A timer waits at most 24 days; the next update sets the following one
      if (gap.wait) timer = setTimeout(() => update(moving()), Math.min(gap.wait + 40, 2 ** 31 - 1));
    };

    // The bubble: above the date, below when there is no room, slid back inside the screen. The
    // pointer opens it after a beat; focus and a tap at once
    const place = () => {
      root.style.removeProperty('--kz-relative-time-shift');
      root.classList.remove('is-below');
      const box = root.getBoundingClientRect();
      const scale = box.width / root.offsetWidth || 1;
      const width = tip.offsetWidth * scale;
      const height = tip.offsetHeight * scale;
      const middle = box.left + box.width / 2;
      const room = document.documentElement.clientWidth;
      let push = 0;
      if (middle - width / 2 < EDGE) push = EDGE - (middle - width / 2);
      else if (middle + width / 2 > room - EDGE) push = room - EDGE - (middle + width / 2);
      if (push) root.style.setProperty('--kz-relative-time-shift', `${push / scale}px`);
      root.classList.toggle('is-below', box.top - height - 10 * scale < EDGE);
    };
    let wait = 0;
    let gone = 0;
    const open = () => {
      clearTimeout(wait);
      clearTimeout(gone);
      if (root.classList.contains('is-open')) return;
      tip.hidden = false;
      place(); // measuring also lays the closed bubble out, so it can move from there
      root.classList.add('is-open');
    };
    const close = () => {
      clearTimeout(wait);
      if (!root.classList.contains('is-open')) return;
      root.classList.remove('is-open');
      gone = setTimeout(() => { tip.hidden = true; }, 220 * paceOf(root));
    };
    const later = (fn, ms) => {
      clearTimeout(wait);
      wait = setTimeout(fn, ms * paceOf(root));
    };
    root.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse') later(open, HOVER_IN);
    }, { signal });
    root.addEventListener('pointerleave', (event) => {
      if (event.pointerType === 'mouse') later(close, HOVER_OUT);
    }, { signal });
    root.addEventListener('click', (event) => {
      if (host || event.pointerType === 'mouse') return;
      if (root.classList.contains('is-open')) close();
      else open();
    }, { signal });
    const focusable = host || root;
    focusable.addEventListener('focus', () => {
      if (focusable.matches(':focus-visible')) open();
    }, { signal });
    focusable.addEventListener('blur', close, { signal });
    // Escape puts it away without moving the focus; a tap elsewhere too
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && root.classList.contains('is-open')) close();
    }, { signal });
    document.addEventListener('pointerdown', (event) => {
      if (!root.contains(event.target)) close();
    }, { signal });

    read();
    update(false);
    root.classList.add('is-live');

    // Back on the tab, a timer asleep in the background is late
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) update(moving());
    }, { signal });
    const watch = new MutationObserver(() => {
      read();
      update(moving());
    });
    watch.observe(root, { attributes: true, attributeFilter: ['datetime', 'data-now', 'data-locale', 'data-style', 'data-limit'] });
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      clearTimeout(wait);
      clearTimeout(gone);
      watch.disconnect();
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
