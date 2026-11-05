// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Logo Swap
// Lays a few cells over the list of logos and, every few seconds, swaps one cell's logo for one
// waiting its turn: the old one leaves upwards behind the cell's edge, the new one rises into it.
// The cell is never the last one, nor its neighbour, and the cells that waited longest go first.
// The pointer over the logos, the pause button, the section out of view or a hidden tab hold the
// clock. Every logo gets its width over its height as --kz-logo-swap-ratio, so the CSS gives them
// all the same area. With reduced motion, or when every logo fits, the list shows as it is.
// Settings: data-interval on the section (ms between two swaps), the --kz-logo-swap-* variables
// (columns and rows on show), and the constants below. root.kodzaSwap() swaps one now,
// root.kodzaSwap(2) the third cell.
(() => {
  const SELECTOR = '[data-kodza-logo-swap]';
  const INTERVAL = 2600; // ms between two swaps: time to read a logo, so the pace leaves it alone
  const OUT = { duration: 600, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' }; // the logo leaving, upwards
  const IN = { duration: 700, delay: 80, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }; // the one rising in
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  // A logo's width over its height: an svg's viewBox, an img's own size, or its attributes
  const ratioOf = (mark) => {
    const box = mark.viewBox?.baseVal;
    if (box?.width && box.height) return box.width / box.height;
    if (mark.naturalWidth && mark.naturalHeight) return mark.naturalWidth / mark.naturalHeight;
    const width = parseFloat(mark.getAttribute('width'));
    const height = parseFloat(mark.getAttribute('height'));
    return width && height ? width / height : 0;
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const list = root.querySelector('.kodza-logo-swap__logos');
    if (!list) return;
    const fit = (mark) => {
      const ratio = ratioOf(mark);
      if (ratio) mark.style.setProperty('--kz-logo-swap-ratio', ratio.toFixed(3));
      else if (mark.tagName === 'IMG') mark.addEventListener('load', () => fit(mark), { once: true, signal });
    };
    const marks = [...list.children].map((item) => item.querySelector('svg, img')).filter(Boolean);
    marks.forEach(fit);
    // Logos that link somewhere stay put: a link that slides away under the pointer is a link
    // nobody can click (Logo Grid is made for those)
    if (still || list.querySelector('a, button')) {
      root.classList.add('is-still');
      return;
    }

    const interval = Math.max(1000, parseFloat(root.dataset.interval) || INTERVAL);
    const button = root.querySelector('.kodza-logo-swap__pause');
    const cells = document.createElement('div');
    cells.className = 'kodza-logo-swap__cells';
    cells.setAttribute('aria-hidden', 'true'); // the list under it is what is read
    list.after(cells);

    let shown = []; // the logo on show in each cell
    let queue = marks.slice(); // the logos waiting their turn, the longest-waiting first
    let ages = []; // when each cell last swapped
    let cols = 0;
    let last = -1; // the cell that swapped last
    let turn = 0;
    let timer = null;
    let held = false;
    let hovered = false;
    let visible = true;
    const busy = new Set(); // cells mid-swap
    const moving = new Set();

    const slotOf = (mark) => {
      const slot = document.createElement('span');
      slot.className = 'kodza-logo-swap__slot';
      const copy = mark.cloneNode(true);
      if (!copy.style.getPropertyValue('--kz-logo-swap-ratio')) fit(copy); // an img still loading
      slot.append(copy);
      return slot;
    };

    // The next cell: not the last one, not its neighbour (side, above, below), not one mid-swap.
    // Among the others, chance picks in the half that waited longest, so no cell is forgotten
    const pick = () => {
      const near = new Set([last]);
      if (last >= 0) {
        if (last % cols) near.add(last - 1);
        if ((last + 1) % cols) near.add(last + 1);
        near.add(last - cols).add(last + cols);
      }
      const free = shown.map((_, i) => i).filter((i) => !busy.has(i));
      const apart = free.filter((i) => !near.has(i));
      const other = free.filter((i) => i !== last);
      const open = apart.length ? apart : other.length ? other : free;
      if (!open.length) return -1;
      open.sort((a, b) => ages[a] - ages[b]);
      return open[Math.floor(Math.random() * Math.ceil(open.length / 2))];
    };

    // One swap: the cell `at` (an index, left to right then top to bottom) or the one pick() finds
    const swap = (at) => {
      const i = !queue.length ? -1 : at >= 0 && at < shown.length && !busy.has(at) ? at : pick();
      if (i < 0) return;
      const cell = cells.children[i];
      const leaving = cell.lastElementChild;
      const mark = queue.shift();
      queue.push(shown[i]);
      shown[i] = mark;
      const slot = slotOf(mark);
      cell.append(slot);
      last = i;
      ages[i] = ++turn;
      busy.add(i);
      const out = leaving.animate(
        [{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }],
        { duration: OUT.duration * pace, easing: OUT.easing, fill: 'forwards' },
      );
      const into = slot.animate(
        [{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }],
        { duration: IN.duration * pace, delay: IN.delay * pace, easing: IN.easing, fill: 'backwards' },
      );
      moving.add(out).add(into);
      Promise.allSettled([out.finished, into.finished]).then(() => {
        moving.delete(out);
        moving.delete(into);
        leaving.remove();
        busy.delete(i);
      });
    };

    // The clock: an empty animation, so pausing it keeps the time already spent
    const sync = () => {
      if (!timer) return;
      const waiting = held || hovered || !visible || document.hidden;
      if (waiting && timer.playState === 'running') timer.pause();
      else if (!waiting && timer.playState === 'paused') timer.play();
    };
    const tick = () => {
      const wait = cells.animate([], { duration: interval });
      timer?.cancel();
      timer = wait;
      sync();
      wait.finished.then(() => {
        if (timer !== wait) return;
        swap();
        tick();
      }, () => {});
    };
    const stop = () => {
      const wait = timer;
      timer = null;
      wait?.cancel();
    };

    // The cells on show, read from the CSS (columns x rows): laid again when the count changes
    const layout = () => {
      const style = getComputedStyle(list);
      const nextCols = Math.max(1, parseInt(style.getPropertyValue('--kz-logo-swap-cols'), 10) || 6);
      const size = nextCols * Math.max(1, parseInt(style.getPropertyValue('--kz-logo-swap-lines'), 10) || 1);
      if (nextCols === cols && size === shown.length) return;
      cols = nextCols;
      moving.forEach((animation) => animation.cancel());
      busy.clear();
      const all = [...shown, ...queue];
      shown = all.slice(0, size);
      queue = all.slice(size);
      ages = shown.map(() => -Math.random()); // the first cells to swap, picked by chance
      last = -1;
      const live = queue.length > 0; // every logo fits: the list shows as it is
      root.classList.toggle('is-live', live);
      cells.replaceChildren(...(live ? shown : []).map((mark) => {
        const cell = document.createElement('div');
        cell.className = 'kodza-logo-swap__cell';
        cell.append(slotOf(mark));
        return cell;
      }));
      if (live) tick();
      else stop();
    };

    cells.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse') return;
      hovered = true;
      sync();
    }, { signal });
    cells.addEventListener('pointerleave', () => {
      hovered = false;
      sync();
    }, { signal });
    button?.addEventListener('click', () => {
      held = !held;
      button.setAttribute('aria-pressed', String(held));
      sync();
    }, { signal });
    document.addEventListener('visibilitychange', sync, { signal });
    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    const resized = new ResizeObserver(layout);
    root.kodzaSwap = (at) => swap(at);
    signal.addEventListener('abort', () => {
      resized.disconnect();
      seen.disconnect();
      stop();
      moving.forEach((animation) => animation.cancel());
      cells.remove();
      root.classList.remove('is-live');
      delete root.kodzaSwap;
    }, { once: true });

    layout();
    seen.observe(root);
    resized.observe(root);
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
