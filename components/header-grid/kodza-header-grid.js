// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Header Grid
// The CSS places the zones on the grid; the script adds what CSS can't do on its own:
// - is-compact below --kz-header-grid-breakpoint (a container query can't read a variable);
// - with --line, one line under the links: it glides to the link you point at, front edge first,
//   and goes back under the page you are on (the engine of Header Classic);
// - with --hide and --tighten, how far the page went and which way, read on a mark right before
//   the header, so it works in any scrolling box;
// - with data-mobile="menu", the shutter (a native popover), written from the bar's own links,
//   notes and buttons, so a menu changed in the CMS changes both;
// - with data-mobile="scroll", the page you are on brought into view.
// Everything you tune is a --kz-header-grid-* variable of the CSS; the numbers below are the
// script's own.
(() => {
  const SELECTOR = '.kodza-header-grid';
  const STEP = 6; // px: a scroll smaller than this never turns --hide around
  const ROLL = 500; // ms: Menu rolling to Close, at the site's pace
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const c = (name) => `.kodza-header-grid__${name}`;

  // A length variable in px (px, rem or em), or the fallback
  const lengthOf = (el, name, fallback) => {
    const raw = getComputedStyle(el).getPropertyValue(name).trim();
    const value = parseFloat(raw);
    if (!(value >= 0)) return fallback;
    if (/rem$/.test(raw)) return value * parseFloat(getComputedStyle(document.documentElement).fontSize);
    if (/em$/.test(raw)) return value * parseFloat(getComputedStyle(el).fontSize);
    return value;
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
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const has = (name) => root.classList.contains(`kodza-header-grid--${name}`);
    const nav = root.querySelector(c('nav'));
    const links = [...root.querySelectorAll(c('link'))];
    const current = () => links.find((link) => link.getAttribute('aria-current') === 'page') || null;
    const toggle = root.querySelector(c('toggle'));
    const panel = root.querySelector(c('panel'));
    let open = false;
    let compact = false;

    // ---------- The line (--line) ----------
    let line = null;
    let at = null; // the link the line is under
    let over = null; // the link under the pointer or the focus
    if (has('line') && nav && links.length) {
      line = document.createElement('span');
      line.className = 'kodza-header-grid__line';
      line.setAttribute('aria-hidden', 'true');
      nav.append(line);
    }

    // A link's word in the nav's own pixels: a parent scaled by transform does not shift it
    const span = (link) => {
      const n = nav.getBoundingClientRect();
      const scale = n.width / nav.offsetWidth || 1;
      const b = link.getBoundingClientRect();
      const style = getComputedStyle(link);
      return {
        left: (b.left - n.left) / scale + (parseFloat(style.paddingLeft) || 0),
        right: (n.right - b.right) / scale + (parseFloat(style.paddingRight) || 0),
      };
    };
    const set = ({ left, right }) => {
      line.style.setProperty('--kz-header-grid-line-left', `${left}px`);
      line.style.setProperty('--kz-header-grid-line-right', `${right}px`);
    };
    // A line with no length, in the middle of a link's word
    const dot = (link) => {
      const s = span(link);
      const mid = (s.left + nav.offsetWidth - s.right) / 2;
      return { left: mid, right: nav.offsetWidth - mid };
    };
    const instantly = (fn) => {
      line.classList.add('is-instant');
      fn();
      getComputedStyle(line, '::after').clipPath; // both edges settle before the transitions come back
      void line.offsetWidth;
      line.classList.remove('is-instant');
    };
    const go = (link, instant) => {
      if (!line || !line.getClientRects().length) return; // below the breakpoint the links mark themselves
      if (instant) {
        instantly(() => set(link ? span(link) : { left: 0, right: nav.offsetWidth }));
      } else if (link && !at) {
        // From nowhere: it grows out of the middle of the word
        line.classList.remove('is-rightward', 'is-leftward');
        instantly(() => set(dot(link)));
        set(span(link));
      } else if (link) {
        // From a link to the next: the edge in front leaves first
        if (link !== at) {
          const rightward = links.indexOf(link) > links.indexOf(at);
          line.classList.toggle('is-rightward', rightward);
          line.classList.toggle('is-leftward', !rightward);
        }
        set(span(link));
      } else if (at) {
        // Back to nowhere: it shrinks into the middle of the last word
        line.classList.remove('is-rightward', 'is-leftward');
        set(dot(at));
      }
      at = link;
    };

    if (line) {
      nav.addEventListener('pointerover', (event) => {
        const link = event.target.closest?.(c('link'));
        if (!link || link === over) return;
        over = link;
        go(link);
      }, { signal });
      nav.addEventListener('pointerleave', () => {
        over = null;
        go(current());
      }, { signal });
      nav.addEventListener('focusin', (event) => {
        const link = event.target.closest?.(c('link'));
        if (!link) return;
        over = link;
        go(link);
      }, { signal });
      nav.addEventListener('focusout', (event) => {
        if (nav.contains(event.relatedTarget)) return;
        over = null;
        go(current());
      }, { signal });
      document.fonts?.ready.then(() => !signal.aborted && fit());
    }

    // ---------- Scroll (data-mobile="scroll"): the page you are on, in view ----------
    const reveal = () => {
      const link = current();
      if (!compact || root.dataset.mobile !== 'scroll' || !link || nav.scrollWidth <= nav.clientWidth) return;
      const n = nav.getBoundingClientRect();
      const scale = n.width / nav.offsetWidth || 1;
      const b = link.getBoundingClientRect();
      const left = nav.scrollLeft + (b.left - n.left) / scale - (nav.clientWidth - b.width / scale) / 2;
      nav.scrollTo({ left: Math.max(0, left), behavior: 'instant' });
    };

    // ---------- How far the page went (--hide, --tighten) ----------
    let spot = null;
    let lastY = null;
    let frame = 0;

    // Tight, the bar slides up by what it loses (never more than the room around its content) and
    // its content comes back down by its share of that room, so it keeps its place: centred stays
    // centred, a row on the bottom edge stays on it. Measured at rest, in layout pixels
    const shape = () => {
      if (!has('tighten')) return;
      const items = [...root.querySelectorAll(`${c('brand')}, ${c('link')}, ${c('note')}, ${c('button')}, ${c('toggle')}`)]
        .filter((el) => el.getClientRects().length);
      if (!items.length) return;
      const offset = (el, side) => {
        let value = 0;
        for (let e = el; e && e !== root; e = e.offsetParent) value += side === 'top' ? e.offsetTop : e.offsetLeft;
        return value;
      };
      let above = Infinity;
      let below = Infinity;
      items.forEach((el) => {
        const top = offset(el, 'top');
        above = Math.min(above, top);
        below = Math.min(below, root.offsetHeight - top - el.offsetHeight);
      });
      above = Math.max(0, above);
      below = Math.max(0, below);
      const room = above + below;
      const lift = Math.min(lengthOf(root, '--kz-header-grid-tighten', 16), room);
      root.style.setProperty('--kz-header-grid-lift', `${lift}px`);
      root.style.setProperty('--kz-header-grid-drop', `${room ? (lift * below) / room : 0}px`);
      // The brand shrinks towards where it sits: its side of the row, or its middle when centred,
      // and the edge the row sits on
      const brand = root.querySelector(c('brand'));
      if (brand) {
        const middle = offset(brand, 'left') + brand.offsetWidth / 2 - root.offsetWidth / 2;
        const x = Math.abs(middle) < 4 ? 'center' : middle < 0 ? 'left' : 'right';
        const y = room ? `${Math.round((above / room) * 100)}%` : 'center';
        root.style.setProperty('--kz-header-grid-origin', `${x} ${y}`);
      }
    };

    const read = () => {
      frame = 0;
      if (!spot) return;
      const top = parseFloat(getComputedStyle(root).top) || 0;
      const y = top - spot.getBoundingClientRect().top; // how far past its place in the page
      if (has('tighten')) {
        const tight = y > lengthOf(root, '--kz-header-grid-tighten-after', 40);
        if (tight !== root.classList.contains('is-tight')) {
          if (tight) shape();
          root.classList.toggle('is-tight', tight);
        }
      }
      if (has('hide')) {
        if (lastY === null) lastY = y;
        const delta = y - lastY;
        if (Math.abs(delta) < STEP) return;
        lastY = y;
        // Down, past --kz-header-grid-hide-after, and not while you use it from the keyboard or
        // its menu is open; up, it comes back
        const far = y > lengthOf(root, '--kz-header-grid-hide-after', 600);
        const busy = open || root.querySelector(':focus-visible');
        root.classList.toggle('is-hidden', delta > 0 && far && !busy);
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };

    if (has('hide') || has('tighten')) {
      spot = document.createElement('span');
      spot.className = 'kodza-header-grid__spot';
      spot.setAttribute('aria-hidden', 'true');
      root.before(spot);
      document.addEventListener('scroll', schedule, { capture: true, passive: true, signal });
      // The keyboard comes in: it shows up
      root.addEventListener('focusin', () => root.classList.remove('is-hidden'), { signal });
      signal.addEventListener('abort', () => {
        cancelAnimationFrame(frame);
        spot.remove();
      }, { once: true });
    }

    // ---------- The breakpoint, and everything that follows the width ----------
    function fit() {
      compact = root.clientWidth < lengthOf(root, '--kz-header-grid-breakpoint', 900);
      root.classList.toggle('is-compact', compact);
      // No Menu button left on screen: the shutter goes with it
      if (open && toggle && !toggle.getClientRects().length) panel.hidePopover();
      if (line) {
        at = over || current();
        go(at, true);
      }
      reveal();
      if (!root.classList.contains('is-tight')) shape();
    }
    const watch = new ResizeObserver(() => fit());
    watch.observe(root);
    signal.addEventListener('abort', () => watch.disconnect());
    fit();
    read(); // already down the page (a reload, a link to an anchor): in place from the first frame

    // ---------- The shutter (data-mobile="menu") ----------
    const list = root.querySelector(c('list'));
    if (!toggle || !panel || !list || !('popover' in panel)) return;
    toggle.popoverTargetElement = panel;

    // The menu is written from the bar: its links, then its notes and buttons under them
    links.forEach((link, i) => {
      const item = document.createElement('a');
      item.className = 'kodza-header-grid__item';
      ['href', 'target', 'rel', 'aria-current'].forEach((name) => {
        if (link.hasAttribute(name)) item.setAttribute(name, link.getAttribute(name));
      });
      const index = document.createElement('span');
      index.className = 'kodza-header-grid__index';
      index.setAttribute('aria-hidden', 'true');
      index.textContent = String(i + 1).padStart(2, '0');
      const mask = document.createElement('span');
      mask.className = 'kodza-header-grid__mask';
      const word = document.createElement('span');
      word.className = 'kodza-header-grid__word';
      word.textContent = link.textContent.trim();
      mask.append(word);
      item.append(index, mask);
      list.append(item);
    });
    const foot = panel.querySelector(c('foot'));
    if (foot) {
      root.querySelectorAll(`${c('actions')} > ${c('note')}, ${c('actions')} > ${c('button')}`).forEach((el) => {
        const copy = el.cloneNode(true);
        copy.className = el.matches(c('note')) ? 'kodza-header-grid__fact' : 'kodza-header-grid__action';
        foot.append(copy);
      });
    }

    const words = [...toggle.querySelectorAll(c('say'))];
    const parts = [...panel.querySelectorAll(`${c('item')}, ${c('foot')}`)];
    let started = 0;
    let held = null;
    const rolls = new Map();

    // The shutter starts under the header, wherever it is (stuck, tightened)
    const place = () => {
      const edge = Math.max(root.getBoundingClientRect().bottom, toggle.getBoundingClientRect().bottom);
      panel.style.setProperty('--kz-header-grid-from', `${Math.max(0, Math.round(edge))}px`);
    };

    // Each row starts when the edge of the shutter gets to it (the delays are set at the site's pace)
    const time = () => {
      const style = getComputedStyle(root);
      const raw = style.getPropertyValue('--kz-header-grid-menu-duration').trim();
      const duration = still ? 0 : (parseFloat(raw) * (/ms$/.test(raw) ? 1 : 1000) || 800) * pace;
      const match = style.getPropertyValue('--kz-header-grid-menu-ease').match(/cubic-bezier\(([^)]+)\)/);
      const curve = match ? match[1].split(',').map(Number) : [0.76, 0, 0.24, 1];
      const box = panel.getBoundingClientRect();
      const late = performance.now() - started;
      const when = (y) => {
        const p = Math.min(1, Math.max(0, (y - box.top) / (box.height || 1)));
        return `${Math.round(Math.max(0, duration * timeAt(curve, p) - late - 40 * pace))}ms`;
      };
      parts.forEach((part) => {
        part.style.setProperty('--kz-header-grid-delay', when(part.getBoundingClientRect().top));
      });
      // The line under the last row too
      const last = list.lastElementChild;
      if (last) list.style.setProperty('--kz-header-grid-delay-end', when(last.getBoundingClientRect().bottom));
    };

    // Menu rolls to Close and back the same way: the old word goes up, the new one comes from below.
    // A click during the roll turns it back from where the words are
    const roll = () => {
      if (still || words.length < 2) return;
      words.forEach((word, i) => {
        const coming = i === Number(open);
        const from = rolls.has(word) ? getComputedStyle(word).translate : coming ? '0 115%' : '0 0';
        rolls.get(word)?.cancel();
        const run = word.animate(
          { translate: [from, coming ? '0 0' : '0 -115%'] },
          { duration: ROLL * pace, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
        );
        rolls.set(word, run);
        run.finished.then(() => rolls.get(word) === run && rolls.delete(word), () => {});
      });
    };

    // While it is open the page stays where it is
    const hold = () => {
      held = new AbortController();
      const s = held.signal;
      const where = [scrollX, scrollY];
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
        if (scrollX !== where[0] || scrollY !== where[1]) window.scrollTo({ left: where[0], top: where[1], behavior: 'instant' });
      }, { signal: s });
      window.addEventListener('resize', () => place(), { signal: s });
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
        root.classList.remove('is-hidden');
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
