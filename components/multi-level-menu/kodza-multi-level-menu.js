// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Multi-Level Menu
// A drawer for menus with levels. It reads the nested list WordPress writes (ul.sub-menu): a row
// with a sub-menu opens its level, which slides in over the one before, and the row on top rolls
// to the level's name and becomes the way back. The path to the current page is marked all the
// way down. Close lands right where Menu was, and the drawer opens on the button's side.
(() => {
  // The two lines that change from one menu of the family to the next
  const NAME = 'multi-level';
  const VARS = ['bg', 'fg', 'muted', 'rule', 'size', 'width', 'gap', 'radius', 'pad', 'shade', 'shadow'];

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

  // A menu written the WordPress way (li > a, with a ul.sub-menu under a row that has children)
  // becomes levels: each sub-menu is taken out of its row and stacked in the nav, and its row
  // becomes a button that opens it. The list as written comes back on kodza:destroy
  const decorate = (root) => {
    const nav = root.querySelector(`.kodza-${NAME}__nav`);
    const top = nav?.querySelector('ul');
    if (!top) return null;
    const c = (part) => `kodza-${NAME}__${part}`;
    const heading = root.querySelector(`.${c('heading')}`);
    const levels = new Map([[top, { title: heading?.textContent.trim() || nav.getAttribute('aria-label') || 'Menu', branch: null, parent: null }]]);
    // A row that is a page of its own stays reachable, first in its level: "All Keyboards"
    const prefix = root.dataset.all ?? 'All';
    // The current page has aria-current="page" (wp_nav_menu() writes it), and every row on the
    // way to it is marked too. WordPress's own classes count as well
    const path = /(^|\s)current(-menu-|_page_)(item|ancestor|parent)(\s|$)/;
    const here = /(^|\s)current(-menu-item|_page_item)(\s|$)/;
    const dress = (link, current) => {
      const mask = document.createElement('span');
      const word = document.createElement('span');
      const meta = document.createElement('span');
      mask.className = c('mask');
      word.className = c('word');
      meta.className = c('meta');
      meta.setAttribute('aria-hidden', 'true');
      word.append(...link.childNodes);
      mask.append(word);
      link.append(mask, meta);
      link.classList.add(c('link'));
      link.classList.toggle('is-current', current);
      return meta;
    };
    top.classList.add(c('list'));
    [...top.querySelectorAll('li')].forEach((li) => {
      li.classList.add(c('item'));
      const a = li.querySelector(':scope > a');
      const sub = li.querySelector(':scope > ul');
      if (!a) return;
      const onPath = path.test(li.className) || !!li.querySelector('a[aria-current="page"]');
      if (!sub) {
        dress(a, onPath);
        return;
      }
      const title = a.textContent.trim();
      const count = sub.querySelectorAll(':scope > li').length;
      const branch = document.createElement('button');
      branch.type = 'button';
      branch.className = c('branch');
      branch.setAttribute('aria-expanded', 'false');
      branch.append(...a.childNodes);
      a.replaceWith(branch);
      const number = document.createElement('span');
      number.textContent = String(count).padStart(2, '0');
      dress(branch, onPath).append(number);
      const href = a.getAttribute('href');
      if (prefix && href && href !== '#') {
        const all = document.createElement('li');
        all.className = `${c('item')} ${c('all')}`;
        a.textContent = `${prefix} ${title}`;
        all.append(a);
        dress(a, here.test(li.className) || a.getAttribute('aria-current') === 'page');
        sub.prepend(all);
      }
      sub.classList.add(c('list'));
      sub.setAttribute('aria-label', title);
      sub.hidden = true;
      sub.inert = true;
      levels.set(sub, { title, branch, parent: li.closest('ul') });
      nav.append(sub);
    });
    return levels;
  };

  function mount(root, signal) {
    const levels = decorate(root);
    if (!levels) return;
    menu(root, signal, (m) => {
      const { panel, toggle, closer, one, all, css } = m;
      const shade = one('.kodza-multi-level__shade');
      const sheet = one('.kodza-multi-level__sheet');
      const bar = one('.kodza-multi-level__bar');
      const back = one('.kodza-multi-level__back');
      const heading = one('.kodza-multi-level__heading');
      const nav = one('.kodza-multi-level__nav');
      const cross = one('.kodza-multi-level__cross');
      const say = one('.kodza-multi-level__say > span');
      const foot = all('.kodza-multi-level__foot > *');
      const lines = toggle.querySelector('.kodza-multi-level__lines');
      const [top] = levels.keys();
      const first = heading?.firstElementChild;
      const opens = new Map([...levels].filter(([, info]) => info.branch).map(([list, info]) => [info.branch, list]));
      const slides = new Map(); // the rows on their way from one level to the other
      let level = top;

      // A click on the dimmed page closes it
      shade?.addEventListener('click', () => closer?.click(), { signal });

      // The lines cross on the button, and Close arrives with them crossed
      const turn = (el, sign) => {
        const pseudoElement = sign > 0 ? '::before' : '::after';
        return (add) => {
          add(el, [{ translate: '0 0' }, { translate: `0 ${3 * sign}px` }], 0, 200, SWING, { pseudoElement });
          add(el, [{ rotate: '0deg' }, { rotate: `${45 * sign}deg` }], 170, 300, RISE, { pseudoElement });
        };
      };

      const build = (add, mode) => {
        if (mode === 'reduced') {
          add(panel, [{ opacity: 0 }, { opacity: 1 }], 0, 180, 'ease');
          return;
        }
        const time = (parseFloat(css('duration')) || 0.8) * 1000;
        const ease = css('ease') || 'cubic-bezier(0.32, 0.72, 0, 1)';
        const samples = curve(ease);
        // When the drawer is that far in, from 0 to 1
        const at = (p) => (samples.find(([, q]) => q >= p) || [1])[0] * time;
        const dir = panel.classList.contains('is-left') ? -1 : 1;

        add(shade, [{ opacity: 0 }, { opacity: 1 }], 0, time, ease);
        add(sheet, [{ transform: `translateX(calc(${dir * 100}% + ${dir * 80}px))` }, { transform: 'translateX(0px)' }], 0, time, ease);
        if (lines) [turn(lines, 1), turn(lines, -1)].forEach((spin) => spin(add));
        if (cross) [turn(cross, 1), turn(cross, -1)].forEach((spin) => spin(add));
        if (closer) add(say, [{ transform: 'translateY(110%)' }, { transform: 'translateY(0%)' }], at(0.85), 600);

        // Once the drawer is mostly in, the level's name rises, then each row from its mask
        const start = at(0.6);
        const last = rise(add, first, top, start);
        foot.forEach((el, i) => add(el, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0px)' }], last + 120 + i * 70, 650));
      };

      // A level coming in with the drawer: its name, then each row from its mask, its hairline
      // drawn from the left. Returns when the last row starts
      const rise = (add, name, list, start) => {
        if (name) add(name, [{ transform: 'translateY(110%)' }, { transform: 'translateY(0%)' }], Math.max(start - 40, 0), 700);
        let last = start;
        [...list.children].forEach((li, i) => {
          last = start + i * 55;
          add(li.querySelector('.kodza-multi-level__word'), [{ transform: 'translateY(135%)' }, { transform: 'translateY(0%)' }], last, 900);
          add(li, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], last + 80, 800, RISE, { pseudoElement: '::after' });
          add(li.querySelector('.kodza-multi-level__meta'), [{ opacity: 0, transform: 'translateX(-6px)' }, { opacity: 1, transform: 'translateX(0px)' }], last + 240, 600);
        });
        return last;
      };

      // Closed from a level down, the opening runs backwards on the first level, out of sight:
      // the level on screen goes back into its masks the same way, at the same pace
      let leaving = [];
      const watch = new MutationObserver(() => {
        if (toggle.getAttribute('aria-expanded') === 'true') {
          // Opened again on the way out: it comes back up at the opening's pace
          leaving.forEach((animation) => {
            animation.updatePlaybackRate(-1 / BACK);
            animation.play();
          });
          return;
        }
        leaving.forEach((animation) => animation.cancel());
        leaving = [];
        if (level === top || m.reduced || motion.matches) return;
        const steps = [];
        rise((el, frames, delay, duration, easing = RISE, extra = {}) => {
          if (el) steps.push([el, frames, { delay, duration, easing, ...extra }]);
        }, heading?.lastElementChild, level, 40);
        const total = Math.max(...steps.map(([, , o]) => o.delay + o.duration));
        leaving = steps.map(([el, frames, o]) => el.animate(frames, { ...o, direction: 'reverse', delay: (total - o.delay - o.duration) / BACK, duration: o.duration / BACK, fill: 'forwards' }));
      });
      watch.observe(toggle, { attributes: true, attributeFilter: ['aria-expanded'] });
      signal.addEventListener('abort', () => watch.disconnect(), { once: true });

      // A row on its way: from where it is now if it was already moving
      const slide = (li, frames, options) => {
        const was = slides.get(li);
        if (was) {
          const now = getComputedStyle(li);
          frames[0] = { ...frames[0], opacity: now.opacity, transform: now.transform === 'none' ? 'translateX(0px)' : now.transform };
          was.cancel();
        }
        const animation = li.animate(frames, options);
        slides.set(li, animation);
        return animation;
      };

      // One level down or back up: the rows you leave go out on one side as the new ones come
      // in from the other, and the name on top rolls
      const go = (to, keyboard, up = false) => {
        if (!to || to === level) return;
        const from = level;
        const dir = up ? -1 : 1;
        const quick = m.reduced || motion.matches;
        const { title, parent } = levels.get(to);
        level = to;
        from.inert = true;
        to.hidden = false;
        to.inert = false;

        // The row on top is the way back from the second level on
        if (back) {
          back.disabled = !parent;
          back.classList.toggle('is-deep', !!parent);
          if (parent) {
            back.removeAttribute('aria-hidden');
            back.setAttribute('aria-label', `${title}, back to ${levels.get(parent).title}`);
          } else {
            back.setAttribute('aria-hidden', 'true');
            back.removeAttribute('aria-label');
          }
        }
        levels.get(up ? from : to).branch?.setAttribute('aria-expanded', String(!up));

        if (heading) {
          const name = document.createElement('span');
          name.textContent = title;
          const old = [...heading.children];
          heading.append(name);
          if (quick) old.forEach((el) => el.remove());
          else {
            old.forEach((el) => {
              const transform = getComputedStyle(el).transform;
              el.animate([{ transform: transform === 'none' ? 'translateY(0%)' : transform }, { transform: `translateY(${-110 * dir}%)` }], { duration: 560, easing: RISE, fill: 'forwards' })
                .finished.then(() => el.remove(), () => {});
            });
            // Same pace as the one leaving: the two names roll together, one above the other
            name.animate([{ transform: `translateY(${110 * dir}%)` }, { transform: 'translateY(0%)' }], { duration: 560, easing: RISE });
          }
        }

        if (quick) {
          from.hidden = true;
          slides.forEach((animation) => animation.cancel());
          slides.clear();
        } else {
          // A row is gone (faded by halfway) before the new one takes its place: they never share it
          const out = [...from.children].map((li, i) => slide(li, [{ opacity: 1, transform: 'translateX(0px)', easing: SWING }, { opacity: 0, offset: 0.55 }, { opacity: 0, transform: `translateX(${-48 * dir}px)` }], { duration: 240, delay: i * 20, fill: 'forwards' }));
          [...to.children].forEach((li, i) => slide(li, [{ opacity: 0, transform: `translateX(${56 * dir}px)` }, { opacity: 1, transform: 'translateX(0px)' }], { duration: 560, delay: 170 + i * 40, easing: RISE, fill: 'backwards' }));
          Promise.all(out.map((animation) => animation.finished)).then(() => {
            if (level === from) return;
            from.hidden = true;
            [...from.children].forEach((li) => {
              slides.get(li)?.cancel();
              slides.delete(li);
            });
          }, () => {});
        }
        nav.scrollTo({ top: 0, behavior: quick ? 'auto' : 'smooth' });

        // From the keyboard the focus follows: the first row down there, or the row you came from
        const target = keyboard ? (up ? levels.get(from).branch : to.querySelector(':scope > li > .kodza-multi-level__link')) : panel;
        target?.focus({ preventScroll: true });
      };

      opens.forEach((list, branch) => branch.addEventListener('click', (event) => go(list, event.detail === 0), { signal }));
      back?.addEventListener('click', (event) => go(levels.get(level).parent, event.detail === 0, true), { signal });

      const key = (event) => {
        const branch = event.target.closest?.('.kodza-multi-level__branch');
        const up = levels.get(level).parent;
        if (event.key === 'ArrowRight' && branch) go(opens.get(branch), true);
        else if ((event.key === 'ArrowLeft' || event.key === 'Escape') && up) go(up, true, true);
        else return false;
        event.preventDefault();
        return true;
      };

      const entry = () => top.querySelector(':scope > li > .kodza-multi-level__link.is-current') || top.querySelector(':scope > li > .kodza-multi-level__link');

      // The drawer opens on the button's side, and Close lands right where Menu was
      const ready = () => {
        const t = toggle.getBoundingClientRect();
        const left = root.dataset.side ? root.dataset.side === 'left' : t.left + t.width / 2 < document.documentElement.clientWidth / 2;
        panel.classList.toggle('is-left', left);
        bar.removeAttribute('style');
        const s = sheet.getBoundingClientRect();
        const k = sheet.offsetWidth ? s.width / sheet.offsetWidth : 1;
        const dy = (t.top - s.top) / k;
        const dx = left ? (t.left - s.left) / k : (s.right - t.right) / k;
        if (dy >= 0 && dy <= 96 && dx >= 0 && dx <= sheet.offsetWidth / 3) {
          bar.style.paddingTop = `${dy}px`;
          bar.style[left ? 'paddingLeft' : 'paddingRight'] = `${dx}px`;
        }
      };

      const reset = () => {
        slides.forEach((animation) => animation.cancel());
        slides.clear();
        leaving.forEach((animation) => animation.cancel());
        leaving = [];
        levels.forEach((info, list) => {
          list.hidden = list !== top;
          list.inert = list !== top;
          info.branch?.setAttribute('aria-expanded', 'false');
        });
        level = top;
        if (first) {
          first.getAnimations().forEach((animation) => animation.cancel());
          heading.replaceChildren(first);
        }
        if (back) {
          back.disabled = true;
          back.setAttribute('aria-hidden', 'true');
          back.removeAttribute('aria-label');
          back.classList.remove('is-deep');
        }
        bar.removeAttribute('style');
        panel.classList.remove('is-left');
        nav.scrollTop = 0;
      };
      return { build, ready, entry, key, reset };
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
