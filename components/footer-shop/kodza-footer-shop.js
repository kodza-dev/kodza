// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Footer Shop
// Writes the year of the ©, sends the letter without leaving the page (the button rolls
// Subscribe, Sending, Subscribed), opens the country menu (click, Enter, Space, arrows, Home,
// End, first letter; Escape, Tab or a click outside close it) and, on phones, folds the columns
// into accordions. The form fires "kodza:subscribe" with { form, email, respondWith }: call
// respondWith(promise) to send it yourself, otherwise it posts to its action. Picking a country
// fires "kodza:select" with { item, value } and follows its link.
(() => {
  const SELECTOR = '.kodza-footer-shop';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const FOLD = 'cubic-bezier(0.65, 0, 0.35, 1)';
  let uid = 0;

  // A word rolls into its box: the old one leaves upwards, the new one rises from below, and the
  // box eases to its new width instead of jumping
  const roll = (box, text, { delay = 0, tick = false } = {}) => {
    const prev = box.lastElementChild;
    if (!prev || prev.textContent === text) return;
    const from = box.offsetWidth;
    const span = document.createElement('span');
    span.textContent = text;
    if (tick) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 16 16');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('class', 'kodza-footer-shop__tick');
      svg.innerHTML = '<path d="M3 8.5l3.2 3L13 4.5" pathLength="1" />';
      span.prepend(svg);
    }
    box.append(span);
    if (reduceMotion) return prev.remove();
    const to = span.offsetWidth;
    const timing = { duration: 450, delay, easing: EASE };
    prev.setAttribute('aria-hidden', 'true');
    box.animate([{ width: `${from}px` }, { width: `${to}px` }], { ...timing, fill: 'backwards' });
    prev.animate([{ transform: 'none' }, { transform: 'translateY(-110%)' }], { ...timing, fill: 'forwards' }).finished.then(() => prev.remove(), () => {});
    span.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], { ...timing, fill: 'backwards' });
  };
  const wrap = (box) => box && box.replaceChildren(Object.assign(document.createElement('span'), { textContent: box.textContent.trim() }));

  // The letter: judged like Text Field (when the visitor leaves a filled field, then live while
  // they fix it), sent in place, then the field stays filled and the button says it worked
  function letter(form, signal) {
    const input = form.querySelector('.kodza-footer-shop__input');
    const send = form.querySelector('.kodza-footer-shop__send');
    const say = form.querySelector('.kodza-footer-shop__say');
    const hint = form.querySelector('.kodza-footer-shop__hint');
    const error = form.querySelector('.kodza-footer-shop__error');
    const done = form.querySelector('.kodza-footer-shop__done');
    if (!input || !send || !say) return;
    const prefix = `kodza-footer-shop-${++uid}`;
    const described = [];
    if (hint) described.push((hint.id = `${prefix}-hint`));
    if (error) described.push((error.id = `${prefix}-error`));
    if (described.length) input.setAttribute('aria-describedby', described.join(' '));
    const idle = say.textContent.trim();
    const thanks = done?.textContent.trim() || '';
    if (done) done.textContent = ''; // written when it worked, so the status is read out then
    wrap(say);
    form.noValidate = true; // the message under the box says what is wrong, not the browser's bubble

    const fail = (text) => {
      if (error) error.textContent = text;
      form.classList.toggle('is-error', Boolean(text));
    };
    const check = () => {
      const bad = !input.validity.valid;
      input.setAttribute('aria-invalid', String(bad));
      fail(bad ? input.dataset.error || input.validationMessage : '');
      return !bad;
    };
    input.addEventListener('blur', () => input.value.trim() && check(), { signal });
    input.addEventListener('input', () => input.getAttribute('aria-invalid') === 'true' && check(), { signal });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (send.getAttribute('aria-disabled') === 'true') return;
      if (!check()) return input.focus();
      let reply = null;
      form.dispatchEvent(new CustomEvent('kodza:subscribe', {
        bubbles: true,
        detail: { form, email: input.value.trim(), respondWith: (promise) => { reply = promise; } },
      }));
      const sent = reply
        ? Promise.resolve(reply)
        : fetch(form.action, { method: 'POST', body: new FormData(form), mode: 'no-cors' }).then((res) => {
          if (res.type !== 'opaque' && !res.ok) throw new Error(`HTTP ${res.status}`);
        });
      send.setAttribute('aria-disabled', 'true');
      input.readOnly = true;
      form.classList.add('is-sending');
      roll(say, send.dataset.sending || 'Sending');
      // Long enough to read the word, however fast the list answers
      const wait = new Promise((resolve) => setTimeout(resolve, reduceMotion ? 0 : 700));
      Promise.all([sent, wait]).then(() => {
        if (signal.aborted) return;
        form.classList.remove('is-sending');
        form.classList.add('is-done');
        roll(say, send.dataset.sent || 'Subscribed', { tick: true });
        if (done) done.textContent = thanks;
      }, () => {
        if (signal.aborted) return;
        form.classList.remove('is-sending');
        send.removeAttribute('aria-disabled');
        input.readOnly = false;
        roll(say, idle);
        fail(done?.dataset.failed || 'Something went wrong. Try again.');
      });
    }, { signal });
  }

  // Country and currency: a button and a list of links, unrolled upwards (downwards when the
  // page leaves no room above), with the highlight of Dropdown Menu gliding from one to the next
  function region(root, signal) {
    const trigger = root.querySelector('.kodza-footer-shop__picker');
    const list = root.querySelector('.kodza-footer-shop__places');
    if (!trigger || !list) return;
    const items = [...list.querySelectorAll('.kodza-footer-shop__place')];
    const value = trigger.querySelector('.kodza-footer-shop__value');
    const glide = document.createElement('li');
    glide.className = 'kodza-footer-shop__glide';
    glide.setAttribute('aria-hidden', 'true');
    list.prepend(glide);
    list.id = `kodza-footer-shop-${++uid}-places`;
    trigger.setAttribute('aria-controls', list.id);
    items.forEach((item) => (item.tabIndex = -1));
    wrap(value);

    const isOpen = () => root.classList.contains('is-open');
    const label = (item) => {
      const country = item.querySelector('.kodza-footer-shop__country')?.textContent.trim() || item.textContent.trim();
      const currency = item.querySelector('.kodza-footer-shop__currency')?.textContent.trim();
      return currency ? `${country} · ${currency}` : country;
    };
    const light = (item) => {
      if (!item) return list.style.setProperty('--kz-footer-shop-hl-on', 0);
      list.style.setProperty('--kz-footer-shop-hl-y', `${item.offsetTop}px`);
      list.style.setProperty('--kz-footer-shop-hl-h', `${item.offsetHeight}px`);
      list.style.setProperty('--kz-footer-shop-hl-on', 1);
    };
    const focusItem = (item) => {
      if (!item) return;
      item.focus({ preventScroll: true });
      light(item);
    };

    const open = (which = 'none') => {
      if (!isOpen()) {
        const box = trigger.getBoundingClientRect();
        const height = list.offsetHeight + 8;
        const below = box.top - height < 8 && box.bottom + height < innerHeight - 8;
        // A closed list that changes side gets there at once, so it always unrolls from the button
        if (below !== root.classList.contains('is-below')) {
          list.style.transition = 'none';
          root.classList.toggle('is-below', below);
          void list.offsetWidth;
          list.style.transition = '';
        }
        root.classList.toggle('is-end', box.left + list.offsetWidth > innerWidth - 8);
        root.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
      const current = items.find((item) => item.getAttribute('aria-current') === 'true');
      if (which === 'first') focusItem(current || items[0]);
      else if (which === 'last') focusItem(items[items.length - 1]);
      else light(null);
    };
    const close = (refocus = false) => {
      if (!isOpen()) return;
      root.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      light(null);
      if (refocus) trigger.focus();
    };
    const pick = (item) => {
      items.forEach((other) => (other === item ? other.setAttribute('aria-current', 'true') : other.removeAttribute('aria-current')));
      if (value) roll(value, label(item), { delay: 280 });
      root.dispatchEvent(new CustomEvent('kodza:select', { detail: { item, value: label(item) }, bubbles: true }));
      light(item);
      setTimeout(() => !signal.aborted && close(true), reduceMotion ? 0 : 320);
    };

    trigger.addEventListener('click', () => (isOpen() ? close() : open()), { signal });
    trigger.addEventListener('keydown', (event) => {
      if (['ArrowDown', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        open('first');
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        open('last');
      }
    }, { signal });

    items.forEach((item) => {
      item.addEventListener('click', () => pick(item), { signal });
      item.addEventListener('pointermove', () => document.activeElement !== item && focusItem(item), { signal });
    });
    list.addEventListener('pointerleave', () => {
      if (list.contains(document.activeElement)) list.focus({ preventScroll: true });
      light(null);
    }, { signal });

    list.addEventListener('keydown', (event) => {
      const index = items.indexOf(document.activeElement);
      const moves = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: items.length - 1 };
      if (event.key in moves) {
        event.preventDefault();
        focusItem(items[(moves[event.key] + items.length) % items.length]);
      } else if (event.key === 'Tab') {
        close();
      } else if (event.key.length === 1 && /\S/.test(event.key)) {
        // Type a letter: jump to the next country that starts with it
        const letter = event.key.toLowerCase();
        const order = [...items.slice(index + 1), ...items.slice(0, index + 1)];
        focusItem(order.find((item) => item.textContent.trim().toLowerCase().startsWith(letter)));
      }
    }, { signal });

    document.addEventListener('pointerdown', (event) => {
      if (isOpen() && !root.contains(event.target)) close();
    }, { signal });
    // Escape closes it wherever the focus is: opened with a click, it stays on the button
    // (Chrome) or on the page (Safari), not in the list
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !isOpen()) return;
      event.preventDefault();
      close(true);
    }, { signal });
    // and the focus leaving it (Tab from the button) closes it too
    root.addEventListener('focusout', (event) => {
      if (isOpen() && event.relatedTarget && !root.contains(event.relatedTarget)) close();
    }, { signal });

    list.tabIndex = -1;
  }

  // Phones: each column title becomes the button of its accordion (CSS shows it under 600px of
  // footer width). The list opens to its height, its links rising one after the other
  function columns(nav, signal) {
    nav.querySelectorAll('.kodza-footer-shop__col').forEach((col) => {
      const title = col.querySelector('.kodza-footer-shop__title');
      const list = col.querySelector('.kodza-footer-shop__links');
      if (!title || !list) return;
      list.id = `kodza-footer-shop-${++uid}-links`;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'kodza-footer-shop__fold';
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', list.id);
      const plus = document.createElement('span');
      plus.className = 'kodza-footer-shop__plus';
      plus.setAttribute('aria-hidden', 'true');
      button.append(title.textContent.trim(), plus);
      title.after(button);

      button.addEventListener('click', () => {
        const opening = !col.classList.contains('is-open') || button.getAttribute('aria-expanded') === 'false';
        const from = list.offsetHeight;
        list.getAnimations().forEach((animation) => animation.cancel());
        button.setAttribute('aria-expanded', String(opening));
        if (opening) {
          col.classList.add('is-open');
          if (reduceMotion) return col.classList.remove('is-moving');
          col.classList.add('is-moving');
          list.animate([{ height: `${from}px` }, { height: `${list.scrollHeight}px` }], { duration: 520, easing: EASE }).onfinish = () => col.classList.remove('is-moving');
          if (from === 0) [...list.children].forEach((li, i) => li.animate([
            { opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' },
          ], { duration: 560, delay: 60 + i * 45, easing: EASE, fill: 'backwards' }));
        } else {
          if (reduceMotion) return col.classList.remove('is-open', 'is-moving');
          col.classList.add('is-moving');
          list.animate([{ height: `${from}px`, opacity: 1 }, { height: '0px', opacity: 0.4 }], { duration: 420, easing: FOLD }).onfinish = () => col.classList.remove('is-open', 'is-moving');
        }
      }, { signal });
    });
  }

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal`, so kodza:destroy stops it all.
  function mount(root, signal) {
    root.querySelectorAll('.kodza-footer-shop__year').forEach((year) => {
      year.textContent = String(new Date().getFullYear());
    });
    root.querySelectorAll('.kodza-footer-shop__form').forEach((form) => letter(form, signal));
    root.querySelectorAll('.kodza-footer-shop__region').forEach((place) => region(place, signal));
    root.querySelectorAll('.kodza-footer-shop__nav').forEach((nav) => columns(nav, signal));
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
