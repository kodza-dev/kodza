// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Header Centered
// The restaurant header: the name in the middle, the links on both sides, Book a table at the
// end, and above it a thin line with the address and whether it's open now, worked out at the
// place's own time (as in Hero Open). Once the page has gone a little way, the line fades, the
// bar tightens and the name shrinks; back at the top it all comes back. Below 900 px a Menu
// button opens a curtain of ink (Fullscreen Menu, same engine), its links written from the bar's.
(() => {
  // The two lines that change from one menu of the family to the next
  const NAME = 'header-centered';
  const VARS = ['menu-bg', 'menu-fg', 'menu-muted', 'menu-top', 'menu-side', 'menu-size', 'menu-curve', 'menu-shade'];


  // ---------- Menu engine (begin) ----------
  // The same block in every burger menu of the family (Trapdoor, Fullscreen, Side Reveal...),
  // copied as is. .kodza-NAME__toggle opens .kodza-NAME__panel and the menu's opening plays as
  // one timeline, backwards to close, from wherever it is. While open the panel leaves the menu
  // with its variables (VARS), the page stays put (wheel, swipe, keys), Tab stays inside, Escape
  // closes and the focus goes back to the button. A page that takes part (data-NAME-page,
  // data-page="…" on the menu, or a theme's wrapper) takes its fixed elements along and is put
  // back exactly as it was. Each menu only writes how it moves: see `menu`.
  const SELECTOR = `.kodza-${NAME}`;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const RISE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const SWING = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const BACK = 1.6; // closing replays the opening backwards, this much faster
  const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const taken = new WeakMap(); // page → how to put it back at once (one menu moves a page at a time)

  const transparent = (color) => !color || color === 'transparent' || /^rgba\(.*,\s*0\)$/.test(color);

  // [time, progress] pairs along a cubic-bezier(): when does the edge pass a given row?
  const curve = (easing) => {
    const n = (easing.match(/-?\d*\.?\d+/g) || []).map(Number);
    const [x1, y1, x2, y2] = n.length === 4 ? n : [0.76, 0, 0.24, 1];
    const at = (s, a, b) => 3 * (1 - s) * (1 - s) * s * a + 3 * (1 - s) * s * s * b + s * s * s;
    return Array.from({ length: 101 }, (_, i) => [at(i / 100, x1, x2), at(i / 100, y1, y2)]);
  };

  // A transform makes the page the containing block of its fixed elements: they are found
  // first, then moved back to where they were on screen (see `rideAlong`)
  const fixedInside = (page) => {
    const found = [];
    const walker = document.createTreeWalker(page, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (el) => {
        const style = getComputedStyle(el);
        if (style.display === 'none') return NodeFilter.FILTER_REJECT;
        if (style.position !== 'fixed') return NodeFilter.FILTER_SKIP;
        found.push({ el, box: el.getBoundingClientRect(), shift: style.translate, inline: el.style.translate, attr: el.hasAttribute('style') });
        return NodeFilter.FILTER_REJECT;
      },
    });
    while (walker.nextNode()) {
      // acceptNode collects them
    }
    return found;
  };

  const rideAlong = (fixed, k) => fixed.forEach((item) => {
    const now = item.el.getBoundingClientRect();
    const [x = 0, y = 0] = item.shift === 'none' ? [] : item.shift.split(' ').map(parseFloat);
    item.el.style.translate = `${x + (item.box.left - now.left) / k}px ${y + (item.box.top - now.top) / k}px`;
  });

  const letGo = (fixed) => fixed.forEach(({ el, inline, attr }) => {
    el.style.translate = inline;
    if (!attr && !el.getAttribute('style')) el.removeAttribute('style');
  });

  // Where the page is, in screen pixels: its box, its scale (a scaled parent changes nothing
  // once divided by `k`), and the part of it that is on screen
  const view = (page) => {
    const r = page.getBoundingClientRect();
    const { clientWidth: vw, clientHeight: vh } = document.documentElement;
    return {
      r,
      k: page.offsetWidth ? r.width / page.offsetWidth : 1,
      top: Math.max(r.top, 0),
      bottom: Math.min(r.bottom, vh),
      left: Math.max(r.left, 0),
      right: Math.min(r.right, vw),
    };
  };

  // One menu. `setup(m)` receives its parts (toggle, panel, closer, links, one, all, css, cut, and
  // while open page, reduced) and returns what the menu does itself:
  //   page    'under' when the menu lies under the page that moves, 'over' when it covers the
  //           page that moves under it; without it the page stays as it is
  //   rig(page)     sets the flat page up for the ride, returns its geometry with `k` (its scale);
  //                 again on resize
  //   frames(g)     the page's keyframes, set again on resize
  //   build(add, mode, g)   the opening, add(el, keyframes, delay, duration, easing, options) per
  //                 animation; mode is 'page', 'flat' (no page found) or 'reduced'
  //   ready(), entry(), key(event), resize(), reset()   optional: before it opens, where the
  //                 keyboard enters, a key of its own (true once handled), after a resize, once closed
  const menu = (root, signal, setup) => {
    const toggle = root.querySelector(`.kodza-${NAME}__toggle`);
    const panel = root.querySelector(`.kodza-${NAME}__panel`);
    if (!toggle || !panel) return;
    const one = (s) => panel.querySelector(s);
    const all = (s) => [...panel.querySelectorAll(s)];
    const closer = one(`.kodza-${NAME}__close`);
    const links = all(`.kodza-${NAME}__link`);
    const home = [panel.parentNode, panel.nextSibling];
    const css = (name) => getComputedStyle(root).getPropertyValue(`--kz-${NAME}-${name}`).trim();

    let state = 'closed'; // closed, opening, open, closing
    let sequence = []; // the opening: animations on one clock, so it can run backwards
    let session = null; // what only lives while the menu is open
    let moving = null; // the page taking part, and what it looked like before
    let reduced = false;
    let run = 0;
    let then = null;

    // The page: named on the menu (data-page="…"), or the marked wrapper around it, or else
    // the wrapper of a WordPress theme (block themes, Astra, GeneratePress, Kadence, OceanWP,
    // Blocksy, Divi…). Without one, the menu plays its sequence without the page
    const findPage = () => {
      let el = null;
      try {
        el = root.dataset.page ? document.querySelector(root.dataset.page) : null;
      } catch {
        el = null;
      }
      el = el || root.closest(`[data-${NAME}-page]`) || document.querySelector(`[data-${NAME}-page]`) || root.closest('.wp-site-blocks, #page, #outer-wrap, #main-container, #page-container');
      if (!el || el === document.body || el === document.documentElement) return null;
      // It has to fill the screen (below the WordPress admin bar): otherwise part of the site, a
      // header outside it or the space under a short page, would be left out of the ride
      const r = el.getBoundingClientRect();
      const bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--wp-admin--admin-bar--height')) || 0;
      const { clientWidth: vw, clientHeight: vh } = document.documentElement;
      return r.top <= bar + 1 && r.left <= 1 && r.right >= vw - 1 && r.bottom >= vh - 1 ? el : null;
    };

    // The colour under the page's content, so the menu never shows through it
    const ground = (page) => {
      const own = css('page');
      if (own && own !== 'auto') return own;
      for (let el = page.parentElement; el; el = el.parentElement) {
        const color = getComputedStyle(el).backgroundColor;
        if (!transparent(color)) return color;
      }
      return '#ffffff';
    };

    // A flex or grid page shares its height out among its children: for the ride their sizes
    // are held as they are, so a shorter page box changes nothing inside
    const hold = (page, style) => {
      if (style.display.includes('grid')) {
        page.style.gridTemplateRows = style.gridTemplateRows;
        page.style.gridTemplateColumns = style.gridTemplateColumns;
      } else if (style.display.includes('flex')) {
        const column = style.flexDirection.startsWith('column');
        moving.held = [...page.children].map((el) => {
          const own = getComputedStyle(el);
          const item = { el, flex: el.style.flex, attr: el.hasAttribute('style') };
          el.style.flex = `0 0 ${column ? own.height : own.width}`;
          return item;
        });
      }
    };

    const release = () => {
      moving.held.forEach(({ el, flex, attr }) => {
        el.style.flex = flex;
        if (!attr && !el.getAttribute('style')) el.removeAttribute('style');
      });
      moving.held = [];
      Object.assign(moving.page.style, moving.cut);
    };

    // The page's box ends at `at` (its own pixels from its top) for the ride, the space it
    // leaves kept as margin: what moves below it would stretch the scroll area. Checked on the
    // spot: if that moves anything inside, even with the children held, the page is left as it
    // was. Returns where the box ends
    const cut = (at) => {
      const { page } = moving;
      const full = page.offsetHeight;
      if (at >= full) return full;
      const style = getComputedStyle(page);
      const edges = style.boxSizing === 'border-box' ? 0 : ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'].reduce((sum, side) => sum + parseFloat(style[side]), 0);
      const margin = parseFloat(style.marginBottom) || 0;
      const boxes = (els) => els.map((el) => el.getBoundingClientRect()).map((r) => [r.top, r.left, r.width, r.height]);
      const kids = [...page.children];
      const before = boxes(kids);
      const shorten = () => {
        page.style.height = `${Math.max(at - edges, 0)}px`;
        page.style.overflowY = 'clip';
        page.style.marginBottom = `${margin + full - at}px`;
        return boxes(kids).some((box, i) => box.some((n, j) => Math.abs(n - before[i][j]) > 0.5));
      };
      let moved = shorten();
      if (moved && /flex|grid/.test(style.display)) {
        release();
        hold(page, style);
        moved = shorten();
      }
      if (moved) release();
      return moved ? full : at;
    };

    const m = {
      root, toggle, panel, closer, links, one, all, css, cut,
      get page() {
        return moving ? moving.page : null;
      },
      get reduced() {
        return reduced;
      },
    };
    const own = setup(m);

    // With the page untransformed: where its fixed elements are, then the menu's own geometry
    const rig = () => {
      letGo(moving.fixed);
      release();
      moving.fixed = fixedInside(moving.page);
      return own.rig(moving.page);
    };

    // The opening, as one timeline. Every animation gets an end delay that makes it as long as
    // the longest, so running them all backwards is the exact reverse, even halfway through.
    const timeline = (mode, g) => {
      const steps = [];
      const add = (el, frames, delay, duration, easing = RISE, extra = {}) => {
        if (el) steps.push([el, frames, { delay, duration, easing, ...extra }]);
      };
      own.build(add, mode, g);
      const total = Math.max(...steps.map(([, , o]) => o.delay + o.duration));
      return steps.map(([el, frames, o]) => el.animate(frames, { ...o, fill: 'both', endDelay: total - o.delay - o.duration }));
    };

    const play = (forward) => {
      const token = ++run;
      sequence.forEach((animation) => {
        animation.updatePlaybackRate(forward ? 1 : -BACK);
        animation.play();
      });
      Promise.all(sequence.map((animation) => animation.finished)).then(() => {
        if (token !== run) return;
        if (forward) state = 'open';
        else land();
      }, () => {});
    };

    // Closed again: the animations, the borrowed styles and the listeners go, the panel goes home
    const land = () => {
      run++;
      sequence.forEach((animation) => animation.cancel());
      panel.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
      sequence = [];
      session?.abort();
      session = null;
      if (moving) {
        const { page, saved, attr } = moving;
        letGo(moving.fixed);
        release();
        Object.assign(page.style, saved);
        if (!attr && !page.getAttribute('style')) page.removeAttribute('style');
        if (taken.get(page) === land) taken.delete(page);
        moving = null;
      }
      try {
        if (panel.popover && panel.matches(':popover-open')) panel.hidePopover();
      } catch {
        // no popover support: it was a plain fixed layer
      }
      panel.removeAttribute('popover');
      panel.removeAttribute('style');
      panel.hidden = true;
      if (panel.parentNode !== home[0]) home[0].insertBefore(panel, home[1]?.parentNode === home[0] ? home[1] : null);
      own.reset?.();
      state = 'closed';
      const next = then;
      then = null;
      next?.();
    };

    // While open the page stays put: a wheel or a swipe only scrolls what scrolls in the menu
    const scrollsInside = (target, x, y, dy) => {
      for (let el = target; el instanceof Element && panel.contains(el); el = el.parentElement) {
        const box = el.getBoundingClientRect();
        if (x < box.left || x > box.right || y < box.top || y > box.bottom) continue;
        if (!/(auto|scroll)/.test(getComputedStyle(el).overflowY) || el.scrollHeight <= el.clientHeight + 1) continue;
        if (dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return true;
      }
      return false;
    };

    // The links you can reach now (a menu with levels hides the others)
    const rows = () => links.filter((link) => link.getClientRects().length && !link.closest('[inert]'));

    const keydown = (event) => {
      if (state === 'closing' || event.defaultPrevented) return;
      if (own.key?.(event)) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        shut();
        return;
      }
      const current = document.activeElement;
      if (event.key === 'Tab') {
        const stops = all(FOCUSABLE).filter((el) => el.getClientRects().length && !el.closest('[inert]'));
        const first = stops[0];
        const last = stops[stops.length - 1];
        const outside = !panel.contains(current) || current === panel;
        if (outside || (event.shiftKey && current === first) || (!event.shiftKey && current === last)) {
          event.preventDefault();
          (event.shiftKey ? last : first)?.focus();
        }
        return;
      }
      const list = rows();
      const i = list.indexOf(current);
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        list[i < 0 ? (step > 0 ? 0 : list.length - 1) : (i + step + list.length) % list.length]?.focus();
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        list[event.key === 'Home' ? 0 : list.length - 1]?.focus();
      } else if ([' ', 'PageUp', 'PageDown'].includes(event.key) && !current?.closest?.('button, input, select, textarea')) {
        event.preventDefault();
      }
    };

    const listen = (s) => {
      let last = 0;
      const at = [scrollX, scrollY];
      document.addEventListener('wheel', (event) => {
        if (!scrollsInside(event.target, event.clientX, event.clientY, event.deltaY)) event.preventDefault();
      }, { passive: false, signal: s });
      document.addEventListener('touchstart', (event) => (last = event.touches[0].clientY), { passive: true, signal: s });
      document.addEventListener('touchmove', (event) => {
        const touch = event.touches[0];
        const dy = last - touch.clientY;
        last = touch.clientY;
        if (!scrollsInside(event.target, touch.clientX, touch.clientY, dy)) event.preventDefault();
      }, { passive: false, signal: s });
      document.addEventListener('keydown', keydown, { signal: s });
      // A scrollbar dragged anyway: the page goes back to where it was
      window.addEventListener('scroll', () => {
        if (scrollX !== at[0] || scrollY !== at[1]) window.scrollTo({ left: at[0], top: at[1], behavior: 'instant' });
      }, { signal: s });
      let queued = 0;
      window.addEventListener('resize', () => {
        if (queued) return;
        queued = requestAnimationFrame(() => {
          queued = 0;
          if (s.aborted) return;
          if (moving) {
            const effect = sequence.find((animation) => animation.effect.target === moving.page)?.effect;
            effect?.setKeyframes([]);
            const g = rig();
            effect?.setKeyframes(own.frames(g));
            rideAlong(moving.fixed, g.k);
          }
          own.resize?.();
        });
      }, { signal: s });
      s.addEventListener('abort', () => cancelAnimationFrame(queued));
      // A click on the page that moved aside brings it back
      moving?.page.addEventListener('click', (event) => {
        if (state === 'closing') return;
        event.preventDefault();
        event.stopPropagation();
        shut();
      }, { capture: true, signal: s });
    };

    const enter = (keyboard) => {
      const target = keyboard ? own.entry?.() || links.find((link) => link.getAttribute('aria-current')) || rows()[0] || closer : panel;
      target?.focus({ preventScroll: true });
    };

    const open = (keyboard) => {
      if (state === 'opening' || state === 'open') return;
      toggle.setAttribute('aria-expanded', 'true');
      if (state === 'closing') {
        state = 'opening';
        then = null;
        panel.style.pointerEvents = '';
        play(true);
        enter(keyboard);
        return;
      }
      reduced = motion.matches;
      const page = reduced || !own.page ? null : findPage();
      const under = page && own.page === 'under';
      let g = null;
      if (page) {
        taken.get(page)?.();
        const { transformOrigin, backgroundColor, position, zIndex, height, overflowY, marginBottom, gridTemplateRows, gridTemplateColumns } = page.style;
        moving = { page, saved: { transformOrigin, backgroundColor, position, zIndex }, cut: { height, overflowY, marginBottom, gridTemplateRows, gridTemplateColumns }, attr: page.hasAttribute('style'), fixed: [], held: [] };
        taken.set(page, land);
        g = rig();
        const shown = getComputedStyle(page);
        if (transparent(shown.backgroundColor)) page.style.backgroundColor = ground(page);
        // Under the page: page over panel over the rest of the theme (a header, a sticky bar),
        // under the admin bar
        const still = shown.position === 'static';
        if (under && (!still || ['top', 'right', 'bottom', 'left'].every((side) => shown[side] === 'auto'))) {
          if (still) page.style.position = 'relative';
          page.style.zIndex = '99991';
          panel.style.zIndex = '99990';
        }
      }
      // The panel leaves the menu while open, so the styles of a theme's content (links,
      // paragraphs) never reach it: right under the page, or on top of everything
      VARS.forEach((name) => panel.style.setProperty(`--kz-${NAME}-${name}`, css(name)));
      panel.style.fontFamily = getComputedStyle(root).fontFamily;
      if (under) page.before(panel);
      else document.body.append(panel);
      panel.hidden = false;
      if (!under) {
        try {
          panel.popover = 'manual';
          panel.showPopover();
        } catch {
          // no popover support: a fixed layer over the page
        }
      }
      own.ready?.();
      sequence = timeline(page ? 'page' : reduced ? 'reduced' : 'flat', g);
      if (moving) rideAlong(moving.fixed, g.k);
      session = new AbortController();
      listen(session.signal);
      state = 'opening';
      play(true);
      enter(keyboard);
    };

    const shut = (after) => {
      if (state === 'closed' || state === 'closing') return;
      then = after || null;
      state = 'closing';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus({ preventScroll: true });
      // On its way out it lets clicks through: Menu, under it, opens it again from where it is
      panel.style.pointerEvents = 'none';
      play(false);
    };

    // Keyboard (Enter, Space) clicks have no detail: the focus then goes into the menu
    toggle.addEventListener('click', (event) => open(event.detail === 0), { signal });
    closer?.addEventListener('click', () => shut(), { signal });
    // A link to this very page (#section, or just #) closes the menu first, then goes there
    links.forEach((link) => link.addEventListener('click', (event) => {
      const here = link.origin === location.origin && link.pathname === location.pathname && link.search === location.search;
      if (!here || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const hash = link.hash;
      shut(hash ? () => (location.hash = hash) : null);
    }, { signal }));
    // Back from another page (bfcache): the menu is closed, the page as it was
    window.addEventListener('pageshow', (event) => event.persisted && state !== 'closed' && land(), { signal });

    // Stopped while open: the page is put back at once and the panel goes back in place
    signal.addEventListener('abort', () => {
      then = null;
      if (state !== 'closed') land();
    });
  };
  // ---------- Menu engine (end) ----------

  // Below 900 px the curtain shows the bar's own links: they are written from them, unless you
  // wrote your own (a wp_nav_menu() for instance)
  const drawer = (root) => {
    const nav = root.querySelector(`.kodza-${NAME}__nav`);
    if (!nav || nav.querySelector(`.kodza-${NAME}__link`)) return;
    root.querySelectorAll(`.kodza-${NAME}__links .kodza-${NAME}__item`).forEach((item, i) => {
      const span = (name, text) => {
        const el = document.createElement('span');
        el.className = `kodza-${NAME}__${name}`;
        if (text) el.textContent = text;
        return el;
      };
      const a = document.createElement('a');
      a.className = `kodza-${NAME}__link`;
      a.href = item.getAttribute('href') || '#';
      if (item.hasAttribute('aria-current')) a.setAttribute('aria-current', item.getAttribute('aria-current'));
      const mask = span('mask');
      mask.append(span('word', item.textContent.trim()));
      a.append(mask, span('index', String(i + 1).padStart(2, '0')));
      nav.append(a);
    });
  };

  // Folded once the page has gone --kz-header-centered-after past the top: the line above fades,
  // the bar tightens and the name shrinks. The header keeps its height all along (only its inside
  // moves), so the page under it never jumps. A one-pixel mark right before it says how far
  const fold = (root, signal) => {
    const mark = document.createElement('span');
    mark.className = `kodza-${NAME}__mark`;
    mark.setAttribute('aria-hidden', 'true');
    root.before(mark);
    const check = () => {
      const style = getComputedStyle(root);
      const after = parseFloat(style.getPropertyValue(`--kz-${NAME}-after`)) || 40;
      const top = parseFloat(style.top) || 0;
      root.classList.toggle('is-compact', mark.getBoundingClientRect().top < top - after);
    };
    let frame = 0;
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(() => {
        frame = 0;
        check();
      });
    };
    document.addEventListener('scroll', schedule, { capture: true, passive: true, signal });
    window.addEventListener('resize', schedule, { signal });
    // Already down the page (a reload, a link to an anchor): folded from the first frame
    root.classList.add('is-still');
    check();
    void root.offsetWidth;
    root.classList.remove('is-still');
    signal.addEventListener('abort', () => {
      cancelAnimationFrame(frame);
      mark.remove();
      root.classList.remove('is-compact', 'is-still');
    }, { once: true });
  };

  // ---------- Opening hours (as in Hero Open) ----------
  // The week is read from data-hours ("mon closed; tue-thu 12:00-14:30, 19:00-22:30", a later
  // rule replaces an earlier one for its days, an end before the start runs past midnight) and
  // the time zone from data-timezone (an IANA name; the visitor's own time without one). Each
  // status then reads "Open now · closes 22:30", "Closes in 25 min" in the last hour (data-soon,
  // in minutes), "Closed · opens Tue 12:00" or "Opens in 20 min". Its words come from the
  // status's data-open, data-closing, data-closed and data-opening, with {time}, {min} and
  // {when} in them. data-now ("tue 22:35") pins the clock, to check a schedule before it goes live
  const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const DAY = 1440; // minutes
  const WEEK = 7 * DAY;
  const WORDS = {
    open: 'Open now · closes {time}',
    closing: 'Closes in {min} min',
    closed: 'Closed · opens {when}',
    opening: 'Opens in {min} min',
    always: 'Open 24/7',
  };

  const minutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + (m || 0);
  };
  const clock = (n) => {
    const m = ((n % DAY) + DAY) % DAY;
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  };

  // The open stretches of three weeks running (the one before and the one after catch the
  // nights across Sunday), in minutes from this Monday 00:00, joined where one runs into the next
  const stretches = (text) => {
    const week = new Map();
    (text || '').toLowerCase().split(';').forEach((rule) => {
      const m = rule.trim().match(/^([a-z]{3})(?:\s*-\s*([a-z]{3}))?\b(.*)$/);
      const from = DAYS.indexOf(m?.[1]);
      const to = m?.[2] ? DAYS.indexOf(m[2]) : from;
      if (from < 0 || to < 0) return;
      const ranges = [...m[3].matchAll(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/g)].map(([, a, b]) => [minutes(a), minutes(b)]);
      for (let d = from; ; d = (d + 1) % 7) {
        week.set(d, ranges);
        if (d === to) break;
      }
    });
    const all = [];
    [-WEEK, 0, WEEK].forEach((shift) => week.forEach((ranges, d) => ranges.forEach(([a, b]) => {
      const start = shift + d * DAY + a;
      all.push([start, start + ((b - a + DAY - 1) % DAY) + 1]);
    })));
    all.sort((a, b) => a[0] - b[0]);
    return all.reduce((joined, [a, b]) => {
      const last = joined[joined.length - 1];
      if (last && a <= last[1]) last[1] = Math.max(last[1], b);
      else joined.push([a, b]);
      return joined;
    }, []);
  };

  // Now, at the place: minutes from Monday 00:00
  const zoned = (zone) => {
    const options = { weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
    try {
      return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: zone || undefined });
    } catch {
      return new Intl.DateTimeFormat('en-GB', options);
    }
  };
  const pinned = (text) => {
    const m = (text || '').trim().toLowerCase().match(/^([a-z]{3})\s+(\d{1,2}:\d{2})$/);
    return m && DAYS.includes(m[1]) ? DAYS.indexOf(m[1]) * DAY + minutes(m[2]) : null;
  };

  const word = (text) => Object.assign(document.createElement('span'), { textContent: text });

  // Every status of the header (the line above the bar, the curtain's) says the same, at once.
  // They're held from the start: the curtain leaves the header while it's open
  const hours = (root, signal) => {
    const boxes = [...root.querySelectorAll(`.kodza-${NAME}__status`)]
      .map((status) => ({ status, text: status.querySelector(`.kodza-${NAME}__text`), shown: '' }))
      .filter((box) => box.text);
    if (!boxes.length) return;
    const lang = root.closest('[lang]')?.lang || undefined;
    let dayName;
    try {
      dayName = new Intl.DateTimeFormat(lang, { weekday: 'short', timeZone: 'UTC' });
    } catch {
      dayName = new Intl.DateTimeFormat('en', { weekday: 'short', timeZone: 'UTC' });
    }
    const day = (n) => dayName.format(new Date(Date.UTC(2024, 0, 1 + Math.floor((((n % WEEK) + WEEK) % WEEK) / DAY))));

    // The old words rise out of their window as the new ones come from below, and the window's
    // width goes from one to the other. A change that lands mid-roll drops the words already
    // leaving, and the old ones leave from where they stand
    const roll = (box, next, moving) => {
      const old = box.lastElementChild;
      const from = box.offsetWidth;
      [...box.children].forEach((el) => el !== old && el.remove());
      box.append(next);
      if (!old) return;
      if (!moving || motion.matches) return old.remove();
      const y = new DOMMatrixReadOnly(getComputedStyle(old).transform).m42;
      old.getAnimations().forEach((a) => a.cancel());
      old.classList.add('is-leaving');
      old.setAttribute('aria-hidden', 'true');
      const timing = { duration: 700, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
      old.animate([{ transform: `translateY(${y}px)` }, { transform: 'translateY(-100%)' }], { ...timing, fill: 'forwards' }).finished.then(() => old.remove(), () => {});
      next.animate([{ transform: 'translateY(100%)' }, { transform: 'none' }], timing);
      // The window opens a little ahead of the words, so their end isn't cut for long
      box.getAnimations().forEach((a) => a.cancel());
      box.animate([{ width: `${from}px` }, { width: `${box.offsetWidth}px` }], { ...timing, duration: 480 });
    };

    // A line of words, with the minutes in their own window
    const line = (template, values) => {
      const el = document.createElement('span');
      template.split(/(\{min\})/).forEach((part) => {
        if (part !== '{min}') return el.append(part.replace(/\{(time|when)\}/g, (_, key) => values[key]));
        const num = Object.assign(document.createElement('span'), { className: `kodza-${NAME}__num` });
        num.append(word(values.min));
        el.append(num);
      });
      return el;
    };

    let open = [];
    let format = null;
    const now = () => {
      const pin = pinned(root.dataset.now);
      if (pin !== null) return pin;
      const parts = Object.fromEntries(format.formatToParts(new Date()).map((p) => [p.type, p.value]));
      return DAYS.indexOf(parts.weekday.toLowerCase()) * DAY + minutes(`${parts.hour}:${parts.minute}`);
    };
    const read = () => {
      open = stretches(root.dataset.hours);
      format = zoned(root.dataset.timezone);
    };

    const update = (moving) => {
      if (!open.length) return;
      const t = now();
      const soon = Number(root.dataset.soon) || 60;
      const current = open.find(([a, b]) => a <= t && t < b);
      const next = open.find(([a]) => a > t);
      let key;
      let values;
      if (current && current[1] - current[0] >= 2 * WEEK) {
        key = 'always';
      } else if (current) {
        key = current[1] - t < soon ? 'closing' : 'open';
        values = { time: clock(current[1]), min: String(current[1] - t) };
      } else {
        key = next[0] - t < soon ? 'opening' : 'closed';
        const today = Math.floor(next[0] / DAY) === Math.floor(t / DAY);
        values = { min: String(next[0] - t), when: today ? clock(next[0]) : `${day(next[0])} ${clock(next[0])}` };
      }
      boxes.forEach((box) => {
        box.status.classList.toggle('is-open', Boolean(current));
        box.status.classList.toggle('is-closed', !current);
        const template = box.status.dataset[key] || WORDS[key];
        const same = `${key}|${template}|${values?.time}|${values?.when}`;
        if (same === box.shown && template.includes('{min}')) {
          // Only the minutes moved: they roll on their own
          const num = box.text.lastElementChild?.querySelector(`.kodza-${NAME}__num`);
          if (num && num.lastElementChild?.textContent !== values.min) roll(num, word(values.min), moving);
          return;
        }
        if (same === box.shown) return;
        // The words as written stay for a first paint without the script; they're replaced at once
        if (!box.shown) box.text.replaceChildren();
        box.shown = same;
        roll(box.text, line(template, values ?? {}), moving);
      });
    };

    read();
    update(false);

    // Every minute on the minute, and at once when the tab comes back or the hours change
    let timer = 0;
    const tick = () => {
      update(true);
      timer = setTimeout(tick, 60000 - (Date.now() % 60000) + 50);
    };
    timer = setTimeout(tick, 60000 - (Date.now() % 60000) + 50);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) update(true);
    }, { signal });
    const watch = new MutationObserver(() => {
      read();
      update(true);
    });
    watch.observe(root, { attributes: true, attributeFilter: ['data-hours', 'data-timezone', 'data-now', 'data-soon'] });
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      watch.disconnect();
      boxes.forEach((box) => box.status.classList.remove('is-open', 'is-closed'));
    }, { once: true });
  };

  function mount(root, signal) {
    drawer(root);
    fold(root, signal);
    hours(root, signal);
    menu(root, signal, (m) => {
      const { panel, toggle, closer, links, one, all, css } = m;
      const shade = one('.kodza-header-centered__shade');
      const curtain = one('.kodza-header-centered__curtain');
      const edge = one('.kodza-header-centered__edge');
      const cross = one('.kodza-header-centered__cross');
      const say = one('.kodza-header-centered__say > span');
      const label = one('.kodza-header-centered__label');
      const head = one('.kodza-header-centered__head');
      const infos = all('.kodza-header-centered__info > *');
      const lines = toggle.querySelector('.kodza-header-centered__lines');
      const depth = () => parseFloat(css('menu-depth')) || 0.94;

      // The page backs off towards the bottom of the screen. Only its visible part shows, so its
      // rounded corners are the screen's; a smaller page never stretches the scroll area
      const rig = (page) => {
        const { r, k, top, bottom, left, right } = view(page);
        const hinge = (bottom - r.top) / k;
        const clip = [(top - r.top) / k, (r.right - right) / k, page.offsetHeight - hinge, (left - r.left) / k];
        page.style.transformOrigin = `${((left + right) / 2 - r.left) / k}px ${hinge}px`;
        return { k, clip: clip.map((n) => `${Math.max(n, 0)}px`).join(' ') };
      };
      const frames = (g) => [
        { transform: 'scale(1)', clipPath: `inset(${g.clip} round 0px)` },
        { transform: `scale(${depth()})`, clipPath: `inset(${g.clip} round 18px)` },
      ];

      // Around the page once it has backed off: its own colour on screen, much darker, so the
      // edge reads and the site's body never shows through
      const around = () => {
        const { clientWidth: vw, clientHeight: vh } = document.documentElement;
        let el = document.elementsFromPoint(vw / 2, vh / 2).find((node) => m.page.contains(node));
        for (; el && el !== m.page.parentElement; el = el.parentElement) {
          const color = getComputedStyle(el).backgroundColor;
          if (!transparent(color)) return `color-mix(in srgb, ${color} 18%, #000)`;
        }
        return '#000';
      };

      // The lines cross on the button, and Close shows them crossed once the edge is over it
      const turn = (el, sign) => {
        const pseudoElement = sign > 0 ? '::before' : '::after';
        return (add) => {
          add(el, [{ translate: '0 0' }, { translate: `0 ${3 * sign}px` }], 0, 200, SWING, { pseudoElement });
          add(el, [{ rotate: '0deg' }, { rotate: `${45 * sign}deg` }], 170, 300, RISE, { pseudoElement });
        };
      };

      // Close lands right where Menu was, wherever the bar puts it
      const ready = () => {
        head.removeAttribute('style');
        const t = toggle.getBoundingClientRect();
        const s = panel.getBoundingClientRect();
        const k = panel.offsetWidth ? s.width / panel.offsetWidth : 1;
        const dy = (t.top - s.top) / k;
        const dx = (s.right - t.right) / k;
        if (dy >= 0 && dy <= 96 && dx >= 0 && dx <= panel.offsetWidth / 3) {
          head.style.paddingTop = `${dy}px`;
          head.style.paddingRight = `${dx}px`;
        }
      };

      const build = (add, mode, g) => {
        if (mode === 'reduced') {
          add(panel, [{ opacity: 0 }, { opacity: 1 }], 0, 180, 'ease');
          return;
        }
        const time = (parseFloat(css('menu-duration')) || 1) * 1000;
        const ease = css('menu-ease') || 'cubic-bezier(0.76, 0, 0.24, 1)';
        const { top: y0, left: x0, width: w, height: h } = panel.getBoundingClientRect();

        // The curtain comes down on the curve; its edge bends as deep as it is fast
        const samples = curve(ease);
        const speed = samples.map((_, i) => {
          const [a, b] = [samples[Math.max(i - 1, 0)], samples[Math.min(i + 1, 100)]];
          return b[0] > a[0] ? (b[1] - a[1]) / (b[0] - a[0]) : 0;
        });
        const most = Math.max(...speed) || 1;
        const bend = speed.map((v, i) => (i === 0 || i === 100 ? 0 : v / most));
        const deep = parseFloat(getComputedStyle(edge).height) || 0;
        add(curtain, [{ transform: 'translateY(-100%)' }, { transform: 'translateY(0%)' }], 0, time, ease);
        add(edge, samples.map(([t], i) => ({ offset: t, transform: `scaleY(${bend[i]})` })).filter((_, i) => i % 5 === 0), 0, time, 'linear');

        // When the edge gets to `y` at `x` (screen pixels): the middle comes first, the sides last
        const reach = (y, x) => {
          const u = (2 * (x - x0)) / w - 1;
          const shape = Math.max(1 - u * u, 0);
          const i = samples.findIndex(([, p], j) => y0 + p * h + deep * bend[j] * shape >= y);
          return (i < 0 ? 1 : samples[i][0]) * time;
        };
        const far = (r) => (Math.abs(r.left - (x0 + w / 2)) > Math.abs(r.right - (x0 + w / 2)) ? r.left : r.right);

        // The page backs off and dims (without one, the shade alone). Only the dimming fades in:
        // what shows around the page is solid from the first frame
        const dim = getComputedStyle(shade).backgroundColor;
        if (mode === 'page') {
          add(m.page, frames(g), 0, time, ease);
          const scale = depth();
          // Where it lands, also written on the element: the open state holds without the animation
          Object.assign(shade.style, { boxShadow: `0 0 0 100vmax ${around()}`, borderRadius: `${18 * g.k}px` });
          add(shade, [
            { backgroundColor: 'rgba(0, 0, 0, 0)', transform: 'scale(1)', borderRadius: '0px', transformOrigin: '50% 100%' },
            { backgroundColor: dim, transform: `scale(${scale})`, borderRadius: `${18 * g.k}px`, transformOrigin: '50% 100%' },
          ], 0, time, ease);
        } else {
          add(shade, [{ backgroundColor: 'rgba(0, 0, 0, 0)' }, { backgroundColor: dim }], 0, time, ease);
        }

        // The button's lines cross, and Close is uncovered by the edge, its lines already crossed
        if (lines) [turn(lines, 1), turn(lines, -1)].forEach((go) => go(add));
        if (cross) [turn(cross, 1), turn(cross, -1)].forEach((go) => go(add));
        if (closer) {
          const r = closer.getBoundingClientRect();
          const x = r.left + r.width / 2;
          const from = reach(r.top - 8, x);
          add(closer, [
            { clipPath: 'inset(-8px -8px calc(100% + 8px) -8px round 28px)' },
            { clipPath: 'inset(-8px -8px -8px -8px round 28px)' },
          ], from, Math.max(reach(r.bottom + 8, x) - from, 1), 'linear');
          add(say, [{ transform: 'translateY(110%)' }, { transform: 'translateY(0%)' }], from + 120, 600);
        }
        if (label) {
          const r = label.getBoundingClientRect();
          add(label, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0px)' }], reach(r.bottom, far(r)) + 100, 600);
        }

        // Each link rises from its mask once the edge has gone past all of it
        let at = 0;
        links.forEach((link) => {
          const mask = link.querySelector('.kodza-header-centered__mask');
          const r = (mask || link).getBoundingClientRect();
          at = Math.max(at + 70, reach(r.bottom, far(r)));
          add(link.querySelector('.kodza-header-centered__word'), [{ transform: 'translateY(135%)' }, { transform: 'translateY(0%)' }], at, 900);
          add(link.querySelector('.kodza-header-centered__index'), [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0px)' }], at + 240, 600);
        });
        infos.forEach((info, i) => {
          const r = info.getBoundingClientRect();
          add(info, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0px)' }], Math.max(at + 200 + i * 70, reach(r.bottom, far(r))), 650);
        });
      };

      // Back over 900 px, the links are back in the bar: the curtain closes
      const menuBar = root.querySelector('.kodza-header-centered__links');
      const watch = new ResizeObserver(() => {
        if (menuBar && getComputedStyle(menuBar).display !== 'none' && toggle.getAttribute('aria-expanded') === 'true') closer?.click();
      });
      watch.observe(root);
      signal.addEventListener('abort', () => watch.disconnect(), { once: true });

      const reset = () => {
        shade.removeAttribute('style');
        head.removeAttribute('style');
      };
      return { page: 'over', rig, frames, build, ready, reset };
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
