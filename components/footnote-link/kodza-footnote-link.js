// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Footnote Link
// Numbers each note, sets it level with its line in the margin (wide column) or folds it out under
// its line (narrow column, animated height), and turns WordPress or Markdown footnotes into the same.
(() => {
  const SELECTOR = '[data-kodza-footnote-link]';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const OPEN = { duration: 460, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
  const CLOSE = { duration: 380, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' };
  const FOLDED = { height: '0px', paddingTop: '0px', paddingBottom: '0px', marginTop: '0px', marginBottom: '0px', opacity: 0 };
  const BACK_LINK = /^[\s↩︎️]+$/; // a "↩" that leads back to the number, nothing else
  let uid = 0;

  // Footnotes already written: the WordPress Footnotes block, or Markdown (<sup><a href="#fn1">).
  // Each number becomes a button with its note right after it, and the list at the bottom hides.
  function borrow(root, signal) {
    const lists = new Set();
    root.querySelectorAll('sup a[href^="#"]').forEach((link) => {
      const sup = link.closest('sup');
      let item = null;
      try {
        item = document.getElementById(decodeURIComponent(link.getAttribute('href').slice(1)));
      } catch {
        return;
      }
      if (item?.tagName !== 'LI') return;
      const copy = item.cloneNode(true);
      const backs = [link.id, sup.id].filter(Boolean).map((id) => `#${id}`);
      copy.querySelectorAll('a[href]').forEach((a) => {
        if (backs.includes(a.getAttribute('href')) || BACK_LINK.test(a.textContent)) a.remove();
      });
      copy.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
      const body = copy.children.length === 1 && copy.firstElementChild.tagName === 'P' ? copy.firstElementChild : copy;
      const ref = document.createElement('button');
      ref.type = 'button';
      ref.className = 'kodza-footnote-link__ref';
      ref.textContent = link.textContent.replace(/[[\]]/g, '').trim();
      const note = document.createElement('span');
      note.className = 'kodza-footnote-link__note';
      note.innerHTML = body.innerHTML.trim();
      sup.replaceWith(ref, note);
      lists.add(item.closest('.wp-block-footnotes, .footnotes') || item.parentElement);
    });
    lists.forEach((list) => {
      const hidden = list.hidden;
      list.hidden = true;
      signal.addEventListener('abort', () => { list.hidden = hidden; });
    });
  }

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    borrow(root, signal);
    const pairs = [...root.querySelectorAll('.kodza-footnote-link__ref')]
      .map((ref) => ({ ref, note: ref.nextElementSibling, open: false }))
      .filter(({ note }) => note?.classList.contains('kodza-footnote-link__note'));
    if (!pairs.length) return;

    pairs.forEach(({ ref, note }, i) => {
      const n = ref.textContent.trim() || String(i + 1);
      ref.dataset.n = n;
      note.dataset.n = n;
      if (!ref.hasAttribute('aria-label')) ref.setAttribute('aria-label', `Note ${n}`);
      if (!note.id) note.id = `kodza-footnote-link-${++uid}`;
      ref.setAttribute('aria-controls', note.id);
      // A number never starts a line on its own: it is tied to the word before it
      const text = ref.previousSibling;
      if (text?.nodeType !== Node.TEXT_NODE || !/\S$/.test(text.data)) return;
      const at = text.data.search(/\S+$/);
      const word = at > 0 ? text.splitText(at) : text;
      const tie = document.createElement('span');
      tie.className = 'kodza-footnote-link__tie';
      word.before(tie);
      tie.append(word, ref, note);
    });

    // Which layout the CSS picked: the container query floats the notes right in a wide column
    const isWide = () => getComputedStyle(pairs[0].note).float === 'right';
    let wide = null;
    let pinned = null;

    const setPin = (pair) => {
      pinned?.ref.classList.remove('is-active');
      pinned = pair;
      pair?.ref.classList.add('is-active');
    };

    // In the margin, each note's first line sits on the baseline of the line that calls it. A
    // note pushed down by the one above stays where it is: it is never pulled up over it.
    const baseline = () => {
      const probe = document.createElement('span');
      probe.style.cssText = 'display: inline-block; width: 0; height: 0; margin: 0; padding: 0; vertical-align: baseline';
      return probe;
    };
    const align = () => {
      if (!root.offsetWidth) return;
      const scale = root.getBoundingClientRect().width / root.offsetWidth || 1;
      pairs.forEach(({ note }) => {
        note.style.marginTop = '0px';
        const line = baseline();
        const first = baseline();
        note.before(line);
        note.prepend(first);
        const shift = (line.getBoundingClientRect().top - first.getBoundingClientRect().top) / scale;
        line.remove();
        first.remove();
        note.style.marginTop = `${Math.max(0, Math.round(shift * 100) / 100)}px`;
      });
    };

    const settle = (pair) => {
      pair.note.getAnimations().forEach((animation) => animation.cancel());
      pair.note.classList.remove('is-moving');
      pair.note.classList.toggle('is-open', pair.open);
    };

    const layout = () => {
      const now = isWide();
      if (now !== wide) {
        wide = now;
        setPin(null);
        pairs.forEach((pair) => {
          settle(pair);
          if (wide) {
            pair.ref.removeAttribute('aria-expanded');
          } else {
            pair.ref.setAttribute('aria-expanded', String(pair.open));
            pair.note.style.removeProperty('margin-top');
          }
        });
      }
      if (wide) align();
    };

    // Narrow column: the note opens under its line and the text below slides down with it.
    // Stopped half-way, it turns back from where it is.
    const read = (style) => ({
      height: style.height,
      paddingTop: style.paddingTop,
      paddingBottom: style.paddingBottom,
      marginTop: style.marginTop,
      marginBottom: style.marginBottom,
      opacity: style.opacity,
    });
    const toggle = (pair, open) => {
      const { ref, note } = pair;
      if (pair.open === open) return;
      pair.open = open;
      ref.setAttribute('aria-expanded', String(open));
      const moving = note.getAnimations().length > 0 && note.classList.contains('is-moving');
      const from = moving ? read(getComputedStyle(note)) : null;
      note.getAnimations().forEach((animation) => animation.cancel());
      note.classList.add('is-open');
      if (reduceMotion) {
        settle(pair);
        return;
      }
      const full = read(getComputedStyle(note));
      note.classList.add('is-moving');
      const animation = note.animate(
        [from || (open ? FOLDED : full), open ? full : FOLDED],
        { ...(open ? OPEN : CLOSE), fill: open ? 'none' : 'forwards' },
      );
      animation.onfinish = () => settle(pair);
    };

    pairs.forEach((pair) => {
      pair.ref.addEventListener('click', () => {
        if (wide) setPin(pinned === pair ? null : pair);
        else toggle(pair, !pair.open);
      }, { signal });
    });

    root.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (wide) {
        if (!pinned) return;
        setPin(null);
      } else {
        const pair = pairs.find(({ ref, note }) => ref === event.target || note.contains(event.target));
        if (!pair?.open) return;
        const inside = pair.note.contains(event.target);
        toggle(pair, false);
        if (inside) pair.ref.focus();
      }
      event.preventDefault();
    }, { signal });

    document.addEventListener('pointerdown', (event) => {
      if (pinned && !pinned.ref.contains(event.target) && !pinned.note.contains(event.target)) setPin(null);
    }, { signal });

    // The width decides the layout; anything that moves the lines (fonts, images) moves the notes
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(layout);
    });
    layout();
    observer.observe(root);
    document.fonts?.ready.then(() => {
      if (!signal.aborted) layout();
    });
    signal.addEventListener('abort', () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      pairs.forEach(({ note }) => note.getAnimations().forEach((animation) => animation.cancel()));
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
