// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Line Chart
// Draws the <table> inside the figure: one line per value column (two at most), the first with
// its area faded under it, the second dashed and paler, each named at its end. A guide follows
// the pointer and snaps to the nearest point; a Chart / Table switch slides from one to the other.
// The table stays in the page for screen readers, and shows alone without the script. A cell
// whose text is not a number gives it in data-value.
// Settings: the --kz-line-chart-* variables in the CSS, data-source on the figure (the note under
// the chart), the words below (data-text-<key> on the figure), the constants under them.
(() => {
  const SELECTOR = '.kodza-line-chart';
  const WORDS = {
    chart: 'Chart',
    table: 'Table',
    series: 'Series',
    view: 'View', // the name of the Chart / Table switch
    role: 'line chart',
    hint: 'Arrow keys read the points one by one.',
    read: '{label}: {values}', // read out as the arrows move; {values} is "Docs 3,120, Blog 1,240"
  };
  const MAX_SERIES = 2; // more lines than that stop reading as a trend
  const ENTER_AT = 0.35; // the share of the chart in view before the lines draw
  const LINES = 4; // gaps between gridlines
  const HEADROOM = 1.04; // the highest point stops just under the top line
  const STEPS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]; // the round steps a scale can take, times 10ⁿ
  const SWITCH = 460; // ms, the pill of a switch sliding to its option
  const VIEW = 560; // ms, the chart sliding to the table and back
  const NAME_GAP = 18; // px, the least room between two names at the end of the lines
  const TIP_GAP = 14; // px, between the guide and the bubble
  const NARROW = 480; // px, under this width the card tightens its padding
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const swing = 'cubic-bezier(0.65, 0, 0.35, 1)';

  const NS = 'http://www.w3.org/2000/svg';
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
    if (!data || data.rows.length < 2) return;
    data.series = data.series.slice(0, MAX_SERIES);
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const id = `kodza-line-chart-${++uid}`;
    const n = data.rows.length;
    const make = maker('kodza-line-chart');
    const svgEl = (tag, attrs) => {
      const el = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      return el;
    };
    const timers = new Set();
    const later = (fn, ms) => {
      const t = setTimeout(() => {
        timers.delete(t);
        fn();
      }, ms);
      timers.add(t);
    };
    signal.addEventListener('abort', () => timers.forEach(clearTimeout));

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

    const top = niceScale(Math.max(0, ...data.series.flatMap((s) => s.values.map((v) => v ?? 0))) || 1).step * LINES;
    let active = -1;

    const plot = make('div', 'plot');
    const ticks = make('div', 'ticks', { 'aria-hidden': 'true' });
    const area = make('div', 'area', {
      tabindex: '0',
      role: 'group',
      'aria-roledescription': word('role'),
      'aria-description': word('hint'),
      'aria-label': title,
    });
    const names = make('div', 'names', { 'aria-hidden': 'true' });
    const axis = make('div', 'axis', { 'aria-hidden': 'true' });
    const lines = make('div', 'lines', { 'aria-hidden': 'true' });
    for (let i = 0; i <= LINES; i++) {
      const line = make('span');
      line.style.setProperty('--at', i / LINES);
      lines.append(line);
      const { prefix, suffix } = data.series[0];
      ticks.append(make('span', 'tick', { style: `--at:${i / LINES}` }, `${prefix}${formatNumber((top / LINES) * i, data.lang)}${suffix}`));
    }

    // The drawing: an area under the first line, the lines, a dot at the end of each
    const svg = svgEl('svg', { class: 'kodza-line-chart__svg', 'aria-hidden': 'true', focusable: 'false' });
    const fade = `${id}-fade`;
    const defs = svgEl('defs', {});
    const gradient = svgEl('linearGradient', { id: fade, x1: '0', y1: '0', x2: '0', y2: '1' });
    gradient.append(
      svgEl('stop', { class: 'kodza-line-chart__stop', offset: '0' }),
      svgEl('stop', { class: 'kodza-line-chart__stop kodza-line-chart__stop--end', offset: '1' }),
    );
    defs.append(gradient);
    const fill = svgEl('path', { class: 'kodza-line-chart__fill', fill: `url(#${fade})` });
    svg.append(defs, fill);
    const paths = data.series.map((_, k) => svg.appendChild(svgEl('path', { class: `kodza-line-chart__path kodza-line-chart__path--${k + 1}` })));
    const ends = data.series.map((_, k) => svg.appendChild(svgEl('circle', { class: `kodza-line-chart__end kodza-line-chart__end--${k + 1}`, r: '3.5' })));

    const guide = make('span', 'guide', { 'aria-hidden': 'true' });
    const spots = data.series.map((_, k) => make('span', `spot spot--${k + 1}`, { 'aria-hidden': 'true' }));
    const tip = make('div', 'tip', { 'aria-hidden': 'true' });
    const tipLabel = make('span', 'tip-label');
    const tipValues = data.series.map((s, k) => {
      const row = make('span', 'tip-row');
      const value = make('span', 'tip-value');
      row.append(make('i', `key key--${k + 1}`), make('span', 'tip-name', null, s.name), value);
      return { row, value };
    });
    tip.append(tipLabel, ...tipValues.map((v) => v.row));
    area.append(lines, svg, guide, ...spots, tip);

    const nameEls = data.series.map((s, k) => {
      const el = make('span', `name name--${k + 1}`);
      el.append(make('span', null, null, s.name));
      names.append(el);
      return el;
    });
    const labels = data.rows.map((row) => axis.appendChild(make('span', null, null, row.label)));
    plot.append(ticks, area, names, axis);
    chart.append(plot);

    // Where each point sits, in the area's own pixels
    let w = 0;
    let h = 0;
    const xAt = (i) => (i / (n - 1)) * w;
    const yAt = (v) => h - (Math.max(0, v) / top) * h;
    const points = (k) => data.series[k].values.map((v, i) => (v == null ? null : [xAt(i), yAt(v)]));

    // The gutter of the scale is as wide as its widest number
    const fitTicks = () => {
      const scale = scaleOf(ticks);
      const range = document.createRange();
      let widest = 0;
      [...ticks.children].forEach((el) => {
        range.selectNodeContents(el);
        widest = Math.max(widest, range.getBoundingClientRect().width / scale);
      });
      ticks.style.minWidth = `${Math.ceil(widest)}px`;
    };

    const draw = () => {
      fitTicks();
      w = area.clientWidth;
      h = area.clientHeight;
      if (!w || !h) return;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      let under = '';
      data.series.forEach((_, k) => {
        const runs = split(points(k));
        paths[k].setAttribute('d', runs.map(curve).join(''));
        if (k === 0) under = runs.filter((r) => r.length > 1).map((r) => `${curve(r)}L${r[r.length - 1][0]},${h}L${r[0][0]},${h}Z`).join('');
        const last = points(k).filter(Boolean).pop();
        ends[k].setAttribute('cx', last[0]);
        ends[k].setAttribute('cy', last[1]);
      });
      fill.setAttribute('d', under);
      labels.forEach((el, i) => el.style.setProperty('--x', `${xAt(i)}px`));
      placeNames();
      thin();
      if (active >= 0) point(active, false);
    };

    // The names sit at the end of their line, pushed apart when the lines end close together
    const placeNames = () => {
      const at = data.series.map((_, k) => ({ k, y: points(k).filter(Boolean).pop()[1] })).sort((a, b) => a.y - b.y);
      for (let j = 1; j < at.length; j++) at[j].y = Math.max(at[j].y, at[j - 1].y + NAME_GAP);
      const over = at.length ? Math.max(0, at[at.length - 1].y - h) : 0;
      at.forEach(({ k, y }) => nameEls[k].style.setProperty('--y', `${y - over}px`));
    };

    // On a narrow chart the dates take turns: one in two, or one in three
    const thin = () => {
      root.classList.toggle('is-narrow', root.offsetWidth < NARROW);
      const room = w / (n - 1);
      const scale = scaleOf(axis);
      const range = document.createRange();
      let widest = 0;
      labels.forEach((el) => {
        range.selectNodeContents(el);
        widest = Math.max(widest, range.getBoundingClientRect().width / scale);
      });
      const every = Math.max(1, Math.ceil((widest + 12) / room));
      labels.forEach((el, i) => el.classList.toggle('is-skipped', i % every !== 0));
    };

    // The lines draw from left to right when the chart comes into view
    const enter = () => {
      if (still) {
        root.classList.add('is-reset', 'is-drawn');
        root.offsetWidth;
        root.classList.remove('is-reset');
        return;
      }
      root.classList.add('is-drawn');
    };

    // The guide: the nearest point, its date and the value of every line
    const point = (i, glide) => {
      const x = xAt(i);
      const ys = [];
      if (!glide) area.classList.add('is-placing');
      guide.style.transform = `translateX(${x}px)`;
      spots.forEach((spot, k) => {
        const v = data.series[k].values[i];
        spot.hidden = v == null;
        if (v != null) {
          ys.push(yAt(v));
          spot.style.transform = `translate(${x}px, ${yAt(v)}px)`;
        }
      });
      tipLabel.textContent = data.rows[i].label;
      tipValues.forEach(({ value }, k) => {
        value.textContent = data.series[k].texts[i] || '—';
      });
      const tw = tip.offsetWidth;
      const th = tip.offsetHeight;
      // Beside the guide, on whichever side has room; on a narrow chart where neither has, kept inside the plot
      const right = x + TIP_GAP + tw <= w || x < w / 2;
      const tx = Math.max(0, Math.min(w - tw, right ? x + TIP_GAP : x - TIP_GAP - tw));
      const ty = Math.max(0, Math.min(h - th, Math.min(...ys, h) - th / 2));
      tip.style.transform = `translate(${tx}px, ${ty}px)`;
      if (!glide) {
        area.offsetWidth;
        area.classList.remove('is-placing');
      }
    };
    const announce = () => {
      live.textContent = word('read')
        .replace('{label}', data.rows[active].label)
        .replace('{values}', data.series.map((s) => `${s.name} ${s.texts[active] || '—'}`).join(', '));
    };
    const activate = (i, speak) => {
      if (i === active) return;
      labels[active]?.classList.remove('is-active');
      const first = active < 0;
      active = i;
      root.classList.toggle('is-pointing', i >= 0);
      if (i < 0) {
        live.textContent = '';
        return;
      }
      labels[i].classList.add('is-active');
      // The first time it appears in place, after that it glides from point to point
      point(i, !first);
      if (speak) announce();
    };

    const indexAt = (event) => {
      const box = area.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width;
      if (x < -0.02 || x > 1.02) return -1;
      return Math.max(0, Math.min(n - 1, Math.round(x * (n - 1))));
    };
    area.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'mouse' || event.pointerType === 'pen') activate(indexAt(event), false);
    }, { signal });
    area.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'touch') activate(indexAt(event), false);
    }, { signal });
    area.addEventListener('pointerleave', (event) => {
      if (event.pointerType !== 'touch' && !area.matches(':focus-visible')) activate(-1);
    }, { signal });
    document.addEventListener('pointerdown', (event) => {
      if (!area.contains(event.target)) activate(-1);
    }, { signal });

    area.addEventListener('keydown', (event) => {
      let to = null;
      if (event.key === 'ArrowRight') to = active < 0 ? 0 : Math.min(n - 1, active + 1);
      else if (event.key === 'ArrowLeft') to = active < 0 ? n - 1 : Math.max(0, active - 1);
      else if (event.key === 'Home') to = 0;
      else if (event.key === 'End') to = n - 1;
      else if (event.key === 'Escape' && active >= 0) {
        activate(-1);
        event.preventDefault();
        return;
      }
      if (to === null) return;
      event.preventDefault();
      activate(to, true);
    }, { signal });
    area.addEventListener('blur', () => activate(-1), { signal });

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
        if (next === 'chart') draw();
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

    draw();
    document.fonts?.ready.then(() => {
      if (!signal.aborted) draw();
    });
    const resize = new ResizeObserver(draw);
    resize.observe(area);
    const watch = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      watch.disconnect();
      enter();
    }, { threshold: ENTER_AT });
    watch.observe(area);
    signal.addEventListener('abort', () => {
      resize.disconnect();
      watch.disconnect();
    });

    // kodza:replay on the figure wipes the lines and draws them again
    root.addEventListener('kodza:replay', () => {
      root.classList.add('is-reset');
      root.classList.remove('is-drawn');
      root.offsetWidth;
      root.classList.remove('is-reset');
      later(enter, 30);
    }, { signal });
  }

  // A line breaks where a value is missing: each run of points is drawn on its own
  const split = (pts) => pts.reduce((runs, p) => {
    if (!p) runs.push([]);
    else runs[runs.length - 1].push(p);
    return runs;
  }, [[]]).filter((r) => r.length);

  // A smooth curve through every point that never overshoots them (monotone cubic): a peak stays
  // the peak, and a flat week stays flat
  const curve = (pts) => {
    if (pts.length < 2) return `M${pts[0][0]},${pts[0][1]}`;
    const m = pts.length;
    const d = [];
    const s = [];
    for (let i = 0; i < m - 1; i++) {
      d.push(pts[i + 1][0] - pts[i][0]);
      s.push((pts[i + 1][1] - pts[i][1]) / d[i]);
    }
    const t = pts.map((_, i) => {
      if (i === 0) return s[0];
      if (i === m - 1) return s[m - 2];
      if (s[i - 1] * s[i] <= 0) return 0;
      return (3 * (d[i - 1] + d[i])) / ((2 * d[i] + d[i - 1]) / s[i - 1] + (d[i] + 2 * d[i - 1]) / s[i]);
    });
    let path = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < m - 1; i++) {
      const third = d[i] / 3;
      path += `C${pts[i][0] + third},${pts[i][1] + t[i] * third} ${pts[i + 1][0] - third},${pts[i + 1][1] - t[i + 1] * third} ${pts[i + 1][0]},${pts[i + 1][1]}`;
    }
    return path;
  };

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
