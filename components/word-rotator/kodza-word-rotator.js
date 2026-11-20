// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Word Rotator
// Turns the words into a rotating slot: each letter rolls like a reel, the old one going up as
// the new one comes up behind it, masked by the line; the word turns over like a block with
// --flip, or with --morph the letters the two words share glide to their new place while the
// others roll. The slot eases to the new word's width, and the cycle
// pauses while the sentence is out of view or the tab hidden. With reduced motion, the first
// word simply stays. Screen readers get the words once, as a list. Settings: the constants
// below, data-interval on the root and the --kz-rotator-* variables of the CSS.
(() => {
  const SELECTOR = '.kodza-rotator';
  const INTERVAL = 2400; // ms a word stays, without data-interval: reading time, the pace leaves it
  const WIDTH = 700; // ms for the slot to reach the new width (and, with --morph, for a shared letter to glide)
  const ROLL = 680; // ms for a letter to roll: the old one goes up as the new one comes up behind it
  const STAGGER = 26; // ms between two letters
  const TRAVEL = '118%'; // how far a letter rolls, a little more than its height: the two never overlap
  const FLIP = 760; // ms for the word to turn over, with --flip
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  // One curve for the letter that leaves and the one that arrives: they move as one reel
  const roll = 'cubic-bezier(0.65, 0, 0.35, 1)';

  // The letters two words share, in order (longest common subsequence): pairs [old, new] of
  // indexes. Kept in order, the gliding letters never cross; matched from the end, a shared
  // ending ("-ing") glides as one piece instead of coming apart
  const shared = (a, b) => {
    const table = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        table[i][j] = a[i - 1] === b[j - 1] ? table[i - 1][j - 1] + 1 : Math.max(table[i - 1][j], table[i][j - 1]);
      }
    }
    const pairs = [];
    for (let i = a.length, j = b.length; i > 0 && j > 0;) {
      if (a[i - 1] === b[j - 1]) pairs.push([--i, --j]);
      else if (table[i - 1][j] >= table[i][j - 1]) i--;
      else j--;
    }
    return pairs;
  };

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const pace = paceOf(root);
    const slot = root.querySelector('.kodza-rotator__words');
    if (!slot) return;
    const words = [...slot.children].map((el) => el.textContent);
    if (words.length < 2) return;
    const flip = root.classList.contains('kodza-rotator--flip');
    const morph = root.classList.contains('kodza-rotator--morph');
    const interval = parseInt(root.dataset.interval, 10) || INTERVAL;
    let index = 0;
    let timer = 0;
    let visible = true;

    const sr = Object.assign(document.createElement('span'), { className: 'kodza-rotator__sr', textContent: words.join(', ') });
    slot.after(sr);
    slot.setAttribute('aria-hidden', 'true');

    const make = (text) => {
      const word = Object.assign(document.createElement('span'), { className: 'kodza-rotator__word' });
      word.append(...[...text].map((char) => Object.assign(document.createElement('span'), { textContent: char })));
      return word;
    };
    slot.replaceChildren(make(words[0]));

    // The k-th leaving letter and the k-th arriving one start together, on the same curve
    const out = (chars) => Promise.all(chars.map((char, k) => char.animate([{ transform: 'none' }, { transform: `translateY(-${TRAVEL})` }], { duration: ROLL * pace, delay: k * STAGGER * pace, easing: roll, fill: 'forwards' }).finished));
    const up = (chars) => chars.forEach((char, k) => char.animate([{ transform: `translateY(${TRAVEL})` }, { transform: 'none' }], { duration: ROLL * pace, delay: k * STAGGER * pace, easing: roll, fill: 'backwards' }));

    const next = () => {
      const old = slot.lastElementChild;
      index = (index + 1) % words.length;
      const word = make(words[index]);
      const from = slot.offsetWidth;
      slot.append(word);
      // The slot eases to the new word's width; the old one, in the same cell, is cut by it
      const pad = slot.offsetWidth - Math.max(old.offsetWidth, word.offsetWidth);
      const to = word.offsetWidth + pad;
      // With --morph the slot keeps pace with the gliding letters, so a shrinking slot never cuts them
      slot.animate([{ width: `${from}px` }, { width: `${to}px` }], { duration: WIDTH * pace, easing: morph ? roll : ease });
      if (morph) {
        // Measured in the slot's own pixels: a parent scaled by transform must not shift them
        const box = slot.getBoundingClientRect();
        const scale = box.width / slot.offsetWidth || 1;
        const leftOf = (char) => (char.getBoundingClientRect().left - box.left) / scale;
        const olds = [...old.children];
        const news = [...word.children];
        const pairs = shared(olds.map((char) => char.textContent), news.map((char) => char.textContent));
        const kept = new Set(pairs.map(([i]) => i));
        const found = new Set(pairs.map(([, j]) => j));
        pairs.forEach(([i, j]) => {
          const shift = leftOf(olds[i]) - leftOf(news[j]);
          olds[i].style.visibility = 'hidden';
          // On the reel's curve: a shared letter reaches its place as the others finish rolling, no gap opens
          news[j].animate([{ transform: `translateX(${shift}px)` }, { transform: 'none' }], { duration: WIDTH * pace, easing: roll });
        });
        out(olds.filter((char, i) => !kept.has(i))).then(() => old.remove());
        up(news.filter((char, j) => !found.has(j)));
      } else if (flip) {
        // Two faces of one block turning on its axis: the new word is the face that comes up
        old.animate([{ transform: 'none' }, { transform: 'rotateX(90deg)' }], { duration: FLIP * pace, easing: roll, fill: 'forwards' }).finished.then(() => old.remove());
        word.animate([{ transform: 'rotateX(-90deg)' }, { transform: 'none' }], { duration: FLIP * pace, easing: roll });
      } else {
        out([...old.children]).then(() => old.remove());
        up([...word.children]);
      }
    };

    const loop = () => {
      clearTimeout(timer);
      if (!visible || document.hidden) return;
      timer = setTimeout(() => {
        next();
        loop();
      }, interval);
    };

    if (!reduceMotion && pace) {
      const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        loop();
      });
      observer.observe(root);
      signal.addEventListener('abort', () => {
        observer.disconnect();
        clearTimeout(timer);
      });
      document.addEventListener('visibilitychange', loop, { signal });
    }
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
