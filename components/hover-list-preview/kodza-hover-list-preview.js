// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Hover List Preview
// One frame per list. It opens on the row under the pointer (or the keyboard focus) once its
// picture is ready, follows the pointer with a little lag and a swing, and swaps pictures with
// a wipe from the side you are heading to (the current row's words sit on frosted glass where
// they cross it). --panel: the frame stays beside the list and
// keeps the last picture. On touch screens and in narrow columns it steps aside: every row
// shows its own thumbnail. Positions are measured in the list's own pixels, so a scaled parent
// does not shift them. Group headings can sit between the rows (a letter, a year): the frame
// ignores them. Pictures are fetched row by row as they come near the screen, so a long list
// never loads what nobody scrolls to.
(() => {
  const SELECTOR = '.kodza-hover-list';
  const ROW = '.kodza-hover-list__row';
  const GROUP = '.kodza-hover-list__group';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const wipe = { duration: 700, easing: 'cubic-bezier(0.33, 1, 0.68, 1)' };
  const FOLLOW = 0.16; // how much of the way the frame catches up each frame
  const SWING = 0.07; // degrees of tilt per pixel it lags behind
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  // Where an element is right now, even mid-animation, to start its next move from there
  const now = (el) => getComputedStyle(el).transform;
  const pad = (n) => String(n).padStart(2, '0');
  const make = (tag, className) => Object.assign(document.createElement(tag), { className });
  const ready = (img) => (img.complete ? Promise.resolve() : img.decode().catch(() => {}));

  // Old text up, new text from below (or the other way round when going up the list)
  const roll = (el, text, dir) => {
    const old = el.lastElementChild;
    if (old?.textContent === text) return;
    const next = Object.assign(document.createElement('span'), { textContent: text });
    el.append(next);
    if (!old) return;
    if (!dir || reduceMotion) return [...el.children].slice(0, -1).forEach((child) => child.remove());
    const timing = { duration: 520, easing: ease };
    const from = now(old);
    old.getAnimations().forEach((a) => a.cancel());
    old.animate([{ transform: from }, { transform: `translateY(${-110 * dir}%)` }], { ...timing, fill: 'forwards' })
      .finished.then(() => old.remove(), () => {});
    next.animate([{ transform: `translateY(${110 * dir}%)` }, { transform: 'none' }], timing);
  };

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const rows = [...root.querySelectorAll(ROW)].filter((row) => row.dataset.image);
    if (!rows.length) return;
    const panel = root.classList.contains('kodza-hover-list--panel');

    // A thumbnail in each row, shown on touch screens and in narrow columns (and only then loaded)
    rows.forEach((row) => {
      const thumb = make('span', 'kodza-hover-list__thumb');
      thumb.setAttribute('aria-hidden', 'true');
      // loading before src: set the other way round, every thumbnail would be fetched at once
      thumb.append(Object.assign(document.createElement('img'), { loading: 'lazy', decoding: 'async', alt: '', src: row.dataset.image }));
      row.prepend(thumb);
    });

    // The frame, one per list
    const frame = make('span', 'kodza-hover-list__frame');
    frame.setAttribute('aria-hidden', 'true');
    const media = make('span', 'kodza-hover-list__media');
    const reel = make('span', 'kodza-hover-list__reel');
    media.append(reel);
    frame.append(media);
    let count = null;
    if (panel) {
      const caption = make('span', 'kodza-hover-list__caption');
      count = make('span', 'kodza-hover-list__count');
      caption.append(count, Object.assign(make('span', 'kodza-hover-list__total'), { textContent: `/ ${pad(rows.length)}` }));
      media.append(caption);
    }
    root.append(frame);

    let current = null; // the row pointed at
    let shown = -1; // the row whose picture is in the frame
    let open = false; // wanted open
    let visible = false; // on screen: open, or still closing
    let inline = false;
    let pointer = null; // the last pointer position, while the pointer drives the frame
    let shut = 0;
    let raf = 0;
    let last = 0;
    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    let tilt = 0;

    // The glass behind the words: the colour you set, or (auto) the background behind the list
    const tint = () => {
      let glass = getComputedStyle(root).getPropertyValue('--kz-hover-list-glass').trim();
      if (!glass || glass === 'auto') {
        let color = '#ffffff';
        for (let el = root; el; el = el.parentElement) {
          const bg = getComputedStyle(el).backgroundColor;
          if (bg && bg !== 'transparent' && !/^rgba\(.*,\s*0\)$/.test(bg)) {
            color = bg;
            break;
          }
        }
        glass = `color-mix(in srgb, ${color} 60%, transparent)`;
      }
      root.style.setProperty('--kz-hover-list-tint', glass);
    };

    // Each picture is fetched as its row comes near the screen, so the next one is ready when
    // the pointer gets there (thumbnails load on their own, lazily)
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
    // Observing again reports where each row is now: back from thumbnails, the nearby rows load
    const watch = () => rows.forEach((row) => {
      if (warmed.has(row)) return;
      warm.unobserve(row);
      warm.observe(row);
    });

    // A new picture on top, wiped in from the side we are heading to; the old one is pushed away
    const swap = (index, dir) => {
      const slide = make('span', 'kodza-hover-list__slide');
      const img = Object.assign(document.createElement('img'), { src: rows[index].dataset.image, alt: '', decoding: 'async' });
      slide.append(img);
      const below = [...reel.children];
      reel.append(slide);
      shown = index;
      if (count) roll(count, pad(index + 1), dir);
      const clear = () => below.forEach((el) => el.remove());
      // Out of sight (the frame opens around it), or no motion wanted: no wipe
      if (reduceMotion || (!dir && (img.complete || !visible))) return clear();
      const side = dir || 1;
      const hidden = side > 0 ? 'inset(100% 0 0 0)' : 'inset(0 0 100% 0)';
      slide.style.clipPath = hidden;
      // Never wipe in a picture that is not there yet
      ready(img).then(() => {
        if (signal.aborted || !slide.isConnected) return;
        slide.style.clipPath = '';
        slide.animate([{ clipPath: hidden }, { clipPath: 'inset(0 0 0 0)' }], wipe).finished.then(clear, () => {});
        img.animate([{ transform: `translateY(${28 * side}%) scale(1.12)` }, { transform: 'none' }], wipe);
        below.forEach((el) => {
          const pic = el.firstElementChild;
          const from = now(pic);
          pic.getAnimations().forEach((a) => a.cancel());
          pic.animate([{ transform: from }, { transform: `translateY(${-18 * side}%)` }], { ...wipe, fill: 'forwards' });
        });
      });
    };

    // Measured in the list's own pixels: a parent scaled by a transform does not shift anything
    const measure = () => {
      const box = root.getBoundingClientRect();
      return { box, k: box.width / root.offsetWidth || 1 };
    };
    // The frame's corner, centred on a point and kept inside the list
    const aim = (cx, cy) => {
      const w = frame.offsetWidth;
      const h = frame.offsetHeight;
      const W = root.offsetWidth;
      const H = root.offsetHeight;
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
      aim(root.offsetWidth * 0.62, (r.top + r.height / 2 - box.top) / k);
    };

    const paint = () => {
      frame.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${tilt.toFixed(2)}deg)`;
    };
    const glide = (time) => {
      if (signal.aborted) return;
      const dt = last ? Math.min(64, time - last) : 16.7;
      last = time;
      const f = reduceMotion ? 1 : 1 - (1 - FOLLOW) ** (dt / 16.7);
      x += (tx - x) * f;
      y += (ty - y) * f;
      // A slight swing, from how far it lags behind
      tilt += ((reduceMotion ? 0 : clamp((tx - x) * SWING, -7, 7)) - tilt) * f;
      const moving = Math.abs(tx - x) + Math.abs(ty - y) + Math.abs(tilt) > 0.2;
      if (!moving) {
        x = tx;
        y = ty;
        tilt = 0;
        last = 0;
      }
      paint();
      raf = moving ? requestAnimationFrame(glide) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(glide);
    };

    // Open once its picture is ready: never an empty frame
    const reveal = () => {
      if (signal.aborted || !open || visible) return;
      visible = true;
      frame.classList.remove('is-leaving');
      frame.classList.add('is-open');
    };

    const show = (row, at) => {
      clearTimeout(shut);
      if (!root.classList.contains('is-active')) tint();
      pointer = at || null;
      const index = rows.indexOf(row);
      if (row !== current) {
        current?.classList.remove('is-current');
        row.classList.add('is-current');
        current = row;
      }
      root.classList.add('is-active');
      if (index !== shown) swap(index, visible ? Math.sign(index - shown) : 0);
      if (panel) return;
      if (at) aimAtPointer(at);
      else aimAtRow(row);
      // Opening: right where it is wanted, no slide from where it last was
      if (!visible) {
        x = tx;
        y = ty;
        tilt = 0;
        paint();
      }
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
      root.classList.remove('is-active');
      if (panel) return;
      current?.classList.remove('is-current');
      current = null;
      if (!open) return;
      open = false;
      if (!visible) return;
      frame.classList.remove('is-open');
      frame.classList.add('is-leaving');
    };
    const hideSoon = () => {
      clearTimeout(shut);
      shut = setTimeout(hide, 120);
    };
    media.addEventListener('transitionend', (event) => {
      if (event.target !== media || open) return;
      frame.classList.remove('is-leaving');
      visible = false;
    }, { signal });

    // Thumbnails or frame: no frame without a pointer to follow, or without the room for it
    const layout = () => {
      const limit = parseFloat(getComputedStyle(root).getPropertyValue('--kz-hover-list-inline')) || 0;
      const next = !canHover.matches || root.offsetWidth < limit;
      if (next === inline) return;
      inline = next;
      root.classList.toggle('is-inline', inline);
      if (!inline) watch();
      if (!inline || panel) return;
      // The frame goes away at once, ready to open again from scratch
      hide();
      frame.classList.remove('is-leaving');
      visible = false;
    };
    layout();
    tint();
    const resize = new ResizeObserver(layout);
    resize.observe(root);
    canHover.addEventListener('change', layout, { signal });

    // --panel: open from the start, on the first row
    if (panel) {
      open = true;
      visible = true;
      frame.classList.add('is-open');
      rows[0].classList.add('is-current');
      current = rows[0];
      swap(0, 0);
    }

    watch();

    root.addEventListener('pointermove', (event) => {
      if (inline || event.pointerType === 'touch') return;
      // Crossing a group heading: the frame stays on the row it shows
      if (event.target.closest(GROUP)) return;
      const row = event.target.closest(ROW);
      if (row && rows.includes(row)) show(row, event);
      else if (root.classList.contains('is-active')) hideSoon();
    }, { signal });
    root.addEventListener('pointerleave', (event) => {
      if (event.pointerType !== 'touch') hide();
    }, { signal });
    // Scrolling moves the list under a still pointer: follow what is under it now
    document.addEventListener('scroll', () => {
      if (!pointer || panel) return;
      const { clientX, clientY } = pointer;
      const under = document.elementFromPoint(clientX, clientY);
      if (under?.closest(GROUP) && root.contains(under)) return;
      const row = under?.closest(ROW);
      if (row && rows.includes(row)) show(row, { clientX, clientY });
      else hide();
    }, { signal, capture: true, passive: true });
    root.addEventListener('focusin', (event) => {
      const row = event.target.closest(ROW);
      if (!inline && row && rows.includes(row) && row.matches(':focus-visible')) show(row);
    }, { signal });
    root.addEventListener('focusout', (event) => {
      if (!root.contains(event.relatedTarget)) hide();
    }, { signal });
    root.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && root.classList.contains('is-active')) hide();
    }, { signal });

    signal.addEventListener('abort', () => {
      resize.disconnect();
      warm.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(shut);
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
