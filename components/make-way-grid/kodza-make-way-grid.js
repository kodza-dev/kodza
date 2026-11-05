// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Make Way Grid
// Opens one picture at a time: it takes two by two cells, the others slide out of its way
// (measured before and after, then animated from where they were), and its card unfolds from
// the name pill. Each card text is cut into lines at the card's width, so it rises line by line.
// Tune it with the --kz-make-way-* variables in the CSS and the constants below.
(() => {
  const SELECTOR = '.kodza-make-way';
  const MOVE = 700; // ms, the pictures sliding to their new cells; the card unfolds while they move (CSS)
  const MOVE_EASE = 'cubic-bezier(0.76, 0, 0.24, 1)';
  const CAUGHT_EASE = 'cubic-bezier(0.33, 0.66, 0.4, 1)'; // a move caught mid-way goes on at speed, no stop
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const grid = root.querySelector('.kodza-make-way__grid');
    const items = grid ? [...grid.children].filter((el) => el.matches('.kodza-make-way__item')) : [];
    const frames = items.map((item) => item.querySelector('.kodza-make-way__frame'));
    const toggles = items.map((item) => item.querySelector('.kodza-make-way__toggle'));
    const pills = items.map((item) => item.querySelector('.kodza-make-way__label'));
    const cards = items.map((item) => item.querySelector('.kodza-make-way__details'));
    if (!items.length || [...frames, ...toggles, ...pills, ...cards].some((el) => !el)) return;

    // Plain text only: a title or paragraph with links or markup just shows with its card
    const texts = cards.map((card) => [...card.querySelectorAll('.kodza-make-way__title, .kodza-make-way__meta, .kodza-make-way__text')]
      .filter((el) => !el.children.length)
      .map((el) => ({ el, words: el.textContent.trim().split(/[^\S ]+/) })));

    // Cuts a text into masked lines; the line count runs on from `first` across a card's texts
    const split = (el, words, first) => {
      el.textContent = '';
      const spans = words.map((word) => {
        const span = document.createElement('span');
        span.textContent = `${word} `;
        el.append(span);
        return span;
      });
      const lines = [];
      spans.forEach((span) => {
        const last = lines[lines.length - 1];
        if (last && last.top === span.offsetTop) last.words.push(span.textContent);
        else lines.push({ top: span.offsetTop, words: [span.textContent] });
      });
      el.textContent = '';
      lines.forEach((line, i) => {
        const outer = document.createElement('span');
        const inner = document.createElement('span');
        outer.className = 'kodza-make-way__line';
        inner.textContent = line.words.join('').trim();
        inner.style.setProperty('--kz-line', first + i);
        outer.append(inner);
        el.append(outer, ' ');
      });
      return first + lines.length;
    };

    // Lines at the card's width, and each card folded down to its pill (same corner, same size)
    let measured = -1;
    const layout = () => {
      const width = cards[0].offsetWidth;
      if (width !== measured) {
        measured = width;
        texts.forEach((list) => list.reduce((first, { el, words }) => split(el, words, first), 0));
      }
      cards.forEach((card, i) => {
        const pill = pills[i];
        const round = Math.min(parseFloat(getComputedStyle(pill).borderTopLeftRadius) || 0, pill.offsetHeight / 2);
        card.style.setProperty('--kz-make-way-fold', `inset(${card.offsetHeight - pill.offsetHeight}px ${card.offsetWidth - pill.offsetWidth}px 0px 0px round ${round}px)`);
      });
    };

    // The open picture keeps its row and takes the cells on its free side; the others flow
    // around it in order
    let current = -1;
    const spanOf = () => Math.max(1, parseInt(getComputedStyle(root).getPropertyValue('--kz-make-way-span'), 10) || 2);
    const place = () => {
      const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      const span = spanOf();
      const across = Math.min(span, cols);
      items.forEach((item, i) => {
        const open = i === current;
        item.style.gridColumn = open ? `${Math.min(i % cols, cols - across) + 1} / span ${across}` : '';
        item.style.gridRow = open ? `${Math.floor(i / cols) + 1} / span ${span}` : '';
      });
    };

    // The engine moves the pictures: they slide and grow from their old cells to their new ones
    const engine = makeWay(grid, frames, { duration: MOVE * pace, easing: MOVE_EASE, caught: CAUGHT_EASE });
    let generation = 0;
    const go = (next) => {
      const leaving = items[current];
      const change = () => {
        items.forEach((item, i) => {
          item.classList.toggle('is-open', i === next);
          item.classList.remove('is-leaving');
          toggles[i].setAttribute('aria-expanded', String(i === next));
        });
        current = next;
        place();
      };
      if (still) return change();
      const run = ++generation;
      engine.move(change).then(() => run === generation && leaving?.classList.remove('is-leaving'));
      if (leaving) leaving.classList.add('is-leaving');
    };

    toggles.forEach((toggle, i) => toggle.addEventListener('click', () => go(i === current ? -1 : i), { signal }));

    // Escape closes and gives the focus back; the arrows move along the pictures, and open the
    // next one when one is open
    root.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && current >= 0) {
        const toggle = toggles[current];
        go(-1);
        toggle.focus();
        return;
      }
      const at = toggles.indexOf(event.target);
      const to = at < 0 ? undefined : { ArrowLeft: at - 1, ArrowRight: at + 1, Home: 0, End: toggles.length - 1 }[event.key];
      if (to === undefined) return;
      event.preventDefault();
      const next = (to + toggles.length) % toggles.length;
      toggles[next].focus();
      if (current >= 0) go(next);
    }, { signal });

    // Written open in the markup: it starts open
    const first = items.findIndex((item) => item.classList.contains('is-open'));
    items.forEach((item, i) => {
      item.classList.toggle('is-open', i === first);
      toggles[i].setAttribute('aria-expanded', String(i === first));
    });
    current = first;
    place();
    layout();

    // A new width can change the column count and the card's lines
    let width = grid.clientWidth;
    let raf = 0;
    const observer = new ResizeObserver(() => {
      if (grid.clientWidth === width) return;
      width = grid.clientWidth;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        engine.cancel();
        place();
        layout();
      });
    });
    observer.observe(root);
    document.fonts?.ready.then(() => {
      if (signal.aborted) return;
      measured = -1;
      layout();
    });
    signal.addEventListener('abort', () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      engine.cancel();
    });
  }

  // ---------- Make Way engine (copied as is by Expanding Panels) ----------
  // move(change) measures every frame in the container's own pixels (a parent scaled by
  // transform does not shift them), runs change() to give them their new places, measures again,
  // then slides and resizes each frame from where it was to where it is. Caught mid-move, a frame
  // starts again from where it is. The container's height follows, so the page below never
  // jumps. A frame clips its picture (object-fit: cover): the picture grows with it, never stretched.
  // timing: { duration, easing, caught } — caught, the easing of a move that starts mid-way.
  function makeWay(container, frames, { duration, easing, caught = easing }) {
    let moving = [];
    const rects = () => {
      const box = container.getBoundingClientRect();
      const scale = box.width / container.offsetWidth || 1;
      return frames.map((frame) => {
        const rect = frame.getBoundingClientRect();
        return { x: (rect.left - box.left) / scale, y: (rect.top - box.top) / scale, w: rect.width / scale, h: rect.height / scale };
      });
    };
    const cancel = () => {
      moving.forEach((animation) => animation.cancel());
      moving = [];
    };
    const move = (change) => {
      const before = rects();
      const tall = container.offsetHeight;
      const timing = { duration, easing: moving.some((a) => a.playState === 'running') ? caught : easing };
      cancel();
      change();
      const after = rects();
      frames.forEach((frame, i) => {
        const [a, b] = [before[i], after[i]];
        if (Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.w - b.w), Math.abs(a.h - b.h)) < 0.5) return;
        moving.push(frame.animate([
          { transform: `translate(${a.x - b.x}px, ${a.y - b.y}px)`, width: `${a.w}px`, height: `${a.h}px` },
          { transform: 'translate(0px, 0px)', width: `${b.w}px`, height: `${b.h}px` },
        ], timing));
      });
      const height = container.offsetHeight;
      if (height !== tall) moving.push(container.animate([{ height: `${tall}px` }, { height: `${height}px` }], timing));
      // Resolves once everything has arrived, false when a newer move or a cancel cut it short
      return Promise.all(moving.map((animation) => animation.finished)).then(() => true, () => false);
    };
    return { move, cancel };
  }
  // ---------- end of the engine ----------

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
