// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Product Card
// The card of a shop grid. Under the pointer its second photo rises over the first; on phones the
// photos swipe, with two dots. A colour swatch swaps the photos in place, the old one wiped away
// towards the new swatch. "Add" sends the card's form to the cart; with sizes, the word rolls up
// and the sizes come from below, and a size adds it. Then "Added", and back to "Add".
// Settings: the --kz-product-card-* variables in the CSS, data-text-* on the root, the constants
// below. The cart itself is the Cart engine, further down: a small cart kept in the browser, or
// your platform's (Shopify, WooCommerce) through its events. A Cart Drawer on the page catches it.
(() => {
  const SELECTOR = '.kodza-product-card';

  // Timings, in milliseconds (times the site's pace)
  const ROLL = 420; // a word rolling in the button
  const SWAP = 640; // the old photo of a colour, wiped away
  // Not motion, so not paced
  const HOLD = 1600; // how long "Added" stays before "Add" comes back

  // What the script writes, in English unless the root says otherwise (data-text-<key>)
  const WORDS = {
    added: 'Added', // in the button, once it is in the cart
    photo: 'Photo {n} of {count}', // the dots of the swipe, read by screen readers
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };

  const finger = window.matchMedia('(hover: none)');
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
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const ms = (t) => (still ? 0 : t * pace);
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const fill = (text, values) => text.replace(/\{(\w+)\}/g, (all, name) => values[name] ?? all);

    const q = (name) => root.querySelector(`.kodza-product-card__${name}`);
    const media = q('media');
    const track = q('track');
    const link = q('link');
    const open = q('open');
    const add = q('add');
    const images = [...root.querySelectorAll('.kodza-product-card__image')];
    const [main, second] = [images[0], root.querySelector('.kodza-product-card__image--second')];
    const sizes = [...root.querySelectorAll('.kodza-product-card__size')];
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

    // ---------- The second photo, under the pointer ----------
    if (second && media) {
      const over = (event) => {
        if (event.pointerType !== 'mouse') return;
        const box = media.getBoundingClientRect();
        const inside = event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
        root.classList.toggle('is-peek', inside);
      };
      root.addEventListener('pointermove', over, { signal });
      root.addEventListener('pointerleave', () => root.classList.remove('is-peek'), { signal });
    }

    // ---------- The swipe, with a finger ----------
    let dots = null;
    const current = () => (track && track.clientWidth ? Math.round(track.scrollLeft / track.clientWidth) : 0);
    const mark = () => {
      if (!dots) return;
      const n = current();
      [...dots.children].forEach((dot, i) => dot.classList.toggle('is-current', i === n));
      dots.setAttribute('aria-label', fill(word('photo'), { n: n + 1, count: images.length }));
    };
    const swipe = () => {
      const on = finger.matches && images.length > 1 && track;
      if (on && !dots) {
        dots = document.createElement('span');
        dots.className = 'kodza-product-card__dots';
        dots.setAttribute('role', 'img');
        dots.innerHTML = images.map(() => '<span class="kodza-product-card__dot"></span>').join('');
        media.append(dots);
        mark();
      } else if (!on && dots) {
        dots.remove();
        dots = null;
        if (track) track.scrollLeft = 0;
      }
    };
    swipe();
    finger.addEventListener('change', swipe, { signal });
    track?.addEventListener('scroll', mark, { signal, passive: true });
    // With a finger the photos sit above the card's link (to swipe): a tap on them follows it
    media?.addEventListener('click', (event) => {
      if (!finger.matches || !link || event.target.closest('a, button, input, label')) return;
      link.click();
    }, { signal });

    // ---------- Colours ----------
    const swatches = [...root.querySelectorAll('.kodza-product-card__swatch input')];
    let chosen = swatches.findIndex((input) => input.checked);
    let swapping = 0;
    const swap = async (input) => {
      const at = swatches.indexOf(input);
      const forward = at > chosen;
      chosen = at;
      const { image, imageSecond, alt } = input.dataset;
      if (!image || !main || main.getAttribute('src') === image) return;
      const turn = ++swapping;
      let leaving = null;
      if (!still && main.complete && main.naturalWidth) {
        // The old photo stays on top, as it is, while the new one loads underneath
        leaving = document.createElement('img');
        leaving.className = 'kodza-product-card__leaving';
        leaving.alt = '';
        leaving.src = (dots && current() && second ? second : main).currentSrc;
        media.querySelector('.kodza-product-card__leaving')?.remove();
        track.after(leaving);
      }
      if (track) track.scrollLeft = 0;
      main.removeAttribute('srcset');
      main.src = image;
      if (alt != null) main.alt = alt;
      if (second && imageSecond) {
        second.removeAttribute('srcset');
        second.src = imageSecond;
      }
      mark();
      if (!leaving) return;
      try {
        await main.decode();
      } catch {}
      if (turn !== swapping || signal.aborted) return leaving.remove();
      // Wiped away towards the new swatch: the new colour comes from where you clicked
      const out = forward ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)';
      const options = { duration: ms(SWAP), easing: 'cubic-bezier(0.65, 0, 0.35, 1)' };
      play(main, [{ transform: 'scale(1.06)' }, { transform: 'none' }], { ...options, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      play(leaving, [{ clipPath: 'inset(0 0 0 0)' }, { clipPath: out }], { ...options, fill: 'forwards' })
        .finished.then(() => leaving.remove(), () => leaving.remove());
    };
    swatches.forEach((input) => input.addEventListener('change', () => input.checked && swap(input), { signal }));

    // ---------- Add, and the sizes ----------
    if (!open) return;
    let label = open.querySelector('.kodza-product-card__word');
    const first = label?.textContent || '';
    // A word rolling: the old one goes up, the new one comes from below
    // `swap`: the button is out of sight (the sizes are showing), so the word just changes and
    // the button brings it back down: one motion, not a roll inside a slide
    const roll = (text, swap) => {
      if (!label || label.textContent === text) return;
      const next = label.cloneNode(false);
      next.textContent = text;
      const old = label;
      label = next;
      open.querySelectorAll('.kodza-product-card__word').forEach((el) => el !== old && el.remove());
      if (still || swap) return old.replaceWith(next);
      open.append(next);
      const options = { duration: ms(ROLL), easing: 'cubic-bezier(0.65, 0, 0.35, 1)' };
      // Far enough to leave its box: 130% of a word alone stays inside a tall button
      const far = `${Math.max(old.offsetHeight * 1.3, (open.clientHeight + old.offsetHeight) / 2 + 2)}px`;
      play(old, [{ transform: 'none' }, { transform: `translateY(-${far})` }], { ...options, fill: 'forwards' })
        .finished.then(() => old.remove(), () => old.remove());
      play(next, [{ transform: `translateY(${far})` }, { transform: 'none' }], options);
    };

    sizes.forEach((size, i) => size.style.setProperty('--kz-product-card-i', i));
    const picking = () => root.classList.contains('is-picking');
    const pick = (on, focus) => {
      if (!sizes.length || on === picking()) return;
      root.classList.toggle('is-picking', on);
      open.setAttribute('aria-expanded', String(on));
      if (on && focus) sizes.find((size) => !size.disabled)?.focus({ preventScroll: true });
      // Closed while a size had the focus: it goes back to Add
      if (!on && add.contains(document.activeElement) && document.activeElement !== open) open.focus({ preventScroll: true });
    };
    if (sizes.length) {
      // event.detail is 0 for a click made with the keyboard
      open.addEventListener('click', (event) => pick(true, event.detail === 0), { signal });
      root.addEventListener('pointerleave', (event) => event.pointerType === 'mouse' && pick(false), { signal });
      add.addEventListener('focusout', (event) => {
        if (!add.contains(event.relatedTarget) && event.relatedTarget) pick(false);
      }, { signal });
      add.addEventListener('keydown', (event) => {
        if (!picking()) return;
        if (event.key === 'Escape') {
          event.preventDefault();
          pick(false);
          open.focus({ preventScroll: true });
        } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          const live = sizes.filter((size) => !size.disabled);
          const at = live.indexOf(document.activeElement);
          if (at < 0) return;
          event.preventDefault();
          live[(at + (event.key === 'ArrowRight' ? 1 : live.length - 1)) % live.length].focus();
        }
      }, { signal });
    }

    // In the cart: Added, then Add again. A refused request brings Add back at once
    let back = null;
    root.addEventListener('kodza:cart-add', (event) => {
      if (event.target !== root) return;
      const focused = add.contains(document.activeElement);
      const fromSizes = picking();
      root.classList.add('is-added');
      pick(false);
      if (focused) open.focus({ preventScroll: true });
      roll(word('added'), fromSizes);
      clearTimeout(back);
      timers.delete(back);
      const reset = () => {
        root.classList.remove('is-added');
        roll(first);
      };
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
