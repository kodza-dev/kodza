// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Bento Grid
// The head plays its entrance once, as it comes into view: the label rises, the title line after
// line, each out of its own mask, then the intro comes up. Then the boxes open from their top edge
// in the order they are read: the image settles from a little closer, the label, the name and the
// text follow, a figure rolls to its value digit by digit. The two demos built in play once as
// their box opens (the two keys pressed, the results come up; the switch turns on, the address
// rises), and again when the mouse comes onto their box. "kodza:replay" plays the boxes on screen
// again, and sets the others waiting to be scrolled to. The hover on a linked box is CSS. The
// timings are the constants under SELECTOR.
(() => {
  const SELECTOR = '.kodza-bento-grid';
  // The entrance, in ms (each one times the site's pace). The head, as Section Intro plays it:
  const LABEL = 1000; // a label rising out of its mask
  const TITLE = 1170; // each title line…
  const TITLE_AT = 110; // …the first one starting here…
  const TITLE_STEP = 125; // …and the next a beat later
  const INTRO_AT = 450; // the intro coming up
  const TEXT = 900; // a text coming up
  // The boxes:
  const BOX = 1000; // a box opening from its top edge
  const IMAGE = 1400; // its image settling from a little closer
  const LABEL_AT = 120; // its label…
  const NAME = 1000; // …its name rising out of its own box…
  const NAME_AT = 200;
  const TEXT_AT = 320; // …its text…
  const TAG_AT = 500; // …the caption on an image
  const ROLL = 1500; // a figure rolling to its value…
  const ROLL_STEP = 160; // …each digit a little longer than the one on its left
  const ROLL_AT = 150;
  const DEMO_AT = 450; // a demo playing, once its box is open enough
  const HEAD_STEP = 300; // between the head and the first box that comes into view with it…
  const STEP = 90; // …and between two boxes, in the order they are read
  const ENTER = '0px 0px -12% 0px'; // a box plays once its top is this far into the screen
  // The demos:
  const PRESS = 420; // a key pressed…
  const PRESS_STEP = 160; // …the second one after the first
  const RESULTS_AT = 380; // the results coming up…
  const RESULT_STEP = 60; // …row after row
  const SWITCH = 560; // the switch turning on…
  const URL_AT = 240; // …the address rising after it
  const OUT = 220; // played again: what comes back goes out first…
  const SWITCH_OUT = 300; // …the switch turning off…
  const AGAIN = 420; // …and on again here
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const GLIDE = 'cubic-bezier(0.6, 0, 0.1, 1)'; // slow start, long settle
  const SOFT = 'cubic-bezier(0.25, 1, 0.5, 1)';
  const ROLLED = 'cubic-bezier(0.16, 1, 0.3, 1)'; // a figure: fast, then a long slow landing
  const TOGGLE = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const LEAVE = 'cubic-bezier(0.5, 0, 0.75, 0)';
  // Rising out of its own box, no wrapper needed: the box clips what is still below its bottom edge
  // (with room for the descenders and the side bearings)
  const RISE = [
    { transform: 'translateY(calc(100% + 0.2em))', clipPath: 'inset(-0.2em -0.1em 100% -0.1em)' },
    { transform: 'none', clipPath: 'inset(-0.2em -0.1em -0.2em -0.1em)' },
  ];
  const UP = (px) => [{ opacity: 0, transform: `translateY(${px}px)` }, { opacity: 1, transform: 'none' }];
  const DIGIT = 1.1; // the height of a digit's window, in em (the CSS sets the same)

  const span = (name, text) => {
    const el = document.createElement('span');
    if (name) el.className = `kodza-bento-grid__${name}`;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  // A figure, set as digits that roll: each digit in its own window, over a strip of 0 to 9 that
  // turns once or more (more to the right) and lands on it. Screen readers keep the figure as
  // written. The strips are left landed: the roll plays from 0 back to there
  const split = (figure) => {
    const text = figure.textContent.trim();
    const count = [...text].filter((ch) => /\d/.test(ch)).length;
    const shown = span();
    shown.setAttribute('aria-hidden', 'true');
    const strips = [];
    [...text].forEach((ch) => {
      if (!/\d/.test(ch)) return shown.append(span('char', ch));
      const rank = strips.length;
      const turns = 1 + Math.round((rank / Math.max(1, count - 1)) * 2);
      const stop = turns * 10 + Number(ch);
      const strip = span('strip');
      for (let i = 0; i < (turns + 1) * 10; i += 1) strip.append(span(null, String(i % 10)));
      strip.style.transform = `translateY(${-stop * DIGIT}em)`;
      const digit = span('digit');
      digit.append(span('fit', ch), strip);
      shown.append(digit);
      strips.push({ strip, stop, rank });
    });
    figure.replaceChildren(shown, span('sr', text));
    return strips;
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const head = root.querySelector('.kodza-bento-grid__head');
    const cells = [...root.querySelectorAll('.kodza-bento-grid__cell')];
    const parts = head ? [head, ...cells] : cells;
    const figures = new Map();
    cells.forEach((cell) => {
      const strips = [...cell.querySelectorAll('.kodza-bento-grid__figure')].flatMap(split);
      if (strips.length) figures.set(cell, strips);
    });
    if (still) return parts.forEach((part) => part.classList.add('is-shown'));
    const demoCells = cells.filter((cell) => cell.querySelector('.kodza-bento-grid__key, .kodza-bento-grid__thumb'));

    let running = [];
    const track = (animation) => {
      running.push(animation);
      animation.onfinish = () => {
        running = running.filter((a) => a !== animation);
      };
      return animation;
    };
    const stop = () => {
      running.forEach((a) => a.cancel());
      running = [];
    };
    const demos = new Map(); // a demo box → its demo's animations, to know when it is still playing

    // A demo built in, played `at` ms from now. `again` when it is on screen already (the mouse
    // came onto its box): what has to come back goes out first
    const playDemo = (cell, at, again) => {
      const list = [];
      demos.set(cell, list);
      const animate = (el, keyframes, options) => {
        if (el) list.push(track(el.animate(keyframes, { fill: 'backwards', ...options, duration: options.duration * pace, delay: (at + (options.delay || 0)) * pace })));
      };
      // Comes in from `from` at `delay`; on screen already, it first goes out to `from` and waits there
      const enter = (el, [from, to], delay, duration, easing, out = OUT) => {
        if (!again) return animate(el, [from, to], { duration, delay, easing });
        const total = delay + duration;
        animate(el, [
          { ...to, offset: 0, easing: LEAVE },
          { ...from, offset: Math.min(out, delay) / total },
          { ...from, offset: delay / total, easing },
          { ...to, offset: 1 },
        ], { duration: total, easing: 'linear' });
      };
      // The shortcut: the two keys pressed one after the other, then the results come up
      cell.querySelectorAll('.kodza-bento-grid__key').forEach((key, i) => {
        const press = { duration: PRESS, delay: i * PRESS_STEP, easing: 'ease-in-out', fill: 'none' };
        const shadow = getComputedStyle(key, '::after').boxShadow;
        const pressed = shadow.replace('0px 2px 0px 0px', '0px 0px 0px 0px');
        animate(key, [{ transform: 'none' }, { transform: 'translateY(2px)', offset: 0.4 }, { transform: 'none' }], press);
        animate(key, [{ boxShadow: shadow }, { boxShadow: pressed, offset: 0.4 }, { boxShadow: shadow }], { ...press, pseudoElement: '::after' });
      });
      enter(cell.querySelector('.kodza-bento-grid__results'), UP(10), RESULTS_AT, 700, SOFT);
      cell.querySelectorAll('.kodza-bento-grid__result').forEach((row, i) => enter(row, UP(6), RESULTS_AT + RESULT_STEP + i * RESULT_STEP, 600, SOFT));
      // The switch: the ink grows from behind the thumb as it slides across, then the address rises
      const thumb = cell.querySelector('.kodza-bento-grid__thumb');
      const rail = thumb?.parentElement;
      if (!thumb || !rail) return;
      const inset = thumb.offsetTop;
      const left = thumb.offsetLeft;
      const right = rail.offsetWidth - inset - thumb.offsetWidth;
      const base = again ? AGAIN : 0;
      enter(thumb, [{ transform: `translateX(${inset - left}px)` }, { transform: 'none' }], base, SWITCH, TOGGLE, SWITCH_OUT);
      enter(cell.querySelector('.kodza-bento-grid__fill'), [
        { clipPath: `inset(${inset}px ${right}px ${inset}px ${inset}px round ${thumb.offsetWidth / 2}px)` },
        { clipPath: `inset(0px 0px 0px 0px round ${rail.offsetHeight / 2}px)` },
      ], base, SWITCH, TOGGLE, SWITCH_OUT);
      enter(cell.querySelector('.kodza-bento-grid__url'), RISE, base + URL_AT, 800, GLIDE);
    };

    // The entrance of the head or of one box, `at` ms after the first one of its batch
    const play = (part, at) => {
      const animate = (el, keyframes, options) => {
        if (el) track(el.animate(keyframes, { easing: GLIDE, fill: 'backwards', ...options, duration: options.duration * pace, delay: (at + (options.delay || 0)) * pace }));
      };
      part.classList.add('is-shown');
      if (part === head) {
        const q = (s) => part.querySelector(`:scope > ${s}`);
        animate(q('.kodza-bento-grid__eyebrow'), RISE, { duration: LABEL });
        // The title, line after line, each out of its own mask (written as lines, like Section
        // Intro's); a title written in one piece rises in one piece
        const lines = [...part.querySelectorAll('.kodza-bento-grid__line > .kodza-bento-grid__rise')];
        if (lines.length) lines.forEach((line, i) => animate(line, [{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration: TITLE, delay: TITLE_AT + i * TITLE_STEP }));
        else animate(q('.kodza-bento-grid__title'), RISE, { duration: TITLE, delay: TITLE_AT });
        // The intro waits for the last line to be on its way
        animate(q('.kodza-bento-grid__intro'), UP(20), { duration: TEXT, delay: INTRO_AT + Math.max(0, lines.length - 2) * TITLE_STEP, easing: SOFT });
        return;
      }
      const q = (s) => part.querySelector(s);
      // The box opens from its top edge, its corners kept round all the way
      const round = getComputedStyle(part).borderTopLeftRadius;
      animate(part, [{ clipPath: `inset(0px 0px 100% 0px round ${round})` }, { clipPath: `inset(0px 0px 0px 0px round ${round})` }], { duration: BOX });
      animate(q('.kodza-bento-grid__media img'), [{ transform: 'scale(1.12)' }, { transform: 'none' }], { duration: IMAGE });
      animate(q('.kodza-bento-grid__label'), RISE, { duration: LABEL, delay: LABEL_AT });
      animate(q('.kodza-bento-grid__name'), RISE, { duration: NAME, delay: NAME_AT });
      animate(q('.kodza-bento-grid__text'), UP(14), { duration: TEXT, delay: TEXT_AT, easing: SOFT });
      part.querySelectorAll('.kodza-bento-grid__rows > *').forEach((row, i) => animate(row, UP(8), { duration: TEXT, delay: TEXT_AT + i * RESULT_STEP, easing: SOFT }));
      animate(q('.kodza-bento-grid__tag'), UP(10), { duration: TEXT, delay: TAG_AT, easing: SOFT });
      (figures.get(part) || []).forEach(({ strip, stop: landed, rank }) => animate(strip, [{ transform: 'translateY(0)' }, { transform: `translateY(${-landed * DIGIT}em)` }], { duration: ROLL + rank * ROLL_STEP, delay: ROLL_AT, easing: ROLLED }));
      if (demoCells.includes(part)) playDemo(part, at + DEMO_AT, false);
    };

    // What comes into view together plays in the order it is read: from the top, and at the same
    // height from the left
    const io = new IntersectionObserver((entries) => {
      let at = 0;
      entries.filter((entry) => entry.isIntersecting)
        .sort((a, b) => {
          const dy = a.boundingClientRect.top - b.boundingClientRect.top;
          return Math.abs(dy) < 2 ? a.boundingClientRect.left - b.boundingClientRect.left : dy;
        })
        .forEach(({ target }) => {
          io.unobserve(target);
          play(target, at);
          at += target === head ? HEAD_STEP : STEP;
        });
    }, { rootMargin: ENTER });
    const watch = () => parts.forEach((part) => io.observe(part));
    signal.addEventListener('abort', () => {
      io.disconnect();
      stop();
    });
    // A demo plays again when the mouse comes onto its box, once it has finished
    demoCells.forEach((cell) => cell.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse' || !cell.classList.contains('is-shown')) return;
      if ((demos.get(cell) || []).some((a) => a.playState === 'running')) return;
      playDemo(cell, 0, true);
    }, { signal }));
    // Replayed: the boxes on screen play again now, the others wait to be scrolled to
    root.addEventListener('kodza:replay', () => {
      io.disconnect();
      stop();
      demos.clear();
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
