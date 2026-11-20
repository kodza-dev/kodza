// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Donut
// Draws the <table> inside the figure as a ring: the first value column, one part per row, from
// the largest to the smallest in shades of ink, each cut from the next by a thin gap. Past
// MAX_PARTS rows the smallest ones join one "Other" part. The total sits in the centre; point at
// a part or its line in the key and the centre rolls to its value and name. A Chart / Table
// switch slides from one to the other. The table stays in the page for screen readers, and shows
// alone without the script. A cell whose text is not a number gives it in data-value.
// Settings: the --kz-donut-* variables in the CSS, data-source on the figure (the note under the
// chart), the words below (data-text-<key> on the figure), the constants under them.
(() => {
  const SELECTOR = '.kodza-donut';
  const WORDS = {
    chart: 'Chart',
    table: 'Table',
    view: 'View', // the name of the Chart / Table switch
    total: 'Total',
    other: 'Other', // the part that gathers the smallest rows
    role: 'donut chart',
    hint: 'Arrow keys read the parts one by one.',
    read: '{label}: {value}, {percent}', // read out as the arrows move
  };
  const MAX_PARTS = 5; // past this many rows, the smallest join "Other" (so five parts at most)
  const RING = 0.27; // the thickness of the ring, as a share of its radius
  const GAP = 3; // the gap between two parts, in the ring's units (its radius is 100)
  const ENTER_AT = 0.35; // the share of the chart in view before the parts draw
  const PART = 620; // ms, one part drawing
  const STAGGER = 130; // ms, between two parts starting
  const ROLL = 420; // ms, the centre rolling to a new value
  const SWITCH = 460; // ms, the pill of a switch sliding to its option
  const VIEW = 560; // ms, the chart sliding to the table and back
  const NARROW = 520; // px, under this width the key goes under the ring
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const swing = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const out = (t) => 1 - (1 - t) ** 4; // the same arrival, for the parts drawn frame by frame

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
  // starts is tied to `signal` (listeners get { signal }, observers, frames and timers stop on
  // its 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const table = root.querySelector('table');
    const data = table && readTable(table);
    if (!data || data.rows.length < 2) return;
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const id = `kodza-donut-${++uid}`;
    const make = maker('kodza-donut');
    const svgEl = (tag, attrs) => {
      const el = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      return el;
    };

    // The parts: the rows of the first value column, largest first, the smallest gathered
    const { prefix, suffix } = data.series[0];
    const decimals = Math.max(0, ...data.series[0].values.map((v) => (v == null ? 0 : (String(v).split('.')[1] || '').length)));
    const format = (v) => {
      try {
        return `${prefix}${new Intl.NumberFormat(data.lang, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(v)}${suffix}`;
      } catch {
        return `${prefix}${v.toFixed(decimals)}${suffix}`;
      }
    };
    let parts = data.rows
      .map((row, i) => ({ name: row.label, value: Math.max(0, data.series[0].values[i] ?? 0), text: data.series[0].texts[i] }))
      .filter((p) => p.value > 0)
      .sort((a, b) => b.value - a.value);
    if (parts.length < 1) return;
    if (parts.length > MAX_PARTS) {
      const rest = parts.slice(MAX_PARTS - 1);
      const value = rest.reduce((sum, p) => sum + p.value, 0);
      parts = [...parts.slice(0, MAX_PARTS - 1), { name: word('other'), value, text: format(value), other: true }];
    }
    const total = parts.reduce((sum, p) => sum + p.value, 0);
    let at = 0;
    parts.forEach((p) => {
      p.from = (at / total) * Math.PI * 2;
      at += p.value;
      p.to = (at / total) * Math.PI * 2;
      p.percent = `${Math.round((p.value / total) * 100)}%`;
    });

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

    const area = make('div', 'area', {
      tabindex: '0',
      role: 'group',
      'aria-roledescription': word('role'),
      'aria-description': word('hint'),
      'aria-label': title,
    });
    const ring = make('div', 'ring', { 'aria-hidden': 'true' });
    const svg = svgEl('svg', { class: 'kodza-donut__svg', viewBox: '-110 -110 220 220', focusable: 'false' });
    const shapes = parts.map((p, i) => {
      const mid = (p.from + p.to) / 2;
      const shape = svgEl('path', { class: `kodza-donut__part kodza-donut__part--${i + 1}`, 'data-i': i });
      shape.style.setProperty('--dx', Math.sin(mid).toFixed(4));
      shape.style.setProperty('--dy', (-Math.cos(mid)).toFixed(4));
      return svg.appendChild(shape);
    });
    const centre = make('div', 'centre');
    const value = make('span', 'roll value');
    const name = make('span', 'roll name');
    value.append(make('span', null, null, format(total)));
    name.append(make('span', null, null, word('total')));
    centre.append(value, name);
    ring.append(svg, centre);

    const key = make('div', 'key', { 'aria-hidden': 'true' });
    const rows = parts.map((p, i) => {
      const row = make('div', 'row', { 'data-i': i, style: `--i:${i}` });
      row.append(
        make('i', `swatch part--${i + 1}`),
        make('span', 'row-name', null, p.name),
        make('span', 'row-value', null, p.text || format(p.value)),
        make('span', 'row-percent', null, p.percent),
      );
      return key.appendChild(row);
    });
    area.append(ring, key);
    chart.append(area);

    // A part of the ring with straight sides: each side runs parallel to its radius, half a gap
    // away from it, so the gap between two parts keeps one width from the inside to the outside
    const R = 100;
    const r = R * (1 - RING);
    const spot = (radius, a) => `${(radius * Math.sin(a)).toFixed(2)},${(-radius * Math.cos(a)).toFixed(2)}`;
    const sector = (a0, a1) => {
      const cut = parts.length > 1 ? GAP / 2 : 0;
      const outer = Math.asin(cut / R);
      const inner = Math.asin(cut / r);
      if (a1 - a0 <= inner * 2) return '';
      const full = a1 - a0 >= Math.PI * 2 - 1e-6;
      const s0 = a0 + outer;
      const e0 = (full ? a1 - 1e-4 : a1 - outer);
      const s1 = a0 + inner;
      const e1 = (full ? a1 - 1e-4 : a1 - inner);
      const big = (a) => (a > Math.PI ? 1 : 0);
      return `M${spot(R, s0)}A${R},${R} 0 ${big(e0 - s0)} 1 ${spot(R, e0)}L${spot(r, e1)}A${r},${r} 0 ${big(e1 - s1)} 0 ${spot(r, s1)}Z`;
    };
    // How far each part has drawn, from 0 to 1
    const shown = parts.map(() => 0);
    const paint = () => shapes.forEach((shape, i) => {
      const p = parts[i];
      shape.setAttribute('d', sector(p.from, p.from + (p.to - p.from) * shown[i]));
    });

    // The entrance: the parts draw one after the other while the total counts up to its value
    let frame = 0;
    signal.addEventListener('abort', () => cancelAnimationFrame(frame));
    const setTotal = (v) => {
      if (active < 0) value.lastElementChild.textContent = format(v);
    };
    const enter = () => {
      cancelAnimationFrame(frame);
      root.classList.add('is-drawn');
      if (still) {
        shown.fill(1);
        paint();
        setTotal(total);
        return;
      }
      const part = PART * pace;
      const stagger = STAGGER * pace;
      const length = stagger * (parts.length - 1) + part;
      const start = performance.now();
      const tick = (now) => {
        const t = now - start;
        parts.forEach((_, i) => {
          shown[i] = out(Math.min(1, Math.max(0, (t - i * stagger) / part)));
        });
        paint();
        setTotal(total * out(Math.min(1, t / length)));
        if (t < length) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    const wipe = () => {
      cancelAnimationFrame(frame);
      shown.fill(0);
      paint();
      setTotal(0);
      root.classList.remove('is-drawn');
    };

    // Pointing at a part, or at its line in the key: it steps out of the ring and the centre rolls
    let active = -1;
    const roll = roller(still ? 0 : ROLL * pace);
    const activate = (i, speak) => {
      if (i === active) return;
      shapes[active]?.classList.remove('is-active');
      rows[active]?.classList.remove('is-active');
      active = i;
      root.classList.toggle('is-pointing', i >= 0);
      if (i < 0) {
        roll(value, format(total), true);
        roll(name, word('total'), true);
        live.textContent = '';
        return;
      }
      const p = parts[i];
      shapes[i].classList.add('is-active');
      rows[i].classList.add('is-active');
      roll(value, p.text || format(p.value), true);
      roll(name, p.name, true);
      if (speak) {
        live.textContent = word('read')
          .replace('{label}', p.name)
          .replace('{value}', p.text || format(p.value))
          .replace('{percent}', p.percent);
      }
    };

    const indexOf = (event) => {
      const el = event.target.closest?.('[data-i]');
      return el && area.contains(el) ? Number(el.dataset.i) : -1;
    };
    area.addEventListener('pointerover', (event) => {
      // A gap between parts or rows keeps the current one, so crossing it never flickers
      const i = indexOf(event);
      if (event.pointerType !== 'touch' && i >= 0) activate(i, false);
    }, { signal });
    area.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'touch') activate(indexOf(event), false);
    }, { signal });
    area.addEventListener('pointerleave', (event) => {
      if (event.pointerType !== 'touch' && !area.matches(':focus-visible')) activate(-1);
    }, { signal });
    document.addEventListener('pointerdown', (event) => {
      if (!area.contains(event.target)) activate(-1);
    }, { signal });

    const last = parts.length - 1;
    area.addEventListener('keydown', (event) => {
      let to = null;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') to = active < 0 ? 0 : Math.min(last, active + 1);
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') to = active < 0 ? last : Math.max(0, active - 1);
      else if (event.key === 'Home') to = 0;
      else if (event.key === 'End') to = last;
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

    const fit = () => root.classList.toggle('is-narrow', root.offsetWidth < NARROW);
    fit();
    wipe();
    const resize = new ResizeObserver(fit);
    resize.observe(root);
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

    // kodza:replay on the figure empties the ring and draws it again
    root.addEventListener('kodza:replay', () => {
      activate(-1);
      root.classList.add('is-reset');
      wipe();
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
