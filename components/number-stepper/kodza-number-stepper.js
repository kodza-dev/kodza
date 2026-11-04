// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Number Stepper
// A real number input between − and +, which the form still sends. Each digit that changes rolls
// in the direction of the count: up, the old digit leaves upward and the new one comes from
// below; down, the other way. A new place (9 to 10) opens its room as its digit rolls in.
// Holding − or + steps again and again, faster and faster; the button at the edge goes dim at
// the limit. The arrows step too (Page keys by ten, Home and End to the ends). Typing stays
// possible: out of range, the error says why, and on leaving the field the value rolls back
// into range, snapped to the step. min, max and step are read from the input.
// "change" fires on the real input at each step; after setting .value from a script, fire
// "change" on it. The words and timings are below; each word can be set per field with
// data-text-<name> (data-text-max="…"), {min}, {max}, {step}, {label} and {value} are filled in.
(() => {
  const SELECTOR = '.kodza-number-stepper';
  const WORDS = {
    max: '{max} max.', // under the field, while typing past the max
    min: '{min} min.',
    step: 'Steps of {step}.',
    number: 'Numbers only.',
    required: 'Pick a number.',
    decrease: 'Decrease', // the − button, for screen readers
    increase: 'Increase',
    live: '{label}: {value}', // read out after a press on − or +
  };
  const ROLL = 280; // ms, a digit rolling to the next one
  const HOLD = 420; // ms to hold − or + before it repeats (a wait: not scaled by the site's pace)
  const REPEAT = 160; // ms between the first repeats
  const SPEED_UP = 0.86; // each repeat comes this much sooner
  const FASTEST = 45; // ms between repeats, at full speed
  const PAGE = 10; // steps for Page Up and Page Down
  const BUMP = 3; // px, the number nudging at a limit the arrows cannot pass
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const icon = (d) => `<svg viewBox="0 0 14 14" aria-hidden="true"><path d="${d}"/></svg>`;
  const fill = (words, values) => words.replace(/\{(\w+)\}/g, (all, key) => (key in values ? values[key] : all));
  const places = (n) => (String(n).split('.')[1] || '').length;
  let uid = 0;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const native = root.querySelector('.kodza-number-stepper__input');
    const box = root.querySelector('.kodza-number-stepper__box');
    const label = root.querySelector('.kodza-number-stepper__label');
    const hint = root.querySelector('.kodza-number-stepper__hint');
    const error = root.querySelector('.kodza-number-stepper__error');
    if (!native || !box) return;
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const id = `kodza-number-stepper-${++uid}`;

    // The digits over the input, the two buttons, and what screen readers hear
    const value = document.createElement('span');
    value.className = 'kodza-number-stepper__value';
    value.setAttribute('aria-hidden', 'true');
    native.after(value);
    const button = (side, key, d) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = `kodza-number-stepper__button kodza-number-stepper__${side}`;
      el.tabIndex = -1; // the arrows do it from the field; screen readers still reach it
      el.setAttribute('aria-label', word(key));
      el.innerHTML = icon(d);
      return el;
    };
    const minus = button('minus', 'decrease', 'M3 7h8');
    const plus = button('plus', 'increase', 'M3 7h8M7 3v8');
    box.after(minus, plus);
    const live = document.createElement('span');
    live.className = 'kodza-number-stepper__live';
    live.setAttribute('aria-live', 'polite');
    root.append(live);
    if (hint || error) {
      if (hint) hint.id = `${id}-hint`;
      if (error) error.id = `${id}-error`;
      native.setAttribute('aria-describedby', [hint?.id, error?.id].filter(Boolean).join(' '));
    }

    // min, max and step as the input has them now (a script may change them)
    const rules = () => {
      const min = parseFloat(native.min);
      const max = parseFloat(native.max);
      const any = native.step === 'any';
      const step = parseFloat(native.step) > 0 ? parseFloat(native.step) : 1;
      const base = Number.isFinite(min) ? min : 0; // the steps count from the min, as the browser does
      const decimals = any ? null : Math.max(places(step), Number.isFinite(min) ? places(min) : 0);
      const round = (n) => (decimals === null ? n : Number(n.toFixed(decimals)));
      // The highest value on a step, at or under the max
      const top = Number.isFinite(max) ? (any ? max : round(base + Math.floor((max - base) / step + 1e-9) * step)) : Infinity;
      const bottom = Number.isFinite(min) ? min : -Infinity;
      return { min, max, step, any, base, decimals, round, top, bottom };
    };
    const format = (n, r = rules()) => (r.decimals === null ? String(n) : n.toFixed(r.decimals));
    const current = () => (native.value === '' ? NaN : Number(native.value));
    // A value back on a step and inside the range
    const fit = (n, r = rules()) => {
      let next = r.any ? n : r.round(r.base + Math.round((n - r.base) / r.step) * r.step);
      next = Math.min(Math.max(next, r.bottom), r.top);
      return r.round(next);
    };

    // Hint and error share one line
    const say = (text) => {
      if (!error) return;
      error.textContent = text;
      root.classList.add('is-invalid');
      native.setAttribute('aria-invalid', 'true');
    };
    const clearError = () => {
      if (!error) return;
      root.classList.remove('is-invalid');
      native.removeAttribute('aria-invalid');
    };
    const tell = (text) => {
      live.textContent = '';
      requestAnimationFrame(() => { live.textContent = text; });
    };

    // The digits: one slot per place, lined up from the right, so 9 to 10 rolls only the units
    // and opens a new place on the left
    let shown = '';
    let slots = [];
    const slot = () => {
      const el = document.createElement('span');
      el.className = 'kodza-number-stepper__digit';
      return { el, now: null };
    };
    // A slot's digit leaves, its new one (if any) comes in, from below when the count goes up
    const swap = (place, char, dir, duration) => {
      const old = place.now;
      place.now = null;
      if (char) {
        place.now = document.createElement('span');
        place.now.textContent = char;
        place.el.append(place.now);
      }
      if (still || !duration) {
        old?.remove();
        return;
      }
      const from = dir > 0 ? 100 : -100;
      place.now?.animate([{ transform: `translateY(${from}%)` }, { transform: 'none' }], { duration, easing: ease });
      if (!old) return;
      // Still arriving from a previous step: it leaves from where it is
      const at = getComputedStyle(old).transform;
      old.getAnimations().forEach((animation) => animation.cancel());
      old.animate([{ transform: at === 'none' ? 'none' : at }, { transform: `translateY(${-from}%)` }], { duration, easing: ease, fill: 'forwards' })
        .finished.then(() => old.remove(), () => {});
    };
    const show = (text, dir = 1, duration = ROLL * pace) => {
      const before = shown.padStart(Math.max(shown.length, text.length));
      const after = text.padStart(before.length);
      shown = text;
      // Slots lined up with the longer of the two
      while (slots.length < before.length) {
        const place = slot();
        value.prepend(place.el);
        slots.unshift(place);
      }
      const keep = [];
      slots.forEach((place, i) => {
        const was = before[i] === ' ' ? '' : before[i];
        const next = after[i] === ' ' ? '' : after[i];
        if (was !== next) swap(place, next, dir, duration);
        if (next) keep.push(place);
        const opens = !was && next;
        const closes = was && !next;
        if (!opens && !closes) return;
        if (still || !duration) {
          if (closes) place.el.remove();
          return;
        }
        // A place that comes or goes: its room opens or closes as its digit rolls
        place.el.getAnimations().forEach((animation) => animation.cancel());
        const width = `${place.el.scrollWidth}px`;
        const room = place.el.animate(
          [{ width: opens ? '0px' : width }, { width: opens ? width : '0px' }],
          { duration, easing: ease, fill: closes ? 'forwards' : 'none' },
        );
        if (closes) room.finished.then(() => place.el.remove(), () => {});
      });
      slots = keep;
    };

    // Nudged at a limit the arrows cannot pass
    const bump = (dir) => {
      if (still) return;
      value.animate(
        [{ transform: 'none' }, { transform: `translateY(${-dir * BUMP}px)` }, { transform: 'none' }],
        { duration: 260 * pace, easing: 'ease-out' },
      );
    };

    // The buttons, dim at the limit
    const refresh = () => {
      const r = rules();
      const n = current();
      const off = native.disabled || native.readOnly;
      minus.disabled = off || (Number.isFinite(n) && n <= r.bottom);
      plus.disabled = off || (Number.isFinite(n) && n >= r.top);
      root.classList.toggle('is-disabled', native.disabled);
      if ((minus.disabled && holding === -1) || (plus.disabled && holding === 1)) stopHold();
    };

    let syncing = false;
    const write = (text, dir, duration) => {
      native.value = text;
      syncing = true;
      native.dispatchEvent(new Event('input', { bubbles: true }));
      native.dispatchEvent(new Event('change', { bubbles: true }));
      syncing = false;
      clearError();
      show(text, dir, duration);
      refresh();
    };

    // Typing: the input shows its own text; leaving the field (or a step) puts it in range
    let typing = false;
    const check = () => {
      const r = rules();
      const n = current();
      if (native.validity.badInput) return say(word('number'));
      if (!Number.isFinite(n)) return clearError();
      if (n > r.max) return say(fill(word('max'), { max: format(r.max, r) }));
      if (n < r.min) return say(fill(word('min'), { min: format(r.min, r) }));
      if (!r.any && Math.abs(fit(n, r) - n) > 1e-9) return say(fill(word('step'), { step: r.step }));
      clearError();
    };
    const commit = () => {
      if (!typing) return;
      typing = false;
      const typed = native.value;
      if (native.validity.badInput) {
        native.value = shown; // not a number: the last one comes back
      } else if (typed !== '') {
        const n = Number(typed);
        const next = format(fit(n));
        // The digits take over from the typed text, then roll to the value in range
        show(typed, 1, 0);
        if (next !== typed) write(next, Number(next) > n ? 1 : -1);
      } else {
        show('', 1, 0);
      }
      root.classList.remove('is-typing');
      clearError();
      refresh();
    };

    // One step (or several: Page keys), from the value there now
    const stepBy = (count, duration) => {
      commit();
      if (native.disabled || native.readOnly) return false;
      const r = rules();
      const n = current();
      let next;
      if (!Number.isFinite(n)) next = fit(r.base > r.top ? r.top : Math.max(r.base, r.bottom), r);
      else {
        const k = (n - r.base) / r.step;
        const from = count > 0 ? Math.floor(k + 1e-9) : Math.ceil(k - 1e-9);
        next = r.round(Math.min(Math.max(r.base + (from + count) * r.step, r.bottom), r.top));
      }
      if (Number.isFinite(n) && next === n) return false;
      write(format(next, r), Number.isFinite(n) && next < n ? -1 : 1, duration);
      return true;
    };
    const jump = (to) => {
      commit();
      const n = current();
      if (native.disabled || native.readOnly || !Number.isFinite(to) || to === n) return false;
      write(format(to), Number.isFinite(n) && to < n ? -1 : 1);
      return true;
    };

    // Held down: once, then again after HOLD, faster and faster
    let holding = 0;
    let timer = 0;
    let pressed = null;
    const stopHold = () => {
      clearTimeout(timer);
      if (holding && shown) tell(fill(word('live'), { label: label?.textContent.trim() || '', value: shown }));
      holding = 0;
      pressed?.classList.remove('is-pressed');
      pressed = null;
    };
    const startHold = (dir, el) => {
      stopHold();
      if (!stepBy(dir)) return;
      holding = dir;
      pressed = el;
      el.classList.add('is-pressed');
      let wait = REPEAT;
      const again = () => {
        // Fast repeats roll faster too, so each digit still lands before the next one leaves
        if (!stepBy(dir, Math.min(ROLL, wait * 1.4) * pace)) return stopHold();
        wait = Math.max(FASTEST, wait * SPEED_UP);
        timer = setTimeout(again, wait);
      };
      timer = setTimeout(again, HOLD);
    };
    [[minus, -1], [plus, 1]].forEach(([el, dir]) => {
      el.addEventListener('pointerdown', (event) => {
        if (event.button !== 0 || el.disabled) return;
        event.preventDefault(); // the focus stays where it is, nothing gets selected
        startHold(dir, el);
      }, { signal });
      el.addEventListener('pointerleave', stopHold, { signal });
      // Pressed by a screen reader or a script (no pointer): one step
      el.addEventListener('click', (event) => {
        if (event.detail !== 0) return;
        if (stepBy(dir)) tell(fill(word('live'), { label: label?.textContent.trim() || '', value: shown }));
      }, { signal });
      el.addEventListener('contextmenu', (event) => event.preventDefault(), { signal });
    });
    document.addEventListener('pointerup', stopHold, { signal });
    document.addEventListener('pointercancel', stopHold, { signal });
    window.addEventListener('blur', stopHold, { signal });

    // The keys, in the field. The matching button is pressed with them
    let keyed = null;
    const press = (el) => {
      keyed?.classList.remove('is-pressed');
      keyed = el;
      el?.classList.add('is-pressed');
    };
    native.addEventListener('keydown', (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const r = rules();
      let dir = 0;
      let moved = false;
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        dir = event.key === 'ArrowUp' ? 1 : -1;
        moved = stepBy(dir);
      } else if (event.key === 'PageUp' || event.key === 'PageDown') {
        dir = event.key === 'PageUp' ? 1 : -1;
        moved = stepBy(dir * PAGE);
      } else if ((event.key === 'Home' && Number.isFinite(r.min)) || (event.key === 'End' && Number.isFinite(r.max))) {
        dir = event.key === 'End' ? 1 : -1;
        moved = jump(dir > 0 ? r.top : r.min);
      } else if (event.key === 'Enter') {
        commit(); // a typed value in range first, then the form sends as usual
        return;
      } else return;
      event.preventDefault();
      if (native.disabled || native.readOnly) return;
      press(dir > 0 ? plus : minus);
      if (!moved) bump(dir);
    }, { signal });
    native.addEventListener('keyup', () => press(null), { signal });
    native.addEventListener('blur', () => {
      press(null);
      commit();
    }, { signal });

    native.addEventListener('input', () => {
      if (syncing) return;
      typing = true;
      root.classList.add('is-typing');
      check();
      refresh();
    }, { signal });
    // The form's own check: the error under the field instead of the browser's bubble
    native.addEventListener('invalid', (event) => {
      event.preventDefault();
      say(native.validity.valueMissing ? word('required') : native.validationMessage);
      const first = native.form && [...native.form.elements].find((el) => el.willValidate && !el.validity.valid);
      if (!native.form || first === native) native.focus();
    }, { signal });

    // A value set from outside (a script, the form's reset): the digits roll to it
    const read = () => {
      if (typing) return;
      const text = native.value;
      if (text === shown) return refresh();
      const was = Number(shown);
      show(text, Number.isFinite(was) && Number(text) < was ? -1 : 1);
      clearError();
      refresh();
    };
    native.addEventListener('change', () => {
      if (!syncing) read();
    }, { signal });
    native.form?.addEventListener('reset', () => setTimeout(() => {
      typing = false;
      root.classList.remove('is-typing');
      read();
    }), { signal });
    const observer = new MutationObserver(refresh);
    observer.observe(native, { attributes: true, attributeFilter: ['min', 'max', 'step', 'disabled', 'readonly', 'required'] });
    signal.addEventListener('abort', () => {
      observer.disconnect();
      clearTimeout(timer);
    }, { once: true });

    show(native.value, 1, 0);
    refresh();
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
