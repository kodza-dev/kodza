// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Bar Chart
// Draws the <table> inside the figure: one bar per row, a switch when there are several value
// columns, and a Chart / Table switch. The table stays in the page for screen readers, and shows
// alone without the script. A cell whose text is not a number gives it in data-value.
// Settings: the --kz-bar-chart-* variables in the CSS, data-source on the figure (the note under
// the chart), the words below (data-text-<key> on the figure), the constants under them.
(() => {
  const SELECTOR = '.kodza-bar-chart';
  const WORDS = {
    chart: 'Chart',
    table: 'Table',
    series: 'Series', // the name of the switch between the value columns
    view: 'View', // the name of the Chart / Table switch
    role: 'bar chart',
    hint: 'Arrow keys read the bars one by one.',
    read: '{label}, {series}: {value}', // read out as the arrows move
  };
  const ENTER_AT = 0.35; // the share of the chart in view before the bars rise
  const LINES = 4; // gaps between gridlines, shared by every series so the heights compare
  const HEADROOM = 1.04; // the tallest bar stops just under the top line
  const STEPS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]; // the round steps a scale can take, times 10ⁿ
  const SWITCH = 460; // ms, the pill of a switch sliding to its option
  const VIEW = 560; // ms, the chart sliding to the table and back
  const ROLL = 420; // ms, a tick or a value rolling to its new number
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
    const data = table && readTable(table);
    if (!data) return;
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const horizontal = root.classList.contains('kodza-bar-chart--horizontal');
    const id = `kodza-bar-chart-${++uid}`;
    const n = data.rows.length;
    const make = maker('kodza-bar-chart');
    const timers = new Set();
    const later = (fn, ms) => {
      const t = setTimeout(() => {
        timers.delete(t);
        fn();
      }, ms);
      timers.add(t);
    };
    signal.addEventListener('abort', () => timers.forEach(clearTimeout));
    const growMs = () => toMs(getComputedStyle(root).getPropertyValue('--kz-bar-chart-grow'), 900) * pace;

    const caption = [...root.children].find((el) => el.tagName === 'FIGCAPTION') || table.caption;
    const title = caption ? caption.textContent.trim() : '';
    const head = make('div', 'head');
    if (title) head.append(make('p', 'title', { 'aria-hidden': 'true' }, title));
    const views = make('div', 'views');
    const chart = make('div', 'chart');
    const sheet = make('div', 'sheet');
    const foot = make('div', 'foot');
    const live = make('span', 'live', { 'aria-live': 'polite' });
    table.before(head, views, foot, live);
    sheet.append(table);
    views.append(chart, sheet);
    if (root.dataset.source) foot.append(make('p', 'source', null, root.dataset.source));

    let series = 0;
    let shown = false;
    let active = -1;
    // One scale for every column: 2025 has to look lower than 2026, not rescaled to the same height
    const shared = Math.max(...data.series.map((s) => Math.max(0, ...s.values.map((v) => v ?? 0)))) || 1;
    const { step } = niceScale(shared);
    const share = (i) => {
      const v = data.series[series].values[i] ?? 0;
      return Math.max(0, Math.min(1, horizontal ? v / shared : v / (step * LINES)));
    };

    const plot = make('div', horizontal ? 'rows' : 'plot', {
      tabindex: '0',
      role: 'group',
      'aria-roledescription': word('role'),
      'aria-description': word('hint'),
    });
    plot.style.setProperty('--n', n);
    const items = [];
    const labels = [];
    const values = [];
    const tickBoxes = [];
    let tip = null;
    let axis = null;
    let ticks = null;

    if (horizontal) {
      data.rows.forEach((row, i) => {
        const line = make('div', 'row', { 'aria-hidden': 'true' });
        line.style.setProperty('--i', i);
        const track = make('div', 'track');
        track.append(make('div', 'fill'), make('span', 'name', null, row.label), make('span', 'name name--on', null, row.label));
        const value = make('span', 'value');
        const box = make('span', 'roll');
        value.append(box);
        line.append(track, value);
        plot.append(line);
        items.push(line);
        values.push(box);
      });
    } else {
      ticks = make('div', 'ticks', { 'aria-hidden': 'true' });
      const cols = make('div', 'cols', { 'aria-hidden': 'true' });
      const lines = make('div', 'lines');
      axis = make('div', 'axis', { 'aria-hidden': 'true' });
      cols.style.setProperty('--n', n);
      axis.style.setProperty('--n', n);
      for (let i = 0; i <= LINES; i++) {
        const line = make('span');
        line.style.setProperty('--at', i / LINES);
        lines.append(line);
        const tick = make('span', 'tick');
        tick.style.setProperty('--at', i / LINES);
        const box = make('span', 'roll');
        tick.append(box);
        ticks.append(tick);
        tickBoxes.push(box);
      }
      cols.append(lines);
      data.rows.forEach((row, i) => {
        const col = make('div', 'col');
        col.style.setProperty('--i', i);
        col.append(make('div', 'bar'));
        cols.append(col);
        items.push(col);
        labels.push(axis.appendChild(make('span', null, null, row.label)));
      });
      tip = make('div', 'tip');
      cols.append(tip);
      plot.append(ticks, cols, axis);
    }
    chart.append(plot);

    const roll = roller(still ? 0 : ROLL * pace);
    const textOf = (s, i) => data.series[s].texts[i] || '—';
    const label = () => [title, data.series.length > 1 ? data.series[series].name : ''].filter(Boolean).join(', ');

    // The ticks and the values, in the column's own units (a "h", a "€" read in its cells)
    const tickText = (s, i) => {
      const { prefix, suffix } = data.series[s];
      return `${prefix}${formatNumber(step * i, data.lang)}${suffix}`;
    };
    const write = (animate) => {
      if (horizontal) values.forEach((box, i) => roll(box, textOf(series, i), animate));
      else tickBoxes.forEach((box, i) => roll(box, tickText(series, i), animate));
      plot.setAttribute('aria-label', label());
    };

    // The gutters keep one width for every column of values, so nothing shifts on a switch
    const fit = () => {
      const probe = make('span', horizontal ? 'value' : 'tick');
      probe.style.cssText = 'position:absolute;visibility:hidden;transform:none;inset:auto';
      (horizontal ? plot : ticks).append(probe);
      let widest = 0;
      data.series.forEach((s, k) => {
        const texts = horizontal ? s.texts : Array.from({ length: LINES + 1 }, (_, i) => tickText(k, i));
        texts.forEach((t) => {
          probe.textContent = t || '—';
          widest = Math.max(widest, probe.getBoundingClientRect().width / scaleOf(probe.parentElement));
        });
      });
      probe.remove();
      if (horizontal) plot.style.setProperty('--value-width', `${Math.ceil(widest)}px`);
      else ticks.style.minWidth = `${Math.ceil(widest)}px`;
    };

    // On a narrow chart the month names take turns: one in two, or one in three
    const thin = () => {
      root.classList.toggle('is-narrow', root.offsetWidth < NARROW);
      if (tip) {
        tip.parentElement.style.setProperty('--cw', tip.parentElement.offsetWidth);
        tip.parentElement.style.setProperty('--ch', tip.parentElement.offsetHeight);
      }
      if (!axis) return;
      const room = axis.offsetWidth / n;
      const scale = scaleOf(axis);
      const range = document.createRange();
      let widest = 0;
      labels.forEach((el) => {
        el.classList.remove('is-skipped');
        range.selectNodeContents(el);
        widest = Math.max(widest, range.getBoundingClientRect().width / scale);
      });
      const every = Math.max(1, Math.ceil((widest + 8) / room));
      labels.forEach((el, i) => el.classList.toggle('is-skipped', i % every !== 0));
    };

    const place = () => {
      items.forEach((item, i) => item.style.setProperty('--v', shown ? share(i) : 0));
      if (horizontal) {
        const order = data.rows.map((_, i) => i).sort((a, b) => (data.series[series].values[b] ?? -Infinity) - (data.series[series].values[a] ?? -Infinity));
        order.forEach((i, rank) => {
          items[i].style.setProperty('--rank', rank);
          items[i].dataset.rank = rank;
        });
      }
      if (tip && active >= 0) {
        tip.style.setProperty('--tv', shown ? share(active) : 0);
        tip.textContent = textOf(series, active);
      }
    };

    // The bars rise one after another when the chart comes into view
    const enter = () => {
      shown = true;
      if (still) {
        root.classList.add('is-reset');
        place();
        root.offsetWidth;
        root.classList.remove('is-reset');
        return;
      }
      root.classList.add('is-entering');
      root.offsetWidth;
      place();
      later(() => root.classList.remove('is-entering'), growMs() + n * 50 * pace + 50);
    };

    const setSeries = (s) => {
      if (s === series) return;
      series = s;
      if (shown && !still) {
        root.classList.remove('is-entering');
        root.classList.add('is-moving');
        later(() => root.classList.remove('is-moving'), growMs() + n * 18 * pace + 50);
      }
      place();
      write(shown);
      if (active >= 0) announce();
    };

    // Reading one bar: the others step back, its value rides above it
    const announce = () => {
      live.textContent = word('read')
        .replace('{label}', data.rows[active].label)
        .replace('{series}', data.series[series].name)
        .replace('{value}', textOf(series, active));
    };
    const activate = (i, speak) => {
      if (i === active) return;
      if (active >= 0) {
        items[active].classList.remove('is-active');
        labels[active]?.classList.remove('is-active');
      }
      const first = active < 0;
      active = i;
      root.classList.toggle('is-pointing', i >= 0);
      if (i < 0) {
        live.textContent = '';
        return;
      }
      items[i].classList.add('is-active');
      labels[i]?.classList.add('is-active');
      if (tip) {
        // The first time it appears in place, after that it glides from bar to bar
        if (first) tip.style.transition = 'none';
        tip.style.setProperty('--tx', (i + 0.5) / n);
        tip.style.setProperty('--tv', shown ? share(i) : 0);
        tip.textContent = textOf(series, i);
        if (first) {
          tip.offsetWidth;
          tip.style.transition = '';
        }
      }
      if (speak) announce();
    };

    const indexAt = (event) => {
      const box = (horizontal ? plot : items[0].parentElement).getBoundingClientRect();
      if (horizontal) {
        const rank = Math.floor(((event.clientY - box.top) / box.height) * n);
        if (rank < 0 || rank >= n) return -1;
        return items.findIndex((item) => Number(item.dataset.rank) === rank);
      }
      const x = (event.clientX - box.left) / box.width;
      if (x < 0 || x >= 1) return -1;
      return Math.floor(x * n);
    };
    plot.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'mouse' || event.pointerType === 'pen') activate(indexAt(event), false);
    }, { signal });
    plot.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'touch') activate(indexAt(event), false);
    }, { signal });
    plot.addEventListener('pointerleave', (event) => {
      if (event.pointerType !== 'touch' && !plot.matches(':focus-visible')) activate(-1);
    }, { signal });
    document.addEventListener('pointerdown', (event) => {
      if (!plot.contains(event.target)) activate(-1);
    }, { signal });

    // The arrows go along the bars, in the order they are drawn: by rank for a ranking
    const byRank = (i) => (horizontal ? Number(items[i].dataset.rank) : i);
    const atRank = (rank) => (horizontal ? items.findIndex((item) => Number(item.dataset.rank) === rank) : rank);
    plot.addEventListener('keydown', (event) => {
      const now = active < 0 ? -1 : byRank(active);
      let to = null;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') to = now < 0 ? 0 : Math.min(n - 1, now + 1);
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') to = now < 0 ? n - 1 : Math.max(0, now - 1);
      else if (event.key === 'Home') to = 0;
      else if (event.key === 'End') to = n - 1;
      else if (event.key === 'Escape' && active >= 0) {
        activate(-1);
        event.preventDefault();
        return;
      }
      if (to === null) return;
      event.preventDefault();
      activate(atRank(to), true);
    }, { signal });
    plot.addEventListener('blur', () => activate(-1), { signal });

    let picker = null;
    if (data.series.length > 1) {
      picker = makeSwitch({
        make,
        name: `${id}-series`,
        options: data.series.map((s) => s.name),
        label: word('series'),
        duration: still ? 0 : SWITCH * pace,
        onChange: setSeries,
        signal,
      });
      head.append(picker);
    }

    // Chart and Table: the new one comes in from its side while the old one leaves
    let view = 'chart';
    const setView = (to) => {
      const next = to === 1 ? 'table' : 'chart';
      if (next === view) return;
      const leaving = view === 'chart' ? chart : sheet;
      const coming = next === 'chart' ? chart : sheet;
      const dir = next === 'table' ? 1 : -1;
      view = next;
      activate(-1);
      const from = views.offsetHeight;
      if (!still) leaving.classList.add('is-leaving');
      root.classList.toggle('is-table', next === 'table');
      chart.inert = next === 'table';
      chart.toggleAttribute('aria-hidden', next === 'table');
      // The table shows every series at once: the switch has nothing left to switch
      if (picker) picker.inert = next === 'table';
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

    write(false);
    place();
    fit();
    thin();
    document.fonts?.ready.then(() => {
      if (signal.aborted) return;
      fit();
      thin();
    });
    const resize = new ResizeObserver(thin);
    resize.observe(root);
    const watch = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      watch.disconnect();
      enter();
    }, { threshold: ENTER_AT });
    watch.observe(plot);
    signal.addEventListener('abort', () => {
      resize.disconnect();
      watch.disconnect();
    });

    // kodza:replay on the figure lowers the bars and raises them again
    root.addEventListener('kodza:replay', () => {
      shown = false;
      root.classList.add('is-reset');
      place();
      root.offsetWidth;
      root.classList.remove('is-reset');
      enter();
    }, { signal });
  }

  // The chart engine: reads a <table>, finds a round scale, rolls a number, slides a switch.
  // Line Chart and Donut carry the same block.
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
    let t = String(text).replace(/[\s  ]/g, '').replace(/[−–]/g, '-');
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

  const readTable = (table) => {
    const head = table.tHead?.rows[0] || table.rows[0];
    if (!head) return null;
    const body = [...table.rows].filter((r) => r !== head && r.parentElement?.tagName !== 'TFOOT');
    const names = [...head.cells].map((c) => c.textContent.trim());
    const series = [];
    for (let c = 1; c < names.length; c++) {
      const cells = body.map((r) => r.cells[c]);
      const vals = cells.map((cell) => (cell ? parseNumber(cell.dataset.value ?? cell.textContent) : null));
      if (!vals.some((v) => v !== null)) continue;
      const sample = cells.find((cell) => cell && /\d/.test(cell.textContent))?.textContent.trim() || '';
      const first = sample.search(/[\d−-]/);
      const last = sample.search(/\d[^\d]*$/);
      series.push({
        name: names[c],
        values: vals,
        texts: cells.map((cell) => (cell ? cell.textContent.trim() : '')),
        prefix: first > 0 ? sample.slice(0, first) : '',
        suffix: last >= 0 ? sample.slice(last + 1).replace(/^[\d.,]+/, '') : '',
      });
    }
    if (!series.length || !body.length) return null;
    return {
      series,
      rows: body.map((r) => ({ label: r.cells[0]?.textContent.trim() || '' })),
      lang: table.closest('[lang]')?.lang || 'en',
    };
  };

  // A round step: the scale ends on 4 × 100, not on 4 × 83
  const niceScale = (top) => {
    const raw = (top * HEADROOM) / LINES || 1;
    const mag = 10 ** Math.floor(Math.log10(raw));
    return { step: (STEPS.find((m) => m * mag >= raw) || 10) * mag };
  };

  const formatNumber = (v, lang) => {
    try {
      return new Intl.NumberFormat(lang, { notation: 'compact', maximumFractionDigits: 1 }).format(v);
    } catch {
      return String(Math.round(v * 10) / 10);
    }
  };

  // A number that changes rolls: the old one goes up, the new one comes from below
  const roller = (duration) => (box, text, animate) => {
    const current = box.lastElementChild;
    if (current && current.textContent === text) return;
    const next = document.createElement('span');
    next.textContent = text;
    box.append(next);
    if (!current) return;
    if (!animate || !duration) {
      while (box.firstElementChild !== next) box.firstElementChild.remove();
      return;
    }
    const timing = { duration, easing: ease };
    current.animate([{ transform: 'none' }, { transform: 'translateY(-110%)' }], { ...timing, fill: 'forwards' })
      .finished.then(() => current.remove(), () => {});
    next.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], timing);
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
