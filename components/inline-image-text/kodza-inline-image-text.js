// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Inline Image Text
// When the sentence reaches the screen, lays it out in the lines the browser actually wraps,
// pictures included, and plays the entrance: each line rises from behind its mask, and each
// picture opens as its line lands, once it is loaded. Then the markup goes back to the way it
// was written: the pictures are moved, never reloaded, and a loop keeps playing.
// Settings: the --kz-inline-image-text-* variables in component.css (size and shape of the
// pictures, durations), and the constants below.
(() => {
  const SELECTOR = '.kodza-inline-image-text';
  const MEDIA = '.kodza-inline-image-text__media';
  // When a picture starts opening, as a share of its line's rise: it opens as its line comes up
  const OPEN_AT = 0.1;
  // Pictures open in reading order, at least this many line steps apart
  // (--kz-inline-image-text-stagger), even when their lines land together
  const MEDIA_STEP = 1;
  // On a replay, the lines leave upwards first: in this share of the rise
  // (--kz-inline-image-text-duration), this share of the stagger apart
  const LEAVE = 0.55;
  const LEAVE_STEP = 0.5;
  // The longest wait for a loop's first frame, in ms: past it, the picture opens on the poster
  const VIDEO_WAIT = 2500;
  // Where it starts: once its top is this far into the screen
  const START = '0px 0px -12% 0px';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  // A duration variable, written in s or ms, in ms
  const time = (el, name, fallback) => {
    const value = getComputedStyle(el).getPropertyValue(name).trim();
    const n = parseFloat(value);
    if (!Number.isFinite(n)) return fallback;
    return value.endsWith('ms') ? n : n * 1000;
  };

  // Lays the sentence out in lines, each in its own mask, and returns the pictures of each line.
  // Words and pictures are the pieces, grouped by the line their middle sits on: a picture at
  // the start or the end of a line stays with it. Each line is cloned from the text as written
  // (links, emphasis), then the live pictures are moved into the clone.
  function split(root) {
    const texts = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) if (!walker.currentNode.parentElement.closest(MEDIA)) texts.push(walker.currentNode);
    texts.forEach((node) => {
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part.trim()) return part && node.before(part);
        const word = document.createElement('span');
        word.className = 'kodza-inline-image-text__word';
        word.textContent = part;
        node.before(word);
      });
      node.remove();
    });

    // Screen pixels to CSS pixels, should a parent be scaled by a transform
    const scale = root.getBoundingClientRect().width / root.offsetWidth || 1;
    const style = getComputedStyle(root);
    const reach = (parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2) * scale / 2;
    const lines = [];
    root.querySelectorAll(`.kodza-inline-image-text__word, ${MEDIA}`).forEach((piece) => {
      const box = piece.getBoundingClientRect();
      const middle = box.top + box.height / 2;
      const line = lines[lines.length - 1];
      if (line && Math.abs(middle - line.middle) < reach) line.pieces.push(piece);
      else lines.push({ middle, pieces: [piece] });
    });

    const range = document.createRange();
    const copies = lines.map(({ pieces }) => {
      range.setStartBefore(pieces[0]);
      range.setEndAfter(pieces[pieces.length - 1]);
      const copy = range.cloneContents();
      copy.querySelectorAll('.kodza-inline-image-text__word').forEach((word) => word.replaceWith(word.textContent));
      copy.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
      return { copy, media: pieces.filter((piece) => piece.matches(MEDIA)) };
    });
    // Moved within the same task, a playing <video> does not pause
    root.textContent = '';
    copies.forEach(({ copy, media }, i) => {
      copy.querySelectorAll(MEDIA).forEach((clone, k) => clone.replaceWith(media[k]));
      const line = document.createElement('span');
      const row = document.createElement('span');
      line.className = 'kodza-inline-image-text__line';
      row.className = 'kodza-inline-image-text__row';
      row.style.setProperty('--kz-line', i);
      row.append(copy);
      line.append(row);
      root.append(line, ' ');
    });
    return copies.map(({ media }) => media);
  }

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const html = root.innerHTML;
    const media = [...root.querySelectorAll(MEDIA)];
    const videos = [...root.querySelectorAll(`${MEDIA} video`)];
    const timers = new Set();
    let run = 0;

    const wait = (ms) => new Promise((resolve) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        resolve();
      }, ms);
      timers.add(timer);
    });
    // The first of these events, then none of them is listened to any more
    const event = (el, types) => new Promise((resolve) => {
      const done = () => {
        types.forEach((type) => el.removeEventListener(type, done));
        resolve();
      };
      types.forEach((type) => el.addEventListener(type, done, { signal }));
    });
    const stop = () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
    // Resolves once a picture has something to show: its image loaded (or failed), or the first
    // frame of its loop (the poster, past VIDEO_WAIT)
    const ready = (box) => {
      const video = box.querySelector('video');
      const img = box.querySelector('img');
      if (video) {
        if (video.readyState >= 2) return Promise.resolve();
        return Promise.race([event(video, ['loadeddata', 'error']), wait(VIDEO_WAIT)]);
      }
      if (!img) return Promise.resolve();
      return (img.complete ? Promise.resolve() : event(img, ['load', 'error'])).then(() => img.decode?.().catch(() => {}));
    };

    // The markup as written, with the live pictures back in their places
    const restore = () => {
      const page = document.createElement('template');
      page.innerHTML = html;
      page.content.querySelectorAll(MEDIA).forEach((clone, k) => clone.replaceWith(media[k]));
      root.classList.remove('is-playing', 'is-shown', 'is-leaving');
      media.forEach((box) => box.classList.remove('is-open'));
      root.replaceChildren(page.content);
    };

    // A replay over the sentence at rest: its lines first leave upwards, behind their masks, so
    // the entrance never starts from a sentence wiped in one frame
    const leave = (token) => {
      if (!root.querySelector('.kodza-inline-image-text__line')) split(root);
      root.classList.add('is-shown');
      void root.offsetWidth; // the lines leave from where they rest
      root.classList.add('is-leaving');
      const count = root.querySelectorAll('.kodza-inline-image-text__line').length;
      const duration = time(root, '--kz-inline-image-text-duration', 900);
      const stagger = time(root, '--kz-inline-image-text-stagger', 90);
      // The last line is out of sight by 0.8 of its run: the entrance follows it at once
      wait((duration * LEAVE * 0.8 + stagger * LEAVE_STEP * (count - 1)) * pace).then(() => token === run && enter(token));
    };

    const play = () => {
      if (still) return;
      const token = ++run;
      stop();
      // The first entrance, or a replay over one still playing, starts from below at once
      if (root.classList.contains('is-armed') || root.classList.contains('is-playing')) enter(token);
      else leave(token);
    };

    const enter = (token) => {
      if (root.classList.contains('is-playing') || root.classList.contains('is-shown')) restore();
      // Behind a closed mask, a lazy image would wait for a scroll that never comes
      root.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = 'eager'; });
      const lines = split(root);
      root.classList.remove('is-armed');
      void root.offsetWidth; // the lines start below their mask, even on a replay
      root.classList.add('is-playing');

      const duration = time(root, '--kz-inline-image-text-duration', 900);
      const stagger = time(root, '--kz-inline-image-text-stagger', 90);
      const steps = [wait((duration * 1.1 + stagger * (lines.length - 1)) * pace)];
      let turn = -Infinity;
      lines.forEach((boxes, i) => boxes.forEach((box) => {
        turn = Math.max(stagger * i, turn + stagger * MEDIA_STEP);
        const at = (turn + duration * OPEN_AT) * pace;
        steps.push(Promise.all([wait(at), ready(box)]).then(() => {
          if (token !== run) return;
          box.classList.add('is-open');
          return wait(duration * 1.9 * pace); // the zoom, the longest of the two
        }));
      }));
      Promise.all(steps).then(() => token === run && !signal.aborted && restore());
    };

    // A loop plays while it is on screen, never on the still path
    const seen = new IntersectionObserver((entries) => {
      const on = entries[entries.length - 1].isIntersecting && !still;
      videos.forEach((video) => {
        video.muted = true;
        if (on) video.play().catch(() => {});
        else video.pause();
      });
    });
    if (videos.length) seen.observe(root);
    signal.addEventListener('abort', () => {
      seen.disconnect();
      videos.forEach((video) => video.pause());
    });
    if (still) return;

    root.classList.add('is-armed');
    const start = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      start.disconnect();
      // Lines are measured with the page's own font
      document.fonts.ready.then(() => !signal.aborted && !run && play());
    }, { rootMargin: START });
    start.observe(root);
    root.addEventListener('kodza:replay', play, { signal });
    // An entrance still playing would put its lines back into the restored markup
    signal.addEventListener('abort', () => {
      start.disconnect();
      run += 1;
      stop();
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
