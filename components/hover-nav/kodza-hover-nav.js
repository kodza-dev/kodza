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
