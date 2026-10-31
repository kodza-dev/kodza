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
