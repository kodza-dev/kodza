// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Quote Spotlight
// Turns the people under the quotes into real tabs (their face or logo, with a ring or a bar that
// fills while the quote is read), splits each quote into lines and words, and moves from one quote
// to the next: the lines leave behind their masks, the next quote's words rise into theirs, the
// name and role roll. The pointer over the section, the keyboard focus, the pause button, a section
// out of view or a hidden tab hold the quote; a quote picked by hand empties the ring backwards.
// With reduced motion (or a site pace of 0) the tabs swap the quote and nothing turns on its own.
// Settings: data-interval on the section (ms per quote), the --kz-quote-spotlight-* variables, and
// the constants below.
(() => {
  const SELECTOR = '[data-kodza-quote-spotlight]';
  const INTERVAL = 7000; // ms a quote stays without data-interval: reading time, so the pace leaves it alone
  const TURN = 1200; // ms from one quote to the next before the next ring starts filling
  const OUT = { duration: 600, stagger: 50, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' }; // the lines leaving
  const IN = { duration: 900, delay: 260, stagger: 24, spread: 480, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }; // words rising; a long quote shares `spread` ms
  const ROLL = { duration: 700, lag: 60, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' }; // the name, then the role
  const GLIDE = 'cubic-bezier(0.6, 0, 0.1, 1)'; // a ring or bar emptying
  const REWIND = 500; // ms for a ring to empty backwards when a quote is picked by hand
  const SWIPE = 40; // px a finger travels sideways to change the quote
  const NS = 'http://www.w3.org/2000/svg';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  let made = 0;

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const stage = root.querySelector('.kodza-quote-spotlight__stage');
    const list = root.querySelector('.kodza-quote-spotlight__tabs');
    const button = root.querySelector('.kodza-quote-spotlight__pause');
    const inner = root.querySelector('.kodza-quote-spotlight__inner') || root;
    if (!stage || !list) return;
    const slides = [...stage.querySelectorAll(':scope > .kodza-quote-spotlight__slide')];
    const n = slides.length;
    if (n < 2) return; // one quote: nothing to pick, and the CSS hides the controls
    const interval = Math.max(1000, parseFloat(root.dataset.interval) || INTERVAL);
    const id = `kodza-quote-spotlight-${Math.random().toString(36).slice(2, 8)}-${++made}`;

    const make = (tag, part) => {
      const el = document.createElement(tag);
      el.className = `kodza-quote-spotlight__${part}`;
      return el;
    };
    const svg = (tag, part, attrs) => {
      const el = document.createElementNS(NS, tag);
      el.setAttribute('class', `kodza-quote-spotlight__${part}`);
      Object.entries(attrs).forEach(([name, value]) => el.setAttribute(name, value));
      return el;
    };
    const initials = (name) => {
      const words = name.split(/\s+/).filter(Boolean);
      return words.length > 1 ? `${words[0][0]}${words[words.length - 1][0]}` : (words[0] || '').slice(0, 2);
    };
    // A logo's width over its height, so every logo gets the same visual weight
    const ratioOf = (mark) => {
      const box = mark.viewBox?.baseVal;
      if (box?.width && box.height) return box.width / box.height;
      if (mark.naturalWidth && mark.naturalHeight) return mark.naturalWidth / mark.naturalHeight;
      const width = parseFloat(mark.getAttribute('width'));
      const height = parseFloat(mark.getAttribute('height'));
      return width && height ? width / height : 0;
    };

    // The tabs: a copy of each face or logo (initials when there is none), a ring around a face, a
    // bar under a logo, and the name for screen readers
    const timers = slides.map((slide, i) => {
      const who = slide.querySelector('.kodza-quote-spotlight__who');
      const name = who?.querySelector('.kodza-quote-spotlight__name')?.textContent.trim() || `Quote ${i + 1}`;
      const mark = who?.querySelector(':scope > .kodza-quote-spotlight__face, :scope > .kodza-quote-spotlight__logo');
      const logo = !!mark?.classList.contains('kodza-quote-spotlight__logo');
      const tab = make('button', 'tab');
      tab.type = 'button';
      tab.id = `${id}-tab-${i}`;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', `${id}-quote-${i}`);
      let face = mark?.cloneNode(true);
      if (!face) {
        face = make('span', 'face');
        face.textContent = initials(name);
      }
      face.setAttribute('aria-hidden', 'true');
      if (face.tagName === 'IMG') face.alt = '';
      let fill;
      if (logo) {
        tab.classList.add('kodza-quote-spotlight__tab--logo');
        const setRatio = () => {
          const ratio = ratioOf(face);
          if (ratio) tab.style.setProperty('--kz-quote-spotlight-ratio', ratio.toFixed(3));
        };
        setRatio();
        if (face.tagName === 'IMG' && !face.complete) face.addEventListener('load', setRatio, { once: true, signal });
        const bar = make('span', 'bar');
        fill = make('span', 'fill');
        bar.append(fill);
        tab.append(face, bar);
      } else {
        const ring = svg('svg', 'time', { viewBox: '0 0 56 56', 'aria-hidden': 'true' });
        fill = svg('circle', 'fill', { cx: 28, cy: 28, r: 27, pathLength: 100 });
        ring.append(svg('circle', 'track', { cx: 28, cy: 28, r: 27 }), fill);
        tab.append(ring, face);
      }
      const label = make('span', 'sr');
      label.textContent = name;
      tab.append(label);
      slide.id = `${id}-quote-${i}`;
      slide.setAttribute('role', 'tabpanel');
      slide.setAttribute('aria-labelledby', tab.id);
      return { tab, fill, bar: logo, winding: null };
    });
    const tabs = timers.map((t) => t.tab);
    list.setAttribute('role', 'tablist');
    list.setAttribute('aria-label', list.dataset.label || 'Choose a quote');
    if (timers.some((t) => t.bar)) list.classList.add('kodza-quote-spotlight__tabs--logos');
    list.replaceChildren(...tabs);
    const select = (to) => tabs.forEach((tab, i) => {
      tab.classList.toggle('is-active', i === to);
      tab.setAttribute('aria-selected', String(i === to));
      tab.tabIndex = i === to ? 0 : -1;
    });
    root.classList.add('is-tabbed');
    let current = 0;
    slides[0].classList.add('is-current');
    select(0);

    // The name and the role each get an inner line that rolls inside them
    const rises = slides.map(() => []);
    const rise = () => slides.forEach((slide, i) => {
      slide.querySelectorAll('.kodza-quote-spotlight__name, .kodza-quote-spotlight__role').forEach((el) => {
        const line = make('span', 'rise');
        line.append(...el.childNodes);
        el.append(line);
        rises[i].push(line);
      });
    });

    // Each quote in words, then in lines (one mask per line), the text kept whole for screen readers.
    // Done again when the width changes: the lines are where the words fall
    const texts = new Map();
    const parts = slides.map(() => ({ words: [], lifts: [] }));
    const blocksOf = (slide) => {
      const quote = slide.querySelector('.kodza-quote-spotlight__quote');
      if (!quote) return [];
      const paragraphs = [...quote.querySelectorAll(':scope > p')];
      return paragraphs.length ? paragraphs : [quote];
    };
    const spaced = (els) => els.flatMap((el, k) => (k ? [' ', el] : [el]));
    const split = () => {
      root.classList.add('is-split');
      // Writes: the words, with the opening mark hung before the first one
      const all = slides.map((slide) => {
        const blocks = blocksOf(slide);
        return blocks.map((block, b) => {
          if (!texts.has(block)) texts.set(block, block.textContent.replace(/\s+/g, ' ').trim());
          const sr = make('span', 'sr');
          sr.textContent = texts.get(block);
          const words = sr.textContent.split(' ').filter(Boolean).map((text) => {
            const word = make('span', 'word');
            word.textContent = text;
            return word;
          });
          if (b === 0 && words.length) {
            const mark = make('span', 'mark');
            mark.textContent = '“';
            words[0].prepend(mark);
          }
          if (b === blocks.length - 1 && words.length) words[words.length - 1].append('”');
          block.replaceChildren(sr, ...spaced(words));
          return { block, sr, words };
        });
      });
      // Reads: where each word falls
      const rows = all.map((sets) => sets.map(({ words }) => {
        const lines = [];
        let top = -Infinity;
        words.forEach((word) => {
          if (word.offsetTop > top + 2) {
            lines.push([]);
            top = word.offsetTop;
          }
          lines[lines.length - 1].push(word);
        });
        return lines;
      }));
      // Writes: one mask per line
      all.forEach((sets, i) => {
        parts[i] = { words: [], lifts: [] };
        sets.forEach(({ block, sr, words }, b) => {
          const box = make('span', 'lines');
          box.setAttribute('aria-hidden', 'true');
          rows[i][b].forEach((row) => {
            const line = make('span', 'line');
            const lift = make('span', 'lift');
            lift.append(...spaced(row));
            line.append(lift);
            box.append(line);
            parts[i].lifts.push(lift);
          });
          parts[i].words.push(...words);
          block.replaceChildren(sr, box);
        });
      });
    };

    // The change of quote
    const running = slides.map(() => []);
    const gens = slides.map(() => 0);
    let ready = false;
    const play = (i, el, frames, { duration, delay = 0, easing, fill }) => {
      const animation = el.animate(frames, { duration: duration * pace, delay: delay * pace, easing, fill });
      running[i].push(animation);
      return animation;
    };
    const stop = (i) => {
      running[i].forEach((animation) => animation.cancel());
      running[i] = [];
    };
    // The lines go behind their masks, first line first (last line first going back); the name and
    // the role roll out from where they are, even halfway in
    const leave = (i, dir) => {
      const turn = ++gens[i];
      const slide = slides[i];
      slide.classList.remove('is-current');
      slide.classList.add('is-leaving');
      const { lifts } = parts[i];
      const done = lifts.map((lift, k) => play(i, lift, [{ transform: 'none' }, { transform: `translateY(${-120 * dir}%)` }], {
        ...OUT, delay: (dir > 0 ? k : lifts.length - 1 - k) * OUT.stagger, fill: 'forwards',
      }).finished);
      rises[i].forEach((el, k) => done.push(play(i, el, [{ transform: getComputedStyle(el).transform }, { transform: `translateY(${-120 * dir}%)` }], {
        ...ROLL, delay: k * ROLL.lag, fill: 'forwards',
      }).finished));
      Promise.all(done).then(() => {
        if (gens[i] !== turn) return;
        slide.classList.remove('is-leaving');
        stop(i);
      }, () => {});
    };
    // The words rise into their lines one after another (a long quote shares the same time), then
    // the name and the role roll in
    const enter = (i, dir) => {
      gens[i]++;
      stop(i);
      slides[i].classList.remove('is-leaving');
      slides[i].classList.add('is-current');
      const { words } = parts[i];
      const step = Math.min(IN.stagger, IN.spread / Math.max(1, words.length));
      words.forEach((word, k) => play(i, word, [{ transform: `translateY(${120 * dir}%)` }, { transform: 'none' }], {
        ...IN, delay: IN.delay + k * step, fill: 'backwards',
      }));
      rises[i].forEach((el, k) => play(i, el, [{ transform: `translateY(${120 * dir}%)` }, { transform: 'none' }], {
        ...ROLL, delay: IN.delay + k * ROLL.lag, fill: 'backwards',
      }));
    };
    const show = (to, dir) => {
      if (to === current) return;
      const from = current;
      current = to;
      select(to);
      if (still || !ready) {
        slides[from].classList.remove('is-current');
        slides[to].classList.add('is-current');
        return;
      }
      leave(from, dir);
      enter(to, dir);
    };

    // The timer: the active ring (or bar) fills for the reading time, then empties forward while the
    // next quote comes in, and the next ring starts once it is there
    let timer = null; // the fill running, for timed
    let timed = null;
    let started = 0;
    let rounds = 0;
    const frameOf = (t, v) => (t.bar
      ? { transform: `translateX(${Math.max(0, v - 1) * 100}%) scaleX(${v <= 1 ? v : 2 - v})` }
      : { strokeDashoffset: String(100 - v * 100) });
    const draw = (t, from, to, duration, easing) => t.fill.animate([frameOf(t, from), frameOf(t, to)], { duration, easing, fill: 'forwards' });
    const wind = (t, from, to, duration) => {
      t.winding?.cancel();
      t.tab.classList.add('is-emptying');
      const winding = draw(t, from, to, duration, GLIDE);
      t.winding = winding;
      winding.finished.then(() => {
        if (t.winding !== winding) return;
        t.winding = null;
        t.tab.classList.remove('is-emptying');
        winding.cancel();
      }, () => {});
    };
    const later = (round) => {
      clearTimeout(started);
      started = setTimeout(() => tick(round), TURN * pace);
    };
    const tick = (round) => {
      if (round !== rounds || signal.aborted) return;
      const t = timers[current];
      t.winding?.cancel();
      t.winding = null;
      t.tab.classList.remove('is-emptying');
      const filled = draw(t, 0, 1, interval, 'linear');
      timer = filled;
      timed = t;
      sync();
      filled.finished.then(() => {
        if (round !== rounds || timer !== filled) return;
        timer = null;
        wind(t, 1, 2, TURN * pace);
        filled.cancel();
        show((current + 1) % n, 1);
        later(round);
      }, () => {});
    };
    // A quote picked by hand: the ring empties backwards from where it was
    const halt = () => {
      rounds++;
      clearTimeout(started);
      if (!timer) return;
      wind(timed, Math.min(1, timer.currentTime / interval), 0, REWIND * pace);
      timer.cancel();
      timer = null;
    };
    const go = (to, dir) => {
      if (to === current) return;
      halt();
      show(to, dir);
      if (!still && ready) later(rounds);
    };

    // What holds the quote: the pause button, the pointer over the section, the keyboard focus, a
    // section out of view, a hidden tab. Screen readers hear the change only when nothing turns
    let held = false;
    let hovered = false;
    let focused = false;
    let visible = true;
    const sync = () => {
      const waiting = held || hovered || focused || !visible || document.hidden;
      stage.setAttribute('aria-live', still || held || focused ? 'polite' : 'off');
      if (!timer) return;
      if (waiting && timer.playState === 'running') timer.pause();
      else if (!waiting && timer.playState === 'paused') timer.play();
    };

    inner.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse') return;
      hovered = true;
      sync();
    }, { signal });
    inner.addEventListener('pointerleave', () => {
      hovered = false;
      sync();
    }, { signal });
    tabs.forEach((tab, i) => tab.addEventListener('click', () => go(i, i < current ? -1 : 1), { signal }));
    list.addEventListener('keydown', (event) => {
      const at = tabs.includes(event.target) ? tabs.indexOf(event.target) : current;
      let to;
      let dir;
      if (event.key === 'ArrowRight') [to, dir] = [(at + 1) % n, 1];
      else if (event.key === 'ArrowLeft') [to, dir] = [(at - 1 + n) % n, -1];
      else if (event.key === 'Home') [to, dir] = [0, -1];
      else if (event.key === 'End') [to, dir] = [n - 1, 1];
      else return;
      event.preventDefault();
      focused = true;
      go(to, dir);
      tabs[to].focus();
      sync();
    }, { signal });
    // A finger swiped sideways over the quote (a vertical one still scrolls the page)
    let swipe = null;
    stage.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse') return;
      swipe = { x: event.clientX, y: event.clientY, id: event.pointerId };
    }, { signal });
    stage.addEventListener('pointerup', (event) => {
      if (!swipe || event.pointerId !== swipe.id) return;
      const dx = event.clientX - swipe.x;
      const dy = event.clientY - swipe.y;
      swipe = null;
      if (Math.abs(dx) < SWIPE || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      if (dx < 0) go((current + 1) % n, 1);
      else go((current - 1 + n) % n, -1);
    }, { signal });
    stage.addEventListener('pointercancel', () => {
      swipe = null;
    }, { signal });
    button?.addEventListener('click', () => {
      held = !held;
      button.setAttribute('aria-pressed', String(held));
      sync();
    }, { signal });
    // Focus held by the keyboard only (a click focuses too); the pause button never holds
    root.addEventListener('focusin', (event) => {
      focused = event.target !== button && event.target.matches(':focus-visible');
      sync();
    }, { signal });
    root.addEventListener('focusout', (event) => {
      if (root.contains(event.relatedTarget)) return;
      focused = false;
      sync();
    }, { signal });
    document.addEventListener('visibilitychange', sync, { signal });

    // A new width (or a new font size) puts the words on new lines: split again, mid-change or not
    let key = '';
    let pending = 0;
    const sample = slides[0].querySelector('.kodza-quote-spotlight__quote') || stage;
    const keyOf = () => `${stage.clientWidth} ${parseFloat(getComputedStyle(sample).fontSize)}`;
    const resized = new ResizeObserver(() => {
      if (!ready || keyOf() === key) return;
      key = keyOf();
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(() => {
        slides.forEach((slide, i) => {
          gens[i]++;
          stop(i);
          slide.classList.remove('is-leaving');
        });
        split();
      });
    });
    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    signal.addEventListener('abort', () => {
      resized.disconnect();
      seen.disconnect();
      clearTimeout(started);
      cancelAnimationFrame(pending);
      rounds++;
      timer?.cancel();
      timers.forEach((t) => t.winding?.cancel());
      slides.forEach((_, i) => stop(i));
    }, { once: true });

    sync();
    if (still) {
      root.classList.add('is-still');
      return;
    }
    root.classList.add('is-live');
    // Lines are measured in the real font
    Promise.resolve(document.fonts?.ready).then(() => {
      if (signal.aborted) return;
      rise();
      split();
      ready = true;
      key = keyOf();
      resized.observe(stage);
      seen.observe(root);
      tick(rounds);
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
