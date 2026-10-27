// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Shutter Menu
// The panel is a native popover: the button opens and closes it, Escape and a click outside close
// it, and the focus goes back to the button. The script starts the shutter under your header,
// times each link to rise when the edge reaches it, and keeps the page still while it is open.
(() => {
  const SELECTOR = '.kodza-shutter';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // When (0 to 1 of the duration) a cubic-bezier curve gets to the progress p
  const timeAt = ([x1, y1, x2, y2], p) => {
    const at = (a, b, s) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (at(y1, y2, mid) < p) lo = mid;
      else hi = mid;
    }
    return at(x1, x2, (lo + hi) / 2);
  };

  // A wheel or a swipe only scrolls what can scroll in the panel, under the pointer
  const scrollsInside = (panel, target, x, y, dy) => {
    for (let el = target; el instanceof Element && panel.contains(el); el = el.parentElement) {
      const box = el.getBoundingClientRect();
      if (x < box.left || x > box.right || y < box.top || y > box.bottom) continue;
      if (!/(auto|scroll)/.test(getComputedStyle(el).overflowY) || el.scrollHeight <= el.clientHeight + 1) continue;
      if (dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return true;
    }
    return false;
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal`, so kodza:destroy stops it all.
  function mount(root, signal) {
    const toggle = root.querySelector('.kodza-shutter__toggle');
    const panel = root.querySelector('.kodza-shutter__panel');
    if (!toggle || !panel || !('popover' in panel)) return;
    toggle.popoverTargetElement = panel;
    const words = [...toggle.querySelectorAll('.kodza-shutter__say')];
    const parts = [...panel.querySelectorAll('.kodza-shutter__link, .kodza-shutter__info')];
    let open = false;
    let started = 0;
    let held = null;
    const rolls = new Map();

    // The shutter starts under the header that holds the button (or at --kz-shutter-top)
    const place = () => {
      const top = getComputedStyle(root).getPropertyValue('--kz-shutter-top').trim();
      if (top && top !== 'auto') {
        panel.style.setProperty('--kz-shutter-from', top);
        return;
      }
      // Under the header, or just under the button when there is none: Close always stays in view
      const bar = root.closest('header, [role="banner"]');
      const below = toggle.getBoundingClientRect().bottom;
      const edge = bar ? Math.max(bar.getBoundingClientRect().bottom, below) : below + 16;
      panel.style.setProperty('--kz-shutter-from', `${Math.max(0, Math.round(edge))}px`);
    };

    // Each row starts when the edge of the shutter gets to it
    const time = () => {
      const style = getComputedStyle(root);
      const raw = style.getPropertyValue('--kz-shutter-duration').trim();
      const duration = reduceMotion ? 0 : parseFloat(raw) * (/ms$/.test(raw) ? 1 : 1000) || 800;
      const match = style.getPropertyValue('--kz-shutter-ease').match(/cubic-bezier\(([^)]+)\)/);
      const curve = match ? match[1].split(',').map(Number) : [0.76, 0, 0.24, 1];
      const box = panel.getBoundingClientRect();
      const late = performance.now() - started;
      parts.forEach((part) => {
        const p = Math.min(1, Math.max(0, (part.getBoundingClientRect().top - box.top) / (box.height || 1)));
        const delay = Math.max(0, duration * timeAt(curve, p) - late - 40);
        part.style.setProperty('--kz-shutter-delay', `${Math.round(delay)}ms`);
      });
    };

    // Menu rolls to Close and back the same way: the old word goes up, the new one comes from below.
    // A click during the roll turns it back from where the words are
    const roll = () => {
      if (reduceMotion || words.length < 2) return;
      words.forEach((word, i) => {
        const coming = i === Number(open);
        const from = rolls.has(word) ? getComputedStyle(word).translate : coming ? '0 115%' : '0 0';
        rolls.get(word)?.cancel();
        const run = word.animate(
          { translate: [from, coming ? '0 0' : '0 -115%'] },
          { duration: 500, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
        );
        rolls.set(word, run);
        run.finished.then(() => rolls.get(word) === run && rolls.delete(word), () => {});
      });
    };

    // While it is open the page stays where it is
    const hold = () => {
      held = new AbortController();
      const s = held.signal;
      const at = [scrollX, scrollY];
      let last = 0;
      document.addEventListener('wheel', (event) => {
        if (!scrollsInside(panel, event.target, event.clientX, event.clientY, event.deltaY)) event.preventDefault();
      }, { passive: false, signal: s });
      document.addEventListener('touchstart', (event) => (last = event.touches[0].clientY), { passive: true, signal: s });
      document.addEventListener('touchmove', (event) => {
        const touch = event.touches[0];
        const dy = last - touch.clientY;
        last = touch.clientY;
        if (!scrollsInside(panel, event.target, touch.clientX, touch.clientY, dy)) event.preventDefault();
      }, { passive: false, signal: s });
      // A scrollbar dragged anyway: the page goes back to where it was
      window.addEventListener('scroll', () => {
        if (scrollX !== at[0] || scrollY !== at[1]) window.scrollTo({ left: at[0], top: at[1], behavior: 'instant' });
      }, { signal: s });
      window.addEventListener('resize', place, { signal: s });
    };
    const release = () => {
      held?.abort();
      held = null;
    };

    panel.addEventListener('beforetoggle', (event) => {
      open = event.newState === 'open';
      toggle.setAttribute('aria-expanded', String(open));
      words.forEach((word, i) => (i === Number(open) ? word.removeAttribute('aria-hidden') : word.setAttribute('aria-hidden', 'true')));
      roll();
      if (open) {
        started = performance.now();
        place();
        hold();
      } else {
        panel.classList.remove('is-open');
        release();
      }
    }, { signal });

    panel.addEventListener('toggle', (event) => {
      if (event.newState !== 'open' || !open) return;
      time();
      panel.classList.add('is-open');
    }, { signal });

    // Tab past the last link, or a link followed: the shutter rolls back up
    panel.addEventListener('focusout', (event) => {
      const next = event.relatedTarget;
      if (open && next && !panel.contains(next) && next !== toggle) panel.hidePopover();
    }, { signal });
    panel.addEventListener('click', (event) => {
      if (open && event.target.closest('a[href]')) panel.hidePopover();
    }, { signal });

    signal.addEventListener('abort', () => {
      rolls.forEach((run) => run.cancel());
      release();
      if (open) panel.hidePopover();
    });
  }

  // Kodza lifecycle, the same in every component: `kodza:init` starts the instances inside
  // event.detail.root (the whole page by default), `kodza:destroy` stops them and puts their
  // markup back. For themes and apps that swap content without a page load. Each running root
  // keeps its markup as written under KODZA, shared by every Kodza script on the page: a Kodza
  // component inside another one is saved as written, not half-started, and stopped with it.
  const KODZA = Symbol.for('kodza');
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
    if (root.classList.contains('is-ready')) return; // already running, maybe from another copy of this script
    const controller = new AbortController();
    const saved = { html: written(root), attrs: attrsOf(root), stop: () => destroy(root) };
    instances.set(root, { controller, saved });
    root[KODZA] = saved;
    mount(root, controller.signal);
    root.classList.add('is-ready');
  });
  const destroy = (scope) => find(scope).forEach((root) => {
    const instance = instances.get(root);
    if (!instance) return;
    instances.delete(root);
    // The Kodza components running inside it stop first: once its markup is put back, their own
    // script could not find them any more
    root.querySelectorAll('*').forEach((el) => el[KODZA]?.stop());
    instance.controller.abort();
    delete root[KODZA];
    put(root, instance.saved);
  });
  document.addEventListener('kodza:init', (event) => init(event.detail?.root));
  document.addEventListener('kodza:destroy', (event) => destroy(event.detail?.root));
  init();
  // Loaded in <head>, the script runs before the markup exists: once more when it is parsed
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(), { once: true });
})();
