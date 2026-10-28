// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Page Lift
// The lift itself is CSS: between two real pages the browser draws it (cross-document View
// Transitions). The script gives it its direction (back plays it in reverse, from wherever an
// interrupted lift was), keeps the header in place, plays the arrival of the new page, and runs
// the same lift inside one page for sites that swap their content (kodza:page-transition).
(() => {
  const SELECTOR = '[data-kodza-page-lift]';

  // The two lines that change from one page transition of the family to the next
  const NAME = 'page-lift';
  const VARS = ['duration', 'ease', 'depth', 'veil', 'rise', 'radius', 'backdrop'];

  // ---------- Page engine (begin) ----------
  // The same block in every page transition of the family (Page Lift, Curtain, Stairs...),
  // copied as is. The page you leave writes a short record (direction, where an interrupted
  // transition was, which headers stay); the page that lands reads it before its first paint.
  // Pages: data-page-back on a link plays the return (an "All work" link), data-page-stay marks
  // what stays in place (the site header by default), data-enter the parts of the arrival.
  const html = document.documentElement;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ON = `kodza-${NAME}-on`;
  const BACK = `kodza-${NAME}-back`;
  const ENTER = `kodza-${NAME}-enter`;
  const STAY = `kodza-${NAME}-stay`;
  const KEY = 'kodza-page-engine';
  const WAIT = 5000; // ms a turned-round transition can wait for its content swap
  const navType = performance.getEntriesByType('navigation')[0]?.type;
  const signals = new WeakMap(); // root -> its signal, for its arrival
  const entries = new WeakMap(); // root -> its arrival, prepared or playing
  const pending = new Set(); // arrivals waiting for their start
  let go = null; // when the arrival starts, once the page knows
  let current = null; // the transition running
  let heading = null; // where it goes: true back, false forward
  let local = null; // the one this page runs itself, around a content swap
  let turn = null; // the swap waiting for the page on screen to be out of sight
  let hold = null; // its animations, kept on until the swap is done
  let stayed = [];
  let pressed = null;
  let revealed = false;

  // One engine per page: an earlier one (another transition of the family) steps aside
  document.dispatchEvent(new CustomEvent('kodza:page-engine'));
  const page = new AbortController();
  document.addEventListener('kodza:page-engine', () => {
    page.abort();
    html.classList.remove(ON, BACK, ENTER);
  }, { once: true, signal: page.signal });
  html.classList.add(ON, 'kodza-page-engine');

  const here = (href) => {
    const url = new URL(href, location.href);
    url.hash = '';
    return url.href;
  };
  const ms = (value, fallback) => {
    const n = parseFloat(value);
    return Number.isNaN(n) ? fallback : /ms\s*$/.test(value) ? n : n * 1000;
  };
  const now = () => document.timeline.currentTime;
  const shown = () => [...document.querySelectorAll(SELECTOR)].filter((root) => root.getClientRects().length);

  // Where the transition running is, as a share of the way forward (null: none is)
  function progress() {
    const run = document.getAnimations().find((a) => a.animationName?.startsWith(`kodza-${NAME}`) && a.effect?.pseudoElement?.startsWith('::view-transition'));
    if (!run) return null;
    const { delay, duration } = run.effect.getTiming();
    const t = Math.min(Math.max((run.currentTime ?? 0) - delay, 0), duration) / duration;
    return html.classList.contains(BACK) ? 1 - t : t;
  }

  // Settings of the section that decides (the one that arrives, or the one you leave going back)
  function values(root) {
    if (!root) return null;
    const style = getComputedStyle(root);
    const out = {};
    VARS.forEach((v) => {
      const value = style.getPropertyValue(`--kz-${NAME}-${v}`).trim();
      if (value) out[v] = value;
    });
    return out;
  }
  const apply = (out) => Object.entries(out || {}).forEach(([v, value]) => html.style.setProperty(`--kz-${NAME}-${v}`, value));

  // What stays in place: [data-page-stay], or the site header (and the WordPress admin bar)
  // when it sits at the top of the screen. Going back through history, a header that scrolls
  // with its page may not be at the top of the next one: only a fixed or sticky one stays.
  function candidates() {
    const marked = document.querySelectorAll('[data-page-stay]');
    if (marked.length) return [...marked];
    return [...document.querySelectorAll('header, #wpadminbar')].filter((el) => !el.parentElement?.closest(`header, main, article, section, aside, footer, ${SELECTOR}`));
  }
  function stays(el, traverse) {
    const box = el.getBoundingClientRect();
    if (!box.height || box.top < -1 || box.top > 64 || box.height > innerHeight * 0.4) return false;
    if (!traverse) return true;
    for (let node = el; node && node !== html; node = node.parentElement) {
      if (/fixed|sticky/.test(getComputedStyle(node).position)) return true;
    }
    return false;
  }
  function release() {
    stayed.forEach((el) => {
      el.style.removeProperty('view-transition-name');
      el.style.removeProperty('view-transition-class');
    });
    stayed = [];
  }
  function name(only, traverse) {
    release();
    const named = [];
    candidates().forEach((el, i) => {
      if ((only && !only.includes(i)) || !stays(el, traverse)) return;
      el.style.setProperty('view-transition-name', `${STAY}-${i}`);
      el.style.setProperty('view-transition-class', STAY);
      stayed.push(el);
      named.push(i);
    });
    return named;
  }
  function unturn() {
    hold?.forEach((a) => a.playState !== 'idle' && a.finish());
    hold = null;
    turn = null;
  }
  function clean() {
    unturn();
    heading = null;
    html.classList.remove(BACK);
    html.style.removeProperty(`--kz-${NAME}-at`);
    VARS.forEach((v) => html.style.removeProperty(`--kz-${NAME}-${v}`));
    release();
  }

  // The record the page you leave writes, read once by the next one
  function read(restored) {
    let record = null;
    try {
      record = JSON.parse(sessionStorage.getItem(KEY));
      sessionStorage.removeItem(KEY);
    } catch (error) {
      record = null;
    }
    if (record && (Date.now() - record.time > 4000 || (record.to && record.to !== here(location.href)))) record = null;
    const activation = window.navigation?.activation;
    const from = activation?.from;
    const back = record ? record.back
      : activation?.navigationType === 'traverse' ? !from || from.index < 0 || activation.entry.index < from.index
        : restored || navType === 'back_forward';
    // An interrupted transition turned around goes on from where it was
    const at = !record || record.p == null || record.was === back ? 0 : back ? 1 - record.p : record.p;
    return { back, at, stay: record?.stay || [], vars: record?.vars };
  }

  // The arrival: label, title line by line from its mask, image uncovering as it tightens, the
  // rest in a cascade. Prepared hidden (paused on its first frame), started once the page knows.
  // The title is cut into words for it, and put back as it was once they have landed.
  function split(title) {
    const nodes = [];
    const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) nodes.push(walker.currentNode);
    const words = [];
    nodes.forEach((node) => {
      const fragment = document.createDocumentFragment();
      node.data.split(/(\s+)/).forEach((piece) => {
        if (!piece) return;
        if (!piece.trim()) {
          fragment.append(piece);
          return;
        }
        const mask = document.createElement('span');
        const word = document.createElement('span');
        mask.className = `kodza-${NAME}__mask`;
        word.className = `kodza-${NAME}__word`;
        word.textContent = piece;
        mask.append(word);
        fragment.append(mask);
        words.push(word);
      });
      node.replaceWith(fragment);
    });
    return words;
  }
  function prepare(root) {
    const signal = signals.get(root);
    if (!signal || signal.aborted || motion.matches) return;
    entries.get(root)?.stop();
    const parts = [...root.querySelectorAll('[data-enter]')];
    if (!parts.length) return;
    const style = getComputedStyle(root);
    const easing = style.getPropertyValue(`--kz-${NAME}-enter-ease`).trim() || 'cubic-bezier(0.2, 0.8, 0.1, 1)';
    const reveal = style.getPropertyValue(`--kz-${NAME}-reveal-ease`).trim() || 'cubic-bezier(0.65, 0, 0.35, 1)';
    const delay = ms(style.getPropertyValue(`--kz-${NAME}-enter-delay`), 360);
    const title = parts.find((el) => el.dataset.enter === 'title');
    const markup = title?.innerHTML;
    const words = title ? split(title) : [];
    const anims = [];
    const add = (el, keyframes, duration, ease = easing) => {
      const anim = el.animate(keyframes, { duration, easing: ease, fill: 'both' });
      anim.pause();
      anims.push(anim);
      return anim;
    };
    root.classList.add('is-entering');
    parts.filter((el) => el.dataset.enter === 'label').forEach((el) => add(el, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], 500));
    const lines = words.map((word) => [word, add(word, [{ transform: 'translateY(calc(110% + 0.16em))' }, { transform: 'none' }], 850)]);
    const image = parts.filter((el) => el.dataset.enter === 'image').flatMap((el) => {
      const media = el.matches('img, video, picture') ? null : el.querySelector('img, video, picture');
      const round = getComputedStyle(el).borderTopLeftRadius || '0px';
      return [
        // A big image uncovers slowly at first: with the entry curve, half of it would show in 100 ms.
        // Its lower edge rounds as it reaches the corners (Chrome's compositor draws it so anyway).
        add(el, [{ clipPath: 'inset(0 0 100% 0 round 0px)' }, { clipPath: `inset(0 0 0% 0 round ${round})` }], 900, reveal),
        ...(media ? [add(media, [{ transform: 'scale(1.25)' }, { transform: 'none' }], 1300)] : []),
      ];
    });
    const rest = parts.filter((el) => !['label', 'title', 'image'].includes(el.dataset.enter)).map((el) => add(el, [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], 650));
    const stop = () => {
      anims.forEach((anim) => anim.cancel());
      if (title && title.innerHTML !== markup) title.innerHTML = markup;
      root.classList.remove('is-entering');
      pending.delete(entry);
      if (entries.get(root) === entry) entries.delete(root);
    };
    const entry = {
      stop,
      start({ time, lifted }) {
        // Lines are measured now, in their final font: the words of a line rise together
        let top = null;
        let line = -1;
        lines.forEach(([word, anim]) => {
          const y = Math.round(word.parentElement.getBoundingClientRect().top);
          if (y !== top) {
            top = y;
            line += 1;
          }
          anim.effect.updateTiming({ delay: 60 + line * 90 });
        });
        image.forEach((anim) => anim.effect.updateTiming({ delay: 120 }));
        rest.forEach((anim, i) => anim.effect.updateTiming({ delay: 60 + (line + 1) * 90 + i * 70 }));
        const at = Math.max(time + (lifted ? delay : 0), now());
        anims.forEach((anim) => {
          anim.startTime = at;
        });
        Promise.all(anims.map((anim) => anim.finished)).then(stop, () => {});
      },
    };
    entries.set(root, entry);
    signal.addEventListener('abort', stop, { once: true });
    if (go) entry.start(go);
    else pending.add(entry);
  }
  function arrive(time, lifted) {
    go = { time, lifted };
    pending.forEach((entry) => entry.start(go));
    pending.clear();
  }

  // Inside one page (Swup, an app, the demo): the same transition around a content swap.
  //   document.dispatchEvent(new CustomEvent('kodza:page-transition', { cancelable: true,
  //     detail: { update: () => swapTheContent(), back: false } })) || nothing to do
  // dispatchEvent() returns true when no engine took it: then run update() yourself.
  function swap(update, back) {
    const lift = Boolean(document.startViewTransition) && !motion.matches;
    if (lift && current && current === local && turn && back === heading) {
      const first = turn; // already on its way there: this swap waits its turn too
      turn = async () => {
        await first();
        await update();
      };
      return;
    }
    if (lift && current && current === local && !turn && back !== heading && reverse(update, back)) return;
    unturn();
    const before = shown();
    const p = lift ? progress() : null;
    const at = p == null || back === heading ? 0 : back ? 1 - p : p;
    const stay = lift ? name(null, false) : [];
    const run = async () => {
      await update();
      init();
      const after = shown();
      const arriving = after.filter((root) => !before.includes(root));
      if (lift) {
        VARS.forEach((v) => html.style.removeProperty(`--kz-${NAME}-${v}`));
        apply(back ? values(before.find((root) => !after.includes(root))) || values(after[0]) : values(arriving[0]) || values(after[0]));
        name(stay, false);
      }
      go = null;
      if (!back && !at) arriving.forEach(prepare);
    };
    if (!lift) {
      run().then(() => arrive(now(), false));
      return;
    }
    const vt = document.startViewTransition(run);
    current = vt;
    local = vt;
    heading = back;
    html.classList.toggle(BACK, back);
    html.style.setProperty(`--kz-${NAME}-at`, at);
    vt.ready.then(() => arrive(now(), true), () => arrive(now(), false));
    vt.finished.finally(() => {
      if (current !== vt) return;
      current = null;
      clean();
    });
  }
  // Turned round in the middle (back while it lifts, or the other way): the same transition
  // plays backwards from where it is, and the content swaps once it is back where it started,
  // the page it was showing out of sight. A new one would first show that page whole, a frame.
  // It goes back to the page it came from, as a "back" does. Its animations wait at their start
  // (a longer delay, the same place) until the swap is done: the transition stays on screen.
  function reverse(update, back) {
    const runs = document.getAnimations().filter((a) => a.effect?.pseudoElement?.startsWith('::view-transition') && a.playState === 'running');
    if (!runs.length) return false;
    runs.forEach((a) => {
      const time = a.currentTime;
      a.effect.updateTiming({ delay: a.effect.getTiming().delay + WAIT });
      a.currentTime = time + WAIT;
      a.updatePlaybackRate(-a.playbackRate);
    });
    hold = runs;
    heading = back;
    turn = update;
    const wait = () => {
      if (hold !== runs) return;
      if (runs.some((a) => a.currentTime > WAIT)) {
        requestAnimationFrame(wait);
        return;
      }
      Promise.resolve()
        .then(() => turn())
        .then(init)
        .finally(() => hold === runs && unturn());
    };
    requestAnimationFrame(wait);
    return true;
  }
  document.addEventListener('kodza:page-transition', (event) => {
    if (typeof event.detail?.update !== 'function') return;
    event.preventDefault();
    swap(event.detail.update, Boolean(event.detail.back));
  }, { signal: page.signal });

  // Between two documents: the page you leave writes the record...
  document.addEventListener('click', (event) => {
    const link = event.target.closest?.('a[href]');
    pressed = link?.hasAttribute('data-page-back') ? { href: here(link.href), time: Date.now() } : null;
  }, { capture: true, signal: page.signal });
  // While the pages trade places the browser sends every click to the page itself: one on the
  // header that stays goes on to the link under it (back, in the middle of a lift, turns it round).
  // After the listener above, which would forget the link pressed.
  document.addEventListener('click', (event) => {
    if (!current || event.target !== html) return;
    const { clientX: x, clientY: y } = event;
    const hit = stayed.flatMap((el) => [...el.querySelectorAll('a[href], button')]).find((el) => {
      const box = el.getBoundingClientRect();
      return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
    });
    hit?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window, detail: 1, clientX: x, clientY: y, ctrlKey: event.ctrlKey, metaKey: event.metaKey, shiftKey: event.shiftKey, altKey: event.altKey }));
  }, { capture: true, signal: page.signal });
  window.addEventListener('pageswap', (event) => {
    if (!event.viewTransition) return;
    const activation = event.activation;
    const traverse = activation?.navigationType === 'traverse';
    const to = activation?.entry?.url ? here(activation.entry.url) : '';
    const clicked = Boolean(pressed) && Date.now() - pressed.time < 4000 && (!to || pressed.href === to);
    const record = {
      to,
      back: traverse ? activation.entry.index < activation.from.index : clicked,
      p: progress(),
      was: heading,
      stay: name(null, traverse),
      vars: values(shown()[0]),
      time: Date.now(),
    };
    try {
      sessionStorage.setItem(KEY, JSON.stringify(record));
    } catch (error) {
      // no storage: the next page still lifts, forward
    }
  }, { signal: page.signal });

  // ...and the page that lands reads it before its first paint
  let landing = read(false);
  if (!motion.matches && !landing.back && !landing.at && navType !== 'back_forward' && !performance.getEntriesByType('paint').length) html.classList.add(ENTER);
  window.addEventListener('pagereveal', (event) => {
    const land = landing || read(true); // later ones: the page comes back from the back/forward cache
    landing = null;
    revealed = true;
    clean();
    const vt = event.viewTransition;
    if (!vt) {
      arrive(now(), false);
      return;
    }
    current = vt;
    heading = land.back;
    html.classList.toggle(BACK, land.back);
    if (land.at) html.style.setProperty(`--kz-${NAME}-at`, land.at);
    const own = values(shown()[0]);
    apply(land.back ? land.vars || own : own || land.vars);
    name(land.stay, false);
    vt.ready.then(() => arrive(now(), true), () => arrive(now(), false));
    vt.finished.finally(() => {
      if (current !== vt) return;
      current = null;
      clean();
    });
  }, { signal: page.signal });
  // No pagereveal (Firefox, older Safari), or the script came after it: the arrival plays now
  requestAnimationFrame(() => {
    if (!revealed) arrive(now(), false);
  });
  // Once the sections of the page are prepared, the class goes: one added later starts shown
  const settle = () => requestAnimationFrame(() => html.classList.remove(ENTER));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', settle, { once: true, signal: page.signal });
  else settle();
  // ---------- Page engine (end) ----------

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    signals.set(root, signal);
    if (!html.classList.contains(ENTER)) return;
    prepare(root); // hidden from the first paint by the CSS, then by its own first frame
    queueMicrotask(() => html.classList.remove(ENTER));
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
