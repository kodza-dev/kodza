// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Key Points
// Each row plays its entrance once, as it comes into view: its hairline draws across from the
// left, the term (and the name, in columns) rises out of its own box, the sentence comes up
// after it; the title of the head rises line after line. Rows that arrive together follow one
// another. A __figure rolls into place, the digits on the right spinning longer. "kodza:replay"
// plays the rows on screen again, and sets the others waiting to be scrolled to. The timings are
// the constants under SELECTOR.
(() => {
  const SELECTOR = '.kodza-key-points';
  // The entrance, in ms (each one times the site's pace)
  const RULE = 1100; // the hairline drawing across
  const TERM = 900; // the term rising out of its box…
  const TERM_AT = 160; // …once the hairline is on its way
  const TITLE = 1000; // the title, and the name of a point in columns…
  const TITLE_AT = 220; // …a beat after the term
  const TITLE_STEP = 125; // between two lines of the head's title
  const TEXT = 900; // the sentence coming up…
  const TEXT_AT = 320; // …after the name
  const FIGURE_AT = 120; // a __figure starts to roll…
  const ROLL = 1500; // …for this long, its leftmost digit…
  const ROLL_STEP = 160; // …each digit to its right landing a little later
  const STEP = 110; // between rows that come into view together
  const ENTER = '0px 0px -12% 0px'; // a row plays once its top is this far into the screen
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const GLIDE = 'cubic-bezier(0.6, 0, 0.1, 1)'; // slow start, long settle
  const SOFT = 'cubic-bezier(0.25, 1, 0.5, 1)';
  const ROLLING = 'cubic-bezier(0.16, 1, 0.3, 1)';
  // The hairlines are drawn on ::before and ::after: browsers that cannot animate them show them
  const PSEUDO = typeof KeyframeEffect !== 'undefined' && 'pseudoElement' in KeyframeEffect.prototype;
  // Rising out of its own box, no wrapper needed: the box clips what is still below its bottom edge
  // (with room for the descenders and the side bearings)
  const RISE = [
    { transform: 'translateY(calc(100% + 0.2em))', clipPath: 'inset(-0.2em -0.1em 100% -0.1em)' },
    { transform: 'none', clipPath: 'inset(-0.2em -0.1em -0.2em -0.1em)' },
  ];

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const rows = [...root.querySelectorAll('.kodza-key-points__head, .kodza-key-points__item')];

    // A __figure: each digit becomes a window with a strip of digits behind it (screen readers keep
    // the figure as written)
    const strips = new Map(); // row → its strips
    root.querySelectorAll('.kodza-key-points__value').forEach((value) => {
      const text = value.textContent.trim();
      const count = (text.match(/\d/g) || []).length;
      const own = [];
      let rank = 0;
      value.setAttribute('aria-hidden', 'true');
      value.after(Object.assign(document.createElement('span'), { className: 'kodza-key-points__sr', textContent: text }));
      value.replaceChildren(...[...text].map((char) => {
        if (!/\d/.test(char)) return Object.assign(document.createElement('span'), { className: 'kodza-key-points__char', textContent: char });
        // The digits on the right spin more: one turn on the left, up to three on the right
        const turns = 1 + Math.round((rank / Math.max(1, count - 1)) * 2);
        const column = Object.assign(document.createElement('span'), { className: 'kodza-key-points__digit' });
        const fit = Object.assign(document.createElement('span'), { className: 'kodza-key-points__fit', textContent: char });
        const strip = Object.assign(document.createElement('span'), { className: 'kodza-key-points__strip' });
        for (let i = 0; i < (turns + 1) * 10; i++) strip.append(Object.assign(document.createElement('span'), { textContent: i % 10 }));
        column.append(fit, strip);
        own.push({ strip, stop: turns * 10 + Number(char), rank: rank++ });
        return column;
      }));
      const row = value.closest('.kodza-key-points__item');
      if (row) strips.set(row, [...(strips.get(row) || []), ...own]);
    });
    const land = (row) => (strips.get(row) || []).forEach(({ strip, stop }) => (strip.style.transform = `translateY(${-stop * 1.1}em)`));

    if (still) return rows.forEach((row) => {
      row.classList.add('is-shown');
      land(row);
    });

    let running = [];
    const stop = () => {
      running.forEach((a) => a.cancel());
      running = [];
    };
    // The entrance of one row, `at` ms after the first row of its batch, at the site's pace
    const play = (row, at) => {
      const animate = (el, keyframes, options) => {
        if (el) running.push(el.animate(keyframes, { easing: GLIDE, fill: 'backwards', ...options, duration: options.duration * pace, delay: (at + (options.delay || 0)) * pace }));
      };
      const q = (s) => row.querySelector(`:scope > ${s}`);
      row.classList.add('is-shown');
      if (PSEUDO && row.matches('.kodza-key-points__item')) {
        animate(row, [{ transform: 'scaleX(0)' }, { transform: 'none' }], { duration: RULE, pseudoElement: '::before' });
        if (getComputedStyle(row, '::after').content !== 'none') animate(row, [{ transform: 'scaleX(0)' }, { transform: 'none' }], { duration: RULE, delay: STEP, pseudoElement: '::after' });
      }
      const title = q('.kodza-key-points__title');
      // The title, line after line, each out of its own mask (written as lines); a title written in
      // one piece rises in one piece
      const lines = [...(title?.querySelectorAll(':scope > .kodza-key-points__line > .kodza-key-points__rise') || [])];
      if (lines.length) lines.forEach((line, i) => animate(line, [{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration: TITLE, delay: i * TITLE_STEP }));
      else animate(title, RISE, { duration: TITLE });
      animate(q('.kodza-key-points__term'), RISE, { duration: TERM, delay: TERM_AT });
      animate(q('.kodza-key-points__heading'), RISE, { duration: TITLE, delay: TITLE_AT });
      animate(q('.kodza-key-points__text'), [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: TEXT, delay: TEXT_AT, easing: SOFT });
      const figure = q('.kodza-key-points__figure');
      if (!figure) return;
      animate(figure, [{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: FIGURE_AT, easing: SOFT });
      (strips.get(row) || []).forEach(({ strip, stop: end, rank }) => {
        strip.style.transform = '';
        animate(strip, [{ transform: 'translateY(0)' }, { transform: `translateY(${-end * 1.1}em)` }], { duration: ROLL + rank * ROLL_STEP, delay: FIGURE_AT, easing: ROLLING, fill: 'both' });
      });
    };

    // The rows that come into view together play one after the other, in the order of the page
    const io = new IntersectionObserver((entries) => {
      entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target)
        .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
        .forEach((row, k) => {
          io.unobserve(row);
          play(row, k * STEP);
        });
    }, { rootMargin: ENTER });
    const watch = () => rows.forEach((row) => io.observe(row));
    signal.addEventListener('abort', () => {
      io.disconnect();
      stop();
    });
    // Replayed: the rows on screen play again now, the others wait to be scrolled to
    root.addEventListener('kodza:replay', () => {
      io.disconnect();
      stop();
      rows.forEach((row) => row.classList.remove('is-shown'));
      watch();
    }, { signal });
    Promise.resolve(document.fonts?.ready).then(() => {
      if (!signal.aborted) watch();
    });
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
