// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Result Quote
// A case study in one block, played once as it comes into view, the result first: the digits of
// the figure roll up to their value ("3.2×", "−42%": only the digits move), then the lines of the
// quote rise from behind their masks, then the person and the link (the order and the delays are
// in the CSS). The settings: the constants below and the --kz-result-quote-* variables.
// "kodza:replay" on the element plays the entrance again.
(() => {
  const SELECTOR = '.kodza-result-quote';
  const THRESHOLD = 0.35; // share of the result in view before the section plays
  const ROLL = 1400; // ms for the first digit to land
  const ROLL_STEP = 160; // ms more for each next digit
  const ROLL_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
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
    // The still path, no motion asked by the visitor or the site: the section stays as written
    if (reduceMotion || !pace || !('IntersectionObserver' in window)) return;
    const result = root.querySelector('.kodza-result-quote__result') || root;
    const quote = root.querySelector('.kodza-result-quote__quote');

    // The figure: a column of spinning digits per digit (screen readers keep the plain text)
    const strips = [];
    root.querySelectorAll('.kodza-result-quote__value').forEach((value) => {
      const text = value.textContent.trim();
      const count = (text.match(/\d/g) || []).length;
      let rank = 0;
      value.setAttribute('aria-hidden', 'true');
      value.after(make('span', 'kodza-result-quote__sr', text));
      value.replaceChildren(...[...text].map((char) => {
        if (!/\d/.test(char)) return make('span', 'kodza-result-quote__char', char);
        // The digits on the right spin more: one turn on the left, up to three on the right
        const turns = 1 + Math.round((rank / Math.max(1, count - 1)) * 2);
        const column = make('span', 'kodza-result-quote__digit');
        const strip = make('span', 'kodza-result-quote__strip');
        for (let i = 0; i < (turns + 1) * 10; i++) strip.append(make('span', '', i % 10));
        column.append(make('span', 'kodza-result-quote__fit', char), strip);
        strips.push({ strip, stop: turns * 10 + Number(char), rank: rank++ });
        return column;
      }));
    });
    const roll = () => strips.forEach(({ strip, stop, rank }) => {
      strip.getAnimations().forEach((animation) => animation.cancel());
      strip.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${-stop * 1.1}em)` }], {
        duration: (ROLL + rank * ROLL_STEP) * pace,
        easing: ROLL_EASE,
        fill: 'forwards',
      });
    });

    // The quote: one mask per line, the line rising into it. The blocks are its paragraphs (or the
    // quote itself); the opening mark hangs before the first word, the closing one ends the last
    const blocks = !quote ? [] : quote.querySelector(':scope > p') ? [...quote.querySelectorAll(':scope > p')] : [quote];
    const texts = new Map();
    const split = () => {
      root.classList.add('is-split');
      // Writes: the words
      const words = blocks.map((block, b) => {
        if (!texts.has(block)) texts.set(block, block.textContent.replace(/\s+/g, ' ').trim());
        const list = texts.get(block).split(' ').filter(Boolean).map((text) => make('span', 'kodza-result-quote__word', text));
        if (b === 0 && list.length) list[0].prepend(make('span', 'kodza-result-quote__mark', '“'));
        if (b === blocks.length - 1 && list.length) list[list.length - 1].append('”');
        block.replaceChildren(make('span', 'kodza-result-quote__sr', texts.get(block)), ...spaced(list));
        return list;
      });
      // Reads: where each word falls
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
      // Writes: the masks, each line with its rank for the CSS delays
      let rank = 0;
      blocks.forEach((block, b) => {
        const box = make('span', 'kodza-result-quote__lines');
        box.setAttribute('aria-hidden', 'true');
        rows[b].forEach((row) => {
          const line = make('span', 'kodza-result-quote__line');
          const lift = make('span', 'kodza-result-quote__lift');
          lift.style.setProperty('--kz-result-quote-i', rank++);
          lift.append(...spaced(row));
          line.append(lift);
          box.append(line);
        });
        block.replaceChildren(block.firstChild, box);
      });
      root.style.setProperty('--kz-result-quote-n', rank);
    };

    // The entrance: armed (the CSS hides what comes in), then played once the result is in view
    let ready = false;
    const enter = () => {
      root.classList.add('is-in');
      roll();
    };
    root.classList.add('is-armed');
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      io.disconnect();
      enter();
    }, { threshold: THRESHOLD });
    root.addEventListener('kodza:replay', () => {
      if (!ready) return;
      io.disconnect();
      root.classList.remove('is-in');
      void root.offsetWidth; // hidden again for one frame, so it all plays from the start
      enter();
    }, { signal });

    // A new width (or a new font size) puts the words on new lines: split again, mid-entrance or not
    let key = '';
    let pending = 0;
    const keyOf = () => `${quote.clientWidth} ${parseFloat(getComputedStyle(quote).fontSize)}`;
    const resized = new ResizeObserver(() => {
      if (!ready || keyOf() === key) return;
      key = keyOf();
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(split);
    });
    signal.addEventListener('abort', () => {
      io.disconnect();
      resized.disconnect();
      cancelAnimationFrame(pending);
      strips.forEach(({ strip }) => strip.getAnimations().forEach((animation) => animation.cancel()));
    }, { once: true });
    // Lines are measured in the real font; the section waits for them before it can play
    Promise.resolve(document.fonts?.ready).then(() => {
      if (signal.aborted) return;
      if (quote) {
        split();
        key = keyOf();
        resized.observe(quote);
      }
      ready = true;
      io.observe(result);
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
