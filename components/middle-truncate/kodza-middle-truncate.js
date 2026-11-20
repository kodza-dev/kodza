// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Middle Truncate
// A long name cut in the middle: the start and the end stay readable, the cut follows the width of
// its column (resize, fonts that arrive late), and hover, focus or a tap unfolds the missing part
// right out of the ellipsis: the pill that holds it widens, the characters open from its centre and
// the end slides along. Screen readers and a copied selection always
// get the whole name. Without the script, a plain end ellipsis.
// Settings, on the element: data-tail (how many characters the end keeps, 8 for a hash: half and
// half without it) and data-text-cut (the mark). The timings are the constants under WORDS.
(() => {
  const SELECTOR = '.kodza-middle-truncate';
  const WORDS = {
    cut: '…',
  };
  const OPEN = 420; // ms: the missing part unfolds
  const CLOSE = 300; // ms: and folds back
  const HOVER_IN = 140; // ms: the pointer rests on the name before it unfolds
  const HOVER_OUT = 120; // ms: and leaves it before it folds
  const EDGE = 12; // px: the unfolded name keeps this far from the edges of the screen
  const ARRIVE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const FOLD = 'cubic-bezier(0.65, 0, 0.35, 1)';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const segmenter = window.Intl?.Segmenter ? new Intl.Segmenter() : null;
  const graphemes = (text) => (segmenter ? Array.from(segmenter.segment(text), (s) => s.segment) : Array.from(text));

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const data = root.dataset;
    const word = (key) => data[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const make = (name, text) => {
      const el = document.createElement('span');
      el.className = `kodza-middle-truncate__${name}`;
      if (text != null) el.textContent = text;
      return el;
    };
    const moving = () => !reduceMotion && paceOf(root) > 0;

    const text = root.textContent.trim().replace(/\s+/g, ' ');
    if (!text) return;
    const chars = graphemes(text);
    const tailWanted = Number.isFinite(parseInt(data.tail, 10)) ? Math.max(0, parseInt(data.tail, 10)) : null;

    // The name read and copied, the name that holds the width, and the name drawn: start, the
    // seam (the hidden middle and the mark, on one tinted pill), the end
    const said = make('said', text);
    const measure = make('measure', text);
    measure.setAttribute('aria-hidden', 'true');
    const face = make('face');
    face.setAttribute('aria-hidden', 'true');
    const head = make('head');
    const seam = make('seam');
    const middle = make('middle');
    const mark = make('mark', word('cut'));
    const tail = make('tail');
    seam.append(middle, mark);
    face.append(head, seam, tail);
    face.style.translate = '0px 0px';
    root.replaceChildren(said, measure, face);
    root.classList.add('is-live');

    // Inside a link or a button, that one takes the focus; on its own, the name does when it is cut
    const host = root.parentElement?.closest('a[href], button, summary, [tabindex]');
    const target = host || root;
    let cut = false;
    let isOpen = false;
    let anims = [];

    const split = (kept) => {
      const end = tailWanted == null ? Math.floor(kept / 2) : Math.min(tailWanted, kept);
      const start = chars.slice(0, kept - end).join('').trimEnd();
      const finish = end ? chars.slice(chars.length - end).join('').trimStart() : '';
      head.textContent = start;
      middle.textContent = text.slice(start.length, text.length - finish.length);
      tail.textContent = finish;
    };

    const fit = () => {
      anims.forEach((a) => a.cancel());
      anims = [];
      isOpen = false;
      root.classList.remove('is-open');
      face.style.translate = '0px 0px';
      const room = root.clientWidth;
      cut = measure.scrollWidth > room + 0.5;
      root.classList.toggle('is-cut', cut);
      if (!host) {
        if (cut) root.tabIndex = 0;
        else root.removeAttribute('tabindex');
      }
      if (!cut) {
        head.textContent = text;
        middle.textContent = '';
        tail.textContent = '';
        return;
      }
      // The most characters that fit around the mark, found in a few measures
      let low = 0;
      let high = chars.length - 1;
      let best = 0;
      while (low <= high) {
        const kept = (low + high) >> 1;
        split(kept);
        if (face.offsetWidth <= room) {
          best = kept;
          low = kept + 1;
        } else high = kept - 1;
      }
      split(best);
    };

    // From what is on screen now (an unfinished fold included) to the new state, so a quick
    // in and out never jumps
    const parts = [[middle, ['width']], [mark, ['width', 'opacity']], [face, ['translate']]];
    const snapshot = () => parts.map(([el, props]) => {
      const style = getComputedStyle(el);
      return props.map((p) => style[p]);
    });
    const play = (change, duration, easing) => {
      const before = snapshot();
      anims.forEach((a) => a.cancel());
      anims = [];
      change();
      if (!moving()) return;
      const after = snapshot();
      anims = parts.map(([el, props], i) => {
        const from = {};
        const to = {};
        props.forEach((p, j) => {
          from[p] = before[i][j];
          to[p] = after[i][j];
        });
        return el.animate([from, to], { duration: duration * paceOf(root), easing });
      });
    };

    const open = () => {
      if (!cut || isOpen) return;
      isOpen = true;
      play(() => {
        root.classList.add('is-open');
        // Pushed back inside the screen when the whole name runs past an edge; a parent scaled
        // by transform (a theme, a thumbnail) counts in its own pixels
        const rect = root.getBoundingClientRect();
        const scale = rect.width / root.offsetWidth || 1;
        const pad = parseFloat(getComputedStyle(root).getPropertyValue('--kz-middle-truncate-pad')) || 0;
        const right = rect.left + (face.offsetWidth + pad) * scale;
        const room = (document.documentElement.clientWidth || window.innerWidth) - EDGE;
        let shift = Math.min(0, (room - right) / scale);
        shift = Math.max(shift, (EDGE + pad * scale - rect.left) / scale);
        face.style.translate = `${Math.round(shift)}px 0px`;
      }, OPEN, ARRIVE);
    };
    const close = () => {
      if (!isOpen) return;
      isOpen = false;
      play(() => {
        root.classList.remove('is-open');
        face.style.translate = '0px 0px';
      }, CLOSE, FOLD);
    };

    let wait = 0;
    const later = (fn, ms) => {
      clearTimeout(wait);
      wait = setTimeout(fn, ms * paceOf(root));
    };
    root.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse') later(open, HOVER_IN);
    }, { signal });
    root.addEventListener('pointerleave', (event) => {
      if (event.pointerType === 'mouse' && target !== document.activeElement) later(close, HOVER_OUT);
    }, { signal });
    let touch = false;
    root.addEventListener('pointerdown', (event) => {
      touch = event.pointerType !== 'mouse';
    }, { signal });
    root.addEventListener('click', () => {
      if (!touch || host) return;
      clearTimeout(wait);
      if (isOpen) close();
      else open();
    }, { signal });
    target.addEventListener('focus', () => {
      if (target.matches(':focus-visible')) open();
    }, { signal });
    target.addEventListener('blur', close, { signal });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen) close();
    }, { signal });
    document.addEventListener('pointerdown', (event) => {
      if (isOpen && !root.contains(event.target)) close();
    }, { signal });

    const resize = new ResizeObserver(fit);
    resize.observe(root);
    document.fonts?.addEventListener('loadingdone', fit, { signal });
    document.fonts?.ready.then(() => {
      if (!signal.aborted) fit();
    });
    fit();

    signal.addEventListener('abort', () => {
      clearTimeout(wait);
      resize.disconnect();
      anims.forEach((a) => a.cancel());
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
