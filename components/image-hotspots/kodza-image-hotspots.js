// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Image Hotspots
// Puts a point on the picture for every note of the list, where data-x and data-y say (percent of
// the picture, cropped or not), and opens one card for them all: from a point to the next it
// glides there, its height following, while its text rolls. A point cropped out of the frame is
// dropped. The settings are the constants under SELECTOR.
(() => {
  const SELECTOR = '.kodza-image-hotspots';
  const GAP = 14; // px between a point and the tip of the card's arrow
  const EDGE = 12; // px kept between the card and the sides of the picture
  const ARROW_INSET = 22; // px, the arrow never gets closer than this to a corner of the card
  const GLIDE = 480; // ms, the card gliding from a point to the next
  const OPEN = 320; // ms, the card growing out of its point
  const CLOSE = 170; // ms, the card leaving
  const ROLL_OUT = 200; // ms, the old text rising out
  const ROLL_IN = 420; // ms, the new text coming up, once the old one is gone
  const ROLL = 22; // px the texts travel as they roll
  const STAGGER = 70; // ms between two points coming in, the first time the picture is seen
  const ARRIVE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const MOVE = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const LEAVE = 'cubic-bezier(0.4, 0, 1, 1)';
  // Every text the script writes, in English. Each one can be set per instance with a data-text-*
  // attribute (data-text-spot="Point {n}"), {names} stand for the values
  const WORDS = {
    spot: 'Hotspot {n}', // the name of a point whose note has no title
  };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const fill = (text, values) => text.replace(/\{(\w+)\}/g, (all, name) => (name in values ? values[name] : all));
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const make = (tag, name) => Object.assign(document.createElement(tag), { className: `kodza-image-hotspots__${name}` });
  let uid = 0;

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const frame = root.querySelector('.kodza-image-hotspots__frame');
    const image = frame?.querySelector('.kodza-image-hotspots__image');
    const list = root.querySelector('.kodza-image-hotspots__list');
    const spots = list ? [...list.children].filter((li) => li.matches('.kodza-image-hotspots__spot')) : [];
    if (!frame || !image || !spots.length) return;

    const id = `kodza-image-hotspots-${++uid}`;
    const card = make('div', 'card');
    const arrow = make('span', 'arrow');
    const body = make('div', 'body');
    card.id = id;
    card.hidden = true;
    card.setAttribute('role', 'dialog');
    arrow.setAttribute('aria-hidden', 'true');
    body.append(list);
    card.append(arrow, body);

    const dots = spots.map((spot, i) => {
      spot.hidden = true;
      const title = spot.querySelector('.kodza-image-hotspots__title');
      if (title) title.id = `${id}-title-${i}`;
      const dot = make('button', 'dot');
      dot.type = 'button';
      dot.setAttribute('aria-label', title?.textContent.trim() || fill(word('spot'), { n: i + 1 }));
      dot.setAttribute('aria-controls', id);
      dot.setAttribute('aria-expanded', 'false');
      frame.append(dot);
      return dot;
    });
    frame.append(card);

    // Where a point of the picture lands in the frame, once object-fit and object-position are applied
    let points = [];
    const measure = () => {
      const w = image.offsetWidth;
      const h = image.offsetHeight;
      const nw = image.naturalWidth || +image.getAttribute('width') || w;
      const nh = image.naturalHeight || +image.getAttribute('height') || h;
      const style = getComputedStyle(image);
      let sx = w / nw;
      let sy = h / nh;
      if (style.objectFit === 'cover') sx = sy = Math.max(sx, sy);
      else if (style.objectFit === 'contain') sx = sy = Math.min(sx, sy);
      else if (style.objectFit === 'none') sx = sy = 1;
      else if (style.objectFit === 'scale-down') sx = sy = Math.min(1, sx, sy);
      const [px = '50%', py = '50%'] = style.objectPosition.split(' ');
      const offset = (value, free) => (value.endsWith('%') ? (free * parseFloat(value)) / 100 : parseFloat(value) || 0);
      const left = image.offsetLeft + offset(px, w - nw * sx);
      const top = image.offsetTop + offset(py, h - nh * sy);
      points = spots.map((spot) => {
        const x = left + ((parseFloat(spot.dataset.x) || 0) / 100) * nw * sx;
        const y = top + ((parseFloat(spot.dataset.y) || 0) / 100) * nh * sy;
        const inside = x >= image.offsetLeft && x <= image.offsetLeft + w && y >= image.offsetTop && y <= image.offsetTop + h;
        return { x, y, inside };
      });
      dots.forEach((dot, i) => {
        dot.style.left = `${points[i].x}px`;
        dot.style.top = `${points[i].y}px`;
        dot.hidden = !points[i].inside;
      });
    };

    // Where the card goes for point i: above it when there is room, below otherwise, kept
    // between the sides of the picture with its arrow still on the point
    const place = (i) => {
      const { x: px, y: py } = points[i];
      const w = card.offsetWidth;
      const h = spots[i].offsetHeight;
      const r = dots[i].offsetHeight / 2;
      const room = frame.clientHeight;
      const up = py - r - GAP - h >= EDGE;
      const down = py + r + GAP + h <= room - EDGE;
      const side = up || (!down && py > room - py) ? 'above' : 'below';
      const x = clamp(px - w / 2, EDGE, Math.max(EDGE, frame.clientWidth - EDGE - w));
      const y = side === 'above' ? py - r - GAP - h : py + r + GAP;
      return { x, y, h, side, arrow: clamp(px - x, ARROW_INSET, w - ARROW_INSET) };
    };
    const set = (spot) => {
      card.style.translate = `${spot.x}px ${spot.y}px`;
      card.style.transformOrigin = `${spot.arrow}px ${spot.side === 'above' ? '100%' : '0'}`;
      card.style.setProperty('--kz-image-hotspots-arrow', `${spot.arrow}px`);
      card.dataset.side = spot.side;
    };
    // Where the card is now, even halfway through a glide, in the frame's own pixels
    const now = () => {
      const f = frame.getBoundingClientRect();
      const c = card.getBoundingClientRect();
      const b = body.getBoundingClientRect();
      const scale = f.width / frame.offsetWidth || 1;
      return { x: (c.left - f.left) / scale, y: (c.top - f.top) / scale, h: b.height / scale };
    };

    let active = -1;
    let running = [];
    const play = (el, frames, options) => {
      const animation = el.animate(frames, { ...options, duration: options.duration * pace, delay: (options.delay || 0) * pace });
      running.push(animation);
      return animation;
    };
    const halt = () => {
      running.forEach((animation) => animation.cancel());
      running = [];
    };

    const open = (i) => {
      if (i === active) return close(false);
      const before = active >= 0 && !card.hidden ? now() : null;
      // A text caught mid-roll leaves from where it is
      const leaving = active >= 0 ? spots[active] : null;
      const from = leaving && { opacity: getComputedStyle(leaving).opacity, transform: getComputedStyle(leaving).transform };
      halt();
      if (active >= 0) {
        dots[active].classList.remove('is-active');
        dots[active].setAttribute('aria-expanded', 'false');
      }
      active = i;
      const dot = dots[i];
      dot.classList.add('is-active');
      dot.setAttribute('aria-expanded', 'true');
      // Right after its point, so Tab goes from the point into its card
      if (dot.nextSibling !== card) frame.insertBefore(card, dot.nextSibling);
      spots.forEach((spot, k) => { spot.hidden = k !== i && spot !== leaving; });
      spots[i].hidden = false;
      const title = spots[i].querySelector('.kodza-image-hotspots__title');
      if (title) card.setAttribute('aria-labelledby', title.id);
      else card.setAttribute('aria-label', dot.getAttribute('aria-label'));
      card.hidden = false;
      const to = place(i);
      const flipped = before && card.dataset.side !== to.side;
      set(to);

      if (still || !before) {
        if (leaving) leaving.hidden = true;
        if (still) return;
        const lift = to.side === 'above' ? 6 : -6;
        play(card, [
          { opacity: 0, transform: `translateY(${lift}px) scale(0.92)` },
          { opacity: 1, transform: 'none' },
        ], { duration: OPEN, easing: ARRIVE });
        return;
      }

      play(card, [{ translate: `${before.x}px ${before.y}px` }, { translate: `${to.x}px ${to.y}px` }], { duration: GLIDE, easing: MOVE });
      play(body, [{ height: `${before.h}px` }, { height: `${to.h}px` }], { duration: GLIDE, easing: MOVE });
      if (flipped) play(arrow, [{ opacity: 0 }, { opacity: 1 }], { duration: GLIDE / 2, delay: GLIDE / 2, easing: 'ease', fill: 'backwards' });
      if (leaving && leaving !== spots[i]) {
        leaving.inert = true;
        play(leaving, [from, { opacity: 0, offset: 0.7 }, { opacity: 0, transform: `translateY(${-ROLL}px)` }], { duration: ROLL_OUT, easing: LEAVE })
          .finished.then(() => { leaving.hidden = true; leaving.inert = false; }, () => { leaving.inert = false; });
      }
      play(spots[i], [
        { opacity: 0, transform: `translateY(${ROLL}px)` },
        { opacity: 1, transform: 'none' },
      ], { duration: ROLL_IN, delay: ROLL_OUT, easing: ARRIVE, fill: 'backwards' });
    };

    const close = (refocus) => {
      if (active < 0) return;
      const dot = dots[active];
      active = -1;
      dot.classList.remove('is-active');
      dot.setAttribute('aria-expanded', 'false');
      if (refocus) dot.focus();
      const done = () => {
        if (active >= 0) return;
        card.hidden = true;
        spots.forEach((spot) => { spot.hidden = true; spot.inert = false; });
      };
      const opacity = getComputedStyle(card).opacity;
      halt();
      if (still || card.hidden) return done();
      play(card, [{ opacity }, { opacity: 0, transform: 'scale(0.96)' }], { duration: CLOSE, easing: LEAVE })
        .finished.then(done, () => {});
    };

    dots.forEach((dot, i) => dot.addEventListener('click', () => open(i), { signal }));
    document.addEventListener('pointerdown', (event) => {
      if (active < 0 || card.contains(event.target) || dots.includes(event.target.closest?.('.kodza-image-hotspots__dot'))) return;
      close(false);
    }, { signal });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || active < 0) return;
      const focus = document.activeElement;
      const inside = root.contains(focus);
      if (!inside && focus && focus !== document.body) return;
      close(inside);
    }, { signal });

    // The points follow the picture as it resizes, and the open card with them
    const relayout = () => {
      measure();
      if (active < 0) return;
      if (!points[active].inside) return close(false);
      halt();
      if (running.length === 0) set(place(active));
    };
    measure();
    image.addEventListener('load', relayout, { signal });
    const resize = new ResizeObserver(relayout);
    resize.observe(frame);
    signal.addEventListener('abort', () => resize.disconnect());

    // The first time the picture is seen, the points come in one after another
    if (still || !('IntersectionObserver' in window)) return;
    dots.forEach((dot) => { dot.style.opacity = '0'; });
    const seen = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      seen.disconnect();
      dots.forEach((dot, i) => {
        dot.style.opacity = '';
        dot.animate([
          { opacity: 0, transform: 'scale(0.4)' },
          { opacity: 1, transform: 'none' },
        ], { duration: 520 * pace, delay: i * STAGGER * pace, easing: ARRIVE, fill: 'backwards' });
      });
    }, { threshold: 0.35 });
    seen.observe(frame);
    signal.addEventListener('abort', () => seen.disconnect());
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
