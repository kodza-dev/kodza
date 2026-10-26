// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Ink Like
// A like button whose heart fills with ink: it rises with a small wave riding its surface and
// drains through the tip when the like is taken back; a click halfway turns it round where it
// is. The count rolls digit by digit 380 ms later, carries included (999 → 1,000). The state is
// aria-pressed and the total data-count: change them from your code and the button follows.
// "kodza:like" bubbles from the button and can be cancelled: pass your request to
// event.detail.wait(promise); if it rejects the like rolls back, if it resolves to a number (or
// { count }) the count rolls to it. data-say-liked, data-say-unliked and data-say-refused set
// what a screen reader hears.
(() => {
  const SELECTOR = '.kodza-ink-like';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const LAG_UP = 380;
  const LAG_DOWN = 120;
  const format = (n) => new Intl.NumberFormat(document.documentElement.lang || undefined).format(n);
  let made = 0;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const svg = root.querySelector('.kodza-ink-like__icon');
    const ink = root.querySelector('.kodza-ink-like__ink');
    const surface = root.querySelector('.kodza-ink-like__surface');
    const count = root.querySelector('.kodza-ink-like__count');
    if (!svg || !ink) return;

    // The ink is cut to the heart: a clip path made of the outline, with an id of its own
    const ns = 'http://www.w3.org/2000/svg';
    const defs = document.createElementNS(ns, 'defs');
    const clip = document.createElementNS(ns, 'clipPath');
    clip.id = `kodza-ink-like-${Math.random().toString(36).slice(2, 8)}-${++made}`;
    svg.querySelectorAll('.kodza-ink-like__shape').forEach((shape) => {
      const copy = shape.cloneNode(true);
      copy.removeAttribute('class');
      clip.append(copy);
    });
    defs.append(clip);
    svg.prepend(defs);
    ink.setAttribute('clip-path', `url(#${clip.id})`);

    const countOf = () => Math.max(0, parseInt(root.dataset.count ?? count?.textContent.replace(/\D/g, ''), 10) || 0);
    let liked = root.getAttribute('aria-pressed') === 'true';
    let total = countOf();
    let shown = total;

    const label = (n) => {
      const text = root.getAttribute('aria-label');
      if (!text) return;
      root.setAttribute('aria-label', text.replace(/\d(?:[\d.,  ]*\d)?(\s+likes?\b)?/, (m, word) => format(n) + (word ? word.replace(/likes?/, n === 1 ? 'like' : 'likes') : '')));
    };

    // The spoken status sits right after the button, and leaves with it
    const status = Object.assign(document.createElement('span'), { className: 'kodza-ink-like__sr' });
    status.setAttribute('role', 'status');
    root.after(status);
    const words = {
      liked: root.dataset.sayLiked || 'Liked',
      unliked: root.dataset.sayUnliked || 'Like removed',
      refused: root.dataset.sayRefused || 'Not saved. Try again.',
    };
    let sayTimer = 0;
    const say = (message) => {
      status.textContent = '';
      clearTimeout(sayTimer);
      sayTimer = setTimeout(() => { status.textContent = message; }, 60);
    };

    // The count: one cell per character, aligned on the right. A digit that changes rolls: up and
    // units first when the count grows, down and from the left when it shrinks (the same roll
    // played backwards). A digit that appears or goes rolls, and opens or closes its room, along
    // with the first digit that turns, so the count moves in one gesture. Taken back halfway, the
    // roll plays backwards from where it is
    const paint = (n) => {
      if (!count) return;
      count.replaceChildren(...[...format(n)].map((ch) => {
        const cell = Object.assign(document.createElement('span'), { className: 'kodza-ink-like__digit' });
        cell.append(Object.assign(document.createElement('span'), { textContent: ch }));
        return cell;
      }));
    };
    let run = null;
    const settle = (current) => {
      Promise.all(current.anims.map((a) => a.finished)).then(() => {
        if (run !== current) return;
        run = null;
        paint(current.to);
      }, () => {});
    };
    const draw = (from, to) => {
      const a = format(from);
      const b = format(to);
      const n = Math.max(a.length, b.length);
      const was = a.padStart(n);
      const now = b.padStart(n);
      const k = to > from ? 1 : -1;
      const delay = (i) => (k > 0 ? n - 1 - i : i) * 55;
      const anims = [];
      const rooms = [];
      const turns = [...now].map((ch, i) => (ch !== was[i] && ch.trim() && was[i].trim() ? delay(i) : Infinity));
      const start = Math.min(...turns);
      count.textContent = '';
      for (let i = 0; i < n; i++) {
        const cell = Object.assign(document.createElement('span'), { className: 'kodza-ink-like__digit' });
        const next = Object.assign(document.createElement('span'), { textContent: now[i].trim() });
        cell.append(next);
        count.append(cell);
        if (was[i] === now[i]) continue;
        const old = Object.assign(document.createElement('span'), { textContent: was[i].trim() });
        cell.append(old);
        const timing = { duration: 480, delay: turns[i] === Infinity && start !== Infinity ? start : delay(i), easing: ease, fill: 'both' };
        anims.push(
          next.animate([{ transform: `translateY(${100 * k}%)` }, { transform: 'none' }], timing),
          old.animate([{ transform: 'none' }, { transform: `translateY(${-100 * k}%)` }], timing),
        );
        // Widths from the layout, to the subpixel (a transform on a parent leaves them alone): the
        // last frame is exactly the count painted after it
        const wide = parseFloat(getComputedStyle(next).width);
        const narrow = parseFloat(getComputedStyle(old).width);
        if (wide !== narrow) rooms.push([cell, narrow, wide]);
      }
      const timing = { duration: 480, delay: start === Infinity ? 0 : start, easing: ease, fill: 'both' };
      rooms.forEach(([cell, narrow, wide]) => {
        anims.push(cell.animate([{ width: `${narrow}px` }, { width: `${wide}px` }], timing));
      });
      run = { from, to, anims };
      settle(run);
    };
    const roll = (to) => {
      if (to === shown || !count) return;
      if (run && run.from === to) {
        run.anims.forEach((a) => a.reverse());
        run = { from: run.to, to, anims: run.anims };
        settle(run);
      } else {
        run?.anims.forEach((a) => a.cancel());
        run = null;
        if (reduceMotion) paint(to);
        else draw(shown, to);
      }
      shown = to;
    };
    let lag = 0;
    const later = (ms) => {
      clearTimeout(lag);
      lag = setTimeout(() => {
        lag = 0;
        roll(total);
      }, reduceMotion ? 0 : ms);
    };

    // The surface sloshes while the ink moves: it tilts against the flow, overshoots, settles
    let slosh = null;
    let flowTimer = 0;
    const flow = (up) => {
      if (reduceMotion || !surface) return;
      root.classList.add('is-flowing');
      clearTimeout(flowTimer);
      flowTimer = setTimeout(() => root.classList.remove('is-flowing'), up ? 1000 : 520);
      const from = getComputedStyle(surface).transform;
      slosh?.cancel();
      const s = up ? 1 : -1;
      slosh = surface.animate([
        { transform: from === 'none' ? 'scaleY(0.7)' : from },
        { transform: `rotate(${-5 * s}deg) scaleY(1.6)`, offset: 0.3 },
        { transform: `rotate(${2 * s}deg) scaleY(1.1)`, offset: 0.65 },
        { transform: 'rotate(0deg) scaleY(0.7)' },
      ], { duration: up ? 900 : 480, easing: 'ease-out' });
    };

    // The heart says no: a short shake when the request is refused
    const shake = () => {
      if (reduceMotion) return;
      svg.animate([
        { transform: 'none' },
        { transform: 'translateX(-2px)', offset: 0.2 },
        { transform: 'translateX(2px)', offset: 0.45 },
        { transform: 'translateX(-1px)', offset: 0.7 },
        { transform: 'none' },
      ], { duration: 360, easing: 'ease-out' });
    };

    // The level follows aria-pressed in CSS, so a click halfway turns it round where it is
    const apply = (next, n) => {
      const turned = next !== liked;
      liked = next;
      total = n;
      root.setAttribute('aria-pressed', String(next));
      root.dataset.count = String(n);
      label(n);
      if (turned) flow(next);
      later(next ? LAG_UP : LAG_DOWN);
    };

    let seq = 0;
    root.addEventListener('click', () => {
      const before = { liked, total };
      const next = !liked;
      const n = Math.max(0, total + (next ? 1 : -1));
      let request = null;
      const allowed = root.dispatchEvent(new CustomEvent('kodza:like', {
        bubbles: true,
        cancelable: true,
        detail: { liked: next, count: n, wait: (promise) => { request = Promise.resolve(promise); } },
      }));
      if (!allowed) return;
      const mine = ++seq;
      root.classList.add('is-spent');
      apply(next, n);
      say(next ? words.liked : words.unliked);
      request?.then((value) => {
        const real = typeof value === 'number' ? value : value?.count;
        if (signal.aborted || mine !== seq || !Number.isFinite(real)) return;
        total = Math.max(0, Math.round(real));
        root.dataset.count = String(total);
        label(total);
        if (!lag) roll(total);
      }, () => {
        if (signal.aborted || mine !== seq) return;
        apply(before.liked, before.total);
        shake();
        say(words.refused);
      });
    }, { signal });

    // After a click the drop under the pointer waits for the next visit
    root.addEventListener('pointerleave', () => root.classList.remove('is-spent'), { signal });

    // Set from your code: aria-pressed fills or drains the heart, data-count rolls the count
    const observer = new MutationObserver(() => {
      const pressed = root.getAttribute('aria-pressed') === 'true';
      const n = countOf();
      if (pressed !== liked) {
        liked = pressed;
        flow(liked);
      }
      if (n !== total) {
        total = n;
        label(n);
        later(LAG_DOWN);
      }
    });
    observer.observe(root, { attributes: true, attributeFilter: ['aria-pressed', 'data-count'] });

    paint(shown);
    label(shown);
    signal.addEventListener('abort', () => {
      clearTimeout(lag);
      clearTimeout(flowTimer);
      clearTimeout(sayTimer);
      observer.disconnect();
      slosh?.cancel();
      status.remove();
    });
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
