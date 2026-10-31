// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Header Announcement
// A strip of news over the header. Its messages roll one after the other every
// --kz-header-announcement-interval, and wait while the pointer or the focus is on the strip, or
// the tab is hidden. The cross folds the strip away and the site remembers it (data-remember:
// "local" by default, "session", or "off"), under data-key or, without one, under the text of the
// messages: a new announcement shows again on its own. kodza:replay on the header brings it back.
// Below 900 px the links give way to a Menu button: the shutter (a native popover) comes down
// under the header, written by the script from the same links, so a menu changed in the CMS
// changes both.
(() => {
  const SELECTOR = '.kodza-header-announcement';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const c = (name) => `.kodza-header-announcement__${name}`;

  // A duration variable, in ms
  const ms = (style, name, fallback) => {
    const raw = style.getPropertyValue(name).trim();
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n * (/ms$/.test(raw) ? 1 : 1000) : fallback;
  };

  // Where the strip's dismissal is kept: the browser may refuse storage (private mode, policies)
  const store = (root) => {
    const kind = root.dataset.remember || 'local';
    try {
      return kind === 'off' ? null : kind === 'session' ? window.sessionStorage : window.localStorage;
    } catch {
      return null;
    }
  };
  // Without data-key, the messages themselves are the key
  const keyOf = (root, messages) => {
    if (root.dataset.key) return `kodza-header-announcement:${root.dataset.key}`;
    const text = messages.map((m) => m.textContent.trim()).join('|');
    let hash = 5381;
    for (let i = 0; i < text.length; i++) hash = (hash * 33) ^ text.charCodeAt(i);
    return `kodza-header-announcement:${(hash >>> 0).toString(36)}`;
  };

  // When (0 to 1 of the duration) a cubic-bezier curve gets to the progress p
  const timeAt = ([x1, y1, x2, y2], p) => {
    const at = (a, b, s) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (at(y1, y2, mid) < p) lo = mid;
      else hi = mid;
    }
    return at(x1, x2, (lo + hi) / 2);
  };

  // A wheel or a swipe only scrolls what can scroll in the panel, under the pointer
  const scrollsInside = (panel, target, x, y, dy) => {
    for (let el = target; el instanceof Element && panel.contains(el); el = el.parentElement) {
      const box = el.getBoundingClientRect();
      if (x < box.left || x > box.right || y < box.top || y > box.bottom) continue;
      if (!/(auto|scroll)/.test(getComputedStyle(el).overflowY) || el.scrollHeight <= el.clientHeight + 1) continue;
      if (dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return true;
    }
    return false;
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal`, so kodza:destroy stops it all.
  function mount(root, signal) {
    const links = [...root.querySelectorAll(c('link'))];

    // ---------- The strip ----------
    const strip = root.querySelector(c('strip'));
    const messages = strip ? [...strip.querySelectorAll(c('message'))] : [];
    const dismiss = strip?.querySelector(c('dismiss'));
    const storage = strip ? store(root) : null;
    const key = strip ? keyOf(root, messages) : '';
    let shown = 0;
    let timer = 0;
    const holds = new Set(); // what holds the rotation: the pointer, the focus, a hidden tab
    const runs = new Set();

    const show = (i) => {
      messages.forEach((m, j) => {
        m.classList.toggle('is-shown', j === i);
        m.inert = j !== i; // only the message on screen can be reached
      });
      shown = i;
    };

    // The old message goes up, the next comes from below, glued to it
    const next = () => {
      const from = messages[shown];
      const to = messages[(shown + 1) % messages.length];
      show(messages.indexOf(to));
      if (reduceMotion || from === to) return;
      from.classList.add('is-shown');
      const style = getComputedStyle(root);
      const timing = { duration: ms(style, '--kz-header-announcement-roll', 700), easing: 'cubic-bezier(0.65, 0, 0.35, 1)' };
      const out = from.animate({ translate: ['0 0', '0 -100%'] }, timing);
      const into = to.animate({ translate: ['0 100%', '0 0'] }, timing);
      [out, into].forEach((run) => {
        runs.add(run);
        run.finished.then(() => runs.delete(run), () => runs.delete(run));
      });
      out.finished.then(() => from !== messages[shown] && from.classList.remove('is-shown'), () => {});
    };

    const stop = () => {
      clearTimeout(timer);
      timer = 0;
    };
    const go = () => {
      stop();
      if (messages.length < 2 || holds.size || strip.hidden || strip.classList.contains('is-dismissed')) return;
      timer = setTimeout(() => {
        next();
        go();
      }, ms(getComputedStyle(root), '--kz-header-announcement-interval', 4500));
    };
    // Each hold has a name, so the same one twice counts once
    const wait = (why, on) => {
      if (on) holds.add(why);
      else holds.delete(why);
      if (holds.size) stop();
      else if (!timer) go();
    };

    const remember = () => {
      try {
        storage?.setItem(key, '1');
      } catch {}
    };
    const forget = () => {
      try {
        storage?.removeItem(key);
      } catch {}
    };
    const gone = () => {
      try {
        return storage?.getItem(key) === '1';
      } catch {
        return false;
      }
    };

    // Folded away: the header slides up in its place, then the strip leaves the page for good
    let folding = 0;
    const fold = (keyboard) => {
      if (strip.classList.contains('is-dismissed')) return;
      stop();
      remember();
      // The pointer and the focus leave with the strip: nothing holds it when it comes back
      holds.delete('pointer');
      holds.delete('focus');
      if (strip.contains(document.activeElement) && keyboard) root.querySelector(c('logo'))?.focus();
      strip.classList.add('is-dismissed');
      const leave = () => {
        clearTimeout(folding);
        if (strip.classList.contains('is-dismissed')) strip.hidden = true;
      };
      if (reduceMotion) return leave();
      folding = setTimeout(leave, ms(getComputedStyle(root), '--kz-header-announcement-fold', 600) + 80);
    };
    // Back, from the first message: it unfolds and the header slides down
    const unfold = () => {
      forget();
      clearTimeout(folding);
      runs.forEach((run) => run.cancel());
      show(0);
      if (strip.hidden) {
        strip.hidden = false;
        void strip.offsetHeight; // folded first, so it opens from nothing
      }
      strip.classList.remove('is-dismissed');
      go();
    };

    if (strip && messages.length) {
      show(0);
      if (gone()) {
        strip.classList.add('is-dismissed');
        strip.hidden = true;
      }
      dismiss?.addEventListener('click', (event) => fold(event.detail === 0), { signal });
      strip.addEventListener('pointerenter', () => wait('pointer', true), { signal });
      strip.addEventListener('pointerleave', () => wait('pointer', false), { signal });
      strip.addEventListener('focusin', () => wait('focus', true), { signal });
      strip.addEventListener('focusout', (event) => !strip.contains(event.relatedTarget) && wait('focus', false), { signal });
      document.addEventListener('visibilitychange', () => wait('tab', document.hidden), { signal });
      root.addEventListener('kodza:replay', unfold, { signal });
      if (document.hidden) holds.add('tab');
      go();
      signal.addEventListener('abort', () => {
        stop();
        clearTimeout(folding);
        runs.forEach((run) => run.cancel());
      });
    }

    // ---------- The shutter, below 900 px ----------
    const toggle = root.querySelector(c('toggle'));
    const panel = root.querySelector(c('panel'));
    const list = root.querySelector(c('list'));
    if (!toggle || !panel || !list || !('popover' in panel)) return;
    toggle.popoverTargetElement = panel;

    // The menu is written from the links of the bar: one source for both
    links.forEach((link, i) => {
      const item = document.createElement('a');
      item.className = 'kodza-header-announcement__item';
      ['href', 'target', 'rel', 'aria-current'].forEach((name) => {
        if (link.hasAttribute(name)) item.setAttribute(name, link.getAttribute(name));
      });
      const index = document.createElement('span');
      index.className = 'kodza-header-announcement__index';
      index.setAttribute('aria-hidden', 'true');
      index.textContent = String(i + 1).padStart(2, '0');
      const mask = document.createElement('span');
      mask.className = 'kodza-header-announcement__mask';
      const word = document.createElement('span');
      word.className = 'kodza-header-announcement__word';
      word.textContent = link.textContent.trim();
      mask.append(word);
      item.append(index, mask);
      list.append(item);
    });

    const words = [...toggle.querySelectorAll(c('say'))];
    const parts = [...panel.querySelectorAll(`${c('item')}, ${c('info')}`)];
    let open = false;
    let started = 0;
    let held = null;
    const rolls = new Map();

    // The shutter starts under the header (or at --kz-header-announcement-menu-top)
    const place = () => {
      const top = getComputedStyle(root).getPropertyValue('--kz-header-announcement-menu-top').trim();
      if (top && top !== 'auto') {
        panel.style.setProperty('--kz-header-announcement-from', top);
        return;
      }
      const edge = Math.max(root.getBoundingClientRect().bottom, toggle.getBoundingClientRect().bottom);
      panel.style.setProperty('--kz-header-announcement-from', `${Math.max(0, Math.round(edge))}px`);
    };

    // Each row starts when the edge of the shutter gets to it
    const time = () => {
      const style = getComputedStyle(root);
      const raw = style.getPropertyValue('--kz-header-announcement-menu-duration').trim();
      const duration = reduceMotion ? 0 : parseFloat(raw) * (/ms$/.test(raw) ? 1 : 1000) || 800;
      const match = style.getPropertyValue('--kz-header-announcement-menu-ease').match(/cubic-bezier\(([^)]+)\)/);
      const curve = match ? match[1].split(',').map(Number) : [0.76, 0, 0.24, 1];
      const box = panel.getBoundingClientRect();
      const late = performance.now() - started;
      parts.forEach((part) => {
        const p = Math.min(1, Math.max(0, (part.getBoundingClientRect().top - box.top) / (box.height || 1)));
        const delay = Math.max(0, duration * timeAt(curve, p) - late - 40);
        part.style.setProperty('--kz-header-announcement-delay', `${Math.round(delay)}ms`);
      });
    };

    // Menu rolls to Close and back the same way: the old word goes up, the new one comes from below.
    // A click during the roll turns it back from where the words are
    const roll = () => {
      if (reduceMotion || words.length < 2) return;
      words.forEach((word, i) => {
        const coming = i === Number(open);
        const from = rolls.has(word) ? getComputedStyle(word).translate : coming ? '0 115%' : '0 0';
        rolls.get(word)?.cancel();
        const run = word.animate(
          { translate: [from, coming ? '0 0' : '0 -115%'] },
          { duration: 500, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
        );
        rolls.set(word, run);
        run.finished.then(() => rolls.get(word) === run && rolls.delete(word), () => {});
      });
    };

    // While it is open the page stays where it is
    const hold = () => {
      held = new AbortController();
      const s = held.signal;
      const spot = [scrollX, scrollY];
      let last = 0;
      document.addEventListener('wheel', (event) => {
        if (!scrollsInside(panel, event.target, event.clientX, event.clientY, event.deltaY)) event.preventDefault();
      }, { passive: false, signal: s });
      document.addEventListener('touchstart', (event) => (last = event.touches[0].clientY), { passive: true, signal: s });
      document.addEventListener('touchmove', (event) => {
        const touch = event.touches[0];
        const dy = last - touch.clientY;
        last = touch.clientY;
        if (!scrollsInside(panel, event.target, touch.clientX, touch.clientY, dy)) event.preventDefault();
      }, { passive: false, signal: s });
      // A scrollbar dragged anyway: the page goes back to where it was
      window.addEventListener('scroll', () => {
        if (scrollX !== spot[0] || scrollY !== spot[1]) window.scrollTo({ left: spot[0], top: spot[1], behavior: 'instant' });
      }, { signal: s });
      // Wide enough for the links again: the shutter has no button left, it goes
      window.addEventListener('resize', () => {
        if (!toggle.getClientRects().length) panel.hidePopover();
        else place();
      }, { signal: s });
    };
    const release = () => {
      held?.abort();
      held = null;
    };

    panel.addEventListener('beforetoggle', (event) => {
      open = event.newState === 'open';
      toggle.setAttribute('aria-expanded', String(open));
      words.forEach((word, i) => (i === Number(open) ? word.removeAttribute('aria-hidden') : word.setAttribute('aria-hidden', 'true')));
      roll();
      if (open) {
        started = performance.now();
        place();
        hold();
      } else {
        panel.classList.remove('is-open');
        release();
      }
    }, { signal });

    panel.addEventListener('toggle', (event) => {
      if (event.newState !== 'open' || !open) return;
      time();
      panel.classList.add('is-open');
    }, { signal });

    // Tab past the last link, or a link followed: the shutter rolls back up
    panel.addEventListener('focusout', (event) => {
      const next = event.relatedTarget;
      if (open && next && !panel.contains(next) && next !== toggle) panel.hidePopover();
    }, { signal });
    panel.addEventListener('click', (event) => {
      if (open && event.target.closest('a[href]')) panel.hidePopover();
    }, { signal });

    signal.addEventListener('abort', () => {
      rolls.forEach((run) => run.cancel());
      release();
      if (open) panel.hidePopover();
    });
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
