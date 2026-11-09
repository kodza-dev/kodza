// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Feature Compare
// "Without" and "with" on one grid, so each answer sits level with the line it answers. Hovering a
// line (or focusing a link in it) lights it on both cards at once, and the light glides from line to
// line. Too narrow for two cards, the script writes a switch above a single card: picking the other
// side draws the ink over the card like a curtain, and each line rolls over to its other answer as
// the curtain's edge reaches it; the two answers share one cell, so the height never jumps.
// data-side="with" starts on your side. Without the script, the two cards stay side by side.
// The section plays its entrance once, as it comes into view: the label rises, the title line after
// line, each out of its own mask, the intro comes up; then the cards rise into place and the lines
// come up one after another (--table: the pill rises, the rows come up, each mark draws in). In
// --table too, the row under the pointer lights up across the table, and the light glides.
// "kodza:replay" plays it again. The timings are the constants under SELECTOR, the texts in WORDS.
(() => {
  const SELECTOR = '.kodza-feature-compare';
  // Texts the script writes, each one replaced by a data-text-<key> attribute on the section
  // (data-text-switch="Compare"): the switch's name for screen readers, and its two options when the
  // cards have no name
  const WORDS = { switch: 'Compare', without: 'Without', with: 'With' };
  // Lighting a line, in ms (each one times the site's pace):
  const BAND = 380; // the light gliding from one line to the next
  // The phone switch:
  const CURTAIN = 900; // the ink drawing over the card, or back
  const ROLL = 560; // each line rolling over to its other answer, as the ink's edge reaches it
  // The entrance. The head, as Section Intro plays it:
  const LABEL = 1000; // the label rising out of its mask
  const TITLE = 1170; // each title line…
  const TITLE_AT = 110; // …the first one starting here…
  const TITLE_STEP = 125; // …and the next a beat later
  const INTRO = 900; // the intro coming up…
  const INTRO_AT = 450;
  // The board:
  const CARD = 1200; // each card rising into place…
  const CARD_FADE = 800; // …and coming up out of the page, a little sooner
  const CARD_RISE = 24; // px it rises
  const CARD_STEP = 90; // …the ink one a beat after the paper one
  const SIDE_AT = 220; // the two names coming up
  const ROW = 760; // each line coming up…
  const ROW_AT = 320; // …the first one here…
  const ROW_STEP = 80; // …the next ones a beat later
  // --table:
  const MARK = 520; // each mark drawing in…
  const MARK_AT = 200; // …this long after its row…
  const MARK_STEP = 70; // …one after the other across the row
  const PART = 120; // between two parts that come into view together
  const ENTER = '0px 0px -12% 0px'; // a part plays once its top is this far into the screen
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const FOLD = [0.65, 0, 0.35, 1];
  const FOLD_EASE = `cubic-bezier(${FOLD.join(', ')})`;
  // The phone curtain: it gets going at once, then settles long
  const DRAW = [0.45, 0, 0.15, 1];
  const DRAW_EASE = `cubic-bezier(${DRAW.join(', ')})`;
  const GLIDE = 'cubic-bezier(0.6, 0, 0.1, 1)'; // slow start, long settle
  const SOFT = 'cubic-bezier(0.25, 1, 0.5, 1)';
  // The cards, the pill and the marks are drawn on ::before and ::after: browsers that cannot
  // animate them show them, and swap the sides at once
  const PSEUDO = typeof KeyframeEffect !== 'undefined' && 'pseudoElement' in KeyframeEffect.prototype;
  // Rising out of its own box, no wrapper needed: the box clips what is still below its bottom edge
  // (with room for the descenders and the side bearings)
  const FULL = 'inset(-0.2em -0.1em -0.2em -0.1em)';
  const RISE = [
    { transform: 'translateY(calc(100% + 0.2em))', clipPath: 'inset(-0.2em -0.1em 100% -0.1em)' },
    { transform: 'none', clipPath: FULL },
  ];
  // And out at the bottom (at the top, roll() clips under the cell's padding)
  const OUT_DOWN = [
    { transform: 'none', clipPath: FULL, visibility: 'visible' },
    { transform: 'translateY(calc(100% + 0.2em))', clipPath: 'inset(-0.2em -0.1em calc(100% + 0.2em) -0.1em)', visibility: 'visible' },
  ];
  const UP = (px) => [{ opacity: 0, transform: `translateY(${px}px)` }, { opacity: 1, transform: 'none' }];
  // When a cubic-bezier easing reaches a given progress, as a share of its duration
  const bez = (a, b, u) => 3 * a * u * (1 - u) ** 2 + 3 * b * u * u * (1 - u) + u ** 3;
  const timeAt = ([x1, y1, x2, y2], p) => {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i += 1) {
      const u = (lo + hi) / 2;
      if (bez(y1, y2, u) < p) lo = u;
      else hi = u;
    }
    return bez(x1, x2, (lo + hi) / 2);
  };
  let groups = 0; // each switch's radios get their own name

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers, timers and animations stop on
  // its 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const board = root.querySelector('.kodza-feature-compare__board');
    const wrap = root.querySelector('.kodza-feature-compare__table-wrap');
    const rows = board ? [...board.querySelectorAll('.kodza-feature-compare__row')] : [];
    const radiusOf = (el, pseudo) => parseFloat(getComputedStyle(el, pseudo).borderTopLeftRadius) || 0;
    let sw = null;
    const narrow = () => !!sw && getComputedStyle(sw).display !== 'none';

    // Lighting a line under the pointer or the focus: bands on the line, gliding from line to line.
    // Where the bands are not shown (a phone), nothing lights up
    const lightUp = (box, keys, lineOf, off = () => false) => {
      const bands = keys.map((key) => {
        const band = document.createElement('span');
        band.className = `kodza-feature-compare__band kodza-feature-compare__band--${key}`;
        band.setAttribute('aria-hidden', 'true');
        box.append(band);
        return band;
      });
      // A line's top in the box, through the table it may sit in
      const topOf = (line) => {
        let y = 0;
        for (let el = line; el && el !== box; el = el.offsetParent) y += el.offsetTop;
        return y;
      };
      let lit = null;
      const place = (band, line, glide) => {
        const to = { transform: `translateY(${topOf(line) + 4}px)`, height: `${line.offsetHeight - 8}px` };
        const now = getComputedStyle(band);
        const from = { transform: now.transform, height: now.height };
        band.getAnimations().forEach((a) => a.transitionProperty || a.cancel()); // the fade stays
        Object.assign(band.style, to);
        if (glide) band.animate([from, to], { duration: BAND * pace, easing: EASE });
      };
      const light = (line) => {
        if (line === lit) return;
        const was = lit;
        lit?.classList.remove('is-lit');
        lit = line;
        if (!line) return bands.forEach((band) => band.classList.remove('is-on'));
        line.classList.add('is-lit');
        bands.forEach((band) => {
          place(band, line, !!was && !still);
          band.classList.add('is-on');
        });
      };
      const at = (el) => (el && box.contains(el) && lineOf(el)) || null;
      const out = () => off() || getComputedStyle(bands[0]).display === 'none';
      box.addEventListener('pointerover', (event) => {
        if (event.pointerType === 'mouse' && !out()) light(at(event.target));
      }, { signal });
      box.addEventListener('pointerleave', () => light(out() ? null : at(document.activeElement)), { signal });
      box.addEventListener('focusin', (event) => {
        if (!out()) light(at(event.target));
      }, { signal });
      box.addEventListener('focusout', (event) => {
        if (!box.contains(event.relatedTarget)) light(null);
      }, { signal });
      // A new width moves the lines: the light goes out rather than sit in the wrong place
      const ro = new ResizeObserver(() => light(null));
      ro.observe(box);
      signal.addEventListener('abort', () => ro.disconnect());
    };

    if (board) {
      // The switch, above the board: two native radios named after the cards
      let side = root.dataset.side === 'with' ? 'with' : 'without';
      const nameOf = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`]
        || board.querySelector(`.kodza-feature-compare__side--${key} .kodza-feature-compare__name`)?.textContent.trim()
        || WORDS[key];
      groups += 1;
      sw = document.createElement('div');
      sw.className = 'kodza-feature-compare__switch';
      sw.setAttribute('role', 'radiogroup');
      sw.setAttribute('aria-label', word('switch'));
      // The two options, then the same names in paper on the pill of ink, so they change colour
      // exactly at the pill's edges
      const keys = ['without', 'with'];
      sw.innerHTML = `${keys.map((key) => `<label class="kodza-feature-compare__option"><input class="kodza-feature-compare__input" type="radio" name="kodza-feature-compare-${groups}" value="${key}"><span></span></label>`).join('')}<span class="kodza-feature-compare__thumb" aria-hidden="true"><span></span><span></span></span>`;
      const inputs = sw.querySelectorAll('.kodza-feature-compare__input');
      const twins = sw.querySelectorAll('.kodza-feature-compare__thumb > span');
      keys.forEach((key, i) => {
        inputs[i].checked = key === side;
        inputs[i].nextElementSibling.textContent = nameOf(key);
        twins[i].textContent = nameOf(key);
      });
      root.classList.toggle('is-with', side === 'with');
      rows.forEach((row) => row.classList.toggle('is-with', side === 'with'));
      board.before(sw);

      // Lighting a line: a band on each card, gliding from line to line
      lightUp(board, ['without', 'with'], (el) => el.closest?.('.kodza-feature-compare__row'), narrow);

      // Changing sides on a phone. The ink's bottom edge, as a share of the board's height: 0 is the
      // paper card, 1 is the card of ink
      let curtain = null;
      let timers = [];
      const clear = () => {
        timers.forEach(clearTimeout);
        timers = [];
      };
      const edgeNow = () => {
        if (!curtain) return side === 'with' ? 1 : 0;
        const p = curtain.animation.effect.getComputedTiming().progress;
        return p == null ? curtain.to : curtain.from + (curtain.to - curtain.from) * p;
      };
      // One line rolls over: the new answer arrives from the side the ink comes from
      const roll = (row, opening) => {
        row.getAnimations({ subtree: true }).forEach((a) => a.cancel());
        row.classList.toggle('is-with', opening);
        const incoming = row.querySelector(`.kodza-feature-compare__cell--${opening ? 'with' : 'without'}`);
        const outgoing = row.querySelector(`.kodza-feature-compare__cell--${opening ? 'without' : 'with'}`);
        // Coming in or going out at the top, an answer shows only below its own top padding: it
        // never runs over the topic just above it
        const under = (cell) => `${parseFloat(getComputedStyle(cell).paddingTop) || 0}px`;
        const hidden = (top) => `inset(calc(100% + ${top}) -0.1em -0.2em -0.1em)`;
        const shown = (top) => `inset(${top} -0.1em -0.2em -0.1em)`;
        if (incoming) {
          const top = under(incoming);
          incoming.animate(opening
            ? [{ transform: 'translateY(-100%)', clipPath: hidden(top) }, { transform: 'none', clipPath: shown(top) }]
            : RISE, { duration: ROLL * pace, easing: EASE });
        }
        if (outgoing) {
          const top = under(outgoing);
          outgoing.animate(opening
            ? OUT_DOWN
            : [{ transform: 'none', clipPath: shown(top), visibility: 'visible' }, { transform: 'translateY(-100%)', clipPath: hidden(top), visibility: 'visible' }],
          { duration: ROLL * 0.8 * pace, easing: FOLD_EASE });
        }
      };
      const turn = (to) => {
        if (to === side) return;
        const from = edgeNow();
        const opening = to === 'with';
        const target = opening ? 1 : 0;
        side = to;
        clear();
        curtain?.animation.cancel();
        curtain = null;
        root.classList.toggle('is-with', opening);
        if (still || !PSEUDO || !narrow()) {
          return rows.forEach((row) => {
            row.getAnimations({ subtree: true }).forEach((a) => a.cancel());
            row.classList.toggle('is-with', opening);
          });
        }
        const radius = radiusOf(board, '::after');
        const clip = (edge) => `inset(0px 0px ${((1 - edge) * 100).toFixed(3)}% 0px round ${radius}px)`;
        const duration = CURTAIN * pace * Math.max(0.45, Math.abs(target - from));
        const animation = board.animate([{ clipPath: clip(from) }, { clipPath: clip(target) }], { duration, easing: DRAW_EASE, pseudoElement: '::after' });
        curtain = { animation, from, to: target };
        animation.onfinish = () => {
          if (curtain?.animation === animation) curtain = null;
        };
        // Each line turns over as the edge reaches its answer: the top of it on the way down, the
        // bottom of it on the way back up
        const height = board.offsetHeight || 1;
        rows.forEach((row) => {
          if (row.classList.contains('is-with') === opening) return;
          const cell = row.querySelector('.kodza-feature-compare__cell') || row;
          const y = (row.offsetTop + cell.offsetTop + (opening ? 0 : cell.offsetHeight)) / height;
          const share = Math.min(1, Math.max(0, (y - from) / (target - from)));
          timers.push(setTimeout(() => roll(row, opening), timeAt(DRAW, share) * duration));
        });
      };
      sw.addEventListener('change', (event) => {
        if (event.target.checked) turn(event.target.value);
      }, { signal });
      signal.addEventListener('abort', () => {
        clear();
        curtain?.animation.cancel();
        rows.forEach((row) => row.getAnimations({ subtree: true }).forEach((a) => a.cancel()));
      });
    }

    // --table: the row under the pointer lights up across the table, a little lighter where it
    // crosses your column, and the light glides from row to row
    if (wrap) lightUp(wrap, ['row', 'pill'], (el) => el.closest?.('tbody > tr'));

    // The entrance
    const parts = [...root.querySelectorAll('.kodza-feature-compare__head, .kodza-feature-compare__board, .kodza-feature-compare__table-wrap')];
    if (still) return parts.forEach((part) => part.classList.add('is-shown'));
    let running = [];
    const stop = () => {
      running.forEach((a) => a.cancel());
      running = [];
    };
    // The entrance of one part, `at` ms after the first one of its batch
    const play = (part, at) => {
      const animate = (el, keyframes, options) => {
        if (el) running.push(el.animate(keyframes, { easing: GLIDE, fill: 'backwards', ...options, duration: options.duration * pace, delay: (at + (options.delay || 0)) * pace }));
      };
      // A card, or the pill, rises a little into place as it comes up out of the page: a solid
      // block of ink wiped in reads too hard
      const opens = (el, pseudo, delay) => {
        if (!PSEUDO) return;
        animate(el, [{ transform: `translateY(${CARD_RISE}px) scale(0.98)` }, { transform: 'none' }], { duration: CARD, delay, easing: EASE, pseudoElement: pseudo });
        animate(el, [{ opacity: 0 }, { opacity: 1 }], { duration: CARD_FADE, delay, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', pseudoElement: pseudo });
      };
      part.classList.add('is-shown');
      if (part.matches('.kodza-feature-compare__head')) {
        const q = (s) => part.querySelector(`:scope > ${s}`);
        animate(q('.kodza-feature-compare__eyebrow'), RISE, { duration: LABEL });
        // The title, line after line, each out of its own mask (written as lines, like Section
        // Intro's); a title written in one piece rises in one piece
        const lines = [...part.querySelectorAll('.kodza-feature-compare__line > .kodza-feature-compare__rise')];
        if (lines.length) lines.forEach((line, i) => animate(line, [{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration: TITLE, delay: TITLE_AT + i * TITLE_STEP }));
        else animate(q('.kodza-feature-compare__title'), RISE, { duration: TITLE, delay: TITLE_AT });
        // The intro waits for the last line to be on its way
        animate(q('.kodza-feature-compare__intro'), UP(20), { duration: INTRO, delay: INTRO_AT + Math.max(0, lines.length - 2) * TITLE_STEP, easing: SOFT });
        return;
      }
      if (part === board) {
        // The cards rise into place (on a phone, the ink only if it is the side shown), the
        // names come up, then the lines one after another
        const one = narrow();
        opens(part, '::before', 0);
        if (!one || root.classList.contains('is-with')) opens(part, '::after', CARD_STEP);
        part.querySelectorAll('.kodza-feature-compare__side').forEach((side, i) => animate(side, UP(14), { duration: ROW, delay: SIDE_AT + i * CARD_STEP, easing: SOFT }));
        if (one) animate(sw, UP(10), { duration: ROW, delay: SIDE_AT, easing: SOFT });
        rows.forEach((row, i) => animate(row, UP(14), { duration: ROW, delay: ROW_AT + i * ROW_STEP, easing: SOFT }));
        return;
      }
      // --table: the pill rises, the rows come up, and each mark draws in from the left
      opens(part, '::before', 0);
      part.querySelectorAll('tr').forEach((tr, i) => {
        const at = ROW_AT + i * ROW_STEP;
        animate(tr, UP(12), { duration: ROW, delay: at, easing: SOFT });
        if (PSEUDO) {
          tr.querySelectorAll('td[data-mark]').forEach((td, j) => animate(td, [{ clipPath: 'inset(0px 100% 0px 0px)' }, { clipPath: 'inset(0px)' }], { duration: MARK, delay: at + MARK_AT + j * MARK_STEP, easing: FOLD_EASE, pseudoElement: '::before' }));
        }
      });
    };

    // What comes into view together plays in the order of the page, part after part
    const io = new IntersectionObserver((entries) => {
      entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target)
        .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
        .forEach((part, i) => {
          io.unobserve(part);
          play(part, i * PART);
        });
    }, { rootMargin: ENTER });
    const watch = () => parts.forEach((part) => io.observe(part));
    signal.addEventListener('abort', () => {
      io.disconnect();
      stop();
    });
    // Replayed: the parts on screen play again now, the others wait to be scrolled to
    root.addEventListener('kodza:replay', () => {
      io.disconnect();
      stop();
      parts.forEach((part) => part.classList.remove('is-shown'));
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
