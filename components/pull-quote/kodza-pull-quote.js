// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Pull Quote
// The entrance, played once as the quote reaches the screen: the rule draws, the mark rises, then
// each line rises from behind its own mask, then the source (the order and the delays are in the
// CSS). Once it has played, the quote gets its markup back (links, emphasis) and wraps freely again.
// Settings: the constants below and the --kz-pull-quote-* variables. "kodza:replay" on the figure
// plays the entrance again.
(() => {
  const SELECTOR = '.kodza-pull-quote';
  const ENTER = '0px 0px -12% 0px'; // the quote plays once it is this far inside the screen
  // How long the entrance lasts, in seconds (keep in step with the CSS delays): the last line lands
  // at LINE_END + rank × LINE_STEP, the source at SOURCE_END + min(lines, 5) × LINE_STEP
  const LINE_END = 1.2;
  const LINE_STEP = 0.08;
  const SOURCE_END = 1.2;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const make = (tag, className, text) => Object.assign(document.createElement(tag), className ? { className } : {}, text != null ? { textContent: text } : {});
  const spaced = (els) => els.flatMap((el, k) => (k ? [' ', el] : [el]));

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const pace = paceOf(root);
    // The still path, no motion asked by the visitor or the site: the quote stays as written
    if (reduceMotion || !pace || !('IntersectionObserver' in window)) return;
    const quote = root.querySelector('blockquote');
    if (!quote) return;
    // The blocks are its paragraphs; a quote without them is one block, unless it holds the source
    const blocks = quote.querySelector(':scope > p') ? [...quote.querySelectorAll(':scope > p')] : quote.querySelector(':scope > cite') ? [] : [quote];
    const written = new Map(blocks.map((block) => [block, block.innerHTML]));
    const texts = new Map(blocks.map((block) => [block, block.textContent.replace(/\s+/g, ' ').trim()]));
    let split = false;

    // One mask per line, the line rising into it. Reads where each word falls, then writes the masks
    const cut = () => {
      const words = blocks.map((block) => {
        const list = texts.get(block).split(' ').filter(Boolean).map((text) => make('span', 'kodza-pull-quote__word', text));
        block.replaceChildren(make('span', 'kodza-pull-quote__sr', texts.get(block)), ...spaced(list));
        return list;
      });
      const rows = words.map((list) => {
        const lines = [];
        let top = -Infinity;
        list.forEach((word) => {
          if (word.offsetTop > top + 2) {
            lines.push([]);
            top = word.offsetTop;
          }
          lines[lines.length - 1].push(word);
        });
        return lines;
      });
      let rank = 0;
      blocks.forEach((block, b) => {
        const box = make('span', 'kodza-pull-quote__lines');
        box.setAttribute('aria-hidden', 'true');
        rows[b].forEach((row) => {
          const line = make('span', 'kodza-pull-quote__line');
          const lift = make('span', 'kodza-pull-quote__lift');
          lift.style.setProperty('--kz-pull-quote-i', rank++);
          lift.append(...spaced(row));
          line.append(lift);
          box.append(line);
        });
        block.replaceChildren(block.firstChild, box);
      });
      root.style.setProperty('--kz-pull-quote-n', rank);
      root.classList.add('is-split');
      split = true;
      return rank;
    };
    const uncut = () => {
      if (!split) return;
      blocks.forEach((block) => { block.innerHTML = written.get(block); });
      root.classList.remove('is-split');
      split = false;
    };

    // The entrance: armed (the CSS hides what comes in), played once in view, then the markup back
    let done = 0;
    const enter = () => {
      clearTimeout(done);
      uncut();
      const lines = cut();
      root.classList.remove('is-in');
      void root.offsetWidth; // hidden again for one frame, so it all plays from the start
      root.classList.add('is-in');
      const end = Math.max(LINE_END + Math.max(0, lines - 1) * LINE_STEP, SOURCE_END + Math.min(lines, 5) * LINE_STEP);
      done = setTimeout(uncut, (end * 1000 + 100) * pace);
    };
    let ready = false;
    let seen = false;
    root.classList.add('is-armed');
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      io.disconnect();
      seen = true;
      if (ready) enter();
    }, { rootMargin: ENTER });
    io.observe(root);
    root.addEventListener('kodza:replay', () => {
      if (!ready) return;
      io.disconnect();
      seen = true;
      enter();
    }, { signal });

    // A new width (or font size) mid-entrance puts the words on new lines: cut them again, as they are
    let key = '';
    let pending = 0;
    const keyOf = () => `${quote.clientWidth} ${parseFloat(getComputedStyle(quote).fontSize)}`;
    const resized = new ResizeObserver(() => {
      if (!split || keyOf() === key) return;
      key = keyOf();
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(() => {
        if (!split) return;
        uncut();
        cut();
      });
    });
    resized.observe(quote);
    signal.addEventListener('abort', () => {
      io.disconnect();
      resized.disconnect();
      cancelAnimationFrame(pending);
      clearTimeout(done);
    }, { once: true });
    // Lines are measured in the real font: the quote waits for it before it can play
    Promise.resolve(document.fonts?.ready).then(() => {
      if (signal.aborted) return;
      ready = true;
      key = keyOf();
      if (seen) enter();
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
