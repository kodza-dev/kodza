// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Trapdoor Menu
// The page marked with data-trapdoor-page tips back on its bottom edge like a trapdoor and shows
// the menu underneath. Each link rises from its mask as the edge uncovers it, the image follows
// the link you point at, and closing plays the same timeline backwards, from wherever it is.
// The page only carries a transform while the menu is open: its fixed elements (a theme's
// header) ride along with it, and everything is put back once it is down again.
(() => {
  // The two lines that change from one menu of the family to the next
  const NAME = 'trapdoor';
  const VARS = ['bg', 'fg', 'muted', 'line', 'top', 'side', 'size'];

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

  // One instance: the trapdoor itself. Everything it starts is tied to `signal`, so
  // kodza:destroy stops it all
  function mount(root, signal) {
    menu(root, signal, (m) => {
      const { panel, links, one, all, css } = m;
      const cross = one('.kodza-trapdoor__cross');
      const stage = one('.kodza-trapdoor__stage');
      const nav = one('.kodza-trapdoor__nav');
      const media = one('.kodza-trapdoor__media');
      const figure = one('.kodza-trapdoor__figure');
      const frame = one('.kodza-trapdoor__frame');
      const caption = one('.kodza-trapdoor__caption');
      const images = all('.kodza-trapdoor__image');
      const captions = all('.kodza-trapdoor__caption span');
      const infos = all('.kodza-trapdoor__info > *');
      let active = -1;
      let layer = 1;

      // Where the page is on screen, in its own pixels. Only the visible part tips: it is
      // clipped to the screen, the hinge is the bottom of the screen
      const measure = (page) => {
        const { r, k, top, bottom, left, right } = view(page);
        const h = Math.max(bottom - top, 1) / k;
        const depth = h * 1.5;
        const lift = h * 0.22; // the eye sits a little above the hinge
        const rad = ((parseFloat(css('angle')) || 84) * Math.PI) / 180;
        const hinge = (bottom - r.top) / k;
        return {
          k, bottom, depth, lift, rad, hinge,
          origin: `${((left + right) / 2 - r.left) / k}px ${hinge - lift}px`,
          inset: [top - r.top, r.right - right, left - r.left].map((n) => Math.max(n, 0) / k),
          // Height of screen the page still covers once tipped by `phi`
          cover: (phi) => (lift - ((lift - h * Math.cos(phi)) * depth) / (depth + h * Math.sin(phi))) * k,
        };
      };

      const pose = (g, phi, round, light) => ({
        transform: `perspective(${g.depth}px) translateY(${g.lift}px) rotateX(${phi}rad) translateY(${-g.lift}px)`,
        clipPath: `inset(${g.clip} round ${round}px)`,
        filter: `brightness(${light})`,
      });
      const swing = (g) => [pose(g, 0, 0, 1), pose(g, g.rad, 24, parseFloat(css('shade')) || 0.6)];

      // Below the hinge the page would swing towards the eye: its box ends at the hinge
      const rig = (page) => {
        const g = measure(page);
        const end = m.cut(g.hinge);
        const [top, right, left] = g.inset;
        g.clip = [top, right, Math.max(end - g.hinge, 0), left].map((n) => `${n}px`).join(' ');
        page.style.transformOrigin = g.origin;
        panel.style.setProperty('--kz-trapdoor-fold', `${Math.round(g.cover(g.rad))}px`);
        return g;
      };

      // The image beside the link it belongs to, without leaving the column
      const place = (instant) => {
        const link = links[active];
        if (!link || !figure || !media?.offsetHeight) return;
        const centre = nav.offsetTop + link.offsetTop + link.offsetHeight / 2 - media.offsetTop;
        const room = media.offsetHeight - figure.offsetHeight;
        const y = Math.max(0, Math.min(room, centre - frame.offsetHeight / 2));
        if (instant) figure.classList.add('is-placing');
        figure.style.setProperty('--kz-trapdoor-y', `${Math.round(y)}px`);
        if (instant) {
          void figure.offsetWidth;
          figure.classList.remove('is-placing');
        }
      };

      // Pointing at a link: the image slides next to it and the new picture wipes in from the
      // side it comes from, over the old one; the caption rolls the same way
      const activate = (i, instant = false) => {
        if (i === active || !links[i]) return;
        const down = i > active;
        const was = active;
        active = i;
        links.forEach((link, j) => link.classList.toggle('is-active', j === i));
        place(instant);
        const ms = instant || m.reduced ? 0 : 1;
        const image = images[i];
        if (image && image !== images[was]) {
          image.classList.add('is-shown');
          image.style.zIndex = String(++layer);
          image.animate([
            { clipPath: down ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)', scale: 1.18 },
            { clipPath: 'inset(0% 0% 0% 0%)', scale: 1 },
          ], { duration: 800 * ms, easing: SWING }).finished.then(() => {
            if (images[active] === image) images.forEach((el) => el !== image && el.classList.remove('is-shown'));
          }, () => {});
        }
        const next = captions[i];
        if (next && next !== captions[was]) {
          const from = down ? 110 : -110;
          captions[was]?.animate([{ transform: `translateY(${-from}%)` }], { duration: 600 * ms, easing: RISE, fill: 'forwards' });
          next.animate([{ transform: `translateY(${from}%)` }, { transform: 'translateY(0%)' }], { duration: 600 * ms, easing: RISE, fill: 'forwards' });
        }
      };

      // The opening: the page tips (or, without one, the panel unrolls) and each link rises as
      // the edge goes past it
      const build = (add, mode, g) => {
        if (mode === 'reduced') {
          add(panel, [{ opacity: 0 }, { opacity: 1 }], 0, 180, 'ease');
          return;
        }
        const time = (parseFloat(css('duration')) || 1.1) * 1000;
        const ease = css('ease') || 'cubic-bezier(0.76, 0, 0.24, 1)';
        // A row rises as the edge of the page goes past it (flat: once the panel is down)
        let uncover = (i) => 260 + i * 70;
        if (mode === 'page') {
          add(m.page, swing(g), 0, time, ease);
          const samples = curve(ease);
          const rows = links.map((link) => link.getBoundingClientRect().bottom);
          uncover = (i) => (samples.find(([, p]) => g.bottom - g.cover(g.rad * p) >= rows[i]) || [1])[0] * time;
        } else {
          add(panel, [{ clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)' }], 0, 700, SWING);
        }
        add(stage, [{ scale: 0.96 }, { scale: 1 }], 0, time, ease);
        add(cross, [{ transform: 'translateY(0px) rotate(0deg)' }, { transform: 'translateY(3.25px) rotate(45deg)' }], 200, 600, RISE, { pseudoElement: '::before' });
        add(cross, [{ transform: 'translateY(0px) rotate(0deg)' }, { transform: 'translateY(-3.25px) rotate(-45deg)' }], 200, 600, RISE, { pseudoElement: '::after' });
        let at = 50;
        links.forEach((link, i) => {
          at = Math.max(at + 70, uncover(i) - 160);
          add(link, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], at - 60, 900, SWING, { pseudoElement: '::before' });
          add(link.querySelector('.kodza-trapdoor__word'), [{ transform: 'translateY(140%)' }, { transform: 'translateY(0%)' }], at, 950);
          link.querySelectorAll('.kodza-trapdoor__index, .kodza-trapdoor__meta').forEach((small) => {
            add(small, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0px)' }], at + 220, 600);
          });
        });
        add(frame, [{ clipPath: 'inset(100% 0% 0% 0%)', scale: 1.08 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1 }], at + 60, 900);
        add(caption, [{ opacity: 0 }, { opacity: 1 }], at + 560, 500, 'ease');
        infos.forEach((info, i) => {
          add(info, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0px)' }], at + 220 + i * 70, 650);
        });
      };

      links.forEach((link, i) => {
        link.addEventListener('pointerenter', (event) => event.pointerType !== 'touch' && activate(i), { signal });
        link.addEventListener('focus', () => activate(i), { signal });
      });

      return {
        page: 'under',
        rig,
        frames: swing,
        build,
        // It opens on the current link, or the first
        ready: () => activate(Math.max(links.findIndex((link) => link.getAttribute('aria-current')), 0), true),
        entry: () => links[active],
        resize: () => place(true),
        reset: () => {
          images.forEach((image) => {
            image.classList.remove('is-shown');
            image.style.removeProperty('z-index');
            if (!image.getAttribute('style')) image.removeAttribute('style');
          });
          links.forEach((link) => link.classList.remove('is-active'));
          figure?.style.removeProperty('--kz-trapdoor-y');
          if (figure && !figure.getAttribute('style')) figure.removeAttribute('style');
          active = -1;
        },
      };
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
