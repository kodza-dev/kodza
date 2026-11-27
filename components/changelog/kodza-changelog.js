// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Changelog
// The script adds a filter by type (an ink pill slides between the types, the releases that stay
// glide into place), a line at the last release this reader saw, with a dot on the ones that came
// after, and a link on each version that copies itself. Without it, the list simply shows.
// Markup: one .kodza-changelog__entry per release, its version in .kodza-changelog__version, its
// date in a <time datetime="YYYY-MM-DD">, its notes as <li data-type="new|improved|fixed|…">.
// Settings: the --kz-changelog-* variables in the CSS, the texts and constants below, and on the
// root:
//   data-seen="2.3.0" (or a date, "2026-10-02")  the last release the reader saw, when your site
//                    knows it. Without it, this browser keeps it (localStorage, it never leaves
//                    the page); "none" draws no line.
//   data-key="app"   where this browser keeps it, one per changelog of a site (the page's path
//                    by default)
//   data-anchor="v"  what the links start with (#v2-4-0)
//   data-text-*      the texts below (data-text-copied="…")
(() => {
  const SELECTOR = '.kodza-changelog';
  // The texts the script writes. {n} is a number, {version} a version; the *One texts are for one
  const WORDS = {
    all: 'All',
    new: 'New', // the pills of notes that have no tag of their own
    improved: 'Improved',
    fixed: 'Fixed',
    filters: 'Filter the changes',
    shown: '{n} changes shown',
    shownOne: '1 change shown',
    since: '{n} new since your last visit',
    sinceOne: '1 new since your last visit',
    seen: 'Your last visit',
    fresh: 'New since your last visit', // the dot by a version, read out
    copy: 'Copy the link to {version}',
    copied: 'Link copied',
    failed: 'In the address bar', // the browser refused the clipboard: the link is in the bar
  };
  const ORDER = ['new', 'improved', 'fixed']; // the order of the pills; other types follow as they come
  const OUT = 220; // ms, the notes that leave when a filter changes
  const MOVE = 650; // ms, what stays glides to its place, what comes in rises, the list takes its height
  const STAGGER = 60; // ms between two notes coming in
  const COPIED = 1800; // ms "Link copied" stays: a reading time, not motion
  const ENTER_AT = 0.12; // share of the screen, from the bottom, a release crosses to make its way in
  const STORE = 'kodza-changelog:'; // what the localStorage keys start with
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4L12 5.6"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/></svg>';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };

  // What this browser had seen when the tab opened the page, read once: a reload keeps the line,
  // two changelogs with one key agree
  const remembered = new Map();
  const recall = (key) => {
    if (!remembered.has(key)) {
      let seen = null;
      try {
        const held = sessionStorage.getItem(`${STORE}${key}:before`);
        seen = JSON.parse(held ?? localStorage.getItem(STORE + key) ?? 'null');
        if (held == null) sessionStorage.setItem(`${STORE}${key}:before`, JSON.stringify(seen));
      } catch {
        seen = null;
      }
      remembered.set(key, seen);
    }
    return remembered.get(key);
  };
  const keep = (key, value) => {
    try {
      localStorage.setItem(STORE + key, JSON.stringify(value));
    } catch {}
  };

  const norm = (version) => String(version || '').trim().replace(/^v(?=\d)/i, '');
  const day = (value) => (/^\d{4}-\d{2}-\d{2}/.test(value || '') ? value.slice(0, 10) : '');
  // The first release the reader had seen: by its version, or else the first one out by that day.
  // All of them came after: their number. None found: -1
  const findSeen = (releases, version, date) => {
    const at = version ? releases.findIndex((release) => norm(release.name) === norm(version)) : -1;
    if (at >= 0 || !date) return at;
    const older = releases.findIndex((release) => release.date && release.date <= date);
    return older >= 0 ? older : releases.length;
  };

  async function writeText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
      document.body.append(area);
      area.select();
      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch {}
      area.remove();
      return ok;
    }
  }
  // A plain click copies; with a modifier key the link opens as links do
  const plain = (event) => !event.button && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace;
    const make = maker('kodza-changelog');
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const count = (key, n) => (n === 1 ? word(`${key}One`) : word(key)).replace('{n}', n);

    const entries = [...root.querySelectorAll('.kodza-changelog__entry')];
    if (!entries.length) return;
    const releases = entries.map((entry) => {
      const version = entry.querySelector('.kodza-changelog__version');
      const time = entry.querySelector('time');
      return {
        entry,
        version,
        time,
        name: version?.textContent.trim() || '',
        date: day(time?.getAttribute('datetime')),
        notes: [...entry.querySelectorAll('li[data-type]')],
      };
    });
    const notes = releases.flatMap((release) => release.notes);

    const timers = new Set();
    const later = (fn, ms) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        fn();
      }, ms);
      timers.add(timer);
      return timer;
    };
    const status = make('span', 'status', { role: 'status' });
    root.append(status);
    let saying = 0;
    const say = (text) => {
      clearTimeout(saying);
      status.textContent = '';
      saying = later(() => { status.textContent = text; }, 60);
    };

    // The last visit: the site's word for it, or what this browser kept, then this visit is kept
    const asked = (root.dataset.seen || '').trim();
    const key = root.dataset.key || location.pathname;
    let at = -1;
    if (asked && asked !== 'none') at = findSeen(releases, asked, day(asked));
    else if (!asked) {
      const stored = recall(key);
      if (stored) at = findSeen(releases, stored.version, day(stored.date));
      if (releases[0].name) keep(key, { version: releases[0].name, date: releases[0].date });
    }
    const fresh = Math.max(at, 0);
    let seen = null;
    if (at > 0 && at < releases.length) {
      seen = make('div', 'seen', { role: 'separator', 'aria-label': word('seen') });
      seen.append(make('span', 'seen-label', { 'aria-hidden': 'true' }, word('seen')), make('span', 'seen-line'));
      entries[at].before(seen);
    }

    // Each version becomes a link to its release, which copies itself
    const aim = (target) => entries.forEach((entry) => entry.classList.toggle('is-target', entry === target));
    const prefix = root.dataset.anchor ?? 'v';
    releases.forEach((release, i) => {
      const { entry, version, time, name } = release;
      if (!version || !name) return;
      if (!entry.id) {
        const base = `${prefix}${norm(name)}`.replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '') || 'release';
        let id = base;
        for (let n = 2; document.getElementById(id); n += 1) id = `${base}-${n}`;
        entry.id = id;
      }
      release.id = entry.id;
      const label = word('copy').replace('{version}', name);
      const link = make('a', 'link', { href: `#${entry.id}`, 'aria-label': i < fresh ? `${label}. ${word('fresh')}` : label });
      const rise = make('span', 'rise');
      rise.append(make('span', null, null, name));
      link.append(rise);
      if (i < fresh) link.append(make('span', 'dot', { 'aria-hidden': 'true' }));
      link.insertAdjacentHTML('beforeend', ICON);
      version.replaceChildren(link);

      let stamp = null;
      let copied = null;
      if (time) {
        stamp = make('span', 'stamp');
        copied = make('span', 'copied', { 'aria-hidden': 'true' }, word('copied'));
        time.replaceWith(stamp);
        stamp.append(time, copied);
      }
      let timer = 0;
      link.addEventListener('click', async (event) => {
        if (!plain(event)) return;
        event.preventDefault();
        const address = `${location.href.split('#')[0]}#${entry.id}`;
        // A sandboxed frame may refuse to touch the address bar: the link is copied all the same
        try {
          history.replaceState(history.state, '', `#${entry.id}`);
        } catch {}
        aim(entry);
        const ok = await writeText(address);
        if (signal.aborted) return;
        const text = word(ok ? 'copied' : 'failed');
        say(text);
        if (!stamp) return;
        copied.textContent = text;
        stamp.classList.add('is-copied');
        clearTimeout(timer);
        timer = later(() => stamp.classList.remove('is-copied'), COPIED);
      }, { signal });
    });
    const fromHash = () => {
      let hash = '';
      try {
        hash = decodeURIComponent(location.hash.slice(1));
      } catch {}
      return hash ? releases.find((release) => release.id === hash) : null;
    };
    const landed = fromHash();
    if (landed) {
      aim(landed.entry);
      landed.entry.scrollIntoView({ block: 'start' });
    }
    window.addEventListener('hashchange', () => aim(fromHash()?.entry || null), { signal });

    // The bar: a pill per type, and how many came since the last visit
    const found = [];
    notes.forEach((note) => {
      if (note.dataset.type && !found.includes(note.dataset.type)) found.push(note.dataset.type);
    });
    const rank = (type) => (ORDER.includes(type) ? ORDER.indexOf(type) : ORDER.length + found.indexOf(type));
    const types = [...found].sort((a, b) => rank(a) - rank(b));
    const labelOf = (type) => notes.find((note) => note.dataset.type === type)?.querySelector('.kodza-changelog__type')?.textContent.trim()
      || (WORDS[type] ? word(type) : type[0].toUpperCase() + type.slice(1));
    const countOf = (type) => (type === 'all' ? notes.length : notes.filter((note) => note.dataset.type === type).length);

    const pills = [];
    let pillsBox = null;
    let current = null;
    if (types.length > 1 || fresh) {
      const bar = make('div', 'bar');
      if (types.length > 1) {
        pillsBox = make('div', 'pills', { role: 'group', 'aria-label': word('filters') });
        const mirror = make('span', 'mirror', { 'aria-hidden': 'true' });
        pillsBox.append(make('span', 'indicator', { 'aria-hidden': 'true' }));
        ['all', ...types].forEach((type) => {
          const label = type === 'all' ? word('all') : labelOf(type);
          const n = String(countOf(type));
          const pill = make('button', 'pill', { type: 'button', 'aria-pressed': String(type === 'all'), 'data-filter': type });
          pill.append(make('span', null, null, label), make('span', 'num', null, n));
          const ghost = make('span', 'ghost');
          ghost.append(make('span', null, null, label), make('span', 'num', null, n));
          pillsBox.append(pill);
          mirror.append(ghost);
          pill.addEventListener('click', () => select(pill), { signal });
          pills.push(pill);
        });
        pillsBox.append(mirror);
        bar.append(pillsBox);
        current = pills[0];
      }
      if (fresh) {
        const since = make('p', 'since');
        since.append(make('span', 'dot', { 'aria-hidden': 'true' }), make('span', null, null, count('since', fresh)));
        bar.append(since);
      }
      root.prepend(bar);
    }

    // The ink pill and the copy of the labels are cut to the chosen pill, over the whole row
    // (which scrolls sideways in a narrow column)
    const place = (pill) => {
      const end = pills[pills.length - 1];
      const full = Math.max(pillsBox.clientWidth, end.offsetLeft + end.offsetWidth + parseFloat(getComputedStyle(pillsBox).paddingRight));
      pillsBox.style.setProperty('--kz-ind-w', `${full}px`);
      pillsBox.style.setProperty('--kz-ind-l', `${pill.offsetLeft}px`);
      pillsBox.style.setProperty('--kz-ind-r', `${full - pill.offsetLeft - pill.offsetWidth}px`);
    };
    if (current) {
      place(current);
      const resize = new ResizeObserver(() => place(current));
      resize.observe(pillsBox);
      document.fonts?.ready.then(() => !signal.aborted && place(current));
      signal.addEventListener('abort', () => resize.disconnect());
    }

    // The filter, in two beats: the notes that go shrink away, then what stays glides to its new
    // place while what comes in rises, one after the other, and the list takes its new height
    const blocks = seen ? [...entries, seen] : entries;
    let filter = 'all';
    let token = 0;
    let outs = [];
    let running = [];
    const planFor = (type) => {
      const note = new Map(notes.map((item) => [item, type === 'all' || item.dataset.type === type]));
      const entry = new Map(releases.map((release) => [release.entry, type === 'all' || release.notes.some((item) => note.get(item))]));
      // The line stays while there is a release on each side of it
      const line = !!seen && entries.slice(0, at).some((item) => entry.get(item)) && entries.slice(at).some((item) => entry.get(item));
      return { note, entry, line };
    };
    const commit = (plan) => {
      notes.forEach((item) => { item.hidden = !plan.note.get(item); });
      entries.forEach((item) => { item.hidden = !plan.entry.get(item); });
      if (seen) seen.hidden = !plan.line;
    };
    const apply = async (type) => {
      const id = ++token;
      outs.forEach((animation) => animation.cancel());
      running.forEach((animation) => animation.finish());
      outs = [];
      running = [];
      root.classList.remove('is-moving');
      const plan = planFor(type);
      if (still) return commit(plan);

      const leaving = [];
      releases.forEach((release) => {
        if (release.entry.hidden) return;
        if (!plan.entry.get(release.entry)) leaving.push(release.entry);
        else release.notes.forEach((item) => { if (!item.hidden && !plan.note.get(item)) leaving.push(item); });
      });
      if (seen && !seen.hidden && !plan.line) leaving.push(seen);
      if (leaving.length) {
        outs = leaving.map((el) => el.animate([
          { opacity: 1, transform: 'none', transformOrigin: 'left top' },
          { opacity: 0, transform: 'scale(0.96)', transformOrigin: 'left top' },
        ], { duration: OUT * pace, easing: 'ease-in', fill: 'forwards' }));
        await Promise.all(outs.map((animation) => animation.finished.catch(() => {})));
        if (id !== token) return;
      }

      const tracked = [...blocks, ...notes];
      const before = new Map();
      tracked.forEach((el) => { if (!el.hidden) before.set(el, el.getBoundingClientRect().top); });
      const from = root.offsetHeight;
      commit(plan);
      outs.forEach((animation) => animation.cancel());
      outs = [];
      const to = root.offsetHeight;
      const after = new Map();
      tracked.forEach((el) => { if (!el.hidden) after.set(el, el.getBoundingClientRect().top); });
      // Screen pixels to layout pixels, under a parent scaled by a transform
      const k = root.getBoundingClientRect().width / root.offsetWidth || 1;
      const timing = { duration: MOVE * pace, easing: EASE };
      const slide = (el, dy) => {
        if (Math.abs(dy) >= 1) running.push(el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], timing));
      };
      const coming = [];
      blocks.forEach((el) => {
        if (!after.has(el)) return;
        if (!before.has(el)) coming.push(el);
        else slide(el, (before.get(el) - after.get(el)) / k);
      });
      // A note that stays moves inside its release, which moves too: only its own share
      releases.forEach((release) => {
        if (!after.has(release.entry) || !before.has(release.entry)) return;
        const base = before.get(release.entry) - after.get(release.entry);
        release.notes.forEach((item) => {
          if (!after.has(item)) return;
          if (!before.has(item)) coming.push(item);
          else slide(item, (before.get(item) - after.get(item) - base) / k);
        });
      });
      coming.sort((a, b) => after.get(a) - after.get(b)).forEach((el, i) => {
        running.push(el.animate([
          { opacity: 0, transform: 'translateY(12px)' },
          { opacity: 1, transform: 'none' },
        ], { ...timing, delay: (80 + i * STAGGER) * pace, fill: 'backwards' }));
      });
      if (from !== to) {
        root.classList.add('is-moving');
        const height = root.animate([{ height: `${from}px` }, { height: `${to}px` }], timing);
        running.push(height);
        height.finished.then(() => id === token && root.classList.remove('is-moving'), () => {});
      }
    };
    const select = (pill) => {
      const type = pill.dataset.filter;
      if (type === filter) return;
      filter = type;
      current = pill;
      pills.forEach((item) => item.setAttribute('aria-pressed', String(item === pill)));
      place(pill);
      if (pillsBox.scrollWidth > pillsBox.clientWidth + 1) {
        pillsBox.scrollTo({ left: pill.offsetLeft - (pillsBox.clientWidth - pill.offsetWidth) / 2, behavior: still ? 'auto' : 'smooth' });
      }
      const shown = countOf(type);
      say(count('shown', shown));
      root.dispatchEvent(new CustomEvent('kodza:filter', { detail: { filter: type, count: shown }, bubbles: true }));
      apply(type);
    };

    // The way in, once per release as it comes into view (the CSS draws it): kodza:replay plays it
    // again
    let watch = null;
    const enter = () => {
      watch?.disconnect();
      if (still || !('IntersectionObserver' in window)) {
        blocks.forEach((el) => el.classList.add('is-in'));
        return;
      }
      watch = new IntersectionObserver((records, observer) => records.forEach((record) => {
        if (!record.isIntersecting) return;
        record.target.classList.add('is-in');
        observer.unobserve(record.target);
      }), { rootMargin: `0px 0px ${-ENTER_AT * 100}% 0px` });
      blocks.forEach((el) => watch.observe(el));
    };
    // Hidden without a transition, then shown with one
    root.classList.add('is-instant');
    const first = requestAnimationFrame(() => {
      root.offsetWidth;
      if (!still) root.classList.remove('is-instant');
      if (pillsBox) root.classList.add('is-live');
      enter();
    });
    root.addEventListener('kodza:replay', () => {
      root.classList.add('is-instant');
      blocks.forEach((el) => el.classList.remove('is-in'));
      root.offsetWidth;
      if (!still) root.classList.remove('is-instant');
      enter();
    }, { signal });

    signal.addEventListener('abort', () => {
      token += 1;
      cancelAnimationFrame(first);
      watch?.disconnect();
      outs.forEach((animation) => animation.cancel());
      running.forEach((animation) => animation.cancel());
      timers.forEach((timer) => clearTimeout(timer));
    });
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
