// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Pagination
// Draws the pages from data-pages and data-current, seven slots wide (first, last, the
// neighbours of the current page, gaps as "…"), five when the row is too narrow for seven (a
// phone: 1 … 3 … 12). On a change, the pill slides and only the slots whose number changes
// roll. Fires "kodza:page" with { page } on the nav.
(() => {
  const SELECTOR = '.kodza-pagination';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SLOTS = 7;
  const NARROW = 5;
  const arrow = (d) => `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  // The numbers to show around the current page, `count` of them (null is a gap). A gap never
  // hides a single page: that page is shown instead
  const windowAround = (current, pages, count) => {
    if (pages <= count) return Array.from({ length: pages }, (_, i) => i + 1);
    const side = (count - 5) / 2; // neighbours on each side of the current page
    const run = (from, length) => Array.from({ length }, (_, i) => from + i);
    if (current <= side + 3) return [...run(1, count - 2), null, pages];
    if (current >= pages - side - 2) return [1, null, ...run(pages - count + 3, count - 2)];
    return [1, null, ...run(current - side, side * 2 + 1), null, pages];
  };

  // Old content leaves through the top, new content rises from below
  const roll = (box, next, duration, ease, delay = 0) => {
    const prev = box.firstElementChild;
    box.replaceChildren(...(prev ? [prev, next] : [next]));
    if (!prev || reduceMotion) {
      prev?.remove();
      return;
    }
    prev.setAttribute('aria-hidden', 'true');
    prev.animate([{ transform: 'none' }, { transform: 'translateY(-105%)' }], { duration, delay, easing: ease, fill: 'forwards' }).finished.then(() => prev.remove());
    next.animate([{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration, delay, easing: ease, fill: 'backwards' });
  };

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const pages = Math.max(1, parseInt(root.dataset.pages, 10) || 1);
    const href = root.dataset.href;
    const compact = root.classList.contains('kodza-pagination--compact');
    const style = getComputedStyle(root);
    const duration = parseFloat(style.getPropertyValue('--kz-pages-duration')) * 1000 || 500;
    const ease = style.getPropertyValue('--kz-pages-ease').trim() || 'ease';
    let current = Math.min(pages, Math.max(1, parseInt(root.dataset.current, 10) || 1));

    const makeArrow = (label, d) => {
      const el = document.createElement(href ? 'a' : 'button');
      el.className = 'kodza-pagination__arrow';
      el.setAttribute('aria-label', label);
      el.innerHTML = arrow(d);
      if (!href) el.type = 'button';
      return el;
    };
    const prev = makeArrow('Previous page', 'M10 3.5 5.5 8l4.5 4.5');
    const next = makeArrow('Next page', 'M6 3.5 10.5 8 6 12.5');

    // Slots (numbers) or a label (compact), between the two arrows
    const slotList = document.createElement(compact ? 'p' : 'ol');
    let slots = [];
    let indicator = null;
    let number = null;
    const live = document.createElement('span');
    live.className = 'kodza-pagination__sr';
    live.setAttribute('aria-live', 'polite');
    if (compact) {
      slotList.className = 'kodza-pagination__label';
      number = document.createElement('b');
      slotList.append('Page', number, `of ${pages}`);
    } else {
      slotList.className = 'kodza-pagination__slots';
      indicator = document.createElement('li');
      indicator.className = 'kodza-pagination__indicator';
      indicator.setAttribute('aria-hidden', 'true');
    }
    root.replaceChildren(prev, slotList, next, live);

    // Seven slots, or five when the parent has no room for seven. Arrows and slots share one size
    const slotCount = () => {
      const parent = root.parentElement;
      const box = parent && getComputedStyle(parent);
      const room = parent ? parent.clientWidth - parseFloat(box.paddingLeft) - parseFloat(box.paddingRight) : 0;
      const size = prev.offsetWidth;
      const gap = parseFloat(style.columnGap) || 0;
      return Math.min(pages, room > 0 && (SLOTS + 2) * size + (SLOTS + 1) * gap > room ? NARROW : SLOTS);
    };
    const buildSlots = (count) => {
      slots = Array.from({ length: count }, () => {
        const li = document.createElement('li');
        li.className = 'kodza-pagination__slot';
        return li;
      });
      slotList.replaceChildren(indicator, ...slots);
    };
    if (!compact) buildSlots(slotCount());

    const pageEl = (n) => {
      if (n === null) {
        const gap = document.createElement('span');
        gap.className = 'kodza-pagination__gap';
        gap.setAttribute('aria-hidden', 'true');
        gap.textContent = '…';
        return gap;
      }
      const el = document.createElement(href ? 'a' : 'button');
      el.className = 'kodza-pagination__page';
      el.textContent = n;
      el.dataset.page = n;
      el.setAttribute('aria-label', `Page ${n}`);
      if (href) el.href = href.replace('{n}', n);
      else el.type = 'button';
      if (n === current) el.setAttribute('aria-current', 'page');
      return el;
    };

    const render = (animate) => {
      const hadFocus = root.contains(document.activeElement) && document.activeElement.classList.contains('kodza-pagination__page');
      if (compact) {
        const span = document.createElement('span');
        span.textContent = current;
        if (number.textContent !== String(current)) roll(number, span, animate ? duration : 0, ease);
      } else {
        windowAround(current, pages, slots.length).forEach((n, i) => {
          const slot = slots[i];
          const old = slot.lastElementChild;
          const same = old && (old.dataset.page ?? null) === (n === null ? null : String(n));
          if (same) {
            old.toggleAttribute('aria-current', n === current);
            if (n === current) old.setAttribute('aria-current', 'page');
          } else {
            roll(slot, pageEl(n), animate ? duration : 0, ease, i * 30);
          }
          if (n === current) indicator.style.setProperty('--kz-pages-x', `${slot.offsetLeft}px`);
        });
        if (hadFocus) root.querySelector('[aria-current="page"]')?.focus({ preventScroll: true });
      }
      const ends = [[prev, current <= 1, current - 1], [next, current >= pages, current + 1]];
      ends.forEach(([el, off, n]) => {
        if (href) {
          el.toggleAttribute('aria-disabled', off);
          if (off) el.removeAttribute('href');
          else el.href = href.replace('{n}', n);
        } else {
          el.disabled = off;
        }
      });
      live.textContent = `Page ${current} of ${pages}`;
    };

    const go = (n) => {
      const page = Math.min(pages, Math.max(1, n));
      if (page === current) return;
      current = page;
      root.dataset.current = page;
      render(true);
      root.dispatchEvent(new CustomEvent('kodza:page', { detail: { page }, bubbles: true }));
    };

    if (!href) {
      root.addEventListener('click', (event) => {
        const target = event.target.closest('button');
        if (!target || target.disabled) return;
        if (target === prev) go(current - 1);
        else if (target === next) go(current + 1);
        else if (target.dataset.page) go(Number(target.dataset.page));
      }, { signal });
    }
    // The arrow keys turn the page: the next number, or the link to the next page
    root.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const link = event.key === 'ArrowRight' ? next : prev;
      if (!href) go(current + (event.key === 'ArrowRight' ? 1 : -1));
      else if (link.hasAttribute('href')) link.click();
    }, { signal });

    render(false);
    // The pill takes its place before is-ready turns its transition on: it must not slide in
    if (indicator) void getComputedStyle(indicator).transform;

    // The row narrows or widens (a phone turned, a sidebar opened): seven slots or five again.
    // The pill jumps with the new layout instead of sliding across it
    if (!compact && root.parentElement) {
      const observer = new ResizeObserver(() => {
        const count = slotCount();
        if (count === slots.length) return;
        const hadFocus = root.contains(document.activeElement);
        buildSlots(count);
        indicator.style.transition = 'none';
        render(false);
        void getComputedStyle(indicator).transform;
        indicator.style.transition = '';
        if (hadFocus && !root.contains(document.activeElement)) root.querySelector('[aria-current="page"]')?.focus({ preventScroll: true });
      });
      observer.observe(root.parentElement);
      signal.addEventListener('abort', () => observer.disconnect());
    }
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
    // Rendered by React (data-kodza-manual): React starts it, with an init aimed at that markup once
    // it has hydrated it. Any earlier start would change markup React has not taken over yet
    const owner = root.closest('[data-kodza-manual]');
    if (owner && !(scope && owner.contains(scope))) return;
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
