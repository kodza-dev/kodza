// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Infinite Scroll
// Watches the end of the list: placeholders first, then the next posts (from the <template>,
// or from root.kodzaLoad, an async function returning <li> elements, empty when there is no
// more). After data-auto automatic loads, the "Load more" button takes over. The count rolls,
// and the end of the list says so. Fires "kodza:loaded" with { shown } on the section.
(() => {
  const SELECTOR = '.kodza-feed';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // A word or a number rolls to its new value inside its little window
  const roll = (box, text) => {
    const prev = box.lastElementChild;
    if (prev && prev.textContent === String(text)) return;
    const span = document.createElement('span');
    span.textContent = text;
    box.append(span);
    if (!prev) return;
    if (reduceMotion) return prev.remove();
    const timing = { duration: 450, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
    prev.animate([{ transform: 'none' }, { transform: 'translateY(-110%)' }], { ...timing, fill: 'forwards' }).finished.then(() => prev.remove());
    span.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], timing);
  };

  const ghost = () => {
    const li = document.createElement('li');
    li.className = 'kodza-feed__item';
    li.innerHTML = '<span class="kodza-feed__ghost" aria-hidden="true"><span class="kodza-feed__ghost-media"></span><span class="kodza-feed__ghost-lines"><span></span><span></span><span></span></span></span>';
    return li;
  };

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const list = root.querySelector('.kodza-feed__list');
    const template = root.querySelector('.kodza-feed__more');
    const button = root.querySelector('.kodza-feed__button');
    const count = root.querySelector('.kodza-feed__count');
    const total = root.querySelector('.kodza-feed__total');
    if (!list) return;
    const batch = Number(root.dataset.batch) || 3;
    const delay = Number(root.dataset.delay) || 0;
    let autoLeft = root.dataset.auto !== undefined ? Number(root.dataset.auto) : 2;
    const pending = template ? [...template.content.children] : [];
    let shown = list.children.length;
    let loading = false;
    let done = false;

    if (total && template) total.textContent = shown + pending.length;
    if (count) count.replaceChildren(Object.assign(document.createElement('span'), { textContent: shown }));
    const label = document.createElement('span');
    label.className = 'kodza-feed__roll';
    if (button) {
      label.append(Object.assign(document.createElement('span'), { textContent: button.textContent.trim() }));
      button.replaceChildren(label);
      // The button keeps the width of its longest word
      button.style.minWidth = `${button.offsetWidth + 24}px`;
    }
    const idle = label.textContent;

    const finish = () => {
      done = true;
      root.classList.remove('is-manual');
      root.classList.add('is-done');
    };

    const load = async () => {
      if (loading || done) return;
      loading = true;
      root.setAttribute('aria-busy', 'true');
      if (button) {
        button.disabled = true;
        roll(label, 'Loading');
      }
      const ghosts = Array.from({ length: root.kodzaLoad ? batch : Math.min(batch, pending.length) }, ghost);
      list.append(...ghosts);
      const items = root.kodzaLoad ? await root.kodzaLoad() : (await wait(reduceMotion ? 0 : delay), pending.splice(0, batch));
      if (signal.aborted) return;
      ghosts.forEach((li, i) => {
        const item = items[i];
        if (!item) return li.remove();
        const link = item.querySelector?.('.kodza-feed__link') || item;
        li.append(link);
        li.style.setProperty('--i', i);
        li.classList.add('is-arriving');
        setTimeout(() => {
          li.querySelector('.kodza-feed__ghost')?.remove();
          li.classList.remove('is-arriving');
        }, 1300 + i * 90);
      });
      shown += Math.min(items.length, ghosts.length);
      if (count) roll(count, shown);
      root.removeAttribute('aria-busy');
      loading = false;
      if (button) {
        button.disabled = false;
        roll(label, idle);
      }
      root.dispatchEvent(new CustomEvent('kodza:loaded', { detail: { shown }, bubbles: true }));
      if ((!root.kodzaLoad && !pending.length) || !items.length) return finish();
      if (autoLeft <= 0) root.classList.add('is-manual');
      // Still at the end of the list after loading? Keep going while automatic loads remain
      else requestAnimationFrame(() => !signal.aborted && sentinel.getBoundingClientRect().top < innerHeight + 240 && auto());
    };

    const auto = () => {
      if (autoLeft <= 0 || loading || done) return;
      autoLeft -= 1;
      load();
    };

    const sentinel = document.createElement('span');
    sentinel.className = 'kodza-feed__sentinel';
    sentinel.setAttribute('aria-hidden', 'true');
    list.after(sentinel);
    if (autoLeft > 0 && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && auto(), { rootMargin: '0px 0px 240px 0px' });
      observer.observe(sentinel);
      signal.addEventListener('abort', () => observer.disconnect());
    } else {
      autoLeft = 0;
      if (pending.length || root.kodzaLoad) root.classList.add('is-manual');
    }
    if (!pending.length && !root.kodzaLoad) finish();
    button?.addEventListener('click', load, { signal });
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
