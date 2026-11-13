// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Quick View
// A shop card whose photo grows into a window: the same photo, bigger, beside a short buy form
// (colour, size, Add to cart). Escape, Close or a click on the veil sends the window back into
// its card, which keeps the colour chosen in it. On phones, a sheet from the bottom that a pull
// on its grip closes. A colour sweeps its photo in, a size rolls the price, Add to cart says
// Added, then the window goes back.
// Settings: the --kz-quick-view-* variables in the CSS, data-text-* on the root, the constants
// below; data-image, data-card-image and data-alt on a colour, data-price on a size. The cart is
// the Cart engine, further down: a small cart kept in the browser, or your platform's through
// its events.
(() => {
  const SELECTOR = '.kodza-quick-view';

  // Timings, in milliseconds (times the site's pace)
  const GROW = 640; // the photo leaving its card for the window
  const SHRINK = 520; // and going back
  const FADE = 160; // the form fading out before it goes back
  const CASCADE = 0.45; // the form comes in from this share of the grow
  const STEP = 50; // between two lines of the form
  const RISE = 520; // one line of the form coming up
  const SWEEP = 600; // a new colour sweeping the photo
  const ROLL = 420; // the price, the colour's name or the button rolling
  const SHEET = 640; // the sheet, on phones (as --kz-quick-view-duration)
  // Not motion, so not paced
  const HOLD = 1400; // how long "Added" stays before the window goes back

  // What the script writes, in English unless the root says otherwise (data-text-<key>)
  const WORDS = {
    added: 'Added', // in the button, once it is in the cart
  };
  const TICK = '<svg class="kodza-quick-view__tick" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4 8-9" pathLength="1" /></svg>';
  const GROW_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
  const BACK_EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const ARRIVE = 'cubic-bezier(0.22, 1, 0.36, 1)';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  // The page behind stays put while it is open: a wheel or a swipe only scrolls what can
  // scroll inside, under the pointer. Listening only while open costs nothing the rest of the time.
  const holdPage = (layer, signal) => {
    const inside = (target, x, y, dy) => {
      for (let el = target; el instanceof Element && layer.contains(el); el = el.parentElement) {
        const box = el.getBoundingClientRect();
        if (x < box.left || x > box.right || y < box.top || y > box.bottom) continue;
        if (!/(auto|scroll)/.test(getComputedStyle(el).overflowY) || el.scrollHeight <= el.clientHeight + 1) continue;
        if (dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return true;
      }
      return false;
    };
    let last = 0;
    const wheel = (event) => !inside(event.target, event.clientX, event.clientY, event.deltaY) && event.preventDefault();
    const touchstart = (event) => (last = event.touches[0].clientY);
    const touchmove = (event) => {
      const touch = event.touches[0];
      const dy = last - touch.clientY;
      last = touch.clientY;
      if (!inside(event.target, touch.clientX, touch.clientY, dy)) event.preventDefault();
    };
    const hold = (on) => {
      const method = on ? 'addEventListener' : 'removeEventListener';
      document[method]('wheel', wheel, { passive: false });
      document[method]('touchstart', touchstart, { passive: true });
      document[method]('touchmove', touchmove, { passive: false });
    };
    const observer = new MutationObserver(() => hold(layer.open));
    observer.observe(layer, { attributes: true, attributeFilter: ['open'] });
    // Stopped while open: the page is let go
    signal.addEventListener('abort', () => {
      observer.disconnect();
      hold(false);
    });
  };

  const phone = window.matchMedia('(max-width: 640px)');
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

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const q = (name) => root.querySelector(`.kodza-quick-view__${name}`);
    const panel = q('panel');
    const trigger = q('open');
    const card = q('image');
    const photo = q('photo');
    const form = q('buy');
    if (!panel || !trigger || !card || !photo || !form || typeof panel.showModal !== 'function') return;
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const ms = (t) => (still ? 0 : t * pace);
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];

    const lang = root.closest('[lang]')?.lang || undefined;
    const currency = form.dataset.currency;
    const money = (cents) => {
      const options = currency ? { style: 'currency', currency } : {};
      const digits = cents % 100 ? 2 : 0;
      try {
        return new Intl.NumberFormat(lang, { ...options, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(cents / 100);
      } catch {
        return (cents / 100).toFixed(digits);
      }
    };
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
    const cancel = (id) => {
      clearTimeout(id);
      timers.delete(id);
    };
    const play = (el, frames, options) => {
      const animation = el.animate(frames, options);
      moving.add(animation);
      animation.finished.then(() => moving.delete(animation), () => moving.delete(animation));
      return animation;
    };
    holdPage(panel, signal);
    root.classList.add('is-ready');
    signal.addEventListener('abort', () => {
      timers.forEach(clearTimeout);
      moving.forEach((animation) => animation.cancel());
      if (panel.open) panel.close();
      panel.classList.remove('is-open', 'is-moving', 'is-whole');
      root.classList.remove('is-ready', 'is-out');
    });

    // A word rolling in its box: the old one goes up, the new one comes from below (`down`: the
    // other way, for a price that drops). Closed, the window just swaps it
    const current = new Map();
    const roll = (box, text, { tick = false, down = false } = {}) => {
      const old = current.get(box) || box?.firstElementChild;
      if (!old || (old.textContent === text && !!old.querySelector('svg') === tick)) return;
      const next = old.cloneNode(false);
      next.innerHTML = tick ? TICK : '';
      next.append(text);
      current.set(box, next);
      [...box.children].forEach((el) => el !== old && el.remove());
      if (!ms(1) || !panel.open) return old.replaceWith(next);
      box.append(next);
      const options = { duration: ms(ROLL), easing: BACK_EASE };
      // Far enough to leave its box: 130% of a word alone stays inside a tall button
      const far = `${Math.max(old.offsetHeight * 1.3, (box.clientHeight + old.offsetHeight) / 2 + 2)}px`;
      play(old, [{ transform: 'none' }, { transform: `translateY(${down ? far : `-${far}`})` }], { ...options, fill: 'forwards' })
        .finished.then(() => old.remove(), () => old.remove());
      play(next, [{ transform: `translateY(${down ? `-${far}` : far})` }, { transform: 'none' }], options);
    };

    // ---------- The grow: from the card's photo to the window ----------
    // Where the card's photo is, seen from the window: the clip of the window and the move of
    // its photo (both in screen pixels: the window lives in the top layer, out of any scaled parent)
    const radiusOf = (el) => parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
    const shapes = () => {
      const from = card.getBoundingClientRect();
      const box = panel.getBoundingClientRect();
      const to = photo.getBoundingClientRect();
      const r = radiusOf(panel);
      return {
        clipFrom: `inset(${from.top - box.top}px ${box.right - from.right}px ${box.bottom - from.bottom}px ${from.left - box.left}px round ${radiusOf(q('media'))}px)`,
        clipTo: `inset(0px 0px 0px 0px round ${r}px)`,
        moveFrom: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width})`,
        moveTo: 'translate(0px, 0px) scale(1)',
      };
    };
    // The form, line by line: its head, the colour, the size, the buttons, Close
    const lines = () => [...q('head').children, ...form.querySelectorAll('.kodza-quick-view__group, .kodza-quick-view__actions'), q('close')].filter(Boolean);

    let state = 'closed'; // closed, opening, open, closing
    let grow = []; // the animations of the grow, reversed when it closes halfway
    let timer = 0;
    let opener = null;
    const setY = (y) => panel.style.setProperty('--kz-quick-view-y', `${Math.max(0, y)}px`);

    // Opened with the pointer: the focus goes to the window itself, so no ring shows on Close
    let byKeyboard = false;
    document.addEventListener('keydown', () => (byKeyboard = true), { signal, capture: true });
    document.addEventListener('pointerdown', () => (byKeyboard = false), { signal, capture: true });

    const settled = () => {
      grow.forEach((animation) => animation.cancel());
      grow = [];
    };
    let fading = [];
    const done = () => {
      settled();
      moving.forEach((animation) => animation.effect?.target && panel.contains(animation.effect.target) && animation.cancel());
      fading.forEach((animation) => animation.cancel());
      fading = [];
      panel.close();
      panel.classList.remove('is-moving', 'is-whole');
      root.classList.remove('is-out');
      state = 'closed';
      reset();
      const back = opener?.isConnected && opener.getClientRects().length ? opener : trigger;
      opener = null;
      back.focus({ preventScroll: true });
    };

    const open = () => {
      // Going back already: it lands first
      if (state !== 'closed') return;
      cancel(timer);
      opener = document.activeElement !== document.body ? document.activeElement : null;
      form.scrollTop = 0;
      panel.showModal();
      if (!byKeyboard) {
        panel.tabIndex = -1;
        panel.focus({ preventScroll: true });
      }
      trigger.setAttribute('aria-expanded', 'true');
      if (phone.matches || !ms(1)) {
        state = 'open';
        setY(0);
        panel.classList.add('is-moving', 'is-whole');
        requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add('is-open')));
        return;
      }
      state = 'opening';
      const shape = shapes();
      root.classList.add('is-out');
      panel.classList.add('is-open');
      const options = { duration: ms(GROW), easing: GROW_EASE };
      grow = [
        play(panel, [{ clipPath: shape.clipFrom }, { clipPath: shape.clipTo }], options),
        play(photo, [{ transform: shape.moveFrom }, { transform: shape.moveTo }], options),
        ...lines().map((el, i) => play(el, [
          { opacity: 0, transform: 'translateY(16px)' },
          { opacity: 1, transform: 'none' },
        ], { duration: ms(RISE), delay: ms(GROW * CASCADE + i * STEP), easing: ARRIVE, fill: 'backwards' })),
      ];
      // Whole once the last line is up: the shadow comes, the clip goes
      Promise.all(grow.map((animation) => animation.finished)).then(() => {
        if (state !== 'opening') return;
        settled();
        state = 'open';
        panel.classList.add('is-whole');
      }, () => {});
    };

    const close = () => {
      if (state === 'closed' || state === 'closing') return;
      cancel(timer);
      trigger.setAttribute('aria-expanded', 'false');
      panel.classList.remove('is-open');
      if (phone.matches || !ms(1) || !root.classList.contains('is-out')) {
        state = 'closing';
        panel.classList.add('is-moving');
        timer = later(done, ms(SHEET));
        return;
      }
      if (state === 'opening' && grow.length) {
        // Closed halfway: the grow plays back from where it is
        state = 'closing';
        grow.forEach((animation) => animation.reverse());
        grow[0].finished.then(() => state === 'closing' && done(), () => {});
        return;
      }
      state = 'closing';
      panel.classList.remove('is-whole');
      const shape = shapes();
      const fade = { duration: ms(FADE), easing: 'ease', fill: 'forwards' };
      // Kept until the panel is shut: once finished they leave `moving`, yet still hold the lines at 0
      fading = lines().map((el) => play(el, [{ opacity: 1 }, { opacity: 0 }], fade));
      const options = { duration: ms(SHRINK), delay: ms(FADE * 0.5), easing: BACK_EASE, fill: 'forwards' };
      grow = [
        play(photo, [{ transform: shape.moveTo }, { transform: shape.moveFrom }], options),
        play(panel, [{ clipPath: shape.clipTo }, { clipPath: shape.clipFrom }], options),
      ];
      grow[0].finished.then(() => state === 'closing' && done(), () => {});
    };

    trigger.addEventListener('click', open, { signal });
    q('close')?.addEventListener('click', close, { signal });
    panel.addEventListener('cancel', (event) => {
      event.preventDefault();
      close();
    }, { signal });
    panel.addEventListener('click', (event) => {
      if (event.target !== panel) return;
      const box = panel.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close();
    }, { signal });
    // The screen crossing the phone width while it is open: it just closes
    phone.addEventListener('change', () => panel.open && done(), { signal });

    // Pulled down by its grip or its photo on phones: let go far enough, or flicked, it closes
    let drag = null;
    [q('grip'), photo].forEach((handle) => {
      handle.addEventListener('pointerdown', (event) => {
        if (!phone.matches || state !== 'open') return;
        drag = { pointer: event.clientY, time: performance.now(), last: event.clientY, velocity: 0 };
        handle.setPointerCapture(event.pointerId);
        panel.classList.remove('is-moving');
      }, { signal });
      handle.addEventListener('pointermove', (event) => {
        if (!drag) return;
        const y = event.clientY - drag.pointer;
        // Above its rest, it resists like a rubber band
        setY(y < 0 ? y / 4 : y);
        drag.velocity = (event.clientY - drag.last) / Math.max(1, performance.now() - drag.time);
        drag.last = event.clientY;
        drag.time = performance.now();
      }, { signal });
      const release = () => {
        if (!drag) return;
        const y = parseFloat(getComputedStyle(panel).getPropertyValue('--kz-quick-view-y')) || 0;
        const flick = drag.velocity > 0.6;
        drag = null;
        panel.classList.add('is-moving');
        if (flick || y > panel.offsetHeight * 0.25) return close();
        setY(0);
      };
      handle.addEventListener('pointerup', release, { signal });
      handle.addEventListener('pointercancel', release, { signal });
    });

    // ---------- Colour and size ----------
    const picked = q('picked');
    const amount = q('amount');
    let price = Number(form.dataset.price) || 0;
    // A colour: the new photo sweeps in over the old one, its name rolls, and the card takes it
    // too (hidden behind the window, it is there when the window goes back)
    const colour = (input, { now = false } = {}) => {
      if (picked) roll(picked, input.value);
      const alt = input.dataset.alt;
      if (input.dataset.cardImage && card.getAttribute('src') !== input.dataset.cardImage) {
        card.src = input.dataset.cardImage;
        if (alt) card.alt = alt;
      }
      const src = input.dataset.image;
      const shown = photo.querySelector('img:last-of-type');
      if (!src || !shown || shown.getAttribute('src') === src) return;
      if (now || !ms(1) || !panel.open) {
        shown.src = src;
        if (alt) shown.alt = alt;
        [...photo.querySelectorAll('img')].forEach((img) => img !== shown && img.remove());
        return;
      }
      const next = shown.cloneNode(false);
      next.src = src;
      if (alt) next.alt = alt;
      shown.alt = '';
      const sweep = () => {
        if (signal.aborted || !next.isConnected) return;
        play(next, [{ clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: ms(SWEEP), easing: BACK_EASE })
          .finished.then(() => [...photo.querySelectorAll('img')].forEach((img) => img !== next && img.remove()), () => {});
      };
      next.style.clipPath = 'inset(0 0 0 100%)';
      photo.append(next);
      (next.decode ? next.decode() : Promise.resolve()).catch(() => {}).then(() => {
        next.style.clipPath = '';
        sweep();
      });
    };
    // A size: its price rolls (down when it drops) and goes to the form for the cart
    const size = (input) => {
      const cents = Number(input.dataset.price);
      if (Number.isNaN(cents) || input.dataset.price == null) return;
      form.dataset.price = String(cents);
      if (amount && cents !== price) roll(amount, money(cents), { down: cents < price });
      price = cents;
    };
    form.addEventListener('change', (event) => {
      const input = event.target;
      if (input.type !== 'radio' || !input.checked) return;
      if (input.dataset.image || input.dataset.cardImage) colour(input);
      if (input.dataset.price != null) size(input);
    }, { signal });
    // What the form already holds (a choice kept by the browser, a restart): the window starts on it
    form.querySelectorAll('input[type="radio"]:checked').forEach((input) => {
      if (input.dataset.image || input.dataset.cardImage) colour(input, { now: true });
      if (input.dataset.price != null) size(input);
    });

    // ---------- Add to cart: Added for a moment, then the window goes back ----------
    const button = q('add');
    const first = button?.textContent.trim();
    let back = 0;
    const reset = () => {
      cancel(back);
      if (button) roll(button, first);
    };
    form.addEventListener('kodza:cart-add', (event) => {
      if (!button) return;
      roll(button, word('added'), { tick: true });
      cancel(back);
      // The platform passes its request to wait() while the event runs: read it just after
      queueMicrotask(() => {
        Promise.resolve(event.detail?.request).then(
          () => !signal.aborted && (back = later(close, HOLD)),
          () => !signal.aborted && reset(),
        );
      });
    }, { signal });
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
