// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Unit Toggle
// One switch for every measure of a text. Mark each value as written, in either system:
//   <data value="28" data-unit="km">28 km</data>
// and the switch shows them all in metric or imperial: the characters roll one after the other,
// each value eases to its new width, and the ink pill slides to the chosen system. Back in the
// system it was written in, a value reads exactly as written. The choice is kept for the next
// pages and shared by every switch of the site, in every tab.
// Where it looks: data-target on the switch (a selector), or by default the nearest block around
// it that holds values. On a value: data-to forces the unit it becomes (data-to="m" on a height
// in feet), data-decimals the number of decimals. On the switch: data-guess="false" stops the
// first guess from the visitor's language (metric everywhere but the US, Liberia and Myanmar).
// Timings and units: the constants below.
(() => {
  const SELECTOR = '.kodza-unit-toggle';
  const ROLL = 520; // ms, each character's roll
  const STAGGER = 28; // ms between two characters
  const SLIDE = 550; // ms, the pill
  const LEAD = 0.7; // the pill's front edge arrives in this share of the slide
  const LAG = 0.14; // its back edge waits this share of the slide before it follows
  const SAMPLES = 30; // keyframes per slide: each edge follows its own curve
  const ROLLING = 'cubic-bezier(0.22, 1, 0.36, 1)'; // the old character and the new one move as one
  const WIDENING = 'cubic-bezier(0.65, 0, 0.35, 1)'; // a value that narrows waits for its old characters
  const STORE = 'kodza-unit-toggle'; // localStorage key, shared by every switch of the site
  const IMPERIAL = ['US', 'LR', 'MM']; // regions guessed imperial from the page visitor's language
  const ease = (t) => 1 - (1 - t) ** 4; // close to cubic-bezier(0.22, 1, 0.36, 1)

  // Each unit: its quantity, its size in the base unit of that quantity, its system, and what it
  // becomes in the other system
  const UNITS = {
    mm: ['length', 0.001, 'metric', 'in'],
    cm: ['length', 0.01, 'metric', 'in'],
    m: ['length', 1, 'metric', 'ft'],
    km: ['length', 1000, 'metric', 'mi'],
    in: ['length', 0.0254, 'imperial', 'cm'],
    ft: ['length', 0.3048, 'imperial', 'm'],
    yd: ['length', 0.9144, 'imperial', 'm'],
    mi: ['length', 1609.344, 'imperial', 'km'],
    g: ['mass', 1, 'metric', 'oz'],
    kg: ['mass', 1000, 'metric', 'lb'],
    oz: ['mass', 28.349523125, 'imperial', 'g'],
    lb: ['mass', 453.59237, 'imperial', 'kg'],
    ml: ['volume', 1, 'metric', 'fl oz'],
    cl: ['volume', 10, 'metric', 'fl oz'],
    l: ['volume', 1000, 'metric', 'qt'],
    tsp: ['volume', 4.92892159375, 'imperial', 'ml'],
    tbsp: ['volume', 14.78676478125, 'imperial', 'ml'],
    'fl oz': ['volume', 29.5735295625, 'imperial', 'ml'],
    cup: ['volume', 236.5882365, 'imperial', 'ml'],
    qt: ['volume', 946.352946, 'imperial', 'l'],
    gal: ['volume', 3785.411784, 'imperial', 'l'],
    'km/h': ['speed', 1, 'metric', 'mph'],
    'm/s': ['speed', 3.6, 'metric', 'mph'],
    mph: ['speed', 1.609344, 'imperial', 'km/h'],
    '°C': ['temperature', 1, 'metric', '°F'],
    '°F': ['temperature', 1, 'imperial', '°C'],
  };
  const ALIASES = {
    c: '°C', '°c': '°C', f: '°F', '°f': '°F', kph: 'km/h', kmh: 'km/h', lbs: 'lb', cups: 'cup',
    floz: 'fl oz', 'fl. oz': 'fl oz', '″': 'in', '"': 'in', '′': 'ft', "'": 'ft', miles: 'mi',
  };
  const unitOf = (name) => {
    const key = String(name || '').trim();
    if (UNITS[key]) return key;
    const low = key.toLowerCase();
    return UNITS[low] ? low : ALIASES[low] || null;
  };
  const convert = (value, from, to) => {
    if (UNITS[from][0] === 'temperature') return from === to ? value : to === '°F' ? value * 9 / 5 + 32 : (value - 32) * 5 / 9;
    return value * UNITS[from][1] / UNITS[to][1];
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const CLAIM = Symbol.for('kodza unit-toggle value'); // a value already shown by a switch
  const stored = () => {
    try {
      const system = localStorage.getItem(STORE);
      return system === 'metric' || system === 'imperial' ? system : null;
    } catch {
      return null;
    }
  };
  const keep = (system) => {
    try {
      localStorage.setItem(STORE, system);
    } catch {
      // Storage refused (private window): the choice lasts for this page
    }
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const options = [...root.querySelectorAll('.kodza-unit-toggle__option[data-system]')];
    if (!options.length) return;
    const systems = options.map((option) => option.dataset.system);
    const lang = root.closest('[lang]')?.lang || undefined;

    // The values it shows: in data-target, or in the nearest block around it that holds some
    let scope = null;
    if (root.dataset.target) {
      try {
        scope = [...document.querySelectorAll(root.dataset.target)];
      } catch {
        scope = [];
      }
    } else {
      for (let el = root.parentElement; el && !scope; el = el.parentElement) {
        if (el.querySelector('data[data-unit]')) scope = [el];
      }
    }
    const values = [];
    (scope || []).forEach((block) => {
      const found = block.matches('data[data-unit]') ? [block] : [...block.querySelectorAll('data[data-unit]')];
      found.forEach((el) => {
        const unit = unitOf(el.dataset.unit);
        const number = parseFloat(el.value);
        if (!unit || !Number.isFinite(number) || el[CLAIM] || values.some((v) => v.el === el)) return;
        const text = el.textContent.trim();
        const cut = text.search(/\d[^\d]*$/) + 1; // the number as written ends at its last digit
        const forced = unitOf(el.dataset.to);
        const to = forced && UNITS[forced][0] === UNITS[unit][0] ? forced : UNITS[unit][3];
        values.push({
          el,
          unit,
          to,
          number,
          written: cut > 0 ? [text.slice(0, cut), text.slice(cut)] : [text, ''],
          html: el.innerHTML,
          className: el.getAttribute('class'),
          runs: [],
        });
        el[CLAIM] = root;
      });
    });

    // The two parts of a value in a system: as written in its own, converted in the other
    const partsOf = (value, system) => {
      if (UNITS[value.unit][2] === system) return value.written;
      const result = convert(value.number, value.unit, value.to);
      const set = parseInt(value.el.dataset.decimals, 10);
      const size = Math.abs(result);
      const decimals = set >= 0 ? set : UNITS[value.to][0] === 'temperature' ? 0 : size < 1 ? 2 : size < 10 ? 1 : 0;
      const number = new Intl.NumberFormat(lang, { maximumFractionDigits: decimals }).format(result);
      return [number, ` ${value.to}`];
    };

    const span = (name, text) => {
      const el = document.createElement('span');
      el.className = `kodza-unit-toggle__${name}`;
      if (text != null) el.textContent = text;
      return el;
    };
    const runOf = (text) => {
      const run = span('run');
      Array.from(text).forEach((char) => run.append(span('char', char)));
      return run;
    };
    // A value taken over: read whole by a screen reader, drawn in two parts for the eye
    values.forEach((value) => {
      value.said = span('said');
      const face = span('face');
      face.setAttribute('aria-hidden', 'true');
      value.parts = [span('part'), span('part')];
      face.append(...value.parts);
      value.el.replaceChildren(value.said, face);
      value.el.classList.add('kodza-unit-toggle__value');
    });

    const scaleOf = (el) => el.getBoundingClientRect().width / el.offsetWidth || 1;
    const show = (value, system, up) => {
      const next = partsOf(value, system);
      value.said.textContent = next.join('');
      // A roll still on its way lands at once: the next one starts from where it was going
      value.runs.forEach((animation) => animation.finish());
      value.runs = [];
      let delay = 0;
      value.parts.forEach((part, i) => {
        const old = part.lastElementChild;
        if (old && old.textContent === next[i]) return;
        const run = runOf(next[i]);
        if (still || !old) {
          part.replaceChildren(run);
          return;
        }
        part.querySelectorAll('.kodza-unit-toggle__run').forEach((el) => el !== old && el.remove());
        const scale = scaleOf(part);
        const from = old.getBoundingClientRect().width / scale;
        part.append(run);
        const to = run.getBoundingClientRect().width / scale;
        const out = up ? '-100%' : '100%';
        const enter = up ? '100%' : '-100%';
        // Each old character is pushed out by the new one in the same place, like a counter's wheel.
        // The leaving ones stay gone until their run is removed; the arriving ones wait outside
        const timing = (n, fill) => ({ duration: ROLL * pace, delay: (delay + n * STAGGER) * pace, easing: ROLLING, fill });
        [...old.children].forEach((char, n) => {
          value.runs.push(char.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${out})` }], timing(n, 'both')));
        });
        const chars = [...run.children];
        chars.forEach((char, n) => {
          value.runs.push(char.animate([{ transform: `translateY(${enter})` }, { transform: 'translateY(0)' }], timing(n, 'backwards')));
        });
        // A value that widens makes room before its new characters land; one that narrows lets
        // its old characters leave first
        const spread = (Math.max(old.children.length, chars.length) + 1) * STAGGER;
        const frames = to > from
          ? [{ width: `${from}px`, easing: ROLLING }, { width: `${to}px`, offset: ROLL / (ROLL + spread) }, { width: `${to}px` }]
          : [{ width: `${from}px`, easing: WIDENING }, { width: `${to}px` }];
        const width = part.animate(frames, { duration: (ROLL + spread) * pace, delay: delay * pace, fill: 'both' });
        width.onfinish = () => {
          old.remove();
          width.cancel();
        };
        width.oncancel = () => old.isConnected && old.remove();
        value.runs.push(width);
        delay += chars.length * STAGGER;
      });
    };

    // The ink pill over the labels: the lane, the window cut at its left edge (pill), the window cut
    // at its right edge (edge), and the ink with the white copy of the labels (mirror)
    const lane = span('lane');
    lane.setAttribute('aria-hidden', 'true');
    const pill = span('pill');
    const edge = span('edge');
    const mirror = span('mirror');
    const ghosts = options.map((option) => {
      const ghost = span('ghost');
      const label = option.querySelector('.kodza-unit-toggle__label');
      if (label) ghost.append(label.cloneNode(true));
      return ghost;
    });
    mirror.append(...ghosts);
    edge.append(mirror);
    pill.append(edge);
    lane.append(pill);
    root.append(lane);

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
      root.style.setProperty('--kz-unit-l', `${edges.left}px`);
      root.style.setProperty('--kz-unit-r', `${edges.right}px`);
    };
    // The edges at a point of a slide: the front edge (the side it goes to) leads, the back edge
    // follows, so the pill stretches on the way and shrinks back as it lands
    let move = null;
    const edgesAt = ({ from, to, forward }, t) => {
      const front = ease(Math.min(1, t / LEAD));
      const back = ease(Math.max(0, (t - LAG) / (1 - LAG)));
      return {
        left: from.left + (to.left - from.left) * (forward ? back : front),
        right: from.right + (to.right - from.right) * (forward ? front : back),
      };
    };
    const now = () => {
      const t = move?.animations[0].currentTime;
      return move && t != null && move.animations[0].playState === 'running' ? edgesAt(move, Math.min(1, t / (SLIDE * pace))) : null;
    };
    const stop = () => {
      move?.animations.forEach((animation) => animation.cancel());
      move = null;
    };
    const slide = (from, to) => {
      stop();
      rest(to);
      if (still || !from) return;
      const plan = { from, to, forward: to.left > from.left };
      const frames = [[], [], []];
      for (let i = 0; i <= SAMPLES; i += 1) {
        shifts(edgesAt(plan, i / SAMPLES)).forEach((x, n) => frames[n].push({ transform: `translateX(${x}px)` }));
      }
      const timing = { duration: SLIDE * pace, easing: 'linear' };
      move = { ...plan, animations: [pill, edge, mirror].map((el, n) => el.animate(frames[n], timing)) };
      move.animations[0].onfinish = () => { move = null; };
    };

    // The system shown: the visitor's last choice, else a guess from their language, else the
    // system the first value is written in
    const region = () => {
      try {
        return new Intl.Locale(navigator.language).maximize().region;
      } catch {
        return null;
      }
    };
    const guess = root.dataset.guess === 'false' ? null : IMPERIAL.includes(region()) ? 'imperial' : 'metric';
    const first = values[0] ? UNITS[values[0].unit][2] : systems[0];
    let current = -1;
    const set = (system, animate) => {
      const next = systems.indexOf(system);
      if (next < 0 || next === current) return;
      const up = next > current;
      const from = animate ? now() || boxes[current] : null;
      current = next;
      options.forEach((option, i) => option.setAttribute('aria-pressed', String(i === next)));
      slide(from, boxes[next]);
      values.forEach((value) => show(value, system, up && animate));
      if (!animate) values.forEach((value) => value.runs.forEach((animation) => animation.finish()));
    };

    options.forEach((option) => option.addEventListener('click', () => {
      const system = option.dataset.system;
      if (systems.indexOf(system) === current) return;
      keep(system);
      document.dispatchEvent(new CustomEvent('kodza:units', { detail: { system } }));
    }, { signal }));
    // Every switch of the page follows, and the other tabs through storage
    document.addEventListener('kodza:units', (event) => set(event.detail?.system, true), { signal });
    window.addEventListener('storage', (event) => event.key === STORE && set(event.newValue, true), { signal });

    // A resize that leaves the options where they are (the page around it) lets a slide run on
    const place = () => {
      const before = boxes;
      measure();
      const same = move && boxes.every((box, i) => Math.abs(box.left - before[i].left) < 0.5 && Math.abs(box.width - before[i].width) < 0.5);
      if (same) return;
      stop();
      if (current >= 0) rest(boxes[current]);
    };
    measure();
    set(stored() || guess || first, false);
    const observer = new ResizeObserver(place);
    observer.observe(root);
    document.fonts?.ready.then(() => !signal.aborted && place());

    signal.addEventListener('abort', () => {
      observer.disconnect();
      stop();
      values.forEach((value) => {
        value.runs.forEach((animation) => animation.cancel());
        value.el.innerHTML = value.html;
        if (value.className == null) value.el.removeAttribute('class');
        else value.el.setAttribute('class', value.className);
        delete value.el[CLAIM];
      });
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
