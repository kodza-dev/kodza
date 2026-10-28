// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Table of Contents
// Builds the list from the headings of the article next to it (data-target, or the nearest
// article / main / .entry-content), gives them ids if they have none, and follows the reading:
// current section, progress ring and percentage, time left, "Back to top". The head folds the
// list away (folded from the start on small screens, where the head names the current section).
(() => {
  const SELECTOR = '.kodza-toc';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = window.matchMedia('(max-width: 900px)');
  const slug = (text) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
  const WORDS_PER_MINUTE = 220;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const list = root.querySelector('.kodza-toc__list');
    const head = root.querySelector('.kodza-toc__head');
    const current = root.querySelector('.kodza-toc__current');
    const percent = root.querySelector('.kodza-toc__percent');
    const left = root.querySelector('.kodza-toc__left');
    const top = root.querySelector('.kodza-toc__top');
    const selector = root.dataset.target || 'article, main, .entry-content';
    // The closest article around (or beside) the summary
    let scope = root.parentElement;
    while (scope && !scope.querySelector(selector)) scope = scope.parentElement;
    const article = scope?.querySelector(selector);
    if (!list || !article) return;
    const headings = [...article.querySelectorAll(root.dataset.headings || 'h2, h3')];
    if (!headings.length) return;
    const minutes = Math.max(1, Math.round(article.textContent.trim().split(/\s+/).length / WORDS_PER_MINUTE));
    const offset = () => parseFloat(getComputedStyle(root).getPropertyValue('--kz-toc-offset')) || 0;
    const goTo = (y) => window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });

    let number = 0;
    const named = []; // the headings given an id here, which lose it again on abort
    const links = headings.map((heading) => {
      if (!heading.id) {
        let id = slug(heading.textContent);
        for (let n = 2; document.getElementById(id); n++) id = `${slug(heading.textContent)}-${n}`;
        heading.id = id;
        named.push(heading);
      }
      const sub = heading.tagName === 'H3';
      const item = document.createElement('li');
      item.className = `kodza-toc__item${sub ? ' kodza-toc__item--sub' : ''}`;
      const link = document.createElement('a');
      link.className = 'kodza-toc__link';
      link.href = `#${heading.id}`;
      if (!sub) {
        const num = document.createElement('span');
        num.className = 'kodza-toc__num';
        num.setAttribute('aria-hidden', 'true');
        num.textContent = String(++number).padStart(2, '0');
        link.append(num);
      }
      link.append(heading.textContent);
      link.addEventListener('click', (event) => {
        event.preventDefault();
        goTo(heading.getBoundingClientRect().top + window.scrollY - offset());
        history.replaceState(null, '', `#${heading.id}`);
        if (small.matches) fold(true);
      }, { signal });
      item.append(link);
      return link;
    });
    signal.addEventListener('abort', () => named.forEach((heading) => heading.removeAttribute('id')));

    const fill = document.createElement('span');
    const marker = document.createElement('span');
    fill.className = 'kodza-toc__fill';
    marker.className = 'kodza-toc__marker';
    fill.setAttribute('aria-hidden', 'true');
    marker.setAttribute('aria-hidden', 'true');
    list.replaceChildren(fill, marker, ...links.map((link) => link.parentElement));

    const fold = (on) => {
      root.classList.toggle('is-folded', on);
      head?.setAttribute('aria-expanded', String(!on));
    };
    head?.addEventListener('click', () => fold(!root.classList.contains('is-folded')), { signal });
    top?.addEventListener('click', () => goTo(article.getBoundingClientRect().top + window.scrollY - offset()), { signal });

    let active = -2;
    const update = () => {
      // The section being read: the last heading above the top third of the screen
      const line = innerHeight * 0.3;
      let index = -1;
      headings.forEach((heading, i) => {
        if (heading.getBoundingClientRect().top <= line) index = i;
      });
      const box = article.getBoundingClientRect();
      const read = Math.min(1, Math.max(0, (line - box.top) / Math.max(1, box.height - innerHeight * 0.5)));
      root.style.setProperty('--kz-toc-read', read.toFixed(4));
      if (percent) percent.textContent = `${Math.round(read * 100)}%`;
      if (left) left.textContent = read > 0.98 ? 'All read' : `${Math.max(1, Math.ceil(minutes * (1 - read)))} min left`;
      root.classList.toggle('is-in', read > 0.08);
      if (index === active) return;
      active = index;
      links.forEach((link, i) => link.setAttribute('aria-current', String(i === index)));
      const link = links[index];
      if (current) current.textContent = link ? link.lastChild.textContent : '';
      root.style.setProperty('--kz-toc-on', link ? 1 : 0);
      if (link) {
        root.style.setProperty('--kz-toc-y', `${link.parentElement.offsetTop}px`);
        root.style.setProperty('--kz-toc-h', link.parentElement.offsetHeight);
      }
    };

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (signal.aborted) return;
        ticking = false;
        update();
      });
    }, { passive: true, signal });
    window.addEventListener('resize', () => {
      active = -2;
      update();
    }, { signal });
    small.addEventListener?.('change', (event) => fold(event.matches), { signal });

    fold(small.matches);
    update();
    requestAnimationFrame(() => !signal.aborted && root.classList.add('is-live'));
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
