// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Comparison Table
// Works on the <table> inside: each <tbody> whose first row is a th[scope="rowgroup"] folds under
// its title, the ticks draw as a group comes into view, the featured column gets its band, and on
// a narrow width a switch shows one plan at a time, its values rolling in place. Without the
// script, the table simply shows. data-closed on a <tbody> starts it folded.
// Settings: the --kz-comparison-table-* variables in the CSS, the words below (data-text-<key> on
// the root), the constants under them.
(() => {
  const SELECTOR = '.kodza-comparison-table';
  const WORDS = {
    plans: 'Plan', // the name of the switch between the plans, on a narrow width
  };
  const ENTER_AT = 0.2; // the share of a group in view before its ticks draw
  const NARROW = 600; // px, under this width one plan shows at a time
  const SWITCH = 460; // ms, the pill of the switch sliding to its plan
  const ROLL = 420; // ms, the values rolling to the next plan
  const WAVE = 18; // ms between two rows rolling
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const swing = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const TICK = 'M5 10.4l3.3 3.3L15.2 6.6';

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
    const table = root.querySelector('table');
    const headRow = table?.tHead?.rows[0];
    if (!headRow || headRow.cells.length < 2) return;
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const make = maker('kodza-comparison-table');
    const id = `kodza-comparison-table-${++uid}`;
    const timers = new Set();
    const later = (fn, ms) => {
      const t = setTimeout(() => {
        timers.delete(t);
        fn();
      }, ms);
      timers.add(t);
    };
    signal.addEventListener('abort', () => timers.forEach(clearTimeout));
    const foldMs = () => toMs(getComputedStyle(root).getPropertyValue('--kz-comparison-table-fold'), 500) * pace;

    const plans = [...headRow.cells].slice(1);
    const count = plans.length;
    const featured = plans.findIndex((th) => th.classList.contains('kodza-comparison-table__plan--featured'));

    // Explicit roles: on a narrow width the rows become grids, and a browser drops the table
    // semantics of an element whose display changes
    table.setAttribute('role', 'table');
    [...table.children].forEach((part) => {
      if (/^(THEAD|TBODY|TFOOT)$/.test(part.tagName)) part.setAttribute('role', 'rowgroup');
    });
    [...table.rows].forEach((row) => {
      row.setAttribute('role', 'row');
      [...row.cells].forEach((cell) => {
        const scope = cell.getAttribute('scope');
        cell.setAttribute('role', scope === 'col' ? 'columnheader' : scope === 'row' || scope === 'rowgroup' ? 'rowheader' : 'cell');
        if (cell.colSpan > 1) cell.setAttribute('aria-colspan', cell.colSpan);
      });
    });

    // The frame holds the band of the featured column, behind the table
    const frame = make('div', 'frame');
    const band = make('span', 'band', { 'aria-hidden': 'true' });
    table.before(frame);
    frame.append(band, table);

    // The ticks: drawn strokes, the words stay for screen readers
    const drawTicks = (scope) => scope.querySelectorAll('.kodza-comparison-table__yes').forEach((yes) => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 20 20');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', TICK);
      path.setAttribute('pathLength', '1');
      svg.append(path);
      yes.append(svg);
    });

    // The groups: a button on the title row, every cell of the other rows in a fold
    const groups = [...table.tBodies].map((body) => {
      const titleRow = body.rows[0];
      const cell = titleRow?.cells[0];
      const rows = [...body.rows];
      const titled = cell && cell.tagName === 'TH' && cell.getAttribute('scope') === 'rowgroup';
      const lines = titled ? rows.slice(1) : rows;
      lines.forEach((row, r) => {
        row.classList.add('kodza-comparison-table__line');
        row.style.setProperty('--r', r);
        [...row.cells].forEach((c) => {
          const fold = make('div', 'fold');
          const clip = make('div', 'clip');
          const pad = make('div', 'pad');
          pad.append(...c.childNodes);
          clip.append(pad);
          fold.append(clip);
          c.append(fold);
        });
      });
      drawTicks(body);
      const group = { body, lines, open: !body.hasAttribute('data-closed'), button: null };
      if (titled) {
        titleRow.classList.add('kodza-comparison-table__group');
        const name = cell.textContent.trim();
        const button = make('button', 'toggle', { type: 'button', 'aria-expanded': String(group.open) });
        button.append(
          make('span', 'title', null, name),
          make('span', 'count', { 'aria-hidden': 'true' }, String(lines.length)),
          make('span', 'chevron', { 'aria-hidden': 'true' }),
        );
        cell.replaceChildren(button);
        group.button = button;
      }
      if (!group.open) {
        body.classList.add('is-closed');
        lines.forEach((row) => { row.hidden = true; });
      }
      return group;
    });

    // The band follows the featured column; on a narrow width its header alone says it
    const placeBand = () => {
      const target = plans[featured];
      root.classList.toggle('has-band', !!target && !narrow);
      if (!target || narrow || !frame.offsetWidth) return;
      const scale = scaleOf(frame);
      const box = frame.getBoundingClientRect();
      const cell = target.getBoundingClientRect();
      band.style.left = `${(cell.left - box.left) / scale}px`;
      band.style.width = `${cell.width / scale}px`;
      band.style.top = `${(cell.top - box.top) / scale}px`;
    };

    // Folding: the cells glide to no height, then the rows leave the page for screen readers too
    const setOpen = (group, open) => {
      if (group.open === open) return;
      group.open = open;
      group.button?.setAttribute('aria-expanded', String(open));
      const { body, lines } = group;
      if (open) {
        lines.forEach((row) => { row.hidden = false; });
        body.classList.remove('is-drawn');
        body.getBoundingClientRect();
        body.classList.remove('is-closed');
        // The ticks draw again as the rows come back
        requestAnimationFrame(() => body.classList.add('is-drawn'));
      } else {
        body.classList.add('is-closed');
        const ms = still ? 0 : foldMs();
        later(() => {
          if (!group.open) lines.forEach((row) => { row.hidden = true; });
        }, ms);
      }
    };
    groups.forEach((group) => {
      group.button?.addEventListener('click', () => setOpen(group, !group.open), { signal });
    });

    // On a narrow width: a switch picks the plan, the other columns stack under it
    let narrow = false;
    let chosen = featured >= 0 ? featured : 0;
    const columns = [...table.rows].filter((row) => row === headRow || row.classList.contains('kodza-comparison-table__line'))
      .map((row) => [...row.cells].slice(1));
    const mark = () => columns.forEach((cells) => cells.forEach((c, i) => c.classList.toggle('is-off', i !== chosen)));
    mark();

    const pickerRow = document.createElement('tr');
    pickerRow.className = 'kodza-comparison-table__picker';
    pickerRow.setAttribute('role', 'row');
    const pickerCell = document.createElement('td');
    pickerCell.colSpan = count + 1;
    pickerCell.setAttribute('role', 'cell');
    pickerCell.setAttribute('aria-colspan', count + 1);
    pickerRow.append(pickerCell);
    const names = plans.map((th) => th.getAttribute('abbr') || th.querySelector('.kodza-comparison-table__name')?.firstChild?.textContent.trim() || th.textContent.trim());
    pickerCell.append(makeSwitch({
      make,
      name: id,
      options: names,
      start: chosen,
      label: word('plans'),
      duration: still ? 0 : SWITCH * pace,
      onChange: (i) => show(i),
      signal,
    }));
    headRow.before(pickerRow);

    const show = (i) => {
      const prev = chosen;
      if (i === prev) return;
      chosen = i;
      const dir = i > prev ? 1 : -1;
      let wave = 0;
      columns.forEach((cells) => {
        cells.forEach((c) => c.getAnimations().forEach((a) => a.cancel()));
        cells.forEach((c, k) => c.classList.toggle('is-off', k !== i && k !== prev));
        const out = cells[prev];
        const into = cells[i];
        const row = into.parentElement;
        if (still || !narrow || row.hidden) {
          out.classList.add('is-off');
          return;
        }
        const timing = { duration: ROLL * pace, easing: ease, delay: Math.min(wave++, 14) * WAVE * pace };
        into.animate([{ transform: `translateY(${110 * dir}%)` }, { transform: 'none' }], { ...timing, fill: 'backwards' });
        out.animate([{ transform: 'none' }, { transform: `translateY(${-110 * dir}%)` }], { ...timing, fill: 'forwards' })
          .finished.then(() => {
            if (cells[chosen] !== out) out.classList.add('is-off');
            out.getAnimations().forEach((a) => a.cancel());
          }, () => {});
      });
    };

    const fit = () => {
      const next = root.offsetWidth < NARROW;
      if (next !== narrow) {
        narrow = next;
        root.classList.add('is-reset');
        root.classList.toggle('is-narrow', narrow);
        columns.forEach((cells) => cells.forEach((c) => c.getAnimations().forEach((a) => a.cancel())));
        mark();
        root.getBoundingClientRect();
        root.classList.remove('is-reset');
      }
      placeBand();
    };
    fit();
    const resize = new ResizeObserver(fit);
    resize.observe(root);
    resize.observe(table);
    signal.addEventListener('abort', () => resize.disconnect());

    // The ticks of a group draw once it comes into view, row after row
    if (still) {
      groups.forEach((g) => g.body.classList.add('is-drawn'));
    } else {
      const watch = new IntersectionObserver((entries) => entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-drawn');
        watch.unobserve(entry.target);
      }), { threshold: ENTER_AT });
      groups.forEach((g) => watch.observe(g.body));
      signal.addEventListener('abort', () => watch.disconnect());
    }

    // kodza:replay on the root draws the ticks again
    root.addEventListener('kodza:replay', () => {
      root.classList.add('is-reset');
      groups.forEach((g) => g.body.classList.remove('is-drawn'));
      root.getBoundingClientRect();
      root.classList.remove('is-reset');
      requestAnimationFrame(() => groups.forEach((g) => g.body.classList.add('is-drawn')));
    }, { signal });

  }

  // The engine shared with the data family: makes elements, reads a duration, slides a switch.
  const maker = (base) => (tag, classes, attrs, text) => {
    const el = document.createElement(tag);
    if (classes) el.className = classes.split(' ').map((c) => `${base}__${c}`).join(' ');
    if (attrs) Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    if (text != null) el.textContent = text;
    return el;
  };

  const toMs = (value, fallback) => {
    const v = parseFloat(value);
    if (!(v >= 0)) return fallback;
    return /ms\s*$/.test(value) ? v : v * 1000;
  };

  // The screen size of an element over its layout size: a parent scaled by `transform`
  const scaleOf = (el) => (el.offsetWidth ? el.getBoundingClientRect().width / el.offsetWidth : 1) || 1;

  // A switch: real radio buttons, an ink pill cut to the chosen option, and a white copy of the
  // labels under it. The pill stretches toward the new option first, then lets go of the old one.
  const makeSwitch = ({ make, name, options, start = 0, label, quiet, duration, onChange, signal }) => {
    const box = make('div', quiet ? 'switch switch--quiet' : 'switch', { role: 'radiogroup', 'aria-label': label });
    const pill = make('span', 'pill', { 'aria-hidden': 'true' });
    const inputs = options.map((text, i) => {
      const option = make('label', 'option');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = name;
      input.value = i;
      input.checked = i === start;
      option.append(input, text);
      box.append(option);
      pill.append(make('span', 'copy', null, text));
      return input;
    });
    box.append(pill);
    let chosen = start;
    let anim = null;
    const cut = (i) => {
      const option = inputs[i].parentElement;
      const left = option.offsetLeft - pill.offsetLeft;
      const right = pill.offsetWidth - left - option.offsetWidth;
      return { left, right };
    };
    const clip = ({ left, right }) => `inset(0 ${right}px 0 ${left}px round var(--kz-radius-pill, 999px))`;
    const rest = () => {
      anim?.cancel();
      // Hidden (a wide table, or the script running before its CSS): no cut measured on a layout
      // that is not the real one; the observer cuts it again when it shows
      if (!pill.offsetWidth) {
        pill.style.clipPath = '';
        return;
      }
      pill.style.clipPath = clip(cut(chosen));
    };
    inputs.forEach((input, i) => input.addEventListener('change', () => {
      if (!input.checked) return;
      const from = cut(chosen);
      const to = cut(i);
      chosen = i;
      pill.style.clipPath = clip(to);
      if (duration) {
        anim?.cancel();
        const lead = to.left > from.left
          ? { left: from.left + (to.left - from.left) * 0.25, right: to.right }
          : { left: to.left, right: from.right + (to.right - from.right) * 0.25 };
        anim = pill.animate([
          { clipPath: clip(from) },
          { clipPath: clip(lead), offset: 0.55 },
          { clipPath: clip(to) },
        ], { duration, easing: swing });
      }
      onChange(i);
    }, { signal }));
    const resize = new ResizeObserver(rest);
    resize.observe(box);
    signal.addEventListener('abort', () => resize.disconnect());
    return box;
  };

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
