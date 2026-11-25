// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Heatmap
// Draws the <table> inside the figure as a grid of cells: the first column names the rows (days),
// the head names the columns (hours, weeks), and the ink of each cell follows its value. Point at a
// cell, focus the grid and use the arrows, or tap it: its name and value show above it. A Chart /
// Table switch shows the numbers. The table stays in the page for screen readers, and shows alone
// without the script. A cell whose text is not a number gives it in data-value.
// Settings: the --kz-heatmap-* variables in the CSS, data-source on the figure (the note under the
// grid), the words below (data-text-<key> on the figure), the constants under them.
(() => {
  const SELECTOR = '.kodza-heatmap';
  const WORDS = {
    chart: 'Chart',
    table: 'Table',
    view: 'View', // the name of the Chart / Table switch
    role: 'heatmap',
    hint: 'Arrow keys move from cell to cell.',
    read: '{row} {col}: {value}', // read out as the arrows move
    tip: '{row} {col} · {value}', // the bubble above the cell
    busiest: 'Busiest: {row} {col}', // the line under the title
    less: 'Less',
    more: 'More',
  };
  const LEVELS = 4; // shades of ink above an empty cell: the legend shows them all
  const ENTER_AT = 0.35; // the share of the grid in view before the cells fill
  const SWITCH = 460; // ms, the pill of a switch sliding to its option
  const VIEW = 560; // ms, the grid sliding to the table and back
  const NARROW = 480; // px, under this width the card tightens its padding
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const swing = 'cubic-bezier(0.65, 0, 0.35, 1)';

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
    const data = table && readGrid(table);
    if (!data) return;
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const fill = (template, r, c) => template
      .replace('{row}', data.rows[r].label)
      .replace('{col}', data.cols[c])
      .replace('{value}', data.rows[r].cells[c].text || '—');
    const id = `kodza-heatmap-${++uid}`;
    const rows = data.rows.length;
    const cols = data.cols.length;
    const make = maker('kodza-heatmap');
    const timers = new Set();
    const later = (fn, ms) => {
      const t = setTimeout(() => {
        timers.delete(t);
        fn();
      }, ms);
      timers.add(t);
    };
    signal.addEventListener('abort', () => timers.forEach(clearTimeout));
    const fillMs = () => toMs(getComputedStyle(root).getPropertyValue('--kz-heatmap-fill'), 500) * pace;
    const waveMs = () => toMs(getComputedStyle(root).getPropertyValue('--kz-heatmap-wave'), 22) * pace;

    // One scale for the whole grid, cut in LEVELS shades: an empty cell stays empty
    let top = 0;
    let peak = null;
    data.rows.forEach((row, r) => row.cells.forEach((cell, c) => {
      if (cell.value !== null && cell.value > top) {
        top = cell.value;
        peak = [r, c];
      }
    }));
    const levelOf = (v) => (v === null || v <= 0 || !top ? 0 : Math.max(1, Math.ceil((v / top) * LEVELS)));

    const caption = [...root.children].find((el) => el.tagName === 'FIGCAPTION') || table.caption;
    const title = caption ? caption.textContent.trim() : '';
    const head = make('div', 'head');
    const heading = make('div', 'heading');
    if (title) heading.append(make('p', 'title', { 'aria-hidden': 'true' }, title));
    if (peak) heading.append(make('p', 'peak', null, fill(word('busiest'), peak[0], peak[1])));
    const legend = make('div', 'legend', { 'aria-hidden': 'true' });
    legend.append(make('span', null, null, word('less')));
    for (let l = 0; l <= LEVELS; l++) {
      const swatch = make('i', 'swatch');
      swatch.style.setProperty('--o', l ? `var(--kz-heatmap-level-${l})` : 0);
      legend.append(swatch);
    }
    legend.append(make('span', null, null, word('more')));
    head.append(heading, legend);

    const views = make('div', 'views');
    const chart = make('div', 'chart');
    const sheet = make('div', 'sheet', { tabindex: '0', role: 'group', 'aria-label': title || word('table') });
    const foot = make('div', 'foot');
    const live = make('span', 'live', { 'aria-live': 'polite' });
    table.before(head, views, foot, live);
    sheet.append(table);
    views.append(chart, sheet);
    if (root.dataset.source) foot.append(make('p', 'source', null, root.dataset.source));

    // One grid for the row names, the cells and the column names: they line up whatever the size
    const plot = make('div', 'plot', {
      tabindex: '0',
      role: 'group',
      'aria-roledescription': word('role'),
      'aria-description': word('hint'),
    });
    if (title) plot.setAttribute('aria-label', title);
    plot.style.setProperty('--cols', cols);
    const cells = [];
    const rowNames = [];
    data.rows.forEach((row, r) => {
      rowNames.push(plot.appendChild(make('span', 'day', { 'aria-hidden': 'true' }, row.label)));
      cells.push(row.cells.map((cell, c) => {
        const el = make('div', 'cell', { 'aria-hidden': 'true' });
        el.style.setProperty('--r', r);
        el.style.setProperty('--c', c);
        const level = levelOf(cell.value);
        el.style.setProperty('--o', level ? `var(--kz-heatmap-level-${level})` : 0);
        el.dataset.at = `${r},${c}`;
        plot.append(el);
        return el;
      }));
    });
    plot.append(make('span', 'corner', { 'aria-hidden': 'true' }));
    const colNames = data.cols.map((text) => plot.appendChild(make('span', 'axis', { 'aria-hidden': 'true' }, text)));
    // A name wider than its column would stick out of the grid and make it scroll: the last one ends at the edge
    colNames[colNames.length - 1].classList.add('is-last');
    const ring = make('div', 'ring', { 'aria-hidden': 'true' });
    const tip = make('div', 'tip', { 'aria-hidden': 'true' });
    plot.append(ring, tip);
    chart.append(plot);

    let active = null;
    let shown = false;
    let every = 1; // one column name in `every` shows

    // The ring and the bubble move by transform alone, in layout pixels: a parent scaled by
    // `transform` (a thumbnail, a theme) does not shift them
    const placeMarks = () => {
      if (!active) return;
      const cell = cells[active[0]][active[1]];
      const x = cell.offsetLeft;
      const y = cell.offsetTop;
      const w = cell.offsetWidth;
      const h = cell.offsetHeight;
      ring.style.setProperty('--x', `${x}px`);
      ring.style.setProperty('--y', `${y}px`);
      ring.style.setProperty('--w', `${w}px`);
      ring.style.setProperty('--h', `${h}px`);
      tip.textContent = fill(word('tip'), active[0], active[1]);
      const half = tip.offsetWidth / 2;
      const first = cells[0][0].offsetLeft;
      const last = cells[0][cols - 1].offsetLeft + cells[0][cols - 1].offsetWidth;
      const center = Math.min(Math.max(x + w / 2, first + half), last - half);
      // Above its cell, or under it on the first row: it never covers the title
      const below = active[0] === 0;
      tip.style.setProperty('--x', `${center}px`);
      tip.style.setProperty('--y', below ? `${y + h + 8}px` : `${y - tip.offsetHeight - 8}px`);
    };

    const activate = (at, speak) => {
      const same = at && active && at[0] === active[0] && at[1] === active[1];
      if (same || (!at && !active)) return;
      if (active) {
        cells[active[0]][active[1]].classList.remove('is-active');
        rowNames[active[0]].classList.remove('is-active');
        colNames[active[1]].classList.remove('is-active');
        colNames.forEach((el) => el.classList.remove('is-yielding'));
      }
      const first = !active;
      active = at;
      root.classList.toggle('is-pointing', !!at);
      if (!at) {
        live.textContent = '';
        return;
      }
      cells[at[0]][at[1]].classList.add('is-active');
      rowNames[at[0]].classList.add('is-active');
      colNames[at[1]].classList.add('is-active');
      // A column name that was skipped shows: the names beside it step aside
      colNames.forEach((el, i) => el.classList.toggle('is-yielding', i !== at[1] && Math.abs(i - at[1]) < every));
      // The first time they appear in place, after that they glide from cell to cell
      if (first) {
        ring.style.transition = 'none';
        tip.style.transition = 'none';
      }
      placeMarks();
      if (first) {
        tip.offsetWidth;
        ring.style.transition = '';
        tip.style.transition = '';
      }
      if (speak) {
        live.textContent = fill(word('read'), at[0], at[1]);
        // A grid that scrolls sideways brings the cell into view
        const cell = cells[at[0]][at[1]];
        const left = cell.offsetLeft - rowNames[0].offsetWidth - 8;
        const right = cell.offsetLeft + cell.offsetWidth + 8 - chart.clientWidth;
        if (chart.scrollLeft > left) chart.scrollLeft = left;
        else if (chart.scrollLeft < right) chart.scrollLeft = right;
      }
    };

    const cellAt = (event) => {
      const el = event.target.closest?.('.kodza-heatmap__cell');
      if (!el || !plot.contains(el)) return undefined;
      return el.dataset.at.split(',').map(Number);
    };
    plot.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      const at = cellAt(event);
      if (at) activate(at, false); // in a gap between two cells, the last one stays
    }, { signal });
    plot.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'touch') activate(cellAt(event) || null, false);
    }, { signal });
    plot.addEventListener('pointerleave', (event) => {
      if (event.pointerType !== 'touch' && !plot.matches(':focus-visible')) activate(null);
    }, { signal });
    document.addEventListener('pointerdown', (event) => {
      if (!plot.contains(event.target)) activate(null);
    }, { signal });

    // The arrows move in the grid; Home and End go to the ends of the row
    plot.addEventListener('keydown', (event) => {
      const [r, c] = active || [-1, -1];
      let to = null;
      if (event.key === 'ArrowRight') to = active ? [r, Math.min(cols - 1, c + 1)] : [0, 0];
      else if (event.key === 'ArrowLeft') to = active ? [r, Math.max(0, c - 1)] : [0, cols - 1];
      else if (event.key === 'ArrowDown') to = active ? [Math.min(rows - 1, r + 1), c] : [0, 0];
      else if (event.key === 'ArrowUp') to = active ? [Math.max(0, r - 1), c] : [rows - 1, 0];
      else if (event.key === 'Home') to = [Math.max(0, r), 0];
      else if (event.key === 'End') to = [Math.max(0, r), cols - 1];
      else if (event.key === 'Escape' && active) {
        activate(null);
        event.preventDefault();
        return;
      }
      if (!to) return;
      event.preventDefault();
      activate(to, true);
    }, { signal });
    plot.addEventListener('blur', () => activate(null), { signal });

    // The cells fill in a wave, from the top left corner, when the grid comes into view
    const enter = () => {
      shown = true;
      if (still) {
        root.classList.add('is-reset');
        root.classList.remove('is-waiting');
        root.offsetWidth;
        root.classList.remove('is-reset');
        return;
      }
      root.classList.add('is-entering');
      root.offsetWidth;
      root.classList.remove('is-waiting');
      later(() => root.classList.remove('is-entering'), fillMs() + (rows + cols) * waveMs() + 50);
    };
    root.classList.add('is-waiting');

    // A grid wider than the card opens on its last columns, the latest ones; a fade on a cut edge
    // says there is more
    let moved = false;
    const edges = () => {
      const max = chart.scrollWidth - chart.clientWidth;
      chart.classList.toggle('is-cut-start', chart.scrollLeft > 1);
      chart.classList.toggle('is-cut-end', chart.scrollLeft < max - 1);
    };
    chart.addEventListener('scroll', () => {
      moved = chart.scrollLeft < chart.scrollWidth - chart.clientWidth - 1;
      edges();
    }, { signal, passive: true });

    // On a narrow grid the column names take turns: one in two, or one in three
    const thin = () => {
      root.classList.toggle('is-narrow', root.offsetWidth < NARROW);
      const room = cells[0][0].offsetWidth + (cols > 1 ? cells[0][1].offsetLeft - cells[0][0].offsetLeft - cells[0][0].offsetWidth : 0);
      if (!room) return;
      const scale = scaleOf(plot);
      const range = document.createRange();
      let widest = 0;
      colNames.forEach((el) => {
        el.classList.remove('is-skipped');
        range.selectNodeContents(el);
        widest = Math.max(widest, range.getBoundingClientRect().width / scale);
      });
      every = Math.max(1, Math.ceil((widest + 8) / room));
      colNames.forEach((el, i) => el.classList.toggle('is-skipped', i % every !== 0));
      placeMarks();
      chart.style.setProperty('--names', `${rowNames[0].offsetWidth}px`);
      if (!moved) chart.scrollLeft = chart.scrollWidth;
      edges();
    };

    // Chart and Table: the new one comes in from its side while the old one leaves
    let view = 'chart';
    const setView = (to) => {
      const next = to === 1 ? 'table' : 'chart';
      if (next === view) return;
      const leaving = view === 'chart' ? chart : sheet;
      const coming = next === 'chart' ? chart : sheet;
      const dir = next === 'table' ? 1 : -1;
      view = next;
      activate(null);
      const from = views.offsetHeight;
      if (!still) leaving.classList.add('is-leaving');
      root.classList.toggle('is-table', next === 'table');
      chart.inert = next === 'table';
      chart.toggleAttribute('aria-hidden', next === 'table');
      // The legend tells the shades: the table has none
      legend.inert = next === 'table';
      if (still) return;
      const toHeight = views.offsetHeight;
      views.classList.add('is-swapping');
      const timing = { duration: VIEW * pace, easing: swing };
      const anims = [
        views.animate([{ height: `${from}px` }, { height: `${toHeight}px` }], timing),
        // The old view is mostly gone before the new one shows: two layers of numbers never read at once
        leaving.animate([{ transform: 'none', opacity: 1 }, { transform: `translateX(${-dir * 32}px)`, opacity: 0 }], { duration: VIEW * pace * 0.4, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' }),
        coming.animate([{ transform: `translateX(${dir * 32}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: VIEW * pace * 0.7, easing: ease, delay: VIEW * pace * 0.3, fill: 'backwards' }),
      ];
      Promise.all(anims.map((a) => a.finished)).then(() => {
        anims.forEach((a) => a.cancel());
        leaving.classList.remove('is-leaving');
        views.classList.remove('is-swapping');
      }, () => {});
    };
    foot.append(makeSwitch({
      make,
      name: `${id}-view`,
      options: [word('chart'), word('table')],
      label: word('view'),
      quiet: true,
      duration: still ? 0 : SWITCH * pace,
      onChange: setView,
      signal,
    }));

    thin();
    document.fonts?.ready.then(() => {
      if (!signal.aborted) thin();
    });
    const resize = new ResizeObserver(thin);
    resize.observe(root);
    const watch = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      watch.disconnect();
      enter();
    }, { threshold: ENTER_AT });
    // The visible part, not the grid: a grid cut by its scroll would never reach the threshold
    watch.observe(chart);
    signal.addEventListener('abort', () => {
      resize.disconnect();
      watch.disconnect();
    });

    // kodza:replay on the figure empties the cells and fills them again
    root.addEventListener('kodza:replay', () => {
      if (!shown) return;
      root.classList.add('is-reset', 'is-waiting');
      root.offsetWidth;
      root.classList.remove('is-reset');
      enter();
    }, { signal });
  }

  // The chart engine: reads a <table>, slides a switch. Bar Chart, Line Chart and Donut carry the
  // same block.
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

  // A number as it is written in a cell: "1,204", "1 204,5", "€12.5k" is not read, "14 h" is
  const parseNumber = (text) => {
    let t = String(text).replace(/[\s  ]/g, '').replace(/[−–]/g, '-');
    const m = t.match(/-?[\d.,]+/);
    if (!m) return null;
    t = m[0];
    const dot = t.lastIndexOf('.');
    const comma = t.lastIndexOf(',');
    if (dot >= 0 && comma >= 0) {
      const decimal = dot > comma ? '.' : ',';
      t = t.split(decimal === '.' ? ',' : '.').join('').replace(',', '.');
    } else if (comma >= 0) {
      t = /^-?\d{1,3}(,\d{3})+$/.test(t) ? t.replace(/,/g, '') : t.replace(',', '.');
    } else if ((t.match(/\./g) || []).length > 1) {
      t = t.replace(/\./g, '');
    }
    const v = parseFloat(t);
    return Number.isFinite(v) ? v : null;
  };

  // Rows are the first column, columns the head: every other cell is one square of the grid
  const readGrid = (table) => {
    const head = table.tHead?.rows[0] || table.rows[0];
    if (!head) return null;
    const body = [...table.rows].filter((r) => r !== head && r.parentElement?.tagName !== 'TFOOT');
    const cols = [...head.cells].slice(1).map((c) => c.textContent.trim());
    if (!cols.length || !body.length) return null;
    return {
      cols,
      rows: body.map((r) => ({
        label: r.cells[0]?.textContent.trim() || '',
        cells: cols.map((_, c) => {
          const cell = r.cells[c + 1];
          const text = cell ? cell.textContent.trim() : '';
          return { text, value: cell ? parseNumber(cell.dataset.value ?? text) : null };
        }),
      })),
    };
  };

  // A switch: real radio buttons, an ink pill cut to the chosen option, and a white copy of the
  // labels under it. The pill stretches toward the new option first, then lets go of the old one.
  const makeSwitch = ({ make, name, options, label, quiet, duration, onChange, signal }) => {
    const box = make('div', quiet ? 'switch switch--quiet' : 'switch', { role: 'radiogroup', 'aria-label': label });
    const pill = make('span', 'pill', { 'aria-hidden': 'true' });
    const inputs = options.map((text, i) => {
      const option = make('label', 'option');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = name;
      input.value = i;
      input.checked = i === 0;
      option.append(input, text);
      box.append(option);
      pill.append(make('span', 'copy', null, text));
      return input;
    });
    box.append(pill);
    let chosen = 0;
    let anim = null;
    const cut = (i) => {
      const option = inputs[i].parentElement;
      const left = option.offsetLeft - pill.offsetLeft;
      const right = pill.offsetWidth - left - option.offsetWidth;
      return { left, right };
    };
    const clip = ({ left, right }) => `inset(0 ${right}px 0 ${left}px round var(--kz-radius-pill, 999px))`;
    const rest = () => {
      if (!pill.offsetWidth) return;
      anim?.cancel();
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
