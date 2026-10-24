// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Hover Nav
// Adds the highlight (and, with --ink, the white copy of the links), moves it to the link
// under the pointer or the keyboard focus, and brings it back to the current page.
(() => {
  const SELECTOR = '.kodza-hover-nav';
  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const links = [...root.querySelectorAll('.kodza-hover-nav__link')];
    if (!links.length) return;

    const highlight = document.createElement('span');
    highlight.className = 'kodza-hover-nav__highlight';
    highlight.setAttribute('aria-hidden', 'true');
    root.prepend(highlight);

    if (root.classList.contains('kodza-hover-nav--ink')) {
      const mirror = document.createElement('span');
      mirror.className = 'kodza-hover-nav__mirror';
      mirror.setAttribute('aria-hidden', 'true');
      mirror.append(...links.map((link) => {
        const ghost = document.createElement('span');
        ghost.className = 'kodza-hover-nav__ghost';
        ghost.textContent = link.textContent;
        return ghost;
      }));
      root.append(mirror);
    }

    const current = () => links.find((link) => link.getAttribute('aria-current') === 'page');

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const padding = () => parseFloat(getComputedStyle(root).paddingRight) || 0;
    // When the links scroll, the highlight spans all of them (read from the last link, not
    // scrollWidth, which a highlight still at its old width would inflate); otherwise the pill
    const span = () => {
      const last = links[links.length - 1];
      const end = last.offsetLeft + last.offsetWidth + padding();
      return end > root.clientWidth + 1 ? end : 0;
    };
    const move = (link) => {
      if (!link) {
        root.style.setProperty('--kz-hl-on', 0);
        return;
      }
      const scrolling = span();
      const width = scrolling || root.clientWidth;
      if (scrolling) root.style.setProperty('--kz-hl-w', `${width}px`);
      else root.style.removeProperty('--kz-hl-w');
      root.style.setProperty('--kz-hl-l', `${link.offsetLeft}px`);
      root.style.setProperty('--kz-hl-r', `${width - link.offsetLeft - link.offsetWidth}px`);
      root.style.setProperty('--kz-hl-on', 1);
    };
    const rest = () => move(current());

    // A link reached by the keyboard scrolls fully into the pill (the browser stops at half)
    const reveal = (link) => {
      const left = link.offsetLeft - padding();
      const right = link.offsetLeft + link.offsetWidth + padding() - root.clientWidth;
      const behavior = reduceMotion ? 'auto' : 'smooth';
      if (root.scrollLeft > left) root.scrollTo({ left, behavior });
      else if (root.scrollLeft < right) root.scrollTo({ left: right, behavior });
    };

    links.forEach((link) => {
      link.addEventListener('pointerenter', () => move(link), { signal });
      link.addEventListener('focus', () => {
        move(link);
        reveal(link);
      }, { signal });
      // On a one-page site (#anchors), the clicked link becomes the current one
      link.addEventListener('click', () => {
        if (!link.getAttribute('href')?.startsWith('#')) return;
        links.forEach((other) => other.toggleAttribute('aria-current', other === link));
        link.setAttribute('aria-current', 'page');
      }, { signal });
    });
    root.addEventListener('pointerleave', rest, { signal });
    root.addEventListener('focusout', (event) => {
      if (!root.contains(event.relatedTarget)) rest();
    }, { signal });

    rest();
    // Its first place is computed now, before is-ready turns the slide on: it must not slide in
    void getComputedStyle(highlight).clipPath;
    // Links scrolling in a narrow pill: the current page starts in view
    const here = current();
    if (here && root.scrollWidth > root.clientWidth) root.scrollLeft = here.offsetLeft + here.offsetWidth / 2 - root.clientWidth / 2;
    const observer = new ResizeObserver(() => move(links.find((link) => link.matches(':hover, :focus')) || current()));
    observer.observe(root);
    signal.addEventListener('abort', () => observer.disconnect());
    document.fonts?.ready.then(() => !signal.aborted && rest());
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
