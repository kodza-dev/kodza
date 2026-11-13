// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Product Gallery
// The photos of a product page. A thumbnail, an arrow key or a swipe brings another photo in from
// the side you are heading to, the old one stepping back under it. Under the mouse, the photo
// zooms towards the pointer, inside its frame (the gesture of Zoom Lens --inside). A click opens the
// photo full screen, grown from its own place (the gesture of Lightbox), and it goes back where
// the viewer was left. A colour chosen on the page (kodza:variant-change, sent by Buy Box or by
// your platform) switches to that colour's photos, at the same view, rising from below.
// Settings: the --kz-product-gallery-* variables in the CSS, data-zoom and data-text-* on the
// root, the constants below.
(() => {
  const SELECTOR = '.kodza-product-gallery';

  // Timings, in milliseconds (times the site's pace)
  const SLIDE = 720; // a photo coming in from the side
  const SWAP = 680; // a colour's photo rising over the other one
  const STAGGER = 45; // between two thumbnails, when the colour changes
  const OPEN = 620; // the photo growing to full screen
  const ROLL = 420; // a caption rolling in the viewer
  // How strong the zoom is, unless the root says data-zoom
  const ZOOM = 2.4;
  // How far a finger moves before it is a swipe, in pixels
  const SWIPE = 44;

  // What the script writes, in English unless the root says otherwise (data-text-<key>)
  const WORDS = {
    photos: 'Photos', // the group of thumbnails
    photo: 'Photo {n} of {count}', // a thumbnail or a dot, read by screen readers
    enlarge: 'Enlarge: {alt}', // the large photo, a button
    viewer: 'Photo viewer',
    previous: 'Previous photo',
    next: 'Next photo',
    close: 'Close',
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const big = 'cubic-bezier(0.76, 0, 0.24, 1)';
  const icon = (d) => `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="${d}"/></svg>`;
  const same = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const step = still ? 1 : Math.min(1, 0.22 / pace); // the lag of the zoom, a step per frame
    const words = (key, values = {}) => (root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key])
      .replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');
    const list = root.querySelector('.kodza-product-gallery__photos');
    const photos = list ? [...list.querySelectorAll('img')] : [];
    if (!photos.length) return;
    const zoom = parseFloat(root.dataset.zoom) || ZOOM;

    // The colours, in the order of the markup; a photo without data-colour belongs to all of them
    const colours = [...new Set(photos.map((img) => img.dataset.colour).filter(Boolean))];
    const setOf = (colour) => photos.filter((img) => !img.dataset.colour || !colour || same(img.dataset.colour, colour));
    let colour = colours.find((c) => same(c, root.dataset.colour || '')) || colours[0] || '';
    let set = setOf(colour);
    let index = 0;

    // The large photo
    const stage = document.createElement('div');
    stage.className = 'kodza-product-gallery__stage';
    list.replaceWith(stage);
    const open = Object.assign(document.createElement('button'), { type: 'button', className: 'kodza-product-gallery__open' });
    stage.append(list, open);
    stage.style.setProperty('--kz-product-gallery-zoom', zoom);

    // The thumbnails and the dots, one per photo of the colour
    const thumbs = document.createElement('div');
    thumbs.className = 'kodza-product-gallery__thumbs';
    thumbs.setAttribute('role', 'group');
    thumbs.setAttribute('aria-label', words('photos'));
    const ring = Object.assign(document.createElement('span'), { className: 'kodza-product-gallery__ring' });
    ring.setAttribute('aria-hidden', 'true');
    const dots = document.createElement('div');
    dots.className = 'kodza-product-gallery__dots';
    root.prepend(thumbs);
    root.append(dots);
    let thumbButtons = [];
    let dotButtons = [];
    const thumbImage = (img) => Object.assign(new Image(), { src: img.currentSrc || img.src, alt: '', decoding: 'async', width: 160, height: 200 });
    const build = () => {
      thumbs.replaceChildren(ring);
      dots.replaceChildren();
      thumbButtons = set.map((img, i) => {
        const button = Object.assign(document.createElement('button'), { type: 'button', className: 'kodza-product-gallery__thumb' });
        button.setAttribute('aria-label', words('photo', { n: i + 1, count: set.length }));
        button.append(thumbImage(img));
        button.addEventListener('click', () => show(i), { signal });
        thumbs.append(button);
        return button;
      });
      dotButtons = set.map((img, i) => {
        const button = Object.assign(document.createElement('button'), { type: 'button', className: 'kodza-product-gallery__dot' });
        button.setAttribute('aria-label', words('photo', { n: i + 1, count: set.length }));
        button.addEventListener('click', () => show(i), { signal });
        dots.append(button);
        return button;
      });
      dots.hidden = set.length < 2;
      thumbs.hidden = set.length < 2;
    };

    // The ring sits on the current thumbnail: measured in the column's own pixels
    const placeRing = () => {
      const button = thumbButtons[index];
      if (!button) return;
      ring.style.setProperty('--kz-product-gallery-ring-h', `${button.offsetHeight}px`);
      ring.style.setProperty('--kz-product-gallery-ring-y', `${button.offsetTop}px`);
    };
    const fullOf = (img) => img.dataset.full || img.currentSrc || img.src;
    const mark = () => {
      photos.forEach((img) => {
        img.hidden = !set.includes(img);
        img.classList.toggle('is-current', img === set[index]);
      });
      thumbButtons.forEach((button, i) => {
        button.setAttribute('aria-current', String(i === index));
        button.tabIndex = i === index ? 0 : -1;
      });
      dotButtons.forEach((button, i) => button.setAttribute('aria-current', String(i === index)));
      open.setAttribute('aria-label', words('enlarge', { alt: set[index].alt }));
      placeRing();
    };
    const settle = (img) => {
      img.getAnimations().forEach((animation) => animation.cancel());
      img.classList.remove('is-leaving');
    };

    // Another photo of the same colour: it comes in from the side you are heading to, the old one
    // steps back under it
    function show(next, quiet) {
      next = (next + set.length) % set.length;
      if (next === index) return;
      const dir = next > index ? 1 : -1;
      const old = set[index];
      index = next;
      photos.forEach(settle);
      mark();
      const now = set[index];
      if (still || quiet) return;
      old.classList.add('is-leaving');
      const timing = { duration: SLIDE * pace, easing: big };
      now.animate([{ transform: `translateX(${dir * 100}%)` }, { transform: 'none' }], timing);
      old.animate([{ transform: 'none', opacity: 1 }, { transform: `translateX(${-dir * 28}%)`, opacity: 0.6 }], timing)
        .finished.then(() => old.classList.remove('is-leaving'), () => {});
    }

    // Another colour: the same view of it rises over the old one, and each thumbnail follows
    const recolour = (name) => {
      const found = colours.find((c) => same(c, name));
      if (!found || same(found, colour)) return;
      const old = set[index];
      colour = found;
      set = setOf(colour);
      index = Math.min(index, set.length - 1);
      const was = thumbButtons.map((button) => button.querySelector('img'));
      photos.forEach(settle);
      if (was.length !== set.length || still) {
        build();
        mark();
        return;
      }
      mark();
      const now = set[index];
      old.hidden = false;
      old.classList.add('is-leaving');
      const run = () => {
        if (signal.aborted || set[index] !== now) return old.classList.remove('is-leaving');
        now.animate([{ clipPath: 'inset(100% 0 0 0)', transform: 'scale(1.06)' }, { clipPath: 'inset(0 0 0 0)', transform: 'none' }], { duration: SWAP * pace, easing: big });
        old.animate([{ transform: 'none' }, { transform: 'translateY(-6%)' }], { duration: SWAP * pace, easing: big })
          .finished.then(() => {
            old.classList.remove('is-leaving');
            old.hidden = !set.includes(old);
          }, () => {});
        thumbButtons.forEach((button, i) => {
          const fresh = thumbImage(set[i]);
          button.append(fresh);
          fresh.animate([{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: SWAP * pace, delay: (STAGGER * i + 60) * pace, easing: big, fill: 'backwards' })
            .finished.then(() => was[i].remove(), () => was[i].remove());
        });
      };
      // The new photo is drawn before it moves: a photo still loading would rise blank
      Promise.race([now.decode().catch(() => {}), new Promise((resolve) => setTimeout(resolve, 600))]).then(run);
    };

    build();
    mark();
    // Fonts, the photos, a narrower page: the ring follows its thumbnail
    const observer = new ResizeObserver(placeRing);
    observer.observe(thumbs);
    signal.addEventListener('abort', () => {
      observer.disconnect();
      photos.forEach(settle);
    });

    // Arrows on the large photo or the thumbnails; Home and End on the thumbnails
    const keys = (event, focusThumb) => {
      const move = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (event.key === 'Home' || event.key === 'End') {
        if (!focusThumb) return;
        event.preventDefault();
        show(event.key === 'Home' ? 0 : set.length - 1);
      } else if (move) {
        if (!focusThumb && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) return;
        event.preventDefault();
        show(index + move);
      } else return;
      if (focusThumb) thumbButtons[index].focus();
    };
    thumbs.addEventListener('keydown', (event) => keys(event, true), { signal });
    open.addEventListener('keydown', (event) => keys(event, false), { signal });

    // The colour chosen on the page. detail: { id, options: { Colour: 'Stone' } } or { colour };
    // with data-product on the root, only that product's events count
    document.addEventListener('kodza:variant-change', (event) => {
      const d = event.detail || {};
      if (root.dataset.product && d.id != null && String(d.id) !== root.dataset.product) return;
      const values = [d.colour, d.color, ...Object.values(d.options || {})].filter((v) => v != null);
      const hit = values.find((v) => colours.some((c) => same(c, v)));
      if (hit) recolour(hit);
    }, { signal });

    // The zoom, under the mouse only: a finger swipes and taps
    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    let frame = 0;
    const paint = () => {
      stage.style.setProperty('--kz-product-gallery-ox', `${(x / stage.clientWidth) * 100}%`);
      stage.style.setProperty('--kz-product-gallery-oy', `${(y / stage.clientHeight) * 100}%`);
    };
    // The sharper file, loaded the first time a photo is zoomed, then swapped in once decoded
    const sharpen = (img) => {
      const src = img.dataset.full;
      if (!src || img.dataset.sharp) return;
      img.dataset.sharp = 'true';
      const hi = new Image();
      hi.src = src;
      hi.decode().then(() => !signal.aborted && (img.src = src), () => {});
    };
    const glide = () => {
      if (signal.aborted) return;
      x += (tx - x) * step;
      y += (ty - y) * step;
      paint();
      frame = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(glide) : 0;
    };
    // Measured in the stage's own pixels: a parent scaled by transform does not shift the zoom
    const aim = (event, first) => {
      const box = stage.getBoundingClientRect();
      const k = box.width / stage.offsetWidth || 1;
      tx = Math.min(stage.clientWidth, Math.max(0, (event.clientX - box.left) / k));
      ty = Math.min(stage.clientHeight, Math.max(0, (event.clientY - box.top) / k));
      if (first) {
        x = tx;
        y = ty;
        paint();
      }
      if (!frame) frame = requestAnimationFrame(glide);
    };
    const unzoom = () => stage.classList.remove('is-zooming');
    stage.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse' || viewer.open) return;
      sharpen(set[index]);
      aim(event, true);
      stage.classList.add('is-zooming');
    }, { signal });
    stage.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse' || viewer.open) return;
      if (!stage.classList.contains('is-zooming')) {
        sharpen(set[index]);
        aim(event, true);
        stage.classList.add('is-zooming');
        return;
      }
      aim(event);
    }, { signal });
    stage.addEventListener('pointerleave', unzoom, { signal });
    signal.addEventListener('abort', () => cancelAnimationFrame(frame));

    // A swipe on the large photo: sideways for the next one. The click that follows is not a tap
    let start = null;
    let swiped = false;
    stage.addEventListener('pointerdown', (event) => {
      swiped = false;
      start = event.pointerType === 'mouse' ? null : { x: event.clientX, y: event.clientY };
    }, { signal });
    stage.addEventListener('pointerup', (event) => {
      if (!start) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      start = null;
      if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy)) {
        swiped = true;
        show(index + (dx < 0 ? 1 : -1));
      }
    }, { signal });
    stage.addEventListener('pointercancel', () => (start = null), { signal });

    // The full-screen viewer: the gesture of Lightbox, on the photos of the current colour
    const viewer = document.createElement('dialog');
    viewer.className = 'kodza-product-gallery__viewer';
    viewer.setAttribute('aria-label', words('viewer'));
    viewer.innerHTML = `<div class="kodza-product-gallery__shade"></div>
      <div class="kodza-product-gallery__bar">
        <p class="kodza-product-gallery__caption" aria-live="polite"><span></span></p>
        <div class="kodza-product-gallery__nav">
          <span class="kodza-product-gallery__count" aria-hidden="true"><span></span></span>
          <button class="kodza-product-gallery__button" type="button" data-step="-1">${icon('M10 3.5 5.5 8l4.5 4.5')}</button>
          <button class="kodza-product-gallery__button" type="button" data-step="1">${icon('M6 3.5 10.5 8 6 12.5')}</button>
        </div>
      </div>
      <button class="kodza-product-gallery__button kodza-product-gallery__close" type="button">${icon('M4 4l8 8M12 4l-8 8')}</button>`;
    root.append(viewer);
    const shade = viewer.querySelector('.kodza-product-gallery__shade');
    const bar = viewer.querySelector('.kodza-product-gallery__bar');
    const close = viewer.querySelector('.kodza-product-gallery__close');
    const caption = viewer.querySelector('.kodza-product-gallery__caption');
    const count = viewer.querySelector('.kodza-product-gallery__count');
    const [back, forth] = viewer.querySelectorAll('[data-step]');
    back.setAttribute('aria-label', words('previous'));
    forth.setAttribute('aria-label', words('next'));
    close.setAttribute('aria-label', words('close'));
    let image = null;
    let closing = false;

    // Where the photo fits on screen: room kept for the close button above and the bar below
    const fit = (img) => {
      const ratio = (img.naturalWidth || img.width) / (img.naturalHeight || img.height) || 1;
      const above = 68;
      const below = 84;
      const w = innerWidth - 48;
      const h = innerHeight - above - below;
      const width = Math.min(w, h * ratio);
      const height = width / ratio;
      return { left: (innerWidth - width) / 2, top: above + (h - height) / 2, width, height };
    };
    const place = (el, box) => Object.assign(el.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });
    // The transform that puts a box of the screen onto the large photo of the page
    const from = (box, rect) => `translate(${rect.left - box.left}px, ${rect.top - box.top}px) scale(${rect.width / box.width}, ${rect.height / box.height})`;

    // A word that rolls: the old one up, the new one from below (or the other way)
    const roll = (el, text, dir) => {
      const old = el.lastElementChild;
      if (old.textContent === text) return;
      if (still || !dir) {
        old.textContent = text;
        return;
      }
      const next = Object.assign(document.createElement('span'), { textContent: text });
      el.append(next);
      const timing = { duration: ROLL * pace, easing: ease };
      old.animate([{ transform: 'none', opacity: 1 }, { transform: `translateY(${-dir * 100}%)`, opacity: 0 }], { ...timing, fill: 'forwards' }).finished.then(() => old.remove(), () => old.remove());
      next.animate([{ transform: `translateY(${dir * 100}%)`, opacity: 0 }, { transform: 'none', opacity: 1 }], timing);
    };
    const label = (dir) => {
      roll(caption, set[index].alt, dir);
      roll(count, `${index + 1} / ${set.length}`, dir);
    };
    const make = (source) => {
      const img = new Image();
      img.className = 'kodza-product-gallery__image';
      img.alt = source.alt;
      img.src = source.currentSrc || source.src;
      img.width = source.naturalWidth || source.width;
      img.height = source.naturalHeight || source.height;
      const full = source.dataset.full;
      if (full) {
        const sharp = new Image();
        sharp.onload = () => (img.src = full);
        sharp.src = full;
      }
      return img;
    };
    // Fades that stayed at their end (fill forwards) after a close are let go before reopening
    const calm = () => [shade, bar, close].forEach((el) => el.getAnimations().forEach((animation) => animation.cancel()));
    const radius = () => getComputedStyle(stage).borderTopLeftRadius;

    const enlarge = () => {
      if (viewer.open) return;
      closing = false;
      // Back to its size at once, so the viewer grows from the photo as it sits in the page
      stage.classList.add('is-snapping');
      unzoom();
      void list.offsetWidth;
      stage.classList.remove('is-snapping');
      calm();
      const source = set[index];
      image = make(source);
      const box = fit(image);
      place(image, box);
      shade.after(image);
      viewer.classList.toggle('is-single', set.length < 2);
      viewer.showModal();
      source.classList.add('is-away');
      label(0);
      if (still) return;
      const rect = stage.getBoundingClientRect();
      image.animate([{ transform: from(box, rect), borderRadius: radius() }, { transform: 'none', borderRadius: getComputedStyle(image).borderTopLeftRadius }], { duration: OPEN * pace, easing: ease });
      shade.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420 * pace, easing: 'ease' });
      [bar, close].forEach((el) => el.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 480 * pace, delay: 200 * pace, easing: ease, fill: 'backwards' }));
    };

    // Back to the large photo, which already shows where the viewer was left
    const shut = () => {
      if (closing || !viewer.open) return;
      closing = true;
      const done = () => {
        photos.forEach((img) => img.classList.remove('is-away'));
        image?.remove();
        image = null;
        viewer.close();
        calm();
      };
      if (still) return done();
      const box = image.getBoundingClientRect();
      const rect = stage.getBoundingClientRect();
      const seen = rect.bottom > 0 && rect.top < innerHeight;
      image.getAnimations().forEach((animation) => animation.cancel());
      image.animate(seen
        ? [{ transform: 'none' }, { transform: from(box, rect), borderRadius: radius() }]
        : [{ opacity: 1 }, { opacity: 0, transform: 'scale(0.96)' }], { duration: 520 * pace, easing: ease, fill: 'forwards' }).onfinish = done;
      shade.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420 * pace, easing: 'ease', fill: 'forwards' });
      [bar, close].forEach((el) => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 * pace, fill: 'forwards' }));
    };

    // The next one in the viewer: both move together by one screen, and the page follows quietly
    const go = (dir) => {
      if (closing || set.length < 2) return;
      const old = image;
      set[index].classList.remove('is-away');
      show(index + dir, true);
      set[index].classList.add('is-away');
      image = make(set[index]);
      place(image, fit(image));
      old.after(image);
      label(dir);
      if (still) return old.remove();
      const push = { duration: 680 * pace, easing: big };
      old.getAnimations().forEach((animation) => animation.cancel());
      old.animate([{ transform: 'none' }, { transform: `translateX(${-dir * innerWidth}px)` }], { ...push, fill: 'forwards' }).onfinish = () => old.remove();
      image.animate([{ transform: `translateX(${dir * innerWidth}px)` }, { transform: 'none' }], push);
    };

    open.addEventListener('click', () => {
      if (swiped) return (swiped = false);
      enlarge();
    }, { signal });
    back.addEventListener('click', () => go(-1), { signal });
    forth.addEventListener('click', () => go(1), { signal });
    close.addEventListener('click', shut, { signal });
    shade.addEventListener('click', shut, { signal });
    viewer.addEventListener('cancel', (event) => {
      event.preventDefault();
      shut();
    }, { signal });
    viewer.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') go(1);
      if (event.key === 'ArrowLeft') go(-1);
    }, { signal });
    // The page does not move underneath while it is open: nothing in the viewer scrolls
    viewer.addEventListener('wheel', (event) => event.preventDefault(), { passive: false, signal });
    viewer.addEventListener('touchmove', (event) => event.preventDefault(), { passive: false, signal });
    // A swipe in the viewer: sideways for the next one, down to close; a tap closes
    let touch = null;
    viewer.addEventListener('pointerdown', (event) => {
      if (event.target === image) touch = { x: event.clientX, y: event.clientY };
    }, { signal });
    viewer.addEventListener('pointerup', (event) => {
      if (!touch) return;
      const dx = event.clientX - touch.x;
      const dy = event.clientY - touch.y;
      touch = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
      else if (dy > 80 || (Math.abs(dx) < 6 && Math.abs(dy) < 6)) shut();
    }, { signal });
    addEventListener('resize', () => image && !closing && place(image, fit(image)), { signal });
    // Stopped while open (or closing): the viewer closes at once
    signal.addEventListener('abort', () => viewer.open && viewer.close());
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
