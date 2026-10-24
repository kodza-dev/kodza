// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Badge
// Rolls a count to its new number when data-count changes, and removes tags: the tag shrinks
// away from its place while its neighbours glide to theirs (measured before and after, in the
// list's own pixels). A removed tag sends "kodza:badge-remove"; focus goes to the next one.
(() => {
  const SELECTOR = '.kodza-badge__count, .kodza-badge-list';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';

  // A count: rolls to its new number
  function mountCount(count, signal) {
    let current = count.dataset.count || count.textContent.trim();
    count.replaceChildren(Object.assign(document.createElement('span'), { textContent: current }));
    const observer = new MutationObserver(() => {
      const next = count.dataset.count;
      if (next === current) return;
      const up = parseFloat(next) >= parseFloat(current);
      current = next;
      const old = count.lastElementChild;
      const span = Object.assign(document.createElement('span'), { textContent: next });
      count.append(span);
      if (reduceMotion) return old.remove();
      const timing = { duration: 420, easing: ease };
      old.animate([{ transform: 'none' }, { transform: `translateY(${up ? -110 : 110}%)` }], { ...timing, fill: 'forwards' }).finished.then(() => old.remove());
      span.animate([{ transform: `translateY(${up ? 110 : -110}%)` }, { transform: 'none' }], timing);
    });
    observer.observe(count, { attributes: true, attributeFilter: ['data-count'] });
    signal.addEventListener('abort', () => observer.disconnect());
  }

  // A list of tags: removes them
  function mountList(list, signal) {
    list.addEventListener('click', (event) => {
      const button = event.target.closest('.kodza-badge__remove');
      const tag = button?.closest('.kodza-badge');
      if (!tag || tag.classList.contains('is-leaving')) return;
      const tags = [...list.querySelectorAll('.kodza-badge:not(.is-leaving)')];
      const next = tags[tags.indexOf(tag) + 1] || tags[tags.indexOf(tag) - 1];
      const keyboard = button.matches(':focus-visible');
      const done = () => {
        if (signal.aborted) return;
        // Back to a plain tag (while still in the page, where its animations are found), so it
        // can be put back
        tag.getAnimations().forEach((animation) => animation.cancel());
        tag.remove();
        tag.classList.remove('is-leaving');
        Object.assign(tag.style, { position: '', left: '', top: '', margin: '', pointerEvents: '' });
        list.dispatchEvent(new CustomEvent('kodza:badge-remove', { bubbles: true, detail: { tag } }));
      };
      if (keyboard) next?.querySelector('.kodza-badge__remove')?.focus();
      if (reduceMotion) return done();

      // The tag leaves the flow where it stands; the others glide to their new place
      const k = list.getBoundingClientRect().width / list.offsetWidth || 1;
      const others = tags.filter((other) => other !== tag);
      const before = new Map(others.map((other) => [other, other.getBoundingClientRect()]));
      const box = tag.getBoundingClientRect();
      const origin = list.getBoundingClientRect();
      tag.classList.add('is-leaving');
      Object.assign(tag.style, { position: 'absolute', left: `${(box.left - origin.left) / k}px`, top: `${(box.top - origin.top) / k}px`, margin: '0', pointerEvents: 'none' });
      others.forEach((other) => {
        const was = before.get(other);
        const now = other.getBoundingClientRect();
        const dx = (was.left - now.left) / k;
        const dy = (was.top - now.top) / k;
        if (dx || dy) other.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 560, delay: 60, easing: ease, fill: 'backwards' });
      });
      tag.animate([
        { opacity: 1, transform: 'none' },
        { opacity: 0, transform: 'scale(0.6)' },
      ], { duration: 260, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' }).onfinish = done;
    }, { signal });
  }

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    if (root.classList.contains('kodza-badge-list')) mountList(root, signal);
    else mountCount(root, signal);
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
