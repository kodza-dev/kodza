// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Profile Card
// The clock where the person is: its digits roll in the first time the card is seen, then roll on
// the minute, right to left like a counter. With data-hours it says whether they take calls now or
// when they are back, and the gap to the visitor ("1 h behind you") is worked out in their browser.
// Save contact writes a vCard from the card itself (name, role, company, place, links, bio and the
// portrait, cropped square), so the person lands in the phone's contacts with a face.
// Settings, on the root: data-timezone (an IANA zone, "Europe/Lisbon"; no clock without it),
// data-hours ("mon-fri 09:00-18:30; sat 10:00-13:00"), data-locale (the day names; the page's lang
// without it), data-now ("2026-11-19T14:59:50", the clock starts there: demos and tests). Each
// word below can be set with data-text-<name>. The timings are the constants under WORDS.
// Saving fires `kodza:save` on the card (detail: { name, file, vcard }): cancel it to send the
// vCard elsewhere instead of downloading it.
(() => {
  const SELECTOR = '[data-kodza-profile-card]';
  const WORDS = {
    ahead: '{gap} ahead of you',
    behind: '{gap} behind you',
    same: 'Same time as you',
    open: 'Takes calls now',
    closed: 'Back {day}, {time}',
    today: 'today',
    tomorrow: 'tomorrow',
    saved: 'Saved as .vcf',
    said: '{name} saved to your downloads',
  };
  const ROLL = 520; // ms: a digit, or a line, rolls
  const CARRY = 70; // ms: each digit starts this much after its neighbour
  const SAVED = 1800; // ms the button says it saved, a reading time: not scaled by the pace
  const SEEN = 0.6; // share of the clock in view before its digits roll in
  const PHOTO = 256; // px: the side of the square portrait put in the vCard
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
  const two = (n) => String(n).padStart(2, '0');
  const clock = (text) => {
    const [h, m] = text.split(':').map(Number);
    return h * 60 + m;
  };
  const hhmm = (min) => `${two(Math.floor(min / 60) % 24)}:${two(min % 60)}`;

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
        const begin = clock(from);
        const end = clock(to);
        return [begin, end > begin ? end : end + 1440];
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
  const offsetText = (min) => `${min < 0 ? '-' : '+'}${two(Math.floor(Math.abs(min) / 60))}:${two(Math.abs(min) % 60)}`;
  const gapText = (min) => {
    const h = Math.floor(Math.abs(min) / 60);
    const m = Math.abs(min) % 60;
    return h ? `${h} h${m ? ` ${two(m)}` : ''}` : `${m} min`;
  };

  // vCard 3.0: values escaped, lines folded at 75 characters, CRLF between them
  const esc = (text) => String(text).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
  const fold = (line) => {
    const parts = [];
    for (let i = 0; i < line.length; i += i ? 74 : 75) parts.push((i ? ' ' : '') + line.slice(i, i + (i ? 74 : 75)));
    return parts.join('\r\n');
  };
  const fileOf = (name) => `${name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'contact'}.vcf`;
  // The portrait as a square JPEG, cut a little above the middle where faces sit. An image from
  // another site without CORS cannot be read: the vCard goes without it
  const photoOf = (img) => {
    if (!img || img.tagName !== 'IMG' || !img.complete || !img.naturalWidth) return '';
    try {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const side = Math.min(w, h);
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = Math.min(PHOTO, side);
      canvas.getContext('2d').drawImage(img, (w - side) / 2, (h - side) * 0.3, side, side, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.82).split(',')[1] || '';
    } catch {
      return '';
    }
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const data = root.dataset;
    const word = (key) => data[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const part = (name) => root.querySelector(`.kodza-profile-card__${name}`);
    const make = (tag, name, text) => {
      const el = document.createElement(tag);
      if (name) el.className = name.split(' ').map((n) => `kodza-profile-card__${n}`).join(' ');
      if (text != null) el.textContent = text;
      return el;
    };
    const moving = () => !reduceMotion && paceOf(root) > 0;
    const timers = new Set();
    const later = (run, ms) => {
      const id = setTimeout(() => {
        timers.delete(id);
        run();
      }, ms);
      timers.add(id);
      return id;
    };

    // A window whose text rolls: the old one up and out, the new one up from below
    const roll = (box, text, animate, delay = 0) => {
      const prev = box.lastElementChild;
      if (prev?.textContent === text) return;
      const next = make('span', '', text);
      box.append(next);
      if (!prev) return;
      if (!animate) {
        prev.remove();
        return;
      }
      const timing = { duration: ROLL * paceOf(root), delay, easing: ARRIVE };
      prev.setAttribute('aria-hidden', 'true');
      prev.animate([{ transform: 'none' }, { transform: 'translateY(-110%)' }], { ...timing, fill: 'forwards' })
        .finished.then(() => prev.remove(), () => {});
      next.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], { ...timing, fill: 'backwards' });
    };

    const status = make('span', 'announce');
    status.setAttribute('role', 'status');
    root.append(status);
    let saying = 0;
    const say = (text) => {
      clearTimeout(saying);
      status.textContent = '';
      saying = later(() => { status.textContent = text; }, 60);
    };

    // The clock
    const clockBox = part('clock');
    const time = part('time');
    const reply = part('status');
    const gap = part('gap');
    let cells = [];
    let said;
    let lines = [];
    let mark;
    if (clockBox && time && data.timezone) {
      said = make('span', 'said');
      const digits = make('span', 'digits');
      digits.setAttribute('aria-hidden', 'true');
      cells = [...'00:00'].map((char) => {
        const cell = make('span', char === ':' ? 'cell colon' : 'cell');
        if (char === ':') cell.append(make('span', '', ':'));
        digits.append(cell);
        return cell;
      });
      time.replaceChildren(said, digits);
      [reply, gap].forEach((box) => {
        if (!box) return;
        const line = make('span', 'line');
        box.replaceChildren(line);
        lines.push(line);
      });
      if (reply) {
        mark = make('span', 'mark');
        reply.prepend(mark);
      }
    }

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

    // Takes calls now, or the day and time they are back: today, tomorrow or the day's name
    const replyOf = (wall) => {
      const open = hours[wall.weekday].find(([begin, end]) => begin <= wall.min && wall.min < end)
        || hours[(wall.weekday + 6) % 7].find(([, end]) => wall.min < end - 1440);
      if (open) return { open: true, text: word('open') };
      for (let ahead = 0; ahead < 7; ahead += 1) {
        const i = (wall.weekday + ahead) % 7;
        const next = hours[i].find(([begin]) => ahead > 0 || begin > wall.min);
        if (!next) continue;
        const day = ahead === 0 ? word('today') : ahead === 1 ? word('tomorrow') : dayName.format(Date.UTC(2024, 0, 1 + i)); // 1 Jan 2024 is a Monday
        return { open: false, text: fill(word('closed'), { day, time: hhmm(next[0]) }) };
      }
      return null;
    };

    let waiting = false;
    const update = (animate) => {
      if (!cells.length) return;
      const at = now();
      const wall = wallAt(at, zone);
      const text = `${two(wall.hour)}:${two(wall.minute)}`;
      time.dateTime = `${wall.year}-${two(wall.month)}-${two(wall.day)}T${text}${offsetText(wall.offset)}`;
      said.textContent = text;
      const moves = animate && !waiting;
      let rank = 0;
      for (let i = cells.length - 1; i >= 0; i -= 1) {
        if (cells[i].lastElementChild?.textContent === text[i]) continue;
        roll(cells[i], text[i], moves, CARRY * paceOf(root) * rank);
        rank += 1;
      }
      if (gap) {
        const diff = wall.offset - wallAt(at).offset;
        roll(lines[lines.length - 1], diff ? fill(word(diff > 0 ? 'ahead' : 'behind'), { gap: gapText(diff) }) : word('same'), moves);
      }
      if (reply) {
        const answer = hours && replyOf(wall);
        reply.hidden = !answer;
        if (answer) {
          root.classList.toggle('is-open', answer.open);
          roll(lines[0], answer.text, moves);
        }
      }
    };

    // The first time the clock is seen, left to right: the digits, the dot, then the two lines
    const enter = () => {
      waiting = false;
      root.classList.remove('is-waiting');
      if (!moving()) return;
      const pace = paceOf(root);
      const timing = (rank) => ({ duration: ROLL * pace, delay: CARRY * pace * rank, easing: ARRIVE, fill: 'backwards' });
      cells.forEach((cell, i) => cell.lastElementChild.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], timing(i)));
      mark?.animate([{ transform: 'scale(0)' }, { transform: 'none' }], timing(cells.length));
      lines.forEach((line, i) => line.lastElementChild?.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], timing(cells.length + 1 + i)));
    };

    let timer = 0;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        update(moving());
        schedule();
      }, 60000 - (now() % 60000) + 30);
    };
    let sight;
    let watch;
    if (cells.length) {
      read();
      update(false);
      root.classList.add('is-live');
      if (moving() && 'IntersectionObserver' in window) {
        waiting = true;
        root.classList.add('is-waiting');
        sight = new IntersectionObserver((entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          sight.disconnect();
          enter();
        }, { threshold: SEEN });
        sight.observe(clockBox);
      }
      // On the minute, the place's minute (data-now may set seconds), and again on coming back to
      // the tab: a timer asleep in the background is late
      schedule();
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) return;
        update(moving());
        schedule();
      }, { signal });
      watch = new MutationObserver(() => {
        read();
        update(moving());
        schedule();
      });
      watch.observe(root, { attributes: true, attributeFilter: ['data-timezone', 'data-hours', 'data-now', 'data-locale'] });
    }

    // Save contact
    const save = part('save');
    const label = part('label');
    if (save && label) {
      const first = label.textContent.trim();
      label.replaceChildren(make('span', '', first));
      let back = 0;
      const text = (el) => el?.textContent.trim().replace(/\s+/g, ' ') || '';
      const vcardOf = () => {
        const name = text(part('name'));
        const words = name.split(' ');
        const family = words.length > 1 ? words.pop() : '';
        const card = ['BEGIN:VCARD', 'VERSION:3.0', `N:${esc(family)};${esc(words.join(' '))};;;`, `FN:${esc(name)}`];
        const company = text(part('company'));
        const role = text(part('role'));
        const place = text(part('place'));
        const bio = text(part('bio'));
        if (company) card.push(`ORG:${esc(company)}`);
        if (role) card.push(`TITLE:${esc(role)}`);
        root.querySelectorAll('.kodza-profile-card__link').forEach((link) => {
          const href = link.getAttribute('href') || '';
          if (href.startsWith('mailto:')) card.push(`EMAIL;TYPE=INTERNET:${esc(decodeURIComponent(href.slice(7).split('?')[0]))}`);
          else if (href.startsWith('tel:')) card.push(`TEL;TYPE=WORK,VOICE:${esc(href.slice(4))}`);
          else if (/^https?:/.test(link.href)) card.push(`URL:${esc(link.href)}`);
        });
        if (place) card.push(`ADR;TYPE=WORK:;;;${esc(place)};;;`);
        if (data.timezone) card.push(`TZ:${offsetText(wallAt(now(), data.timezone).offset)}`);
        if (bio) card.push(`NOTE:${esc(bio)}`);
        const photo = photoOf(part('portrait'));
        if (photo) card.push(`PHOTO;ENCODING=b;TYPE=JPEG:${photo}`);
        card.push('END:VCARD');
        return { name, vcard: `${card.map(fold).join('\r\n')}\r\n` };
      };
      save.addEventListener('click', () => {
        const { name, vcard } = vcardOf();
        const file = fileOf(name);
        const asked = new CustomEvent('kodza:save', { detail: { name, file, vcard }, bubbles: true, cancelable: true });
        if (root.dispatchEvent(asked)) {
          const url = URL.createObjectURL(new Blob([vcard], { type: 'text/vcard;charset=utf-8' }));
          const link = document.createElement('a');
          link.href = url;
          link.download = file;
          link.hidden = true;
          root.append(link);
          link.click();
          link.remove();
          later(() => URL.revokeObjectURL(url), 4000);
          say(fill(word('said'), { name }));
        }
        save.classList.add('is-saved');
        roll(label, word('saved'), moving());
        clearTimeout(back);
        back = later(() => {
          save.classList.remove('is-saved');
          roll(label, first, moving());
        }, SAVED);
      }, { signal });
    }

    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      timers.forEach(clearTimeout);
      sight?.disconnect();
      watch?.disconnect();
      root.classList.remove('is-live', 'is-open', 'is-waiting');
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
