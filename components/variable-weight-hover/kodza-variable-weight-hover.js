// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Variable Weight Hover
// Splits each link of the instance (or the instance itself, a title) into letters. Each letter
// gets bolder the closer the pointer comes, on the wght axis of the variable font, and settles with
// a little inertia. What a letter gains is taken back from its own sides and from the whole line,
// so the line keeps its width and nothing around it moves. From the keyboard or a finger, the link
// chosen turns bold, letter after letter. If the font has no weight axis, it stays as written.
// Settings: the --kz-weight-hover-* variables in the CSS and the constants below.
(() => {
  const SELECTOR = '.kodza-weight-hover';
  // What follows the pointer is weighed more across lines than along them (so the link under it leads)
  const ACROSS = 1.7;
  // How fast a letter goes to its weight, per frame at 60 fps (0 to 1)
  const EASE = 0.14;
  // What a bolder letter takes back from its own sides (the rest comes from the whole line)
  const OWN = 0.35;
  // From the keyboard or a finger, between two letters turning bold (ms)
  const STAGGER = 28;
  // A finger lifted: how long the link stays bold (a time to read, not motion)
  const TOUCH_HOLD = 600;
  // The weights each letter is measured at, from rest (0) to the peak (1)
  const SAMPLES = [0, 0.25, 0.5, 0.75, 1];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  // The length of a text, all its lines put end to end
  const widthOf = (el) => [...el.getClientRects()].reduce((sum, r) => sum + r.width, 0);
  const wght = (value) => `"wght" ${value.toFixed(1)}`;

  // Does the font of `el` draw wider at the peak than at rest? Without a wght axis, it does not
  function hasAxis(el, rest, peak) {
    const probe = document.createElement('span');
    probe.setAttribute('aria-hidden', 'true');
    probe.textContent = 'Hamburgefonstiv';
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;pointer-events:none';
    el.append(probe);
    probe.style.fontVariationSettings = wght(rest);
    const a = probe.getBoundingClientRect().width;
    probe.style.fontVariationSettings = wght(peak);
    const b = probe.getBoundingClientRect().width;
    probe.remove();
    return b - a > a * 0.01;
  }

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const links = [...root.querySelectorAll('a, button')];
    const targets = links.length ? links : [root];

    document.fonts.ready.then(() => {
      if (signal.aborted) return;
      const style = getComputedStyle(root);
      const rest = parseFloat(style.getPropertyValue('--kz-weight-hover-rest')) || 300;
      const peak = parseFloat(style.getPropertyValue('--kz-weight-hover-peak')) || 800;
      if (!hasAxis(root, rest, peak)) return;
      start(rest, peak);
    });

    function start(rest, peak) {
      // The letters, drawn for the eye; the words, once, for screen readers
      const lines = targets.map((target) => {
        const words = target.textContent.replace(/\s+/g, ' ').trim();
        const shown = document.createElement('span');
        shown.setAttribute('aria-hidden', 'true');
        const chars = [];
        words.split(' ').forEach((word, w) => {
          if (w) shown.append(' ');
          const box = document.createElement('span');
          box.className = 'kodza-weight-hover__word';
          [...word].forEach((char) => {
            const el = document.createElement('span');
            el.className = 'kodza-weight-hover__char';
            el.textContent = char;
            box.append(el);
            chars.push({ el, t: 0, gains: [], back: 0, x: 0, y: 0, at: Infinity });
          });
          shown.append(box);
        });
        const sr = document.createElement('span');
        sr.className = 'kodza-weight-hover__sr';
        sr.textContent = words;
        target.replaceChildren(shown, sr);
        return { target, shown, chars, chosen: false, active: false, rest: 0 };
      });
      const all = lines.flatMap((line) => line.chars);
      root.classList.add('is-live');

      // k: screen pixels per CSS pixel (a parent scaled with a transform must not shift the pointer).
      // offsetWidth is rounded to the pixel: below 1 %, it is that rounding, not a scale
      const scale = () => {
        const ratio = root.getBoundingClientRect().width / root.offsetWidth || 1;
        return Math.abs(ratio - 1) < 0.01 ? 1 : ratio;
      };
      let k = 1;
      let reach = 0;
      // Each letter's width at a few weights (a font does not widen in a straight line), then where
      // it stands at rest
      const measure = () => {
        k = scale();
        const widths = SAMPLES.map((s) => {
          all.forEach((c) => {
            c.el.style.fontVariationSettings = wght(rest + (peak - rest) * s);
            c.el.style.marginInline = '';
          });
          return all.map((c) => c.el.getBoundingClientRect().width / k);
        });
        all.forEach((c) => (c.el.style.fontVariationSettings = wght(rest)));
        lines.forEach((line) => {
          line.rest = widthOf(line.shown) / k;
        });
        const box = root.getBoundingClientRect();
        all.forEach((c, i) => {
          const r = c.el.getBoundingClientRect();
          c.gains = widths.map((w) => w[i] - widths[0][i]);
          c.x = (r.left + r.width / 2 - box.left) / k;
          c.y = (r.top + r.height / 2 - box.top) / k;
        });
        const size = parseFloat(getComputedStyle(root).fontSize) || 16;
        const em = parseFloat(getComputedStyle(root).getPropertyValue('--kz-weight-hover-reach')) || 2.4;
        reach = size * em;
        paint();
      };
      // What a letter has gained at t, between the two weights measured around it
      const gainAt = (c, t) => {
        const at = t * (SAMPLES.length - 1);
        const i = Math.min(SAMPLES.length - 2, Math.floor(at));
        return c.gains[i] + (c.gains[i + 1] - c.gains[i]) * (at - i);
      };
      // Weights first, then what each letter takes back. A font kerns two letters only while they
      // share a weight, so the line is read once written and what is left over is taken back from
      // all its letters, in the same frame
      const paint = () => {
        lines.forEach((line) => {
          const gains = line.chars.map((c) => (c.t ? gainAt(c, c.t) : 0));
          const shared = gains.reduce((sum, g) => sum + g, 0) / line.chars.length;
          line.active = gains.some(Boolean);
          line.chars.forEach((c, i) => {
            c.back = -(gains[i] * OWN + shared * (1 - OWN)) / 2;
            c.el.style.fontVariationSettings = wght(rest + (peak - rest) * c.t);
            c.el.style.marginInline = line.active ? `${c.back.toFixed(2)}px` : '';
          });
        });
        for (let pass = 0; pass < 2; pass++) {
          lines.forEach((line) => {
            if (!line.active) return;
            const drawn = widthOf(line.shown) / k;
            const over = (drawn - line.rest) / line.chars.length / 2;
            line.chars.forEach((c) => {
              c.back -= over;
              c.el.style.marginInline = `${c.back.toFixed(3)}px`;
            });
          });
        }
      };

      let pointer = null;
      let frame = 0;
      let last = 0;
      // Where each letter is heading: chosen from the keyboard or a finger, it goes to the peak in
      // turn; else it follows the pointer, softly (a cosine), out to `reach`
      const goal = (c, line, now) => {
        if (line.chosen) return now >= c.at ? 1 : 0;
        if (!pointer || still) return 0;
        const d = Math.hypot(c.x - pointer.x, (c.y - pointer.y) * ACROSS);
        return d < reach ? (Math.cos((Math.PI * d) / reach) + 1) / 2 : 0;
      };
      const tick = (now) => {
        const dt = last ? Math.min(64, now - last) : 16.7;
        last = now;
        const ease = still ? 1 : 1 - Math.pow(1 - EASE, dt / 16.7 / pace);
        let moving = false;
        lines.forEach((line) => line.chars.forEach((c) => {
          const g = goal(c, line, now);
          c.t += (g - c.t) * ease;
          if (Math.abs(g - c.t) < 0.002) c.t = g;
          else moving = true;
          if (line.chosen && now < c.at) moving = true;
        }));
        paint();
        frame = moving ? requestAnimationFrame(tick) : 0;
        if (!frame) last = 0;
      };
      const wake = () => {
        if (!frame) frame = requestAnimationFrame(tick);
      };
      const choose = (line, on) => {
        const now = performance.now();
        line.chosen = on;
        line.chars.forEach((c, i) => (c.at = now + (still ? 0 : i * STAGGER * pace)));
        wake();
      };

      document.fonts.ready.then(() => !signal.aborted && measure());
      measure();
      let width = root.offsetWidth;
      const resize = new ResizeObserver(() => {
        if (Math.abs(root.offsetWidth - width) < 1) return;
        width = root.offsetWidth;
        measure();
      });
      resize.observe(root);

      // The pointer, a mouse or a pen: positions are measured again as it comes in
      root.addEventListener('pointerenter', (event) => {
        if (event.pointerType === 'touch' || still) return;
        measure();
      }, { signal });
      root.addEventListener('pointermove', (event) => {
        if (event.pointerType === 'touch' || still) return;
        const box = root.getBoundingClientRect();
        pointer = { x: (event.clientX - box.left) / k, y: (event.clientY - box.top) / k };
        wake();
      }, { signal });
      root.addEventListener('pointerleave', () => {
        pointer = null;
        wake();
      }, { signal });

      // A finger on a link: that link turns bold, and stays so a moment after
      let release = 0;
      root.addEventListener('pointerdown', (event) => {
        if (event.pointerType !== 'touch') return;
        const line = lines.find((l) => l.target.contains(event.target));
        if (!line) return;
        clearTimeout(release);
        lines.forEach((l) => l !== line && l.chosen && choose(l, false));
        if (!line.chosen) choose(line, true);
        const off = () => {
          clearTimeout(release);
          release = setTimeout(() => choose(line, false), TOUCH_HOLD);
        };
        root.addEventListener('pointerup', off, { once: true, signal });
        root.addEventListener('pointercancel', off, { once: true, signal });
      }, { signal });

      // From the keyboard: the focused link turns bold
      root.addEventListener('focusin', (event) => {
        const line = lines.find((l) => l.target === event.target);
        if (line && line.target.matches(':focus-visible')) choose(line, true);
      }, { signal });
      root.addEventListener('focusout', (event) => {
        const line = lines.find((l) => l.target === event.target);
        if (line?.chosen) choose(line, false);
      }, { signal });

      signal.addEventListener('abort', () => {
        cancelAnimationFrame(frame);
        clearTimeout(release);
        resize.disconnect();
      });
    }
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
