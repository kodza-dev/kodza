// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Transcript
// The words of a video or a podcast beside it, at their time. While it plays, the sentence being
// said fills with ink as it is spoken and the rest steps back; the panel glides to keep it in
// view, lets go the moment you scroll it yourself, and Back to now brings it home. A click on a
// sentence, or on its time, plays from there; so do Enter and Space, the arrows walk the lines.
// The times come from the markup (data-at, data-end), or from the media's own captions track when
// the panel is empty. At rest the whole text reads in full ink, with or without the script.
// Settings: the --kz-transcript-* variables (CSS), data-media on the root (a player elsewhere on
// the page), the words below (data-text-now) and the timings below.
(() => {
  const SELECTOR = '[data-kodza-transcript]';
  const WORDS = {
    now: 'Back to now', // the pill that brings the sentence being said back into view
  };
  const ANCHOR = 0.3; // where the sentence being said sits in the panel, from the top
  const GLIDE = 650; // ms the panel takes to glide to the next sentence
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const easeOut = (t) => 1 - (1 - t) ** 3;
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  // "1:02.5", "62.5" or "0:01:02.5" in seconds
  const seconds = (text) => String(text ?? '').trim().split(':').reduce((sum, part) => sum * 60 + Number(part), 0);
  const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const ARROW = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3v10M4 9l4 4 4-4"/></svg>';

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const scroller = root.querySelector('.kodza-transcript__scroll');
    const panel = root.querySelector('.kodza-transcript__panel') || scroller?.parentElement;
    const media = (root.dataset.media && document.querySelector(root.dataset.media)) || root.querySelector('video, audio');
    if (!scroller || !panel || !media) return;

    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'kodza-transcript__now';
    pill.innerHTML = ARROW;
    pill.append(document.createElement('span'));
    pill.lastChild.textContent = root.dataset.textNow || WORDS.now;
    panel.append(pill);

    let lines = [];
    let now = -1; // the sentence being said
    let adrift = false; // scrolled away by hand: the panel stops following
    let frame = 0;
    let glideFrame = 0;
    let feather = 14;
    const following = () => root.classList.contains('is-following');

    // Screen pixels to the panel's own: a parent scaled by transform (a thumbnail, a theme) must
    // not shift the glide or the ink
    const scaleOf = () => (scroller.offsetWidth ? scroller.getBoundingClientRect().width / scroller.offsetWidth : 1);
    const measure = () => {
      const scale = scaleOf();
      feather = parseFloat(getComputedStyle(root).getPropertyValue('--kz-transcript-feather')) || 0;
      lines.forEach((line) => {
        line.width = [...line.el.getClientRects()].reduce((sum, rect) => sum + rect.width, 0) / scale;
      });
    };
    const endOf = (i) => {
      const line = lines[i];
      const next = lines[i + 1];
      const end = Number.isFinite(line.end) ? line.end : next ? next.at : media.duration;
      return Number.isFinite(end) && end > line.at ? end : line.at + 2;
    };

    const setup = () => {
      lines = [...scroller.querySelectorAll('[data-at]')]
        .map((el) => ({ el, at: seconds(el.dataset.at), end: el.dataset.end ? seconds(el.dataset.end) : NaN, width: 0 }))
        .filter((line) => Number.isFinite(line.at))
        .sort((a, b) => a.at - b.at);
      lines.forEach((line, i) => {
        line.el.setAttribute('role', 'button');
        line.el.tabIndex = i ? -1 : 0;
        // The time of its paragraph, in the gutter, for the first sentence of each one
        const block = line.el.parentElement?.closest('p');
        if (block?.parentElement !== scroller) return;
        line.block = block;
        if (block.querySelector('.kodza-transcript__stamp')) return;
        const stamp = document.createElement('span');
        stamp.className = 'kodza-transcript__stamp';
        stamp.setAttribute('aria-hidden', 'true');
        stamp.textContent = clock(line.at);
        block.prepend(stamp);
      });
      if (lines.length) scroller.removeAttribute('tabindex');
      measure();
      tick();
    };

    const roving = (i) => lines.forEach((line, k) => { line.el.tabIndex = k === i ? 0 : -1; });

    const glide = (to, instant) => {
      cancelAnimationFrame(glideFrame);
      glideFrame = 0;
      const target = clamp(to, 0, scroller.scrollHeight - scroller.clientHeight);
      const from = scroller.scrollTop;
      if (Math.abs(target - from) < 1) return;
      if (still || instant) {
        scroller.scrollTop = target;
        return;
      }
      const duration = GLIDE * pace;
      const start = performance.now();
      const step = (time) => {
        const t = Math.min(1, (time - start) / duration);
        scroller.scrollTop = from + (target - from) * easeOut(t);
        glideFrame = t < 1 ? requestAnimationFrame(step) : 0;
      };
      glideFrame = requestAnimationFrame(step);
    };
    // Where a line sits in the scrolled text, in the panel's own pixels
    const offsetOf = (el) => (el.getBoundingClientRect().top - scroller.getBoundingClientRect().top) / scaleOf();
    const place = (instant) => {
      const line = lines[now];
      if (line) glide(scroller.scrollTop + offsetOf(line.el) - scroller.clientHeight * ANCHOR, instant);
    };
    // A line walked to with the keyboard stays clear of the edges, and of the pill
    const reveal = (el) => {
      const top = offsetOf(el);
      const bottom = top + el.getBoundingClientRect().height / scaleOf();
      if (top < 24) glide(scroller.scrollTop + top - 24);
      else if (bottom > scroller.clientHeight - 64) glide(scroller.scrollTop + bottom - scroller.clientHeight + 64);
    };

    // Back to now shows only while the sentence being said is out of sight, its arrow towards it
    const sync = () => {
      const line = lines[now];
      let lost = false;
      let behind = false;
      if (line && adrift && following()) {
        const box = scroller.getBoundingClientRect();
        const rect = line.el.getBoundingClientRect();
        behind = rect.bottom < box.top + 8;
        lost = behind || rect.top > box.bottom - 56 * scaleOf();
      }
      root.classList.toggle('is-lost', lost);
      root.classList.toggle('is-behind', behind);
    };

    const setNow = (i) => {
      if (i === now) return;
      const old = lines[now];
      if (old) {
        old.el.classList.remove('is-now');
        old.el.removeAttribute('aria-current');
        old.block?.classList.remove('is-now');
      }
      now = i;
      const line = lines[now];
      if (line) {
        // From the start of the sentence: the ink is set before it shows
        line.el.style.setProperty('--kz-transcript-said', '0px');
        line.el.classList.add('is-now');
        line.el.setAttribute('aria-current', 'true');
        line.block?.classList.add('is-now');
        if (!scroller.contains(document.activeElement)) roving(now);
        if (!adrift) place();
      }
      sync();
    };

    const tick = () => {
      const time = media.currentTime;
      const length = media.duration;
      root.style.setProperty('--kz-transcript-progress', length ? (time / length).toFixed(4) : '0');
      let i = -1;
      if (following()) {
        while (i + 1 < lines.length && lines[i + 1].at <= time) i += 1;
      }
      setNow(i);
      const line = lines[now];
      if (!line) return;
      const said = still ? 1 : clamp((time - line.at) / (endOf(now) - line.at), 0, 1);
      line.el.style.setProperty('--kz-transcript-said', `${(said * (line.width + feather)).toFixed(1)}px`);
      sync();
    };
    const loop = () => {
      cancelAnimationFrame(frame);
      const step = () => {
        tick();
        frame = media.paused ? 0 : requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };

    const jump = (i) => {
      adrift = false;
      root.classList.add('is-following');
      media.currentTime = lines[i].at;
      if (media.paused) media.play()?.catch(() => {});
      tick();
      place();
    };

    media.addEventListener('play', () => {
      root.classList.add('is-following');
      loop();
    }, { signal });
    media.addEventListener('ended', () => {
      root.classList.remove('is-following');
      adrift = false;
      setNow(-1);
    }, { signal });
    ['seeked', 'timeupdate', 'loadedmetadata'].forEach((type) => media.addEventListener(type, tick, { signal }));

    // Scrolling by hand lets go of the sentence; the glide stops where it is
    const drift = () => {
      adrift = true;
      cancelAnimationFrame(glideFrame);
      glideFrame = 0;
    };
    scroller.addEventListener('wheel', drift, { passive: true, signal });
    scroller.addEventListener('touchmove', drift, { passive: true, signal });
    scroller.addEventListener('pointerdown', (event) => {
      if (event.target === scroller) drift(); // its scrollbar
    }, { signal });
    scroller.addEventListener('scroll', sync, { passive: true, signal });

    pill.addEventListener('click', () => {
      const keyboard = pill.matches(':focus-visible');
      adrift = false;
      place();
      sync();
      if (keyboard && lines[now]) {
        roving(now);
        lines[now].el.focus({ preventScroll: true });
      }
    }, { signal });

    scroller.addEventListener('click', (event) => {
      // Selecting words to copy them is reading, not asking to play
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed && scroller.contains(selection.anchorNode)) return;
      const stamp = event.target.closest('.kodza-transcript__stamp');
      const el = stamp ? stamp.parentElement.querySelector('[data-at]') : event.target.closest('[data-at]');
      const i = lines.findIndex((line) => line.el === el);
      if (i < 0) return;
      roving(i);
      jump(i);
    }, { signal });

    scroller.addEventListener('keydown', (event) => {
      if (event.key === 'PageUp' || event.key === 'PageDown') return drift();
      const i = lines.findIndex((line) => line.el === event.target);
      if (i < 0) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!event.repeat) jump(i);
        return;
      }
      const to = { ArrowUp: i - 1, ArrowDown: i + 1, Home: 0, End: lines.length - 1 }[event.key];
      if (to === undefined) return;
      event.preventDefault();
      const k = clamp(to, 0, lines.length - 1);
      drift();
      roving(k);
      lines[k].el.focus({ preventScroll: true });
      reveal(lines[k].el);
      sync();
    }, { signal });

    // The lines move with the page (a resize, the font arriving): the ink and the glide follow
    const observer = new ResizeObserver(() => {
      measure();
      if (!adrift) place(true);
      tick();
    });
    observer.observe(scroller);
    document.fonts?.ready.then(() => signal.aborted || measure());

    // An empty panel reads the media's captions: one paragraph per cue
    if (!scroller.querySelector('[data-at]')) {
      const track = [...media.textTracks].find((t) => t.kind === 'captions' || t.kind === 'subtitles');
      if (track) {
        const mode = track.mode;
        if (mode === 'disabled') track.mode = 'hidden'; // a disabled track never loads its cues
        const fill = () => {
          if (signal.aborted || lines.length || !track.cues?.length) return;
          scroller.replaceChildren(...[...track.cues].map((cue) => {
            const p = document.createElement('p');
            const span = document.createElement('span');
            span.dataset.at = cue.startTime;
            span.dataset.end = cue.endTime;
            span.textContent = cue.text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
            p.append(span);
            return p;
          }));
          setup();
        };
        media.querySelector('track')?.addEventListener('load', fill, { signal });
        media.addEventListener('loadedmetadata', fill, { signal });
        fill();
        signal.addEventListener('abort', () => { track.mode = mode; });
      }
    } else {
      setup();
    }
    if (!media.paused) {
      root.classList.add('is-following');
      loop();
    }

    signal.addEventListener('abort', () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(glideFrame);
      observer.disconnect();
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
