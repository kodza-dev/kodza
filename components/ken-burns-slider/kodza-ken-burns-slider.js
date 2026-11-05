// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Ken Burns Slider
// A slideshow behind words that stay put. Each photo drifts slowly toward its point of interest
// (data-focus="60% 62%" on the slide, in percent of the photo), never far enough to show an edge;
// once its time is up, the next photo is uncovered by a slow curtain travelling the way the last
// one drifts, while that one is still moving and is pushed along. The thin line fills over each
// photo's time and empties as it turns, and the count rolls with it. It all waits while paused,
// out of view, in a hidden tab, or while a link inside holds the keyboard focus. With reduced
// motion, the first photo simply stays. "kodza:replay" starts again from the first photo.
// Tune it with the --kz-ken-burns-slider-* variables in the CSS, data-interval (ms) on the root
// and the constants below.
(() => {
  const SELECTOR = '.kodza-ken-burns-slider';
  const DWELL = 6000; // ms each photo stays, unless data-interval says otherwise (a wait: the pace leaves it)
  const CURTAIN = 1600; // ms, the next photo uncovered while the last one is pushed along
  const CURTAIN_EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const PUSH = 8; // %, how far the curtain pushes the photo it covers
  const ZOOM_FROM = 1.04; // the drift starts at this scale...
  const ZOOM_TO = 1.16; // ...and ends at this one, its point of interest pulled toward the middle
  const ROLL = 700; // ms, the count rolling to the next number
  const ROLL_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };

  const pad = (n) => String(n).padStart(2, '0');
  // A photo ready to show: loaded and decoded (a lazy one is asked for now)
  const ready = (img) => {
    img.loading = 'eager';
    return img.decode().catch(() => {});
  };
  // The point of interest, from 0 to 1 on each axis (the middle when not given)
  const focusOf = (slide) => {
    const [x = 50, y = 50] = (slide.dataset.focus || '').split(/\s+/).map(parseFloat).filter((n) => !Number.isNaN(n));
    const unit = (n) => Math.min(100, Math.max(0, n)) / 100;
    return { x: unit(x), y: unit(y) };
  };
  // How far the drift moves the photo on one axis, in parts of its size: the point of interest
  // toward the middle, as far as the zoom covers. Both bounds hold all along the way, so no edge
  // ever shows, and the curtain travels the same way.
  const reach = (o) => {
    const room = (ZOOM_TO - 1) * 0.96; // a hair inside the edge, for rounding
    return Math.min(o * room, Math.max(-(1 - o) * room, 0.5 - o));
  };
  // The curtain for each way: where the next photo starts uncovered from, and the push of the last
  const WAYS = {
    left: { from: 'inset(0 0 0 100%)', push: `translate(-${PUSH}%, 0)` },
    right: { from: 'inset(0 100% 0 0)', push: `translate(${PUSH}%, 0)` },
    up: { from: 'inset(100% 0 0 0)', push: `translate(0, -${PUSH}%)` },
    down: { from: 'inset(0 0 100% 0)', push: `translate(0, ${PUSH}%)` },
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const list = root.querySelector('.kodza-ken-burns-slider__slides');
    const slides = list ? [...list.children].filter((el) => el.matches('.kodza-ken-burns-slider__slide')) : [];
    const images = slides.map((slide) => slide.querySelector('img'));
    const count = root.querySelector('.kodza-ken-burns-slider__index');
    const total = root.querySelector('.kodza-ken-burns-slider__total');
    const fill = root.querySelector('.kodza-ken-burns-slider__fill');
    const button = root.querySelector('.kodza-ken-burns-slider__pause');
    const interval = parseInt(root.dataset.interval, 10) || DWELL;
    if (!slides.length || images.some((img) => !img)) return;

    // Every photo framed on its point of interest, moving or not
    const focus = slides.map(focusOf);
    images.forEach((img, i) => {
      const at = `${focus[i].x * 100}% ${focus[i].y * 100}%`;
      img.style.objectPosition = at;
      img.style.transformOrigin = at;
    });
    const first = Math.max(0, slides.findIndex((slide) => slide.classList.contains('is-current')));
    // The still path: no motion asked, by the visitor or the site, or a single photo
    if (reduceMotion || !pace || slides.length < 2) {
      root.classList.add('is-still');
      slides.forEach((slide, i) => slide.classList.toggle('is-current', i === first));
      return;
    }
    if (total) total.textContent = pad(slides.length);

    // Every animation in play, paused and played again together
    const running = new Set();
    let visible = false;
    let focused = false;
    let held = false;
    const waiting = () => held || focused || !visible || document.hidden;
    const animate = (el, keyframes, options) => {
      const animation = el.animate(keyframes, options);
      running.add(animation);
      const drop = () => running.delete(animation);
      animation.finished.then(drop, drop);
      if (waiting()) animation.pause();
      return animation;
    };
    const sync = () => {
      const wait = waiting();
      running.forEach((animation) => {
        if (wait && animation.playState === 'running') animation.pause();
        if (!wait && animation.playState === 'paused') animation.play();
      });
    };

    // The drift: steady like a camera on rails, long enough to keep moving under the next curtain
    const drifts = new Map();
    const drift = (i) => {
      const [x, y] = [reach(focus[i].x), reach(focus[i].y)];
      drifts.set(i, animate(images[i], [
        { transform: `translate(0%, 0%) scale(${ZOOM_FROM})` },
        { transform: `translate(${x * 100}%, ${y * 100}%) scale(${ZOOM_TO})` },
      ], { duration: interval + 3 * CURTAIN * pace, easing: 'linear', fill: 'forwards' }));
    };
    // The way a photo drifts on screen: its larger move, in pixels
    const wayOf = (i) => {
      const x = reach(focus[i].x) * root.offsetWidth;
      const y = reach(focus[i].y) * root.offsetHeight;
      if (Math.max(Math.abs(x), Math.abs(y)) < 4) return 'left';
      if (Math.abs(x) >= Math.abs(y)) return x < 0 ? 'left' : 'right';
      return y < 0 ? 'up' : 'down';
    };

    const roll = (text) => {
      if (!count) return;
      const old = count.lastElementChild;
      const digits = Object.assign(document.createElement('span'), { textContent: text });
      count.append(digits);
      const timing = { duration: ROLL * pace, easing: ROLL_EASE };
      if (old) animate(old, [{ transform: 'none' }, { transform: 'translateY(-100%)' }], { ...timing, fill: 'forwards' }).finished.then(() => old.remove(), () => {});
      animate(digits, [{ transform: 'translateY(100%)' }, { transform: 'none' }], timing);
    };

    let index = first;
    let round = 0; // a replay or a destroy starts a new round: the old one's promises stop there
    const next = async (at, filled) => {
      const from = index;
      const to = (index + 1) % slides.length;
      // The photo is ready before anything moves: the curtain never uncovers an empty frame
      await ready(images[to]);
      if (at !== round) return;
      index = to;
      const [leaving, coming] = [slides[from], slides[to]];
      const way = WAYS[wayOf(from)];
      const timing = { duration: CURTAIN * pace, easing: CURTAIN_EASE };
      leaving.classList.add('is-leaving');
      leaving.classList.remove('is-current');
      coming.classList.add('is-current');
      drift(to);
      const opened = animate(coming, [{ clipPath: way.from }, { clipPath: 'inset(0)' }], timing);
      const pushed = animate(leaving, [{ transform: 'none' }, { transform: way.push }], { ...timing, fill: 'forwards' });
      // The line empties forward as the photo turns
      const emptied = fill ? animate(fill, [{ transform: 'none' }, { transform: 'translateX(100%)' }], { ...timing, fill: 'forwards' }) : null;
      filled.cancel();
      roll(pad(to + 1));
      // The photo after it starts loading now, well before its turn
      ready(images[(to + 1) % slides.length]);
      if (!(await opened.finished.then(() => true, () => false)) || at !== round) return;
      leaving.classList.remove('is-leaving');
      pushed.cancel();
      drifts.get(from)?.cancel();
      drifts.delete(from);
      emptied?.cancel();
      tick(at);
    };
    // The timer is the line itself: it fills over the photo's time, then the photo turns
    const tick = (at) => {
      // (no line in the markup: an empty animation keeps the time, and pauses like the rest)
      const filled = animate(fill || root, fill ? [{ transform: 'translateX(-100%)' }, { transform: 'none' }] : [], { duration: interval, easing: 'linear', fill: 'forwards' });
      filled.finished.then(() => at === round && next(at, filled), () => {});
    };

    const start = () => {
      round += 1;
      running.forEach((animation) => animation.cancel());
      running.clear();
      drifts.clear();
      index = first;
      slides.forEach((slide, i) => {
        slide.classList.toggle('is-current', i === first);
        slide.classList.remove('is-leaving');
      });
      count?.replaceChildren(Object.assign(document.createElement('span'), { textContent: pad(first + 1) }));
      drift(first);
      tick(round);
      ready(images[(first + 1) % slides.length]);
    };

    button?.addEventListener('click', () => {
      held = !held;
      button.setAttribute('aria-pressed', String(held));
      sync();
    }, { signal });
    // A link reached with the keyboard holds the slideshow; the pause button has its own say
    root.addEventListener('focusin', (event) => {
      focused = event.target !== button && event.target.matches(':focus-visible');
      sync();
    }, { signal });
    root.addEventListener('focusout', (event) => {
      if (!root.contains(event.relatedTarget)) focused = false;
      sync();
    }, { signal });
    document.addEventListener('visibilitychange', sync, { signal });
    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    seen.observe(root);
    root.addEventListener('kodza:replay', start, { signal });
    signal.addEventListener('abort', () => {
      round += 1;
      seen.disconnect();
      running.forEach((animation) => animation.cancel());
      running.clear();
    });

    // The first photo drifts once it is there
    ready(images[first]).then(() => signal.aborted || start());
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
