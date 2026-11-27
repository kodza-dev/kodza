// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Listing Card
// Each photo sweeps over the one before, from the side you go to: its picture settles from a
// little further and a little closer, while the old one is pushed back into the shade. Swipe the
// photos and the sweep follows the finger (let go past a third, or flick, and it lands; otherwise
// it falls back). The arrows come in from the edges under the pointer; the arrow keys work on the
// photos (Home and End go to either end), and so does a sideways trackpad swipe. The dots stretch
// from one photo to the next, front first. A hidden line tells screen readers which photo they are
// on. The heart fills with ink when you save the place, "Saved" opens beside it for a moment, and
// the ink drains when you take it back.
// The whole card is one link: a plain click on a photo opens it, a swipe or the arrows never do.
// "kodza:like" bubbles from the heart and can be cancelled: pass your request to
// event.detail.wait(promise); if it rejects, the heart drains again and says so. Set aria-pressed
// on the heart from your code and it follows.
// Tune it with the --kz-listing-card-* variables (component.css), the words with data-text-* on
// the root (data-text-flag, data-text-saved, data-text-unsaved, data-text-refused, data-text-photo
// with {n} and {total}), and the timings and distances with the constants below.
(() => {
  const SELECTOR = '[data-kodza-listing-card]';
  const WORDS = {
    flag: 'Saved',
    saved: 'Saved to your list',
    unsaved: 'Removed from your list',
    refused: 'Not saved. Try again.',
    photo: 'Photo {n} of {total}',
  };
  const SLIDE_TIME = 860; // ms for a photo to sweep over the last one
  const SLIDE_EASE = [0.76, 0, 0.24, 1]; // its cubic-bezier
  const SETTLE_TIME = 520; // ms to land, or fall back, once the finger lets go
  const SETTLE_EASE = [0.22, 1, 0.36, 1];
  const SHIFT = 28; // % the new picture travels inside its sweep
  const ZOOM = 1.12; // how close the new picture starts
  const PUSH = 22; // % the old picture is pushed back
  const SHADE = 0.55; // how dark the old picture gets (brightness)
  const COMMIT = 0.28; // share of the width a swipe needs to land
  const FLICK = 0.45; // px per ms: a flick lands whatever the distance
  const SWIPE_START = 8; // px before a press becomes a swipe
  const WHEEL_STEP = 36; // px of sideways wheel for one photo
  const FLAG_HOLD = 1400; // ms "Saved" stays open: reading time, not motion
  const CLICK_SLOP = 6; // px a press can move and still open the link
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  // A cubic-bezier as a function of time, for the sweeps the script drives frame by frame
  const bezier = ([x1, y1, x2, y2]) => {
    const at = (a, b, t) => 3 * a * t * (1 - t) ** 2 + 3 * b * t ** 2 * (1 - t) + t ** 3;
    return (x) => {
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2;
        if (at(x1, x2, mid) < x) lo = mid;
        else hi = mid;
      }
      return at(y1, y2, (lo + hi) / 2);
    };
  };
  const slideEase = bezier(SLIDE_EASE);
  const settleEase = bezier(SETTLE_EASE);
  let made = 0;

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const media = root.querySelector('.kodza-listing-card__media');
    const track = root.querySelector('.kodza-listing-card__track');
    const slides = [...root.querySelectorAll('.kodza-listing-card__slide')];
    const images = slides.map((slide) => slide.querySelector('.kodza-listing-card__image'));
    const link = root.querySelector('.kodza-listing-card__link');
    const prev = root.querySelector('.kodza-listing-card__arrow--prev');
    const next = root.querySelector('.kodza-listing-card__arrow--next');
    const status = root.querySelector('.kodza-listing-card__status');
    const total = slides.length;
    const running = new Set();
    const play = (el, frames, options) => {
      const animation = el.animate(frames, { ...options, duration: options.duration * pace });
      running.add(animation);
      animation.finished.catch(() => {}).finally(() => running.delete(animation));
      return animation;
    };
    signal.addEventListener('abort', () => running.forEach((animation) => animation.cancel()));

    root.classList.toggle('is-single', total < 2);
    let index = 0;
    let target = 0; // where the photos are going, while they go
    slides[0]?.classList.add('is-current');

    // The dots, made by the script: a row of dots and one pill of ink that stretches between them
    const dots = [];
    let pill = null;
    if (media && total > 1) {
      const row = Object.assign(document.createElement('p'), { className: 'kodza-listing-card__dots' });
      row.setAttribute('aria-hidden', 'true');
      for (let i = 0; i < total; i++) {
        const dot = Object.assign(document.createElement('span'), { className: 'kodza-listing-card__dot' });
        dots.push(dot);
        row.append(dot);
      }
      pill = Object.assign(document.createElement('span'), { className: 'kodza-listing-card__pill' });
      row.append(pill);
      media.append(row);
      const placed = new ResizeObserver(() => pillAt(index, index, 0));
      placed.observe(row);
      signal.addEventListener('abort', () => placed.disconnect());
    }
    // The front of the pill leaves first and the back follows, so it stretches, then gathers
    function pillAt(from, to, p) {
      if (!pill) return;
      const a = dots[from].offsetLeft;
      const span = dots[to].offsetLeft - a;
      const size = dots[from].offsetWidth;
      const lead = 1 - (1 - p) ** 2.4;
      const tail = p ** 2.4;
      const left = a + span * (span > 0 ? tail : lead);
      const right = a + size + span * (span > 0 ? lead : tail);
      pill.style.transform = `translateX(${left.toFixed(2)}px)`;
      pill.style.width = `${(right - left).toFixed(2)}px`;
    }

    const ends = () => {
      root.classList.toggle('is-first', target <= 0);
      root.classList.toggle('is-last', target >= total - 1);
    };
    const announce = () => {
      if (status) status.textContent = word('photo').replace('{n}', index + 1).replace('{total}', total);
    };

    // A sweep is a scene of paused animations, scrubbed from 0 to 1: by a tween, or by the finger
    let scene = null;
    let tween = 0;
    const build = (to, dir) => {
      const coming = slides[to];
      const now = images[index];
      const next = images[to];
      coming.classList.add('is-coming');
      const timing = { duration: 1000, fill: 'both', easing: 'linear' };
      const anims = [
        coming.animate([
          { clipPath: dir > 0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)' },
          { clipPath: 'inset(0 0 0 0%)' },
        ], timing),
      ];
      if (next) anims.push(next.animate([
        { transform: `translateX(${SHIFT * dir}%) scale(${ZOOM})` },
        { transform: 'translateX(0%) scale(1)' },
      ], timing));
      if (now) anims.push(now.animate([
        { transform: 'translateX(0%)', filter: 'brightness(1)' },
        { transform: `translateX(${-PUSH * dir}%)`, filter: `brightness(${SHADE})` },
      ], timing));
      anims.forEach((animation) => {
        animation.pause();
        running.add(animation);
      });
      scene = { from: index, to, dir, anims, p: 0 };
      return scene;
    };
    const seek = (p) => {
      scene.p = p;
      scene.anims.forEach((animation) => { animation.currentTime = p * 1000; });
      pillAt(scene.from, scene.to, p);
    };
    const close = (done) => {
      if (!scene) return;
      const { from, to, anims } = scene;
      scene = null;
      if (done) {
        slides[from].classList.remove('is-current');
        slides[to].classList.add('is-current');
        index = to;
        announce();
      }
      slides[to].classList.remove('is-coming');
      anims.forEach((animation) => {
        animation.cancel();
        running.delete(animation);
      });
      if (!done) target = index;
      pillAt(index, index, 0);
      ends();
    };
    const run = (to, duration, ease, then) => {
      cancelAnimationFrame(tween);
      const start = scene.p;
      const t0 = performance.now();
      const step = (time) => {
        const t = duration > 0 ? clamp((time - t0) / duration, 0, 1) : 1;
        seek(start + (to - start) * ease(t));
        if (t < 1) tween = requestAnimationFrame(step);
        else {
          tween = 0;
          then();
        }
      };
      tween = requestAnimationFrame(step);
    };
    signal.addEventListener('abort', () => cancelAnimationFrame(tween));

    const jump = (to) => {
      slides[index].classList.remove('is-current');
      slides[to].classList.add('is-current');
      index = to;
      pillAt(index, index, 0);
      announce();
      ends();
    };
    // A press during a sweep is kept, and the next sweep starts as soon as this one lands
    const land = (done) => {
      close(done);
      if (target !== index) go(target);
    };
    const go = (to) => {
      if (total < 2) return;
      target = clamp(to, 0, total - 1);
      ends();
      if (scene || target === index) return;
      if (still) return jump(target);
      const chained = Math.abs(target - index) > 1;
      build(index + Math.sign(target - index), Math.sign(target - index));
      run(1, SLIDE_TIME * pace * (chained ? 0.7 : 1), slideEase, () => land(true));
    };

    if (track) {
      track.addEventListener('keydown', (event) => {
        const moves = { ArrowRight: 1, ArrowLeft: -1 };
        if (event.key in moves) go(target + moves[event.key]);
        else if (event.key === 'Home') go(0);
        else if (event.key === 'End') go(total - 1);
        else return;
        event.preventDefault();
      }, { signal });

      // The finger drives the sweep; at either end there is nowhere to go, so nothing moves
      let press = null;
      let swipe = null;
      track.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        press = { x: event.clientX, y: event.clientY };
        swipe = total > 1 && !scene ? { id: event.pointerId, x: event.clientX, y: event.clientY, on: false, trail: [] } : null;
      }, { signal });
      track.addEventListener('pointermove', (event) => {
        if (!swipe || event.pointerId !== swipe.id) return;
        const dx = event.clientX - swipe.x;
        const dy = event.clientY - swipe.y;
        if (!swipe.on) {
          if (Math.hypot(dx, dy) < SWIPE_START) return;
          if (Math.abs(dy) >= Math.abs(dx)) {
            swipe = null;
            return;
          }
          if (still) {
            swipe = null;
            go(index + (dx < 0 ? 1 : -1));
            return;
          }
          swipe.on = true;
          track.setPointerCapture(event.pointerId);
          root.classList.add('is-swiping');
        }
        swipe.trail.push({ x: event.clientX, t: event.timeStamp });
        if (swipe.trail.length > 6) swipe.trail.shift();
        const dir = dx < 0 ? 1 : -1;
        const to = index + dir;
        if (scene && scene.dir !== dir) close(false);
        if (to < 0 || to >= total) return;
        if (!scene) {
          target = to;
          ends();
          build(to, dir);
        }
        seek(clamp(Math.abs(dx) / (track.clientWidth || 1), 0, 1));
      }, { signal });
      const release = (event, cancelled) => {
        if (!swipe || event.pointerId !== swipe.id) return;
        const { on, trail } = swipe;
        swipe = null;
        if (!on) return;
        root.classList.remove('is-swiping');
        if (!scene) return;
        const first = trail[0];
        const last = trail[trail.length - 1];
        const speed = first && last && last.t > first.t ? ((first.x - last.x) / (last.t - first.t)) * scene.dir : 0;
        const lands = !cancelled && speed > -FLICK && (scene.p > COMMIT || speed > FLICK);
        const left = lands ? 1 - scene.p : scene.p;
        run(lands ? 1 : 0, SETTLE_TIME * pace * Math.max(left, 0.35), settleEase, () => land(lands));
      };
      track.addEventListener('pointerup', (event) => release(event, false), { signal });
      track.addEventListener('pointercancel', (event) => release(event, true), { signal });

      // A sideways trackpad swipe or a tilt of the wheel: one photo per gesture
      let wheel = 0;
      let wheelLock = false;
      let wheelTimer = 0;
      track.addEventListener('wheel', (event) => {
        if (total < 2 || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
        event.preventDefault();
        clearTimeout(wheelTimer);
        wheelTimer = setTimeout(() => {
          wheelLock = false;
          wheel = 0;
        }, 160);
        if (wheelLock) return;
        wheel += event.deltaX;
        if (Math.abs(wheel) < WHEEL_STEP) return;
        wheelLock = true;
        go(target + Math.sign(wheel));
      }, { passive: false, signal });
      signal.addEventListener('abort', () => clearTimeout(wheelTimer));

      // The photos sit over the link: a plain click on them opens it, a swipe does not
      track.addEventListener('click', (event) => {
        const moved = press && Math.hypot(event.clientX - press.x, event.clientY - press.y) > CLICK_SLOP;
        press = null;
        if (moved || !link) return;
        link.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          shiftKey: event.shiftKey,
          altKey: event.altKey,
        }));
      }, { signal });
      track.addEventListener('dragstart', (event) => event.preventDefault(), { signal });
    }
    prev?.addEventListener('click', () => go(target - 1), { signal });
    next?.addEventListener('click', () => go(target + 1), { signal });
    ends();
    pillAt(0, 0, 0);

    // The heart, Ink Like's: the ink is cut to its outline by a clip path with an id of its own
    const like = root.querySelector('.kodza-listing-card__like');
    const svg = like?.querySelector('.kodza-listing-card__heart');
    const ink = like?.querySelector('.kodza-listing-card__ink');
    const surface = like?.querySelector('.kodza-listing-card__surface');
    if (!like || !svg || !ink) return;
    const ns = 'http://www.w3.org/2000/svg';
    const defs = document.createElementNS(ns, 'defs');
    const clip = document.createElementNS(ns, 'clipPath');
    clip.id = `kodza-listing-card-${Math.random().toString(36).slice(2, 8)}-${++made}`;
    svg.querySelectorAll('.kodza-listing-card__shape').forEach((shape) => {
      const copy = shape.cloneNode(true);
      copy.removeAttribute('class');
      clip.append(copy);
    });
    defs.append(clip);
    svg.prepend(defs);
    ink.setAttribute('clip-path', `url(#${clip.id})`);

    // "Saved", beside the heart: the button opens, the word rises, holds, leaves upwards, it closes
    const flag = Object.assign(document.createElement('span'), { className: 'kodza-listing-card__flag' });
    flag.setAttribute('aria-hidden', 'true');
    const flagWord = Object.assign(document.createElement('span'), { className: 'kodza-listing-card__flag-word', textContent: word('flag') });
    const flagClip = document.createElement('span');
    flagClip.append(flagWord);
    flag.append(flagClip);
    like.prepend(flag);
    let flagTimer = 0;
    const lower = () => {
      clearTimeout(flagTimer);
      if (!like.classList.contains('is-saying')) return;
      flagWord.getAnimations().forEach((animation) => animation.cancel());
      if (still) return like.classList.remove('is-saying');
      play(flagWord, [{ transform: 'none' }, { transform: 'translateY(-110%)' }], { duration: 280, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' })
        .finished.then(() => like.classList.remove('is-saying'), () => {});
    };
    const raise = () => {
      clearTimeout(flagTimer);
      flagWord.getAnimations().forEach((animation) => animation.cancel());
      like.classList.add('is-saying');
      if (!still) {
        play(flagWord, [{ transform: 'translateY(110%)' }, { transform: 'none' }], { duration: 520, delay: 120, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' });
      }
      flagTimer = setTimeout(lower, FLAG_HOLD + 640 * pace);
    };

    let liked = like.getAttribute('aria-pressed') === 'true';
    let sayTimer = 0;
    const say = (message) => {
      if (!status) return;
      status.textContent = '';
      clearTimeout(sayTimer);
      sayTimer = setTimeout(() => { status.textContent = message; }, 60);
    };

    // The surface sloshes while the ink moves: it tilts against the flow, overshoots, settles
    let slosh = null;
    let flowTimer = 0;
    const flow = (up) => {
      if (still || !surface) return;
      like.classList.add('is-flowing');
      clearTimeout(flowTimer);
      flowTimer = setTimeout(() => like.classList.remove('is-flowing'), (up ? 1000 : 520) * pace);
      const from = getComputedStyle(surface).transform;
      slosh?.cancel();
      const s = up ? 1 : -1;
      slosh = surface.animate([
        { transform: from === 'none' ? 'scaleY(0.7)' : from },
        { transform: `rotate(${-5 * s}deg) scaleY(1.6)`, offset: 0.3 },
        { transform: `rotate(${2 * s}deg) scaleY(1.1)`, offset: 0.65 },
        { transform: 'rotate(0deg) scaleY(0.7)' },
      ], { duration: (up ? 900 : 480) * pace, easing: 'ease-out' });
    };

    // The heart says no: a short shake when the request is refused
    const shake = () => {
      if (still) return;
      play(svg, [
        { transform: 'none' },
        { transform: 'translateX(-2px)', offset: 0.2 },
        { transform: 'translateX(2px)', offset: 0.45 },
        { transform: 'translateX(-1px)', offset: 0.7 },
        { transform: 'none' },
      ], { duration: 360, easing: 'ease-out' });
    };

    // The level follows aria-pressed in CSS, so a click halfway turns it round where it is
    const apply = (state) => {
      const turned = state !== liked;
      liked = state;
      like.setAttribute('aria-pressed', String(state));
      if (turned) flow(state);
    };

    let seq = 0;
    like.addEventListener('click', () => {
      const before = liked;
      const state = !liked;
      let request = null;
      const allowed = like.dispatchEvent(new CustomEvent('kodza:like', {
        bubbles: true,
        cancelable: true,
        detail: { liked: state, wait: (promise) => { request = Promise.resolve(promise); } },
      }));
      if (!allowed) return;
      const mine = ++seq;
      like.classList.add('is-spent');
      apply(state);
      if (state) raise();
      else lower();
      say(word(state ? 'saved' : 'unsaved'));
      request?.catch(() => {
        if (signal.aborted || mine !== seq) return;
        apply(before);
        lower();
        shake();
        say(word('refused'));
      });
    }, { signal });

    // After a click the drop under the pointer waits for the next visit
    like.addEventListener('pointerleave', () => like.classList.remove('is-spent'), { signal });

    // Set from your code: aria-pressed fills or drains the heart
    const observer = new MutationObserver(() => {
      const pressed = like.getAttribute('aria-pressed') === 'true';
      if (pressed === liked) return;
      liked = pressed;
      flow(liked);
      if (!liked) lower();
    });
    observer.observe(like, { attributes: true, attributeFilter: ['aria-pressed'] });
    signal.addEventListener('abort', () => {
      clearTimeout(flowTimer);
      clearTimeout(sayTimer);
      clearTimeout(flagTimer);
      observer.disconnect();
      slosh?.cancel();
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
