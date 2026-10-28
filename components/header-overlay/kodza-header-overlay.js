// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Header Overlay
// The header that sits on your hero photo, white with no background. Once the hero has gone
// under it, a solid bar comes down from the top like a blind and the text turns to ink along its
// edge; back on the hero it all rolls away. Below 900 px a Menu button opens a curtain of ink
// (Fullscreen Menu, same engine), its links written from the bar's own.
(() => {
  // The two lines that change from one menu of the family to the next
  const NAME = 'header-overlay';
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

  // The blind: it comes down once the hero has gone under the bar, and rolls away when it comes
  // back. The row is cut below its edge, an ink copy of it above: the text turns along the edge.
  // Once landed, the row takes the ink itself (the copy can't be pointed at or focused)
  const blind = (root, signal) => {
    const bar = root.querySelector(`.kodza-${NAME}__bar`);
    const row = root.querySelector(`.kodza-${NAME}__row`);
    const fill = root.querySelector(`.kodza-${NAME}__fill`);
    if (!bar || !row || !fill) return;
    const ink = row.cloneNode(true);
    ink.classList.add(`kodza-${NAME}__row--ink`);
    ink.setAttribute('aria-hidden', 'true');
    ink.inert = true;
    ink.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    row.after(ink);

    // The hero: named with data-hero, or what comes right after the header (the first block of
    // a wrapper taller than the screen)
    let hero = null;
    const find = () => {
      if (hero?.isConnected) return hero;
      if (root.dataset.hero) return (hero = document.querySelector(root.dataset.hero));
      let el = root;
      while (el && !el.nextElementSibling) el = el.parentElement;
      el = el?.nextElementSibling;
      while (el?.firstElementChild && el.offsetHeight > window.innerHeight * 1.2) el = el.firstElementChild;
      return (hero = el || null);
    };

    // Swapped in one frame, with nothing easing
    const swap = (change) => {
      root.classList.add('is-swap');
      change();
      void root.offsetWidth;
      root.classList.remove('is-swap');
    };
    let down = null;
    const set = (next, now) => {
      if (next === down) return;
      down = next;
      if (now || motion.matches) {
        swap(() => {
          root.classList.toggle('is-down', next);
          root.classList.toggle('is-solid', next);
        });
        return;
      }
      if (next) {
        root.classList.add('is-down');
        if (!parseFloat(getComputedStyle(fill).transitionDuration)) swap(() => root.classList.add('is-solid'));
        return;
      }
      // Going back up from where it landed: the copy takes over first, then it all rolls away
      if (root.classList.contains('is-solid')) swap(() => root.classList.remove('is-solid'));
      root.classList.remove('is-down');
    };
    const check = (now) => {
      const el = find();
      // Two bars' height early: the blind is past the text before the photo is gone, so white text
      // doesn't sit on the page, even on a quick scroll
      const r = bar.getBoundingClientRect();
      const edge = r.bottom + r.height * 2;
      set(el ? el.getBoundingClientRect().bottom <= edge : window.scrollY > window.innerHeight - edge, now);
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
    fill.addEventListener('transitionend', (event) => {
      if (event.target === fill && event.propertyName === 'transform' && down && !root.classList.contains('is-solid')) {
        swap(() => root.classList.add('is-solid'));
      }
    }, { signal });
    check(true);

    signal.addEventListener('abort', () => {
      cancelAnimationFrame(frame);
      ink.remove();
      root.classList.remove('is-down', 'is-solid', 'is-swap');
    }, { once: true });
  };

  function mount(root, signal) {
    drawer(root);
    blind(root, signal);
    menu(root, signal, (m) => {
      const { panel, toggle, closer, links, one, all, css } = m;
      const shade = one('.kodza-header-overlay__shade');
      const curtain = one('.kodza-header-overlay__curtain');
      const edge = one('.kodza-header-overlay__edge');
      const cross = one('.kodza-header-overlay__cross');
      const say = one('.kodza-header-overlay__say > span');
      const label = one('.kodza-header-overlay__label');
      const head = one('.kodza-header-overlay__head');
      const infos = all('.kodza-header-overlay__info > *');
      const lines = toggle.querySelector('.kodza-header-overlay__lines');
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
          const mask = link.querySelector('.kodza-header-overlay__mask');
          const r = (mask || link).getBoundingClientRect();
          at = Math.max(at + 70, reach(r.bottom, far(r)));
          add(link.querySelector('.kodza-header-overlay__word'), [{ transform: 'translateY(135%)' }, { transform: 'translateY(0%)' }], at, 900);
          add(link.querySelector('.kodza-header-overlay__index'), [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0px)' }], at + 240, 600);
        });
        infos.forEach((info, i) => {
          const r = info.getBoundingClientRect();
          add(info, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0px)' }], Math.max(at + 200 + i * 70, reach(r.bottom, far(r))), 650);
        });
      };

      // Back over 900 px, the links are back in the bar: the curtain closes
      const menuBar = root.querySelector('.kodza-header-overlay__menu');
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
