// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Team Grid
// Counts the people of each group and the total, and writes them, so the numbers stay right when a
// WordPress loop fills the grid; writes the initials of the name in a frame with no portrait, or
// with one that does not load; loads the second pictures before the grid reaches the screen. The
// rest is CSS: the second picture, the rolling role, the bio.
// Settings: the --kz-team-grid-* variables (component.css); data-reveal="bio" on the section;
// data-text-count and data-text-one on the section for the words the script writes; WARM_MARGIN.
(() => {
  const SELECTOR = '[data-kodza-team-grid]';
  // The words the script writes, each one replaced by its data-text-* attribute on the section
  const WORDS = {
    count: '{count} people', // the total, beside the eyebrow
    one: '1 person',
  };
  // How far before the screen the second pictures load. Hidden behind their curtain, a lazy picture
  // is never fetched by the browser until the hover opens it, and then it shows up at the end
  const WARM_MARGIN = '600px 0px';

  // The initials of a name: the first letter of its first and last words ("Jean-Luc Ndiaye" → JN)
  const initialsOf = (name) => {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return '';
    const first = [...words[0]][0] || '';
    const last = words.length > 1 ? [...words[words.length - 1]][0] || '' : '';
    return (first + last).toLocaleUpperCase();
  };

  // One instance: it counts and writes the initials once, when it starts (kodza:destroy puts the
  // markup back as written). A portrait that fails later still falls back to the initials, through
  // a listener tied to `signal`.
  function mount(root, signal) {
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const peopleIn = (scope) => scope.querySelectorAll('.kodza-team-grid__person').length;

    root.querySelectorAll('.kodza-team-grid__group').forEach((group) => {
      const count = group.querySelector('.kodza-team-grid__count');
      if (count) count.textContent = String(peopleIn(group));
    });

    const total = root.querySelector('.kodza-team-grid__total');
    const n = peopleIn(root);
    if (total) total.textContent = n === 1 ? word('one') : word('count').replace('{count}', n);

    root.querySelectorAll('.kodza-team-grid__person').forEach((person) => {
      const media = person.querySelector('.kodza-team-grid__media');
      const name = person.querySelector('.kodza-team-grid__name');
      if (!media || !name) return;
      const photo = media.querySelector('.kodza-team-grid__photo');
      const writeInitials = () => {
        if (media.querySelector('.kodza-team-grid__initials')) return;
        const initials = document.createElement('span');
        initials.className = 'kodza-team-grid__initials';
        initials.setAttribute('aria-hidden', 'true');
        initials.textContent = initialsOf(name.textContent);
        media.append(initials);
      };
      const broken = () => {
        photo.classList.add('is-broken');
        media.querySelector('.kodza-team-grid__work')?.classList.add('is-broken');
        writeInitials();
      };
      if (!photo) return writeInitials();
      if (photo.complete && photo.currentSrc && !photo.naturalWidth) return broken();
      photo.addEventListener('error', broken, { signal, once: true });
    });

    // The second pictures, loaded and decoded once the grid nears the screen, where a hover can open
    // them (a pointer that hovers), or at the first keyboard focus inside the grid
    const works = [...root.querySelectorAll('.kodza-team-grid__work')];
    if (!works.length) return;
    let warmed = false;
    const warm = () => {
      if (warmed) return;
      warmed = true;
      io?.disconnect();
      works.forEach((img) => {
        img.loading = 'eager';
        const decode = () => img.decode?.().catch(() => {});
        if (img.complete) decode();
        else img.addEventListener('load', decode, { signal, once: true });
      });
    };
    const io = matchMedia('(hover: hover)').matches && 'IntersectionObserver' in window
      ? new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && warm(), { rootMargin: WARM_MARGIN })
      : null;
    io?.observe(root);
    root.addEventListener('focusin', warm, { signal, once: true });
    signal.addEventListener('abort', () => io?.disconnect(), { once: true });
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
