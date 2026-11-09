// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Feature Accordion
// A product tour: the features in a list, beside one screen. Opening a feature folds the one that
// was open, its text fading as it closes while the new text comes up; its visual opens on the
// screen from the top, the curtain sliding down over the one it covers, the picture settling from
// a little closer. The card on the screen rolls its figure (only the characters that change) and
// its label to the new ones, and the counter under it rolls to the new number.
// With data-interval (ms), each feature waits that long, its hairline filling as the clock, then
// hands over to the next one. Hovering the tour, reaching it with the keyboard or the pause button
// holds it; a feature picked by hand stops it (the button starts it again). It never moves on by
// itself on a narrow screen, where the list stacks and each visual goes inside its feature, nor
// with reduced motion.
// --tabs: the features as tabs above one wide visual, the pill sliding from one to the next and the
// text under the visual, the old one leaving upward as the new one comes up.
// The section plays its entrance once, as it comes into view: the label rises, the title line after
// line, each out of its own mask, the intro comes up; then the features one after another, the open
// one's visual opening, its card coming up last.
// "kodza:replay" goes back to the first feature and plays the entrance again.
// The timings are the constants under SELECTOR.
(() => {
  const SELECTOR = '.kodza-feature-accordion';
  const P = 'kodza-feature-accordion__';
  // Changing feature, in ms (each one times the site's pace):
  const OPEN = 640; // the new panel opening…
  const FOLD = 480; // …while the old one folds…
  const FADE = 240; // …its text fading
  const TEXT = 800; // the new text coming up…
  const TEXT_AT = 120;
  const LEAVE = 300; // --tabs: the old text leaving upward
  const CURTAIN = 1100; // the visual opening from the top…
  const ZOOM = 1800; // …the picture settling from a little closer
  const ZOOM_PICTURE = 1.16;
  const ZOOM_CODE = 1.06; // a screen of code barely moves: it has to stay readable
  const ROLL = 620; // a figure or a word rolling to the next one…
  const ROLL_GAP = 60; // …the new word a beat after the old one leaves…
  const CHAR_STEP = 40; // …one character after another
  const VALUE_AT = 140; // the card's figure…
  const LABEL_AT = 200; // …then its label
  const CLEAR = 300; // a hairline's fill fading back once its feature is done
  const KEEP = 96; // stacked: a feature opened by hand never sits closer than this to the top of the screen
  // The entrance. The head, as Section Intro plays it:
  const LABEL = 1000; // the label rising out of its mask
  const TITLE = 1170; // each title line…
  const TITLE_AT = 110; // …the first one starting here…
  const TITLE_STEP = 125; // …and the next a beat later
  const INTRO = 900; // the intro coming up…
  const INTRO_AT = 450;
  // The tour:
  const NAME = 1000; // each feature's name rising out of its box…
  const NAME_AT = 100;
  const NAME_STEP = 70; // …a beat after the one above
  const LINE = 1100; // its hairline drawing out from the left
  const BAR = 800; // the tabs coming up
  const OPEN_AT = 200; // the open feature's visual…
  const OPEN_TEXT_AT = 320; // …and its text
  const CARD = 800; // the card coming up on the visual…
  const CARD_AT = 700;
  const CONTROLS = 600; // …and the counter and the pause button fading in
  const CONTROLS_AT = 800;
  const COLUMN = 140; // between the head and the tour when they come into view together
  const ENTER = '0px 0px -12% 0px'; // a part plays once its top is this far into the screen
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion. The tour's interval is reading time:
  // it does not
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const FOLD_EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const GLIDE = 'cubic-bezier(0.6, 0, 0.1, 1)'; // slow start, long settle
  const SOFT = 'cubic-bezier(0.25, 1, 0.5, 1)';
  // Rising out of its own box, no wrapper needed: the box clips what is still below its bottom edge
  // (with room for the descenders and the side bearings)
  const RISE = [
    { transform: 'translateY(calc(100% + 0.2em))', clipPath: 'inset(-0.2em -0.1em 100% -0.1em)' },
    { transform: 'none', clipPath: 'inset(-0.2em -0.1em -0.2em -0.1em)' },
  ];
  const UP = (px) => [{ opacity: 0, transform: `translateY(${px}px)` }, { opacity: 1, transform: 'none' }];
  const DRAW = [{ transform: 'scaleX(0)' }, { transform: 'none' }];
  const FADE_IN = [{ opacity: 0 }, { opacity: 1 }];
  const make = (tag, part, text) => {
    const el = document.createElement(tag);
    if (part) el.className = P + part;
    if (text != null) el.textContent = text;
    return el;
  };
  let uid = 0;

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and animations stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const tabs = root.classList.contains('kodza-feature-accordion--tabs');
    const q = (scope, part) => scope.querySelector(`.${P}${part}`);
    const body = q(root, 'body');
    const list = q(root, 'list');
    const stage = q(root, 'stage');
    const screen = stage && q(stage, 'screen');
    const pause = q(root, 'pause');
    if (!body || !list) return;
    const triggers = [...list.querySelectorAll(`.${P}trigger`)];
    const panels = [...root.querySelectorAll(`.${P}panel`)];
    if (!triggers.length || triggers.length !== panels.length) return;
    const ids = `kodza-feature-accordion-${++uid}`;
    // Each feature: what gets is-open (the item, or the tab's panel), its parts and its card
    const items = triggers.map((trigger, i) => {
      const panel = panels[i];
      const box = tabs ? panel : trigger.closest(`.${P}item`) || panel;
      const media = q(panel, 'media');
      const hold = media && q(media, 'hold');
      const pic = hold?.firstElementChild;
      return {
        trigger, panel, box, media, hold, pic,
        text: q(panel, 'text'),
        curtain: media && q(media, 'curtain'),
        zoom: pic?.matches(`.${P}code`) ? ZOOM_CODE : ZOOM_PICTURE,
        value: media ? (q(media, 'value')?.textContent || '').trim() : '',
        label: media ? (q(media, 'label')?.textContent || '').trim() : '',
      };
    });
    let current = Math.max(0, tabs
      ? triggers.findIndex((t) => t.getAttribute('aria-selected') === 'true')
      : items.findIndex((item) => item.box.classList.contains('is-open')));

    // The roles: an accordion that keeps one feature open (its panels are not regions: the button
    // says what it opens, and a page full of regions is noise), or tabs
    items.forEach((item, i) => {
      item.trigger.id = item.trigger.id || `${ids}-${tabs ? 'tab' : 'trigger'}-${i + 1}`;
      item.panel.id = item.panel.id || `${ids}-panel-${i + 1}`;
      item.trigger.setAttribute('aria-controls', item.panel.id);
      if (tabs) {
        item.panel.setAttribute('role', 'tabpanel');
        item.panel.setAttribute('aria-labelledby', item.trigger.id);
        item.trigger.setAttribute('role', 'tab');
        item.panel.tabIndex = 0;
      } else {
        // The hairline under the feature, and its fill: the tour's clock
        item.track = make('span', 'track');
        item.fill = make('span', 'fill');
        item.track.setAttribute('aria-hidden', 'true');
        item.track.append(item.fill);
        item.box.append(item.track);
      }
    });
    if (tabs) {
      list.setAttribute('role', 'tablist');
      const title = q(root, 'title')?.textContent.replace(/\s+/g, ' ').trim();
      if (title) list.setAttribute('aria-label', title);
    }

    // Sizes in the page's pixels: a parent scaled by a transform (a theme, a thumbnail) changes
    // what the screen shows, not the layout the motion is measured in
    const scaleOf = () => {
      const width = root.offsetWidth;
      return width ? root.getBoundingClientRect().width / width : 1;
    };
    // An animation of the current change (`moving`) or of the entrance (`running`), `at` ms after
    // its start: durations and delays time the site's pace
    const runner = (bag, at = 0) => (el, keyframes, options) => {
      if (!el) return null;
      const animation = el.animate(keyframes, { easing: GLIDE, fill: 'backwards', ...options, duration: options.duration * pace, delay: (at + (options.delay || 0)) * pace });
      bag.push(animation);
      return animation;
    };

    // A figure or a word that rolls to the next one: the old one leaves upward, the new one comes up
    // from below. A figure of the same length (split) rolls only the characters that change, one
    // after another; anything else rolls whole, its box sliding to the new width
    const roller = (box, split) => {
      box.classList.add(`${P}roll`);
      const inner = make('span', 'in');
      box.append(inner);
      let now = null;
      let anims = [];
      const run = runner(anims);
      const chars = (text) => [...text].map((c) => (c === ' ' ? ' ' : c));
      const cell = (c) => {
        const el = make('span', 'cell');
        el.append(make('span', '', c));
        return el;
      };
      const fill = (text) => (split ? inner.replaceChildren(...chars(text).map(cell)) : (inner.textContent = text));
      const draw = (text) => {
        anims.forEach((a) => a.cancel());
        anims.length = 0;
        box.querySelectorAll(`:scope > .${P}out`).forEach((el) => el.remove());
        fill(text);
        now = text;
      };
      signal.addEventListener('abort', () => anims.forEach((a) => a.cancel()));
      return (text, at = 0, instant = false) => {
        if (text === now) return;
        if (now === null || instant || still) return draw(text);
        draw(now); // a roll under way lands where it was going
        const was = now;
        now = text;
        const LEAVE_UP = [{ transform: 'none' }, { transform: 'translateY(-105%)' }];
        const COME_UP = [{ transform: 'translateY(105%)' }, { transform: 'none' }];
        if (split && [...was].length === [...text].length) {
          const next = chars(text);
          let k = 0;
          [...inner.children].forEach((c, j) => {
            const old = c.firstElementChild;
            if (old.textContent === next[j]) return;
            const fresh = make('span', '', next[j]);
            c.append(fresh);
            const delay = at + k++ * CHAR_STEP;
            run(old, LEAVE_UP, { duration: ROLL, delay, easing: EASE, fill: 'forwards' }).onfinish = () => old.remove();
            run(fresh, COME_UP, { duration: ROLL, delay, easing: EASE });
          });
          return;
        }
        const scale = scaleOf();
        const from = box.getBoundingClientRect().width / scale;
        const out = make('span', 'out');
        out.append(...inner.childNodes);
        box.append(out);
        fill(text);
        const to = box.getBoundingClientRect().width / scale;
        run(out, LEAVE_UP, { duration: ROLL, delay: at, easing: EASE, fill: 'forwards' }).onfinish = () => out.remove();
        run(inner, COME_UP, { duration: ROLL, delay: at + ROLL_GAP, easing: EASE });
        if (Math.abs(to - from) > 0.5) run(box, [{ width: `${from}px` }, { width: `${to}px` }], { duration: ROLL, delay: at, easing: EASE });
      };
    };

    // The card on the screen, whose figures roll from one feature to the next (the cards written in
    // each feature stay for screen readers, and for the stacked list), and the counter
    const tally = make('p', 'tally');
    tally.setAttribute('aria-hidden', 'true');
    const value = make('span', 'value');
    const label = make('span', 'label');
    tally.append(value, label);
    screen?.append(tally);
    const rollValue = roller(value, true);
    const rollLabel = roller(label, false);
    const pad = (n) => String(n).padStart(2, '0');
    const counter = make('span', 'counter');
    counter.setAttribute('aria-hidden', 'true');
    const number = make('span');
    counter.append(number, ` / ${pad(items.length)}`);
    const rollNumber = roller(number, true);
    const bar = tabs ? q(root, 'bar') : stage && q(stage, 'bar');
    if (bar) bar.insertBefore(counter, pause && bar.contains(pause) ? pause : null);
    // --tabs: one hairline under the visual, the tour's clock
    let clockTrack = null;
    if (tabs && stage) {
      clockTrack = make('span', 'track');
      clockTrack.setAttribute('aria-hidden', 'true');
      clockTrack.append(make('span', 'fill'));
      stage.append(clockTrack);
    }
    const fillOf = (i) => (tabs ? clockTrack?.firstElementChild : items[i].fill);

    // --tabs: the pill under the selected tab, and its white double cut to the same shape
    let pill = null;
    const place = (scroll = false) => {
      if (!tabs) return;
      const tab = items[current].trigger;
      list.style.removeProperty('--kz-feature-accordion-track');
      const track = list.scrollWidth;
      list.classList.toggle('is-scroll', track > list.clientWidth + 1);
      list.style.setProperty('--kz-feature-accordion-track', `${track}px`);
      list.style.setProperty('--kz-feature-accordion-pill-l', `${tab.offsetLeft}px`);
      list.style.setProperty('--kz-feature-accordion-pill-r', `${track - tab.offsetLeft - tab.offsetWidth}px`);
      if (scroll && list.classList.contains('is-scroll')) {
        list.scrollTo({ left: tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2, behavior: still ? 'auto' : 'smooth' });
      }
    };
    if (tabs) {
      pill = make('span', 'pill');
      pill.setAttribute('aria-hidden', 'true');
      const mirror = make('span', 'mirror');
      mirror.setAttribute('aria-hidden', 'true');
      triggers.forEach((t) => mirror.append(make('span', 'ghost', t.textContent.trim())));
      list.prepend(pill);
      list.append(mirror);
    }

    items.forEach((item) => { item.card = q(item.panel, 'card'); });
    const interval = parseInt(root.dataset.interval, 10) || 0;
    const firstMedia = items.find((item) => item.media)?.media;
    const moving = []; // the change under way
    const running = []; // the entrance
    const halt = () => { moving.forEach((a) => a.cancel()); moving.length = 0; };
    const stop = () => { running.forEach((a) => a.cancel()); running.length = 0; };
    let live = false; // the tour moves on by itself
    let held = false; // the pause button, or a feature picked by hand
    let hovered = false;
    let focused = false;
    let onScreen = false;
    let entered = false;

    // The visual of a feature opens from the top: the curtain slides down over the one it covers,
    // the picture inside it held in place, and settles from a little closer
    const reveal = (animate, item, at) => {
      if (!item.curtain) return null;
      animate(item.hold, [{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: CURTAIN, delay: at });
      animate(item.pic, [{ transform: `scale(${item.zoom})` }, { transform: 'none' }], { duration: ZOOM, delay: at, easing: EASE });
      return animate(item.curtain, [{ transform: 'translateY(-100%)' }, { transform: 'none' }], { duration: CURTAIN, delay: at });
    };

    // ---- The clock: the hairline of the open feature fills while the tour waits on it ----
    let clock = null;
    const fading = new Map();
    const start = () => {
      const fill = fillOf(current);
      if (!fill || fading.has(fill)) return; // its last round is still fading out
      const index = current;
      const animation = fill.animate(DRAW, { duration: interval, easing: 'linear', fill: 'forwards' });
      clock = { fill, animation };
      animation.onfinish = () => {
        if (clock?.animation === animation) show((index + 1) % items.length);
      };
    };
    const sync = () => {
      if (!live) return drop();
      const go = entered && !held && !hovered && !focused && onScreen && !document.hidden;
      if (!clock) return go ? start() : undefined;
      if (!go) clock.animation.pause();
      else if (clock.animation.playState === 'paused') clock.animation.play();
    };
    // The feature changed: the hairline it filled fades out, then empties
    const clear = () => {
      if (!clock) return;
      const { fill, animation } = clock;
      clock = null;
      animation.pause();
      const fade = fill.animate(FADE_IN, { duration: CLEAR * pace, direction: 'reverse', fill: 'forwards' });
      fading.set(fill, { fade, animation });
      fade.onfinish = () => {
        animation.cancel();
        fade.cancel();
        fading.delete(fill);
        sync();
      };
    };
    const drop = () => {
      clock?.animation.cancel();
      clock = null;
      fading.forEach(({ fade, animation }) => { fade.cancel(); animation.cancel(); });
      fading.clear();
    };

    // ---- Opening a feature ----
    function show(index, { user = false, instant = false } = {}) {
      const prev = current;
      const moves = !instant && !still && index !== prev;
      // Measured before anything changes
      const scale = scaleOf();
      const heights = moves && !tabs ? items.map((item) => item.panel.getBoundingClientRect().height / scale) : null;
      const top = moves && user && !tabs ? items[index].trigger.getBoundingClientRect().top : null;
      halt();
      current = index;
      items.forEach((item, i) => {
        const on = i === index;
        if (tabs) {
          item.trigger.setAttribute('aria-selected', String(on));
          item.trigger.tabIndex = on ? 0 : -1;
        } else {
          item.trigger.setAttribute('aria-expanded', String(on));
          if (on) item.trigger.setAttribute('aria-disabled', 'true'); // the open one does not fold
          else item.trigger.removeAttribute('aria-disabled');
        }
        item.box.classList.toggle('is-open', on);
        item.box.classList.remove('is-closing', 'is-behind', 'is-leaving');
      });
      const item = items[index];
      rollNumber(pad(index + 1), 0, !moves);
      rollValue(item.value, VALUE_AT, !moves);
      rollLabel(item.label, LABEL_AT, !moves);
      place(user);
      if (moves) {
        const animate = runner(moving);
        const old = items[prev];
        if (tabs) {
          // The old text leaves upward while the new visual opens over the old one
          old.box.classList.add('is-leaving');
          const leave = animate(old.text, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-12px)' }], { duration: LEAVE, easing: EASE, fill: 'forwards' });
          animate(item.text, UP(14), { duration: TEXT, delay: 150, easing: SOFT });
          const opened = reveal(animate, item, 0);
          const done = () => { old.box.classList.remove('is-leaving'); leave?.cancel(); };
          if (opened) opened.onfinish = done;
          else done();
        } else {
          // The open panel unfolds from where it was, the others fold, their text fading first
          const to = item.panel.getBoundingClientRect().height / scale;
          animate(item.panel, [{ height: `${heights[index]}px` }, { height: `${to}px` }], { duration: OPEN, easing: EASE });
          items.forEach((other, i) => {
            if (i === index || heights[i] < 0.5) return;
            other.box.classList.add('is-closing');
            const fold = animate(other.panel, [{ height: `${heights[i]}px` }, { height: '0px' }], { duration: FOLD, easing: FOLD_EASE, fill: 'forwards' });
            const fade = animate(other.text, [{ opacity: 1 }, { opacity: 0 }], { duration: FADE, easing: 'linear', fill: 'forwards' });
            fold.onfinish = () => { other.box.classList.remove('is-closing'); fold.cancel(); fade?.cancel(); };
          });
          old.box.classList.add('is-behind');
          animate(item.text, UP(14), { duration: TEXT, delay: TEXT_AT, easing: SOFT });
          animate(item.card, UP(10), { duration: CARD, delay: CARD_AT, easing: SOFT });
          const opened = reveal(animate, item, 0);
          const done = () => old.box.classList.remove('is-behind');
          if (opened) opened.onfinish = done;
          else done();
          // A feature picked by hand stays under the eye when the panels above it fold
          if (user) {
            const above = heights.slice(0, index).reduce((sum, h) => sum + h, 0) * scale;
            const lands = top - above;
            if (lands < KEEP) window.scrollBy({ top: lands - KEEP, behavior: 'smooth' });
          }
        }
      }
      clear();
      sync();
    }

    const pick = (index) => {
      if (index === current) return;
      held = true; // picked by hand: the tour stops there (the button starts it again)
      pause?.setAttribute('aria-pressed', 'true');
      show(index, { user: true });
    };

    // The list beside one screen, or stacked (each visual inside its feature): it never moves on by
    // itself when stacked
    const layout = () => {
      const side = tabs || (firstMedia && getComputedStyle(firstMedia).position === 'absolute');
      const next = interval > 0 && !still && !!side && items.length > 1;
      if (next !== live) {
        live = next;
        root.classList.toggle('is-live', live);
        sync();
      }
      place();
    };

    // ---- Events ----
    triggers.forEach((trigger, i) => trigger.addEventListener('click', () => pick(i), { signal }));
    list.addEventListener('keydown', (event) => {
      const i = triggers.indexOf(event.target.closest(`.${P}trigger`));
      if (i < 0) return;
      const n = triggers.length;
      const keys = tabs
        ? { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }
        : { ArrowDown: (i + 1) % n, ArrowUp: (i - 1 + n) % n, Home: 0, End: n - 1 };
      const to = keys[event.key];
      if (to === undefined) return;
      event.preventDefault();
      triggers[to].focus();
      if (tabs) pick(to);
    }, { signal });
    pause?.addEventListener('click', () => {
      held = !held;
      pause.setAttribute('aria-pressed', String(held));
      sync();
    }, { signal });
    body.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse') return;
      hovered = true;
      sync();
    }, { signal });
    body.addEventListener('pointerleave', () => {
      hovered = false;
      sync();
    }, { signal });
    root.addEventListener('focusin', (event) => {
      focused = event.target !== pause && event.target.matches(':focus-visible');
      sync();
    }, { signal });
    root.addEventListener('focusout', (event) => {
      if (root.contains(event.relatedTarget)) return;
      focused = false;
      sync();
    }, { signal });
    document.addEventListener('visibilitychange', sync, { signal });
    const seen = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    }, { rootMargin: '-15% 0px -15% 0px' });
    seen.observe(body);
    const sized = new ResizeObserver(() => layout());
    sized.observe(root);
    Promise.resolve(document.fonts?.ready).then(() => { if (!signal.aborted) layout(); });

    show(current, { instant: true });
    if (tabs) requestAnimationFrame(() => { if (!signal.aborted) root.classList.add('is-live-pill'); });

    // ---- The entrance ----
    const head = q(root, 'head');
    const parts = [head, body].filter(Boolean);
    let entry = 0;
    const play = (part, at) => {
      const animate = runner(running, at);
      part.classList.add('is-shown');
      if (part === head) {
        const child = (name) => part.querySelector(`:scope > .${P}${name}`);
        animate(child('eyebrow'), RISE, { duration: LABEL });
        const lines = [...part.querySelectorAll(`.${P}line > .${P}rise`)];
        if (lines.length) lines.forEach((line, i) => animate(line, [{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration: TITLE, delay: TITLE_AT + i * TITLE_STEP }));
        else animate(child('title'), RISE, { duration: TITLE, delay: TITLE_AT });
        animate(child('intro'), UP(20), { duration: INTRO, delay: INTRO_AT + Math.max(0, lines.length - 2) * TITLE_STEP, easing: SOFT });
        return;
      }
      const token = ++entry;
      const anims = [];
      const add = (a) => { if (a) anims.push(a); };
      const item = items[current];
      if (tabs) {
        add(animate(list, UP(12), { duration: BAR, easing: SOFT }));
        add(animate(counter, FADE_IN, { duration: CONTROLS, delay: 300 }));
        add(animate(pause, FADE_IN, { duration: CONTROLS, delay: 300 }));
        add(animate(clockTrack, DRAW, { duration: LINE, delay: 300 }));
        add(reveal(animate, item, 150));
        add(animate(item.text, UP(14), { duration: TEXT, delay: 350, easing: SOFT }));
      } else {
        items.forEach((other, i) => {
          add(animate(other.trigger, RISE, { duration: NAME, delay: NAME_AT + i * NAME_STEP }));
          add(animate(other.track, DRAW, { duration: LINE, delay: NAME_AT + i * NAME_STEP }));
        });
        add(reveal(animate, item, OPEN_AT));
        add(animate(item.text, UP(14), { duration: TEXT, delay: OPEN_TEXT_AT, easing: SOFT }));
        add(animate(item.card, UP(12), { duration: CARD, delay: CARD_AT, easing: SOFT }));
        add(animate(bar, FADE_IN, { duration: CONTROLS, delay: CONTROLS_AT }));
      }
      add(animate(tally, UP(12), { duration: CARD, delay: CARD_AT, easing: SOFT }));
      // The tour starts once the section is in place
      Promise.all(anims.map((a) => a.finished)).then(() => {
        if (token !== entry || signal.aborted) return;
        entered = true;
        sync();
      }, () => {});
    };
    const io = new IntersectionObserver((entries) => {
      entries.filter((e) => e.isIntersecting).map((e) => e.target)
        .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
        .forEach((part, i) => { io.unobserve(part); play(part, i * COLUMN); });
    }, { rootMargin: ENTER });
    const watch = () => {
      if (still) {
        parts.forEach((part) => part.classList.add('is-shown'));
        entered = true;
        return sync();
      }
      parts.forEach((part) => io.observe(part));
    };
    root.addEventListener('kodza:replay', () => {
      io.disconnect();
      stop();
      drop();
      entry++;
      held = false;
      pause?.setAttribute('aria-pressed', 'false');
      entered = false;
      show(0, { instant: true });
      if (!still) parts.forEach((part) => part.classList.remove('is-shown'));
      watch();
    }, { signal });
    Promise.resolve(document.fonts?.ready).then(() => { if (!signal.aborted) watch(); });

    signal.addEventListener('abort', () => {
      io.disconnect();
      seen.disconnect();
      sized.disconnect();
      stop();
      halt();
      drop();
      root.classList.remove('is-live', 'is-live-pill');
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
