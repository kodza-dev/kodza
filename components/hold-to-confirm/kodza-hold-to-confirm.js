// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Hold to Confirm
// Press and hold (mouse, finger, Space or Enter): the pill fills with the time held (data-hold,
// in ms), drains back when you let go too early, then ticks and sends "kodza:confirm". It rests
// on the third words for data-reset ms (2200), then empties. A live region says what happens.
(() => {
  const SELECTOR = '.kodza-hold-to-confirm';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const KEYS = [' ', 'Enter'];
  const easeOut = (t) => 1 - (1 - t) ** 3;
  const number = (value, fallback) => (Number.isFinite(Number(value)) && value !== '' && value != null ? Number(value) : fallback);

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(button, signal) {
    const holdTime = Math.max(300, number(button.dataset.hold, 1600));
    const restTime = Math.max(0, number(button.dataset.reset, 2200));

    // 1. The original content moves into a resting layer, its inverted copy into the pill
    const content = document.createElement('span');
    content.className = 'kodza-hold-to-confirm__content';
    content.append(...button.childNodes);
    button.append(content);
    const fill = content.cloneNode(true);
    fill.className = 'kodza-hold-to-confirm__fill';
    fill.setAttribute('aria-hidden', 'true');
    button.append(fill);
    const layers = [content, fill].map((layer) => [...layer.querySelectorAll('.kodza-hold-to-confirm__label > span')]);
    const words = layers[0];
    const text = (i) => (words[Math.min(i, words.length - 1)]?.textContent || '').trim();

    // 2. The spoken status sits right after the button, and leaves with it
    const status = document.createElement('span');
    status.className = 'kodza-hold-to-confirm__status';
    status.setAttribute('role', 'status');
    button.after(status);
    let sayTimer = 0;
    const say = (message) => {
      clearTimeout(sayTimer);
      status.textContent = '';
      // Emptied first, so the same words twice in a row are still read
      sayTimer = setTimeout(() => { status.textContent = message; }, 60);
    };

    // 3. The words roll: up when the hold moves forward, down when it goes back
    const hide = (word, hidden) => (hidden ? word.setAttribute('aria-hidden', 'true') : word.removeAttribute('aria-hidden'));
    let index = 0;
    const roll = (next, dir) => {
      next = Math.min(next, words.length - 1);
      if (next === index) return;
      const prev = index;
      index = next;
      words.forEach((word, i) => hide(word, i !== next));
      layers.forEach((list) => list.forEach((word, i) => {
        // A word caught mid-roll leaves from where it is, never from its resting place
        const moving = word.getAnimations().length > 0;
        const from = moving ? getComputedStyle(word).transform : null;
        word.getAnimations().forEach((a) => a.cancel());
        word.style.transform = i === next ? 'none' : 'translateY(125%)';
        if (reduceMotion) return;
        const timing = { duration: 520, easing: ease };
        if (i === next) word.animate([{ transform: from || `translateY(${dir * 125}%)` }, { transform: 'none' }], timing);
        else if (i === prev || moving) word.animate([{ transform: from || 'none' }, { transform: `translateY(${dir * -125}%)` }], timing);
      }));
    };
    words.forEach((word, i) => hide(word, i !== 0));

    // 4. The progress: linear while held (it is time), eased when it drains
    let state = 'idle';
    let progress = 0;
    let from = 0;
    let start = 0;
    let drain = 0;
    let frame = 0;
    let restTimer = 0;
    const paint = () => button.style.setProperty('--kz-hold-p', progress.toFixed(4));
    const tick = (now) => {
      frame = 0;
      if (signal.aborted) return;
      if (state === 'holding') {
        progress = Math.min(1, from + (now - start) / holdTime);
        paint();
        if (progress >= 1) return confirm();
      } else if (state === 'draining') {
        const t = drain ? Math.min(1, (now - start) / drain) : 1;
        progress = from * (1 - easeOut(t));
        paint();
        if (t >= 1) {
          state = 'idle';
          return;
        }
      } else return;
      frame = requestAnimationFrame(tick);
    };
    const loop = () => { if (!frame) frame = requestAnimationFrame(tick); };

    const press = () => {
      if (button.disabled || state === 'done' || state === 'holding') return;
      // Pressed again while it drains: it carries on from where it is
      state = 'holding';
      from = progress;
      start = performance.now();
      button.classList.add('is-holding');
      button.dataset.state = 'holding';
      roll(1, 1);
      say(text(1));
      loop();
    };
    const empty = (dir) => {
      state = 'draining';
      from = progress;
      start = performance.now();
      drain = reduceMotion ? 0 : 320 + 640 * progress;
      button.classList.remove('is-holding');
      button.dataset.state = 'idle';
      roll(0, dir);
      loop();
    };
    const release = () => {
      if (state !== 'holding') return;
      empty(-1);
      say(text(0));
    };
    const confirm = () => {
      state = 'done';
      progress = 1;
      paint();
      button.classList.remove('is-holding');
      button.dataset.state = 'done';
      roll(2, 1);
      say(text(2));
      button.dispatchEvent(new CustomEvent('kodza:confirm', { bubbles: true }));
      clearTimeout(restTimer);
      restTimer = setTimeout(() => {
        if (signal.aborted || state !== 'done') return;
        empty(1);
      }, restTime);
    };

    // 5. Mouse and finger: held while the pointer stays on the button
    let pointer = null;
    const letGo = (event) => {
      if (event.pointerId !== pointer) return;
      pointer = null;
      release();
    };
    button.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || pointer !== null) return;
      pointer = event.pointerId;
      try { button.setPointerCapture(event.pointerId); } catch (error) { /* synthetic pointer */ }
      press();
    }, { signal });
    button.addEventListener('pointermove', (event) => {
      if (event.pointerId !== pointer) return;
      const r = button.getBoundingClientRect();
      const slack = 12;
      if (event.clientX < r.left - slack || event.clientX > r.right + slack || event.clientY < r.top - slack || event.clientY > r.bottom + slack) letGo(event);
    }, { signal });
    button.addEventListener('pointerup', letGo, { signal });
    button.addEventListener('pointercancel', letGo, { signal });
    button.addEventListener('lostpointercapture', letGo, { signal });
    // A long press on a phone would open the context menu
    button.addEventListener('contextmenu', (event) => {
      if (pointer !== null || state === 'holding') event.preventDefault();
    }, { signal });

    // 6. Keyboard: Space or Enter held down. The native click never fires
    let key = null;
    let keyAt = 0;
    button.addEventListener('keydown', (event) => {
      if (!KEYS.includes(event.key)) return;
      event.preventDefault();
      if (event.repeat || key) return;
      key = event.key;
      press();
    }, { signal });
    button.addEventListener('keyup', (event) => {
      if (event.key !== key) return;
      event.preventDefault();
      key = null;
      keyAt = performance.now();
      release();
    }, { signal });
    button.addEventListener('blur', () => {
      if (key === null) return;
      key = null;
      release();
    }, { signal });
    // A click alone never confirms. One sent by assistive tech (no pointer, no key) hears how
    button.addEventListener('click', (event) => {
      event.preventDefault();
      if (event.detail === 0 && key === null && performance.now() - keyAt > 300 && state === 'idle') say(text(0));
    }, { signal });

    signal.addEventListener('abort', () => {
      cancelAnimationFrame(frame);
      clearTimeout(restTimer);
      clearTimeout(sayTimer);
      status.remove();
    });
    button.dataset.state = 'idle';
  }

  // Kodza lifecycle, the same in every component: `kodza:init` starts the instances inside
  // event.detail.root (the whole page by default), `kodza:destroy` stops them and puts their
  // markup back. For themes and apps that swap content without a page load. Each running root
  // keeps its markup as written under KODZA, shared by every Kodza script on the page: a Kodza
  // component inside another one is saved as written, not half-started, and stopped with it.
  const KODZA = Symbol.for('kodza');
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
    if (root.classList.contains('is-ready')) return; // already running, maybe from another copy of this script
    // Rendered by React (data-kodza-manual): React starts it, with an init aimed at that markup once
    // it has hydrated it. Any earlier start would change markup React has not taken over yet
    const owner = root.closest('[data-kodza-manual]');
    if (owner && !(scope && owner.contains(scope))) return;
    const controller = new AbortController();
    const saved = { html: written(root), attrs: attrsOf(root), stop: () => destroy(root) };
    instances.set(root, { controller, saved });
    root[KODZA] = saved;
    mount(root, controller.signal);
    root.classList.add('is-ready');
  });
  const destroy = (scope) => find(scope).forEach((root) => {
    const instance = instances.get(root);
    if (!instance) return;
    instances.delete(root);
    // The Kodza components running inside it stop first: once its markup is put back, their own
    // script could not find them any more
    root.querySelectorAll('*').forEach((el) => el[KODZA]?.stop());
    instance.controller.abort();
    delete root[KODZA];
    put(root, instance.saved);
  });
  document.addEventListener('kodza:init', (event) => init(event.detail?.root));
  document.addEventListener('kodza:destroy', (event) => destroy(event.detail?.root));
  init();
  // Loaded in <head>, the script runs before the markup exists: once more when it is parsed
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(), { once: true });
})();
