// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Inline Edit
// Turns the real input or textarea into text you click to edit: a mirror of the value sizes the
// box, a click puts the caret under the pointer, Enter saves (a check draws itself), Escape rolls
// the old text back in. Tab and clicking away save too. The timings are the constants below.
(() => {
  const SELECTOR = '.kodza-inline-edit';
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const DRAW = 450; // ms, the outline drawing itself around the field once you are in
  const ERASE = 350; // ms, and wiping off to the right when you leave
  const ROLL = 450; // ms, Escape: the typed text rolls up and out, the old one comes in under it
  const CHECK = 400; // ms, the check drawing itself after a save
  const CHECK_DELAY = 150; // ms, once the outline has started to go
  const CHECK_FADE = 300; // ms, the check undrawing itself from its start
  const CHECK_HOLD = 1200; // ms the check stays, a reading time: not scaled by the pace
  // The outline's clip: open around the box, or cut down to its left or its right edge
  const CLIP_OPEN = 'inset(-6px)';
  const CLIP_LEFT = 'inset(-6px calc(100% + 6px) -6px -6px)';
  const CLIP_RIGHT = 'inset(-6px -6px -6px calc(100% + 6px))';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  let uid = 0;

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const field = root.querySelector('.kodza-inline-edit__native');
    if (!field) return;
    const label = root.querySelector('.kodza-inline-edit__label');
    const prefix = root.querySelector('.kodza-inline-edit__prefix');
    const note = root.querySelector('.kodza-inline-edit__note');
    const error = root.querySelector('.kodza-inline-edit__error');
    const multiline = field.tagName === 'TEXTAREA';
    const id = `kodza-inline-edit-${++uid}`;

    // The label and the note name and describe the field, without ids in the markup
    if (label && !field.hasAttribute('aria-label') && !field.labels?.length) {
      label.id = `${id}-label`;
      field.setAttribute('aria-labelledby', label.id);
    }

    // The row: the box (its fill, its outline, the prefix, the text over the field), then the check
    const row = document.createElement('div');
    row.className = 'kodza-inline-edit__row';
    const box = document.createElement('span');
    box.className = 'kodza-inline-edit__box';
    const fill = document.createElement('span');
    fill.className = 'kodza-inline-edit__fill';
    const ring = document.createElement('span');
    ring.className = 'kodza-inline-edit__ring';
    const cell = document.createElement('span');
    cell.className = 'kodza-inline-edit__cell';
    const view = document.createElement('button');
    view.type = 'button';
    view.className = 'kodza-inline-edit__view';
    const text = document.createElement('span');
    text.className = 'kodza-inline-edit__text';
    view.append(text);
    if (note) {
      note.id = `${id}-note`;
      field.setAttribute('aria-describedby', note.id);
      view.setAttribute('aria-describedby', note.id);
    }
    (prefix || field).before(row);
    box.append(fill, ring);
    if (prefix) box.append(prefix);
    cell.append(view, field);
    box.append(cell);
    row.append(box);
    row.insertAdjacentHTML('beforeend', '<svg class="kodza-inline-edit__check" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3.5 8.5l3 3 6-7" pathLength="1"/></svg>');
    const check = row.lastElementChild;
    root.classList.toggle('is-multiline', multiline);

    let editing = false;
    let previous = field.value;
    let drawing = null;
    let rolling = [];
    let ghost = null;
    let checks = [];
    let checkTimer = 0;

    const name = () => field.getAttribute('aria-label')
      || (field.getAttribute('aria-labelledby') && document.getElementById(field.getAttribute('aria-labelledby'))?.textContent.trim())
      || field.labels?.[0]?.textContent.trim()
      || field.name
      || 'text';

    // The mirror: the value (or the placeholder) as plain text, which gives the box its size
    const sync = () => {
      const value = field.value;
      const shown = value || field.placeholder || ' ';
      // A last empty line still counts in a textarea
      text.textContent = multiline && value.endsWith('\n') ? `${shown}​` : shown;
      root.classList.toggle('is-empty', !value);
      view.setAttribute('aria-label', `Edit ${name()}, ${value || 'empty'}`);
      const off = field.disabled || field.readOnly;
      view.disabled = off;
      root.classList.toggle('is-disabled', off);
      // The field grows with the mirror: once the text fits, nothing should stay scrolled
      if (!multiline && text.scrollWidth <= text.clientWidth) field.scrollLeft = 0;
    };

    // The character under the pointer, so the caret lands where you clicked
    const offsetAt = (x, y) => {
      const node = text.firstChild;
      if (!node || !field.value) return 0;
      const range = document.createRange();
      const length = Math.min(node.length, field.value.length);
      let best = length;
      let bestScore = Infinity;
      for (let i = 0; i < length; i += 1) {
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const rect = range.getClientRects()[0];
        if (!rect || !rect.width) continue;
        const dy = y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0;
        const dx = x < rect.left ? rect.left - x : x > rect.right ? x - rect.right : 0;
        const score = dy * 10000 + dx;
        if (score < bestScore) {
          bestScore = score;
          best = x < rect.left + rect.width / 2 ? i : i + 1;
        }
      }
      return best;
    };

    // The outline draws itself from its left edge, and wipes off to the right
    const drawRing = (from, to, duration) => {
      const current = drawing ? getComputedStyle(ring).clipPath : from;
      drawing?.cancel();
      drawing = null;
      if (still) return;
      drawing = ring.animate([{ clipPath: current }, { clipPath: to }], { duration: duration * pace, easing: EASE });
      drawing.onfinish = () => { drawing = null; };
    };

    const hideCheck = () => {
      clearTimeout(checkTimer);
      checks.forEach((animation) => animation.cancel());
      checks = [];
    };

    const showCheck = () => {
      hideCheck();
      const time = still ? 0 : pace;
      checks.push(check.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
        duration: CHECK * time, delay: CHECK_DELAY * time, easing: EASE, fill: 'forwards',
      }));
      checkTimer = setTimeout(() => {
        const out = check.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: -1 }], {
          duration: CHECK_FADE * time, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards',
        });
        out.onfinish = hideCheck;
        checks.push(out);
      }, (CHECK_DELAY + CHECK) * time + CHECK_HOLD);
    };

    const stopRoll = () => {
      rolling.forEach((animation) => animation.cancel());
      rolling = [];
      ghost?.remove();
      ghost = null;
      root.classList.remove('is-rolling');
    };

    // Escape: the old value comes back, the typed one rolls up and out above it
    const rollBack = () => {
      const typed = field.value;
      const width = cell.offsetWidth;
      const height = cell.offsetHeight;
      field.value = previous;
      sync();
      if (still) return;
      stopRoll();
      root.classList.add('is-rolling');
      if (typed) {
        ghost = document.createElement('span');
        ghost.className = 'kodza-inline-edit__text kodza-inline-edit__ghost';
        ghost.setAttribute('aria-hidden', 'true');
        ghost.textContent = typed;
        ghost.style.width = `${width}px`;
        cell.append(ghost);
        rolling.push(ghost.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-100%)', opacity: 0 }], { duration: ROLL * pace, easing: EASE }));
      }
      const back = view.animate([{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: ROLL * pace, easing: EASE });
      rolling.push(back);
      const to = { width: `${cell.offsetWidth}px`, height: `${cell.offsetHeight}px` };
      rolling.push(cell.animate([{ width: `${width}px`, height: `${height}px` }, to], { duration: ROLL * pace, easing: EASE }));
      back.onfinish = stopRoll;
    };

    const open = (caret) => {
      if (editing || field.disabled || field.readOnly) return;
      editing = true;
      previous = field.value;
      hideCheck();
      stopRoll();
      root.classList.add('is-editing');
      field.focus({ preventScroll: true });
      if (caret == null) field.select();
      else field.setSelectionRange(caret, caret);
      drawRing(CLIP_LEFT, CLIP_OPEN, DRAW);
    };

    const finish = (save, refocus) => {
      editing = false; // first: the blur that the refocus below fires has nothing left to do
      const changed = field.value !== previous;
      if (!save && changed) rollBack();
      field.removeAttribute('aria-invalid');
      root.classList.remove('is-editing');
      drawRing(CLIP_OPEN, CLIP_RIGHT, ERASE);
      if (refocus) view.focus({ preventScroll: true });
      sync();
      if (save && changed) {
        showCheck();
        root.dispatchEvent(new CustomEvent('kodza:save', {
          bubbles: true,
          detail: { value: field.value, previous, name: field.name },
        }));
      }
    };

    const commit = (fromKey) => {
      if (!editing) return;
      const value = field.value;
      if (value === previous) return finish(true, fromKey);
      // Nothing left in a required field: the old value comes back
      if (field.required && !value.trim()) return finish(false, fromKey);
      if (!field.validity.valid) {
        // Leaving with an invalid value puts the old one back; Enter says what is wrong and stays
        if (!fromKey) return finish(false, false);
        field.setAttribute('aria-invalid', 'true');
        if (error) error.textContent = field.dataset.error || field.validationMessage;
        else field.reportValidity();
        return;
      }
      finish(true, fromKey);
    };

    view.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      if (!event.repeat) open(null);
    }, { signal });
    // A click from the pointer puts the caret under it; one from assistive tech selects it all
    view.addEventListener('click', (event) => {
      open(event.detail === 0 ? null : offsetAt(event.clientX, event.clientY));
    }, { signal });
    // While editing, a press on the box around the text keeps the field focused
    box.addEventListener('mousedown', (event) => {
      if (editing && event.target !== field) event.preventDefault();
    }, { signal });
    // The prefix, or the box past the text: in, with the caret at the end
    box.addEventListener('click', (event) => {
      if (event.target === field || view.contains(event.target)) return;
      open(field.value.length);
    }, { signal });

    field.addEventListener('keydown', (event) => {
      if (event.isComposing || !editing) return;
      if (event.key === 'Tab') return; // Tab moves on: the blur below saves
      if (event.key === 'Escape') {
        event.preventDefault();
        finish(false, true);
      } else if (event.key === 'Enter' && !(multiline && event.shiftKey)) {
        event.preventDefault();
        if (!event.repeat) commit(true);
      }
    }, { signal });
    // Leaving saves. Not when the whole window loses focus: the field gets it back on return
    field.addEventListener('blur', () => {
      if (editing && document.hasFocus()) commit(false);
    }, { signal });
    field.addEventListener('input', () => {
      sync();
      if (field.getAttribute('aria-invalid') === 'true' && field.validity.valid) field.removeAttribute('aria-invalid');
    }, { signal });
    field.form?.addEventListener('reset', () => {
      // The form puts its values back after this event
      setTimeout(() => { if (!signal.aborted) sync(); }, 0);
    }, { signal });

    signal.addEventListener('abort', () => {
      hideCheck();
      stopRoll();
      drawing?.cancel();
    }, { once: true });

    sync();
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
