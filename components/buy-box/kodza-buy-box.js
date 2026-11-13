// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Buy Box
// The right-hand column of a product page, as one form: price, colours, sizes, quantity, Add to
// cart, when it ships, and the details. A colour rolls its name into the legend, a size slides the
// ink pill across and rolls the price, the quantity rolls its digits, the button rolls to "Added".
// The shipping line counts in the workshop's time zone: before the cut-off it ships today.
// Every change says which variant is chosen (kodza:variant-change), for a gallery on the page.
// Settings: the --kz-buy-box-* variables in the CSS, the data-* attributes and data-text-* on the
// root, the constants below. The cart itself is the Cart engine, further down: a small cart kept in
// the browser, or your platform's (Shopify, WooCommerce) through its events.
(() => {
  const SELECTOR = '.kodza-buy-box';

  // Timings, in milliseconds (times the site's pace)
  const ROLL = 420; // a word or a figure rolling
  const SLIDE = 520; // the ink pill going from one size to another
  const FOLD = 560; // a detail opening or closing
  const LEAD = 0.7; // the front edge of the pill arrives in this share of the slide
  const LAG = 0.14; // the back edge waits this share of the slide before it follows
  const SAMPLES = 24; // keyframes per slide: each edge follows its own curve
  // Not motion, so not paced
  const HOLD = 1600; // how long "Added" stays before "Add to cart" comes back

  // What the script writes, in English unless the root says otherwise (data-text-<key>)
  const WORDS = {
    added: 'Added', // in the button, once it is in the cart
    today: 'Order before {time}, ships today', // before the cut-off, on a shipping day
    tomorrow: 'Order now, ships tomorrow',
    later: 'Order now, ships {day}', // {day}: the weekday, in the page's language
  };

  // The shipping line: data-cutoff="14:00", data-ship-days="mon-fri" (or "mon,wed,fri"),
  // data-timezone="Europe/Paris" (the visitor's own without it), data-now="tue 22:35" to pin the clock
  const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const TICK = '<svg class="kodza-buy-box__tick" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4 8-9" pathLength="1" /></svg>';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };

  const FORMS = 'form[action$="/cart/add"], form[data-kodza-cart-add]';
  // The picture of what was added: in the form, or around it, without leaving its own card
  const pictureFor = (source) => {
    for (let el = source, i = 0; el instanceof Element && i < 4; el = el.parentElement, i++) {
      if (i && el.querySelectorAll(FORMS).length > 1) break;
      const img = el.querySelector('img');
      if (img) return img;
    }
    return null;
  };

  // The days a parcel leaves, from "mon-fri" or "mon,wed,fri" (Monday is 0)
  const shipDays = (text) => {
    const days = new Set();
    String(text || 'mon-fri').toLowerCase().split(',').forEach((part) => {
      const [a, b] = part.trim().split('-').map((d) => DAYS.indexOf(d.trim().slice(0, 3)));
      if (a < 0) return;
      for (let d = a; ; d = (d + 1) % 7) {
        days.add(d);
        if (b == null || b < 0 || d === b) break;
      }
    });
    return days.size ? days : new Set([0, 1, 2, 3, 4]);
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const ms = (t) => (still ? 0 : t * pace);
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const fill = (text, values) => text.replace(/\{(\w+)\}/g, (all, name) => values[name] ?? all);
    const lang = root.closest('[lang]')?.lang || undefined;

    const q = (name) => root.querySelector(`.kodza-buy-box__${name}`);
    const timers = new Set();
    const moving = new Set();
    const later = (fn, t) => {
      const id = setTimeout(() => {
        timers.delete(id);
        fn();
      }, t);
      timers.add(id);
      return id;
    };
    const play = (el, frames, options) => {
      const animation = el.animate(frames, options);
      moving.add(animation);
      animation.finished.then(() => moving.delete(animation), () => moving.delete(animation));
      return animation;
    };
    signal.addEventListener('abort', () => {
      timers.forEach(clearTimeout);
      moving.forEach((animation) => animation.cancel());
    });

    // A word rolling in its box: the old one goes up, the new one comes from below (`down`: the
    // other way, for a price that drops or a quantity going down)
    const current = new Map();
    const roll = (box, text, { tick = false, down = false, quiet = false } = {}) => {
      const old = current.get(box) || box?.firstElementChild;
      if (!old || (old.textContent === text && !!old.firstElementChild === tick)) return;
      const next = old.cloneNode(false);
      next.innerHTML = tick ? TICK : '';
      next.append(text);
      current.set(box, next);
      [...box.children].forEach((el) => el !== old && el.remove());
      if (still || quiet) return old.replaceWith(next);
      box.append(next);
      const options = { duration: ms(ROLL), easing: 'cubic-bezier(0.65, 0, 0.35, 1)' };
      // Far enough to leave its box: 130% of a word alone stays inside a tall button
      const far = `${Math.max(old.offsetHeight * 1.3, (box.clientHeight + old.offsetHeight) / 2 + 2)}px`;
      const away = down ? far : `-${far}`;
      play(old, [{ transform: 'none' }, { transform: `translateY(${away})` }], { ...options, fill: 'forwards' })
        .finished.then(() => old.remove(), () => old.remove());
      play(next, [{ transform: `translateY(${down ? `-${far}` : far})` }, { transform: 'none' }], options);
    };

    // ---------- The variant: price, picture, and who is told ----------
    const radios = [...root.querySelectorAll('input[type="radio"][name^="options["]')];
    const colours = [...root.querySelectorAll('.kodza-buy-box__swatch input')];
    const picked = q('picked');
    const amount = q('amount');
    const base = Number(root.dataset.price) || 0;
    const money = (cents) => {
      const options = root.dataset.currency ? { style: 'currency', currency: root.dataset.currency } : {};
      const digits = cents % 100 ? 2 : 0;
      try {
        return new Intl.NumberFormat(lang, { ...options, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(cents / 100);
      } catch {
        return (cents / 100).toFixed(digits);
      }
    };
    const options = () => {
      const chosen = {};
      radios.forEach((input) => {
        if (!input.checked) return;
        const match = /^options\[(.+)\]$/.exec(input.name);
        if (match) chosen[match[1]] = input.value;
      });
      return chosen;
    };
    // The price of the variant: the last chosen option that has one, or the product's
    const priceNow = () => {
      const priced = radios.filter((input) => input.checked && input.dataset.price);
      return priced.length ? Number(priced[priced.length - 1].dataset.price) || base : base;
    };
    let price = priceNow();
    let colour = colours.findIndex((input) => input.checked);
    const tell = () => {
      const chosen = options();
      const pick = colours.find((input) => input.checked);
      if (pick?.dataset.image) root.dataset.image = pick.dataset.image;
      root.dispatchEvent(new CustomEvent('kodza:variant-change', {
        bubbles: true,
        detail: { id: root.dataset.id ?? null, options: chosen, colour: pick?.value ?? null, price, image: root.dataset.image || '' },
      }));
    };
    const changed = (input) => {
      if (colours.includes(input)) {
        const at = colours.indexOf(input);
        if (picked) roll(picked, input.value, { down: at < colour });
        colour = at;
      }
      const next = priceNow();
      if (next !== price) {
        roll(amount, money(next), { down: next < price });
        price = next;
        root.dataset.price = String(next);
      }
      tell();
    };
    radios.forEach((input) => input.addEventListener('change', () => input.checked && changed(input), { signal }));

    // ---------- The sizes: one ink pill that slides ----------
    const track = q('track');
    const sizes = track ? [...track.querySelectorAll('input')] : [];
    let ink = null;
    let boxes = [];
    let move = null;
    let chosen = sizes.findIndex((input) => input.checked);
    const ease = (t) => 1 - (1 - t) ** 4; // leaves at once, lands softly
    const cut = ({ left, right }) => `inset(0 ${right}px 0 ${left}px round var(--kz-radius-pill, 999px))`;
    const edgesAt = ({ from, to, forward }, t) => {
      const front = ease(Math.min(1, t / LEAD));
      const back = ease(Math.max(0, (t - LAG) / (1 - LAG)));
      return {
        left: from.left + (to.left - from.left) * (forward ? back : front),
        right: from.right + (to.right - from.right) * (forward ? front : back),
      };
    };
    // Each size's place in the ink layer, in its own pixels: a parent scaled by a transform changes nothing
    const measure = () => {
      const full = ink.offsetWidth;
      boxes = sizes.map((input) => {
        const label = input.closest('.kodza-buy-box__size');
        const left = label.offsetLeft - ink.offsetLeft;
        return { left, right: full - left - label.offsetWidth };
      });
    };
    const rest = () => {
      ink.style.clipPath = chosen < 0 ? 'inset(0 50% 0 50%)' : cut(boxes[chosen]);
    };
    if (track && sizes.length) {
      // A copy of the labels, in on-ink, cut to the pill: the text turns white exactly at its edges
      ink = document.createElement('span');
      ink.className = 'kodza-buy-box__ink';
      ink.setAttribute('aria-hidden', 'true');
      sizes.forEach((input) => {
        const copy = document.createElement('span');
        copy.className = 'kodza-buy-box__copy';
        copy.textContent = input.value;
        ink.append(copy);
      });
      track.append(ink);
      measure();
      rest();
      const slide = (from, to) => {
        const t0 = move?.currentTime;
        let start = boxes[from];
        // Caught mid-slide: it leaves from where it is
        if (move && t0 != null) start = edgesAt(move.plan, Math.min(1, t0 / ms(SLIDE)));
        move?.cancel();
        move = null;
        rest();
        if (still || !start) return;
        const plan = { from: start, to: boxes[to], forward: boxes[to].left > start.left };
        const frames = [];
        for (let i = 0; i <= SAMPLES; i += 1) frames.push({ clipPath: cut(edgesAt(plan, i / SAMPLES)) });
        move = play(ink, frames, { duration: ms(SLIDE), easing: 'linear' });
        move.plan = plan;
        move.finished.then(() => { if (move?.plan === plan) move = null; }, () => {});
      };
      sizes.forEach((input, i) => input.addEventListener('change', () => {
        if (!input.checked || i === chosen) return;
        const from = chosen;
        chosen = i;
        slide(from, i);
      }, { signal }));
      const resize = new ResizeObserver(() => {
        measure();
        if (!move) rest();
      });
      resize.observe(track);
      signal.addEventListener('abort', () => resize.disconnect());
    }

    // ---------- Quantity: digits that roll ----------
    const field = q('input');
    const number = q('number');
    const steps = [...root.querySelectorAll('.kodza-buy-box__step')];
    const bounds = () => [Number(field.min) || 1, Number(field.max) || 99];
    const ends = () => {
      const [min, max] = bounds();
      const n = Number(field.value) || min;
      steps.forEach((step) => step.setAttribute('aria-disabled', String(Number(step.dataset.step) < 0 ? n <= min : n >= max)));
    };
    if (field && number) {
      ends();
      steps.forEach((step) => step.addEventListener('click', () => {
        const [min, max] = bounds();
        const was = Number(field.value) || min;
        const n = Math.min(max, Math.max(min, was + Number(step.dataset.step)));
        if (n === was) return;
        field.value = String(n);
        field.dispatchEvent(new Event('input', { bubbles: true }));
        ends();
        if (still) return;
        // The old number goes, the new one comes from the side it was asked from
        const old = document.createElement('span');
        old.className = 'kodza-buy-box__old';
        old.setAttribute('aria-hidden', 'true');
        old.textContent = String(was);
        number.querySelectorAll('.kodza-buy-box__old').forEach((el) => el.remove());
        number.append(old);
        const up = n > was;
        const options = { duration: ms(ROLL), easing: 'cubic-bezier(0.65, 0, 0.35, 1)' };
        // Far enough to leave its box: 130% of a word alone stays inside a tall button
        const far = `${Math.max(old.offsetHeight * 1.3, (number.clientHeight + old.offsetHeight) / 2 + 2)}px`;
        play(old, [{ transform: 'none' }, { transform: `translateY(${up ? `-${far}` : far})` }], { ...options, fill: 'forwards' })
          .finished.then(() => old.remove(), () => old.remove());
        play(field, [{ transform: `translateY(${up ? far : `-${far}`})` }, { transform: 'none' }], options);
      }, { signal }));
      field.addEventListener('change', () => {
        const [min, max] = bounds();
        field.value = String(Math.min(max, Math.max(min, Math.round(Number(field.value) || min))));
        ends();
      }, { signal });
      field.addEventListener('input', ends, { signal });
    }

    // ---------- In the cart: Added, then Add to cart again ----------
    const add = q('add');
    const first = add?.textContent.trim() || '';
    let back = null;
    root.addEventListener('kodza:cart-add', (event) => {
      if (event.target !== root || !add) return;
      root.classList.add('is-added');
      roll(add, word('added'), { tick: true });
      clearTimeout(back);
      timers.delete(back);
      const reset = () => {
        root.classList.remove('is-added');
        roll(add, first);
      };
      // The platform passes its request to wait() while the event runs: read it just after
      queueMicrotask(() => {
        Promise.resolve(event.detail?.request).then(
          () => !signal.aborted && (back = later(reset, HOLD)),
          () => !signal.aborted && reset(),
        );
      });
    }, { signal });

    // ---------- When it ships, in the workshop's time zone ----------
    const when = q('when');
    if (when && root.dataset.cutoff) {
      const days = shipDays(root.dataset.shipDays);
      const [ch, cm] = root.dataset.cutoff.split(':').map(Number);
      const cutoff = (ch || 0) * 60 + (cm || 0);
      const dayName = (d) => {
        // 2024-01-01 was a Monday
        try {
          return new Intl.DateTimeFormat(lang, { weekday: 'long', timeZone: 'UTC' }).format(Date.UTC(2024, 0, 1 + d));
        } catch {
          return DAYS[d];
        }
      };
      const clock = () => {
        const pinned = /^(\w{3})\w*\s+(\d{1,2}):(\d{2})$/.exec(String(root.dataset.now || '').trim().toLowerCase());
        if (pinned) return { day: Math.max(0, DAYS.indexOf(pinned[1])), minutes: Number(pinned[2]) * 60 + Number(pinned[3]) };
        let parts;
        try {
          parts = new Intl.DateTimeFormat('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: root.dataset.timezone || undefined }).formatToParts(new Date());
        } catch {
          parts = new Intl.DateTimeFormat('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
        }
        const part = (type) => parts.find((p) => p.type === type)?.value || '';
        return { day: Math.max(0, DAYS.indexOf(part('weekday').toLowerCase().slice(0, 3))), minutes: Number(part('hour')) * 60 + Number(part('minute')) };
      };
      const line = () => {
        const { day, minutes } = clock();
        if (days.has(day) && minutes < cutoff) return fill(word('today'), { time: root.dataset.cutoff });
        let ahead = 1;
        while (ahead < 7 && !days.has((day + ahead) % 7)) ahead += 1;
        return ahead === 1 ? word('tomorrow') : fill(word('later'), { day: dayName((day + ahead) % 7) });
      };
      roll(when, line(), { quiet: true });
      // Read again on the next minute: the line rolls when the cut-off passes
      const tick = () => {
        roll(when, line());
        later(tick, 60000 - (Date.now() % 60000) + 50);
      };
      if (!root.dataset.now) later(tick, 60000 - (Date.now() % 60000) + 50);
    }

    // ---------- The details: a height that opens ----------
    root.querySelectorAll('.kodza-buy-box__fold').forEach((fold) => {
      const summary = fold.querySelector('summary');
      const panel = fold.querySelector('.kodza-buy-box__panel');
      if (!summary || !panel) return;
      let motion = null;
      summary.addEventListener('click', (event) => {
        if (still) return;
        event.preventDefault();
        const from = fold.offsetHeight;
        const opening = !fold.classList.contains('is-open');
        motion?.cancel();
        motion?.panel?.cancel();
        fold.open = true;
        fold.classList.toggle('is-open', opening);
        const edge = fold.offsetHeight - fold.clientHeight;
        const to = opening ? fold.offsetHeight : summary.offsetHeight + edge;
        const options = { duration: ms(FOLD), easing: 'cubic-bezier(0.65, 0, 0.35, 1)' };
        motion = play(fold, [{ height: `${from}px`, overflow: 'hidden' }, { height: `${to}px`, overflow: 'hidden' }], options);
        motion.opening = opening;
        motion.panel = opening
          ? play(panel, [{ transform: 'translateY(-8px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: ms(FOLD * 0.8), delay: ms(FOLD * 0.2), fill: 'backwards', easing: 'cubic-bezier(0.22, 1, 0.36, 1)' })
          : play(panel, [{ opacity: 1 }, { opacity: 0 }], { ...options, duration: ms(FOLD * 0.6), fill: 'forwards' });
        const done = motion;
        motion.finished.then(() => {
          if (motion !== done) return;
          motion = null;
          if (!opening) fold.open = false;
          // The text stays hidden until the fold is shut, then the fade lets go
          if (!opening) done.panel.cancel();
        }, () => {});
      }, { signal });
      fold.classList.toggle('is-open', fold.open);
      fold.addEventListener('toggle', () => !motion && fold.classList.toggle('is-open', fold.open), { signal });
    });
  }

  // ---------- Cart engine (begin) ----------
  // The same block in every component of the E-commerce family, copied as is: the first one loaded
  // sets up window.kodzaCart, the next ones find it, so three components pasted make one cart.
  // It speaks in events on document, which bubble:
  //   kodza:cart-add     (cancelable) { id, variant, title, options, price, currency, quantity, image, url, wait(promise) }
  //   kodza:cart-update  (cancelable) { key, quantity }, 0 removes the line
  //   kodza:cart-change  the whole cart { items, count, subtotal, currency }, prices in cents
  //   kodza:cart-open    opens the Cart Drawer nearest to where it was sent from
  // Until a platform answers, a small cart kept in localStorage takes the adds. A platform
  // (Shopify, WooCommerce) cancels the add, makes its request, passes the promise to wait(), then
  // sends kodza:cart-change with its own cart: from then on the small cart only listens.
  // An add-to-cart <form action="/cart/add"> (name="id" or "add-to-cart", name="quantity",
  // options[Name]) works without the script; with it, its submit becomes a kodza:cart-add.
  const cart = window.kodzaCart || (window.kodzaCart = (() => {
    const STORE = 'kodza-cart';
    const COUNTS = '.kodza-header-shop__cart, .kodza-add-to-cart__cart, [data-kodza-cart-count]';
    let items = [];
    let listening = false;
    let sending = false;
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (Array.isArray(saved?.items)) items = saved.items;
    } catch {}
    const keyOf = (item) => String(item.key ?? item.variant ?? item.id ?? item.title);
    const whole = (n, fallback) => (Number.isFinite(Number(n)) ? Math.round(Number(n)) : fallback);
    const get = () => {
      const list = items.map((item) => ({ ...item, options: { ...item.options } }));
      return {
        items: list,
        count: list.reduce((n, item) => n + item.quantity, 0),
        subtotal: list.reduce((n, item) => n + item.price * item.quantity, 0),
        currency: list[0]?.currency || '',
      };
    };
    const counts = (n) => document.querySelectorAll(COUNTS).forEach((el) => {
      if (el.dataset.count !== String(n)) el.dataset.count = String(n);
    });
    const send = () => {
      const detail = get();
      counts(detail.count);
      sending = true;
      document.dispatchEvent(new CustomEvent('kodza:cart-change', { detail }));
      sending = false;
      if (!listening) {
        try {
          localStorage.setItem(STORE, JSON.stringify({ items }));
        } catch {}
      }
    };
    const formats = new Map();
    const format = (cents, currency, locale) => {
      const lang = locale || document.documentElement.lang || undefined;
      const id = `${lang}|${currency}`;
      if (!formats.has(id)) {
        try {
          formats.set(id, new Intl.NumberFormat(lang, currency ? { style: 'currency', currency } : { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        } catch {
          formats.set(id, new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        }
      }
      return formats.get(id).format((Number(cents) || 0) / 100);
    };
    const add = (item, source = document) => {
      const detail = { ...item, wait: (promise) => { detail.request = Promise.resolve(promise); } };
      source.dispatchEvent(new CustomEvent('kodza:cart-add', { bubbles: true, cancelable: true, detail }));
      return detail.request || Promise.resolve();
    };
    const update = (key, quantity, source = document) => {
      source.dispatchEvent(new CustomEvent('kodza:cart-update', { bubbles: true, cancelable: true, detail: { key: String(key), quantity } }));
    };
    // The small cart answers last (on window), once the page's own listeners had their say
    window.addEventListener('kodza:cart-add', (event) => {
      if (event.defaultPrevented || listening) return;
      const d = event.detail || {};
      const key = keyOf(d);
      const quantity = Math.max(1, whole(d.quantity, 1));
      const found = items.find((item) => item.key === key);
      if (found) found.quantity = Math.min(99, found.quantity + quantity);
      else {
        const item = {
          key, id: d.id ?? null, variant: d.variant ?? null, title: String(d.title || ''), options: { ...d.options },
          price: whole(d.price, 0), currency: d.currency || items[0]?.currency || '', quantity: Math.min(99, quantity),
          image: d.image || '', url: d.url || '',
        };
        items.splice(Number.isInteger(d.at) ? Math.min(d.at, items.length) : 0, 0, item);
      }
      send();
    });
    window.addEventListener('kodza:cart-update', (event) => {
      if (event.defaultPrevented || listening) return;
      const { key, quantity } = event.detail || {};
      const found = items.find((item) => item.key === String(key));
      if (!found) return;
      const n = Math.max(0, Math.min(99, whole(quantity, found.quantity)));
      if (n) found.quantity = n;
      else items = items.filter((item) => item !== found);
      send();
    });
    // A cart sent from elsewhere: a platform owns it now
    document.addEventListener('kodza:cart-change', (event) => {
      if (sending) return;
      listening = true;
      const d = event.detail || {};
      items = (d.items || []).map((item) => ({ ...item, key: keyOf(item), options: { ...item.options } }));
      counts(Math.max(0, whole(d.count, items.reduce((n, item) => n + item.quantity, 0))));
    });
    // An add-to-cart form sends its add instead of leaving the page
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (event.defaultPrevented || !(form instanceof HTMLFormElement) || !form.matches(FORMS)) return;
      event.preventDefault();
      const data = new FormData(form, event.submitter);
      const options = {};
      data.forEach((value, name) => {
        const match = /^options\[(.+)\]$/.exec(name);
        if (match) options[match[1]] = String(value);
      });
      const id = form.dataset.id || data.get('product-id') || data.get('add-to-cart') || data.get('id');
      const variant = data.get('variation_id') || data.get('id') || [id, ...Object.values(options)].join(' / ');
      const own = form.dataset;
      const picture = own.image ? null : pictureFor(form);
      add({
        id, variant, title: own.title || '', options, price: whole(own.price, 0), currency: own.currency || '',
        quantity: whole(data.get('quantity'), 1), image: own.image || picture?.currentSrc || picture?.src || '', url: own.url || '',
      }, form);
    });
    // Any [data-kodza-cart-open] (a bag link in a header) opens the drawer
    document.addEventListener('click', (event) => {
      const opener = event.target.closest?.('[data-kodza-cart-open]');
      if (!opener) return;
      event.preventDefault();
      opener.dispatchEvent(new CustomEvent('kodza:cart-open', { bubbles: true }));
    });
    const ready = () => counts(get().count);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
    else ready();
    return { get, add, update, format, send };
  })());
  // ---------- Cart engine (end) ----------

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
