// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Add to Cart
// The button rolls to "Added", flies a copy of the product picture in an arc into the bag and
// adds one to the cart; the cart rolls its count digit by digit whenever data-count changes,
// from the button or from your code. "kodza:add" bubbles from the button and can be cancelled:
// pass your request to event.detail.wait(promise), and if it rejects the count rolls back and
// the button says "Try again". data-image (a selector) picks the picture, data-cart the carts,
// data-quantity how many it adds.
(() => {
  const SELECTOR = '.kodza-add-to-cart, .kodza-add-to-cart__cart';
  const CART = '.kodza-add-to-cart__cart';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const STATES = ['idle', 'added', 'failed'];
  const countOf = (cart) => Math.max(0, parseInt(cart.dataset.count, 10) || 0);
  const format = (n) => new Intl.NumberFormat(document.documentElement.lang || undefined).format(n);

  // The cart: its count follows data-count, rolling only the digits that change (999 → 1,000
  // carries), and the bag gives a little bump each time something lands in it
  function mountCart(cart, signal) {
    const count = cart.querySelector('.kodza-add-to-cart__count');
    const bag = cart.querySelector('.kodza-add-to-cart__bag');
    let shown = countOf(cart);

    const label = (n) => {
      const text = cart.getAttribute('aria-label');
      if (!text) return;
      cart.setAttribute('aria-label', text.replace(/\d[\d.,  ]*/, format(n)).replace(/\bitems?\b/, n === 1 ? 'item' : 'items'));
    };

    // Old and new numbers aligned on the right: a digit that changes rolls (up when the count
    // grows, down when it shrinks), the units first, and a digit that appears opens its room
    const draw = (from, to) => {
      const a = format(from);
      const b = format(to);
      const n = Math.max(a.length, b.length);
      const was = a.padStart(n);
      const now = b.padStart(n);
      const k = to > from ? 1 : -1;
      count.textContent = '';
      for (let i = 0; i < n; i++) {
        const cell = Object.assign(document.createElement('span'), { className: 'kodza-add-to-cart__digit' });
        const next = Object.assign(document.createElement('span'), { textContent: now[i].trim() });
        cell.append(next);
        count.append(cell);
        if (was[i] === now[i] || reduceMotion) continue;
        const old = Object.assign(document.createElement('span'), { textContent: was[i].trim() });
        cell.append(old);
        const timing = { duration: 460, delay: (n - 1 - i) * 60, easing: ease };
        next.animate([{ transform: `translateY(${100 * k}%)` }, { transform: 'none' }], { ...timing, fill: 'backwards' });
        const leave = old.animate([{ transform: 'none' }, { transform: `translateY(${-100 * k}%)` }], { ...timing, fill: 'forwards' });
        if (was[i] === ' ') cell.animate([{ width: '0px' }, { width: `${cell.offsetWidth}px` }], timing);
        if (now[i] === ' ') cell.animate([{ width: `${old.offsetWidth}px` }, { width: '0px' }], { ...timing, fill: 'forwards' });
        // Once out of sight the old digit goes, and so does a cell left empty
        leave.finished.then(() => (now[i] === ' ' ? cell : old).remove(), () => {});
      }
    };

    const observer = new MutationObserver(() => {
      const next = countOf(cart);
      if (next === shown) return;
      const from = shown;
      shown = next;
      label(next);
      if (!count) return;
      // From zero the badge pops in with its number; to zero it shrinks away with the last one
      if (from === 0) count.textContent = format(next);
      else if (next > 0) draw(from, next);
      if (reduceMotion || next < from) return;
      bag?.animate([
        { transform: 'none' },
        { transform: 'translateY(1.5px) scale(1.08, 0.9)', offset: 0.3 },
        { transform: 'translateY(-1px) scale(0.97, 1.04)', offset: 0.65 },
        { transform: 'none' },
      ], { duration: 520, easing: 'ease-out' });
      if (from > 0) count.animate([{ transform: 'none' }, { transform: 'translateY(-3px) scale(1.12)', offset: 0.35 }, { transform: 'none' }], { duration: 420, easing: 'ease-out' });
    });
    observer.observe(cart, { attributes: true, attributeFilter: ['data-count'] });
    signal.addEventListener('abort', () => observer.disconnect());
    if (count) count.textContent = format(shown);
    label(shown);
  }

  // The button: words rolling between three states, the flight, and the request it waits for
  function mountButton(button, signal) {
    const words = [...button.querySelectorAll('.kodza-add-to-cart__label > span')];
    if (words.length < 3) return;
    // The spoken status sits right after the button, and leaves with it
    const status = Object.assign(document.createElement('span'), { className: 'kodza-add-to-cart__sr' });
    status.setAttribute('role', 'status');
    button.after(status);
    const flights = new Set();
    let index = 0;
    let rest = 0;
    let sayTimer = 0;

    // The new words come up from below, the old ones leave through the top
    const roll = (next) => {
      if (next === index) return;
      const old = words[index];
      const now = words[next];
      index = next;
      words.forEach((word, i) => {
        word.getAnimations().forEach((a) => a.cancel());
        word.style.transform = i === next ? 'none' : 'translateY(110%)';
        if (i === next) word.removeAttribute('aria-hidden');
        else word.setAttribute('aria-hidden', 'true');
      });
      if (reduceMotion) return;
      const timing = { duration: 520, easing: ease };
      old.animate([{ transform: 'none' }, { transform: 'translateY(-110%)' }], timing);
      now.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], timing);
    };

    const settle = (state) => {
      roll(STATES.indexOf(state));
      button.dataset.state = state;
      clearTimeout(rest);
      if (state !== 'idle') rest = setTimeout(() => settle('idle'), state === 'added' ? 2400 : 3200);
    };

    // Emptied first, then filled: a screen reader reads the same message twice in a row too
    const say = (message) => {
      status.textContent = '';
      clearTimeout(sayTimer);
      sayTimer = setTimeout(() => { status.textContent = message(); }, 60);
    };

    // The carts it adds to: data-cart, or the ones nearest to the button in the page
    const cartsFor = () => {
      if (button.dataset.cart) return [...document.querySelectorAll(button.dataset.cart)];
      for (let el = button.parentElement; el; el = el.parentElement) {
        const found = el.querySelectorAll(CART);
        if (found.length) return [...found];
      }
      return [];
    };

    // The picture that flies: data-image, or the first one shown around the button, but never
    // past a block that holds other buttons (a grid of products)
    const pictureFor = () => {
      const wanted = button.dataset.image;
      for (let el = button.parentElement, depth = 0; el && el !== document.documentElement; el = el.parentElement, depth++) {
        if (wanted) {
          const found = el.querySelector(wanted);
          if (found) return found;
          continue;
        }
        if (depth > 3 || el.querySelectorAll('.kodza-add-to-cart').length > 1) return null;
        const img = [...el.querySelectorAll('img')].find((image) => !image.closest(CART) && image.getBoundingClientRect().width > 0);
        if (img) return img;
      }
      return null;
    };

    const visible = (el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.bottom > 0 && r.top < innerHeight;
    };

    // A picture mostly scrolled out of sight (a phone, the button far below it) would fly in from
    // nowhere: then the dot leaves the button instead
    const seen = (el) => {
      const r = el?.getBoundingClientRect();
      return r && r.width > 0 && Math.min(r.bottom, innerHeight) - Math.max(r.top, 0) > r.height / 4;
    };

    // A copy of the picture lifts, flies in an arc above the cart and drops into the bag,
    // turning into a small round on the way. Without a picture, a dot leaves the button.
    const fly = (picture, cart) => {
      const bag = cart.querySelector('.kodza-add-to-cart__bag') || cart;
      const own = button.getBoundingClientRect();
      const start = picture ? picture.getBoundingClientRect() : new DOMRect(own.left + own.width / 2 - 7, own.top + own.height / 2 - 7, 14, 14);
      const end = bag.getBoundingClientRect();
      const { width: w, height: h } = start;
      const side = Math.min(w, h);
      const radius = picture ? parseFloat(getComputedStyle(picture).borderTopLeftRadius) || 0 : 7;
      const p0 = { x: start.left + w / 2, y: start.top + h / 2 };
      const p2 = { x: end.left + end.width / 2, y: end.top + end.height * 0.42 };
      const dx = p2.x - p0.x;
      const lift = Math.min(140, Math.max(36, Math.hypot(dx, p2.y - p0.y) * 0.22));
      const p1 = { x: p0.x + dx * 0.62, y: Math.min(p0.y, p2.y) - lift };
      // It ends about the size of the bag, whatever scale the page is drawn at
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
        background: picture ? `center / cover no-repeat url("${(picture.currentSrc || picture.src).replace(/"/g, '%22')}")` : getComputedStyle(button).backgroundColor,
      });
      wrap.append(pic);
      document.body.append(wrap);

      // Sampled along the curve: a short lift, then the flight, sped up in the middle
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
      const flight = wrap.animate(frames, { duration: LIFT + TRAVEL, fill: 'forwards' });
      const done = () => {
        flights.delete(stop);
        wrap.remove();
      };
      // A refused request while it is still in the air: it falls away instead of landing
      const drop = () => {
        flight.pause();
        const now = getComputedStyle(wrap).transform;
        wrap.getAnimations().forEach((a) => a.cancel());
        wrap.animate([{ transform: now, opacity: 1 }, { transform: `${now === 'none' ? '' : now} translateY(24px)`, opacity: 0 }], { duration: 280, easing: 'ease-in', fill: 'forwards' }).finished.then(done, done);
      };
      const stop = () => {
        flight.cancel();
        done();
      };
      flights.add(stop);
      return { landed: flight.finished.then(() => done()), drop };
    };

    // Adds to every cart it found (a header and its mobile copy stay in step)
    const add = (carts, quantity) => carts.forEach((cart) => {
      cart.dataset.count = String(Math.max(0, countOf(cart) + quantity));
    });

    button.addEventListener('click', () => {
      const quantity = Math.max(1, parseInt(button.dataset.quantity, 10) || 1);
      let request = null;
      const event = new CustomEvent('kodza:add', {
        bubbles: true,
        cancelable: true,
        detail: { quantity, wait: (promise) => { request = Promise.resolve(promise); } },
      });
      if (!button.dispatchEvent(event)) return;
      const carts = cartsFor();
      // It flies to a cart in sight. None on screen (a header scrolled away): nothing flies off into
      // nowhere, the button says it and the count changes
      const target = carts.find(visible);
      let landed = false;
      let failed = false;
      const land = () => {
        if (failed || signal.aborted) return;
        landed = true;
        add(carts, quantity);
        say(() => [words[1].textContent.trim(), (target || carts[0])?.getAttribute('aria-label')].filter(Boolean).join('. ') + '.');
      };
      settle('added');
      const picture = pictureFor();
      const flight = !reduceMotion && target ? fly(seen(picture) ? picture : null, target) : null;
      if (flight) flight.landed.then(land, () => {});
      else land();
      request?.catch(() => {
        if (signal.aborted) return;
        failed = true;
        if (landed) add(carts, -quantity);
        else flight?.drop();
        settle('failed');
        say(() => `${words[2].textContent.trim()}.`);
      });
    }, { signal });

    button.dataset.state = 'idle';
    signal.addEventListener('abort', () => {
      clearTimeout(rest);
      clearTimeout(sayTimer);
      flights.forEach((stop) => stop());
      status.remove();
    });
  }

  // One instance per button and per cart, each with its own state. Everything it starts is
  // tied to `signal`, so kodza:destroy stops it all.
  function mount(root, signal) {
    if (root.matches(CART)) mountCart(root, signal);
    else mountButton(root, signal);
  }

  // Kodza lifecycle, the same in every component: `kodza:init` starts the instances inside
  // event.detail.root (the whole page by default), `kodza:destroy` stops them and puts their
  // markup back. For themes and apps that swap content without a page load. Each running root
  // keeps its markup as written under KODZA, shared by every Kodza script on the page: a Kodza
  // component inside another one is saved as written, not half-started, and stopped with it.
  const KODZA = Symbol.for('kodza');
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
    if (root.classList.contains('is-ready')) return; // already running, maybe from another copy of this script
    // Rendered by React (data-kodza-manual): React starts it, with an init aimed at that markup once
    // it has hydrated it. Any earlier start would change markup React has not taken over yet
    const owner = root.closest('[data-kodza-manual]');
    if (owner && !(scope && owner.contains(scope))) return;
    const controller = new AbortController();
    const saved = { html: written(root), attrs: attrsOf(root), stop: () => destroy(root) };
    instances.set(root, { controller, saved });
    root[KODZA] = saved;
    mount(root, controller.signal);
    root.classList.add('is-ready');
  });
  const destroy = (scope) => find(scope).forEach((root) => {
    const instance = instances.get(root);
    if (!instance) return;
    instances.delete(root);
    // The Kodza components running inside it stop first: once its markup is put back, their own
    // script could not find them any more
    root.querySelectorAll('*').forEach((el) => el[KODZA]?.stop());
    instance.controller.abort();
    delete root[KODZA];
    put(root, instance.saved);
  });
  document.addEventListener('kodza:init', (event) => init(event.detail?.root));
  document.addEventListener('kodza:destroy', (event) => destroy(event.detail?.root));
  init();
  // Loaded in <head>, the script runs before the markup exists: once more when it is parsed
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(), { once: true });
})();
