// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Scroll Sequence
// The section becomes a track: its stage holds the screen while the scroll runs through it, and the
// script draws the frame that matches the scroll on one canvas. The frames load coarse to fine
// (every eighth first, then the ones between), so a fast scroll shows the nearest frame already
// there, never a blank. Each caption comes in at its own point (data-at, 0 to 1), the rail fills
// and the counter counts. The frames are set on the root: data-frames (how many), data-src (their
// address, {index} standing for 01, 02…) and data-pad (the digits of {index}, those of
// data-frames by default). The pacing is in the constants below. Reduced motion, or a site pace
// of 0: the first picture sits above the captions, and nothing loads.
(() => {
  const SELECTOR = '[data-kodza-scroll-sequence]';
  // The order the frames load in: every 8th, then every 4th, every 2nd, the rest
  const PASSES = [8, 4, 2, 1];
  // How many frames load at once
  const PARALLEL = 6;
  // The frames start loading this far ahead of the section (a share of the screen)
  const AHEAD = '100%';
  // How long the sequence takes to catch up with the scroll, in ms (times the site's pace), in two
  // soft stages like a smooth-scroll library: it picks up gently, and when the wheel stops it slows
  // down on its own instead of stopping with it. 0 glues it to the wheel
  const SMOOTHING = 170;
  // While the scroll runs, the picture blends the two frames around its exact place, so the turn
  // moves on every screen refresh instead of frame by frame. Once the scroll has stood still this
  // long, in ms, it settles on the next whole frame the way it was turning (never back, so it does
  // not shiver as you stop): never a double picture at rest
  const REST = 120;
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

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const stage = root.querySelector('.kodza-scroll-sequence__stage');
    const poster = root.querySelector('.kodza-scroll-sequence__poster');
    const counter = root.querySelector('.kodza-scroll-sequence__counter');
    const rail = root.querySelector('.kodza-scroll-sequence__rail');
    const captions = [...root.querySelectorAll('.kodza-scroll-sequence__caption')];
    const frames = parseInt(root.dataset.frames, 10) || 0;
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    if (still || !stage || frames < 2 || !root.dataset.src?.includes('{index}')) return;
    const smoothing = SMOOTHING * pace;
    const digits = String(frames).length;
    const pad = parseInt(root.dataset.pad, 10) || digits;
    const at = captions.map((caption) => clamp(parseFloat(caption.dataset.at) || 0, 0, 1));
    const total = String(frames).padStart(digits, '0');

    // A dot on the rail where each caption comes in
    const ticks = at.map((point) => {
      const tick = document.createElement('span');
      tick.className = 'kodza-scroll-sequence__tick';
      tick.style.setProperty('--kz-scroll-sequence-at', point);
      rail?.append(tick);
      return tick;
    });
    root.classList.add('is-live');

    const images = new Array(frames).fill(null);
    const loading = new Set();
    let order = [];
    let next = 0;
    let canvas = null;
    let context = null;
    let drawn = -1; // what the canvas shows: a frame, plus the share of the next one over it
    let picture = null; // the place in the sequence drawn: between two frames while it runs
    let leading = null; // the first stage of each glide, the one `current` and `picture` follow
    let turning = null;
    let index = 0; // the frame the scroll asks for
    let target = null; // the progress the scroll asks for, when it last changed, and which way
    let moved = 0;
    let way = 1;
    let held = null; // the whole frame it settled on, kept until the scroll goes past it
    let on = -1; // the caption on now
    let current = null; // the progress written now
    let raf = 0;
    let last = 0;
    let shown = false;

    // The frame asked for if it is there, or the nearest one loaded, the earlier one first
    const nearest = (wanted) => {
      for (let distance = 0; distance < frames; distance += 1) {
        if (images[wanted - distance]) return wanted - distance;
        if (images[wanted + distance]) return wanted + distance;
      }
      return -1;
    };
    const paint = () => {
      if (picture === null) return;
      // The frame under the place drawn, and the share of the next one, in steps of 1/32
      let frame = Math.floor(picture);
      let share = Math.round((picture - frame) * 64) / 64;
      if (share === 1) {
        frame += 1;
        share = 0;
      }
      // Both frames not in yet: the nearest one loaded, alone
      if (!images[frame] || (share && !images[frame + 1])) {
        frame = nearest(Math.round(picture));
        share = 0;
      }
      if (frame < 0 || frame + share === drawn) return;
      const image = images[frame];
      if (!canvas) {
        // Sized on the first frame in: the CSS fits it to the stage like the picture under it
        canvas = document.createElement('canvas');
        canvas.className = 'kodza-scroll-sequence__canvas';
        canvas.setAttribute('aria-hidden', 'true');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        context = canvas.getContext('2d');
        if (poster) poster.after(canvas);
        else stage.prepend(canvas);
        root.classList.add('is-drawn');
      }
      context.globalAlpha = 1;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      if (share) {
        context.globalAlpha = share;
        context.drawImage(images[frame + 1], 0, 0, canvas.width, canvas.height);
        context.globalAlpha = 1;
      }
      drawn = frame + share;
    };
    const pump = () => {
      const pattern = root.dataset.src;
      while (loading.size < PARALLEL && next < order.length) {
        const frame = order[next];
        next += 1;
        const image = new Image();
        image.decoding = 'async';
        image.src = pattern.replace('{index}', String(frame + 1).padStart(pad, '0'));
        loading.add(image);
        image.decode().then(() => {
          if (signal.aborted) return;
          images[frame] = image;
          paint();
        }, () => {}).finally(() => {
          loading.delete(image);
          if (!signal.aborted) pump();
        });
      }
    };
    const load = () => {
      if (order.length) return;
      const queued = new Set();
      PASSES.forEach((step) => {
        for (let frame = 0; frame < frames; frame += step) queued.add(frame);
      });
      queued.add(frames - 1);
      order = [...queued];
      pump();
    };

    // The track: 0 as the stage reaches the top of the screen, 1 as it lets go
    const goal = () => {
      const box = root.getBoundingClientRect();
      const span = box.height - stage.getBoundingClientRect().height;
      return span > 0 ? clamp(-box.top / span, 0, 1) : 0;
    };
    const write = () => {
      root.style.setProperty('--kz-scroll-sequence-progress', current.toFixed(4));
      index = Math.round(current * (frames - 1));
      if (counter) counter.textContent = `${String(index + 1).padStart(digits, '0')} / ${total}`;
      paint();
      // The caption on is the last one whose point is passed
      let now = 0;
      at.forEach((point, i) => {
        if (current >= point - SETTLE) now = i;
      });
      ticks.forEach((tick, i) => tick.classList.toggle('is-passed', current >= at[i] - SETTLE));
      if (now === on) return;
      on = now;
      captions.forEach((caption, i) => {
        caption.classList.toggle('is-current', i === now);
        caption.classList.toggle('is-past', i < now);
      });
    };
    const tick = (time) => {
      raf = 0;
      const to = goal();
      const frame = last ? Math.min(time - last, 64) : 16.7;
      last = time;
      if (to !== target) {
        if (target !== null) way = Math.sign(to - target);
        target = to;
        moved = time;
      }
      const ease = 1 - Math.exp(-frame / smoothing);
      if (current === null || !smoothing) leading = current = to;
      else {
        leading += (to - leading) * ease;
        current += (leading - current) * ease;
      }
      if (Math.abs(to - current) < SETTLE && Math.abs(to - leading) < SETTLE) leading = current = to;
      // The picture follows the same glide, between two frames, then on to a whole one at rest. It
      // waits there while the scroll picks up the same way, so the turn never steps back
      const exact = to * (frames - 1);
      const resting = time - moved >= REST;
      if (resting) held = way < 0 ? Math.floor(exact + 0.001) : Math.ceil(exact - 0.001);
      else if (held !== null && (way < 0 ? exact <= held : exact >= held)) held = null;
      const aim = !smoothing ? Math.round(exact) : held ?? exact;
      if (picture === null || !smoothing) turning = picture = aim;
      else {
        turning += (aim - turning) * ease;
        picture += (turning - picture) * ease;
      }
      if (Math.abs(aim - picture) < 0.01 && Math.abs(aim - turning) < 0.01) turning = picture = aim;
      write();
      if (current !== to || picture !== aim || !resting) raf = requestAnimationFrame(tick);
      else last = 0;
    };
    const queue = () => {
      if (!shown || raf) return;
      raf = requestAnimationFrame(tick);
    };
    const place = () => {
      current = goal();
      target = current;
      picture = Math.round(current * (frames - 1));
      held = picture;
      leading = current;
      turning = picture;
      write();
    };

    // Placed before it first shows, so the captions do not roll in front of you on load
    place();

    // Focus landing in a caption that is not on (a link in its text, from the keyboard): the page
    // scrolls to where that caption comes in
    root.addEventListener('focusin', (event) => {
      const i = captions.findIndex((caption) => caption.contains(event.target));
      if (i < 0 || i === on) return;
      const box = root.getBoundingClientRect();
      const span = box.height - stage.getBoundingClientRect().height;
      window.scrollTo({ top: scrollY + box.top + at[i] * span, behavior: 'instant' });
      place();
    }, { signal });

    const io = new IntersectionObserver(([entry]) => {
      shown = entry.isIntersecting;
      if (!shown) return;
      load();
      place(); // back on screen after a jump (an anchor, Home): placed, not chased
    }, { rootMargin: `${AHEAD} 0px` });
    io.observe(root);
    const resize = new ResizeObserver(queue);
    resize.observe(stage);
    window.addEventListener('scroll', queue, { passive: true, signal });
    window.addEventListener('resize', queue, { signal });
    signal.addEventListener('abort', () => {
      io.disconnect();
      resize.disconnect();
      cancelAnimationFrame(raf);
      // Downloads still running stop, and the frames go with the instance
      loading.forEach((image) => image.removeAttribute('src'));
      loading.clear();
      images.fill(null);
      canvas?.remove();
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
