// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Contact Panel
// "Let's talk" grows into a side panel with a short form (a sheet from the bottom on phones), and
// the page underneath stays where it was. The button flows to the panel like a drop, keeping its
// colour, its word rises out, the form comes up line by line from behind its masks. Close it
// halfway: what was typed stays in the fields, the panel folds back into the button, which now
// says "Your draft" with a dot, and the focus comes back to it. Sent, the form rolls up into its
// answer; closed after that, the panel is empty again for the next time.
// The form is a real one: it goes to its `action` the usual way, or with fetch under
// data-send="fetch"; data-failed is the message when that fails; a hidden field catches robots;
// the page hears kodza:submit (cancelable, event.detail.data the FormData). Each field's
// data-error says what is wrong with it.
// Settings: the variables at the top of component.css; the words of the script below, each one
// replaced by a data-text-<key> on the root (data-text-failed-plain for failedPlain); the timings
// are the constants under them (the whole way in is --kz-contact-panel-duration).
(() => {
  const SELECTOR = '.kodza-contact-panel';
  const WORDS = {
    draft: 'Your draft', // the button, while a draft waits in the panel
    left: '{left} left', // the message's count, from 80 % of its maxlength
    name: 'Your name, so we know who we write to.',
    email: 'That email does not look right.',
    required: 'This one is needed.', // a required field with no data-error
    failed: 'That did not go through. Write to {email} instead.',
    failedPlain: 'That did not go through. Try again.',
  };
  const MORPH = 'cubic-bezier(0.76, 0, 0.24, 1)'; // the button's width, when its word changes on the way back
  // The way in, as shares of the duration. The button flows to the panel like a drop of ink: its
  // front runs ahead and swells as it nears the far side, the back follows, thinner, and swells in
  // turn, and the corners, round as a liquid's, settle to the panel's. All of it overlaps: the drop
  // never stops on the way. The way back is the same, run backwards
  const FRONT = [0, 0.6]; // the front end runs to the panel's far side: start, length...
  const BACK = [0.08, 0.64]; // ...and the back end follows
  const SWELL_FRONT = [0.16, 0.5]; // the front end swells to the panel's height...
  const SWELL_BACK = [0.3, 0.5]; // ...then the back one
  const SETTLE = [0.5, 0.4]; // the liquid corners settle to the panel's
  const NECK = 0.4; // how thin the back gets while the front pulls away (share of the button's height)...
  const LAG = 0.25; // ...the thinnest when the front is this far ahead (share of the way)
  const ROUND = 0.16; // how round a swollen end's corners are (share of its height)
  const MELT = [0, 0.14]; // the button's corners turn liquid (a square button rounds off)
  const FLOW = [0.6, 0, 0.2, 1]; // the ends' curve on the way (a cubic-bezier)
  const SWELL = [0.45, 0, 0.25, 1]; // the swell's curve
  const TINT = [0.28, 0.64]; // if the panel is set to another colour than the button: where it turns, on the way in...
  const TINT_BACK = [0.36, 0.72]; // ...and back
  const RISE_AT = 0.66; // share of the way in where the lines start to rise...
  const STEP = 45; // ...ms apart...
  const RISE = 850; // ...ms each
  const SINK = 260; // ms: on the way out, each line sinks back behind its mask, the last first...
  const SINK_STEP = 12; // ...ms apart
  const SHRINK_AT = 0.15; // the panel runs back into the button from 15 % of the duration...
  const SHRINK = 0.9; // ...for 90 % of it
  const LINE = 380; // ms: the button's word rises out of it, and the new one comes back in
  const STAGE = 900; // ms: the form rolls up and away, the answer comes in, the box follows
  const REACH = 140; // px each of them travels
  const HAND_OVER = 0.35; // the form is gone at 35 % of STAGE, the answer comes in from there
  const FIT = 220; // ms: the message box grows with the text
  const CLOSE_AT = 0.25; // phones: dragged down past this share of its height, the sheet closes...
  const FLICK = 0.6; // ...or flicked down faster than this, in px per ms
  const ROLL = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const ARRIVE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const LEAVE = 'cubic-bezier(0.55, 0, 1, 0.45)';
  // What rises from behind its own mask; the rest comes up and in
  const MASKED = '.kodza-contact-panel__key, .kodza-contact-panel__line, .kodza-contact-panel__title, .kodza-contact-panel__lead, .kodza-contact-panel__thanks, .kodza-contact-panel__next, .kodza-contact-panel__privacy, .kodza-contact-panel__mail';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const fill = (text, values) => text.replace(/\{(\w+)\}/g, (all, key) => (key in values ? values[key] : all));

  // The page behind stays put while it is open: a wheel or a swipe only scrolls what can
  // scroll inside, under the pointer. Listening only while open costs nothing the rest of the time.
  const holdPage = (layer, signal) => {
    const inside = (target, x, y, dy) => {
      for (let el = target; el instanceof Element && layer.contains(el); el = el.parentElement) {
        const box = el.getBoundingClientRect();
        if (x < box.left || x > box.right || y < box.top || y > box.bottom) continue;
        if (!/(auto|scroll)/.test(getComputedStyle(el).overflowY) || el.scrollHeight <= el.clientHeight + 1) continue;
        if (dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return true;
      }
      return false;
    };
    let last = 0;
    const wheel = (event) => !inside(event.target, event.clientX, event.clientY, event.deltaY) && event.preventDefault();
    const touchstart = (event) => (last = event.touches[0].clientY);
    const touchmove = (event) => {
      const touch = event.touches[0];
      const dy = last - touch.clientY;
      last = touch.clientY;
      if (!inside(event.target, touch.clientX, touch.clientY, dy)) event.preventDefault();
    };
    const hold = (on) => {
      const method = on ? 'addEventListener' : 'removeEventListener';
      document[method]('wheel', wheel, { passive: false });
      document[method]('touchstart', touchstart, { passive: true });
      document[method]('touchmove', touchmove, { passive: false });
    };
    const observer = new MutationObserver(() => hold(layer.open));
    observer.observe(layer, { attributes: true, attributeFilter: ['open'] });
    // Stopped while open: the page is let go
    signal.addEventListener('abort', () => {
      observer.disconnect();
      hold(false);
    });
  };

  const phone = window.matchMedia('(max-width: 640px)');
  let uid = 0;

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const q = (name) => root.querySelector(`.kodza-contact-panel__${name}`);
    const make = (tag, name, text) => {
      const el = document.createElement(tag);
      el.className = `kodza-contact-panel__${name}`;
      if (text != null) el.textContent = text;
      return el;
    };
    const trigger = q('trigger');
    const panel = q('panel');
    const form = q('form');
    const sheet = q('sheet');
    if (!trigger || !panel || !form || !sheet) return;
    holdPage(panel, signal);
    const stage = q('stage');
    const fields = q('fields');
    const done = q('done');
    const thanks = q('thanks');
    const button = q('send');
    const error = q('error');
    const rollBox = q('roll');
    const nameInput = form.elements.name;
    const emailInput = form.elements.email;
    const area = form.elements.message;
    const trap = form.elements.website;
    const frame = area?.closest('.kodza-contact-panel__box');
    const count = q('count');
    const footBar = q('foot-bar');
    const cross = q('close');
    // The address to write to when a send fails, from the email link
    const address = (q('mail')?.getAttribute('href') || '').replace(/^mailto:/i, '').split('?')[0];
    // As written: the button's words, the answer's placeholders
    const label = rollBox?.textContent.trim() || '';
    const blanks = new Map([...(done?.querySelectorAll('[data-value]') || [])].map((el) => [el, el.textContent]));

    const title = q('title');
    if (title) {
      title.id = title.id || `kodza-contact-panel-${++uid}`;
      panel.setAttribute('aria-labelledby', title.id);
    }
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    const raw = getComputedStyle(root).getPropertyValue('--kz-contact-panel-duration').trim();
    const duration = still ? 0 : ((raw.endsWith('ms') ? parseFloat(raw) : parseFloat(raw) * 1000) || 1000) * pace;

    // Everything in motion, so a new move can stop the last one where it is
    let moving = [];
    let echo = null;
    let morph = null;
    let drawn = null; // the drop on its way in, to close from where it is
    const play = (el, keyframes, timing) => {
      const animation = el.animate(keyframes, timing);
      moving.push(animation);
      return animation;
    };
    const halt = () => {
      moving.forEach((animation) => animation.cancel());
      moving = [];
      echo?.remove();
      echo = null;
      morph = null;
      drawn = null;
    };
    // The curves of the drop, as cubic-beziers read by the script
    const curve = ([x1, y1, x2, y2]) => (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) {
        const gap = 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3 - x;
        const slope = 3 * x1 * (1 - t) ** 2 + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t;
        if (Math.abs(gap) < 1e-5 || !slope) break;
        t = Math.min(1, Math.max(0, t - gap / slope));
      }
      return 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3;
    };
    const flowing = curve(FLOW);
    const swelling = curve(SWELL);
    const span = (t, [from, length]) => Math.min(1, Math.max(0, (t - from) / length));
    const mix = (a, b, p) => a + (b - a) * p;
    // A box on screen as a shape in the panel, which covers the screen: its sides, the top and
    // bottom of each end, its corners (in screen pixels: a parent scaled by transform scales them)
    const shapeOf = (el, box, view) => {
      const style = getComputedStyle(el);
      const scale = box.width / (el.offsetWidth || box.width || 1);
      const [tl, tr, br, bl] = ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'].map((corner) => {
        const value = style[`border${corner}Radius`].split(' ')[0];
        return (value.endsWith('%') ? parseFloat(value) / 100 * Math.min(el.offsetWidth, el.offsetHeight) : parseFloat(value) || 0) * scale;
      });
      const top = box.top - view.top;
      const bottom = box.bottom - view.top;
      return { l: box.left - view.left, r: box.right - view.left, lt: top, lb: bottom, rt: top, rb: bottom, tl, tr, br, bl };
    };
    // The drop between the button and the panel, at t from 0 (the button) to 1 (the panel)
    const drop = (button, whole, t) => {
      const shift = (whole.l + whole.r) / 2 - (button.l + button.r) / 2;
      const right = shift >= 0;
      const runs = Math.abs(shift) > 8; // a panel right over the button only swells
      const go = flowing(span(t, FRONT));
      const follow = runs ? flowing(span(t, BACK)) : go;
      const swellGo = swelling(span(t, SWELL_FRONT));
      const swellFollow = runs ? swelling(span(t, SWELL_BACK)) : swellGo;
      const melt = flowing(span(t, MELT));
      const settle = swelling(span(t, SETTLE));
      const pulled = runs ? Math.min(1, Math.max(0, go - follow) / LAG) : 0;
      const l = mix(button.l, whole.l, right ? follow : go);
      const r = mix(button.r, whole.r, right ? go : follow);
      const middle = (button.lt + button.lb) / 2;
      const height = button.lb - button.lt;
      // An end's top and bottom: the button's, thinner behind while pulled, then the panel's
      const end = (behind, swell, top, bottom) => {
        const half = height / 2 * (behind ? 1 - NECK * pulled : 1);
        return [mix(middle - half, top, swell), mix(middle + half, bottom, swell)];
      };
      const [lt, lb] = end(right, right ? swellFollow : swellGo, whole.lt, whole.lb);
      const [rt, rb] = end(!right, right ? swellGo : swellFollow, whole.rt, whole.rb);
      // A corner: the button's, round as a liquid's while it swells, the panel's once settled
      const corner = (from, to, tall) => {
        const liquid = Math.min(tall / 2, mix(from, height / 2, melt) + ROUND * Math.max(0, tall - height));
        return mix(liquid, to, settle);
      };
      return {
        l, r, lt, lb, rt, rb,
        tl: corner(button.tl, whole.tl, lb - lt),
        bl: corner(button.bl, whole.bl, lb - lt),
        tr: corner(button.tr, whole.tr, rb - rt),
        br: corner(button.br, whole.br, rb - rt),
      };
    };
    // A shape as the panel's cut: straight sides, round corners, the top and the bottom curving
    // from one end's height to the other's
    const outline = (s) => {
      const n = (v) => Math.round(v * 100) / 100;
      const cap = (v, height) => Math.max(0, Math.min(v, (s.r - s.l) / 2, height / 2));
      const tl = cap(s.tl, s.lb - s.lt);
      const bl = cap(s.bl, s.lb - s.lt);
      const tr = cap(s.tr, s.rb - s.rt);
      const br = cap(s.br, s.rb - s.rt);
      const top = n((s.l + tl + s.r - tr) / 2);
      const bottom = n((s.l + bl + s.r - br) / 2);
      return `path('M ${n(s.l + tl)} ${n(s.lt)} C ${top} ${n(s.lt)} ${top} ${n(s.rt)} ${n(s.r - tr)} ${n(s.rt)} A ${n(tr)} ${n(tr)} 0 0 1 ${n(s.r)} ${n(s.rt + tr)} L ${n(s.r)} ${n(s.rb - br)} A ${n(br)} ${n(br)} 0 0 1 ${n(s.r - br)} ${n(s.rb)} C ${bottom} ${n(s.rb)} ${bottom} ${n(s.lb)} ${n(s.l + bl)} ${n(s.lb)} A ${n(bl)} ${n(bl)} 0 0 1 ${n(s.l)} ${n(s.lb - bl)} L ${n(s.l)} ${n(s.lt + tl)} A ${n(tl)} ${n(tl)} 0 0 1 ${n(s.l + tl)} ${n(s.lt)} Z')`;
    };
    // The drop as keyframes, about one a frame: the browser is never left to guess between two
    // paths
    const flow = (button, whole, length, back) => {
      const steps = Math.max(12, Math.round(length / 16));
      return Array.from({ length: steps + 1 }, (_, i) => ({ clipPath: outline(drop(button, whole, back ? 1 - i / steps : i / steps)) }));
    };
    // The button's word, laid over it inside the panel: it rises out on the way in, the new one
    // comes in on the way back
    const makeEcho = (view) => {
      const line = rollBox?.firstElementChild;
      if (!line) return null;
      const box = rollBox.getBoundingClientRect();
      const el = make('span', 'echo');
      el.setAttribute('aria-hidden', 'true');
      el.append(line.cloneNode(true));
      const from = getComputedStyle(trigger);
      Object.assign(el.style, {
        left: `${box.left - view.left}px`,
        top: `${box.top - view.top}px`,
        width: `${rollBox.offsetWidth}px`,
        height: `${rollBox.offsetHeight}px`,
        transform: `scale(${box.width / (rollBox.offsetWidth || 1)})`,
        fontFamily: from.fontFamily,
        fontSize: from.fontSize,
        fontWeight: from.fontWeight,
        fontStyle: from.fontStyle,
        letterSpacing: from.letterSpacing,
        textTransform: from.textTransform,
        lineHeight: from.lineHeight,
        color: from.color,
      });
      panel.append(el);
      echo = el;
      return el;
    };

    // The draft: something typed and not sent. The button says so, with a dot (it changes while
    // the button is the panel: the new word comes in as the panel folds back)
    const typed = () => [nameInput, emailInput, area].some((field) => field?.value.trim());
    const draft = (on) => {
      root.classList.toggle('is-draft', on);
      if (!rollBox) return;
      const line = make('span', 'said', on ? word('draft') : label);
      if (on) line.classList.add('kodza-contact-panel__said--draft');
      rollBox.replaceChildren(line);
    };

    // What comes in, in order: the grip (phones), the label, the title line by line, the form or
    // the answer, the way out
    const partsOf = () => {
      const lines = title ? [...title.querySelectorAll('.kodza-contact-panel__line')] : [];
      const block = sent ? done : fields;
      return [
        phone.matches ? q('grip') : null,
        q('key'),
        ...(lines.length ? lines : [title]),
        ...(block ? [...block.children].filter((el) => !el.matches('.kodza-contact-panel__trap')) : []),
        ...(footBar ? footBar.children : []),
      ].filter(Boolean);
    };

    let closing = false;
    let sent = false;
    let quiet = false;
    const setY = (y) => panel.style.setProperty('--kz-contact-panel-y', `${Math.max(0, y)}px`);
    const firstEmpty = () => [nameInput, emailInput, area].find((field) => field && !field.value.trim()) || nameInput;

    // In: the button's shape flows to the panel, its word rises out, then
    // the lines rise one after the other
    const open = (event) => {
      if (panel.open) return;
      halt();
      closing = false;
      const from = trigger.getBoundingClientRect();
      const ink = getComputedStyle(trigger).backgroundColor;
      panel.showModal();
      setY(0);
      panel.classList.remove('is-moving');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (panel.open && !closing) panel.classList.add('is-open');
      }));
      trigger.setAttribute('aria-expanded', 'true');
      // From the keyboard, straight to the first field left to fill
      if (event?.detail === 0 && !sent) firstEmpty()?.focus({ preventScroll: true });
      if (still || !from.width) return;
      root.classList.add('is-away');
      panel.classList.add('is-morphing');
      const view = panel.getBoundingClientRect();
      const paper = getComputedStyle(panel).backgroundColor;
      const button = shapeOf(trigger, from, view);
      const whole = shapeOf(sheet, sheet.getBoundingClientRect(), view);
      morph = play(panel, flow(button, whole, duration, false), { duration, easing: 'linear' });
      drawn = (t) => drop(button, whole, t);
      morph.onfinish = () => panel.classList.remove('is-morphing');
      if (ink !== paper) {
        play(panel, [{ backgroundColor: ink }, { backgroundColor: paper }], {
          delay: duration * TINT[0], duration: duration * (TINT[1] - TINT[0]), easing: 'ease-in-out', fill: 'backwards',
        });
      }
      const ghost = makeEcho(view);
      if (ghost) {
        play(ghost.firstElementChild, [{ transform: 'translateY(0)' }, { transform: 'translateY(calc(-100% - 8px))' }], {
          duration: LINE * pace, easing: ROLL, fill: 'forwards',
        }).onfinish = () => {
          ghost.remove();
          if (echo === ghost) echo = null;
        };
      }
      partsOf().forEach((el, i) => {
        const timing = { delay: duration * RISE_AT + i * STEP * pace, duration: RISE * pace, easing: ARRIVE, fill: 'backwards' };
        play(el, el.matches(MASKED)
          ? [{ transform: 'translateY(100%)', clipPath: 'inset(-100% -8px 100% -8px)' }, { transform: 'translateY(0%)', clipPath: 'inset(0% -8px 0% -8px)' }]
          : [{ transform: 'translateY(24px)', opacity: 0 }, { transform: 'none', opacity: 1 }], timing);
      });
      if (cross) {
        play(cross, [{ transform: 'scale(0.6) rotate(-90deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], {
          delay: duration * RISE_AT, duration: RISE * pace, easing: ARRIVE, fill: 'backwards',
        });
      }
    };

    // Done going out: the dialog closes on the button, which is back where the panel ended
    const end = () => {
      halt();
      if (panel.open) panel.close();
      sheet.style.transform = '';
      panel.classList.remove('is-morphing', 'is-moving', 'is-open');
      root.classList.remove('is-away');
      setY(0);
      closing = false;
      trigger.focus({ preventScroll: true });
      // Sent: the next time it opens, it is empty
      if (sent) {
        quiet = true;
        form.reset();
      }
    };

    // Out: the lines sink back behind their masks, the last first, and the panel folds back into
    // the button, from wherever it is (halfway in, or dragged down on a phone)
    const close = () => {
      if (!panel.open || closing) return;
      closing = true;
      trigger.setAttribute('aria-expanded', 'false');
      panel.classList.remove('is-open');
      const keep = !sent && typed();
      const was = trigger.offsetWidth;
      if (keep !== root.classList.contains('is-draft')) draft(keep);
      const target = trigger.getBoundingClientRect();
      if (still || !target.width) return end();
      root.classList.add('is-away');
      // Where everything is now, before the moves in progress stop
      const y = parseFloat(panel.style.getPropertyValue('--kz-contact-panel-y')) || 0;
      const caught = morph?.playState === 'running' && drawn ? drawn(Math.min(1, morph.currentTime / duration)) : null;
      const colorNow = getComputedStyle(panel).backgroundColor;
      const parts = partsOf();
      const states = parts.map((el) => {
        const style = getComputedStyle(el);
        return {
          y: style.transform === 'none' ? 0 : new DOMMatrixReadOnly(style.transform).m42,
          opacity: style.opacity,
          clip: style.clipPath,
        };
      });
      const crossFrom = cross && getComputedStyle(cross);
      const crossNow = crossFrom && { transform: crossFrom.transform, opacity: crossFrom.opacity };
      halt();
      // A sheet dragged down on a phone folds from where the finger left it
      panel.classList.remove('is-moving');
      setY(0);
      if (y) sheet.style.transform = `translateY(${y}px)`;
      panel.classList.add('is-morphing');
      const view = panel.getBoundingClientRect();
      const box = sheet.getBoundingClientRect();
      const start = !y && caught ? caught : shapeOf(sheet, box, view);

      parts.forEach((el, i) => {
        const now = states[i];
        const h = el.offsetHeight;
        const timing = { delay: (parts.length - 1 - i) * SINK_STEP * pace, duration: SINK * pace, easing: LEAVE, fill: 'forwards' };
        play(el, el.matches(MASKED)
          ? [
            { transform: `translateY(${now.y}px)`, clipPath: now.clip === 'none' ? 'inset(0px -8px 0px -8px)' : now.clip },
            { transform: `translateY(${h}px)`, clipPath: `inset(${-h}px -8px ${h}px -8px)` },
          ]
          : [{ transform: `translateY(${now.y}px)`, opacity: now.opacity }, { transform: 'translateY(12px)', opacity: 0 }], timing);
      });
      if (crossNow) {
        play(cross, [crossNow, { transform: 'scale(0.6) rotate(90deg)', opacity: 0 }], {
          duration: SINK * pace, easing: LEAVE, fill: 'forwards',
        });
      }

      // The button as it will be (its new word, its new width), read before anything moves it
      const button = shapeOf(trigger, target, view);
      const ink = getComputedStyle(trigger).backgroundColor;
      const width = trigger.offsetWidth;
      const ghost = makeEcho(view);
      const delay = duration * SHRINK_AT;
      const length = duration * SHRINK;
      // Hidden, the button still takes its new width smoothly, for what sits next to it
      if (width !== was) {
        play(trigger, [{ width: `${was}px` }, { width: `${width}px` }], { delay, duration: length, easing: MORPH, fill: 'backwards' });
      }
      morph = play(panel, flow(button, start, length, true), { delay, duration: length, easing: 'linear', fill: 'both' });
      morph.onfinish = end;
      if (colorNow !== ink) {
        play(panel, [{ backgroundColor: colorNow }, { backgroundColor: ink }], {
          delay: delay + length * TINT_BACK[0], duration: length * (TINT_BACK[1] - TINT_BACK[0]), easing: 'ease-in-out', fill: 'both',
        });
      }
      if (ghost) {
        play(ghost.firstElementChild, [{ transform: 'translateY(calc(100% + 8px))' }, { transform: 'translateY(0)' }], {
          delay: Math.max(0, delay + length - LINE * pace), duration: LINE * pace, easing: ARRIVE, fill: 'backwards',
        });
      }
    };

    trigger.addEventListener('click', open, { signal });
    cross?.addEventListener('click', close, { signal });
    q('shut')?.addEventListener('click', close, { signal });
    panel.addEventListener('cancel', (event) => {
      event.preventDefault();
      close();
    }, { signal });
    // A click on the backdrop (outside the sheet) closes it
    panel.addEventListener('click', (event) => {
      if (event.target !== panel) return;
      const box = sheet.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close();
    }, { signal });

    // Phones: the sheet follows the finger on its grip or its head, and closes past CLOSE_AT
    let start = null;
    [q('grip'), q('head')].filter(Boolean).forEach((handle) => {
      handle.addEventListener('pointerdown', (event) => {
        if (!phone.matches || closing || event.target.closest('button')) return;
        start = { pointer: event.clientY, time: performance.now(), last: event.clientY, velocity: 0 };
        handle.setPointerCapture(event.pointerId);
        panel.classList.remove('is-moving');
      }, { signal });
      handle.addEventListener('pointermove', (event) => {
        if (!start) return;
        const y = event.clientY - start.pointer;
        // Above where it rests, it resists like a rubber band
        setY(y < 0 ? y / 4 : y);
        start.velocity = (event.clientY - start.last) / Math.max(1, performance.now() - start.time);
        start.last = event.clientY;
        start.time = performance.now();
      }, { signal });
      const release = () => {
        if (!start) return;
        const y = parseFloat(panel.style.getPropertyValue('--kz-contact-panel-y')) || 0;
        const flick = start.velocity > FLICK;
        start = null;
        if (flick || y > sheet.offsetHeight * CLOSE_AT) return close();
        panel.classList.add('is-moving');
        setY(0);
      };
      handle.addEventListener('pointerup', release, { signal });
      handle.addEventListener('pointercancel', release, { signal });
    });

    // The message box grows with the text, up to its max-height, then scrolls
    const fit = (animate) => {
      if (!area) return;
      const from = area.offsetHeight;
      area.style.height = 'auto';
      const full = area.scrollHeight;
      area.style.height = `${full}px`;
      const to = area.offsetHeight;
      area.classList.toggle('is-long', full > to);
      if (animate && !still && from && from !== to) area.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: FIT * pace, easing: ARRIVE });
    };
    const counted = () => {
      const max = area?.maxLength;
      if (!frame || !count || !(max > 0)) return;
      const used = area.value.length;
      frame.classList.toggle('is-near', used >= max * 0.8);
      count.textContent = fill(word('left'), { left: max - used });
    };
    area?.addEventListener('input', () => {
      fit(true);
      counted();
    }, { signal });
    // Mod+Enter sends from the message, where Enter makes a new line
    area?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      form.requestSubmit(button);
    }, { signal });

    // Checked before the send, in order: the name, the email, then the other fields. The message
    // says what is missing, the field turns to ink, the focus goes there
    let errorField = null;
    const clean = () => {
      if (errorField?.matches('input, textarea, select')) errorField.removeAttribute('aria-invalid');
      errorField = null;
      form.classList.remove('is-error');
    };
    const fail = (field, message, focus = field) => {
      clean();
      if (error) error.textContent = message;
      form.classList.add('is-error');
      errorField = field;
      if (field.matches('input, textarea, select')) field.setAttribute('aria-invalid', 'true');
      focus?.focus();
    };
    const invalid = () => {
      if (nameInput && !nameInput.value.trim()) return fail(nameInput, word('name')) || true;
      if (emailInput && (!emailInput.value.trim() || !emailInput.validity.valid)) return fail(emailInput, word('email')) || true;
      const field = [...form.querySelectorAll('input, select, textarea')].find((one) => {
        if (one.disabled || one === nameInput || one === emailInput || one === trap) return false;
        return one.value.trim() ? !one.validity.valid : one.required;
      });
      if (field) return fail(field, field.dataset.error || word('required')) || true;
      return false;
    };
    form.noValidate = true;
    form.addEventListener('input', () => {
      if (errorField?.value?.trim() && errorField.validity?.valid !== false) clean();
    }, { signal });

    // Two blocks in one place: the one leaving rolls up (down on the way back), the other follows,
    // and the box between them changes height with them
    const swap = (cell, out, into, backwards) => {
      cell.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
      out.hidden = false;
      into.hidden = false;
      if (still) {
        out.hidden = true;
        return;
      }
      const hOut = out.offsetHeight;
      const hIn = into.offsetHeight;
      cell.classList.add('is-rolling');
      const timing = { duration: STAGE * pace, easing: ROLL };
      const travel = backwards ? [REACH, -REACH] : [-REACH, REACH];
      const grow = cell.animate(
        [{ height: `${Math.max(hOut, 1)}px` }, { height: `${Math.max(hIn, 1)}px` }],
        { ...timing, fill: 'forwards' },
      );
      // The two blocks share the top of the box: the one leaving is gone before the other shows
      out.animate([
        { transform: 'translateY(0)', opacity: 1 },
        { transform: `translateY(${travel[0]}px)`, opacity: 0 },
      ], { duration: STAGE * HAND_OVER * pace, easing: LEAVE, fill: 'forwards' });
      into.animate([
        { transform: `translateY(${travel[1]}px)`, opacity: 0 },
        { opacity: 1, offset: 0.4 },
        { transform: 'translateY(0)', opacity: 1 },
      ], {
        duration: STAGE * (1 - HAND_OVER) * pace, delay: STAGE * HAND_OVER * pace, easing: ARRIVE, fill: 'backwards',
      }).onfinish = () => {
        out.hidden = true;
        cell.classList.remove('is-rolling');
        out.getAnimations().forEach((animation) => animation.cancel());
        grow.cancel();
      };
    };

    // The answer: who it thanks, where the reply goes
    const finish = (values) => {
      sent = true;
      const said = {
        name: String(values.get('name') || '').trim().split(/\s+/)[0],
        email: String(values.get('email') || '').trim(),
      };
      blanks.forEach((blank, el) => {
        el.textContent = said[el.dataset.value] || blank;
      });
      if (stage && fields && done) swap(stage, fields, done);
      form.scrollTo({ top: 0, behavior: still ? 'instant' : 'smooth' });
      if (thanks) {
        thanks.tabIndex = -1;
        thanks.focus({ preventScroll: true });
      }
    };

    // The send: kodza:submit first (the page can take it over), then the form's action, the usual
    // way, or with fetch under data-send="fetch"
    let sending = false;
    const send = async (values) => {
      sending = true;
      button.setAttribute('aria-busy', 'true');
      const method = (form.getAttribute('method') || 'get').toUpperCase();
      const url = method === 'GET' ? `${form.action}${form.action.includes('?') ? '&' : '?'}${new URLSearchParams(values)}` : form.action;
      try {
        const response = await fetch(url, { method, body: method === 'GET' ? undefined : values, headers: { Accept: 'application/json' }, signal });
        if (!response.ok) throw new Error(String(response.status));
        sending = false;
        finish(values);
      } catch {
        if (signal.aborted) return;
        sending = false;
        // What was typed stays; the address is the way out
        fail(button, form.dataset.failed || (address ? fill(word('failed'), { email: address }) : word('failedPlain')), null);
      }
      button.removeAttribute('aria-busy');
    };
    form.addEventListener('submit', (event) => {
      if (sent || sending || invalid()) {
        event.preventDefault();
        return;
      }
      clean();
      const values = new FormData(form);
      // A robot filled the hidden field: it gets its answer, nothing leaves
      if (trap?.value) {
        event.preventDefault();
        finish(values);
        return;
      }
      values.delete('website');
      if (!form.dispatchEvent(new CustomEvent('kodza:submit', { detail: { data: values }, bubbles: true, cancelable: true }))) {
        event.preventDefault();
        finish(values);
        return;
      }
      if (form.dataset.send !== 'fetch') return; // sent the usual way
      event.preventDefault();
      send(values);
    }, { signal });

    // Write another (the form's reset): the empty form comes back down. Reset by the script once
    // the panel is closed after a send, it is just put back, with nothing to watch
    const restore = (animate) => {
      if (signal.aborted) return;
      clean();
      if (area) {
        area.style.height = '';
        area.classList.remove('is-long');
      }
      counted();
      if (!sent || !stage || !fields || !done) return;
      sent = false;
      if (animate && panel.open) {
        const inside = done.contains(document.activeElement);
        swap(stage, done, fields, true);
        if (inside) nameInput?.focus({ preventScroll: true });
        return;
      }
      stage.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
      stage.classList.remove('is-rolling');
      done.hidden = true;
      fields.hidden = false;
    };
    form.addEventListener('reset', () => {
      const animate = !quiet;
      quiet = false;
      requestAnimationFrame(() => restore(animate));
    }, { signal });

    counted();

    // Stopped while open (or closing): the dialog closes and the page scrolls again
    signal.addEventListener('abort', () => {
      halt();
      if (panel.open) panel.close();
      root.classList.remove('is-away');
      sheet.style.transform = '';
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
