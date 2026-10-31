// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Hero Showreel
// The loop under the hero plays muted while it's on screen. "Play reel" is a link to the full
// reel (data-poster: its first picture): with a mouse it follows the pointer over the picture
// and tucks itself away over the hero's own links; a click anywhere on the picture, or the
// link itself, opens the reel with sound in a dialog. The pill grows into the player, and the
// player goes back into the pill on close (Escape, the shade, the close button). In the player:
// Pause, Mute, a track to seek, the time, and the arrow keys for 5 s back or ahead.
(() => {
  const SELECTOR = '.kodza-hero-showreel';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const grow = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const WORDS = { pause: 'Pause', play: 'Play', replay: 'Replay', mute: 'Mute', unmute: 'Unmute', close: 'Close', label: 'Showreel' };
  const STEP = 5; // seconds, for the arrow keys

  const time = (s) => {
    const t = Math.max(0, Math.floor(s || 0));
    return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  };
  const words = (...keys) => keys.map((key) => `<span data-word="${key}">${WORDS[key]}</span>`).join('');

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers, loops and the dialog stop
  // on its 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const frame = root.querySelector('.kodza-hero-showreel__frame');
    const pill = root.querySelector('.kodza-hero-showreel__play');
    const loop = root.querySelector('.kodza-hero-showreel__loop');
    if (!frame || !pill) return;

    const viewer = document.createElement('dialog');
    viewer.className = 'kodza-hero-showreel__viewer';
    viewer.setAttribute('aria-label', WORDS.label);
    viewer.innerHTML = `<div class="kodza-hero-showreel__shade"></div>
      <div class="kodza-hero-showreel__player"><video class="kodza-hero-showreel__video" playsinline preload="none"></video><div class="kodza-hero-showreel__cover"><span class="kodza-hero-showreel__ghost"></span></div></div>
      <div class="kodza-hero-showreel__bar">
        <button class="kodza-hero-showreel__control kodza-hero-showreel__toggle" type="button">${words('pause', 'play', 'replay')}</button>
        <button class="kodza-hero-showreel__control kodza-hero-showreel__sound" type="button">${words('mute', 'unmute')}</button>
        <div class="kodza-hero-showreel__track" aria-hidden="true"><span class="kodza-hero-showreel__fill"></span></div>
        <span class="kodza-hero-showreel__clock"><span class="kodza-hero-showreel__now">0:00</span> / <span class="kodza-hero-showreel__total"></span></span>
      </div>
      <button class="kodza-hero-showreel__close" type="button" aria-label="${WORDS.close}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg></button>`;
    root.append(viewer);
    const shade = viewer.querySelector('.kodza-hero-showreel__shade');
    const player = viewer.querySelector('.kodza-hero-showreel__player');
    const video = viewer.querySelector('.kodza-hero-showreel__video');
    const cover = viewer.querySelector('.kodza-hero-showreel__cover');
    const ghost = viewer.querySelector('.kodza-hero-showreel__ghost');
    const bar = viewer.querySelector('.kodza-hero-showreel__bar');
    const toggle = viewer.querySelector('.kodza-hero-showreel__toggle');
    const sound = viewer.querySelector('.kodza-hero-showreel__sound');
    const track = viewer.querySelector('.kodza-hero-showreel__track');
    const fill = viewer.querySelector('.kodza-hero-showreel__fill');
    const now = viewer.querySelector('.kodza-hero-showreel__now');
    const total = viewer.querySelector('.kodza-hero-showreel__total');
    const close = viewer.querySelector('.kodza-hero-showreel__close');
    total.textContent = pill.querySelector('.kodza-hero-showreel__time')?.textContent.trim() || '0:00';
    // The pill's own face, drawn on the player while it grows
    ghost.innerHTML = pill.innerHTML;

    // The loop plays only while it's on screen and the reel is closed
    let seen = false;
    const looping = () => {
      if (!loop) return;
      if (seen && !viewer.open && !reduceMotion) loop.play().catch(() => {});
      else loop.pause();
    };
    const watch = new IntersectionObserver(([entry]) => {
      seen = entry.isIntersecting;
      looping();
    });
    watch.observe(frame);

    // A word of a button that rolls: the old one up, the new one from below
    const say = (button, key) => {
      const next = button.querySelector(`[data-word="${key}"]`);
      const old = button.querySelector('.is-on');
      if (old === next) return;
      next.getAnimations().forEach((a) => a.cancel());
      next.classList.remove('is-leaving');
      next.classList.add('is-on');
      if (!old) return;
      old.classList.remove('is-on');
      if (reduceMotion || !viewer.open) return;
      old.classList.add('is-leaving');
      const timing = { duration: 420, easing: ease };
      old.animate([{ transform: 'none' }, { transform: 'translateY(-100%)' }], timing).finished.then(() => old.classList.remove('is-leaving'), () => {});
      next.animate([{ transform: 'translateY(100%)' }, { transform: 'none' }], timing);
    };
    const state = () => {
      say(toggle, video.ended ? 'replay' : video.paused ? 'play' : 'pause');
      say(sound, video.muted ? 'unmute' : 'mute');
    };
    say(toggle, 'pause');
    say(sound, 'mute');

    // Where the player fits on screen, 16:9: room kept for the close button above and the bar below
    const fit = () => {
      const ratio = (video.videoWidth / video.videoHeight) || 16 / 9;
      const above = 68;
      const below = 72;
      const w = innerWidth - 32;
      const h = innerHeight - above - below;
      const width = Math.min(w, h * ratio);
      const height = width / ratio;
      return { left: (innerWidth - width) / 2, top: above + (h - height) / 2, width, height };
    };
    let box = null;
    const place = () => {
      box = fit();
      Object.assign(player.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });
      Object.assign(bar.style, { left: `${box.left}px`, top: `${box.top + box.height + 14}px`, width: `${box.width}px` });
    };
    // The player drawn as the pill: moved onto it and cut to its shape, never stretched
    const shape = (rect) => {
      const x = rect.left + rect.width / 2 - (box.left + box.width / 2);
      const y = rect.top + rect.height / 2 - (box.top + box.height / 2);
      const side = Math.max(0, (box.width - rect.width) / 2);
      const top = Math.max(0, (box.height - rect.height) / 2);
      return { transform: `translate(${x}px, ${y}px)`, clipPath: `inset(${top}px ${side}px round ${rect.height / 2}px)` };
    };
    // Open, it has the player's own corners, which the site may scale
    const full = () => ({ transform: 'none', clipPath: `inset(0px 0px round ${getComputedStyle(player).borderTopLeftRadius})` });

    // The bar follows the time while the reel is open
    let frameId = 0;
    const draw = () => {
      const d = video.duration || 0;
      fill.style.transform = `scaleX(${d ? Math.min(1, video.currentTime / d) : 0})`;
      const text = time(video.currentTime);
      if (now.textContent !== text) now.textContent = text;
      frameId = viewer.open ? requestAnimationFrame(draw) : 0;
    };

    const settle = () => [player, video, cover, ghost, shade, bar, close].forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
    let closing = false;

    const open = () => {
      if (viewer.open) return;
      closing = false;
      settle();
      if (!video.getAttribute('src')) {
        video.preload = 'auto';
        if (pill.dataset.poster) video.poster = pill.dataset.poster;
        video.src = pill.href;
      }
      video.currentTime = 0;
      const rect = pill.getBoundingClientRect();
      // Opened from the picture, the pill is still the trigger: the focus comes back to it
      if (document.activeElement !== pill) pill.focus({ preventScroll: true });
      viewer.showModal();
      place();
      pill.classList.add('is-away');
      looping();
      // With sound, from a click; if the browser refuses, it plays muted and Unmute is there
      video.muted = false;
      video.play().catch(() => {
        video.muted = true;
        return video.play();
      }).catch(() => {}).finally(state);
      state();
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(draw);
      if (reduceMotion) return;
      const timing = { duration: 760, easing: grow };
      player.animate([shape(rect), full()], timing);
      video.animate([{ transform: 'scale(1.15)' }, { transform: 'none' }], timing);
      cover.animate([{ opacity: 1 }, { opacity: 1, offset: 0.12 }, { opacity: 0, offset: 0.55 }], timing);
      ghost.animate([{ opacity: 1 }, { opacity: 0, offset: 0.25 }], timing);
      shade.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 480, easing: 'ease' });
      [bar, close].forEach((el) => el.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 480, delay: 420, easing: ease, fill: 'backwards' }));
    };

    const shut = () => {
      if (closing || !viewer.open) return;
      closing = true;
      video.pause();
      // The pill shows again before the dialog closes, so the focus can go back to it
      const done = () => {
        pill.classList.remove('is-away');
        viewer.close();
        settle();
        looping();
      };
      if (reduceMotion) return done();
      const rect = pill.getBoundingClientRect();
      const there = rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
      const timing = { duration: 640, easing: grow, fill: 'forwards' };
      [bar, close].forEach((el) => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }));
      shade.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 520, delay: 120, easing: 'ease', fill: 'forwards' });
      // Back into the pill if it's on screen; otherwise the player simply fades
      if (!there) {
        player.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(0.96)' }], { ...timing, duration: 420 }).finished.then(done, () => {});
        return;
      }
      player.animate([full(), shape(rect)], timing).finished.then(done, () => {});
      video.animate([{ transform: 'none' }, { transform: 'scale(1.15)' }], timing);
      cover.animate([{ opacity: 0 }, { opacity: 0, offset: 0.45 }, { opacity: 1, offset: 0.88 }, { opacity: 1 }], timing);
      ghost.animate([{ opacity: 0 }, { opacity: 0, offset: 0.75 }, { opacity: 1 }], timing);
    };

    // The pill follows the pointer over the picture, a little late, and goes home when it leaves
    const pos = { x: 0, y: 0 };
    const aim = { x: 0, y: 0 };
    let chasing = 0;
    const chase = () => {
      const k = reduceMotion ? 1 : 0.2;
      pos.x += (aim.x - pos.x) * k;
      pos.y += (aim.y - pos.y) * k;
      const still = Math.abs(aim.x - pos.x) < 0.1 && Math.abs(aim.y - pos.y) < 0.1;
      if (still) Object.assign(pos, aim);
      pill.style.translate = pos.x || pos.y ? `${pos.x}px ${pos.y}px` : '';
      chasing = still ? 0 : requestAnimationFrame(chase);
      if (still && !aim.x && !aim.y) root.classList.remove('is-following');
    };
    const go = () => {
      if (!chasing) chasing = requestAnimationFrame(chase);
    };
    // Screen pixels into the frame's own: a parent scaled with transform must not shift it
    const toward = (event) => {
      const rect = frame.getBoundingClientRect();
      const scale = rect.width / frame.offsetWidth || 1;
      aim.x = (event.clientX - rect.left) / scale - (pill.offsetLeft + pill.offsetWidth / 2);
      aim.y = (event.clientY - rect.top) / scale - (pill.offsetTop + pill.offsetHeight / 2);
      go();
    };
    const other = (target) => {
      const hit = target.closest?.('a, button, input, select, textarea, label, [tabindex]');
      return hit && hit !== pill && frame.contains(hit) ? hit : null;
    };
    frame.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse' || !fine.matches || viewer.open) return;
      root.classList.add('is-following');
      pill.classList.toggle('is-tucked', Boolean(other(event.target)));
      toward(event);
    }, { signal });
    frame.addEventListener('pointerleave', () => {
      pill.classList.remove('is-tucked', 'is-pressed');
      aim.x = 0;
      aim.y = 0;
      go();
    }, { signal });
    frame.addEventListener('pointerdown', (event) => {
      if (event.button === 0 && !other(event.target)) pill.classList.add('is-pressed');
    }, { signal });
    addEventListener('pointerup', () => pill.classList.remove('is-pressed'), { signal });

    // A click on the picture or on the pill opens the reel; a modified click on the pill still
    // opens the file the browser's way (new tab, download)
    frame.addEventListener('click', (event) => {
      if (other(event.target)) return;
      if (event.target.closest('.kodza-hero-showreel__play') && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
      event.preventDefault();
      open();
    }, { signal });

    toggle.addEventListener('click', () => (video.paused || video.ended ? video.play().catch(() => {}) : video.pause()), { signal });
    video.addEventListener('click', () => toggle.click(), { signal });
    sound.addEventListener('click', () => {
      video.muted = !video.muted;
    }, { signal });
    ['play', 'pause', 'ended', 'volumechange'].forEach((type) => video.addEventListener(type, state, { signal }));
    video.addEventListener('loadedmetadata', () => {
      total.textContent = time(video.duration);
      if (viewer.open && !closing) place();
    }, { signal });

    // The track: a press or a drag puts the reel there
    const seek = (event) => {
      const rect = track.getBoundingClientRect();
      if (video.duration) video.currentTime = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)) * video.duration;
    };
    track.addEventListener('pointerdown', (event) => {
      track.setPointerCapture(event.pointerId);
      seek(event);
    }, { signal });
    track.addEventListener('pointermove', (event) => track.hasPointerCapture(event.pointerId) && seek(event), { signal });

    close.addEventListener('click', shut, { signal });
    shade.addEventListener('click', shut, { signal });
    viewer.addEventListener('cancel', (event) => {
      event.preventDefault();
      shut();
    }, { signal });
    viewer.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' || !video.duration) return;
      event.preventDefault();
      video.currentTime = Math.min(video.duration, Math.max(0, video.currentTime + (event.key === 'ArrowRight' ? STEP : -STEP)));
    }, { signal });
    // The page stays where it is under the reel
    viewer.addEventListener('wheel', (event) => event.preventDefault(), { passive: false, signal });
    viewer.addEventListener('touchmove', (event) => event.preventDefault(), { passive: false, signal });
    addEventListener('resize', () => viewer.open && !closing && place(), { signal });

    // Stopped while open (or closing): the reel stops and the dialog closes at once
    signal.addEventListener('abort', () => {
      watch.disconnect();
      cancelAnimationFrame(frameId);
      cancelAnimationFrame(chasing);
      video.pause();
      if (viewer.open) viewer.close();
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
