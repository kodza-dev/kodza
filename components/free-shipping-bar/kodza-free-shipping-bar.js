// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Free Shipping Bar
// How far the cart is from free shipping. It listens to the cart (kodza:cart-change): the amount
// left rolls digit by digit, the line fills up and the little van rides it; once it is there, the
// sentence rolls into "Free shipping. Nice." Take something out and it all goes back.
// Settings: data-threshold (in cents) and data-currency on the root, the --kz-free-shipping-bar-*
// variables in the CSS, data-text-* on the root, the constants below. The cart itself is the Cart
// engine, further down: a small cart kept in the browser, or your platform's through its events.
(() => {
  const SELECTOR = '.kodza-free-shipping-bar';

  // Timings, in milliseconds (times the site's pace)
  const ROLL = 420; // a rolling digit
  const STAGGER = 40; // between two rolling digits, from the units
  const SWAP = 520; // the old sentence rising out, the new one coming in
  const HOP = 460; // the van's little hop when it gets there

  // What the script writes, in English unless the root says otherwise (data-text-<key>)
  const WORDS = {
    start: 'Free shipping over {amount}.', // an empty cart
    away: '{amount} away from free shipping.',
    free: 'Free shipping. Nice.',
  };

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
  const escape = (text) => String(text ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const ms = (t) => (still ? 0 : t * pace);
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const fill = (text, values) => text.replace(/\{(\w+)\}/g, (all, name) => values[name] ?? all);

    const q = (name) => root.querySelector(`.kodza-free-shipping-bar__${name}`);
    const text = q('text');
    const van = q('van');
    const threshold = Math.max(0, Math.round(Number(root.dataset.threshold) || 0));
    // A round amount without its cents: "€150", "€61.50"
    const fmt = (cents) => {
      const text = cart.format(cents, root.dataset.currency, root.dataset.locale);
      return cents % 100 ? text : text.replace(/[.,\u066b]0+(?=\D*$)/, '');
    };

    const moving = new Set();
    const timers = new Set();
    const play = (el, frames, options) => {
      const move = el.animate(frames, options);
      moving.add(move);
      move.finished.then(() => moving.delete(move), () => moving.delete(move));
      return move;
    };
    signal.addEventListener('abort', () => {
      timers.forEach(clearTimeout);
      moving.forEach((move) => move.cancel());
    });

    // ---------- Rolling digits ----------
    // Only the characters that change roll, right-aligned like a till, from the units; up when
    // the amount left shrinks, down when it grows. The box takes its new width in the same move.
    const ROLLING = Symbol('roll');
    const roll = (el, next, rise = true) => {
      if (!el) return;
      next = String(next);
      const prev = el.dataset.shown ?? el.textContent;
      el.dataset.shown = next;
      if (prev === next) return;
      if (still || !seen || !el.getClientRects().length) {
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
        cell.className = 'kodza-free-shipping-bar__char';
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
          moves.push(play(now, [{ transform: `translateY(${rise ? '100%' : '-100%'})` }, { transform: 'none' }], { duration: ROLL * pace, delay, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' }));
        }
        if (pa[i]) {
          const old = document.createElement('span');
          old.className = 'kodza-free-shipping-bar__was';
          old.setAttribute('aria-hidden', 'true');
          old.textContent = pa[i];
          cell.append(old);
          moves.push(play(old, [{ transform: 'none', opacity: 1 }, { transform: `translateY(${rise ? '-100%' : '100%'})`, opacity: 0 }], { duration: ROLL * pace, delay, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'both' }));
        }
        const narrow = cell.offsetWidth;
        if (wide !== narrow) moves.push(play(cell, [{ width: `${wide}px` }, { width: `${narrow}px` }], { duration: ROLL * pace, delay, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'backwards' }));
      });
      const to = el.offsetWidth;
      if (from !== to) moves.push(play(el, [{ width: `${from}px` }, { width: `${to}px` }], { duration: ROLL * pace, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' }));
      const token = {};
      el[ROLLING] = token;
      Promise.all(moves.map((m) => m.finished)).then(() => {
        if (el[ROLLING] === token) el.textContent = next;
      }, () => {});
    };

    // A sentence swapped for another: the old one rises out of its mask, the new one follows
    const swap = (html) => {
      if (text.dataset.html === html) return;
      text.dataset.html = html;
      const old = text.querySelector('.kodza-free-shipping-bar__swap:not(.is-leaving)');
      const next = document.createElement('span');
      next.className = 'kodza-free-shipping-bar__swap';
      next.innerHTML = html;
      if (!old || still || !seen) {
        text.replaceChildren(next);
        return;
      }
      text.querySelectorAll('.is-leaving').forEach((el) => el.remove());
      old.classList.add('is-leaving');
      old.setAttribute('aria-hidden', 'true');
      text.append(next);
      const easing = 'cubic-bezier(0.22, 1, 0.36, 1)';
      play(old, [{ transform: 'none', opacity: 1 }, { transform: 'translateY(-100%)', opacity: 0 }], { duration: ms(SWAP), easing, fill: 'forwards' }).finished.then(() => old.remove(), () => {});
      play(next, [{ transform: 'translateY(100%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: ms(SWAP), delay: ms(60), easing, fill: 'backwards' });
    };

    // The sentence is the status: screen readers hear the new one, not the rolling digits
    text.setAttribute('aria-live', 'polite');
    text.setAttribute('aria-atomic', 'true');

    let seen = false;
    let before = null;
    const draw = (detail) => {
      const subtotal = Math.max(0, Math.round(Number(detail?.subtotal) || 0));
      const left = Math.max(0, threshold - subtotal);
      const was = before === null ? left : before;
      before = left;
      root.style.setProperty('--kz-free-shipping-bar-progress', String(threshold ? Math.min(1, subtotal / threshold) : 1));
      root.classList.toggle('is-free', !left);
      const amount = '<span class="kodza-free-shipping-bar__amount kodza-free-shipping-bar__roll"></span>';
      if (!left) {
        swap(escape(word('free')));
        // The van gets there: a little hop at the end of its ride
        if (was && seen && !still && van) play(van, [{ transform: 'none' }, { transform: 'translateY(-4px) rotate(-6deg)', offset: 0.4 }, { transform: 'none' }], { duration: ms(HOP), delay: ms(560), easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      } else if (!subtotal) {
        swap(fill(escape(word('start')), { amount }));
        roll(text.querySelector('.kodza-free-shipping-bar__swap:last-child .kodza-free-shipping-bar__amount'), fmt(threshold), false);
      } else {
        swap(fill(escape(word('away')), { amount }));
        roll(text.querySelector('.kodza-free-shipping-bar__swap:last-child .kodza-free-shipping-bar__amount'), fmt(left), left <= was);
      }
    };

    draw(cart.get());
    // The first picture is drawn still; from the next frame on, every change moves
    requestAnimationFrame(() => {
      if (!signal.aborted) seen = true;
    });
    document.addEventListener('kodza:cart-change', (event) => draw(event.detail), { signal });
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
