// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Logo Collapse
// On the first page of a visit, the logo fills the screen while the page loads (the line under it
// follows the images and fonts, not a timer), then flies onto the logo of the header, measured
// before and after so it lands on the pixel. The screen rolls up behind it and its edge cuts the
// flying logo in two, screen colours above, header colours below (data-exit="fade": the screen
// fades instead). The page plays its entrance meanwhile (data-enter: label, title, image, the
// rest). data-once plays it once per visit; a click, a key, the wheel or a finger skips the wait.
(() => {
  const SELECTOR = '[data-kodza-logo-collapse]';
  const KEY = 'kodza-logo-collapse';
  const CAP = 3500; // ms the screen waits for the page, at most
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };

  const ms = (value, fallback) => {
    const n = parseFloat(value);
    return Number.isNaN(n) ? fallback : /ms\s*$/.test(value) ? n : n * 1000;
  };
  const seen = (root) => {
    try {
      return root.hasAttribute('data-once') && sessionStorage.getItem(KEY) === '1';
    } catch {
      return false;
    }
  };
  const remember = (root) => {
    if (!root.hasAttribute('data-once')) return;
    try {
      sessionStorage.setItem(KEY, '1');
    } catch {
      // Storage blocked: the intro plays on every page
    }
  };
  const wait = (time, signal) => new Promise((resolve) => {
    const timer = setTimeout(resolve, time);
    signal.addEventListener('abort', () => clearTimeout(timer), { once: true });
  });
  const parsed = () => (document.readyState === 'loading'
    ? new Promise((resolve) => document.addEventListener('DOMContentLoaded', resolve, { once: true }))
    : Promise.resolve());

  // The page around the screen: the nearest ancestor that holds the header logo (the body, on a site)
  function scopeOf(root) {
    for (let el = root.parentElement; el; el = el.parentElement) {
      if (el.querySelector('[data-logo-collapse-to]')) return el;
    }
    return root.parentElement || document.body;
  }

  // What the page still loads: its images (not the lazy ones, which wait for the scroll) and fonts
  function loaded(root, signal, report) {
    return parsed().then(() => new Promise((resolve) => {
      const images = [...document.images].filter((img) => img.loading !== 'lazy' && !root.contains(img));
      const total = images.length + 1;
      let done = 0;
      const tick = () => {
        report(done / total);
        if (done >= total) resolve();
      };
      images.forEach((img) => {
        if (img.complete) {
          done++;
          return;
        }
        const one = () => {
          done++;
          tick();
        };
        img.addEventListener('load', one, { once: true, signal });
        img.addEventListener('error', one, { once: true, signal });
      });
      document.fonts.ready.then(() => {
        done++;
        tick();
      });
      tick();
      setTimeout(resolve, CAP);
    }));
  }

  // When a cubic-bezier() easing reaches a progress, as a share of its duration
  function timeAt(easing, progress) {
    const m = /cubic-bezier\(([^)]+)\)/.exec(easing);
    if (!m) return progress;
    const [x1, y1, x2, y2] = m[1].split(',').map(Number);
    const at = (a, b, t) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (at(y1, y2, mid) < progress) lo = mid;
      else hi = mid;
    }
    return at(x1, x2, lo);
  }

  // The entrance of the page: the title rises from behind its own edge, the image opens from the
  // bottom, the rest lifts in. Each part starts as the edge of the screen goes past it, from the
  // bottom up (`when`), or one after the other once the screen fades. At the site's pace
  function entrance(root, scope, when, ease, pace) {
    const parts = [...scope.querySelectorAll('[data-enter]')].filter((el) => !root.contains(el) && el.getClientRects().length);
    return parts.map((el, i) => {
      const delay = when(el, i);
      const kind = el.dataset.enter;
      const frames = kind === 'title'
        ? [{ transform: 'translateY(100%)', clipPath: 'inset(0 0 100% 0)' }, { transform: 'none', clipPath: 'inset(0)' }]
        : kind === 'image'
          ? [{ transform: 'scale(1.06)', clipPath: 'inset(100% 0 0 0)' }, { transform: 'none', clipPath: 'inset(0)' }]
          : [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }];
      return el.animate(frames, { duration: (kind === 'image' ? 1100 : 900) * pace, delay, easing: ease, fill: 'backwards' });
    });
  }

  function mount(root, signal) {
    const pace = paceOf(root);
    const screen = root.querySelector('.kodza-logo-collapse__screen');
    const bar = screen.querySelector('.kodza-logo-collapse__bar');
    const scope = scopeOf(root);
    // The twin under the screen: the same logo, in the colours of the header one
    const under = screen.cloneNode(true);
    under.classList.add('is-under');
    under.setAttribute('aria-hidden', 'true');
    root.prepend(under);
    const marks = [screen, under].map((layer) => layer.querySelector('.kodza-logo-collapse__mark'));
    let running = [];
    let run = null; // the play running, aborted by a replay
    let hurry = null; // what a click does while the screen waits: leave now

    // Played again (kodza:replay), the screen first comes down over the page
    const play = (again) => {
      if (motion.matches || !pace) return root.classList.add('is-done');
      run?.abort();
      run = new AbortController();
      const live = AbortSignal.any ? AbortSignal.any([signal, run.signal]) : signal;
      running.forEach((a) => a.cancel());
      running = [];
      root.classList.remove('is-done', 'is-leaving');
      under.hidden = true; // only needed once the logo flies
      bar.style.setProperty('--kz-logo-collapse-progress', 0);

      const style = getComputedStyle(root);
      const duration = ms(style.getPropertyValue('--kz-logo-collapse-duration'), 1000) * pace;
      const ease = style.getPropertyValue('--kz-logo-collapse-ease').trim() || 'cubic-bezier(0.76, 0, 0.24, 1)';
      const enterEase = style.getPropertyValue('--kz-logo-collapse-enter-ease').trim() || 'cubic-bezier(0.22, 1, 0.36, 1)';
      const hold = ms(style.getPropertyValue('--kz-logo-collapse-hold'), 450) * pace;
      const keep = (a) => {
        running.push(a);
        return a;
      };

      const drop = again ? 700 * pace : 0;
      if (drop) keep(screen.animate([{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0)' }], { duration: drop, easing: ease }));
      // The logo rises from behind its own edge, the line comes once it is there
      const rise = keep(marks[0].animate([
        { transform: 'translateY(100%)', clipPath: 'inset(0 0 100% 0)' },
        { transform: 'none', clipPath: 'inset(0)' },
      ], { duration: 900 * pace, delay: drop + 100 * pace, easing: enterEase, fill: 'backwards' }));
      keep(bar.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500 * pace, delay: drop + 500 * pace, easing: 'ease-out', fill: 'backwards' }));
      let gone = false;
      const leave = () => {
        if (gone || live.aborted) return;
        gone = true;
        hurry = null;
        running.forEach((a) => a.finish());
        root.classList.add('is-leaving');
        const target = scope.querySelector('[data-logo-collapse-to]');
        const b = target?.getBoundingClientRect();
        const lands = b && b.width && b.bottom > 0 && b.top < innerHeight;
        const scale = root.getBoundingClientRect().width / root.offsetWidth || 1;
        const flight = [];
        if (lands) {
          const ink = getComputedStyle(target).color;
          // Measured on the screen's logo: the twin, still hidden, sits in the very same place
          const a = marks[0].getBoundingClientRect();
          const k = b.width / a.width;
          const x = (b.left - a.left) / scale;
          const y = (b.top + b.height / 2 - (a.height * k) / 2 - a.top) / scale;
          marks.forEach((mark, i) => {
            if (i) mark.style.color = ink;
            flight.push(mark.animate([{ transform: 'none' }, { transform: `translate(${x}px, ${y}px) scale(${k})` }], { duration, easing: ease, fill: 'forwards' }));
          });
          // The header logo waits under the flying one, which lands on it
          flight.push(target.animate([{ opacity: 0 }, { opacity: 0 }], { duration, fill: 'forwards' }));
        }
        under.hidden = !lands; // no logo to land on: it leaves with the screen
        flight.push(bar.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250 * pace, easing: 'ease-out', fill: 'forwards' }));
        const fade = root.dataset.exit === 'fade';
        flight.push(fade
          ? screen.animate([{ opacity: 1 }, { opacity: 0 }], { duration: duration * 0.8, delay: duration * 0.1, easing: 'ease-in-out', fill: 'forwards' })
          : screen.animate([{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 0 100% 0)' }], { duration, easing: ease, fill: 'forwards' }));
        const box = root.getBoundingClientRect();
        const when = fade
          ? (el, i) => duration * 0.3 + i * 80 * pace
          : (el) => {
            const r = el.getBoundingClientRect();
            const middle = Math.min(Math.max((r.top + r.height / 2 - box.top) / box.height, 0), 1);
            return duration * timeAt(ease, 1 - middle);
          };
        running.push(...flight, ...entrance(root, scope, when, enterEase, pace));
        remember(root);
        Promise.all(flight.map((a) => a.finished)).then(() => {
          if (live.aborted) return;
          root.classList.add('is-done');
          root.classList.remove('is-leaving');
          flight.forEach((a) => a.cancel());
        }, () => {});
      };

      hurry = leave;
      Promise.all([
        rise.finished,
        // The page is waited for at any pace, then the line's own transition (0.6s) at the site's
        loaded(root, live, (p) => bar.style.setProperty('--kz-logo-collapse-progress', p)).then(() => wait(600 * pace, live)),
      ]).then(() => wait(hold, live)).then(leave, () => {});
    };

    // data-once, already seen in this visit: the page is there at once
    if (seen(root)) root.classList.add('is-done');
    else play();
    root.addEventListener('kodza:replay', play, { signal });
    // A click, a key, the wheel or a finger: no more waiting
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((type) => window.addEventListener(type, () => hurry?.(), { capture: true, passive: true, signal }));
    signal.addEventListener('abort', () => {
      run?.abort();
      running.forEach((a) => a.cancel());
    }, { once: true });
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
