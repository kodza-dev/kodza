// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Typewriter
// Types each phrase of data-words, waits, then moves to the next one in the chosen
// data-mode. Screen readers get all the phrases once, as plain text. It pauses while
// off screen, and shows the first phrase without moving for reduced motion.
(() => {
  const SELECTOR = '.kodza-typewriter';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Common start and end of two phrases (by character)
  // What two phrases share at the start and at the end, in whole words: the word that changes
  // is retyped entirely (every → my, not ever → m, which left the caret inside the word)
  const isWord = (char) => char !== undefined && /\S/.test(char);
  function overlap(a, b) {
    let start = 0;
    while (start < a.length && start < b.length && a[start] === b[start]) start++;
    while (start > 0 && isWord(a[start - 1]) && (isWord(a[start]) || isWord(b[start]))) start--;
    let end = 0;
    while (end < a.length - start && end < b.length - start && a[a.length - 1 - end] === b[b.length - 1 - end]) end++;
    while (end > 0 && isWord(a[a.length - end]) && (isWord(a[a.length - end - 1]) || isWord(b[b.length - end - 1]))) end--;
    return { start, end };
  }

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    let words;
    try {
      words = JSON.parse(root.dataset.words || '[]');
    } catch {
      words = [];
    }
    if (!words.length) words = [root.textContent.trim()];
    const mode = root.dataset.mode || 'loop';
    const speed = Number(root.dataset.speed) || 70; // ms per character
    const hold = Number(root.dataset.hold) || 1800;

    const sr = document.createElement('span');
    sr.className = 'kodza-typewriter__sr';
    sr.textContent = words.join(' ');
    const visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    const before = document.createElement('span');
    const selected = document.createElement('span');
    const after = document.createElement('span');
    before.className = selected.className = after.className = 'kodza-typewriter__text';
    selected.classList.add('kodza-typewriter__selected');
    const caret = document.createElement('span');
    caret.className = 'kodza-typewriter__caret';
    visual.append(before, selected, caret, after);
    root.replaceChildren(sr, visual);
    root.classList.add('is-ready');

    const show = (head, sel = '', tail = '') => {
      before.textContent = head;
      selected.textContent = sel;
      after.textContent = tail;
    };
    if (reduceMotion) return show(words[0]);

    // Typing only runs while the element is on screen
    let onScreen = false;
    let wake = null;
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen && wake) wake();
    });
    observer.observe(root);
    signal.addEventListener('abort', () => observer.disconnect());
    const ready = () => (onScreen ? Promise.resolve() : new Promise((r) => (wake = r)));
    // Once the instance is destroyed, every pause lasts forever: the typing simply stops
    const wait = (ms) => sleep(ms).then(() => signal.aborted && new Promise(() => {}));

    // A human rhythm: irregular, with a breath after punctuation
    const keystroke = (char) => wait(speed * (0.55 + Math.random() * 0.9) + (/[.,!?;:]/.test(char) ? speed * 2.5 : 0));

    async function type(head, text, tail) {
      root.classList.add('is-typing');
      for (let i = 1; i <= text.length; i++) {
        await ready();
        show(head + text.slice(0, i), '', tail);
        await keystroke(text[i - 1]);
      }
      root.classList.remove('is-typing');
    }

    async function erase(head, text, tail) {
      root.classList.add('is-typing');
      for (let i = text.length - 1; i >= 0; i--) {
        await ready();
        show(head + text.slice(0, i), '', tail);
        await wait(speed * 0.45);
      }
      root.classList.remove('is-typing');
    }

    (async () => {
      show('');
      await type('', words[0], '');
      for (let i = 0; ; i = (i + 1) % words.length) {
        const current = words[i];
        const next = words[(i + 1) % words.length];
        await wait(hold);
        await ready();
        if (mode === 'loop') {
          await erase('', current, '');
          await wait(speed * 4);
          await type('', next, '');
          continue;
        }
        const { start, end } = overlap(current, next);
        const head = current.slice(0, start);
        const tail = end ? current.slice(current.length - end) : '';
        const changed = current.slice(start, current.length - end);
        const typed = next.slice(start, next.length - end);
        if (mode === 'select' && changed) {
          // Select the part that changes, then type over it
          for (let n = 1; n <= changed.length; n++) {
            show(head, changed.slice(0, n), changed.slice(n) + tail);
            await wait(28);
          }
          await wait(380);
          show(head, '', tail);
          await wait(speed * 2);
        } else {
          await erase(head, changed, tail);
          await wait(speed * 3);
        }
        await type(head, typed, tail);
      }
    })();
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
