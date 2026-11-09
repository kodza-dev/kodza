// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — CTA Wordmark
// Sets the call across the whole column, ink edge to ink edge: each word goes in its own mask, the
// line is measured at 100px (in the page, and on a canvas for the ink of the first and last
// glyphs) and sized to the column, again whenever its width changes or a font comes in. Then the
// entrance, once the section is in view: the words rise one after the other from the foot of the
// ink, the picture opens from the top, the button and its line follow. "kodza:replay" plays it
// again. With --subscribe, the email field of Subscribe Field: "kodza:subscribe" lets the page
// send the address itself. The timings are the constants below.
(() => {
  const SELECTOR = '.kodza-cta-wordmark';
  const WORD_STEP = 120; // ms between two words (a longer call keeps the same overall pace)
  const PICTURE_AT = 480; // ms: the picture starts to open
  const ACTIONS_AT = 780; // ms: the button (or the field) comes up
  const MIN_SPIN = 700; // ms the field's ring turns at least, so a fast answer still reads
  const FAIL_TEXT = 'Could not send. Try again.';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const GLIDE = 'cubic-bezier(0.6, 0, 0.1, 1)'; // slow start, long settle
  const SOFT = 'cubic-bezier(0.25, 1, 0.5, 1)';
  const OPEN = 'cubic-bezier(0.3, 0.5, 0.1, 1)'; // the curtain: a slow start would leave the picture a hairline for 200 ms
  const REF = 100; // the size the call is measured at, in px
  const VARS = ['size', 'height', 'lift', 'shift', 'mask'].map((name) => `--kz-cta-wordmark-${name}`);
  let uid = 0;

  const decoded = (root) => Promise.all([...root.querySelectorAll('img')].map((img) => img.decode().catch(() => {})));
  const span = (name) => {
    const el = document.createElement('span');
    el.className = `kodza-cta-wordmark__${name}`;
    return el;
  };

  // The ink of one glyph at the reference size, from its origin: where it starts and ends, how
  // far it rises above the baseline and drops below it
  let context;
  const ink = (char, font) => {
    context ||= document.createElement('canvas').getContext('2d');
    context.font = font;
    const m = context.measureText(char);
    return { left: -m.actualBoundingBoxLeft, right: m.actualBoundingBoxRight, ascent: m.actualBoundingBoxAscent, descent: Math.max(0, m.actualBoundingBoxDescent) };
  };

  // The letters as drawn: text-transform changes the glyphs, so their ink is measured on those
  const drawn = (chars, transform) => chars.map((char, i) => {
    if (transform === 'uppercase' || (transform === 'capitalize' && (i === 0 || /\s/.test(chars[i - 1])))) return char.toUpperCase();
    return transform === 'lowercase' ? char.toLowerCase() : char;
  });

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const q = (s) => root.querySelector(s);
    const form = q('.kodza-cta-wordmark__form');
    if (form) field(form, signal, still, pace);
    const title = q('.kodza-cta-wordmark__title');
    if (!title) return;

    // One mask per word; screen readers keep the call whole
    const text = title.textContent.trim().replace(/\s+/g, ' ');
    const names = text.split(' ').filter(Boolean);
    if (!names.length) return;
    const row = span('words');
    row.setAttribute('aria-hidden', 'true');
    const words = names.map((name, i) => {
      const mask = span('mask');
      const word = span('word');
      word.textContent = i < names.length - 1 ? `${name} ` : name;
      mask.append(word);
      row.append(mask);
      return word;
    });
    const base = span('base');
    words[0].after(base);
    title.setAttribute('aria-label', text);
    title.replaceChildren(row);

    // The last glyph of the call, for its right edge
    const end = document.createRange();
    const node = words.at(-1).firstChild;
    const last = [...text].at(-1);
    end.setStart(node, node.length - last.length);
    end.setEnd(node, node.length);

    // Measured at the reference size, then scaled: the ink of the first letter on the left edge,
    // the last one on the right edge, the box from the top of the ink to its foot. The measures
    // go on the section, so the picture knows how far up the letters it can reach. Screen pixels
    // are divided by the scale of a parent that would be zoomed by a transform
    let width = 0;
    const fit = () => {
      const w = title.clientWidth;
      if (!w) return;
      width = w;
      VARS.forEach((name) => root.style.removeProperty(name));
      root.style.setProperty(VARS[0], `${REF}px`);
      const style = getComputedStyle(title);
      const font = `${style.fontStyle} ${style.fontWeight} ${REF}px ${style.fontFamily}`;
      const marks = drawn([...text], style.textTransform).map((char) => ink(char, font));
      const scale = title.getBoundingClientRect().width / title.offsetWidth || 1;
      const box = row.getBoundingClientRect();
      const left = (words[0].getBoundingClientRect().left - box.left) / scale + marks[0].left;
      const right = (end.getBoundingClientRect().left - box.left) / scale + marks.at(-1).right;
      const baseline = (base.getBoundingClientRect().top - box.top) / scale;
      const top = baseline - Math.max(...marks.map((m) => m.ascent));
      const bottom = baseline + Math.max(...marks.map((m) => m.descent));
      const k = w / (right - left);
      [REF, bottom - top, top, left, bottom].forEach((value, i) => root.style.setProperty(VARS[i], `${value * k}px`));
    };

    // A new width refits on the next frame, outside the observer
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (title.clientWidth !== width) fit();
      });
    });
    observer.observe(title);
    document.fonts?.addEventListener('loadingdone', fit, { signal });
    signal.addEventListener('abort', () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    });
    fit();

    let running = [];
    const stop = () => {
      running.forEach((a) => a.cancel());
      running = [];
    };
    // The entrance, at the site's pace
    const animate = (el, keyframes, options) => {
      if (el) running.push(el.animate(keyframes, { easing: GLIDE, fill: 'backwards', ...options, duration: options.duration * pace, delay: (options.delay || 0) * pace }));
    };
    const rise = (el, delay, duration) => animate(el, [{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration, delay });

    const play = async () => {
      await decoded(root);
      if (signal.aborted) return;
      stop();
      root.classList.add('is-shown');
      rise(q('.kodza-cta-wordmark__eyebrow .kodza-cta-wordmark__rise'), 0, 900);
      const step = Math.min(WORD_STEP, 360 / Math.max(1, words.length - 1));
      words.forEach((word, i) => rise(word, 100 + i * step, 1100));
      // The curtain opens from the top down while the picture settles from a slight zoom
      animate(q('.kodza-cta-wordmark__curtain'), [{ transform: 'translateY(calc(-100% - 2px))' }, { transform: 'none' }], { duration: 1300, delay: PICTURE_AT, easing: OPEN });
      animate(q('.kodza-cta-wordmark__hold'), [{ transform: 'translateY(calc(100% + 2px))' }, { transform: 'none' }], { duration: 1300, delay: PICTURE_AT, easing: OPEN });
      animate(q('.kodza-cta-wordmark__media img'), [{ transform: 'scale(1.2)' }, { transform: 'none' }], { duration: 2000, delay: PICTURE_AT, easing: SOFT });
      animate(q('.kodza-cta-wordmark__button, .kodza-cta-wordmark__stage'), [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: ACTIONS_AT, easing: SOFT });
      rise(q('.kodza-cta-wordmark__note .kodza-cta-wordmark__line'), ACTIONS_AT + 120, 900);
    };

    if (still) {
      root.classList.add('is-shown');
      document.fonts?.ready.then(() => !signal.aborted && fit());
      return;
    }
    root.addEventListener('kodza:replay', play, { signal });
    signal.addEventListener('abort', stop);
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      io.disconnect();
      play();
    }, { rootMargin: '0px 0px -15% 0px' });
    signal.addEventListener('abort', () => io.disconnect());
    Promise.all([document.fonts?.ready, decoded(root)]).then(() => {
      if (signal.aborted) return;
      fit();
      io.observe(root);
    });
  }

  // The email field of --subscribe (the engine of Kodza Subscribe Field): the script judges the
  // address in its own line, then sends the form without leaving the page. The page can take over:
  // cancel "kodza:subscribe" and call event.detail.done() or .fail(message), or later
  // form.kodzaSubscribe.done() / .fail() / .reset(). data-fail on the form changes the failure line
  function field(form, signal, still, pace) {
    const q = (s) => form.querySelector(s);
    const input = q('.kodza-cta-wordmark__input');
    const pill = q('.kodza-cta-wordmark__pill');
    const done = q('.kodza-cta-wordmark__done');
    const thanks = q('.kodza-cta-wordmark__thanks');
    const hint = q('.kodza-cta-wordmark__note .kodza-cta-wordmark__line');
    const error = q('.kodza-cta-wordmark__error');
    if (!input || !pill || !done || !error) return;
    const minSpin = still ? 0 : MIN_SPIN * pace;

    const prefix = `kodza-cta-wordmark-${++uid}`;
    const described = [];
    if (hint) described.push((hint.id = `${prefix}-hint`));
    described.push((error.id = `${prefix}-error`));
    input.setAttribute('aria-describedby', described.join(' '));

    // The thanks is written when it shows: a status that receives text is read out
    const message = thanks ? thanks.textContent.trim() : '';
    if (thanks) thanks.textContent = '';
    // The script says what is wrong, in the field's own line, instead of the browser's bubble
    const validated = form.noValidate;
    form.noValidate = true;

    // Focus is only moved for a visitor on the keyboard: after a click, a ring would show
    let fromKeyboard = false;
    form.addEventListener('keydown', () => { fromKeyboard = true; }, { signal });
    form.addEventListener('pointerdown', () => { fromKeyboard = false; }, { signal });

    const check = () => {
      const bad = !input.validity.valid;
      error.textContent = bad ? input.dataset.error || input.validationMessage : '';
      input.setAttribute('aria-invalid', String(bad));
      return !bad;
    };

    const set = (state) => {
      if (state) form.dataset.state = state;
      else delete form.dataset.state;
      input.readOnly = Boolean(state);
      if (state === 'sending') form.setAttribute('aria-busy', 'true');
      else form.removeAttribute('aria-busy');
      pill.inert = state === 'done';
      if (thanks) thanks.textContent = state === 'done' ? message : '';
    };

    let token = 0; // a reset or a new send voids the answer of the one before
    let timer = 0;
    let started = 0;
    // An answer lands once the ring has turned long enough
    const later = (id, fn) => {
      clearTimeout(timer);
      timer = setTimeout(() => id === token && form.dataset.state === 'sending' && fn(), Math.max(0, minSpin - (performance.now() - started)));
    };
    const finish = () => {
      set('done');
      if (fromKeyboard) done.focus({ preventScroll: true });
    };
    const failWith = (text) => {
      set();
      form.dataset.failed = '';
      error.textContent = text || form.dataset.fail || FAIL_TEXT;
    };
    const reset = () => {
      token += 1;
      clearTimeout(timer);
      delete form.dataset.failed;
      input.value = '';
      input.removeAttribute('aria-invalid');
      error.textContent = '';
      set();
    };

    const send = () => {
      const id = ++token;
      started = performance.now();
      const data = new FormData(form);
      set('sending');
      const ok = () => later(id, finish);
      const ko = (text) => later(id, () => failWith(text));
      const mine = form.dispatchEvent(new CustomEvent('kodza:subscribe', { bubbles: true, cancelable: true, detail: { data, done: ok, fail: ko } }));
      if (!mine) return; // the page sends it, and calls done or fail
      const action = form.getAttribute('action');
      if (!action) {
        console.warn('Kodza CTA Wordmark: the form has no action, and nothing handled kodza:subscribe.');
        return ko();
      }
      const url = new URL(action, location.href);
      const method = (form.getAttribute('method') || 'get').toUpperCase();
      const fields = new URLSearchParams();
      data.forEach((value, name) => typeof value === 'string' && fields.append(name, value));
      if (method === 'GET') fields.forEach((value, name) => url.searchParams.append(name, value));
      const same = url.origin === location.origin;
      fetch(url, {
        method,
        body: method === 'GET' ? undefined : fields,
        mode: same ? 'same-origin' : 'no-cors',
        credentials: same ? 'same-origin' : 'omit',
        signal,
      }).then((response) => (response.type === 'opaque' || response.ok ? ok() : ko()), () => !signal.aborted && ko());
    };

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (form.dataset.state) return;
      delete form.dataset.failed;
      if (check()) send();
      else input.focus();
    }, { signal });
    // Judged when the visitor leaves a filled field, then live while they fix it
    input.addEventListener('blur', () => input.value && !form.dataset.state && check(), { signal });
    input.addEventListener('input', () => {
      if (form.dataset.failed !== undefined) {
        delete form.dataset.failed;
        error.textContent = '';
      }
      if (input.getAttribute('aria-invalid') === 'true') check();
    }, { signal });

    form.kodzaSubscribe = {
      done: () => later(token, finish),
      fail: (text) => later(token, () => failWith(text)),
      reset,
    };
    signal.addEventListener('abort', () => {
      token += 1;
      clearTimeout(timer);
      delete form.kodzaSubscribe;
      form.noValidate = validated;
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
