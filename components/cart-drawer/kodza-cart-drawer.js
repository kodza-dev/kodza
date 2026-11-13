// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Cart Drawer
// The bag of a shop, in a side panel (a sheet from the bottom on phones). An add-to-cart form
// anywhere on the page sends its picture flying into the bag, the count rolls, the drawer opens
// and the new line slides in. Quantities change in place, a removed line can be brought back,
// every price rolls digit by digit and the free shipping bar fills up.
// Settings: the --kz-cart-drawer-* variables in the CSS, data-free-shipping (in cents),
// data-currency (the amounts shown while the bag is empty) and
// data-text-* on the root, the constants below. The cart itself is the Cart engine, further down:
// a small cart kept in the browser, or your platform's (Shopify, WooCommerce) through its events.
(() => {
  const SELECTOR = '.kodza-cart-drawer';

  // Timings, in milliseconds (times the site's pace)
  const ROLL = 420; // a digit rolling
  const STAGGER = 40; // between two rolling digits, from the units
  const BEAT = 120; // between the picture landing in the bag and the drawer opening
  const REVEAL = 0.45; // how far into the opening the new line slides in (0 to 1)
  const ROW = 520; // a line growing in, folding away or coming back
  // Not motion, so not paced
  const UNDO_HOLD = 5000; // how long a removed line offers Undo
  const SETTLE = 350; // how long a typed quantity waits before it is sent
  const MAX = 99; // the most of one thing in the bag

  // What the script writes, in English unless the root says otherwise (data-text-<key>)
  const WORDS = {
    bag: 'Bag, {count} items', // the bag button, read by screen readers
    bagOne: 'Bag, 1 item',
    bagEmpty: 'Bag, empty',
    shipping: '{amount} away from free shipping.', // above the lines, with data-free-shipping
    shipped: 'Free shipping. Nice.',
    remove: 'Remove',
    removed: '{title} removed.',
    undo: 'Undo',
    decrease: 'One less',
    increase: 'One more',
    quantity: 'Quantity, {title}',
    added: 'Added to your bag: {title}.', // said once it is in
    gone: 'Removed from your bag: {title}.',
  };

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
  let uid = 0;

  const svg = (paths) => `<svg viewBox="0 0 16 16" aria-hidden="true">${paths}</svg>`;
  const MINUS = svg('<path d="M3.5 8h9" />');
  const PLUS = svg('<path d="M3.5 8h9M8 3.5v9" />');
  const escape = (text) => String(text ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // In sight: more than a quarter of it on screen
  const seen = (el) => {
    if (!el) return false;
    const box = el.getBoundingClientRect();
    const w = Math.min(box.right, innerWidth) - Math.max(box.left, 0);
    const h = Math.min(box.bottom, innerHeight) - Math.max(box.top, 0);
    return w > 0 && h > 0 && w * h > (box.width * box.height) / 4;
  };
  const shown = (el) => el.getClientRects().length > 0 && !el.closest('[inert]');
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
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const ms = (t) => (still ? 0 : t * pace);
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const fill = (text, values) => text.replace(/\{(\w+)\}/g, (all, name) => values[name] ?? all);

    const q = (name) => root.querySelector(`.kodza-cart-drawer__${name}`);
    const trigger = q('trigger');
    const panel = q('panel');
    if (!trigger || !panel) return;
    holdPage(panel, signal);
    const bag = q('bag');
    const badge = q('badge');
    const title = q('title');
    const count = q('count');
    const list = q('items');
    const empty = q('empty');
    const subtotal = q('subtotal');
    const checkout = q('checkout');
    const shipping = q('shipping');
    const shippingText = q('shipping-text');
    const meter = q('meter');
    const head = q('head');
    const foot = q('foot');
    const live = q('live');
    const threshold = parseInt(root.dataset.freeShipping, 10) || 0;
    if (shipping) shipping.hidden = !threshold;

    if (title) {
      title.id = title.id || `kodza-cart-drawer-${++uid}`;
      panel.setAttribute('aria-labelledby', title.id);
    }
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    const duration = still ? 0 : (parseFloat(getComputedStyle(root).getPropertyValue('--kz-cart-drawer-duration')) * 1000 || 600) * pace;
    const timers = new Set();
    const later = (fn, delay) => {
      const id = setTimeout(() => {
        timers.delete(id);
        fn();
      }, delay);
      timers.add(id);
      return id;
    };
    const cancel = (id) => {
      clearTimeout(id);
      timers.delete(id);
    };

    // ---------- Rolling text ----------
    // Only the characters that change roll, right-aligned like a till, from the units; up when
    // the value grows, down when it shrinks. The box takes its new width in the same move.
    const ROLLING = Symbol('roll');
    const roll = (el, next, rise = true) => {
      if (!el) return;
      next = String(next);
      const prev = el.dataset.shown ?? el.textContent;
      el.dataset.shown = next;
      if (prev === next) return;
      if (still || !el.getClientRects().length || !panelShownFor(el)) {
        el[ROLLING] = null;
        el.textContent = next;
        return;
      }
      const from = el.offsetWidth;
      const a = [...prev];
      const b = [...next];
      const n = Math.max(a.length, b.length);
      const pa = Array(n - a.length).fill('').concat(a);
      const pb = Array(n - b.length).fill('').concat(b);
      el.textContent = '';
      const moves = [];
      pb.forEach((char, i) => {
        const cell = document.createElement('span');
        cell.className = 'kodza-cart-drawer__char';
        el.append(cell);
        if (pa[i] === char) {
          cell.textContent = char;
          return;
        }
        const delay = (n - 1 - i) * STAGGER * pace;
        // Each cell goes from the width of its old character to the new one: none overlaps its neighbour
        cell.textContent = pa[i];
        const wide = cell.offsetWidth;
        cell.textContent = '';
        if (char) {
          const now = document.createElement('span');
          now.textContent = char;
          cell.append(now);
          moves.push(now.animate([{ transform: `translateY(${rise ? '100%' : '-100%'})` }, { transform: 'none' }], { duration: ROLL * pace, delay, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' }));
        }
        if (pa[i]) {
          const old = document.createElement('span');
          old.className = 'kodza-cart-drawer__was';
          old.setAttribute('aria-hidden', 'true');
          old.textContent = pa[i];
          cell.append(old);
          moves.push(old.animate([{ transform: 'none', opacity: 1 }, { transform: `translateY(${rise ? '-100%' : '100%'})`, opacity: 0 }], { duration: ROLL * pace, delay, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'both' }));
        }
        const narrow = cell.offsetWidth;
        if (wide !== narrow) moves.push(cell.animate([{ width: `${wide}px` }, { width: `${narrow}px` }], { duration: ROLL * pace, delay, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'backwards' }));
      });
      const to = el.offsetWidth;
      if (from !== to) moves.push(el.animate([{ width: `${from}px` }, { width: `${to}px` }], { duration: ROLL * pace, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' }));
      const token = {};
      el[ROLLING] = token;
      Promise.all(moves.map((m) => m.finished)).then(() => {
        if (el[ROLLING] === token) el.textContent = next;
      }, () => {});
    };
    // The trigger rolls on the page; inside the panel, only while it is on screen
    const panelShownFor = (el) => !panel.contains(el) || panel.open;

    // A line of text swapped for another: the old one rises out of its mask, the new one follows
    const swap = (el, html) => {
      if (!el || el.dataset.html === html) return;
      el.dataset.html = html;
      const old = el.firstElementChild;
      const next = document.createElement('span');
      next.className = 'kodza-cart-drawer__swap';
      next.innerHTML = html;
      if (!old || still || !panel.open) {
        el.replaceChildren(next);
        return;
      }
      old.className = 'kodza-cart-drawer__swap is-leaving';
      el.append(next);
      const easing = 'cubic-bezier(0.22, 1, 0.36, 1)';
      old.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-100%)', opacity: 0 }], { duration: ms(ROW), easing, fill: 'forwards' }).finished.then(() => old.remove(), () => {});
      next.animate([{ transform: 'translateY(100%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: ms(ROW), delay: ms(60), easing, fill: 'backwards' });
    };

    // Said to screen readers: emptied first, so the same words twice are read twice
    let sayTimer = 0;
    const say = (text) => {
      if (!live) return;
      live.textContent = '';
      cancel(sayTimer);
      sayTimer = later(() => (live.textContent = text), 60);
    };

    // ---------- Opening and closing ----------
    let timer = 0;
    let opener = null;
    const setY = (y) => panel.style.setProperty('--kz-cart-drawer-y', `${Math.max(0, y)}px`);
    const rows = () => [...list.children];

    // Opened with the pointer: the focus goes to the panel itself, so no ring shows on Close
    let byKeyboard = false;
    document.addEventListener('keydown', () => (byKeyboard = true), { signal, capture: true });
    document.addEventListener('pointerdown', () => (byKeyboard = false), { signal, capture: true });

    const open = () => {
      cancel(timer);
      if (!panel.open) {
        opener = document.activeElement !== document.body ? document.activeElement : null;
        // The cascade: the head, the shipping bar, the lines in sight, the foot
        [head, shipping, ...rows().slice(0, 5), foot].filter(Boolean).forEach((el, i) => {
          el.style.setProperty('--i', i);
          el.classList.add('is-cascade');
        });
        list.scrollTop = 0;
        panel.showModal();
        if (!byKeyboard) {
          panel.tabIndex = -1;
          panel.focus({ preventScroll: true });
        }
      }
      setY(0);
      panel.classList.add('is-moving');
      requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add('is-open')));
      trigger.setAttribute('aria-expanded', 'true');
    };

    const close = () => {
      if (!panel.open || !panel.classList.contains('is-open')) return;
      panel.classList.add('is-moving');
      panel.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      cancel(timer);
      timer = later(() => {
        panel.close();
        panel.classList.remove('is-moving');
        panel.querySelectorAll('.is-cascade').forEach((el) => el.classList.remove('is-cascade'));
        const back = opener?.isConnected && shown(opener) ? opener : trigger;
        opener = null;
        back.focus({ preventScroll: true });
      }, duration);
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
    checkout?.addEventListener('click', (event) => {
      if (checkout.getAttribute('aria-disabled') === 'true') event.preventDefault();
    }, { signal });

    // Dragged down by its grip or its head on phones: let go far enough, or flicked, it closes
    let drag = null;
    [q('grip'), head].filter(Boolean).forEach((handle) => {
      handle.addEventListener('pointerdown', (event) => {
        if (!phone.matches || event.target.closest('button')) return;
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
        const y = parseFloat(getComputedStyle(panel).getPropertyValue('--kz-cart-drawer-y')) || 0;
        const flick = drag.velocity > 0.6;
        drag = null;
        panel.classList.add('is-moving');
        if (flick || y > panel.offsetHeight * 0.25) return close();
        setY(0);
      };
      handle.addEventListener('pointerup', release, { signal });
      handle.addEventListener('pointercancel', release, { signal });
    });

    // ---------- The lines ----------
    const fmt = (cents, currency) => cart.format(cents, currency || state.currency || root.dataset.currency, root.dataset.locale);
    const optionsOf = (item) => Object.values(item.options || {}).filter(Boolean).join(' · ');
    const line = (item) => {
      const li = document.createElement('li');
      li.className = 'kodza-cart-drawer__item';
      li.dataset.key = item.key;
      const name = item.url ? `<a class="kodza-cart-drawer__name" href="${escape(item.url)}">${escape(item.title)}</a>` : `<span class="kodza-cart-drawer__name">${escape(item.title)}</span>`;
      const thumb = item.image ? `<img src="${escape(item.image)}" alt="" width="64" height="80" loading="lazy" decoding="async">` : '';
      li.innerHTML = `<div class="kodza-cart-drawer__line">`
        + `<span class="kodza-cart-drawer__thumb">${thumb}</span>`
        + `<div class="kodza-cart-drawer__info">${name}<span class="kodza-cart-drawer__options">${escape(optionsOf(item))}</span></div>`
        + `<span class="kodza-cart-drawer__price kodza-cart-drawer__roll"></span>`
        + `<div class="kodza-cart-drawer__stepper">`
        + `<button class="kodza-cart-drawer__step" type="button" data-step="-1" tabindex="-1" aria-label="${escape(word('decrease'))}">${MINUS}</button>`
        + `<input class="kodza-cart-drawer__qty" type="number" inputmode="numeric" min="0" max="${MAX}" step="1" aria-label="${escape(fill(word('quantity'), { title: item.title }))}">`
        + `<button class="kodza-cart-drawer__step" type="button" data-step="1" tabindex="-1" aria-label="${escape(word('increase'))}">${PLUS}</button>`
        + `</div>`
        + `<button class="kodza-cart-drawer__remove" type="button">${escape(word('remove'))}</button>`
        + `</div>`
        + `<div class="kodza-cart-drawer__removed" aria-hidden="true">`
        + `<span class="kodza-cart-drawer__removed-text">${escape(fill(word('removed'), { title: item.title }))}</span>`
        + `<button class="kodza-cart-drawer__undo" type="button" tabindex="-1">${escape(word('undo'))}</button>`
        + `</div>`;
      li.item = item;
      fresh(li, item);
      return li;
    };
    // A line's quantity and total, without touching a quantity being typed
    const fresh = (li, item, rise = true) => {
      li.item = item;
      const input = li.querySelector('.kodza-cart-drawer__qty');
      if (!li.typing && document.activeElement !== input) input.value = item.quantity;
      roll(li.querySelector('.kodza-cart-drawer__price'), fmt(item.price * item.quantity, item.currency), rise);
    };

    // Height in motion: a line growing in, folding to its Undo row, or away
    const grow = (li, from, to, delay = 0) => {
      if (still) return Promise.resolve();
      li.getAnimations().forEach((a) => a.cancel());
      return li.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: ms(ROW), delay, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'backwards' }).finished.catch(() => {});
    };
    const enter = (li, delay = 0) => {
      if (still) return;
      grow(li, 0, li.offsetHeight, delay);
      li.querySelector('.kodza-cart-drawer__line').animate(
        [{ transform: 'translateY(18px)', opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: ms(ROW + 120), delay: delay + ms(80), easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' },
      );
    };
    const leave = (li) => {
      cancel(li.undoTimer);
      if (li.contains(document.activeElement)) (li.nextElementSibling?.querySelector('.kodza-cart-drawer__remove') || q('close'))?.focus({ preventScroll: true });
      li.classList.add('is-leaving');
      grow(li, li.offsetHeight, 0).then(() => {
        li.remove();
        settleEmpty();
      });
      if (still) {
        li.remove();
        settleEmpty();
      }
    };

    // Removed: the line folds to "Removed. Undo" for a few seconds, then goes
    const ghost = (li) => {
      const from = li.offsetHeight;
      const index = rows().filter((el) => !el.classList.contains('is-removed')).indexOf(li);
      li.classList.add('is-removed');
      li.querySelector('.kodza-cart-drawer__line').inert = true;
      const removed = li.querySelector('.kodza-cart-drawer__removed');
      removed.removeAttribute('aria-hidden');
      const undo = li.querySelector('.kodza-cart-drawer__undo');
      undo.tabIndex = 0;
      if (li.contains(document.activeElement) || document.activeElement === document.body) undo.focus({ preventScroll: true });
      li.at = Math.max(0, index);
      grow(li, from, li.offsetHeight);
      li.undoTimer = later(() => leave(li), UNDO_HOLD);
      say(fill(word('gone'), { title: li.item.title }));
    };
    const revive = (li) => {
      cancel(li.undoTimer);
      const from = li.offsetHeight;
      const hadFocus = li.contains(document.activeElement);
      li.classList.remove('is-removed');
      li.querySelector('.kodza-cart-drawer__line').inert = false;
      li.querySelector('.kodza-cart-drawer__removed').setAttribute('aria-hidden', 'true');
      li.querySelector('.kodza-cart-drawer__undo').tabIndex = -1;
      if (hadFocus) li.querySelector('.kodza-cart-drawer__remove').focus({ preventScroll: true });
      grow(li, from, li.offsetHeight);
    };

    // The state of the bag, drawn: lines kept by key, new ones grow in, gone ones fold away
    let state = { items: [], count: 0, subtotal: 0, currency: '' };
    let shownCount = null;
    let hold = null; // an add in flight: the panel waits for it to land
    let latest = null;
    const settleEmpty = () => {
      const isEmpty = !state.count && !rows().length;
      root.classList.toggle('is-empty', isEmpty);
      if (empty) empty.inert = !isEmpty;
      list.inert = isEmpty;
      if (checkout) {
        checkout.setAttribute('aria-disabled', String(!state.count));
        checkout.tabIndex = state.count ? 0 : -1;
      }
    };
    const drawTrigger = (n) => {
      const rise = shownCount === null || n >= shownCount;
      shownCount = n;
      trigger.dataset.count = String(n);
      roll(badge, String(n), rise);
      trigger.setAttribute('aria-label', n ? (n === 1 ? word('bagOne') : fill(word('bag'), { count: n })) : word('bagEmpty'));
    };
    const draw = (next, delay = 0) => {
      const before = state;
      state = next;
      const keys = new Set(next.items.map((item) => item.key));
      const byKey = new Map(rows().map((li) => [li.dataset.key, li]));
      // Gone from the bag without our Remove (another tab, the platform): it folds away
      byKey.forEach((li, key) => {
        if (!keys.has(key) && !li.classList.contains('is-removed') && !li.classList.contains('is-leaving')) {
          if (li.removing) ghost(li);
          else leave(li);
        }
        li.removing = false;
      });
      let added = null;
      next.items.forEach((item, i) => {
        let li = byKey.get(item.key);
        if (li && li.classList.contains('is-leaving')) li = null;
        if (li) {
          const old = before.items.find((x) => x.key === item.key);
          if (li.classList.contains('is-removed')) revive(li);
          fresh(li, item, !old || item.quantity >= old.quantity);
          return;
        }
        li = line(item);
        // In its place among the lines still in the bag
        const after = next.items.slice(i + 1).map((x) => byKey.get(x.key)).find((el) => el && el.parentNode === list);
        list.insertBefore(li, after || null);
        byKey.set(item.key, li);
        added = item;
        if (panel.open) enter(li, delay);
      });
      if (added && panel.open) say(fill(word('added'), { title: added.title }));
      roll(count, String(next.count), next.count >= before.count);
      roll(subtotal, fmt(next.subtotal), next.subtotal >= before.subtotal);
      if (threshold) {
        const left = Math.max(0, threshold - next.subtotal);
        meter?.style.setProperty('--kz-cart-drawer-progress', String(Math.min(1, next.subtotal / threshold)));
        shipping.classList.toggle('is-free', !left);
        if (left) {
          swap(shippingText, fill(escape(word('shipping')), { amount: '<span class="kodza-cart-drawer__amount kodza-cart-drawer__roll"></span>' }));
          roll(shippingText.querySelector('.kodza-cart-drawer__swap:last-child .kodza-cart-drawer__amount'), fmt(left), left <= threshold - before.subtotal);
        } else {
          if (shippingText.dataset.html && before.subtotal < threshold && panel.open) say(word('shipped'));
          swap(shippingText, escape(word('shipped')));
        }
      }
      settleEmpty();
    };
    const render = (next) => {
      latest = next;
      if (hold) return;
      drawTrigger(next.count);
      draw(next);
    };

    // ---------- Changing a line ----------
    const send = (li, quantity) => {
      quantity = Math.max(0, Math.min(MAX, quantity));
      if (!quantity) li.removing = true;
      cart.update(li.dataset.key, quantity, li);
    };
    list.addEventListener('click', (event) => {
      const li = event.target.closest('.kodza-cart-drawer__item');
      if (!li) return;
      const step = event.target.closest('.kodza-cart-drawer__step');
      const input = li.querySelector('.kodza-cart-drawer__qty');
      if (step) {
        const value = Math.max(0, Math.min(MAX, (parseInt(input.value, 10) || 0) + Number(step.dataset.step)));
        input.value = value;
        type(li, value);
        return;
      }
      if (event.target.closest('.kodza-cart-drawer__remove')) return send(li, 0);
      if (event.target.closest('.kodza-cart-drawer__undo')) {
        cancel(li.undoTimer);
        const { key, ...item } = li.item;
        cart.add({ ...item, at: li.at, quiet: true }, li);
      }
    }, { signal });
    // A typed quantity waits a moment for the next keystroke; 0 removes the line at once
    const type = (li, value) => {
      cancel(li.typing);
      li.typing = 0;
      if (!value) return send(li, 0);
      roll(li.querySelector('.kodza-cart-drawer__price'), fmt(li.item.price * value, li.item.currency), value >= li.item.quantity);
      li.typing = later(() => {
        li.typing = 0;
        send(li, value);
      }, SETTLE);
    };
    list.addEventListener('input', (event) => {
      const input = event.target.closest('.kodza-cart-drawer__qty');
      if (!input || input.value === '') return;
      const li = input.closest('.kodza-cart-drawer__item');
      type(li, Math.max(0, Math.min(MAX, parseInt(input.value, 10) || 0)));
    }, { signal });
    // Enter applies a typed quantity now, without waiting for the pause
    list.addEventListener('keydown', (event) => {
      const input = event.target.closest('.kodza-cart-drawer__qty');
      if (!input || event.key !== 'Enter' || input.value === '') return;
      event.preventDefault();
      const li = input.closest('.kodza-cart-drawer__item');
      cancel(li.typing);
      li.typing = 0;
      send(li, parseInt(input.value, 10) || 0);
    }, { signal });
    list.addEventListener('focusout', (event) => {
      const input = event.target.closest('.kodza-cart-drawer__qty');
      const li = input?.closest('.kodza-cart-drawer__item');
      if (li && input.value === '') input.value = li.item.quantity;
    }, { signal });

    // ---------- An add, from anywhere on the page ----------
    // The drawer nearest to the form plays it (a page with two drawers moves only one)
    const nearest = (source) => {
      let best = null;
      let depth = -1;
      document.querySelectorAll(SELECTOR).forEach((el) => {
        if (!el.classList.contains('is-ready') || !shown(el.querySelector('.kodza-cart-drawer__trigger') || el)) return;
        let shared = el;
        while (shared && !(source instanceof Node && shared.contains(source))) shared = shared.parentElement;
        let d = 0;
        for (let up = shared; up; up = up.parentElement) d++;
        if (d > depth) {
          depth = d;
          best = el;
        }
      });
      return best;
    };

    const bump = () => {
      if (still || !bag) return;
      bag.animate(
        [{ transform: 'none' }, { transform: 'translateY(1.5px) scale(1.08, 0.9)', offset: 0.3 }, { transform: 'translateY(-1px) scale(0.97, 1.04)', offset: 0.65 }, { transform: 'none' }],
        { duration: 520 * pace, easing: 'ease-out' },
      );
    };

    // The picture flies into the bag: a short lift, then a curve, sped up in the middle, that
    // ends round and about the size of the bag
    const flights = new Set();
    const fly = (picture) => {
      const start = picture.getBoundingClientRect();
      const end = (bag || trigger).getBoundingClientRect();
      const { width: w, height: h } = start;
      const side = Math.min(w, h);
      const radius = parseFloat(getComputedStyle(picture).borderTopLeftRadius) || 0;
      const p0 = { x: start.left + w / 2, y: start.top + h / 2 };
      const p2 = { x: end.left + end.width / 2, y: end.top + end.height * 0.42 };
      const dx = p2.x - p0.x;
      const lift = Math.min(140, Math.max(36, Math.hypot(dx, p2.y - p0.y) * 0.22));
      const p1 = { x: p0.x + dx * 0.62, y: Math.min(p0.y, p2.y) - lift };
      const small = Math.min(1, (end.width * 0.9) / side);

      const wrap = document.createElement('span');
      const pic = document.createElement('span');
      wrap.setAttribute('aria-hidden', 'true');
      Object.assign(wrap.style, {
        position: 'fixed', left: `${start.left}px`, top: `${start.top}px`, width: `${w}px`, height: `${h}px`,
        display: 'block', margin: '0', padding: '0', zIndex: '2147483000', pointerEvents: 'none',
        filter: 'drop-shadow(0 10px 14px rgba(10, 10, 10, 0.22))',
      });
      Object.assign(pic.style, {
        display: 'block', width: '100%', height: '100%', margin: '0',
        background: `center / cover no-repeat url("${(picture.currentSrc || picture.src).replace(/"/g, '%22')}")`,
      });
      wrap.append(pic);
      document.body.append(wrap);

      const LIFT = 140;
      const TRAVEL = 720;
      const at = LIFT / (LIFT + TRAVEL);
      const clip = (c) => `inset(${((h - side) / 2) * c}px ${((w - side) / 2) * c}px round ${radius + (side / 2 - radius) * c}px)`;
      const frames = [
        { offset: 0, transform: 'none', clipPath: clip(0), opacity: 1, easing: 'ease-out' },
        { offset: at, transform: 'translateY(-6px) scale(1.04)', clipPath: clip(0), opacity: 1 },
      ];
      for (let i = 1; i <= 24; i++) {
        const u = i / 24;
        const p = (1 - Math.cos(Math.PI * u)) / 2;
        const x = (1 - p) ** 2 * p0.x + 2 * (1 - p) * p * p1.x + p ** 2 * p2.x - p0.x;
        const y = (1 - p) ** 2 * p0.y + 2 * (1 - p) * p * p1.y + p ** 2 * p2.y - p0.y - 6 * (1 - u);
        const shrink = 1 - (1 - Math.min(1, u / 0.8)) ** 2;
        const scale = 1.04 + (small - 1.04) * shrink;
        const tilt = 7 * Math.sign(dx) * Math.sin(Math.PI * u);
        frames.push({
          offset: at + (1 - at) * u,
          transform: `translate(${x}px, ${y}px) rotate(${tilt}deg) scale(${u > 0.86 ? scale * (1 - ((u - 0.86) / 0.14) * 0.55) : scale})`,
          clipPath: clip(Math.min(1, u / 0.45)),
          opacity: u > 0.86 ? 1 - (u - 0.86) / 0.14 : 1,
        });
      }
      const flight = wrap.animate(frames, { duration: (LIFT + TRAVEL) * pace, fill: 'forwards' });
      const done = () => {
        flights.delete(stop);
        wrap.remove();
      };
      // A refused add while it is still in the air: it falls away instead of landing
      const drop = () => {
        flight.pause();
        const now = getComputedStyle(wrap).transform;
        wrap.getAnimations().forEach((a) => a.cancel());
        wrap.animate([{ transform: now, opacity: 1 }, { transform: `${now === 'none' ? '' : now} translateY(24px)`, opacity: 0 }], { duration: 280 * pace, easing: 'ease-in', fill: 'forwards' }).finished.then(done, done);
      };
      const stop = () => {
        flight.cancel();
        done();
      };
      flights.add(stop);
      return { landed: flight.finished.then(() => done()), drop };
    };

    let holdTimer = 0;
    const release = () => {
      cancel(holdTimer);
      if (!hold) return;
      hold = null;
      if (latest) {
        if (latest.count !== shownCount) drawTrigger(latest.count);
        draw(latest);
      }
    };
    document.addEventListener('kodza:cart-add', (event) => {
      const detail = event.detail || {};
      if (detail.quiet || nearest(event.target) !== root) return;
      // Already open (an add from inside the drawer): the line simply grows in
      if (panel.open) return;
      const picture = pictureFor(event.target);
      hold = {};
      const mine = hold;
      // Never stuck: the panel shows the bag after two seconds whatever happens
      holdTimer = later(release, 2000 + ms(900));
      const show = () => {
        if (hold !== mine || signal.aborted) return;
        if (latest) drawTrigger(latest.count);
        bump();
        later(() => {
          if (hold !== mine) return;
          // An empty bag never shows "nothing in here": the first line is drawn before it opens
          if (!rows().length) release();
          open();
          later(release, duration * REVEAL);
        }, ms(BEAT));
      };
      // The platform said how the add went (detail.wait), known once the event is through
      requestAnimationFrame(() => {
        if (hold !== mine) return;
        const flight = !still && seen(picture) && seen(trigger) ? fly(picture) : null;
        let failed = false;
        detail.request?.catch(() => {
          failed = true;
          flight?.drop();
          if (hold === mine) {
            hold = null;
            cancel(holdTimer);
          }
        });
        if (flight) flight.landed.then(() => !failed && show(), () => {});
        else show();
      });
    }, { signal });
    document.addEventListener('kodza:cart-open', (event) => {
      if (nearest(event.target) === root) open();
    }, { signal });
    document.addEventListener('kodza:cart-change', (event) => render(event.detail), { signal });

    render(cart.get());
    signal.addEventListener('abort', () => {
      timers.forEach(clearTimeout);
      flights.forEach((stop) => stop());
      if (panel.open) panel.close();
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
