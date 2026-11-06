// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Contact Split
// The contact section in one paste: the ways to reach you on the left, a short form on the right.
// The status line works out from the hours whether someone is there right now ("Available now ·
// replies within 2 h", "Back tomorrow 9:00"), in your timezone, wherever the visitor is, next to
// the time it is where you are ("10:30 in Bordeaux"), whose minutes roll as they pass. The email
// copies in one click (the address rolls into "Copied." and back). On send, the form rolls up into
// the thanks; if the send fails, what was typed stays, with the address to write to instead.
// The form is a real one: it goes to its `action` (name, email, message), the usual way, or with
// fetch under data-send="fetch". A hidden field catches robots: filled, nothing is sent.
// Settings, on the section: data-hours ("mon-fri 09:00-18:00; sat 10:00-13:00"), data-timezone
// (yours, such as "Europe/Paris"), data-reply ("2 h", in the status line), data-locale (the names
// of days, "en-GB" by default), data-now ("2026-11-05T09:30", to start the clock there in a demo). The
// --venue modifier is a place with opening hours: the status says open or closed, and the week is
// written from data-hours into the list .kodza-contact-split__week. On the form: data-send,
// data-failed (the message when a fetch send fails). The words of the script, and the timings,
// are the constants below.
// The page hears kodza:submit (cancelable, event.detail.data the FormData) before the send.
(() => {
  const SELECTOR = '.kodza-contact-split';
  const WORDS = {
    available: 'Available now · replies within {reply}',
    availableNow: 'Available now',
    back: 'Back {day} {time}',
    backToday: 'Back at {time}',
    open: 'Open now · until {time}',
    opens: 'Closed · opens {day} {time}',
    opensToday: 'Closed · opens at {time}',
    tomorrow: 'tomorrow',
    closed: 'Closed',
    copied: 'Copied.',
    cantCopy: "This page can't copy.",
    left: '{left} left', // the message's count, from 80 % of its maxlength
    name: 'Your name, so we know who we write to.',
    email: 'That email does not look right.',
    message: 'A line or two about the project.',
    failed: 'That did not go through. Write to {email} instead.',
    failedPlain: 'That did not go through. Try again.',
  };
  const LOCALE = 'en-GB'; // the names of days, without data-locale
  const STAGE = 900; // ms: the form rolls up and the thanks comes in
  const LAG_IN = 60; // ms: the thanks starts this much after the form
  const LINE = 450; // ms: a line rolls (the status, the copied address)
  const FIT = 220; // ms: the message box grows with the text
  const COPIED_FOR = 1800; // ms the "Copied." line stays (a reading time, not motion)
  const ROLL = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const ARRIVE = 'cubic-bezier(0.22, 1, 0.36, 1)';

  const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const DAY = 864e5;
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
  const hm = (min) => `${Math.floor(min / 60) % 24}:${String(min % 60).padStart(2, '0')}`;

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
  // The date and the minute of the day at a moment, in a time zone (the visitor's without one)
  const partsAt = (date, zone) => {
    const parts = {};
    new Intl.DateTimeFormat('en-CA', {
      timeZone: zone || undefined, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(date).forEach(({ type, value }) => { parts[type] = value; });
    return { day: `${parts.year}-${parts.month}-${parts.day}`, min: (Number(parts.hour) % 24) * 60 + Number(parts.minute) };
  };
  const writeText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // An older browser, or a frame without clipboard rights: the old way
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
      document.body.append(area);
      area.select();
      let done = false;
      try {
        done = document.execCommand('copy');
      } catch {
        done = false;
      }
      area.remove();
      return done;
    }
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const data = root.dataset;
    const q = (name) => root.querySelector(`.kodza-contact-split__${name}`);
    const make = (tag, name, text) => {
      const el = document.createElement(tag);
      el.className = `kodza-contact-split__${name}`;
      if (text != null) el.textContent = text;
      return el;
    };
    const timers = new Set();
    const later = (fn, ms) => {
      const id = setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
      return id;
    };
    signal.addEventListener('abort', () => timers.forEach(clearTimeout));

    // A line that rolls: the old words go up, the new ones come from below, the width follows
    const roll = (box, text, name) => {
      const old = box.lastElementChild;
      if (old?.textContent === text) return;
      box.getAnimations({ subtree: true }).forEach((animation) => animation.finish());
      [...box.children].slice(0, -1).forEach((el) => el.remove());
      const line = make('span', name, text);
      if (still || !old || !box.offsetParent) {
        box.replaceChildren(line);
        return;
      }
      const from = box.offsetWidth;
      box.append(line);
      old.setAttribute('aria-hidden', 'true');
      const to = line.offsetWidth;
      box.classList.add('is-rolling');
      const timing = { duration: LINE * pace, easing: ARRIVE };
      box.animate([{ width: `${from}px` }, { width: `${to}px` }], timing);
      old.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-110%)' }], { ...timing, fill: 'forwards' });
      line.animate([{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }], timing).onfinish = () => {
        old.remove();
        // A newer roll may have started meanwhile: it keeps the clip
        if (box.lastElementChild === line) box.classList.remove('is-rolling');
      };
    };

    // The status: open or not right now, in the place's timezone
    const status = q('status');
    const state = q('state');
    const week = q('week');
    const venue = root.classList.contains('kodza-contact-split--venue');
    const hours = data.hours ? hoursOf(data.hours) : null;
    const zone = data.timezone || '';
    const locale = data.locale || LOCALE;
    const dayName = (i, style) => {
      try {
        return new Intl.DateTimeFormat(locale, { weekday: style, timeZone: 'UTC' }).format(Date.UTC(2024, 0, 1 + i)); // 1 Jan 2024 is a Monday
      } catch {
        return DAYS[i];
      }
    };
    // data-now starts the clock at a set moment (a demo), and it runs from there
    const born = Date.now();
    const fixed = (data.now || '').match(/^(\d{4}-\d{2}-\d{2})T(\d{1,2}:\d{2})/);
    const nowAt = () => {
      if (fixed) return { day: fixed[1], min: (clock(fixed[2]) + Math.floor((Date.now() - born) / 6e4)) % 1440 };
      try {
        return partsAt(new Date(), zone);
      } catch {
        return partsAt(new Date());
      }
    };
    const readStatus = (now) => {
      const today = (new Date(Date.parse(`${now.day}T00:00:00Z`)).getUTCDay() + 6) % 7;
      // Open now: a range of today, or one of yesterday that runs past midnight
      const yesterday = (today + 6) % 7;
      const open = hours[today].find(([start, end]) => start <= now.min && now.min < end)
        || hours[yesterday].map(([start, end]) => [start - 1440, end - 1440]).find(([, end]) => now.min < end);
      if (open) return { today, open: true, until: open[1] };
      for (let ahead = 0; ahead < 8; ahead += 1) {
        const i = (today + ahead) % 7;
        const next = hours[i].find(([start]) => ahead > 0 || start > now.min);
        if (next) return { today, open: false, ahead, day: ahead === 1 ? WORDS.tomorrow : dayName(i, 'short'), time: hm(next[0]) };
      }
      return { today, open: false, ahead: -1 };
    };
    const writeWeek = (today) => {
      if (!week) return;
      week.replaceChildren(...DAYS.map((key, i) => {
        const row = make('li', 'day');
        const times = hours[i].map(([start, end]) => `${hm(start)} – ${hm(end % 1440)}`).join(' · ');
        row.append(document.createElement('span'), document.createElement('span'));
        row.firstChild.textContent = dayName(i, 'long');
        row.lastChild.textContent = times || WORDS.closed;
        row.classList.toggle('is-today', i === today);
        row.classList.toggle('is-closed', !times);
        return row;
      }));
    };
    // The time where you are, written from data-text on .kodza-contact-split__time ("{time} in Bordeaux")
    const time = q('time');
    let shownDay = -1;
    const update = () => {
      const at = nowAt();
      const now = readStatus(at);
      root.classList.toggle('is-open', now.open);
      let text;
      if (now.open) text = venue ? fill(WORDS.open, { time: hm(now.until % 1440) }) : fill(data.reply ? WORDS.available : WORDS.availableNow, { reply: data.reply || '' });
      else if (now.ahead < 0) text = WORDS.closed;
      else if (now.ahead === 0) text = fill(venue ? WORDS.opensToday : WORDS.backToday, now);
      else text = fill(venue ? WORDS.opens : WORDS.back, now);
      roll(state, text, 'line');
      if (time) roll(time, fill(time.dataset.text || '{time}', { time: hm(at.min) }), 'at');
      if (now.today !== shownDay) {
        shownDay = now.today;
        writeWeek(now.today);
      }
    };
    if (hours && status && state) {
      status.hidden = false;
      update();
      // A look at the clock as each minute turns (zones are whole minutes apart)
      const next = () => later(() => {
        update();
        next();
      }, 6e4 - ((Date.now() - (fixed ? born : 0)) % 6e4) + 20);
      next();
    }

    // The email copies in one click: the address rolls into "Copied." and back
    const copy = q('copy');
    const said = copy?.querySelector('.kodza-contact-split__roll');
    const heard = copy?.nextElementSibling;
    const address = copy?.dataset.copy || '';
    let back = 0;
    copy?.addEventListener('click', async () => {
      const done = await writeText(address);
      if (signal.aborted || !said) return;
      clearTimeout(back);
      roll(said, done ? WORDS.copied : WORDS.cantCopy, 'said');
      if (heard) heard.textContent = done ? WORDS.copied : WORDS.cantCopy;
      back = later(() => {
        roll(said, address, 'said');
        if (heard) heard.textContent = '';
      }, COPIED_FOR);
    }, { signal });

    // The form
    const form = q('form');
    if (!form) return;
    const stage = q('stage');
    const panel = q('panel');
    const done = q('done');
    const thanks = q('thanks');
    const button = q('send');
    const error = q('error');
    const nameInput = form.elements.name;
    const emailInput = form.elements.email;
    const area = form.elements.message;
    const trap = form.elements.website;
    const box = area?.closest('.kodza-contact-split__box');
    const count = q('count');
    const thanksText = thanks?.textContent || '';

    // The message box grows with the text, up to its max-height, then scrolls
    const fit = (animate) => {
      if (!area) return;
      const from = area.offsetHeight;
      area.style.height = 'auto';
      const full = area.scrollHeight;
      area.style.height = `${full}px`;
      const to = area.offsetHeight;
      area.classList.toggle('is-long', full > to);
      if (animate && !still && from && from !== to) area.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: FIT * pace, easing: ARRIVE });
    };
    const counted = () => {
      const max = area?.maxLength;
      if (!box || !count || !(max > 0)) return;
      const used = area.value.length;
      box.classList.toggle('is-near', used >= max * 0.8);
      count.textContent = fill(WORDS.left, { left: max - used });
    };
    area?.addEventListener('input', () => {
      fit(true);
      counted();
    }, { signal });
    // Mod+Enter sends from the message, where Enter makes a new line
    area?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      form.requestSubmit(button);
    }, { signal });

    // Checked before the send: the error under the field at fault, the focus on it
    let errorField = null;
    const clean = () => {
      errorField?.removeAttribute('aria-invalid');
      errorField = null;
      form.classList.remove('is-error');
    };
    const fail = (field, message, focus = field) => {
      clean();
      error.textContent = message;
      form.classList.add('is-error');
      errorField = field;
      if (field.matches('input, textarea')) field.setAttribute('aria-invalid', 'true');
      focus?.focus();
    };
    const invalid = () => {
      if (nameInput && !nameInput.value.trim()) return fail(nameInput, WORDS.name) || true;
      if (emailInput && (!emailInput.value.trim() || !emailInput.validity.valid)) return fail(emailInput, WORDS.email) || true;
      if (area && !area.value.trim()) return fail(area, WORDS.message) || true;
      return false;
    };
    form.noValidate = true;
    form.addEventListener('input', () => {
      if (!errorField) return;
      const fixed = errorField === emailInput ? emailInput.value.trim() && emailInput.validity.valid : errorField.value?.trim();
      if (fixed) clean();
    }, { signal });

    // Two blocks in one place: the one leaving rolls up (down on the way back), the other follows,
    // and the box between them changes height with them
    const swap = (cell, out, into, backwards) => {
      cell.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
      out.hidden = false;
      into.hidden = false;
      if (still) {
        out.hidden = true;
        return;
      }
      const hOut = out.offsetHeight;
      const hIn = into.offsetHeight;
      cell.classList.add('is-rolling');
      const timing = { duration: STAGE * pace, easing: ROLL };
      const travel = backwards ? [hIn, -hIn] : [-hOut, hOut];
      const grow = cell.animate(
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
        cell.classList.remove('is-rolling');
        out.getAnimations().forEach((animation) => animation.cancel());
        grow.cancel();
      };
    };

    let sent = false;
    const finish = (values) => {
      sent = true;
      const name = String(values.get('name') || '').trim().split(/\s+/)[0];
      const email = String(values.get('email') || '').trim();
      if (thanks) thanks.textContent = name && thanks.dataset.text ? fill(thanks.dataset.text, { name }) : thanksText;
      done.querySelectorAll('[data-value]').forEach((el) => {
        if (el.dataset.value === 'email' && email) el.textContent = email;
        if (el.dataset.value === 'name' && name) el.textContent = name;
      });
      swap(stage, panel, done);
      if (thanks) {
        thanks.tabIndex = -1;
        thanks.focus({ preventScroll: true });
      }
    };

    // The send: kodza:submit first (the page can take it over), then the form's action, the usual
    // way, or with fetch under data-send="fetch"
    let sending = false;
    const send = async (values) => {
      sending = true;
      button.setAttribute('aria-busy', 'true');
      const method = (form.getAttribute('method') || 'get').toUpperCase();
      const url = method === 'GET' ? `${form.action}${form.action.includes('?') ? '&' : '?'}${new URLSearchParams(values)}` : form.action;
      try {
        const response = await fetch(url, { method, body: method === 'GET' ? undefined : values, headers: { Accept: 'application/json' }, signal });
        if (!response.ok) throw new Error(String(response.status));
        sending = false;
        finish(values);
      } catch {
        if (signal.aborted) return;
        sending = false;
        // What was typed stays; the address is the way out
        fail(button, form.dataset.failed || (address ? fill(WORDS.failed, { email: address }) : WORDS.failedPlain), null);
      }
      button.removeAttribute('aria-busy');
    };
    form.addEventListener('submit', (event) => {
      if (sent || sending || invalid()) {
        event.preventDefault();
        return;
      }
      clean();
      const values = new FormData(form);
      // A robot filled the hidden field: it gets its thanks, nothing leaves
      if (trap?.value) {
        event.preventDefault();
        finish(values);
        return;
      }
      values.delete('website');
      if (!form.dispatchEvent(new CustomEvent('kodza:submit', { detail: { data: values }, bubbles: true, cancelable: true }))) {
        event.preventDefault();
        finish(values);
        return;
      }
      if (form.dataset.send !== 'fetch') return; // sent the usual way
      event.preventDefault();
      send(values);
    }, { signal });

    // Write another (the form's reset): the empty form comes back down
    form.addEventListener('reset', () => requestAnimationFrame(() => {
      if (signal.aborted || !sent) return;
      const inside = done.contains(document.activeElement);
      sent = false;
      clean();
      if (area) {
        area.style.height = '';
        area.classList.remove('is-long');
      }
      box?.classList.remove('is-near');
      swap(stage, done, panel, true);
      if (inside) nameInput?.focus({ preventScroll: true });
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
