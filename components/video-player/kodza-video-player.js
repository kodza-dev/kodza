// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Video Player
// The CSS lays the player out; the script drives it. It takes over from the browser's controls,
// stretches the Play pill into the bar, keeps the time, the track, the chapter and the captions in
// step with the video (chapters and captions are the <track> files), hides the bar while the
// video plays and the pointer rests, and answers the keys of a video player. The words it writes
// are WORDS (data-text-* on the root), its timings the constants below.
(() => {
  const SELECTOR = '.kodza-video-player';
  const WORDS = {
    play: 'Play',
    pause: 'Pause',
    mute: 'Mute',
    captions: 'Captions',
    full: 'Full screen',
    exit: 'Exit full screen',
    seek: 'Seek',
    volume: 'Volume',
    position: '{time} of {total}', // read out on the track, then the chapter
  };
  const IDLE = 2000; // ms the pointer rests before the bar hides (a wait, not a motion)
  const IDLE_OUT = 600; // ms before it hides once the pointer has left the picture
  const JUMP = 10; // seconds for J and L
  const STEP = 5; // seconds for the arrows
  const VOLUME_STEP = 0.1; // for up and down, and the arrows of the volume
  const MORPH = 700; // ms, the pill stretching into the bar
  const WORDS_OUT = 180; // ms, the pill's words fading out as it starts to stretch
  const ITEMS = 250; // ms before the bar's controls come in, then 40 ms one after the other
  const ROLL = 520; // ms, the chapter name rolling
  const NOTCH = 1.5; // px on each side of a chapter notch in the track

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  // cubic-bezier(x1, y1, x2, y2) as a function of time, for the frames the script draws itself
  const bezier = (x1, y1, x2, y2) => {
    const at = (a, b, t) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
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
  const glide = bezier(0.65, 0, 0.35, 1);
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const fill = (template, values) => template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
  const clock = (seconds) => {
    const s = Math.max(0, Math.floor(seconds || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const rest = String(s % 60).padStart(2, '0');
    return h ? `${h}:${String(m).padStart(2, '0')}:${rest}` : `${m}:${rest}`;
  };
  const plain = (text) => text.replace(/<[^>]+>/g, '');
  // Where an element is right now, even mid-animation, to start its next move from there
  const now = (el, prop) => getComputedStyle(el)[prop];

  // Old name up, new one from below (the other way round when going back)
  const roll = (el, text, dir, still, pace) => {
    const old = el.lastElementChild;
    if (old?.textContent === text) return;
    const next = Object.assign(document.createElement('span'), { textContent: text });
    el.append(next);
    if (!old) return;
    if (!dir || still) return [...el.children].slice(0, -1).forEach((child) => child.remove());
    const timing = { duration: ROLL * pace, easing: ease };
    const from = now(old, 'transform');
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
    const part = (name) => root.querySelector(`.kodza-video-player__${name}`);
    const video = part('video');
    const screen = part('screen');
    const bar = part('bar');
    if (!video || !screen || !bar) return;
    const start = part('start');
    const toggle = part('toggle');
    const nowText = part('now');
    const totalText = part('total');
    const lengthText = part('length');
    const chapterName = part('chapter-name');
    const scrub = part('scrub');
    const tip = part('tip');
    const tipTime = part('tip-time');
    const tipChapter = part('tip-chapter');
    const mute = part('mute');
    const volume = part('volume');
    const captionsButton = part('captions');
    const full = part('full');
    const caption = part('caption');
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const on = (el, type, fn, options) => el?.addEventListener(type, fn, { signal, ...options });

    video.removeAttribute('controls');
    video.tabIndex = -1;
    mute?.setAttribute('aria-label', word('mute'));
    captionsButton?.setAttribute('aria-label', word('captions'));
    scrub?.setAttribute('aria-label', word('seek'));
    volume?.setAttribute('aria-label', word('volume'));

    let started = false;
    let scrubbing = false;
    let scrubTime = 0;
    let idleTimer = 0;
    let raf = 0;
    let morphing = 0;
    let lastSecond = -1;
    let chapters = [];
    let chapterIndex = -1;
    let captionsOn = root.dataset.captions === 'on';
    let cueText = '';
    let pointer = 'mouse';

    const length = () => (Number.isFinite(video.duration) ? video.duration : 0);
    // Screen pixels over the player's own: a parent scaled by `transform` does not shift positions
    const scaleOf = () => screen.getBoundingClientRect().width / screen.offsetWidth || 1;
    const chapterAt = (t) => {
      let found = -1;
      chapters.forEach((c, i) => { if (t >= c.start) found = i; });
      return found;
    };

    // Time, track, chapter: painted each frame while it plays, and on every seek
    const paint = () => {
      const d = length();
      const t = scrubbing ? scrubTime : video.currentTime;
      scrub?.style.setProperty('--kz-video-player-at', d ? clamp(t / d, 0, 1).toFixed(4) : 0);
      const index = chapterAt(t);
      if (index !== chapterIndex && chapterName) {
        const dir = chapterIndex < 0 ? 0 : index > chapterIndex ? 1 : -1;
        chapterIndex = index;
        roll(chapterName, chapters[index]?.title || '', dir, still, pace);
      }
      const s = Math.floor(t);
      if (s === lastSecond) return;
      lastSecond = s;
      if (nowText) nowText.textContent = clock(t);
      if (!scrub) return;
      scrub.setAttribute('aria-valuenow', String(s));
      const where = fill(word('position'), { time: clock(t), total: clock(d) });
      scrub.setAttribute('aria-valuetext', chapters[index] ? `${where}, ${chapters[index].title}` : where);
    };
    const loop = () => {
      paint();
      raf = requestAnimationFrame(loop);
    };
    const stopLoop = () => cancelAnimationFrame(raf);

    const paintBuffer = () => {
      const d = length();
      const ranges = video.buffered;
      let end = 0;
      for (let i = 0; i < ranges.length; i += 1) {
        if (ranges.start(i) <= video.currentTime + 0.5) end = Math.max(end, ranges.end(i));
      }
      scrub?.style.setProperty('--kz-video-player-buffered', d ? clamp(end / d, 0, 1).toFixed(4) : 0);
    };

    // A notch in the track at every chapter start: a mask with a 3 px gap there
    const paintNotches = () => {
      const d = length();
      const rail = part('rail');
      if (!rail || !d || chapters.length < 2) return;
      const stops = chapters
        .filter((c) => c.start > 0 && c.start < d)
        .map((c) => {
          const p = ((c.start / d) * 100).toFixed(3);
          return `#000 0 calc(${p}% - ${NOTCH}px), transparent 0 calc(${p}% + ${NOTCH}px)`;
        });
      rail.style.setProperty('--kz-video-player-notches', `linear-gradient(to right, ${stops.join(', ')}, #000 0)`);
    };

    const meta = () => {
      const d = length();
      if (!d) return;
      if (totalText) totalText.textContent = clock(d);
      if (lengthText) lengthText.textContent = clock(d);
      scrub?.setAttribute('aria-valuemax', String(Math.round(d)));
      lastSecond = -1;
      paintNotches();
      paint();
    };

    // The bar rests while the video plays and nothing holds it
    const held = () => scrubbing || volume?.classList.contains('is-dragging') || bar.matches(':hover') || !!bar.querySelector(':focus-visible');
    const rest = (delay = IDLE) => {
      clearTimeout(idleTimer);
      if (!started || video.paused) return;
      idleTimer = setTimeout(() => {
        if (video.paused) return;
        if (held()) return rest();
        root.classList.add('is-idle');
      }, delay);
    };
    const wake = (delay) => {
      root.classList.remove('is-idle');
      rest(delay);
    };

    // The pill stretches into the bar: the bar starts on the pill (left edge and top), clipped to
    // its width, and opens to the right; the play dot does not move, the rest comes in after it
    const begin = () => {
      if (started) return;
      started = true;
      const from = start?.getBoundingClientRect();
      if (!still && from) root.classList.add('is-morphing');
      root.classList.add('is-started');
      if (still || !from) return;
      const to = bar.getBoundingClientRect();
      const scale = scaleOf();
      const dx = (from.left - to.left) / scale;
      const dy = (from.top - to.top) / scale;
      const right = Math.max(0, (to.width - from.width) / scale);
      const bottom = Math.max(0, (to.height - from.height) / scale);
      const r = to.height / scale / 2;
      // Drawn frame by frame: Chrome hands an animated clip-path to its compositor and can paint
      // the bar uncut while it runs. The end shape reaches past the bar, so the shadow is not
      // cut off on arrival.
      const shape = (k) => {
        const m = 1 - k;
        bar.style.transform = k < 1 ? `translate(${dx * m}px, ${dy * m}px)` : '';
        bar.style.clipPath = k < 1
          ? `inset(${-48 * k}px ${right * m - 48 * k}px ${bottom * m - 48 * k}px ${-48 * k}px round ${r + 48 * k}px)`
          : '';
      };
      const settle = () => {
        cancelAnimationFrame(morphing);
        shape(1);
        root.classList.remove('is-morphing');
      };
      const t0 = performance.now();
      const step = (time) => {
        const k = clamp((time - t0) / (MORPH * pace), 0, 1);
        if (k >= 1) return settle();
        shape(glide(k));
        morphing = requestAnimationFrame(step);
      };
      shape(0);
      morphing = requestAnimationFrame(step);
      // The pill's words leave first (a short fade to the left), then the pill itself melts into
      // the bar it became, so nothing vanishes in one frame
      [...start.children].filter((el) => !el.classList.contains('kodza-video-player__dot')).forEach((el) => {
        el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-6px)' }], {
          duration: WORDS_OUT * pace,
          easing: 'ease-in',
          fill: 'forwards',
        });
      });
      start.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: WORDS_OUT * pace,
        delay: (WORDS_OUT / 2) * pace,
        easing: 'ease-out',
        fill: 'forwards',
      });
      signal.addEventListener('abort', settle, { once: true });
      [...bar.children].filter((el) => el !== toggle).forEach((el, i) => {
        el.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], {
          duration: 500 * pace,
          delay: (ITEMS + 40 * i) * pace,
          easing: ease,
          fill: 'backwards',
        });
      });
    };

    const playIt = () => {
      begin();
      video.play()?.catch(() => {});
    };
    const togglePlay = () => (video.paused || video.ended ? playIt() : video.pause());
    const seekTo = (t, fast) => {
      const d = length();
      if (!d) return;
      const time = clamp(t, 0, d);
      if (fast && video.fastSeek) video.fastSeek(time);
      else video.currentTime = time;
      if (time < d) root.classList.remove('is-ended');
      paint();
    };
    const seekBy = (d) => seekTo(video.currentTime + d);
    const setVolume = (v) => {
      const level = clamp(Math.round(v * 100) / 100, 0, 1);
      video.volume = level;
      video.muted = level === 0;
    };
    const volumeBy = (d) => setVolume((video.muted ? 0 : video.volume) + d);
    const toggleMute = () => {
      if (video.muted && video.volume === 0) video.volume = 0.5;
      video.muted = !video.muted;
    };

    // Captions: the track stays hidden to the browser, its lines are drawn here. The old line
    // leaves upwards while the new one rises into the same cell
    const tracks = [...video.textTracks];
    const captionTrack = tracks.find((t) => t.kind === 'captions' || t.kind === 'subtitles');
    const chapterTrack = tracks.find((t) => t.kind === 'chapters');
    const showCaption = (text) => {
      if (!caption) return;
      [...caption.children].filter((el) => !el.dataset.leaving).forEach((el) => {
        el.dataset.leaving = '1';
        if (still) return el.remove();
        el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-40%)' }], {
          duration: 260 * pace,
          easing: ease,
          fill: 'forwards',
        }).finished.then(() => el.remove(), () => {});
      });
      if (!text) return;
      const line = Object.assign(document.createElement('span'), { textContent: text });
      caption.append(line);
      if (!still) line.animate([{ opacity: 0, transform: 'translateY(40%)' }, { opacity: 1, transform: 'none' }], { duration: 380 * pace, easing: ease });
    };
    const setCaptions = (value) => {
      captionsOn = value;
      captionsButton?.setAttribute('aria-pressed', String(value));
      showCaption(value ? cueText : '');
    };
    if (captionTrack) {
      captionTrack.mode = 'hidden';
      root.classList.add('has-captions');
      captionsButton?.setAttribute('aria-pressed', String(captionsOn));
      on(captionTrack, 'cuechange', () => {
        cueText = [...(captionTrack.activeCues || [])].map((cue) => plain(cue.text)).join('\n');
        if (captionsOn) showCaption(cueText);
      });
    }

    const readChapters = () => {
      const cues = chapterTrack?.cues;
      if (!cues?.length) return;
      chapters = [...cues].map((cue) => ({ start: cue.startTime, title: plain(cue.text) })).sort((a, b) => a.start - b.start);
      chapterIndex = -1;
      lastSecond = -1;
      root.classList.add('has-chapters');
      paintNotches();
      paint();
    };
    if (chapterTrack) {
      chapterTrack.mode = 'hidden';
      const element = video.querySelector('track[kind="chapters"]');
      if (element?.readyState === 2) readChapters();
      on(element, 'load', readChapters);
    }

    // Full screen: the whole player when it can, the video alone on an iPhone
    const fullElement = () => document.fullscreenElement || document.webkitFullscreenElement;
    const canFull = (document.fullscreenEnabled || document.webkitFullscreenEnabled) && (root.requestFullscreen || root.webkitRequestFullscreen);
    if (!canFull && !video.webkitEnterFullscreen) root.classList.add('no-full');
    const toggleFull = () => {
      if (fullElement() === root) return (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
      if (!canFull) return video.webkitEnterFullscreen?.();
      const request = root.requestFullscreen || root.webkitRequestFullscreen;
      request.call(root)?.catch?.(() => {});
    };
    const onFull = () => {
      const isFull = fullElement() === root;
      root.classList.toggle('is-full', isFull);
      full?.setAttribute('aria-label', word(isFull ? 'exit' : 'full'));
      wake();
    };
    full?.setAttribute('aria-label', word('full'));
    on(document, 'fullscreenchange', onFull);
    on(document, 'webkitfullscreenchange', onFull);

    const setToggle = () => toggle?.setAttribute('aria-label', word(video.paused || video.ended ? 'play' : 'pause'));
    setToggle();
    const setSound = () => {
      const silent = video.muted || video.volume === 0;
      root.classList.toggle('is-muted', silent);
      mute?.setAttribute('aria-pressed', String(silent));
      const level = silent ? 0 : video.volume;
      volume?.style.setProperty('--kz-video-player-volume', level.toFixed(2));
      volume?.setAttribute('aria-valuenow', String(Math.round(level * 100)));
    };
    setSound();

    on(video, 'loadedmetadata', meta);
    on(video, 'durationchange', meta);
    if (video.readyState >= 1) meta();
    on(video, 'play', () => {
      begin();
      root.classList.add('is-playing');
      root.classList.remove('is-ended');
      setToggle();
      stopLoop();
      raf = requestAnimationFrame(loop);
      rest();
    });
    on(video, 'pause', () => {
      root.classList.remove('is-playing', 'is-waiting');
      setToggle();
      stopLoop();
      paint();
      wake();
    });
    on(video, 'ended', () => root.classList.add('is-ended'));
    on(video, 'waiting', () => root.classList.add('is-waiting'));
    on(video, 'playing', () => root.classList.remove('is-waiting'));
    on(video, 'canplay', () => root.classList.remove('is-waiting'));
    on(video, 'seeked', paint);
    on(video, 'timeupdate', paint); // the loop paints between, this keeps it right when frames are throttled
    on(video, 'progress', paintBuffer);
    on(video, 'timeupdate', paintBuffer);
    on(video, 'volumechange', setSound);

    // Mouse: a click plays or pauses, a double click goes full screen. Touch: a tap shows the bar
    // or puts it away, the buttons do the rest
    on(video, 'pointerdown', (event) => { pointer = event.pointerType; });
    on(video, 'click', () => {
      video.focus({ preventScroll: true });
      if (pointer !== 'touch' || !started) return togglePlay();
      if (root.classList.contains('is-idle') || video.paused) return wake();
      clearTimeout(idleTimer);
      root.classList.add('is-idle');
    });
    on(video, 'dblclick', () => pointer !== 'touch' && toggleFull());
    on(screen, 'pointermove', (event) => event.pointerType === 'mouse' && wake());
    on(screen, 'pointerleave', (event) => event.pointerType === 'mouse' && rest(IDLE_OUT));
    on(root, 'focusin', () => wake());

    on(start, 'click', (event) => {
      playIt();
      // From the keyboard, the focus follows to the play button that took the pill's place
      if (event.detail === 0) toggle?.focus({ preventScroll: true });
    });
    on(toggle, 'click', togglePlay);
    on(mute, 'click', toggleMute);
    on(captionsButton, 'click', () => setCaptions(!captionsOn));
    on(full, 'click', toggleFull);

    // The track: drag to seek, and a tip that reads the time and chapter under the pointer
    const fractionAt = (clientX) => {
      const r = scrub.getBoundingClientRect();
      return r.width ? clamp((clientX - r.left) / r.width, 0, 1) : 0;
    };
    const placeTip = (fraction) => {
      if (!tip) return;
      const d = length();
      const t = fraction * d;
      if (tipTime) tipTime.textContent = clock(t);
      if (tipChapter) tipChapter.textContent = chapters[chapterAt(t)]?.title || '';
      const x = fraction * scrub.offsetWidth - tip.offsetWidth / 2;
      const min = 4 - scrub.offsetLeft;
      const max = bar.clientWidth - scrub.offsetLeft - tip.offsetWidth - 4;
      scrub.style.setProperty('--kz-video-player-tip-x', `${Math.round(clamp(x, min, max))}px`);
    };
    if (scrub) {
      on(scrub, 'pointerenter', (event) => event.pointerType === 'mouse' && scrub.classList.add('is-pointing'));
      on(scrub, 'pointerleave', () => scrub.classList.remove('is-pointing'));
      on(scrub, 'pointermove', (event) => {
        const fraction = fractionAt(event.clientX);
        if (event.pointerType === 'mouse' || scrubbing) placeTip(fraction);
        if (!scrubbing) return;
        scrubTime = fraction * length();
        seekTo(scrubTime, true);
      });
      on(scrub, 'pointerdown', (event) => {
        if (event.button !== 0 || !length()) return;
        event.preventDefault();
        scrub.setPointerCapture(event.pointerId);
        scrubbing = true;
        scrub.classList.add('is-dragging');
        const fraction = fractionAt(event.clientX);
        placeTip(fraction);
        scrubTime = fraction * length();
        seekTo(scrubTime, true);
        wake();
      });
      const release = () => {
        if (!scrubbing) return;
        scrubbing = false;
        scrub.classList.remove('is-dragging');
        seekTo(scrubTime);
        rest();
      };
      on(scrub, 'pointerup', release);
      on(scrub, 'pointercancel', release);
    }

    if (volume) {
      const levelAt = (clientX) => {
        const r = volume.getBoundingClientRect();
        const scale = scaleOf();
        return clamp((clientX - r.left - 4 * scale) / (r.width - 12 * scale), 0, 1);
      };
      on(volume, 'pointerdown', (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        volume.setPointerCapture(event.pointerId);
        volume.classList.add('is-dragging');
        setVolume(levelAt(event.clientX));
      });
      on(volume, 'pointermove', (event) => volume.classList.contains('is-dragging') && setVolume(levelAt(event.clientX)));
      const release = () => volume.classList.remove('is-dragging');
      on(volume, 'pointerup', release);
      on(volume, 'pointercancel', release);
    }

    // The keys of a video player, wherever the focus is in it. None with a modifier: the
    // browser's own shortcuts stay
    on(root, 'keydown', (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const onVolume = event.target === volume;
      const onButton = !!event.target.closest?.('button');
      switch (event.key) {
        case ' ':
          if (onButton) return;
          togglePlay();
          break;
        case 'k':
        case 'K':
          togglePlay();
          break;
        case 'j':
        case 'J':
          seekBy(-JUMP);
          break;
        case 'l':
        case 'L':
          seekBy(JUMP);
          break;
        case 'ArrowLeft':
          if (onVolume) volumeBy(-VOLUME_STEP);
          else seekBy(-STEP);
          break;
        case 'ArrowRight':
          if (onVolume) volumeBy(VOLUME_STEP);
          else seekBy(STEP);
          break;
        case 'ArrowUp':
          volumeBy(VOLUME_STEP);
          break;
        case 'ArrowDown':
          volumeBy(-VOLUME_STEP);
          break;
        case 'Home':
          if (onVolume) setVolume(0);
          else seekTo(0);
          break;
        case 'End':
          if (onVolume) setVolume(1);
          else seekTo(length());
          break;
        case 'm':
        case 'M':
          toggleMute();
          break;
        case 'c':
        case 'C':
          if (!captionTrack) return;
          setCaptions(!captionsOn);
          break;
        case 'f':
        case 'F':
          if (root.classList.contains('no-full')) return;
          toggleFull();
          break;
        default:
          return;
      }
      event.preventDefault();
      wake();
    });

    signal.addEventListener('abort', () => {
      stopLoop();
      clearTimeout(idleTimer);
      video.pause();
      if (fullElement() === root) (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
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
