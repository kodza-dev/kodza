// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Image Split Cards
// The section becomes a track: its stage sticks in the middle of the screen while the scroll runs
// through it, and the script writes two things from that scroll. First how far the pieces have
// parted (the picture splits along the gaps, the inner corners round off), then each card's turn,
// one after the other, with a little lift and shade, its text arriving once it faces you. The
// pacing is in the constants below. Reduced motion, or a site pace of 0: the picture sits above
// the cards, which show their text, and nothing turns.
(() => {
  const SELECTOR = '[data-kodza-image-split-cards]';
  // The track starts once the section's top is this far down the screen (a share of its height):
  // the pieces start parting as the stage settles, not after
  const LEAD = 0.2;
  // Share of the track the pieces take to part
  const SPLIT = 0.22;
  // When the first card starts turning, and when the last one lies flat: the rest of the track is
  // a short hold, to read the last card before the section moves on
  const TURN_FROM = 0.18;
  const TURN_TO = 0.92;
  // Share of the track one turn takes. Longer than the step between two cards, so they overlap
  const TURN = 0.34;
  // The depth of the turn (CSS perspective, px), how much a card grows halfway through it, and how
  // dark it gets edge-on
  const PERSPECTIVE = 1200;
  const LIFT = 0.04;
  const SHADE = 0.32;
  // At rest the pieces overlap by this much (px): edges that meet on a fraction of a pixel would let
  // a hairline of the page show between them
  const SEAM = 1;
  // How long the cards take to catch up with the scroll, in ms (times the site's pace): a soft
  // follow instead of cards glued to the wheel. 0 glues them
  const SMOOTHING = 120;
  // The progress left to travel below this ends the loop
  const SETTLE = 0.0005;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  // Slow off the mark, slow into place
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const stage = root.querySelector('.kodza-image-split-cards__stage');
    const image = root.querySelector('.kodza-image-split-cards__image');
    const cards = [...root.querySelectorAll('.kodza-image-split-cards__card')];
    if (!stage || !cards.length) return;
    // Each card's content goes into its back face, the side that turns up
    cards.forEach((card) => {
      const back = document.createElement('div');
      back.className = 'kodza-image-split-cards__back';
      back.append(...card.childNodes);
      card.append(back);
    });

    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    if (still || !image || cards.length < 2) return;
    const smoothing = SMOOTHING * pace;
    const count = cards.length;
    const step = (TURN_TO - TURN_FROM - TURN) / (count - 1);

    // Each card gets a front face with the picture, offset to show its own slice: the first one
    // takes the image as written (and its alt), the others a silent copy
    root.style.setProperty('--kz-image-split-cards-n', count);
    cards.forEach((card, index) => {
      const front = document.createElement('div');
      front.className = 'kodza-image-split-cards__front';
      const slice = index ? image.cloneNode() : image;
      if (index) {
        slice.alt = '';
        slice.setAttribute('aria-hidden', 'true');
      }
      front.append(slice);
      card.style.setProperty('--kz-image-split-cards-i', index);
      card.prepend(front);
    });
    root.classList.add('is-live');

    let stacked = false;
    let gap = 0;
    let top = 0; // where the stage sticks: 0, or above the screen when it is taller than it
    let current = null; // the progress written now
    let raf = 0;
    let last = 0;
    let shown = false;

    // Side by side or stacked, and the gap to close at rest. Read in layout pixels, which the
    // cards' own transforms (and a scaled parent) leave alone
    const measure = () => {
      const [first, second] = cards;
      stacked = second.offsetTop > first.offsetTop + first.offsetHeight / 2;
      root.classList.toggle('is-stacked', stacked);
      gap = stacked
        ? second.offsetTop - first.offsetTop - first.offsetHeight
        : second.offsetLeft - first.offsetLeft - first.offsetWidth;
      // A stage taller than the screen sticks by its bottom edge, so all of it shows
      stage.style.top = '';
      top = Math.min(0, innerHeight - stage.getBoundingClientRect().height);
      stage.style.top = `${top}px`;
    };
    // The track: 0 once the section's top is LEAD down the screen, 1 as the stage lets go. A section
    // that already sits higher than that on load (it opens the page) starts whole, at the top
    const lead = () => Math.min(innerHeight * LEAD, Math.max(0, root.getBoundingClientRect().top + scrollY));
    const span = () => root.getBoundingClientRect().height - stage.getBoundingClientRect().height + lead() - top;
    const goal = () => clamp((lead() - root.getBoundingClientRect().top) / span(), 0, 1);
    const write = () => {
      const split = ease(clamp(current / SPLIT, 0, 1));
      root.style.setProperty('--kz-image-split-cards-split', split.toFixed(4));
      cards.forEach((card, index) => {
        // At rest the pieces close the gaps around the middle one, so the picture reads whole
        const shift = (gap + SEAM) * ((count - 1) / 2 - index) * (1 - split);
        const turn = ease(clamp((current - TURN_FROM - index * step) / TURN, 0, 1));
        const angle = 180 * turn;
        const arc = Math.sin(turn * Math.PI);
        const move = stacked ? `translate3d(0, ${shift.toFixed(2)}px, 0)` : `translate3d(${shift.toFixed(2)}px, 0, 0)`;
        const rotate = stacked ? `rotateX(${(-angle).toFixed(2)}deg)` : `rotateY(${angle.toFixed(2)}deg)`;
        card.style.transform = `${move} perspective(${PERSPECTIVE}px) ${rotate} scale(${(1 + LIFT * arc).toFixed(4)})`;
        card.style.setProperty('--kz-image-split-cards-turn', (SHADE * arc).toFixed(3));
        card.style.setProperty('--kz-image-split-cards-reveal', clamp((angle - 100) / 70, 0, 1).toFixed(3));
      });
    };
    const tick = (now) => {
      raf = 0;
      const to = goal();
      const frame = last ? Math.min(now - last, 64) : 16.7;
      last = now;
      if (current === null || !smoothing) current = to;
      else current += (to - current) * (1 - Math.exp(-frame / smoothing));
      if (Math.abs(to - current) < SETTLE) current = to;
      write();
      if (current !== to) raf = requestAnimationFrame(tick);
      else last = 0;
    };
    const queue = () => {
      if (!shown || raf) return;
      raf = requestAnimationFrame(tick);
    };
    const place = () => {
      current = goal();
      write();
    };

    // Placed before it first shows, so nothing turns in front of you on load
    measure();
    place();

    // Focus landing in a card that has not turned yet (a link in its text, from the keyboard):
    // the page scrolls to where that card faces you
    root.addEventListener('focusin', (event) => {
      const index = cards.findIndex((card) => card.contains(event.target));
      const end = TURN_FROM + index * step + TURN;
      if (index < 0 || current >= end) return;
      window.scrollTo({ top: scrollY + root.getBoundingClientRect().top - lead() + end * span(), behavior: 'instant' });
      place();
    }, { signal });

    const io = new IntersectionObserver(([entry]) => {
      shown = entry.isIntersecting;
      if (shown) place(); // back on screen after a jump (an anchor, Home): placed, not chased
    });
    io.observe(root);
    const resize = new ResizeObserver(() => {
      measure();
      queue();
    });
    resize.observe(stage);
    window.addEventListener('scroll', queue, { passive: true, signal });
    window.addEventListener('resize', () => {
      measure();
      queue();
    }, { signal });
    signal.addEventListener('abort', () => {
      io.disconnect();
      resize.disconnect();
      cancelAnimationFrame(raf);
    });
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
