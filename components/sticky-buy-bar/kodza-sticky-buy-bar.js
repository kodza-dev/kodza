// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Sticky Buy Bar
// On a product page, once the page's own Add to cart has scrolled off the top of the screen, a bar
// comes up from the bottom with the picture, the name, the variant chosen, the price and the same
// button. It goes back down when the real button returns, before the footer, and while a modal
// (the Cart Drawer) is open. The variant follows the page's form: its radios and selects
// (data-price, data-image on an option), or a Buy Box's kodza:variant-change.
// Settings: data-target (the buy form, a CSS selector: by default the nearest one around the bar)
// and data-until (what the bar never covers: the first match after the form, "footer" by default)
// on the root, the --kz-sticky-buy-bar-* variables in the CSS, data-text-* on the root, the
// constants below. The cart is the Cart engine, further down: a small cart kept in the browser,
// or your platform's through its events.
(() => {
  const SELECTOR = '.kodza-sticky-buy-bar';

  // Timings, in milliseconds (times the site's pace)
  const ROLL = 420; // the variant, price or button rolling
  // Not motion, so not paced
  const HOLD = 1600; // how long "Added" stays in the button

  // What the script writes, in English unless the root says otherwise (data-text-<key>)
  const WORDS = {
    added: 'Added', // in the button, once it is in the cart
  };
  const TICK = '<svg class="kodza-sticky-buy-bar__tick" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4 8-9" pathLength="1" /></svg>';

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

  // The buy form: data-target, or the nearest one around the bar
  const formFor = (root) => {
    if (root.dataset.target) {
      try {
        return document.querySelector(root.dataset.target);
      } catch {
        return null;
      }
    }
    for (let el = root.parentElement; el; el = el.parentElement) {
      const form = [...el.querySelectorAll(FORMS)].find((found) => !root.contains(found));
      if (form) return form;
    }
    return null;
  };
  // What the bar never covers: the first match after the form
  const untilFor = (root, form) => {
    let found = [];
    try {
      found = [...document.querySelectorAll(root.dataset.until || 'footer')];
    } catch {
      return null;
    }
    return found.find((el) => form.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING && !el.contains(form)) || null;
  };
  const modalOpen = () => {
    try {
      return !!document.querySelector('dialog:modal');
    } catch {
      return false;
    }
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const form = formFor(root);
    if (!form) return;
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const ms = (t) => (still ? 0 : t * pace);
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const q = (name) => root.querySelector(`.kodza-sticky-buy-bar__${name}`);
    const submitter = form.querySelector('button[type="submit"], button:not([type]), input[type="submit"]');
    const until = untilFor(root, form);

    const lang = root.closest('[lang]')?.lang || undefined;
    const currency = root.dataset.currency || form.dataset.currency;
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
    const play = (el, frames, options) => {
      const animation = el.animate(frames, options);
      moving.add(animation);
      animation.finished.then(() => moving.delete(animation), () => moving.delete(animation));
      return animation;
    };
    let frame = 0;
    const watch = new MutationObserver(() => soon());
    signal.addEventListener('abort', () => {
      timers.forEach(clearTimeout);
      moving.forEach((animation) => animation.cancel());
      cancelAnimationFrame(frame);
      watch.disconnect();
    });

    // A word rolling in its box: the old one goes up, the new one comes from below (`down`: the
    // other way, for a price that drops). Hidden, the bar just swaps it
    const current = new Map();
    const roll = (box, text, { tick = false, down = false } = {}) => {
      const old = current.get(box) || box?.firstElementChild;
      if (!old || (old.textContent === text && !!old.firstElementChild === tick)) return;
      const next = old.cloneNode(false);
      next.innerHTML = tick ? TICK : '';
      next.append(text);
      current.set(box, next);
      [...box.children].forEach((el) => el !== old && el.remove());
      if (!ms(1) || !root.classList.contains('is-shown')) return old.replaceWith(next);
      box.append(next);
      const options = { duration: ms(ROLL), easing: 'cubic-bezier(0.65, 0, 0.35, 1)' };
      // Far enough to leave its box: 130% of a word alone stays inside a tall button
      const far = `${Math.max(old.offsetHeight * 1.3, (box.clientHeight + old.offsetHeight) / 2 + 2)}px`;
      const away = down ? far : `-${far}`;
      play(old, [{ transform: 'none' }, { transform: `translateY(${away})` }], { ...options, fill: 'forwards' })
        .finished.then(() => old.remove(), () => old.remove());
      play(next, [{ transform: `translateY(${down ? `-${far}` : far})` }, { transform: 'none' }], options);
    };

    // Up once the form's button has left the top of the screen; down when it comes back, when
    // the footer comes in, and while a modal is open
    const anchor = submitter || form;
    let shown = false;
    root.inert = true;
    const place = () => {
      const box = anchor.getBoundingClientRect();
      const out = !!anchor.getClientRects().length && box.bottom < 0
        && (!until || until.getBoundingClientRect().top > window.innerHeight)
        && !modalOpen();
      if (out === shown) return;
      shown = out;
      // Leaving with the focus in it: back to the real button, without scrolling
      if (!out && root.contains(document.activeElement)) submitter?.focus({ preventScroll: true });
      root.classList.toggle('is-shown', out);
      root.inert = !out;
    };
    const soon = () => {
      if (!frame) frame = requestAnimationFrame(() => {
        frame = 0;
        place();
      });
    };
    window.addEventListener('scroll', soon, { passive: true, signal });
    window.addEventListener('resize', soon, { passive: true, signal });
    // A dialog opening or closing (the Cart Drawer): the bar steps aside
    watch.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['open'] });
    place();

    // The variant chosen in the form: its options, price and picture
    const variant = q('variant');
    const price = q('price');
    const image = q('image');
    let last = Number(root.dataset.price || form.dataset.price) || 0;
    const show = ({ text, cents, src }) => {
      if (variant && text) roll(variant, text);
      if (price && cents != null && !Number.isNaN(cents) && cents !== last) {
        roll(price, money(cents), { down: cents < last });
        last = cents;
      }
      if (image && src && image.getAttribute('src') !== src) image.src = src;
    };
    // A Buy Box says it with kodza:variant-change; any other form, with its radios and selects
    let told = false;
    form.addEventListener('kodza:variant-change', (event) => {
      told = true;
      const { options = {}, price: cents, image: src } = event.detail || {};
      show({ text: Object.values(options).join(' · '), cents: cents == null ? null : Number(cents), src });
    }, { signal });
    const read = () => {
      if (told || signal.aborted) return;
      const picked = [...form.elements].flatMap((field) => {
        if (field.type === 'radio' && field.checked) return [[field, field.closest('label')?.textContent.trim() || field.value]];
        if (field.tagName === 'SELECT' && field.selectedOptions[0]) return [[field.selectedOptions[0], field.selectedOptions[0].textContent.trim()]];
        return [];
      });
      if (!picked.length) return;
      const priced = picked.find(([el]) => el.dataset.price != null);
      const pictured = picked.find(([el]) => el.dataset.image);
      show({
        text: picked.map(([, text]) => text).filter(Boolean).join(' · '),
        cents: priced ? Number(priced[0].dataset.price) : null,
        src: pictured?.[0].dataset.image,
      });
    };
    form.addEventListener('change', () => queueMicrotask(read), { signal });
    // What the form already holds (a choice kept by the browser, a restart): the bar starts on it
    read();

    // Add to cart: the page's own form, with its quantity and options, then Added for a moment
    const button = q('add');
    if (!button) return;
    const first = button.textContent.trim();
    let back = 0;
    button.addEventListener('click', () => {
      if (typeof form.requestSubmit !== 'function') return form.submit();
      if (submitter?.form === form && submitter.type === 'submit') form.requestSubmit(submitter);
      else form.requestSubmit();
    }, { signal });
    form.addEventListener('kodza:cart-add', (event) => {
      roll(button, word('added'), { tick: true });
      clearTimeout(back);
      timers.delete(back);
      const reset = () => roll(button, first);
      // The platform passes its request to wait() while the event runs: read it just after
      queueMicrotask(() => {
        Promise.resolve(event.detail?.request).then(
          () => !signal.aborted && (back = later(reset, HOLD)),
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
