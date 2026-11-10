// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Journal List
// The latest post, then the others in rows. Pointing at a row, or tabbing to it, inks it and opens
// its picture in a frame that follows the pointer. Picking a category in the pill folds away the
// rows that leave, slides the others to their new place and raises the newcomers from below.
// Settings: the --kz-journal-list-* variables (component.css); data-category on each post,
// data-image on each row, data-filter on each category; data-text-count, data-text-one and
// data-text-status on the section for the words the script writes; the timings just below.
(() => {
  const SELECTOR = '[data-kodza-journal-list]';
  const ROW = '.kodza-journal-list__row';
  const ITEM = '.kodza-journal-list__item';
  const FILTER = '.kodza-journal-list__filter';
  // The words the script writes, each one replaced by its data-text-* attribute on the section
  const WORDS = {
    count: '{count} posts', // beside the categories
    one: '1 post',
    status: '{category}: {posts}', // read out by screen readers after a category is picked
  };
  // Filtering, in ms (times the site's pace)
  const LEAVE = 380; // a row that leaves folds away
  const SLIDE = 650; // the rows that stay slide to their new place, the list to its new height
  const ENTER = 600; // a newcomer rises from below
  const ENTER_DELAY = 200; // once the others have started to move
  const ROOM = 420; // instead, when rows that stay move down to make room: newcomers wait for it
  const STAGGER = 60; // between two newcomers
  // The picture
  const FOLLOW = 0.16; // how much of the way the frame catches up each frame
  const SWING = 0.07; // degrees of tilt per pixel it lags behind
  const SHUT = 120; // ms off the rows before it closes (a wait, not motion: the pace leaves it)
  const wipe = { duration: 700, easing: 'cubic-bezier(0.33, 1, 0.68, 1)' }; // one picture to the next

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const big = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  // Where an element is right now, even mid-animation, to start its next move from there
  const now = (el) => getComputedStyle(el).transform;
  const make = (tag, className) => Object.assign(document.createElement(tag), { className });
  const ready = (img) => (img.complete ? Promise.resolve() : img.decode().catch(() => {}));

  // Old text up, new text from below (or the other way round when the number goes down)
  const roll = (el, text, dir, pace) => {
    const old = el.lastElementChild;
    if (old?.textContent === text) return;
    const next = Object.assign(document.createElement('span'), { textContent: text });
    el.append(next);
    if (!old) return;
    if (!dir || reduceMotion || !pace) return [...el.children].slice(0, -1).forEach((child) => child.remove());
    const timing = { duration: 520 * pace, easing: ease };
    const from = now(old);
    old.getAnimations().forEach((a) => a.cancel());
    old.animate([{ transform: from }, { transform: `translateY(${-110 * dir}%)` }], { ...timing, fill: 'forwards' })
      .finished.then(() => old.remove(), () => {});
    next.animate([{ transform: `translateY(${110 * dir}%)` }, { transform: 'none' }], timing);
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const fill = (words, values) => words.replace(/\{(\w+)\}/g, (all, key) => (key in values ? values[key] : all));
    const posts = (n) => (n === 1 ? word('one') : fill(word('count'), { count: n }));

    const stage = root.querySelector('.kodza-journal-list__list');
    const ul = root.querySelector('.kodza-journal-list__items');
    const items = ul ? [...ul.querySelectorAll(ITEM)] : [];
    const picture = stage ? preview(root, stage, signal, pace, still) : { hide() {}, watch() {}, pause() {} };

    const bar = root.querySelector('.kodza-journal-list__filters');
    const buttons = bar ? [...bar.querySelectorAll(FILTER)] : [];
    if (!ul || !buttons.length) return;

    // The pill, behind the labels, and a copy of the labels in the pill's colour, cut to it
    const indicator = make('span', 'kodza-journal-list__indicator');
    indicator.setAttribute('aria-hidden', 'true');
    const mirror = make('span', 'kodza-journal-list__mirror');
    mirror.setAttribute('aria-hidden', 'true');
    buttons.forEach((button) => mirror.append(Object.assign(make('span', 'kodza-journal-list__ghost'), { textContent: button.textContent })));
    bar.prepend(indicator);
    bar.append(mirror);

    // How many posts are shown, and a line for screen readers
    const count = make('p', 'kodza-journal-list__count');
    count.setAttribute('aria-hidden', 'true');
    const status = make('p', 'kodza-journal-list__status');
    status.setAttribute('role', 'status');
    bar.parentElement.append(count, status);

    let current = Math.max(0, buttons.findIndex((button) => button.getAttribute('aria-pressed') === 'true'));
    let total = -1;
    let settle = () => {}; // ends a sort still running, at once
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === current)));

    // The pill covers the whole row (the scrolled part included) and is cut down to the chosen one
    const place = (button, scroll = false) => {
      bar.style.removeProperty('--kz-journal-list-strip');
      const strip = bar.scrollWidth;
      bar.classList.toggle('is-scroll', strip > bar.clientWidth + 1);
      bar.style.setProperty('--kz-journal-list-strip', `${strip}px`);
      bar.style.setProperty('--kz-journal-list-l', `${button.offsetLeft}px`);
      bar.style.setProperty('--kz-journal-list-r', `${strip - button.offsetLeft - button.offsetWidth}px`);
      if (scroll && bar.classList.contains('is-scroll')) {
        const left = button.offsetLeft - (bar.clientWidth - button.offsetWidth) / 2;
        bar.scrollTo({ left, behavior: still ? 'auto' : 'smooth' });
      }
      edges();
    };
    // A row that scrolls fades out on the side that has more categories: the cut says "swipe"
    const edges = () => {
      const end = bar.scrollWidth - bar.clientWidth;
      const scrolls = bar.classList.contains('is-scroll');
      bar.classList.toggle('has-before', scrolls && bar.scrollLeft > 1);
      bar.classList.toggle('has-after', scrolls && bar.scrollLeft < end - 1);
    };
    bar.addEventListener('scroll', edges, { signal, passive: true });

    const matches = (li, filter) => filter === 'all' || (li.dataset.category || '').split(/\s+/).includes(filter);

    const apply = (filter, label, animate) => {
      // Where every row is right now, even mid-sort, so a second pick starts from there
      const box = ul.getBoundingClientRect();
      const k = box.width / ul.offsetWidth || 1;
      const shown = items.filter((li) => !li.hidden && !li.classList.contains('is-out'));
      const before = new Map(shown.map((li) => [li, (li.getBoundingClientRect().top - box.top) / k]));
      const from = box.height / k;
      settle();
      picture.pause(true);
      const on = (li) => matches(li, filter);
      const stay = shown.filter(on);
      const leave = shown.filter((li) => !on(li));
      const enter = items.filter((li) => li.hidden && on(li));
      const n = items.filter(on).length;
      roll(count, posts(n), animate && total >= 0 ? Math.sign(n - total) : 0, pace);
      total = n;
      if (animate) status.textContent = fill(word('status'), { category: label, posts: posts(n) });
      const finish = () => {
        picture.pause(false);
        picture.watch();
      };
      if (!animate || still) {
        items.forEach((li) => { li.hidden = !on(li); });
        return finish();
      }

      // Leaving: out of the flow, where it was. Entering: in the flow, hidden until its turn
      leave.forEach((li) => {
        li.style.top = `${before.get(li)}px`;
        li.classList.add('is-out');
      });
      enter.forEach((li) => { li.hidden = false; });
      const to = ul.offsetHeight;
      const moves = [];
      let room = false;
      stay.forEach((li) => {
        const dy = before.get(li) - li.offsetTop;
        if (Math.abs(dy) < 0.5) return;
        if (dy < 0) room = true;
        moves.push(li.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: SLIDE * pace, easing: big }));
      });
      leave.forEach((li) => moves.push(li.animate([
        { clipPath: 'inset(0 0 0 0)', transform: 'none' },
        { clipPath: 'inset(0 0 100% 0)', transform: 'translateY(-8px)' },
      ], { duration: LEAVE * pace, easing: big, fill: 'forwards' })));
      enter.forEach((li, i) => moves.push(li.animate([
        { clipPath: 'inset(100% 0 0 0)', transform: 'translateY(12px)' },
        { clipPath: 'inset(0 0 0 0)', transform: 'none' },
      ], { duration: ENTER * pace, delay: ((room ? ROOM : ENTER_DELAY) + i * STAGGER) * pace, easing: ease, fill: 'backwards' })));
      // The list takes its new height in the same move: what follows it never jumps
      if (Math.abs(to - from) > 0.5) {
        ul.style.overflowY = 'clip';
        moves.push(ul.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: SLIDE * pace, easing: big }));
      }

      const done = () => {
        settle = () => {};
        leave.forEach((li) => {
          li.hidden = true;
          li.classList.remove('is-out');
          li.style.removeProperty('top');
        });
        moves.forEach((move) => move.cancel());
        ul.style.removeProperty('overflow-y');
        finish();
      };
      settle = done;
      Promise.all(moves.map((move) => move.finished)).then(() => settle === done && done(), () => {});
    };

    const select = (index) => {
      if (index === current) return;
      current = index;
      buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
      place(buttons[index], true);
      apply(buttons[index].dataset.filter || 'all', buttons[index].textContent.trim(), true);
    };

    buttons.forEach((button, i) => button.addEventListener('click', () => select(i), { signal }));
    apply(buttons[current].dataset.filter || 'all', '', false);
    place(buttons[current]);
    const resize = new ResizeObserver(() => place(buttons[current]));
    resize.observe(bar);
    document.fonts?.ready.then(() => !signal.aborted && place(buttons[current]));
    // The pill only slides once it has been placed: no slide from the left edge on load
    const live = requestAnimationFrame(() => !signal.aborted && root.classList.add('is-live'));

    signal.addEventListener('abort', () => {
      settle();
      resize.disconnect();
      cancelAnimationFrame(live);
    });
  }

  // The picture beside the rows: the engine of Hover List Preview. The list is its stage: the
  // frame is placed in the list's own pixels, cut open from below, and follows the pointer with a
  // slight lag and swing. From the keyboard it opens on the row, towards its right. On touch
  // screens and in narrow columns, every row shows its own thumbnail instead.
  function preview(root, stage, signal, pace, still) {
    const rows = [...stage.querySelectorAll(ROW)].filter((row) => row.dataset.image);
    if (!rows.length) return { hide() {}, watch() {}, pause() {} };
    const wiping = { ...wipe, duration: wipe.duration * pace };

    rows.forEach((row) => {
      const thumb = make('span', 'kodza-journal-list__thumb');
      thumb.setAttribute('aria-hidden', 'true');
      // loading before src: set the other way round, every thumbnail would be fetched at once
      thumb.append(Object.assign(document.createElement('img'), { loading: 'lazy', decoding: 'async', alt: '', src: row.dataset.image }));
      row.prepend(thumb);
    });
    const frame = make('span', 'kodza-journal-list__frame');
    frame.setAttribute('aria-hidden', 'true');
    const media = make('span', 'kodza-journal-list__media');
    const reel = make('span', 'kodza-journal-list__reel');
    media.append(reel);
    frame.append(media);
    stage.append(frame);

    let current = null, shown = -1, open = false, visible = false, inline = false, paused = false;
    let pointer = null, seen = null, shut = 0, raf = 0, last = 0, x = 0, y = 0, tx = 0, ty = 0, tilt = 0;
    // A row the filter keeps: one folding away or hidden opens nothing
    const live = (row) => {
      const item = row.closest(ITEM);
      return rows.includes(row) && !(item && (item.hidden || item.classList.contains('is-out')));
    };
    const at = ({ clientX, clientY }) => ({ clientX, clientY });

    // The glass behind the words that cross the picture: the background behind the section
    const tint = () => {
      let glass = getComputedStyle(root).getPropertyValue('--kz-journal-list-glass').trim();
      if (!glass || glass === 'auto') {
        let color = '#ffffff';
        for (let el = root; el; el = el.parentElement) {
          const bg = getComputedStyle(el).backgroundColor;
          if (bg && bg !== 'transparent' && !/^rgba\(.*,\s*0\)$/.test(bg)) { color = bg; break; }
        }
        glass = `color-mix(in srgb, ${color} 60%, transparent)`;
      }
      root.style.setProperty('--kz-journal-list-tint', glass);
    };

    // The pictures of the rows in view are fetched ahead: the frame never opens on a blank
    const warmed = new WeakSet();
    const warm = new IntersectionObserver((entries) => {
      if (inline) return;
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        warm.unobserve(entry.target);
        warmed.add(entry.target);
        new Image().src = entry.target.dataset.image;
      });
    }, { rootMargin: '300px 0px' });
    const watch = () => rows.forEach((row) => {
      if (warmed.has(row)) return;
      warm.unobserve(row);
      warm.observe(row);
    });

    // The next picture wipes in over the last one, from below going down the list, from above going up
    const swap = (index, dir) => {
      const src = rows[index].dataset.image;
      const slide = make('span', 'kodza-journal-list__slide');
      const img = Object.assign(document.createElement('img'), { src, alt: '', decoding: 'async' });
      slide.append(img);
      const below = [...reel.children];
      reel.append(slide);
      shown = index;
      const clear = () => below.forEach((el) => el.remove());
      if (still || (!dir && (img.complete || !visible))) return clear();
      const side = dir || 1;
      const hidden = side > 0 ? 'inset(100% 0 0 0)' : 'inset(0 0 100% 0)';
      slide.style.clipPath = hidden;
      ready(img).then(() => {
        if (signal.aborted || !slide.isConnected) return;
        slide.style.clipPath = '';
        slide.animate([{ clipPath: hidden }, { clipPath: 'inset(0 0 0 0)' }], wiping).finished.then(clear, () => {});
        img.animate([{ transform: `translateY(${28 * side}%) scale(1.12)` }, { transform: 'none' }], wiping);
        below.forEach((el) => {
          const pic = el.firstElementChild;
          const from = now(pic);
          pic.getAnimations().forEach((a) => a.cancel());
          pic.animate([{ transform: from }, { transform: `translateY(${-18 * side}%)` }], { ...wiping, fill: 'forwards' });
        });
      });
    };

    // Screen pixels to the list's own: a parent scaled by transform must not shift the frame
    const measure = () => {
      const box = stage.getBoundingClientRect();
      return { box, k: box.width / stage.offsetWidth || 1 };
    };
    const aim = (cx, cy) => {
      const w = frame.offsetWidth, h = frame.offsetHeight, W = stage.offsetWidth, H = stage.offsetHeight;
      tx = clamp(cx - w / 2, 0, Math.max(0, W - w));
      ty = H > h ? clamp(cy - h / 2, 0, H - h) : (H - h) / 2;
    };
    const aimAtPointer = ({ clientX, clientY }) => {
      const { box, k } = measure();
      aim((clientX - box.left) / k, (clientY - box.top) / k);
    };
    // From the keyboard: on the row, towards its right
    const aimAtRow = (row) => {
      const { box, k } = measure();
      const r = row.getBoundingClientRect();
      aim(stage.offsetWidth * 0.62, (r.top + r.height / 2 - box.top) / k);
    };
    const paint = () => {
      frame.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${tilt.toFixed(2)}deg)`;
    };
    const glide = (time) => {
      if (signal.aborted) return;
      const dt = last ? Math.min(64, time - last) : 16.7;
      last = time;
      // Its lag lasts as long as the site's pace says
      const f = still ? 1 : 1 - (1 - FOLLOW) ** (dt / (16.7 * pace));
      x += (tx - x) * f;
      y += (ty - y) * f;
      // A slight swing, from how far it lags behind
      tilt += ((still ? 0 : clamp((tx - x) * SWING, -7, 7)) - tilt) * f;
      const moving = Math.abs(tx - x) + Math.abs(ty - y) + Math.abs(tilt) > 0.2;
      if (!moving) { x = tx; y = ty; tilt = 0; last = 0; }
      paint();
      raf = moving ? requestAnimationFrame(glide) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(glide); };
    // Open once its picture is ready: never an empty frame
    const reveal = () => {
      if (signal.aborted || !open || visible) return;
      visible = true;
      frame.classList.remove('is-leaving');
      frame.classList.add('is-open');
    };

    const show = (row, pointed) => {
      clearTimeout(shut);
      if (!stage.classList.contains('is-active')) tint();
      pointer = pointed || null;
      const index = rows.indexOf(row);
      if (row !== current) {
        current?.classList.remove('is-current');
        row.classList.add('is-current');
        current = row;
      }
      stage.classList.add('is-active');
      if (index !== shown) swap(index, visible ? Math.sign(index - shown) : 0);
      if (pointed) aimAtPointer(pointed);
      else aimAtRow(row);
      // Opening: right where it is wanted, no slide from where it last was
      if (!visible) { x = tx; y = ty; tilt = 0; paint(); }
      kick();
      if (open) return;
      open = true;
      if (visible) {
        // Caught while closing: it simply opens again from there
        frame.classList.remove('is-leaving');
        frame.classList.add('is-open');
      } else ready(reel.lastElementChild.firstElementChild).then(reveal);
    };
    const hide = () => {
      clearTimeout(shut);
      pointer = null;
      stage.classList.remove('is-active');
      current?.classList.remove('is-current');
      current = null;
      if (!open) return;
      open = false;
      if (!visible) return;
      frame.classList.remove('is-open');
      // Still, it closes at once: no transition, so no transitionend to wait for
      if (still) { visible = false; return; }
      frame.classList.add('is-leaving');
    };
    const hideSoon = () => {
      clearTimeout(shut);
      shut = setTimeout(hide, SHUT);
    };
    // What is under the pointer now (the list moved under it: a scroll, a filter)
    const under = (pointed) => {
      const row = document.elementFromPoint(pointed.clientX, pointed.clientY)?.closest(ROW);
      if (row && live(row)) show(row, pointed);
      else hide();
    };
    media.addEventListener('transitionend', (event) => {
      if (event.target !== media || open) return;
      frame.classList.remove('is-leaving');
      visible = false;
    }, { signal });

    // Thumbnails or frame: no frame without a pointer to follow, or without the room for it
    const layout = () => {
      const limit = parseFloat(getComputedStyle(root).getPropertyValue('--kz-journal-list-inline')) || 0;
      const next = !canHover.matches || stage.offsetWidth < limit;
      if (next === inline) return;
      inline = next;
      root.classList.toggle('is-inline', inline);
      if (!inline) return watch();
      // The frame goes away at once, ready to open again from scratch
      hide();
      frame.classList.remove('is-leaving');
      visible = false;
    };
    layout();
    tint();
    const resize = new ResizeObserver(layout);
    resize.observe(stage);
    canHover.addEventListener('change', layout, { signal });
    watch();

    stage.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      seen = at(event);
      if (inline || paused) return;
      const row = event.target.closest(ROW);
      if (row && live(row)) show(row, seen);
      else if (stage.classList.contains('is-active')) hideSoon();
    }, { signal });
    stage.addEventListener('pointerleave', (event) => {
      if (event.pointerType === 'touch') return;
      seen = null;
      hide();
    }, { signal });
    // Scrolling moves the list under a still pointer: follow what is under it now
    document.addEventListener('scroll', () => {
      if (pointer && !paused) under(pointer);
    }, { signal, capture: true, passive: true });
    stage.addEventListener('focusin', (event) => {
      if (inline || paused || !event.target.matches('.kodza-journal-list__link:focus-visible')) return;
      const row = event.target.closest(ROW);
      if (row && live(row)) show(row);
    }, { signal });
    stage.addEventListener('focusout', (event) => {
      if (!stage.contains(event.relatedTarget)) hide();
    }, { signal });
    stage.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && stage.classList.contains('is-active')) hide();
    }, { signal });

    signal.addEventListener('abort', () => {
      resize.disconnect();
      warm.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(shut);
    });

    // While the rows sort themselves the picture stays shut, then opens on what is under the pointer
    const pause = (on) => {
      paused = on;
      if (on) return hide();
      if (seen && !inline) under(seen);
    };
    return { hide, watch, pause };
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
