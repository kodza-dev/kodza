// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Glossary Term
// The glossary of an article (a dl at its end) is read once, and the first time each of its words
// shows up in the text, it gets a dotted underline. Point at it, focus it or tap it: a small card
// unfolds from the word with the definition and a way to the list; the entry in the list gets a
// way back. Without the script, the glossary stays where it is, at the end.
// Settings: the --kz-glossary-term-* variables (CSS), data-every (mark every time a word shows up,
// not just the first), data-list (a dl elsewhere on the page), data-match on a dt (other ways of
// writing the word, comma separated), the words below (data-text-<name>), the timings below.
(() => {
  const SELECTOR = '[data-kodza-glossary-term]';
  const WORDS = {
    more: 'In the glossary', // the link from a card to the list
    back: 'Back to the text', // the way back from an entry to its word
  };
  const OPEN = 420; // ms, the card unfolding from its word
  const CLOSE = 260; // ms, the card folding back into it
  const STAGGER = 45; // ms between the name, the definition and the link
  const RISE = 8; // px the card's lines rise as it opens
  const GAP = 8; // px between the word and the card
  const HOVER_IN = 90; // ms the pointer rests on a word before its card opens (a wait, not motion)
  const HOVER_OUT = 200; // ms before a card left by the pointer closes, to cross to it
  const FLAG = 1600; // ms an entry reached from the text stays marked (a reading time)
  // Never underlined inside these: they already mean something, or are read as code
  const SKIP = 'a, button, input, select, textarea, label, code, pre, kbd, samp, sup, sub, h1, h2, h3, h4, h5, h6, script, style, svg, [data-glossary-skip], [contenteditable]';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const isUpper = (text) => /\p{Lu}/u.test(text) && text === text.toUpperCase();
  let count = 0;

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const data = root.dataset;
    const word = (key) => data[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const make = (markup, name, text) => {
      const template = document.createElement('template');
      template.innerHTML = markup;
      const el = template.content.firstElementChild;
      if (name) el.className = `kodza-glossary-term__${name}`;
      if (text != null) el.textContent = text;
      return el;
    };
    const timers = new Set();
    const later = (fn, ms) => {
      const id = setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
      return id;
    };
    const cancel = (id) => {
      clearTimeout(id);
      timers.delete(id);
    };
    signal.addEventListener('abort', () => timers.forEach(clearTimeout));

    const list = (data.list && document.querySelector(data.list)) || root.querySelector('.kodza-glossary-term__list') || [...root.querySelectorAll('dl')].pop();
    if (!list) return;

    // The entries: a dt, the dd after it, and the ways the word is written
    const entries = [...list.querySelectorAll(':scope > dt, :scope > div > dt')].map((dt) => {
      let dd = dt.nextElementSibling;
      while (dd && dd.tagName !== 'DD') dd = dd.nextElementSibling;
      if (!dd) return null;
      const name = dt.textContent.trim();
      const names = [name, ...(dt.dataset.match || '').split(',')].map((n) => n.trim()).filter(Boolean);
      if (!dt.id) dt.id = `kodza-glossary-term-${++count}`;
      return { dt, dd, name, names, terms: [] };
    }).filter(Boolean);
    if (!entries.length) return;

    const byName = new Map();
    entries.forEach((entry) => entry.names.forEach((n) => byName.set(n.toLowerCase(), { entry, name: n })));
    const pattern = [...byName.values()].map((v) => v.name).sort((a, b) => b.length - a.length).map(escape).join('|');
    const find = new RegExp(`(?<![\\p{L}\\p{N}])(?:${pattern})(?![\\p{L}\\p{N}])`, 'giu');
    const every = 'every' in data && data.every !== 'false';

    // The text, read before anything is wrapped: the glossary itself and the SKIP elements stay out
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => (list.contains(node) || node.parentElement.closest(SKIP) || !node.data.trim()
        ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    const nodes = [];
    const items = []; // every word dressed, with its card
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach((node) => {
      let rest = node;
      const hits = [...node.data.matchAll(find)];
      let offset = 0;
      hits.forEach((hit) => {
        const known = byName.get(hit[0].toLowerCase());
        if (!known || (isUpper(known.name) && hit[0] !== known.name)) return;
        if (known.entry.terms.length && !every) return;
        const start = hit.index - offset;
        const piece = rest.splitText(start);
        rest = piece.splitText(hit[0].length);
        offset = hit.index + hit[0].length;
        piece.replaceWith(dress(known.entry, piece.data));
      });
    });

    // A word of the text, and its card right after it, so a screen reader meets them in order
    function dress(entry, text) {
      const term = make('<button type="button"></button>', 'term', text);
      term.setAttribute('aria-expanded', 'false');
      const card = make('<span></span>', 'card');
      card.id = `kodza-glossary-term-card-${++count}`;
      card.hidden = true;
      term.setAttribute('aria-controls', card.id);
      const panel = make('<span></span>', 'panel');
      const name = make('<span></span>', 'name', entry.name);
      const definition = make('<span></span>', 'definition');
      [...entry.dd.childNodes].forEach((child) => {
        if (child.classList?.contains('kodza-glossary-term__back')) return;
        const copy = child.cloneNode(true);
        copy.removeAttribute?.('id');
        copy.querySelectorAll?.('[id]').forEach((el) => el.removeAttribute('id'));
        definition.append(copy);
      });
      const more = make('<a></a>', 'more', word('more'));
      more.href = `#${entry.dt.id}`;
      panel.append(name, definition, more);
      card.append(panel);
      const fragment = document.createDocumentFragment();
      fragment.append(term, card);
      const item = { entry, term, card, panel, lines: [name, definition, more], open: false, pinned: false, anim: null, hover: 0 };
      entry.terms.push(item);
      items.push(item);
      return fragment;
    }
    const scaleOf = (el) => el.getBoundingClientRect().width / el.offsetWidth || 1;
    const radiusOf = (el) => getComputedStyle(el).borderTopLeftRadius;
    let pointerY = null;

    // Above the word when there is room on screen, under it otherwise; centred on it, kept
    // inside the instance. The pixels of the screen are divided by the parent's scale
    function place(item) {
      const { term, card } = item;
      const parent = card.offsetParent || root;
      const scale = scaleOf(parent);
      const box = parent.getBoundingClientRect();
      const bounds = root.getBoundingClientRect();
      card.style.maxWidth = `${bounds.width / scaleOf(root)}px`;
      const rects = [...term.getClientRects()];
      const line = pointerY == null ? rects[0]
        : rects.reduce((a, b) => (Math.abs(b.top + b.height / 2 - pointerY) < Math.abs(a.top + a.height / 2 - pointerY) ? b : a));
      const w = card.offsetWidth;
      const h = card.offsetHeight;
      const min = (bounds.left - box.left) / scale;
      const max = (bounds.right - box.left) / scale - w;
      const x = Math.max(min, Math.min((line.left + line.width / 2 - box.left) / scale - w / 2, max));
      const above = line.top - h * scale - GAP * scale > 8;
      const y = above ? (line.top - box.top) / scale - h - GAP : (line.bottom - box.top) / scale + GAP;
      card.style.left = `${x}px`;
      card.style.top = `${y}px`;
      card.dataset.side = above ? 'top' : 'bottom';
      return above;
    }

    function open(item, pinned) {
      item.pinned = item.pinned || pinned;
      if (item.open) return;
      items.forEach((other) => other !== item && other.open && close(other));
      item.open = true;
      const { term, card, panel } = item;
      term.setAttribute('aria-expanded', 'true');
      term.classList.add('is-open');
      card.hidden = false;
      const above = place(item);
      item.anim?.forEach((a) => a.cancel());
      item.anim = null;
      if (still) return;
      const r = radiusOf(panel);
      const shut = above ? `inset(100% 0 0 0 round ${r})` : `inset(0 0 100% 0 round ${r})`;
      const timing = { duration: OPEN * pace, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' };
      item.anim = [
        panel.animate([{ clipPath: shut }, { clipPath: `inset(0 0 0 0 round ${r})` }], timing),
        card.animate([{ transform: `translateY(${above ? RISE : -RISE}px)` }, { transform: 'none' }], timing),
        ...item.lines.map((line, n) => line.animate(
          [{ transform: `translateY(${above ? RISE : -RISE}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }],
          { ...timing, delay: (60 + n * STAGGER) * pace },
        )),
      ];
    }

    function close(item, back) {
      if (!item.open) return;
      item.open = false;
      item.pinned = false;
      const { term, card, panel } = item;
      term.setAttribute('aria-expanded', 'false');
      term.classList.remove('is-open');
      if (back && card.contains(document.activeElement)) term.focus();
      item.anim?.forEach((a) => a.cancel());
      item.anim = null;
      if (still) {
        card.hidden = true;
        return;
      }
      const above = card.dataset.side !== 'bottom';
      const r = radiusOf(panel);
      const shut = above ? `inset(100% 0 0 0 round ${r})` : `inset(0 0 100% 0 round ${r})`;
      const timing = { duration: CLOSE * pace, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' };
      const folding = panel.animate([{ clipPath: `inset(0 0 0 0 round ${r})` }, { clipPath: shut }], timing);
      item.anim = [folding, card.animate([{ transform: 'none' }, { transform: `translateY(${above ? RISE / 2 : -RISE / 2}px)` }], timing)];
      folding.onfinish = () => {
        card.hidden = true;
        item.anim?.forEach((a) => a.cancel());
        item.anim = null;
      };
    }

    // An entry reached from the text, or a word reached from the list: marked for a moment
    function flag(els) {
      els.forEach((el) => {
        el.classList.remove('is-unflagged');
        el.classList.add('is-flagged');
      });
      later(() => els.forEach((el) => {
        el.classList.remove('is-flagged');
        el.classList.add('is-unflagged');
      }), FLAG);
      later(() => els.forEach((el) => el.classList.remove('is-unflagged')), FLAG + 700 * pace);
    }
    const reach = (el) => {
      el.scrollIntoView({ block: 'center', behavior: still ? 'auto' : 'smooth' });
      el.focus({ preventScroll: true });
    };

    items.forEach((item) => {
      const { term, card } = item;
      const leave = () => {
        cancel(item.hover);
        item.hover = later(() => {
          if (!item.pinned && !term.matches(':hover') && !card.matches(':hover') && !card.contains(document.activeElement)) close(item);
        }, HOVER_OUT);
      };
      // The pointer: a mouse or a pen opens a card by resting on its word. A finger taps
      term.addEventListener('pointerenter', (event) => {
        if (event.pointerType === 'touch') return;
        cancel(item.hover);
        pointerY = event.clientY;
        item.hover = later(() => open(item, false), HOVER_IN);
      }, { signal });
      term.addEventListener('pointerleave', leave, { signal });
      card.addEventListener('pointerenter', () => cancel(item.hover), { signal });
      card.addEventListener('pointerleave', leave, { signal });
      term.addEventListener('click', () => {
        cancel(item.hover);
        if (item.open && item.pinned) close(item);
        else {
          pointerY = null;
          open(item, true);
        }
      }, { signal });
      term.addEventListener('focus', () => {
        if (!term.matches(':focus-visible')) return;
        pointerY = null;
        open(item, false);
      }, { signal });
      [term, card].forEach((el) => el.addEventListener('focusout', (event) => {
        const next = event.relatedTarget;
        if (next && (term.contains(next) || card.contains(next))) return;
        if (!item.pinned) close(item);
      }, { signal }));
      card.querySelector('.kodza-glossary-term__more').addEventListener('click', (event) => {
        event.preventDefault();
        close(item);
        reach(item.entry.dt);
        flag([item.entry.dt, item.entry.dd]);
      }, { signal });
    });

    // In the list, a way back to the first word of each entry found in the text
    entries.forEach((entry) => {
      const first = entry.terms[0];
      if (!first) return;
      const back = make('<button type="button"></button>', 'back', word('back'));
      back.setAttribute('aria-label', `${word('back')}: ${entry.name}`);
      entry.dd.append(' ', back);
      back.addEventListener('click', () => {
        reach(first.term);
        flag([first.term]);
      }, { signal });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      items.forEach((item) => item.open && close(item, true));
    }, { signal });
    document.addEventListener('pointerdown', (event) => {
      items.forEach((item) => {
        if (item.open && !item.term.contains(event.target) && !item.card.contains(event.target)) close(item);
      });
    }, { signal });
    // A card follows its word when the text reflows
    window.addEventListener('resize', () => items.forEach((item) => item.open && place(item)), { signal });
    signal.addEventListener('abort', () => items.forEach((item) => item.anim?.forEach((a) => a.cancel())));
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
