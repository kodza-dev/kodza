// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Segmented Control
// Adds the ink pill: it slides to the option you pick, its front edge first and its back edge
// catching up, with a white copy of the labels cut to the same shape. The radios stay native:
// arrow keys, the form value and the change event are the browser's. The stretch is tuned with
// the constants below (LEAD 1 and LAG 0: a plain slide).
(() => {
  const SELECTOR = '.kodza-segmented';
  const LEAD = 0.7; // the front edge arrives in this share of the slide
  const LAG = 0.14; // the back edge waits this share of the slide before it follows
  const SAMPLES = 30; // keyframes per slide: each edge follows its own curve
  const ease = (t) => 1 - (1 - t) ** 4; // close to cubic-bezier(0.22, 1, 0.36, 1)

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const seconds = (value) => {
    const n = parseFloat(value);
    if (!(n >= 0)) return 0.55;
    return /ms\s*$/.test(value) ? n / 1000 : n;
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const track = root.querySelector('.kodza-segmented__track');
    const options = track ? [...track.querySelectorAll('.kodza-segmented__option')] : [];
    const inputs = options.map((option) => option.querySelector('.kodza-segmented__input'));
    if (!options.length || inputs.some((input) => !input)) return;
    const duration = seconds(getComputedStyle(root).getPropertyValue('--kz-segmented-duration')) * pace * 1000;

    // The pill over the labels: the lane, the window cut at its left edge (pill), the window cut
    // at its right edge (edge), and the ink with the white copy of the labels (mirror)
    const layer = (name) => {
      const el = document.createElement('span');
      el.className = `kodza-segmented__${name}`;
      return el;
    };
    const lane = layer('lane');
    lane.setAttribute('aria-hidden', 'true');
    const pill = layer('pill');
    const edge = layer('edge');
    const mirror = layer('mirror');
    const ghosts = options.map((option) => {
      const ghost = layer('ghost');
      const label = option.querySelector('.kodza-segmented__label');
      if (label) ghost.append(label.cloneNode(true));
      return ghost;
    });
    mirror.append(...ghosts);
    edge.append(mirror);
    pill.append(edge);
    lane.append(pill);
    track.append(lane);

    // Each option's place in the lane, in its own pixels (a parent scaled by a transform, like
    // a thumbnail, changes nothing)
    let boxes = [];
    const measure = () => {
      const box = lane.getBoundingClientRect();
      const scale = box.width / lane.offsetWidth || 1;
      const full = lane.offsetWidth;
      boxes = options.map((option) => {
        const rect = option.getBoundingClientRect();
        const left = (rect.left - box.left) / scale;
        const width = rect.width / scale;
        return { left, width, right: full - left - width };
      });
      ghosts.forEach((ghost, i) => {
        ghost.style.left = `${boxes[i].left}px`;
        ghost.style.width = `${boxes[i].width}px`;
      });
    };

    // The three moving layers for given edges: the windows put their cuts there, the ink cancels
    // their shift and stays put
    const shifts = ({ left, right }) => [left, -left - right, right];
    const rest = (edges) => {
      track.style.setProperty('--kz-seg-l', `${edges.left}px`);
      track.style.setProperty('--kz-seg-r', `${edges.right}px`);
    };

    // The edges at a point of a slide: the front edge (the side it goes to) leads, the back
    // edge follows, so the pill stretches on the way and shrinks back as it lands
    let move = null;
    const edgesAt = ({ from, to, forward, grow }, t) => {
      const front = ease(grow ? t : Math.min(1, t / LEAD));
      const back = grow ? front : ease(Math.max(0, (t - LAG) / (1 - LAG)));
      return {
        left: from.left + (to.left - from.left) * (forward ? back : front),
        right: from.right + (to.right - from.right) * (forward ? front : back),
      };
    };
    const now = () => {
      const t = move?.animations[0].currentTime;
      return move && t != null && move.animations[0].playState === 'running' ? edgesAt(move, Math.min(1, t / duration)) : null;
    };
    const stop = () => {
      move?.animations.forEach((animation) => animation.cancel());
      move = null;
    };
    // From nothing chosen, the pill opens from the middle of the option
    const slide = (from, to) => {
      stop();
      rest(to);
      if (still) return;
      const grow = !from;
      if (grow) from = { left: to.left + to.width / 2, right: to.right + to.width / 2 };
      const plan = { from, to, grow, forward: to.left > from.left };
      const frames = [[], [], []];
      for (let i = 0; i <= SAMPLES; i += 1) {
        shifts(edgesAt(plan, i / SAMPLES)).forEach((x, n) => frames[n].push({ transform: `translateX(${x}px)` }));
      }
      const timing = { duration, easing: 'linear' };
      move = { ...plan, animations: [pill, edge, mirror].map((el, n) => el.animate(frames[n], timing)) };
      move.animations[0].onfinish = () => { move = null; };
    };

    // Nothing chosen: the pill is cut down to nothing
    const clear = () => {
      stop();
      track.style.removeProperty('--kz-seg-l');
      track.style.removeProperty('--kz-seg-r');
    };

    let current = inputs.findIndex((input) => input.checked);
    const update = () => {
      const next = inputs.findIndex((input) => input.checked);
      if (next === current) return;
      const from = now() || boxes[current] || null;
      current = next;
      if (next < 0) return clear();
      slide(from, boxes[next]);
    };
    // A resize that leaves the options where they are (the page around it) lets a slide run on
    const place = () => {
      const before = boxes;
      measure();
      const same = move && boxes.every((box, i) => Math.abs(box.left - before[i].left) < 0.5 && Math.abs(box.width - before[i].width) < 0.5);
      if (same) return;
      stop();
      if (current >= 0) rest(boxes[current]);
      else clear();
    };

    root.addEventListener('change', update, { signal });
    // A form reset puts the radios back without a change event
    root.closest('form')?.addEventListener('reset', () => requestAnimationFrame(update), { signal });

    place();
    const observer = new ResizeObserver(place);
    observer.observe(track);
    signal.addEventListener('abort', () => {
      observer.disconnect();
      stop();
    });
    document.fonts?.ready.then(() => !signal.aborted && place());
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
