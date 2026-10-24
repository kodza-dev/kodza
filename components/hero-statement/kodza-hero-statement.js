// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Hero Statement
// Puts each word of the title in its own mask for the cascade, and keeps the studio's local
// time ticking (the digits roll when the minute changes).
(() => {
  const SELECTOR = '.kodza-hero-statement';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // The words of the title, each in its own mask and numbered for the cascade. Text nodes are
  // split in place, so the spans around them (the muted part) stay. The heading keeps its
  // sentence as its accessible name
  const split = (title) => {
    title.setAttribute('aria-label', title.textContent.replace(/\s+/g, ' ').trim());
    const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
    const texts = [];
    while (walker.nextNode()) texts.push(walker.currentNode);
    let i = 0;
    texts.forEach((node) => {
      const fragment = document.createDocumentFragment();
      node.data.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) return fragment.append(part);
        const word = document.createElement('span');
        const rise = document.createElement('span');
        word.className = 'kodza-hero-statement__word';
        rise.className = 'kodza-hero-statement__rise';
        rise.style.setProperty('--i', i++);
        rise.textContent = part;
        word.append(rise);
        fragment.append(word);
      });
      node.replaceWith(fragment);
    });
  };

  // A new value in a pair of digits: the old one leaves upwards, the new one comes from below
  const roll = (slot, text, instant) => {
    const old = slot.lastElementChild;
    if (old?.textContent === text) return;
    const next = document.createElement('span');
    next.textContent = text;
    slot.append(next);
    if (!old) return;
    if (instant || reduceMotion) return old.remove();
    const timing = { duration: 600, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
    old.animate([{ transform: 'none' }, { transform: 'translateY(-100%)' }], timing).finished.then(() => old.remove(), () => old.remove());
    next.animate([{ transform: 'translateY(100%)' }, { transform: 'none' }], timing);
  };

  // The time where the studio is (data-timezone, an IANA name such as Europe/Paris; the
  // visitor's own time when it is missing or unknown)
  const clockFormat = (zone) => {
    const options = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
    try {
      return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: zone || undefined });
    } catch {
      return new Intl.DateTimeFormat('en-GB', options);
    }
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const title = root.querySelector('.kodza-hero-statement__title');
    if (title) split(title);

    const clock = root.querySelector('.kodza-hero-statement__clock');
    if (!clock) return;
    const [hours, minutes] = clock.querySelectorAll('.kodza-hero-statement__digits');
    if (!hours || !minutes) return;
    const format = clockFormat(clock.dataset.timezone);
    let shown = '';
    const update = (instant) => {
      const parts = Object.fromEntries(format.formatToParts(new Date()).map((p) => [p.type, p.value]));
      const now = `${parts.hour}:${parts.minute}`;
      if (now === shown) return;
      shown = now;
      clock.dateTime = now;
      roll(hours, parts.hour, instant);
      roll(minutes, parts.minute, instant);
    };
    update(true);
    // Checked every second, written only when the minute changes
    const timer = setInterval(update, 1000);
    signal.addEventListener('abort', () => clearInterval(timer));
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
