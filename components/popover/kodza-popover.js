// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Popover
// Places the panel under its trigger (above when there is no room), keeps it on screen with
// the arrow still on the trigger, and plays the entrance and the exit from the trigger. Click
// to open; with --hover, hover or focus (after 350 ms), and it stays while the pointer is on it.
// The native Popover API handles clicks elsewhere; the trigger and Escape close it with its exit.
// A fallback covers older browsers.
(() => {
  const SELECTOR = '.kodza-popover';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const native = typeof HTMLElement.prototype.showPopover === 'function';
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  let uid = 0;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const trigger = root.querySelector('.kodza-popover__trigger');
    const panel = root.querySelector('.kodza-popover__panel');
    if (!trigger || !panel) return;
    const hover = root.classList.contains('kodza-popover--hover');
    panel.id = `kodza-popover-${++uid}`;
    trigger.setAttribute('aria-controls', panel.id);
    trigger.setAttribute('aria-expanded', 'false');
    if (hover) trigger.setAttribute('aria-describedby', panel.id);
    else {
      panel.setAttribute('role', 'dialog');
      const title = panel.querySelector('.kodza-popover__title');
      if (title) panel.setAttribute('aria-labelledby', (title.id = `${panel.id}-title`));
    }
    if (!native) panel.removeAttribute('popover');

    const isOpen = () => (native ? panel.matches(':popover-open') : panel.classList.contains('is-open'));

    // Under the trigger, or above; centred on it but kept 8 px inside the screen
    const place = () => {
      const t = trigger.getBoundingClientRect();
      const w = panel.offsetWidth;
      const h = panel.offsetHeight;
      const below = t.bottom + 12 + h <= innerHeight - 8 || t.top - 12 - h < 8;
      const x = Math.min(innerWidth - 8 - w, Math.max(8, t.left + t.width / 2 - w / 2));
      const y = below ? t.bottom + 12 : t.top - 12 - h;
      panel.dataset.side = below ? 'bottom' : 'top';
      panel.style.setProperty('--kz-pop-x', `${x}px`);
      panel.style.setProperty('--kz-pop-y', `${y}px`);
      panel.style.setProperty('--kz-pop-arrow', `${t.left + t.width / 2 - x}px`);
      // It grows out of the arrow
      panel.style.transformOrigin = `${t.left + t.width / 2 - x}px ${below ? 0 : h}px`;
      return below;
    };

    // The copy button: copies the field, and its word rolls to "Copied". Both words sit in the
    // same grid cell (the button keeps the width of the longer one), the hidden one waits below
    const copy = panel.querySelector('.kodza-popover__copy');
    const field = panel.querySelector('.kodza-popover__field');
    const words = copy ? [...copy.querySelectorAll('.kodza-popover__copy-words > span')] : [];
    let restCopy = () => {};
    if (copy && field && words.length === 2) {
      const [idle, done] = words;
      let timer = 0;
      // The shown word leaves upwards, the next one comes up from below
      const roll = (next) => {
        const prev = next === done ? idle : done;
        if (!next.hasAttribute('aria-hidden')) return;
        prev.setAttribute('aria-hidden', 'true');
        next.removeAttribute('aria-hidden');
        if (reduceMotion) return;
        const timing = { duration: 320, easing: ease };
        prev.animate([{ transform: 'none' }, { transform: 'translateY(-110%)' }], timing);
        next.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], timing);
      };
      // Closed: back to "Copy" at once, out of sight
      restCopy = () => {
        clearTimeout(timer);
        words.forEach((word) => word.getAnimations().forEach((animation) => animation.cancel()));
        idle.removeAttribute('aria-hidden');
        done.setAttribute('aria-hidden', 'true');
      };
      copy.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(field.value);
        } catch {
          field.select();
        }
        roll(done);
        clearTimeout(timer);
        timer = setTimeout(() => roll(idle), 1600);
      }, { signal });
      signal.addEventListener('abort', () => clearTimeout(timer));
    }

    let leaving = null;
    // Where the panel is right now, mid-animation included: a change of mind starts from there
    const now = () => {
      const { opacity, transform } = getComputedStyle(panel);
      panel.getAnimations().forEach((animation) => animation.cancel());
      return { opacity, transform };
    };
    const show = () => {
      if (isOpen() && !leaving) return;
      // Called back while it leaves: it comes back from where it is
      if (isOpen()) {
        leaving = null;
        trigger.setAttribute('aria-expanded', 'true');
        return panel.animate([now(), { opacity: 1, transform: 'none' }], { duration: 240, easing: ease });
      }
      leaving?.cancel();
      leaving = null;
      if (native) panel.showPopover();
      else panel.classList.add('is-open');
      const below = place();
      trigger.setAttribute('aria-expanded', 'true');
      if (!reduceMotion) panel.animate([{ opacity: 0, transform: `translateY(${below ? -6 : 6}px) scale(0.92)` }, { opacity: 1, transform: 'none' }], { duration: 320, easing: ease });
    };
    const hide = (refocus = false) => {
      if (!isOpen() || leaving) return;
      trigger.setAttribute('aria-expanded', 'false');
      const done = () => {
        if (native) return panel.hidePopover();
        panel.classList.remove('is-open');
        restCopy();
      };
      if (refocus) trigger.focus({ preventScroll: true });
      if (reduceMotion) return done();
      const below = panel.dataset.side !== 'top';
      leaving = panel.animate([now(), { opacity: 0, transform: `translateY(${below ? -4 : 4}px) scale(0.96)` }], { duration: 160, easing: 'ease-in', fill: 'forwards' });
      leaving.finished.then(() => {
        leaving = null;
        done();
        panel.getAnimations().forEach((animation) => animation.cancel());
      }).catch(() => {});
    };

    // The native popover closed (a click elsewhere, or the script): keep the trigger in step,
    // and the copy button back at rest
    panel.addEventListener('toggle', (event) => {
      if (event.newState !== 'closed') return;
      trigger.setAttribute('aria-expanded', 'false');
      restCopy();
    }, { signal });

    if (hover) {
      let timer = 0;
      const soon = (fn, ms) => {
        clearTimeout(timer);
        timer = setTimeout(fn, ms);
      };
      [trigger, panel].forEach((el) => {
        el.addEventListener('pointerenter', () => soon(show, isOpen() ? 0 : 350), { signal });
        el.addEventListener('pointerleave', () => soon(() => hide(), 200), { signal });
      });
      trigger.addEventListener('focus', () => soon(show, 350), { signal });
      trigger.addEventListener('blur', () => soon(() => hide(), 100), { signal });
      signal.addEventListener('abort', () => clearTimeout(timer));
    } else {
      // The trigger is the panel's invoker (popovertarget): a press on it no longer
      // light-dismisses the panel at once, the click closes it with its exit. A browser that
      // still dismisses it on the press has closed it already: the click must not reopen it
      if (native && trigger.localName === 'button') trigger.setAttribute('popovertarget', panel.id);
      let closedByPress = false;
      trigger.addEventListener('pointerdown', () => (closedByPress = isOpen() && !leaving), { signal });
      trigger.addEventListener('click', (event) => {
        event.preventDefault(); // the script opens and closes it, not popovertarget
        const pressed = closedByPress;
        closedByPress = false;
        if (leaving) return show(); // clicked again while it leaves: it comes back
        if (pressed || isOpen()) return hide();
        show();
        // From the keyboard, the focus goes into the panel
        if (trigger.matches(':focus-visible')) panel.querySelector('button, input, a[href]')?.focus();
      }, { signal });
      if (!native) document.addEventListener('pointerdown', (event) => !root.contains(event.target) && hide(), { signal });
    }

    // Escape, from the panel or its trigger: the exit plays (the native close would cut it)
    root.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !isOpen()) return;
      event.preventDefault();
      hide(!hover);
    }, { signal });

    addEventListener('resize', () => isOpen() && place(), { signal });
    addEventListener('scroll', () => isOpen() && place(), { passive: true, signal });

    // Stopped while open (or leaving): the popover leaves the top layer at once
    signal.addEventListener('abort', () => {
      leaving?.cancel();
      if (native && panel.matches(':popover-open')) panel.hidePopover();
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
