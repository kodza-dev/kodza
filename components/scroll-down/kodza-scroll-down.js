// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Scroll Down
// The cue at the bottom of a hero. Now and then its glyph rolls down and a new one drops in
// from above; under the pointer, ink pours in. A click glides to the section after the hero
// (or data-target) and, from the keyboard, moves the focus there. The first scroll past the
// hero fades it out, and it comes back at the top.
(() => {
  const SELECTOR = '.kodza-scroll-down';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FIRST = 1400;
  const EVERY = 3600;

  // The box that scrolls it: the nearest scrolling ancestor, or the page (null)
  const scrollerOf = (el) => {
    for (let p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
      const { overflowY } = getComputedStyle(p);
      if ((overflowY === 'auto' || overflowY === 'scroll') && p.scrollHeight > p.clientHeight) return p;
    }
    return null;
  };

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const icon = root.querySelector('.kodza-scroll-down__icon');
    const glyph = icon?.firstElementChild;
    if (!glyph) return;

    // The outline and its ink copy, each with the glyph and its twin waiting above
    const layer = (extra) => {
      const el = document.createElement('span');
      const slot = document.createElement('span');
      const track = document.createElement('span');
      el.className = `kodza-scroll-down__layer${extra}`;
      slot.className = 'kodza-scroll-down__slot';
      track.className = 'kodza-scroll-down__track';
      track.append(glyph.cloneNode(true), glyph.cloneNode(true));
      slot.append(track);
      el.append(slot);
      return el;
    };
    icon.replaceChildren(layer(''), layer(' kodza-scroll-down__layer--fill'));

    const scroller = scrollerOf(root);
    const scrollTop = () => (scroller ? scroller.scrollTop : window.scrollY);
    const viewHeight = () => (scroller ? scroller.clientHeight : innerHeight);
    const set = (y) => (scroller || window).scrollTo({ top: y, behavior: 'instant' });
    // Where an element sits in the scrolled box, whatever scale the box is drawn at
    const topOf = (el) => {
      const r = el.getBoundingClientRect();
      if (!scroller) return r.top + window.scrollY;
      const box = scroller.getBoundingClientRect();
      return (r.top - box.top) / (box.height / scroller.offsetHeight || 1) + scroller.scrollTop;
    };

    // The hero: the first block around it at least half a screen tall
    const heroOf = () => {
      for (let el = root.parentElement; el && el !== scroller && el !== document.body; el = el.parentElement) {
        if (el.offsetHeight >= viewHeight() * 0.5) return el;
      }
      return null;
    };

    // The next section: data-target (or the link's #hash), else what follows the hero
    const targetOf = () => {
      const href = root.getAttribute('href');
      const wanted = root.dataset.target || (href && href.length > 1 && href.startsWith('#') ? href : '');
      if (wanted) {
        try {
          const found = document.querySelector(wanted);
          if (found) return found;
        } catch { /* not a selector: fall back to the next section */ }
      }
      for (let el = heroOf() || root.parentElement; el && el !== document.body; el = el.parentElement) {
        for (let next = el.nextElementSibling; next; next = next.nextElementSibling) {
          if (next.offsetHeight > 0) return next;
        }
      }
      return null;
    };

    // The roll: both copies of the glyph move together, the twin lands where the glyph was
    let rolling = false;
    const roll = () => {
      if (reduceMotion || rolling) return;
      rolling = true;
      root.classList.add('is-rolling');
    };
    root.addEventListener('animationend', (event) => {
      if (event.animationName !== 'kodza-scroll-down-roll') return;
      rolling = false;
      root.classList.remove('is-rolling');
    }, { signal });

    // Now and then, only while it is shown and on screen
    let away = false;
    let inView = false;
    let timer = 0;
    const schedule = (wait = EVERY) => {
      clearTimeout(timer);
      if (reduceMotion || away || !inView) return;
      timer = setTimeout(() => {
        if (!document.hidden) roll();
        schedule();
      }, wait);
    };
    const seen = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      schedule(FIRST);
    });
    seen.observe(root);

    // The ink: pours in under the pointer (or the keyboard focus), drains through the bottom
    let hovered = false;
    const sync = () => {
      const want = !away && (hovered || root.matches(':focus-visible'));
      const filled = root.classList.contains('is-in');
      if (want && !filled) {
        root.classList.remove('is-out');
        root.classList.add('is-in');
        roll();
        schedule();
      } else if (!want && filled) {
        root.classList.remove('is-in');
        root.classList.add('is-out');
      }
    };
    const fill = icon.querySelector('.kodza-scroll-down__layer--fill');
    fill.addEventListener('transitionend', (event) => {
      if (event.propertyName === 'clip-path' && root.classList.contains('is-out')) root.classList.remove('is-out');
    }, { signal });
    root.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'touch') return;
      hovered = true;
      sync();
    }, { signal });
    root.addEventListener('pointerleave', () => {
      hovered = false;
      sync();
    }, { signal });
    root.addEventListener('focus', sync, { signal });
    root.addEventListener('blur', sync, { signal });

    // Shown at rest, faded once the page has scrolled past the top of its hero
    const limit = root.dataset.hide === 'never' ? Infinity : parseFloat(root.dataset.hide) || 40;
    const update = () => {
      const hero = heroOf();
      let rest = hero ? topOf(hero) : 0;
      if (rest < viewHeight() / 2) rest = 0;
      const now = scrollTop() > rest + limit;
      if (now === away) return;
      away = now;
      root.classList.toggle('is-away', away);
      if (away) hovered = false;
      sync();
      schedule(FIRST);
    };

    // The glide: eased, and dropped as soon as the visitor scrolls or presses anything
    let glide = null;
    const stop = () => {
      glide?.abort();
      glide = null;
    };
    const glideTo = (y) => {
      stop();
      const box = scroller || document.documentElement;
      const from = scrollTop();
      const to = Math.max(0, Math.min(box.scrollHeight - (scroller ? scroller.clientHeight : innerHeight), y));
      if (reduceMotion || Math.abs(to - from) < 2) {
        set(to);
        return;
      }
      const controller = new AbortController();
      glide = controller;
      const duration = Math.min(1400, 500 + Math.abs(to - from) * 0.45);
      const start = performance.now();
      const step = (now) => {
        if (controller.signal.aborted) return;
        const t = Math.min(1, (now - start) / duration);
        set(from + (to - from) * (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2));
        if (t < 1) requestAnimationFrame(step);
        else stop();
      };
      requestAnimationFrame(step);
      ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach((type) => {
        window.addEventListener(type, stop, { passive: true, signal: controller.signal });
      });
    };

    // From the keyboard the focus follows, on the section itself if nothing in it takes it
    const focusOn = (el) => {
      if (!el.matches('a[href], button, input, select, textarea, [tabindex]')) {
        const outline = el.style.outline;
        el.setAttribute('tabindex', '-1');
        el.style.outline = 'none';
        el.addEventListener('blur', () => {
          el.removeAttribute('tabindex');
          el.style.outline = outline;
        }, { once: true, signal });
      }
      el.focus({ preventScroll: true });
    };

    root.addEventListener('click', (event) => {
      const target = targetOf();
      if (root.matches('a')) event.preventDefault();
      if (!target) {
        glideTo(scrollTop() + viewHeight());
        return;
      }
      glideTo(topOf(target) - (parseFloat(getComputedStyle(target).scrollMarginTop) || 0));
      if (event.detail === 0) focusOn(target);
    }, { signal });

    let ticking = false;
    (scroller || window).addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        if (!signal.aborted) update();
      });
    }, { passive: true, signal });
    window.addEventListener('resize', update, { signal });
    signal.addEventListener('abort', () => {
      stop();
      clearTimeout(timer);
      seen.disconnect();
    });
    update();
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
