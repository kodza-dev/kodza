// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Roadmap
// Turns a list of work items into a timeline: the quarters (or the months) in columns, a bar over
// the weeks of each item, a line at today's date. The status reads from the stroke, never from a
// colour: a solid bar is shipped, an outline is in progress (shaded up to today), a dashed one is
// planned. A bar opens its detail; under 560 px wide, the timeline becomes a list per period.
// Each <li> of the list: data-status="shipped|progress|planned", a .kodza-roadmap__name, and two
// <time datetime="YYYY-MM-DD"> for the start and the end (one alone makes a milestone, drawn as a
// diamond). Everything else in the <li> (the text, a link) is shown in its detail. data-scale=
// "month": months instead of quarters. data-from, data-until (YYYY-MM): the first and the last
// period, from the first start to the last end by default. data-locale: the month names.
// Without the script, the list simply shows.
// Settings: the --kz-roadmap-* variables in the CSS, the words below (data-text-<key> on the root),
// the constants under them.
(() => {
  const SELECTOR = '.kodza-roadmap';
  const WORDS = {
    shipped: 'Shipped',
    progress: 'In progress',
    planned: 'Planned',
    today: 'Today',
    now: 'Now', // on a phone, beside the period we are in
    quarter: 'Q{q} {year}',
    weeks: '{n} weeks',
    days: '{n} days',
    roadmap: 'Roadmap', // the name of the timeline, when it has no title
  };
  const STATUSES = ['shipped', 'progress', 'planned'];
  const NARROW = 560; // px, under this width the timeline becomes a list
  const ENTER_AT = 0.3; // the share of the timeline in view before it draws
  const DAY = 86400000;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): 0 moves nothing, like
  // reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const chevron = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5"/></svg>';

  // Days are counted from 1 Jan 1970 and months from year 0, in UTC: no time zone, no summer time
  const dayOf = (text) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(text || '').trim());
    return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / DAY : null;
  };
  const monthOf = (text) => {
    const m = /^(\d{4})-(\d{2})/.exec(String(text || '').trim());
    return m ? +m[1] * 12 + (+m[2] - 1) : null;
  };
  const monthOfDay = (d) => {
    const date = new Date(d * DAY);
    return date.getUTCFullYear() * 12 + date.getUTCMonth();
  };
  const startOf = (m) => Date.UTC(Math.floor(m / 12), m % 12, 1) / DAY;

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers stop on its 'abort' event),
  // so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const make = maker('kodza-roadmap');
    const locale = root.dataset.locale || document.documentElement.lang || undefined;
    const step = root.dataset.scale === 'month' ? 1 : 3; // months in a period

    // The items, as written: a start, an end (the same day for a milestone), a status
    const source = root.querySelector('.kodza-roadmap__items');
    const items = [...(source?.children || [])].map((li) => {
      const times = [...li.querySelectorAll('time')].map((t) => dayOf(t.getAttribute('datetime') || t.textContent));
      const a = times[0];
      if (a == null) return null;
      const b = times[1] != null && times[1] >= a ? times[1] : a;
      const status = STATUSES.includes(li.dataset.status) ? li.dataset.status : 'planned';
      const name = li.querySelector('.kodza-roadmap__name')?.textContent.trim() || '';
      const about = [...li.children]
        .filter((el) => !el.matches('.kodza-roadmap__name, .kodza-roadmap__when, .kodza-roadmap__state'))
        .map((el) => el.cloneNode(true));
      return { a, b, milestone: b === a, status, name, about };
    }).filter(Boolean);
    if (!items.length) return;

    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY;
    const floor = (m) => m - (m % step);
    const m0 = floor(monthOf(root.dataset.from) ?? Math.min(...items.map((it) => monthOfDay(it.a))));
    const m1 = Math.max(m0, floor(monthOf(root.dataset.until) ?? Math.max(...items.map((it) => monthOfDay(it.b)))));
    const periods = [];
    for (let m = m0; m <= m1; m += step) periods.push({ m, a: startOf(m), b: startOf(m + step) });
    const r0 = periods[0].a;
    const r1 = periods[periods.length - 1].b;
    const at = (d) => ((Math.max(r0, Math.min(r1, d)) - r0) / (r1 - r0)) * 100;
    const current = periods.findIndex((p) => today >= p.a && today < p.b);

    const monthShort = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
    const monthYear = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric', timeZone: 'UTC' });
    const dayMonth = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
    const full = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    const labelOf = (p, i) => {
      if (step === 3) return word('quarter').replace('{q}', (p.m % 12) / 3 + 1).replace('{year}', Math.floor(p.m / 12));
      return (i === 0 || p.m % 12 === 0 ? monthYear : monthShort).format(p.a * DAY);
    };
    const whenOf = (it) => (it.milestone ? full.format(it.a * DAY) : full.formatRange(it.a * DAY, it.b * DAY));
    const lengthOf = (it) => {
      const days = it.b - it.a + 1;
      return days >= 14 ? word('weeks').replace('{n}', Math.round(days / 7)) : word('days').replace('{n}', days);
    };

    // The card: the title and the counts, the timeline, the list for a phone
    const title = root.querySelector('.kodza-roadmap__title');
    const head = make('div', 'head');
    if (title) head.append(title);
    const legend = make('p', 'legend');
    STATUSES.forEach((status) => {
      const count = items.filter((it) => it.status === status).length;
      if (!count) return;
      const key = make('span', 'key');
      key.append(make('span', `mark mark--${status}`, { 'aria-hidden': 'true' }), `${word(status)} `, make('span', 'count', null, count));
      legend.append(key);
    });
    head.append(legend);
    root.setAttribute('role', 'group');
    root.setAttribute('aria-label', title?.textContent.trim() || word('roadmap'));

    const lanes = []; // per item: its rows in both views, opened and closed together
    const detailOf = (it) => {
      const detail = make('div', 'detail', { inert: '' });
      const inner = make('div', 'detail-inner');
      const meta = make('p', 'meta', null, [whenOf(it), it.milestone ? null : lengthOf(it), word(it.status)].filter(Boolean).join(' · '));
      inner.append(meta, ...it.about.map((el) => el.cloneNode(true)));
      detail.append(inner);
      return detail;
    };
    const said = (it) => make('span', 'hidden', null, `, ${word(it.status)}, ${whenOf(it)}`);

    // The timeline: the periods across, the rules and today behind, a row per item
    const chart = make('div', 'chart');
    const rules = make('div', 'rules', { 'aria-hidden': 'true' });
    periods.forEach((p, i) => {
      const rule = make('span', 'rule');
      rule.style.left = `${at(p.a)}%`;
      rule.style.setProperty('--kz-roadmap-i', i);
      rules.append(rule);
    });
    const close = make('span', 'rule');
    close.style.left = '100%';
    close.style.setProperty('--kz-roadmap-i', periods.length);
    rules.append(close);
    const axis = make('div', 'axis', { 'aria-hidden': 'true' });
    const cols = make('div', 'periods');
    periods.forEach((p, i) => {
      const label = make('span', `period${i === current ? ' is-now' : ''}`, null, labelOf(p, i));
      label.style.left = `${at(p.a)}%`;
      label.style.setProperty('--kz-roadmap-i', i);
      cols.append(label);
    });
    axis.append(make('span'), cols);
    const list = make('ul', 'lanes', { role: 'list' });
    items.forEach((it, i) => {
      const lane = make('li', 'lane');
      const row = make('button', 'row', { type: 'button', 'aria-expanded': 'false' });
      const name = make('span', 'name');
      name.insertAdjacentHTML('afterbegin', chevron);
      const mask = make('span', 'mask');
      mask.append(make('span', 'label', null, it.name));
      name.append(mask, said(it));
      const track = make('span', 'track', { 'aria-hidden': 'true' });
      const bar = make('span', `bar bar--${it.status}${it.milestone ? ' bar--milestone' : ''}`);
      if (it.milestone) {
        const x = at(it.a + 0.5);
        bar.style.left = `${x}%`;
        bar.append(make('span', 'diamond'), make('span', 'state', null, dayMonth.format(it.a * DAY)));
        if (x > 75) bar.classList.add('is-flip');
      } else {
        bar.style.left = `${at(it.a)}%`;
        bar.style.width = `${at(it.b + 1) - at(it.a)}%`;
        bar.append(make('span', 'state', null, word(it.status)));
        if (it.status === 'progress') {
          const done = Math.max(0, Math.min(1, (today + 0.5 - it.a) / (it.b + 1 - it.a)));
          bar.style.setProperty('--kz-roadmap-done', `${(done * 100).toFixed(2)}%`);
        }
      }
      track.append(bar);
      row.append(name, track);
      lane.style.setProperty('--kz-roadmap-i', i);
      lane.append(row, detailOf(it));
      list.append(lane);
      lanes[i] = [lane];
    });
    chart.append(rules, axis, list);
    root.style.setProperty('--kz-roadmap-n', items.length);
    if (today >= r0 && today < r1) {
      const marks = make('div', 'marks', { 'aria-hidden': 'true' });
      const x = at(today + 0.5);
      const mark = make('span', 'today');
      mark.style.left = `${x}%`;
      const pill = make('span', `pill${x < 10 ? ' is-start' : x > 90 ? ' is-end' : ''}`, null, `${word('today')} · ${dayMonth.format(today * DAY)}`);
      pill.style.left = `${x}%`;
      marks.append(mark, pill);
      chart.append(marks);
      chart.classList.add('has-today');
    }

    // The list for a phone: one group per period, in the order things end
    const phone = make('div', 'list');
    periods.forEach((p, pi) => {
      const ending = items.map((it, i) => [it, i]).filter(([it]) => it.b >= p.a && it.b < p.b);
      if (!ending.length) return;
      const group = make('div', 'group');
      const heading = make('p', 'group-title', null, labelOf(p, pi));
      if (pi === current) heading.append(make('span', 'now', null, word('now')));
      const ul = make('ul', 'items-list', { role: 'list' });
      ending.forEach(([it, i]) => {
        const lane = make('li', 'lane');
        lane.style.setProperty('--kz-roadmap-i', i);
        const row = make('button', 'item', { type: 'button', 'aria-expanded': 'false' });
        row.append(
          make('span', `mark mark--${it.status}${it.milestone ? ' mark--milestone' : ''}`, { 'aria-hidden': 'true' }),
          make('span', 'label', null, it.name),
          make('span', 'end', { 'aria-hidden': 'true' }, dayMonth.format(it.b * DAY)),
          said(it),
        );
        row.insertAdjacentHTML('beforeend', chevron);
        lane.append(row, detailOf(it));
        ul.append(lane);
        lanes[i].push(lane);
      });
      group.append(heading, ul);
      phone.append(group);
    });
    root.append(head, chart, phone);

    // One item open at a time, in both views at once
    let open = -1;
    const set = (i, on) => lanes[i].forEach((lane) => {
      lane.classList.toggle('is-open', on);
      lane.firstElementChild.setAttribute('aria-expanded', String(on));
      lane.lastElementChild.toggleAttribute('inert', !on);
    });
    lanes.forEach((group, i) => group.forEach((lane) => {
      lane.firstElementChild.addEventListener('click', () => {
        if (open !== -1) set(open, false);
        open = open === i ? -1 : i;
        if (open !== -1) set(open, true);
      }, { signal });
    }));

    // A label that does not fit its bar is left out: the name says it on the left
    const fit = () => {
      if (root.classList.contains('is-narrow')) return;
      list.querySelectorAll('.kodza-roadmap__bar:not(.kodza-roadmap__bar--milestone)').forEach((bar) => {
        const state = bar.firstElementChild;
        bar.classList.toggle('is-tight', state.scrollWidth + 4 > bar.clientWidth);
      });
    };
    const resize = new ResizeObserver(() => {
      root.classList.toggle('is-narrow', root.clientWidth < NARROW);
      fit();
    });
    resize.observe(root);
    document.fonts?.ready.then(() => !signal.aborted && fit());

    // The rules draw down, the bars uncover row after row, then today's line and its date
    const enter = () => {
      root.classList.toggle('is-instant', still);
      root.classList.add('is-drawn');
    };
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

    // kodza:replay on the root draws it again
    root.addEventListener('kodza:replay', () => {
      if (!root.classList.contains('is-drawn')) return;
      root.classList.add('is-instant');
      root.classList.remove('is-drawn');
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
