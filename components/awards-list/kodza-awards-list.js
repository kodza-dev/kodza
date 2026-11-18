// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Awards List
// Counts each group (a row that says "×2" counts twice) and the whole section, folds a group's
// rows past data-show behind "Show 2 more" (the list eases open and the rows rise from their
// masks, "Show less" folds them back), and raises the rows of a group from their masks when it
// comes into view. Without the script every row is there, with the counts as written.
// Settings: the --kz-awards-list-* variables in the CSS, data-show and data-text-* on the
// section, the constants below.
(() => {
  const SELECTOR = '.kodza-awards-list';

  // Timings, in milliseconds (times the site's pace)
  const RISE = 700; // a row rising from its mask
  const STAGGER = 70; // between two rows
  const OPEN = 600; // a group easing open, or shut
  const SHUT = 320; // the folded rows sinking back
  const ROLL = 420; // the button's words rolling
  const SEEN = '0px 0px -12% 0px'; // a group rises once it is this far into the screen

  // What the script writes, in English unless the section says otherwise (data-text-<key>)
  const WORDS = {
    more: 'Show {n} more', // under a folded group
    less: 'Show less', // under an open one
    total: '{n} mentions', // the section's total
    one: '1 mention',
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const big = 'cubic-bezier(0.65, 0, 0.35, 1)';

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const ms = (t) => (still ? 0 : t * pace);
    const word = (key, n) => (root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key]).replace('{n}', n);
    const show = Number.parseInt(root.dataset.show, 10);
    const groups = [...root.querySelectorAll('.kodza-awards-list__group')];
    const itemsOf = (group) => [...group.querySelectorAll('.kodza-awards-list__item')];
    const times = (item) => Number.parseInt((item.querySelector('.kodza-awards-list__times')?.textContent || '').replace(/\D/g, ''), 10) || 1;

    // ---------- The counts ----------
    let sum = 0;
    groups.forEach((group) => {
      const n = itemsOf(group).reduce((all, item) => all + times(item), 0);
      sum += n;
      const count = group.querySelector('.kodza-awards-list__count');
      if (count) count.textContent = n;
    });
    const total = root.querySelector('.kodza-awards-list__total');
    if (total) total.textContent = sum === 1 ? word('one', 1) : word('total', sum);

    // A row rises from its mask; `wait` rows were held below until now
    const rise = (items, delay = 0) =>
      items.map((item, i) => {
        item.classList.add('is-masked');
        item.classList.remove('is-waiting');
        const entry = item.firstElementChild;
        const done = () => item.classList.remove('is-masked');
        if (!entry || still) return done();
        const animation = entry.animate([{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration: ms(RISE), delay: ms(delay + i * STAGGER), easing: ease, fill: 'backwards' });
        animation.finished.then(done, done);
        return animation;
      });

    // ---------- Folding a group past data-show ----------
    const folds = [];
    if (show > 0) {
      groups.forEach((group) => {
        const list = group.querySelector('.kodza-awards-list__entries');
        const items = itemsOf(group);
        const rest = items.slice(show);
        if (!list || !rest.length) return;
        rest.forEach((item) => (item.hidden = true));
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'kodza-awards-list__more';
        button.setAttribute('aria-expanded', 'false');
        const plus = Object.assign(document.createElement('span'), { className: 'kodza-awards-list__plus' });
        plus.setAttribute('aria-hidden', 'true');
        const words = Object.assign(document.createElement('span'), { className: 'kodza-awards-list__more-word' });
        words.append(Object.assign(document.createElement('span'), { textContent: word('more', rest.length) }));
        button.append(plus, words);
        list.after(button);
        folds.push(button);

        // The old words go up, the new ones come from below
        const say = (text) => {
          const prev = words.lastElementChild;
          const next = Object.assign(document.createElement('span'), { textContent: text });
          words.append(next);
          if (still) return prev.remove();
          const timing = { duration: ms(ROLL), easing: ease };
          prev.animate([{ transform: 'none' }, { transform: 'translateY(-110%)' }], { ...timing, fill: 'forwards' }).finished.then(() => prev.remove(), () => prev.remove());
          next.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], timing);
        };
        let running = [];
        const toggle = () => {
          const open = button.getAttribute('aria-expanded') !== 'true';
          running.forEach((animation) => animation.finish());
          running = [];
          // The list is the mask of its own height while it moves
          list.classList.add('is-moving');
          const settle = (animation) => animation.finished.then(() => !running.some((a) => a.playState === 'running') && list.classList.remove('is-moving'), () => {});
          button.setAttribute('aria-expanded', String(open));
          say(open ? word('less') : word('more', rest.length));
          const from = list.offsetHeight;
          if (open) {
            rest.forEach((item) => (item.hidden = false));
            const to = list.offsetHeight;
            if (still) return list.classList.remove('is-moving');
            running = [list.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: ms(OPEN), easing: big }), ...rise(rest, 60).filter(Boolean)];
            running.forEach(settle);
            return;
          }
          // Shutting: the focus never stays in a row that goes
          if (rest.some((item) => item.contains(document.activeElement))) button.focus();
          const close = () => rest.forEach((item) => (item.hidden = true));
          if (still) {
            list.classList.remove('is-moving');
            return close();
          }
          rest.forEach((item) => item.classList.add('is-masked'));
          const sink = rest.map((item) => item.firstElementChild?.animate([{ transform: 'none' }, { transform: 'translateY(105%)' }], { duration: ms(SHUT), easing: 'cubic-bezier(0.55, 0, 1, 0.45)', fill: 'forwards' })).filter(Boolean);
          close();
          const to = list.offsetHeight;
          rest.forEach((item) => (item.hidden = false));
          const height = list.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: ms(OPEN), easing: big, fill: 'forwards' });
          running = [...sink, height];
          height.finished.then(() => {
            close();
            sink.forEach((animation) => animation.cancel());
            height.cancel();
            rest.forEach((item) => item.classList.remove('is-masked'));
            list.classList.remove('is-moving');
          }, () => {});
        };
        button.addEventListener('click', toggle, { signal });
        signal.addEventListener('abort', () => running.forEach((animation) => animation.cancel()));
      });
    }

    // ---------- Each group rises when it comes into view ----------
    if (still || !('IntersectionObserver' in window)) return;
    const below = groups.filter((group) => group.getBoundingClientRect().top > window.innerHeight);
    if (!below.length) return;
    below.forEach((group) => {
      group.querySelector('.kodza-awards-list__label')?.classList.add('is-masked', 'is-waiting');
      itemsOf(group).filter((item) => !item.hidden).forEach((item) => item.classList.add('is-waiting'));
    });
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        const label = entry.target.querySelector('.kodza-awards-list__label');
        if (label) {
          label.classList.remove('is-waiting');
          const done = () => label.classList.remove('is-masked');
          const animations = [...label.children].map((child) => child.animate([{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration: ms(RISE), easing: ease, fill: 'backwards' }));
          Promise.all(animations.map((a) => a.finished)).then(done, done);
        }
        rise(itemsOf(entry.target).filter((item) => item.classList.contains('is-waiting')), 80);
      });
    }, { rootMargin: SEEN });
    below.forEach((group) => observer.observe(group));
    signal.addEventListener('abort', () => observer.disconnect());
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
