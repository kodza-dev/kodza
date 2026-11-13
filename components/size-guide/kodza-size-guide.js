// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Size Guide
// A "Size guide" link opens the size chart in a drawer (a modal dialog): from the right on a
// computer, from the bottom on a phone, where it is dragged down by its grip to close. cm and
// inches switch in a segmented control and every figure rolls to its new value; the size picked
// in the product form is underlined in the chart. Settings: the --kz-size-guide-* variables in the
// CSS, data-field on the root (the name of the form's size radios, options[Size] by default),
// data-in on a cell for an exact inch value, and the constants below.
(() => {
  const SELECTOR = '.kodza-size-guide';
  const ROLL = 420; // ms, one figure rolling to its new unit
  const STEP = 24; // ms between two rows of the chart, as the figures roll
  const ARRIVE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const CLOSE_AT = 0.3; // a drag down past this share of the sheet's height closes it (phones)
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
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

  // 110 cm → "43½": inches to the nearest half
  const toInches = (cm) => {
    const half = Math.round((cm / 2.54) * 2) / 2;
    const whole = Math.floor(half);
    return half === whole ? String(whole) : `${whole}½`;
  };

  const phone = window.matchMedia('(max-width: 640px)');
  let uid = 0;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace;
    const trigger = root.querySelector('.kodza-size-guide__trigger');
    const panel = root.querySelector('.kodza-size-guide__panel');
    if (!trigger || !panel) return;
    holdPage(panel, signal);
    const n = ++uid;
    const title = panel.querySelector('.kodza-size-guide__title');
    if (title) {
      title.id = title.id || `kodza-size-guide-${n}`;
      panel.setAttribute('aria-labelledby', title.id);
    }
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    // Two guides on one page keep their own unit
    const units = [...panel.querySelectorAll('.kodza-size-guide__unit input')];
    units.forEach((input) => (input.name = `kodza-size-guide-unit-${n}`));

    // Every figure gets a cell to roll in, and keeps its value in both units
    const figures = [...panel.querySelectorAll('.kodza-size-guide__table td, .kodza-size-guide__u')].map((el) => {
      const cm = el.textContent.trim();
      const unit = el.classList.contains('kodza-size-guide__u');
      const inch = unit ? 'in' : el.dataset.in || toInches(parseFloat(cm));
      const cell = unit ? el : document.createElement('span');
      if (!unit) {
        cell.className = 'kodza-size-guide__cell';
        el.textContent = '';
        el.append(cell);
      } else el.textContent = '';
      const value = document.createElement('span');
      value.textContent = cm;
      cell.append(value);
      const row = el.closest('tr');
      return { cell, cm, inch, row: row ? row.sectionRowIndex + (row.parentElement.tagName === 'TBODY' ? 1 : 0) : 0 };
    });

    const roll = (figure, text) => {
      const { cell } = figure;
      const old = cell.lastElementChild;
      if (old && old.textContent === text) return;
      // Changed again mid-roll: what was leaving goes at once
      [...cell.children].slice(0, -1).forEach((el) => el.remove());
      const next = document.createElement('span');
      next.textContent = text;
      cell.append(next);
      if (still || !old) return old?.remove();
      const options = { duration: ROLL * pace, delay: figure.row * STEP * pace, easing: ARRIVE, fill: 'backwards' };
      old.setAttribute('aria-hidden', 'true');
      old.animate([{ transform: 'none' }, { transform: 'translateY(-110%)' }], { ...options, fill: 'forwards' }).finished
        .then(() => old.remove(), () => {});
      next.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], options);
    };
    const setUnit = () => {
      const inches = units[1]?.checked;
      figures.forEach((figure) => roll(figure, inches ? figure.inch : figure.cm));
    };
    units.forEach((input) => input.addEventListener('change', setUnit, { signal }));

    // The size picked in the product form, underlined in the chart
    const scope = root.closest('form') || document;
    const field = root.dataset.field || 'options[Size]';
    const rows = [...panel.querySelectorAll('tbody tr[data-size]')];
    const pick = () => {
      const picked = [...scope.querySelectorAll('input[type="radio"], input[type="checkbox"], select')]
        .find((el) => el.name === field && (el.tagName === 'SELECT' || el.checked));
      const value = picked ? picked.value : '';
      rows.forEach((row) => row.classList.toggle('is-picked', row.dataset.size === value));
    };
    scope.addEventListener('change', (event) => event.target.name === field && pick(), { signal });
    pick();

    // The cascade order
    [panel.querySelector('.kodza-size-guide__head'), panel.querySelector('.kodza-size-guide__bar'), ...panel.querySelectorAll('.kodza-size-guide__table tr'), panel.querySelector('.kodza-size-guide__how')]
      .filter(Boolean)
      .forEach((el, i) => el.style.setProperty('--i', i));
    const duration = still ? 0 : (parseFloat(getComputedStyle(root).getPropertyValue('--kz-size-guide-duration')) * 1000 || 550) * pace;
    let timer = 0;
    const setY = (y) => panel.style.setProperty('--kz-size-guide-y', `${Math.max(0, y)}px`);

    const open = () => {
      clearTimeout(timer);
      // The underline draws once the drawer is in, not before
      if (!panel.open) rows.forEach((row) => row.classList.remove('is-picked'));
      if (!panel.open) panel.showModal();
      requestAnimationFrame(() => requestAnimationFrame(pick));
      setY(0);
      panel.classList.add('is-moving');
      requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add('is-open')));
      trigger.setAttribute('aria-expanded', 'true');
    };

    const close = () => {
      if (!panel.open || !panel.classList.contains('is-open')) return;
      panel.classList.add('is-moving');
      panel.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      clearTimeout(timer);
      timer = setTimeout(() => {
        panel.close();
        panel.classList.remove('is-moving');
        setY(0);
        trigger.focus({ preventScroll: true });
      }, duration);
    };

    trigger.addEventListener('click', open, { signal });
    panel.querySelector('.kodza-size-guide__close')?.addEventListener('click', close, { signal });
    panel.addEventListener('cancel', (event) => {
      event.preventDefault();
      close();
    }, { signal });
    panel.addEventListener('click', (event) => {
      if (event.target !== panel) return;
      const box = panel.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close();
    }, { signal });

    // Dragging the sheet down on phones: a flick or a long drag closes it, otherwise it springs back
    let start = null;
    [panel.querySelector('.kodza-size-guide__grip'), panel.querySelector('.kodza-size-guide__head')].filter(Boolean).forEach((handle) => {
      handle.addEventListener('pointerdown', (event) => {
        if (!phone.matches || event.target.closest('button')) return;
        start = { pointer: event.clientY, time: performance.now(), last: event.clientY, velocity: 0 };
        handle.setPointerCapture(event.pointerId);
        panel.classList.remove('is-moving');
      }, { signal });
      handle.addEventListener('pointermove', (event) => {
        if (!start) return;
        const dy = event.clientY - start.pointer;
        // Upwards, it resists like a rubber band
        panel.style.setProperty('--kz-size-guide-y', `${dy < 0 ? dy / 6 : dy}px`);
        start.velocity = (event.clientY - start.last) / Math.max(1, performance.now() - start.time);
        start.last = event.clientY;
        start.time = performance.now();
      }, { signal });
      const release = (event) => {
        if (!start) return;
        const dy = event.clientY - start.pointer;
        const flick = start.velocity > 0.6;
        start = null;
        panel.classList.add('is-moving');
        if (flick || dy > panel.offsetHeight * CLOSE_AT) return close();
        setY(0);
      };
      handle.addEventListener('pointerup', release, { signal });
      handle.addEventListener('pointercancel', release, { signal });
    });

    // Stopped while open (or closing): the dialog closes and the page scrolls again
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      if (panel.open) panel.close();
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
