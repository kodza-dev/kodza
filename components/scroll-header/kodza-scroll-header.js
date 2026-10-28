// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Scroll Header
// Marks the header "is-scrolled" once the page scrolls under it (a 1px sentinel just above it
// tells), "is-hidden" while the visitor reads down (until they scroll up or tab into it), and
// "is-dark" over a section marked data-header-tone="dark". On small screens, or as soon as the
// links no longer fit on the bar ("is-folded"), they wait in the pill's menu (with the actions'
// links, copied as plain links) and the two-line button opens it. While the links are on the bar,
// it measures the width they need into --kz-header-content, for a pill that hugs them.
(() => {
  const SELECTOR = '.kodza-scroll-header';
  let uid = 0;

  // The tone of the section right under the header. Hidden, it is read where the header will
  // come back (stuck at the top), so it never returns in the tone of a section it left. While a
  // view transition draws over the page (a page transition), the point only reaches <html>: the
  // marked sections are then found by their boxes, the innermost one last
  const readTone = (root) => {
    const box = root.getBoundingClientRect();
    const bottom = root.classList.contains('is-hidden') ? (parseFloat(getComputedStyle(root).top) || 0) + root.offsetHeight : box.bottom;
    const x = box.left + box.width / 2;
    const y = Math.min(innerHeight - 1, Math.max(0, bottom - 6));
    const under = document.elementsFromPoint(x, y).find((el) => !root.contains(el));
    const zone = under && under !== document.documentElement
      ? under.closest('[data-header-tone]')
      : [...document.querySelectorAll('[data-header-tone]')].filter((el) => {
        const r = el.getBoundingClientRect();
        return !root.contains(el) && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
      }).pop();
    root.classList.toggle('is-dark', (zone?.dataset.headerTone || root.dataset.tone) === 'dark');
  };

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const sentinel = document.createElement('span');
    sentinel.className = 'kodza-scroll-header__sentinel';
    sentinel.setAttribute('aria-hidden', 'true');
    root.before(sentinel);
    const observer = new IntersectionObserver(([entry]) => {
      const scrolled = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      root.classList.toggle('is-scrolled', scrolled);
      if (!scrolled) root.classList.remove('is-hidden');
    });
    observer.observe(sentinel);
    signal.addEventListener('abort', () => {
      observer.disconnect();
      sentinel.remove();
    });
    root.addEventListener('focusin', () => root.classList.remove('is-hidden'), { signal });

    // The small-screen menu: the same links, bigger, and the actions' links last (any button
    // kind: only its address and its words are copied, without what is hidden from screen readers)
    const bar = root.querySelector('.kodza-scroll-header__bar');
    const burger = root.querySelector('.kodza-scroll-header__burger');
    const panel = root.querySelector('.kodza-scroll-header__panel-in');
    let fit;
    const words = (node) => [...node.childNodes].map((child) => {
      if (child.nodeType === Node.TEXT_NODE) return child.textContent;
      if (child.nodeType !== Node.ELEMENT_NODE || child.getAttribute('aria-hidden') === 'true') return '';
      return words(child);
    }).join('').replace(/\s+/g, ' ').trim();
    if (burger && panel) {
      const sources = [...root.querySelectorAll('.kodza-scroll-header__link, .kodza-scroll-header__actions a[href]')];
      panel.append(...sources.map((source, i) => {
        const link = document.createElement('a');
        link.className = 'kodza-scroll-header__panel-link';
        ['href', 'target', 'rel', 'aria-current'].forEach((name) => source.hasAttribute(name) && link.setAttribute(name, source.getAttribute(name)));
        link.textContent = source.getAttribute('aria-label') || words(source);
        link.style.setProperty('--i', i);
        return link;
      }));
      panel.id = `kodza-scroll-header-${++uid}`;
      burger.setAttribute('aria-controls', panel.id);
      const set = (open) => {
        root.classList.toggle('is-open', open);
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Close the menu' : 'Menu');
      };
      burger.addEventListener('click', () => set(!root.classList.contains('is-open')), { signal });
      panel.addEventListener('click', (event) => event.target.closest('a') && set(false), { signal });
      root.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && root.classList.contains('is-open')) {
          set(false);
          burger.focus();
        }
      }, { signal });

      // Above 760px, fold only when the bar runs out of room (measured unfolded, in one frame)
      fit = () => {
        root.classList.remove('is-folded');
        const folded = innerWidth > 760 && bar.scrollWidth > bar.clientWidth + 1;
        root.classList.toggle('is-folded', folded);
        if (!folded && innerWidth > 760 && root.classList.contains('is-open')) set(false);
      };
    }

    // The width the bar's content needs (logo, links, actions, gaps and padding), for a pill that
    // hugs it. Folded, the menu needs the whole width: the variable goes back to 100%
    const hug = () => {
      if (!bar || burger?.offsetWidth) return root.style.removeProperty('--kz-header-content');
      const style = getComputedStyle(bar);
      const shown = [...bar.children].filter((child) => child.offsetWidth);
      const width = shown.reduce((sum, child) => sum + child.offsetWidth, 0) + Math.max(0, shown.length - 1) * (parseFloat(style.columnGap) || 0) + parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      root.style.setProperty('--kz-header-content', `${Math.ceil(width)}px`);
    };
    if (bar) {
      const sizer = new ResizeObserver(() => {
        fit?.();
        hug();
      });
      [bar, ...bar.children].forEach((el) => sizer.observe(el));
      document.fonts?.ready.then(() => !signal.aborted && (fit?.(), hug()));
      signal.addEventListener('abort', () => sizer.disconnect());
    }

    let lastY = window.scrollY;
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const delta = y - lastY;
      const locked = root.classList.contains('kodza-scroll-header--keep') || root.classList.contains('is-open') || root.contains(document.activeElement);
      if (Math.abs(delta) >= 6 && !locked) {
        // Only a header stuck at the top hides (measured on its container: the header itself
        // moves when hidden), and only once the page has scrolled --kz-header-hide-after past it
        const stuck = root.classList.contains('is-scrolled') && root.parentElement.getBoundingClientRect().bottom > root.offsetHeight;
        const far = sentinel.getBoundingClientRect().top < -(parseFloat(getComputedStyle(root).getPropertyValue('--kz-header-hide-after')) || 600);
        if (delta < 0 || !stuck) root.classList.remove('is-hidden');
        else if (far) root.classList.add('is-hidden');
      }
      readTone(root);
      if (Math.abs(delta) >= 6) lastY = y;
    };
    const queue = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener('scroll', queue, { passive: true, signal });
    window.addEventListener('resize', queue, { signal });
    readTone(root);
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
