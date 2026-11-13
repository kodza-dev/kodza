// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Product Page
// A whole product page in one block: the photos, the buy box, the reviews and "You may also like".
// Each part is the Kodza component of the same name copied whole (Product Gallery, Buy Box, Review
// Summary, Product Card), started by this script. What only the page does: the photos follow the
// colour chosen in the buy box, the stars scroll to the reviews, and on a phone a bar with Add to
// cart comes up from the bottom once the buy box's own button has scrolled away.
// Settings: the --kz-product-page-* variables in the CSS (the page, then each part under its own
// prefix), the data-* attributes of each part, the constants below and at the top of each part.
// The cart is the Cart engine, at the end: a small cart kept in the browser, or your platform's.
(() => {
  const SELECTOR = '.kodza-product-page';

  // Timings, in milliseconds (times the site's pace)
  const ROLL = 420; // the bar's variant, price or button rolling
  // Not motion, so not paced
  const HOLD = 1600; // how long "Added" stays in the bar
  const PHONE = 820; // px: the bar only comes up at this width or under (as in the CSS)

  // What the script writes, in English unless the root says otherwise (data-text-<key>)
  const WORDS = {
    added: 'Added', // in the bar's button, once it is in the cart
  };
  const TICK = '<svg class="kodza-product-page__bar-tick" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4 8-9" pathLength="1" /></svg>';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };

  // ---------- Product Gallery, as kodza-product-page__gallery (begin) ----------
  const mountGallery = (() => {
    const SELECTOR = '.kodza-product-page__gallery';

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
      const list = root.querySelector('.kodza-product-page__gallery-photos');
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
      stage.className = 'kodza-product-page__gallery-stage';
      list.replaceWith(stage);
      const open = Object.assign(document.createElement('button'), { type: 'button', className: 'kodza-product-page__gallery-open' });
      stage.append(list, open);
      stage.style.setProperty('--kz-product-page-gallery-zoom', zoom);

      // The thumbnails and the dots, one per photo of the colour
      const thumbs = document.createElement('div');
      thumbs.className = 'kodza-product-page__gallery-thumbs';
      thumbs.setAttribute('role', 'group');
      thumbs.setAttribute('aria-label', words('photos'));
      const ring = Object.assign(document.createElement('span'), { className: 'kodza-product-page__gallery-ring' });
      ring.setAttribute('aria-hidden', 'true');
      const dots = document.createElement('div');
      dots.className = 'kodza-product-page__gallery-dots';
      root.prepend(thumbs);
      root.append(dots);
      let thumbButtons = [];
      let dotButtons = [];
      const thumbImage = (img) => Object.assign(new Image(), { src: img.currentSrc || img.src, alt: '', decoding: 'async', width: 160, height: 200 });
      const build = () => {
        thumbs.replaceChildren(ring);
        dots.replaceChildren();
        thumbButtons = set.map((img, i) => {
          const button = Object.assign(document.createElement('button'), { type: 'button', className: 'kodza-product-page__gallery-thumb' });
          button.setAttribute('aria-label', words('photo', { n: i + 1, count: set.length }));
          button.append(thumbImage(img));
          button.addEventListener('click', () => show(i), { signal });
          thumbs.append(button);
          return button;
        });
        dotButtons = set.map((img, i) => {
          const button = Object.assign(document.createElement('button'), { type: 'button', className: 'kodza-product-page__gallery-dot' });
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
        ring.style.setProperty('--kz-product-page-gallery-ring-h', `${button.offsetHeight}px`);
        ring.style.setProperty('--kz-product-page-gallery-ring-y', `${button.offsetTop}px`);
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
        stage.style.setProperty('--kz-product-page-gallery-ox', `${(x / stage.clientWidth) * 100}%`);
        stage.style.setProperty('--kz-product-page-gallery-oy', `${(y / stage.clientHeight) * 100}%`);
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
      viewer.className = 'kodza-product-page__gallery-viewer';
      viewer.setAttribute('aria-label', words('viewer'));
      viewer.innerHTML = `<div class="kodza-product-page__gallery-shade"></div>
        <div class="kodza-product-page__gallery-bar">
          <p class="kodza-product-page__gallery-caption" aria-live="polite"><span></span></p>
          <div class="kodza-product-page__gallery-nav">
            <span class="kodza-product-page__gallery-count" aria-hidden="true"><span></span></span>
            <button class="kodza-product-page__gallery-button" type="button" data-step="-1">${icon('M10 3.5 5.5 8l4.5 4.5')}</button>
            <button class="kodza-product-page__gallery-button" type="button" data-step="1">${icon('M6 3.5 10.5 8 6 12.5')}</button>
          </div>
        </div>
        <button class="kodza-product-page__gallery-button kodza-product-page__gallery-close" type="button">${icon('M4 4l8 8M12 4l-8 8')}</button>`;
      root.append(viewer);
      const shade = viewer.querySelector('.kodza-product-page__gallery-shade');
      const bar = viewer.querySelector('.kodza-product-page__gallery-bar');
      const close = viewer.querySelector('.kodza-product-page__gallery-close');
      const caption = viewer.querySelector('.kodza-product-page__gallery-caption');
      const count = viewer.querySelector('.kodza-product-page__gallery-count');
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
        img.className = 'kodza-product-page__gallery-image';
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

    return mount;
  })();
  // ---------- Product Gallery (end) ----------

  // ---------- Buy Box, as kodza-product-page__buy (begin) ----------
  const mountBuy = (() => {
    const SELECTOR = '.kodza-product-page__buy';

    // Timings, in milliseconds (times the site's pace)
    const ROLL = 420; // a word or a figure rolling
    const SLIDE = 520; // the ink pill going from one size to another
    const FOLD = 560; // a detail opening or closing
    const LEAD = 0.7; // the front edge of the pill arrives in this share of the slide
    const LAG = 0.14; // the back edge waits this share of the slide before it follows
    const SAMPLES = 24; // keyframes per slide: each edge follows its own curve
    // Not motion, so not paced
    const HOLD = 1600; // how long "Added" stays before "Add to cart" comes back

    // What the script writes, in English unless the root says otherwise (data-text-<key>)
    const WORDS = {
      added: 'Added', // in the button, once it is in the cart
      today: 'Order before {time}, ships today', // before the cut-off, on a shipping day
      tomorrow: 'Order now, ships tomorrow',
      later: 'Order now, ships {day}', // {day}: the weekday, in the page's language
    };

    // The shipping line: data-cutoff="14:00", data-ship-days="mon-fri" (or "mon,wed,fri"),
    // data-timezone="Europe/Paris" (the visitor's own without it), data-now="tue 22:35" to pin the clock
    const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const TICK = '<svg class="kodza-product-page__buy-tick" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4 8-9" pathLength="1" /></svg>';

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
    // script times it, and 0 moves nothing, like reduced motion
    const paceOf = (el) => {
      const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
      return pace >= 0 ? pace : 1;
    };


    // The days a parcel leaves, from "mon-fri" or "mon,wed,fri" (Monday is 0)
    const shipDays = (text) => {
      const days = new Set();
      String(text || 'mon-fri').toLowerCase().split(',').forEach((part) => {
        const [a, b] = part.trim().split('-').map((d) => DAYS.indexOf(d.trim().slice(0, 3)));
        if (a < 0) return;
        for (let d = a; ; d = (d + 1) % 7) {
          days.add(d);
          if (b == null || b < 0 || d === b) break;
        }
      });
      return days.size ? days : new Set([0, 1, 2, 3, 4]);
    };

    // One instance, with its own state: two copies on a page never interfere. Everything it
    // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
    // 'abort' event), so kodza:destroy stops it all.
    function mount(root, signal) {
      const pace = paceOf(root);
      const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
      const ms = (t) => (still ? 0 : t * pace);
      const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
      const fill = (text, values) => text.replace(/\{(\w+)\}/g, (all, name) => values[name] ?? all);
      const lang = root.closest('[lang]')?.lang || undefined;

      const q = (name) => root.querySelector(`.kodza-product-page__buy-${name}`);
      const timers = new Set();
      const moving = new Set();
      const later = (fn, t) => {
        const id = setTimeout(() => {
          timers.delete(id);
          fn();
        }, t);
        timers.add(id);
        return id;
      };
      const play = (el, frames, options) => {
        const animation = el.animate(frames, options);
        moving.add(animation);
        animation.finished.then(() => moving.delete(animation), () => moving.delete(animation));
        return animation;
      };
      signal.addEventListener('abort', () => {
        timers.forEach(clearTimeout);
        moving.forEach((animation) => animation.cancel());
      });

      // A word rolling in its box: the old one goes up, the new one comes from below (`down`: the
      // other way, for a price that drops or a quantity going down)
      const current = new Map();
      const roll = (box, text, { tick = false, down = false, quiet = false } = {}) => {
        const old = current.get(box) || box?.firstElementChild;
        if (!old || (old.textContent === text && !!old.firstElementChild === tick)) return;
        const next = old.cloneNode(false);
        next.innerHTML = tick ? TICK : '';
        next.append(text);
        current.set(box, next);
        [...box.children].forEach((el) => el !== old && el.remove());
        if (still || quiet) return old.replaceWith(next);
        box.append(next);
        const options = { duration: ms(ROLL), easing: 'cubic-bezier(0.65, 0, 0.35, 1)' };
        // Far enough to leave its box: 130% of a word alone stays inside a tall button
        const far = `${Math.max(old.offsetHeight * 1.3, (box.clientHeight + old.offsetHeight) / 2 + 2)}px`;
        const away = down ? far : `-${far}`;
        play(old, [{ transform: 'none' }, { transform: `translateY(${away})` }], { ...options, fill: 'forwards' })
          .finished.then(() => old.remove(), () => old.remove());
        play(next, [{ transform: `translateY(${down ? `-${far}` : far})` }, { transform: 'none' }], options);
      };

      // ---------- The variant: price, picture, and who is told ----------
      const radios = [...root.querySelectorAll('input[type="radio"][name^="options["]')];
      const colours = [...root.querySelectorAll('.kodza-product-page__buy-swatch input')];
      const picked = q('picked');
      const amount = q('amount');
      const base = Number(root.dataset.price) || 0;
      const money = (cents) => {
        const options = root.dataset.currency ? { style: 'currency', currency: root.dataset.currency } : {};
        const digits = cents % 100 ? 2 : 0;
        try {
          return new Intl.NumberFormat(lang, { ...options, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(cents / 100);
        } catch {
          return (cents / 100).toFixed(digits);
        }
      };
      const options = () => {
        const chosen = {};
        radios.forEach((input) => {
          if (!input.checked) return;
          const match = /^options\[(.+)\]$/.exec(input.name);
          if (match) chosen[match[1]] = input.value;
        });
        return chosen;
      };
      // The price of the variant: the last chosen option that has one, or the product's
      const priceNow = () => {
        const priced = radios.filter((input) => input.checked && input.dataset.price);
        return priced.length ? Number(priced[priced.length - 1].dataset.price) || base : base;
      };
      let price = priceNow();
      let colour = colours.findIndex((input) => input.checked);
      const tell = () => {
        const chosen = options();
        const pick = colours.find((input) => input.checked);
        if (pick?.dataset.image) root.dataset.image = pick.dataset.image;
        root.dispatchEvent(new CustomEvent('kodza:variant-change', {
          bubbles: true,
          detail: { id: root.dataset.id ?? null, options: chosen, colour: pick?.value ?? null, price, image: root.dataset.image || '' },
        }));
      };
      const changed = (input) => {
        if (colours.includes(input)) {
          const at = colours.indexOf(input);
          if (picked) roll(picked, input.value, { down: at < colour });
          colour = at;
        }
        const next = priceNow();
        if (next !== price) {
          roll(amount, money(next), { down: next < price });
          price = next;
          root.dataset.price = String(next);
        }
        tell();
      };
      radios.forEach((input) => input.addEventListener('change', () => input.checked && changed(input), { signal }));

      // ---------- The sizes: one ink pill that slides ----------
      const track = q('track');
      const sizes = track ? [...track.querySelectorAll('input')] : [];
      let ink = null;
      let boxes = [];
      let move = null;
      let chosen = sizes.findIndex((input) => input.checked);
      const ease = (t) => 1 - (1 - t) ** 4; // leaves at once, lands softly
      const cut = ({ left, right }) => `inset(0 ${right}px 0 ${left}px round var(--kz-radius-pill, 999px))`;
      const edgesAt = ({ from, to, forward }, t) => {
        const front = ease(Math.min(1, t / LEAD));
        const back = ease(Math.max(0, (t - LAG) / (1 - LAG)));
        return {
          left: from.left + (to.left - from.left) * (forward ? back : front),
          right: from.right + (to.right - from.right) * (forward ? front : back),
        };
      };
      // Each size's place in the ink layer, in its own pixels: a parent scaled by a transform changes nothing
      const measure = () => {
        const full = ink.offsetWidth;
        boxes = sizes.map((input) => {
          const label = input.closest('.kodza-product-page__buy-size');
          const left = label.offsetLeft - ink.offsetLeft;
          return { left, right: full - left - label.offsetWidth };
        });
      };
      const rest = () => {
        ink.style.clipPath = chosen < 0 ? 'inset(0 50% 0 50%)' : cut(boxes[chosen]);
      };
      if (track && sizes.length) {
        // A copy of the labels, in on-ink, cut to the pill: the text turns white exactly at its edges
        ink = document.createElement('span');
        ink.className = 'kodza-product-page__buy-ink';
        ink.setAttribute('aria-hidden', 'true');
        sizes.forEach((input) => {
          const copy = document.createElement('span');
          copy.className = 'kodza-product-page__buy-copy';
          copy.textContent = input.value;
          ink.append(copy);
        });
        track.append(ink);
        measure();
        rest();
        const slide = (from, to) => {
          const t0 = move?.currentTime;
          let start = boxes[from];
          // Caught mid-slide: it leaves from where it is
          if (move && t0 != null) start = edgesAt(move.plan, Math.min(1, t0 / ms(SLIDE)));
          move?.cancel();
          move = null;
          rest();
          if (still || !start) return;
          const plan = { from: start, to: boxes[to], forward: boxes[to].left > start.left };
          const frames = [];
          for (let i = 0; i <= SAMPLES; i += 1) frames.push({ clipPath: cut(edgesAt(plan, i / SAMPLES)) });
          move = play(ink, frames, { duration: ms(SLIDE), easing: 'linear' });
          move.plan = plan;
          move.finished.then(() => { if (move?.plan === plan) move = null; }, () => {});
        };
        sizes.forEach((input, i) => input.addEventListener('change', () => {
          if (!input.checked || i === chosen) return;
          const from = chosen;
          chosen = i;
          slide(from, i);
        }, { signal }));
        const resize = new ResizeObserver(() => {
          measure();
          if (!move) rest();
        });
        resize.observe(track);
        signal.addEventListener('abort', () => resize.disconnect());
      }

      // ---------- Quantity: digits that roll ----------
      const field = q('input');
      const number = q('number');
      const steps = [...root.querySelectorAll('.kodza-product-page__buy-step')];
      const bounds = () => [Number(field.min) || 1, Number(field.max) || 99];
      const ends = () => {
        const [min, max] = bounds();
        const n = Number(field.value) || min;
        steps.forEach((step) => step.setAttribute('aria-disabled', String(Number(step.dataset.step) < 0 ? n <= min : n >= max)));
      };
      if (field && number) {
        ends();
        steps.forEach((step) => step.addEventListener('click', () => {
          const [min, max] = bounds();
          const was = Number(field.value) || min;
          const n = Math.min(max, Math.max(min, was + Number(step.dataset.step)));
          if (n === was) return;
          field.value = String(n);
          field.dispatchEvent(new Event('input', { bubbles: true }));
          ends();
          if (still) return;
          // The old number goes, the new one comes from the side it was asked from
          const old = document.createElement('span');
          old.className = 'kodza-product-page__buy-old';
          old.setAttribute('aria-hidden', 'true');
          old.textContent = String(was);
          number.querySelectorAll('.kodza-product-page__buy-old').forEach((el) => el.remove());
          number.append(old);
          const up = n > was;
          const options = { duration: ms(ROLL), easing: 'cubic-bezier(0.65, 0, 0.35, 1)' };
          // Far enough to leave its box: 130% of a word alone stays inside a tall button
          const far = `${Math.max(old.offsetHeight * 1.3, (number.clientHeight + old.offsetHeight) / 2 + 2)}px`;
          play(old, [{ transform: 'none' }, { transform: `translateY(${up ? `-${far}` : far})` }], { ...options, fill: 'forwards' })
            .finished.then(() => old.remove(), () => old.remove());
          play(field, [{ transform: `translateY(${up ? far : `-${far}`})` }, { transform: 'none' }], options);
        }, { signal }));
        field.addEventListener('change', () => {
          const [min, max] = bounds();
          field.value = String(Math.min(max, Math.max(min, Math.round(Number(field.value) || min))));
          ends();
        }, { signal });
        field.addEventListener('input', ends, { signal });
      }

      // ---------- In the cart: Added, then Add to cart again ----------
      const add = q('add');
      const first = add?.textContent.trim() || '';
      let back = null;
      root.addEventListener('kodza:cart-add', (event) => {
        if (event.target !== root || !add) return;
        root.classList.add('is-added');
        roll(add, word('added'), { tick: true });
        clearTimeout(back);
        timers.delete(back);
        const reset = () => {
          root.classList.remove('is-added');
          roll(add, first);
        };
        // The platform passes its request to wait() while the event runs: read it just after
        queueMicrotask(() => {
          Promise.resolve(event.detail?.request).then(
            () => !signal.aborted && (back = later(reset, HOLD)),
            () => !signal.aborted && reset(),
          );
        });
      }, { signal });

      // ---------- When it ships, in the workshop's time zone ----------
      const when = q('when');
      if (when && root.dataset.cutoff) {
        const days = shipDays(root.dataset.shipDays);
        const [ch, cm] = root.dataset.cutoff.split(':').map(Number);
        const cutoff = (ch || 0) * 60 + (cm || 0);
        const dayName = (d) => {
          // 2024-01-01 was a Monday
          try {
            return new Intl.DateTimeFormat(lang, { weekday: 'long', timeZone: 'UTC' }).format(Date.UTC(2024, 0, 1 + d));
          } catch {
            return DAYS[d];
          }
        };
        const clock = () => {
          const pinned = /^(\w{3})\w*\s+(\d{1,2}):(\d{2})$/.exec(String(root.dataset.now || '').trim().toLowerCase());
          if (pinned) return { day: Math.max(0, DAYS.indexOf(pinned[1])), minutes: Number(pinned[2]) * 60 + Number(pinned[3]) };
          let parts;
          try {
            parts = new Intl.DateTimeFormat('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: root.dataset.timezone || undefined }).formatToParts(new Date());
          } catch {
            parts = new Intl.DateTimeFormat('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
          }
          const part = (type) => parts.find((p) => p.type === type)?.value || '';
          return { day: Math.max(0, DAYS.indexOf(part('weekday').toLowerCase().slice(0, 3))), minutes: Number(part('hour')) * 60 + Number(part('minute')) };
        };
        const line = () => {
          const { day, minutes } = clock();
          if (days.has(day) && minutes < cutoff) return fill(word('today'), { time: root.dataset.cutoff });
          let ahead = 1;
          while (ahead < 7 && !days.has((day + ahead) % 7)) ahead += 1;
          return ahead === 1 ? word('tomorrow') : fill(word('later'), { day: dayName((day + ahead) % 7) });
        };
        roll(when, line(), { quiet: true });
        // Read again on the next minute: the line rolls when the cut-off passes
        const tick = () => {
          roll(when, line());
          later(tick, 60000 - (Date.now() % 60000) + 50);
        };
        if (!root.dataset.now) later(tick, 60000 - (Date.now() % 60000) + 50);
      }

      // ---------- The details: a height that opens ----------
      root.querySelectorAll('.kodza-product-page__buy-fold').forEach((fold) => {
        const summary = fold.querySelector('summary');
        const panel = fold.querySelector('.kodza-product-page__buy-panel');
        if (!summary || !panel) return;
        let motion = null;
        summary.addEventListener('click', (event) => {
          if (still) return;
          event.preventDefault();
          const from = fold.offsetHeight;
          const opening = !fold.classList.contains('is-open');
          motion?.cancel();
          motion?.panel?.cancel();
          fold.open = true;
          fold.classList.toggle('is-open', opening);
          const edge = fold.offsetHeight - fold.clientHeight;
          const to = opening ? fold.offsetHeight : summary.offsetHeight + edge;
          const options = { duration: ms(FOLD), easing: 'cubic-bezier(0.65, 0, 0.35, 1)' };
          motion = play(fold, [{ height: `${from}px`, overflow: 'hidden' }, { height: `${to}px`, overflow: 'hidden' }], options);
          motion.opening = opening;
          motion.panel = opening
            ? play(panel, [{ transform: 'translateY(-8px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: ms(FOLD * 0.8), delay: ms(FOLD * 0.2), fill: 'backwards', easing: 'cubic-bezier(0.22, 1, 0.36, 1)' })
            : play(panel, [{ opacity: 1 }, { opacity: 0 }], { ...options, duration: ms(FOLD * 0.6), fill: 'forwards' });
          const done = motion;
          motion.finished.then(() => {
            if (motion !== done) return;
            motion = null;
            if (!opening) fold.open = false;
            // The text stays hidden until the fold is shut, then the fade lets go
            if (!opening) done.panel.cancel();
          }, () => {});
        }, { signal });
        fold.classList.toggle('is-open', fold.open);
        fold.addEventListener('toggle', () => !motion && fold.classList.toggle('is-open', fold.open), { signal });
      });
    }

    return mount;
  })();
  // ---------- Buy Box (end) ----------

  // ---------- Review Summary, as kodza-product-page__reviews (begin) ----------
  const mountReviews = (() => {
    const SELECTOR = '.kodza-product-page__reviews';
    const GLIDE = 560; // ms, a review sliding to its new place, and the list to its new height
    const LEAVE = 240; // ms, a review fading out of the filter
    const ENTER = 420; // ms, a review coming back
    const OPEN = 520; // ms, "Read more" opening the review
    const FOLD = 420; // ms, and folding it back
    const ROLL = 380; // ms, a word of the status rolling to the next
    const THRESHOLD = 0.35; // share of the summary in view before it fills
    const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
    // script times it, and 0 moves nothing, like reduced motion
    const paceOf = (el) => {
      const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
      return pace >= 0 ? pace : 1;
    };
    const make = (tag, className, text) => Object.assign(document.createElement(tag), className ? { className } : {}, text != null ? { textContent: text } : {});

    // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
    function mount(root, signal) {
      const pace = paceOf(root);
      const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
      const inline = root.classList.contains('kodza-product-page__reviews--inline');

      // The average: a column of spinning digits per digit (screen readers keep the plain text)
      const strips = [];
      root.querySelectorAll('.kodza-product-page__reviews-value').forEach((value) => {
        const text = value.textContent.trim();
        const count = (text.match(/\d/g) || []).length;
        let rank = 0;
        value.setAttribute('aria-hidden', 'true');
        value.after(make('span', 'kodza-product-page__reviews-sr', text));
        value.replaceChildren(...[...text].map((char) => {
          if (!/\d/.test(char)) return make('span', 'kodza-product-page__reviews-char', char);
          // The digits on the right spin more: one turn on the left, up to three on the right
          const turns = 1 + Math.round((rank / Math.max(1, count - 1)) * 2);
          const column = make('span', 'kodza-product-page__reviews-digit');
          const strip = make('span', 'kodza-product-page__reviews-strip');
          for (let i = 0; i < (turns + 1) * 10; i++) strip.append(make('span', '', i % 10));
          column.append(make('span', 'kodza-product-page__reviews-fit', char), strip);
          strips.push({ strip, stop: turns * 10 + Number(char), rank: rank++ });
          return column;
        }));
      });
      const land = () => strips.forEach(({ strip, stop }) => (strip.style.transform = `translateY(${-stop * 1.1}em)`));
      const roll = () => strips.forEach(({ strip, stop, rank }) => {
        strip.getAnimations().forEach((animation) => animation.cancel());
        strip.style.transform = '';
        strip.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${-stop * 1.1}em)` }], {
          duration: (1500 + rank * 160) * pace,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          fill: 'forwards',
        });
      });

      // The entrance: empty until the summary is in view, then the stars and the bars fill (CSS)
      const enter = () => {
        root.classList.add('is-in');
        roll();
      };
      if (still || !('IntersectionObserver' in window)) land();
      else {
        root.classList.add('is-armed');
        const io = new IntersectionObserver((entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          io.disconnect();
          enter();
        }, { threshold: THRESHOLD });
        io.observe(inline ? root : root.querySelector('.kodza-product-page__reviews-summary') || root);
        signal.addEventListener('abort', () => io.disconnect());
        root.addEventListener('kodza:replay', () => {
          root.classList.remove('is-in');
          void root.offsetWidth; // empty again for one frame, so the fill plays from the start
          enter();
        }, { signal });
      }

      const list = root.querySelector('.kodza-product-page__reviews-reviews');
      if (!list) return;
      const reviews = [...list.querySelectorAll('.kodza-product-page__reviews-review')];
      const bars = [...root.querySelectorAll('.kodza-product-page__reviews-bar')];
      const empty = list.querySelector('.kodza-product-page__reviews-empty');

      // "Read more": a long review stops after a few lines, and opens at its real height
      const moreText = list.dataset.more || 'Read more';
      const lessText = list.dataset.less || 'Read less';
      const folds = new Map();
      reviews.forEach((review) => {
        const quote = review.querySelector('.kodza-product-page__reviews-quote');
        if (!quote) return;
        let button = null;
        let open = false;
        let width = 0;
        let run = null;
        const toggle = () => {
          const from = quote.offsetHeight;
          run?.cancel();
          open = !open;
          button.classList.toggle('is-open', open);
          button.setAttribute('aria-expanded', String(open));
          button.firstChild.toggleAttribute('aria-hidden', open);
          button.lastChild.toggleAttribute('aria-hidden', !open);
          quote.classList.toggle('is-closing', !open);
          quote.classList.remove('is-open');
          const low = quote.offsetHeight;
          quote.classList.add('is-open');
          const to = open ? quote.offsetHeight : low;
          const done = () => {
            run = null;
            if (!open) quote.classList.remove('is-open', 'is-closing');
          };
          if (still) return done();
          run = quote.animate([{ height: `${from}px` }, { height: `${to}px` }], {
            duration: (open ? OPEN : FOLD) * pace,
            easing: open ? EASE : 'cubic-bezier(0.65, 0, 0.35, 1)',
          });
          run.onfinish = done;
        };
        // Long or not depends on the width: measured again when it changes, never while hidden or open
        folds.set(quote, () => {
          const w = quote.clientWidth;
          if (!w || w === width || open) return;
          width = w;
          quote.classList.add('is-long');
          const long = quote.scrollHeight > quote.clientHeight + 1;
          quote.classList.toggle('is-long', long);
          if (long && !button) {
            button = make('button', 'kodza-product-page__reviews-more');
            button.type = 'button';
            button.setAttribute('aria-expanded', 'false');
            const less = make('span', '', lessText);
            less.setAttribute('aria-hidden', 'true');
            button.append(make('span', '', moreText), less);
            button.addEventListener('click', toggle, { signal });
            quote.after(button);
          } else if (!long && button) {
            button.remove();
            button = null;
          }
        });
      });
      if ('ResizeObserver' in window) {
        const ro = new ResizeObserver((entries) => entries.forEach((entry) => folds.get(entry.target)?.()));
        folds.forEach((_, quote) => ro.observe(quote));
        signal.addEventListener('abort', () => ro.disconnect());
      } else folds.forEach((measure) => measure());

      // The status over the list: its words roll (the old one goes up, the new one comes from below)
      const status = root.querySelector('.kodza-product-page__reviews-status');
      const label = root.querySelector('.kodza-product-page__reviews-status-label');
      const count = root.querySelector('.kodza-product-page__reviews-status-count');
      const allLabel = label ? label.textContent.trim() : '';
      let live = null;
      [label, count].forEach((el) => {
        if (!el) return;
        el.replaceChildren(make('span', '', el.textContent.trim()));
        el.classList.add('kodza-product-page__reviews-slot');
      });
      if (status) {
        // Screen readers hear the change once, from a quiet copy, not the words on their way out
        status.setAttribute('aria-hidden', 'true');
        live = make('span', 'kodza-product-page__reviews-sr', `${allLabel}: ${reviews.length}`);
        live.setAttribute('aria-live', 'polite');
        status.after(live);
      }
      const rollTo = (el, text) => {
        if (!el) return;
        const words = [...el.children];
        const current = words.pop();
        if (current.textContent === text) return;
        words.forEach((word) => word.remove());
        const word = make('span', '', text);
        if (still) return current.replaceWith(word);
        [el, current].forEach((node) => node.getAnimations().forEach((animation) => animation.cancel()));
        const from = el.offsetWidth;
        current.replaceWith(word);
        const to = el.offsetWidth;
        el.prepend(current);
        current.setAttribute('aria-hidden', 'true');
        const timing = { duration: ROLL * pace, easing: EASE };
        current.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-100%)', opacity: 0 }], { ...timing, fill: 'forwards' })
          .onfinish = () => current.remove();
        word.animate([{ transform: 'translateY(100%)', opacity: 0 }, { transform: 'none', opacity: 1 }], timing);
        if (from !== to) el.animate([{ width: `${from}px` }, { width: `${to}px` }], timing);
      };

      // The filter. A review on its way out is laid over the grid where it was, behind the others, and
      // fades; the others glide from where they were (measured before and after, FLIP)
      const leaving = new Set();
      const moves = new Map();
      let sizing = null;
      let current = null;
      const release = (review) => {
        ['position', 'left', 'top', 'width', 'margin', 'z-index'].forEach((name) => review.style.removeProperty(name));
        review.inert = false;
      };
      const arrange = (shows, shown) => {
        if (still) {
          reviews.forEach((review) => (review.hidden = !shows(review)));
          if (empty) empty.hidden = shown > 0;
          return;
        }
        // A parent scaled by transform (the catalogue, a theme): screen pixels back to the list's own
        const scale = list.getBoundingClientRect().width / list.offsetWidth || 1;
        const box = list.getBoundingClientRect();
        const height = list.offsetHeight;
        const from = new Map();
        reviews.forEach((review) => {
          if (review.hidden || (leaving.has(review) && !shows(review))) return;
          const rect = review.getBoundingClientRect();
          from.set(review, {
            x: (rect.left - box.left) / scale,
            y: (rect.top - box.top) / scale,
            width: review.offsetWidth,
            opacity: Number(getComputedStyle(review).opacity),
          });
        });
        if (sizing) {
          sizing.cancel();
          sizing = null;
          list.classList.remove('is-sizing');
        }
        reviews.forEach((review) => {
          if (leaving.has(review) && !shows(review)) return; // already on its way out
          moves.get(review)?.cancel();
          moves.delete(review);
          if (leaving.delete(review)) release(review);
        });
        reviews.forEach((review) => {
          if (leaving.has(review)) return;
          const was = from.get(review);
          if (shows(review) || !was) return void (review.hidden = !shows(review));
          leaving.add(review);
          review.inert = true;
          Object.assign(review.style, { position: 'absolute', left: `${was.x}px`, top: `${was.y}px`, width: `${was.width}px`, margin: '0', zIndex: '-1' });
          const out = review.animate([{ opacity: was.opacity, transform: 'none' }, { opacity: 0, transform: 'scale(0.96)' }], {
            duration: LEAVE * pace,
            easing: 'cubic-bezier(0.4, 0, 1, 1)',
            fill: 'forwards',
          });
          moves.set(review, out);
          out.onfinish = () => {
            leaving.delete(review);
            moves.delete(review);
            review.hidden = true;
            release(review);
            out.cancel();
          };
        });
        if (empty) {
          const was = !empty.hidden;
          empty.hidden = shown > 0;
          if (!empty.hidden && !was) empty.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ENTER * pace, delay: LEAVE * pace, easing: EASE, fill: 'backwards' });
        }
        const next = list.offsetHeight;
        let k = 0;
        reviews.forEach((review) => {
          if (review.hidden || leaving.has(review)) return;
          const was = from.get(review);
          if (!was) {
            moves.set(review, review.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], {
              duration: ENTER * pace,
              delay: (LEAVE * 0.6 + k++ * 50) * pace,
              easing: EASE,
              fill: 'backwards',
            }));
            return;
          }
          const dx = was.x - review.offsetLeft;
          const dy = was.y - review.offsetTop;
          if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && was.opacity === 1) return;
          moves.set(review, review.animate([{ transform: `translate(${dx}px, ${dy}px)`, opacity: was.opacity }, { transform: 'none', opacity: 1 }], {
            duration: GLIDE * pace,
            easing: EASE,
          }));
        });
        // The list takes its new height in the same time, so the page under it never jumps. Shorter,
        // it waits for the reviews on their way out to be mostly gone
        if (Math.abs(next - height) > 0.5) {
          list.classList.add('is-sizing');
          sizing = list.animate([{ height: `${height}px` }, { height: `${next}px` }], {
            duration: GLIDE * pace,
            delay: next < height ? LEAVE * 0.6 * pace : 0,
            easing: EASE,
            fill: 'backwards',
          });
          sizing.onfinish = () => {
            sizing = null;
            list.classList.remove('is-sizing');
          };
        }
      };
      const filter = (rating) => {
        current = rating === current ? null : rating;
        bars.forEach((bar) => bar.setAttribute('aria-pressed', String(bar.dataset.rating === current)));
        root.classList.toggle('is-filtered', current !== null);
        const shows = (review) => current === null || review.dataset.rating === current;
        const shown = reviews.filter(shows).length;
        const bar = bars.find((item) => item.dataset.rating === current);
        const word = bar ? (bar.querySelector('.kodza-product-page__reviews-bar-label') || bar).textContent.trim() : allLabel;
        rollTo(label, word);
        rollTo(count, String(shown));
        if (live) live.textContent = `${word}: ${shown}`;
        arrange(shows, shown);
      };
      bars.forEach((bar) => bar.addEventListener('click', () => filter(bar.dataset.rating), { signal }));
      root.querySelector('.kodza-product-page__reviews-clear')?.addEventListener('click', (event) => {
        const bar = bars.find((item) => item.dataset.rating === current);
        filter(null);
        // From the keyboard, the focus goes back to the bar instead of the button that just went away
        if (event.detail === 0) bar?.focus();
      }, { signal });
      signal.addEventListener('abort', () => {
        sizing?.cancel();
        moves.forEach((animation) => animation.cancel());
      });
    }

    return mount;
  })();
  // ---------- Review Summary (end) ----------

  // ---------- Product Card, as kodza-product-page__card (begin) ----------
  const mountCard = (() => {
    const SELECTOR = '.kodza-product-page__card';

    // Timings, in milliseconds (times the site's pace)
    const ROLL = 420; // a word rolling in the button
    const SWAP = 640; // the old photo of a colour, wiped away
    // Not motion, so not paced
    const HOLD = 1600; // how long "Added" stays before "Add" comes back

    // What the script writes, in English unless the root says otherwise (data-text-<key>)
    const WORDS = {
      added: 'Added', // in the button, once it is in the cart
      photo: 'Photo {n} of {count}', // the dots of the swipe, read by screen readers
    };

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
    // script times it, and 0 moves nothing, like reduced motion
    const paceOf = (el) => {
      const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
      return pace >= 0 ? pace : 1;
    };

    const finger = window.matchMedia('(hover: none)');

    // One instance, with its own state: two copies on a page never interfere. Everything it
    // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
    // 'abort' event), so kodza:destroy stops it all.
    function mount(root, signal) {
      const pace = paceOf(root);
      const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
      const ms = (t) => (still ? 0 : t * pace);
      const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
      const fill = (text, values) => text.replace(/\{(\w+)\}/g, (all, name) => values[name] ?? all);

      const q = (name) => root.querySelector(`.kodza-product-page__card-${name}`);
      const media = q('media');
      const track = q('track');
      const link = q('link');
      const open = q('open');
      const add = q('add');
      const images = [...root.querySelectorAll('.kodza-product-page__card-image')];
      const [main, second] = [images[0], root.querySelector('.kodza-product-page__card-image--second')];
      const sizes = [...root.querySelectorAll('.kodza-product-page__card-size')];
      const timers = new Set();
      const moving = new Set();
      const later = (fn, t) => {
        const id = setTimeout(() => {
          timers.delete(id);
          fn();
        }, t);
        timers.add(id);
        return id;
      };
      const play = (el, frames, options) => {
        const animation = el.animate(frames, options);
        moving.add(animation);
        animation.finished.then(() => moving.delete(animation), () => moving.delete(animation));
        return animation;
      };
      signal.addEventListener('abort', () => {
        timers.forEach(clearTimeout);
        moving.forEach((animation) => animation.cancel());
      });

      // ---------- The second photo, under the pointer ----------
      if (second && media) {
        const over = (event) => {
          if (event.pointerType !== 'mouse') return;
          const box = media.getBoundingClientRect();
          const inside = event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
          root.classList.toggle('is-peek', inside);
        };
        root.addEventListener('pointermove', over, { signal });
        root.addEventListener('pointerleave', () => root.classList.remove('is-peek'), { signal });
      }

      // ---------- The swipe, with a finger ----------
      let dots = null;
      const current = () => (track && track.clientWidth ? Math.round(track.scrollLeft / track.clientWidth) : 0);
      const mark = () => {
        if (!dots) return;
        const n = current();
        [...dots.children].forEach((dot, i) => dot.classList.toggle('is-current', i === n));
        dots.setAttribute('aria-label', fill(word('photo'), { n: n + 1, count: images.length }));
      };
      const swipe = () => {
        const on = finger.matches && images.length > 1 && track;
        if (on && !dots) {
          dots = document.createElement('span');
          dots.className = 'kodza-product-page__card-dots';
          dots.setAttribute('role', 'img');
          dots.innerHTML = images.map(() => '<span class="kodza-product-page__card-dot"></span>').join('');
          media.append(dots);
          mark();
        } else if (!on && dots) {
          dots.remove();
          dots = null;
          if (track) track.scrollLeft = 0;
        }
      };
      swipe();
      finger.addEventListener('change', swipe, { signal });
      track?.addEventListener('scroll', mark, { signal, passive: true });
      // With a finger the photos sit above the card's link (to swipe): a tap on them follows it
      media?.addEventListener('click', (event) => {
        if (!finger.matches || !link || event.target.closest('a, button, input, label')) return;
        link.click();
      }, { signal });

      // ---------- Colours ----------
      const swatches = [...root.querySelectorAll('.kodza-product-page__card-swatch input')];
      let chosen = swatches.findIndex((input) => input.checked);
      let swapping = 0;
      const swap = async (input) => {
        const at = swatches.indexOf(input);
        const forward = at > chosen;
        chosen = at;
        const { image, imageSecond, alt } = input.dataset;
        if (!image || !main || main.getAttribute('src') === image) return;
        const turn = ++swapping;
        let leaving = null;
        if (!still && main.complete && main.naturalWidth) {
          // The old photo stays on top, as it is, while the new one loads underneath
          leaving = document.createElement('img');
          leaving.className = 'kodza-product-page__card-leaving';
          leaving.alt = '';
          leaving.src = (dots && current() && second ? second : main).currentSrc;
          media.querySelector('.kodza-product-page__card-leaving')?.remove();
          track.after(leaving);
        }
        if (track) track.scrollLeft = 0;
        main.removeAttribute('srcset');
        main.src = image;
        if (alt != null) main.alt = alt;
        if (second && imageSecond) {
          second.removeAttribute('srcset');
          second.src = imageSecond;
        }
        mark();
        if (!leaving) return;
        try {
          await main.decode();
        } catch {}
        if (turn !== swapping || signal.aborted) return leaving.remove();
        // Wiped away towards the new swatch: the new colour comes from where you clicked
        const out = forward ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)';
        const options = { duration: ms(SWAP), easing: 'cubic-bezier(0.65, 0, 0.35, 1)' };
        play(main, [{ transform: 'scale(1.06)' }, { transform: 'none' }], { ...options, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
        play(leaving, [{ clipPath: 'inset(0 0 0 0)' }, { clipPath: out }], { ...options, fill: 'forwards' })
          .finished.then(() => leaving.remove(), () => leaving.remove());
      };
      swatches.forEach((input) => input.addEventListener('change', () => input.checked && swap(input), { signal }));

      // ---------- Add, and the sizes ----------
      if (!open) return;
      let label = open.querySelector('.kodza-product-page__card-word');
      const first = label?.textContent || '';
      // A word rolling: the old one goes up, the new one comes from below
      // `swap`: the button is out of sight (the sizes are showing), so the word just changes and
      // the button brings it back down: one motion, not a roll inside a slide
      const roll = (text, swap) => {
        if (!label || label.textContent === text) return;
        const next = label.cloneNode(false);
        next.textContent = text;
        const old = label;
        label = next;
        open.querySelectorAll('.kodza-product-page__card-word').forEach((el) => el !== old && el.remove());
        if (still || swap) return old.replaceWith(next);
        open.append(next);
        const options = { duration: ms(ROLL), easing: 'cubic-bezier(0.65, 0, 0.35, 1)' };
        // Far enough to leave its box: 130% of a word alone stays inside a tall button
        const far = `${Math.max(old.offsetHeight * 1.3, (open.clientHeight + old.offsetHeight) / 2 + 2)}px`;
        play(old, [{ transform: 'none' }, { transform: `translateY(-${far})` }], { ...options, fill: 'forwards' })
          .finished.then(() => old.remove(), () => old.remove());
        play(next, [{ transform: `translateY(${far})` }, { transform: 'none' }], options);
      };

      sizes.forEach((size, i) => size.style.setProperty('--kz-product-page-card-i', i));
      const picking = () => root.classList.contains('is-picking');
      const pick = (on, focus) => {
        if (!sizes.length || on === picking()) return;
        root.classList.toggle('is-picking', on);
        open.setAttribute('aria-expanded', String(on));
        if (on && focus) sizes.find((size) => !size.disabled)?.focus({ preventScroll: true });
        // Closed while a size had the focus: it goes back to Add
        if (!on && add.contains(document.activeElement) && document.activeElement !== open) open.focus({ preventScroll: true });
      };
      if (sizes.length) {
        // event.detail is 0 for a click made with the keyboard
        open.addEventListener('click', (event) => pick(true, event.detail === 0), { signal });
        root.addEventListener('pointerleave', (event) => event.pointerType === 'mouse' && pick(false), { signal });
        add.addEventListener('focusout', (event) => {
          if (!add.contains(event.relatedTarget) && event.relatedTarget) pick(false);
        }, { signal });
        add.addEventListener('keydown', (event) => {
          if (!picking()) return;
          if (event.key === 'Escape') {
            event.preventDefault();
            pick(false);
            open.focus({ preventScroll: true });
          } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            const live = sizes.filter((size) => !size.disabled);
            const at = live.indexOf(document.activeElement);
            if (at < 0) return;
            event.preventDefault();
            live[(at + (event.key === 'ArrowRight' ? 1 : live.length - 1)) % live.length].focus();
          }
        }, { signal });
      }

      // In the cart: Added, then Add again. A refused request brings Add back at once
      let back = null;
      root.addEventListener('kodza:cart-add', (event) => {
        if (event.target !== root) return;
        const focused = add.contains(document.activeElement);
        const fromSizes = picking();
        root.classList.add('is-added');
        pick(false);
        if (focused) open.focus({ preventScroll: true });
        roll(word('added'), fromSizes);
        clearTimeout(back);
        timers.delete(back);
        const reset = () => {
          root.classList.remove('is-added');
          roll(first);
        };
        // The platform passes its request to wait() while the event runs: read it just after
        queueMicrotask(() => {
          Promise.resolve(event.detail?.request).then(
            () => !signal.aborted && (back = later(reset, HOLD)),
            () => !signal.aborted && reset(),
          );
        });
      }, { signal });
    }

    return mount;
  })();
  // ---------- Product Card (end) ----------

  // ---------- The page: its parts, and what joins them ----------
  let pages = 0;

  // One page, with its own state: two pages on a screen never mix. Everything it starts is tied to
  // `signal` (listeners get { signal }, timers stop on its 'abort' event), so kodza:destroy stops it
  // all, the parts with it.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const ms = (t) => (still ? 0 : t * pace);
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const q = (name) => root.querySelector(`.kodza-product-page__${name}`);
    const gallery = q('gallery');
    const buy = q('buy');
    const reviews = q('reviews');

    // The photos only listen to this page's buy box: two pages on a screen keep their own colour
    const own = `${buy?.dataset.id || 'product'}:${++pages}`;
    if (gallery) gallery.dataset.product = own;

    // Each part starts as it would on its own, then gets is-ready, which its CSS waits for
    [
      [gallery, mountGallery],
      [buy, mountBuy],
      [reviews, mountReviews],
      ...[...root.querySelectorAll('.kodza-product-page__card')].map((card) => [card, mountCard]),
    ].forEach(([el, start]) => {
      if (!el) return;
      start(el, signal);
      el.classList.add('is-ready');
    });

    // The colour chosen in the buy box, passed on to the photos
    if (gallery && buy) {
      buy.addEventListener('kodza:variant-change', (event) => {
        if (event.target !== buy) return;
        gallery.dispatchEvent(new CustomEvent('kodza:variant-change', { bubbles: true, detail: { ...event.detail, id: own } }));
      }, { signal });
    }

    // The stars under the price: down to the reviews (focus on their title, from the keyboard)
    const stars = q('buy-reviews');
    if (stars && reviews) {
      stars.addEventListener('click', (event) => {
        event.preventDefault();
        reviews.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
        const title = reviews.querySelector('.kodza-product-page__reviews-title');
        if (event.detail === 0 && title) {
          title.setAttribute('tabindex', '-1');
          title.focus({ preventScroll: true });
        }
      }, { signal });
    }

    const bar = q('bar');
    const add = buy?.querySelector('.kodza-product-page__buy-add');
    if (bar && add) mountBar(root, bar, buy, add, { signal, ms, word });
  }

  // ---------- The bar, on a phone ----------
  function mountBar(root, bar, buy, add, { signal, ms, word }) {
    const lang = root.closest('[lang]')?.lang || undefined;
    const money = (cents) => {
      const options = buy.dataset.currency ? { style: 'currency', currency: buy.dataset.currency } : {};
      const digits = cents % 100 ? 2 : 0;
      try {
        return new Intl.NumberFormat(lang, { ...options, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(cents / 100);
      } catch {
        return (cents / 100).toFixed(digits);
      }
    };
    const timers = new Set();
    const moving = new Set();
    const later = (fn, t) => {
      const id = setTimeout(() => {
        timers.delete(id);
        fn();
      }, t);
      timers.add(id);
      return id;
    };
    const play = (el, frames, options) => {
      const animation = el.animate(frames, options);
      moving.add(animation);
      animation.finished.then(() => moving.delete(animation), () => moving.delete(animation));
      return animation;
    };
    let frame = 0;
    signal.addEventListener('abort', () => {
      timers.forEach(clearTimeout);
      moving.forEach((animation) => animation.cancel());
      cancelAnimationFrame(frame);
    });

    // A word rolling in its box: the old one goes up, the new one comes from below (`down`: the
    // other way, for a price that drops). Hidden, the bar just swaps it
    const current = new Map();
    const roll = (box, text, { tick = false, down = false } = {}) => {
      const old = current.get(box) || box?.firstElementChild;
      if (!old || (old.textContent === text && !!old.firstElementChild === tick)) return;
      const next = old.cloneNode(false);
      next.innerHTML = tick ? TICK : '';
      next.append(text);
      current.set(box, next);
      [...box.children].forEach((el) => el !== old && el.remove());
      if (!ms(1) || !bar.classList.contains('is-shown')) return old.replaceWith(next);
      box.append(next);
      const options = { duration: ms(ROLL), easing: 'cubic-bezier(0.65, 0, 0.35, 1)' };
      // Far enough to leave its box: 130% of a word alone stays inside a tall button
      const far = `${Math.max(old.offsetHeight * 1.3, (box.clientHeight + old.offsetHeight) / 2 + 2)}px`;
      const away = down ? far : `-${far}`;
      play(old, [{ transform: 'none' }, { transform: `translateY(${away})` }], { ...options, fill: 'forwards' })
        .finished.then(() => old.remove(), () => old.remove());
      play(next, [{ transform: `translateY(${down ? `-${far}` : far})` }, { transform: 'none' }], options);
    };

    // Up once the buy box's button has left the top of the screen, down again at the end of the page
    const phone = window.matchMedia(`(max-width: ${PHONE}px)`);
    let shown = false;
    bar.inert = true;
    const place = () => {
      const out = phone.matches && add.getBoundingClientRect().bottom < 0 && root.getBoundingClientRect().bottom > window.innerHeight;
      if (out === shown) return;
      shown = out;
      bar.classList.toggle('is-shown', out);
      bar.inert = !out;
    };
    const soon = () => {
      if (!frame) frame = requestAnimationFrame(() => {
        frame = 0;
        place();
      });
    };
    window.addEventListener('scroll', soon, { passive: true, signal });
    window.addEventListener('resize', soon, { passive: true, signal });
    phone.addEventListener('change', soon, { signal });
    place();

    // The variant chosen in the buy box: its options, price and picture
    const variant = bar.querySelector('.kodza-product-page__bar-variant');
    const price = bar.querySelector('.kodza-product-page__bar-price');
    const image = bar.querySelector('.kodza-product-page__bar-image');
    let last = Number(buy.dataset.price) || 0;
    buy.addEventListener('kodza:variant-change', (event) => {
      if (event.target !== buy) return;
      const { options = {}, price: cents, image: src } = event.detail || {};
      const text = Object.values(options).join(' · ');
      if (variant && text) roll(variant, text);
      if (price && cents != null && cents !== last) {
        roll(price, money(cents), { down: cents < last });
        last = cents;
      }
      if (image && src && image.getAttribute('src') !== src) image.src = src;
    }, { signal });

    // Add to cart: the buy box's own form, with its quantity, then Added for a moment
    const button = bar.querySelector('.kodza-product-page__bar-add');
    if (!button) return;
    const first = button.textContent.trim();
    let back = 0;
    button.addEventListener('click', () => buy.requestSubmit(add), { signal });
    buy.addEventListener('kodza:cart-add', (event) => {
      if (event.target !== buy) return;
      roll(button, word('added'), { tick: true });
      clearTimeout(back);
      timers.delete(back);
      const reset = () => roll(button, first);
      // The platform passes its request to wait() while the event runs: read it just after
      queueMicrotask(() => {
        Promise.resolve(event.detail?.request).then(
          () => !signal.aborted && (back = later(reset, HOLD)),
          () => !signal.aborted && reset(),
        );
      });
    }, { signal });
  }

  // Used by the Cart engine: what counts as an add-to-cart form, and its picture
  const FORMS = 'form[action$="/cart/add"], form[data-kodza-cart-add]';
  // The picture of what was added: in the form, or around it, without leaving its own card
  const pictureFor = (source) => {
    for (let el = source, i = 0; el instanceof Element && i < 4; el = el.parentElement, i++) {
      if (i && el.querySelectorAll(FORMS).length > 1) break;
      const img = el.querySelector('img');
      if (img) return img;
    }
    return null;
  };

  // ---------- Cart engine (begin) ----------
  // The same block in every component of the E-commerce family, copied as is: the first one loaded
  // sets up window.kodzaCart, the next ones find it, so three components pasted make one cart.
  // It speaks in events on document, which bubble:
  //   kodza:cart-add     (cancelable) { id, variant, title, options, price, currency, quantity, image, url, wait(promise) }
  //   kodza:cart-update  (cancelable) { key, quantity }, 0 removes the line
  //   kodza:cart-change  the whole cart { items, count, subtotal, currency }, prices in cents
  //   kodza:cart-open    opens the Cart Drawer nearest to where it was sent from
  // Until a platform answers, a small cart kept in localStorage takes the adds. A platform
  // (Shopify, WooCommerce) cancels the add, makes its request, passes the promise to wait(), then
  // sends kodza:cart-change with its own cart: from then on the small cart only listens.
  // An add-to-cart <form action="/cart/add"> (name="id" or "add-to-cart", name="quantity",
  // options[Name]) works without the script; with it, its submit becomes a kodza:cart-add.
  const cart = window.kodzaCart || (window.kodzaCart = (() => {
    const STORE = 'kodza-cart';
    const COUNTS = '.kodza-header-shop__cart, .kodza-add-to-cart__cart, [data-kodza-cart-count]';
    let items = [];
    let listening = false;
    let sending = false;
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (Array.isArray(saved?.items)) items = saved.items;
    } catch {}
    const keyOf = (item) => String(item.key ?? item.variant ?? item.id ?? item.title);
    const whole = (n, fallback) => (Number.isFinite(Number(n)) ? Math.round(Number(n)) : fallback);
    const get = () => {
      const list = items.map((item) => ({ ...item, options: { ...item.options } }));
      return {
        items: list,
        count: list.reduce((n, item) => n + item.quantity, 0),
        subtotal: list.reduce((n, item) => n + item.price * item.quantity, 0),
        currency: list[0]?.currency || '',
      };
    };
    const counts = (n) => document.querySelectorAll(COUNTS).forEach((el) => {
      if (el.dataset.count !== String(n)) el.dataset.count = String(n);
    });
    const send = () => {
      const detail = get();
      counts(detail.count);
      sending = true;
      document.dispatchEvent(new CustomEvent('kodza:cart-change', { detail }));
      sending = false;
      if (!listening) {
        try {
          localStorage.setItem(STORE, JSON.stringify({ items }));
        } catch {}
      }
    };
    const formats = new Map();
    const format = (cents, currency, locale) => {
      const lang = locale || document.documentElement.lang || undefined;
      const id = `${lang}|${currency}`;
      if (!formats.has(id)) {
        try {
          formats.set(id, new Intl.NumberFormat(lang, currency ? { style: 'currency', currency } : { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        } catch {
          formats.set(id, new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        }
      }
      return formats.get(id).format((Number(cents) || 0) / 100);
    };
    const add = (item, source = document) => {
      const detail = { ...item, wait: (promise) => { detail.request = Promise.resolve(promise); } };
      source.dispatchEvent(new CustomEvent('kodza:cart-add', { bubbles: true, cancelable: true, detail }));
      return detail.request || Promise.resolve();
    };
    const update = (key, quantity, source = document) => {
      source.dispatchEvent(new CustomEvent('kodza:cart-update', { bubbles: true, cancelable: true, detail: { key: String(key), quantity } }));
    };
    // The small cart answers last (on window), once the page's own listeners had their say
    window.addEventListener('kodza:cart-add', (event) => {
      if (event.defaultPrevented || listening) return;
      const d = event.detail || {};
      const key = keyOf(d);
      const quantity = Math.max(1, whole(d.quantity, 1));
      const found = items.find((item) => item.key === key);
      if (found) found.quantity = Math.min(99, found.quantity + quantity);
      else {
        const item = {
          key, id: d.id ?? null, variant: d.variant ?? null, title: String(d.title || ''), options: { ...d.options },
          price: whole(d.price, 0), currency: d.currency || items[0]?.currency || '', quantity: Math.min(99, quantity),
          image: d.image || '', url: d.url || '',
        };
        items.splice(Number.isInteger(d.at) ? Math.min(d.at, items.length) : 0, 0, item);
      }
      send();
    });
    window.addEventListener('kodza:cart-update', (event) => {
      if (event.defaultPrevented || listening) return;
      const { key, quantity } = event.detail || {};
      const found = items.find((item) => item.key === String(key));
      if (!found) return;
      const n = Math.max(0, Math.min(99, whole(quantity, found.quantity)));
      if (n) found.quantity = n;
      else items = items.filter((item) => item !== found);
      send();
    });
    // A cart sent from elsewhere: a platform owns it now
    document.addEventListener('kodza:cart-change', (event) => {
      if (sending) return;
      listening = true;
      const d = event.detail || {};
      items = (d.items || []).map((item) => ({ ...item, key: keyOf(item), options: { ...item.options } }));
      counts(Math.max(0, whole(d.count, items.reduce((n, item) => n + item.quantity, 0))));
    });
    // An add-to-cart form sends its add instead of leaving the page
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (event.defaultPrevented || !(form instanceof HTMLFormElement) || !form.matches(FORMS)) return;
      event.preventDefault();
      const data = new FormData(form, event.submitter);
      const options = {};
      data.forEach((value, name) => {
        const match = /^options\[(.+)\]$/.exec(name);
        if (match) options[match[1]] = String(value);
      });
      const id = form.dataset.id || data.get('product-id') || data.get('add-to-cart') || data.get('id');
      const variant = data.get('variation_id') || data.get('id') || [id, ...Object.values(options)].join(' / ');
      const own = form.dataset;
      const picture = own.image ? null : pictureFor(form);
      add({
        id, variant, title: own.title || '', options, price: whole(own.price, 0), currency: own.currency || '',
        quantity: whole(data.get('quantity'), 1), image: own.image || picture?.currentSrc || picture?.src || '', url: own.url || '',
      }, form);
    });
    // Any [data-kodza-cart-open] (a bag link in a header) opens the drawer
    document.addEventListener('click', (event) => {
      const opener = event.target.closest?.('[data-kodza-cart-open]');
      if (!opener) return;
      event.preventDefault();
      opener.dispatchEvent(new CustomEvent('kodza:cart-open', { bubbles: true }));
    });
    const ready = () => counts(get().count);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
    else ready();
    return { get, add, update, format, send };
  })());
  // ---------- Cart engine (end) ----------

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
