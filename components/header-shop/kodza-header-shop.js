// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Header Shop
// The shop header: the name, the categories, then a glass that opens the search over them (the
// field unrolls from the button, the glass slides to its far end, the links step out to the
// left), the account and the bag, whose count rolls digit by digit whenever data-count changes
// (as in Add to Cart, which can aim at it). Below 900 px a Menu button opens Side Reveal: the
// page steps aside to the left, the menu is under it, its links written from the categories.
(() => {
  // The two lines that change from one menu of the family to the next
  const NAME = 'header-shop';
  const VARS = ['menu-bg', 'menu-fg', 'menu-muted', 'menu-top', 'menu-side', 'menu-size', 'menu-width', 'menu-shade', 'menu-shadow'];

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

  // Below 900 px the menu shows the bar's own categories: they are written from them, unless you
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
      a.append(span('index', String(i + 1).padStart(2, '0')), mask);
      nav.append(a);
    });
  };

  // The search: the field unrolls from the glass over the room the categories leave (they step
  // out to the left), and the glass slides to its far end while a cross takes its place. Below
  // 900 px it runs over the name too. Esc, a click elsewhere or Tab out of it folds it back; Enter
  // sends the form as it is (?s=…&post_type=product for WooCommerce)
  const search = (root, signal) => {
    const form = root.querySelector(`.kodza-${NAME}__search`);
    const find = form?.querySelector(`.kodza-${NAME}__find`);
    const input = form?.querySelector(`.kodza-${NAME}__input`);
    if (!form || !find || !input) return;
    const links = root.querySelector(`.kodza-${NAME}__links`);
    const bar = root.querySelector(`.kodza-${NAME}__menu`);
    const logo = root.querySelector(`.kodza-${NAME}__logo`);
    const said = find.getAttribute('aria-label');
    const isOpen = () => form.classList.contains('is-open');
    // What the field covers can't be reached while it's open
    const cover = () => {
      if (links) links.inert = isOpen();
      if (logo) logo.inert = isOpen() && (!bar || getComputedStyle(bar).display === 'none');
    };
    // How far the glass travels: from the button to the field's far end
    const sizes = new ResizeObserver(() => {
      form.style.setProperty(`--kz-${NAME}-run`, `${form.offsetWidth - find.offsetWidth}px`);
      cover();
    });
    sizes.observe(form);

    const set = (open) => {
      form.classList.toggle('is-open', open);
      root.classList.toggle('is-searching', open);
      find.setAttribute('aria-expanded', String(open));
      if (said) find.setAttribute('aria-label', open ? find.dataset.close || said : said);
      cover();
      if (open) input.focus({ preventScroll: true });
    };

    find.addEventListener('click', () => set(!isOpen()), { signal });
    form.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !isOpen()) return;
      event.preventDefault();
      set(false);
      find.focus();
    }, { signal });
    document.addEventListener('pointerdown', (event) => {
      if (isOpen() && !form.contains(event.target)) set(false);
    }, { signal });
    form.addEventListener('focusout', (event) => {
      if (isOpen() && event.relatedTarget && !form.contains(event.relatedTarget)) set(false);
    }, { signal });

    signal.addEventListener('abort', () => {
      sizes.disconnect();
      set(false);
      form.style.removeProperty(`--kz-${NAME}-run`);
    }, { once: true });
  };

  // The bag (Add to Cart's cart): its count follows data-count, rolling only the digits that
  // change (999 → 1,000 carries), and the bag gives a little bump each time something lands in it
  const countOf = (cart) => Math.max(0, parseInt(cart.dataset.count, 10) || 0);
  const format = (n) => new Intl.NumberFormat(document.documentElement.lang || undefined).format(n);

  const mountCart = (cart, signal) => {
    const count = cart.querySelector(`.kodza-${NAME}__count`);
    const bag = cart.querySelector(`.kodza-${NAME}__bag`);
    let shown = countOf(cart);

    const label = (n) => {
      const text = cart.getAttribute('aria-label');
      if (!text) return;
      cart.setAttribute('aria-label', text.replace(/\d[\d.,\u00a0\u202f]*/, format(n)).replace(/\bitems?\b/, n === 1 ? 'item' : 'items'));
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
        const cell = Object.assign(document.createElement('span'), { className: `kodza-${NAME}__digit` });
        const next = Object.assign(document.createElement('span'), { textContent: now[i].trim() });
        cell.append(next);
        count.append(cell);
        if (was[i] === now[i] || motion.matches) continue;
        const old = Object.assign(document.createElement('span'), { textContent: was[i].trim() });
        cell.append(old);
        const timing = { duration: 460, delay: (n - 1 - i) * 60, easing: RISE };
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
      if (motion.matches || next < from) return;
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
  };

  function mount(root, signal) {
    drawer(root);
    search(root, signal);
    const cart = root.querySelector(`.kodza-${NAME}__cart`);
    if (cart) mountCart(cart, signal);

    menu(root, signal, (m) => {
      const { panel, toggle, closer, links, one, all, css } = m;
      const shade = one('.kodza-header-shop__shade');
      const card = one('.kodza-header-shop__card');
      const side = one('.kodza-header-shop__side');
      const head = one('.kodza-header-shop__bar');
      const cross = one('.kodza-header-shop__cross');
      const say = one('.kodza-header-shop__say > span');
      const label = one('.kodza-header-shop__label');
      const infos = all('.kodza-header-shop__info > *');
      const lines = toggle.querySelector('.kodza-header-shop__lines');
      const depth = () => parseFloat(css('menu-depth')) || 0.88;
      // Where the card stops: its right edge meets the menu column
      const stop = () => side.getBoundingClientRect().left;
      let last = null;

      // Without a page the menu comes over it: a click on the dimmed page closes
      shade.addEventListener('click', () => closer?.click(), { signal });

      // The page steps aside from its right edge, at mid-height of what is on screen. Only its
      // visible part shows, so its rounded corners are the screen's; a smaller page never
      // stretches the scroll area
      const rig = (page) => {
        const { r, k, top, bottom, left, right } = view(page);
        const clip = [(top - r.top) / k, (r.right - right) / k, (r.bottom - bottom) / k, (left - r.left) / k];
        page.style.transformOrigin = `${(right - r.left) / k}px ${((top + bottom) / 2 - r.top) / k}px`;
        last = { k, top, bottom, left, right, clip: clip.map((n) => `${Math.max(n, 0)}px`).join(' ') };
        return last;
      };
      const frames = (g) => {
        const s = depth();
        return [
          { transform: 'translateX(0px) scale(1)', clipPath: `inset(${g.clip} round 0px)` },
          { transform: `translateX(${(stop() - g.right) / g.k}px) scale(${s})`, clipPath: `inset(${g.clip} round ${18 / (s * g.k)}px)` },
        ];
      };

      // The card's shadow, under the page: the same box on the same path
      const shadow = (g) => {
        const p = panel.getBoundingClientRect();
        const kp = panel.offsetWidth ? p.width / panel.offsetWidth : 1;
        const w = (g.right - g.left) / kp;
        const s = depth();
        // Its rounded corners where it lands are also written on it: the open state holds without
        // the animation
        Object.assign(card.style, {
          inset: 'auto',
          left: `${(g.left - p.left) / kp}px`,
          top: `${(g.top - p.top) / kp}px`,
          width: `${w}px`,
          height: `${(g.bottom - g.top) / kp}px`,
          transformOrigin: `${w}px 50%`,
          borderRadius: `${18 / (s * kp)}px`,
        });
        return [
          { transform: 'translateX(0px) scale(1)', borderRadius: '0px' },
          { transform: `translateX(${(stop() - g.right) / kp}px) scale(${s})`, borderRadius: `${18 / (s * kp)}px` },
        ];
      };

      // The lines cross on the button, and Close is uncovered with them crossed
      const turn = (el, sign) => {
        const pseudoElement = sign > 0 ? '::before' : '::after';
        return (add) => {
          add(el, [{ translate: '0 0' }, { translate: `0 ${3 * sign}px` }], 0, 200, SWING, { pseudoElement });
          add(el, [{ rotate: '0deg' }, { rotate: `${45 * sign}deg` }], 170, 300, RISE, { pseudoElement });
        };
      };

      const build = (add, mode, g) => {
        if (mode === 'reduced') {
          add(panel, [{ opacity: 0 }, { opacity: 1 }], 0, 180, 'ease');
          return;
        }
        const time = (parseFloat(css('menu-duration')) || 1) * 1000;
        const ease = css('menu-ease') || 'cubic-bezier(0.76, 0, 0.24, 1)';
        const col = side.getBoundingClientRect();

        // The page steps aside and the menu is under it; without one, the column slides in over
        // the dimmed page. Either way an edge goes from `right` to the column's left
        let right = col.right;
        if (mode === 'page') {
          right = g.right;
          add(m.page, frames(g), 0, time, ease);
          add(card, shadow(g), 0, time, ease);
        } else {
          add(shade, [{ opacity: 0 }, { opacity: 1 }], 0, time, ease);
          add(side, [{ transform: 'translateX(100%)' }, { transform: 'translateX(0%)' }], 0, time, ease);
        }

        // When that edge gets past `x` (screen pixels)
        const samples = curve(ease);
        const uncover = (x) => {
          const i = samples.findIndex(([, p]) => right + (col.left - right) * p <= x);
          return (i < 0 ? 1 : samples[i][0]) * time;
        };

        if (lines) [turn(lines, 1), turn(lines, -1)].forEach((go) => go(add));
        if (cross) [turn(cross, 1), turn(cross, -1)].forEach((go) => go(add));
        if (closer) add(say, [{ transform: 'translateY(110%)' }, { transform: 'translateY(0%)' }], uncover(closer.getBoundingClientRect().right) + 80, 600);
        if (label) add(label, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0px)' }], uncover(label.getBoundingClientRect().right) + 60, 600);

        // Each word rises from its mask as the edge goes past it, never two at once
        let at = 0;
        links.forEach((link, i) => {
          const box = (link.querySelector('.kodza-header-shop__mask') || link).getBoundingClientRect();
          at = Math.max(i ? at + 70 : 0, uncover(box.left + box.width / 2) - 120);
          add(link.querySelector('.kodza-header-shop__word'), [{ transform: 'translateY(135%)' }, { transform: 'translateY(0%)' }], at, 900);
          add(link.querySelector('.kodza-header-shop__index'), [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0px)' }], at + 240, 600);
        });
        infos.forEach((info, i) => {
          const from = Math.max(at + 200 + i * 70, uncover(info.getBoundingClientRect().right));
          add(info, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0px)' }], from, 650);
        });
      };

      // Close lands where Menu was: the column's top and right margins follow the button
      const ready = () => {
        panel.classList.toggle('is-flat', !m.page);
        head.removeAttribute('style');
        side.style.removeProperty('padding-right');
        const t = toggle.getBoundingClientRect();
        const s = panel.getBoundingClientRect();
        const k = panel.offsetWidth ? s.width / panel.offsetWidth : 1;
        const dy = (t.top - s.top) / k;
        const dx = (s.right - t.right) / k;
        if (dy >= 0 && dy <= 96 && dx >= 0 && dx <= panel.offsetWidth / 3) {
          head.style.paddingTop = `${dy}px`;
          side.style.paddingRight = `${dx}px`;
        }
      };
      const resize = () => {
        if (m.page && last) card.getAnimations()[0]?.effect.setKeyframes(shadow(last));
      };

      // Back over 900 px, the categories are back in the bar: the menu closes
      const menuBar = root.querySelector('.kodza-header-shop__menu');
      const watch = new ResizeObserver(() => {
        if (menuBar && getComputedStyle(menuBar).display !== 'none' && toggle.getAttribute('aria-expanded') === 'true') closer?.click();
      });
      watch.observe(root);
      signal.addEventListener('abort', () => watch.disconnect(), { once: true });

      const reset = () => {
        card.removeAttribute('style');
        head.removeAttribute('style');
        side.removeAttribute('style');
        panel.classList.remove('is-flat');
      };
      return { page: 'under', rig, frames, build, ready, resize, reset };
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
