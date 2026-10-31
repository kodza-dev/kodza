// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Dimension Lines
// Dimensions the hero like a drawing sheet, from its real layout: construction lines on the
// column edges, a chain of dimensions under the text (margins, columns, gap), the width of the
// title's longest line above it, the title's height and the section's in the side margins. Every
// value is measured, and measured again when the section reflows. The first time it is seen, the
// dimensions open one after another from their middle, their arrows pushing out.
(() => {
  const SELECTOR = '[data-kodza-dimension-lines]';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SVG = 'http://www.w3.org/2000/svg';
  const ARROW = 7;      // arrowhead length, in px
  const SPREAD = 2.5;   // arrowhead half-width
  const LIFT = 9;       // a value sits this far off its line
  const GAP = 8;        // between a feature and its extension line
  const MARGIN = 44;    // a side margin narrower than this gets no vertical dimension
  const TOP = 72;       // the title's width is dimensioned only if its line fits this far down
  const OPEN = 560;     // ms for a dimension to open
  const STEP = 110;     // ms between two dimensions
  const DRAW = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const ARRIVE = 'cubic-bezier(0.22, 1, 0.36, 1)';

  const format = (v) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const crisp = (v) => Math.round(v - 0.5) + 0.5; // a 1 px line on one row of pixels, not across two

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const sheet = document.createElement('div');
    sheet.className = 'kodza-dimension-lines__sheet';
    sheet.setAttribute('aria-hidden', 'true');
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('class', 'kodza-dimension-lines__drawing');
    sheet.append(svg);
    root.prepend(sheet);

    const part = (name) => root.querySelector(`.kodza-dimension-lines__${name}`);
    const pen = document.createElement('canvas').getContext('2d');
    let entered = reduceMotion;
    let drawn = '';
    let animations = [];
    let guides = [];
    let dims = [];
    if (!entered) sheet.classList.add('is-waiting'); // nothing shows before it is drawn in

    // The layout, in the root's own pixels: a parent scaled by transform must not change a value
    const measure = () => {
      const box = root.getBoundingClientRect();
      const k = box.width / root.offsetWidth || 1;
      const rect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { left: (r.left - box.left) / k, top: (r.top - box.top) / k, right: (r.right - box.left) / k, bottom: (r.bottom - box.top) / k };
      };
      // Each letter of a block of text, with its box on screen
      const letters = (el) => {
        const found = [];
        if (!el) return found;
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          for (let i = 0; i < node.data.length; i += 1) {
            if (!node.data[i].trim()) continue;
            const range = document.createRange();
            range.setStart(node, i);
            range.setEnd(node, i + 1);
            const r = range.getBoundingClientRect();
            if (r.width) found.push({ node, i, char: node.data[i], r });
          }
        }
        return found;
      };
      // The title's ink, not its box: the box is as wide as its column, the longest line is not,
      // and a letter's box is wider than the letter itself (side bearings, letter spacing). The
      // first and last letters are measured in a canvas, in the title's font
      const ink = (el) => {
        const all = letters(el);
        if (!all.length) return null;
        const first = all.reduce((a, b) => (b.r.left < a.r.left ? b : a));
        const last = all.reduce((a, b) => (b.r.right > a.r.right ? b : a));
        const shape = (l) => {
          const css = getComputedStyle(l.node.parentElement);
          pen.font = `${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
          // The letter as drawn: text-transform changes the glyph
          const t = css.textTransform;
          const up = t === 'uppercase' || (t === 'capitalize' && !/\S/.test(l.node.data[l.i - 1] ?? ' '));
          return pen.measureText(up ? l.char.toUpperCase() : t === 'lowercase' ? l.char.toLowerCase() : l.char);
        };
        const left = first.r.left - shape(first).actualBoundingBoxLeft * k;
        const right = last.r.left + shape(last).actualBoundingBoxRight * k;
        return right > left ? { left: (left - box.left) / k, right: (right - box.left) / k } : null;
      };
      // The lines of a block of text, where a construction line must not run through them
      const lines = (el) => {
        const rows = [];
        letters(el).forEach(({ r }) => {
          const row = rows.find((o) => r.top < o.bottom && r.bottom > o.top);
          if (row) {
            row.left = Math.min(row.left, r.left);
            row.right = Math.max(row.right, r.right);
          } else rows.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
        });
        return rows.map((o) => ({ left: (o.left - box.left) / k, top: (o.top - box.top) / k, right: (o.right - box.left) / k, bottom: (o.bottom - box.top) / k }));
      };
      const title = part('title');
      return {
        width: root.offsetWidth,
        height: root.offsetHeight,
        content: rect(part('content')),
        title: rect(title),
        side: rect(part('side')),
        ink: ink(title),
        eyebrow: lines(part('eyebrow')),
      };
    };

    const add = (cls, d, extra) => {
      const el = document.createElementNS(SVG, 'path');
      el.setAttribute('class', `kodza-dimension-lines__${cls}`);
      el.setAttribute('d', d);
      if (extra) Object.entries(extra).forEach(([name, value]) => el.setAttribute(name, value));
      svg.append(el);
      return el;
    };

    // A construction or extension line, drawn in from its first point at the entrance
    const guide = (cls, x1, y1, x2, y2) => {
      guides.push(add(cls, `M${x1} ${y1}L${x2} ${y2}`, { pathLength: 1 }));
    };

    // A dimension from a to b, along x (at height `at`) or along y (at `at` across): the line,
    // an arrow at each end when there is room for them, and the value off the line
    const dimension = (axis, a, b, at) => {
      const length = b - a;
      if (length < 4) return;
      const mid = (a + b) / 2;
      const across = crisp(at);
      const line = axis === 'x' ? add('dim', `M${a} ${across}H${b}`) : add('dim', `M${across} ${a}V${b}`);
      const arrows = [];
      if (length >= ARROW * 2 + 4) {
        const head = (tip, dir) => (axis === 'x'
          ? `M${tip} ${across}l${dir * ARROW} ${-SPREAD}v${SPREAD * 2}z`
          : `M${across} ${tip}l${-SPREAD} ${dir * ARROW}h${SPREAD * 2}z`);
        arrows.push([add('arrow', head(a, 1)), mid - a], [add('arrow', head(b, -1)), mid - b]);
      }
      const value = document.createElement('span');
      value.className = `kodza-dimension-lines__value${axis === 'y' ? ' kodza-dimension-lines__value--up' : ''}`;
      value.style.left = `${axis === 'x' ? mid : across - LIFT}px`;
      value.style.top = `${axis === 'x' ? across - LIFT : mid}px`;
      const digits = document.createElement('span');
      digits.className = 'kodza-dimension-lines__digits';
      digits.textContent = format(length);
      value.append(digits);
      sheet.append(value);
      dims.push({ axis, mid, across, line, arrows, digits });
      return value;
    };

    const draw = (m) => {
      animations.forEach((a) => a.cancel());
      animations = [];
      guides = [];
      dims = [];
      svg.replaceChildren();
      sheet.querySelectorAll('.kodza-dimension-lines__value').forEach((el) => el.remove());
      const { width: w, height: h, content, title, side, ink, eyebrow } = m;
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      if (!content) return;

      // The column edges: one construction line each, the whole height of the sheet
      const columns = Boolean(title && side && side.left >= title.right - 1);
      const breaks = [content.left, ...(columns ? [title.right, side.left] : []), content.right];
      breaks.forEach((x) => guide('guide', crisp(x), 0, crisp(x), h));

      const left = title && content.left >= MARGIN ? content.left / 2 : null;
      const right = w - content.right >= MARGIN ? content.right + (w - content.right) / 2 : null;
      if (title) { // the title's top and bottom, out to its height in the margin
        const from = left === null ? 0 : left - GAP;
        guide('guide', from, crisp(title.top), title.right, crisp(title.top));
        guide('guide', from, crisp(title.bottom), title.right, crisp(title.bottom));
      }

      // Above the text: the width of the title's longest line, read from the glyphs
      const top = content.top - 36;
      const inked = ink && title && top >= TOP;
      if (inked) {
        guide('dim', crisp(ink.left), top - 6, crisp(ink.left), top + GAP);
        guide('dim', crisp(ink.right), top - 6, crisp(ink.right), top + GAP);
        // Down to the title, broken around a line of text it would cross, as on a drawing
        let from = top + GAP;
        eyebrow.filter((o) => ink.right > o.left - GAP && ink.right < o.right + GAP && o.bottom > from)
          .sort((a, b) => a.top - b.top)
          .forEach((o) => {
            if (o.top - GAP / 2 > from + 2) guide('guide', crisp(ink.right), from, crisp(ink.right), o.top - GAP / 2);
            from = o.bottom + GAP / 2;
          });
        if (title.top > from + 2) guide('guide', crisp(ink.right), from, crisp(ink.right), title.top);
      }

      // Under the text: margins, columns and gap, end to end, from one edge of the section to the other
      const chain = (content.bottom + h) / 2;
      breaks.forEach((x) => guide('dim', crisp(x), content.bottom + GAP, crisp(x), chain + 6));

      if (inked) dimension('x', ink.left, ink.right, top);
      let margin = null;
      [0, ...breaks, w].reduce((a, b) => {
        margin = dimension('x', a, b, chain);
        return b;
      });
      if (left !== null) dimension('y', title.top, title.bottom, left);
      if (right !== null) {
        dimension('y', 0, h, right);
        // The section's height runs through the right margin's value: the paper again under the
        // value, so the line breaks around the text, as on a drawing
        if (margin) {
          const half = margin.offsetWidth / 2 + 3;
          add('knock', `M${right - half} ${chain - LIFT - 10}H${right + half}V${chain - 2}H${right - half}z`);
        }
      }
    };

    // The first time it is seen: the construction lines draw in, then each dimension opens from
    // its middle, its arrows riding the ends of the line, and its value rises out of a mask
    const play = () => {
      guides.forEach((el, i) => {
        animations.push(el.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
          duration: 900, delay: i * 40, easing: DRAW, fill: 'backwards',
        }));
      });
      dims.forEach((d, i) => {
        const timing = { duration: OPEN, delay: 280 + i * STEP, easing: DRAW, fill: 'backwards' };
        const axis = d.axis.toUpperCase();
        d.line.style.transformOrigin = d.axis === 'x' ? `${d.mid}px ${d.across}px` : `${d.across}px ${d.mid}px`;
        animations.push(d.line.animate([{ transform: `scale${axis}(0)` }, { transform: `scale${axis}(1)` }], timing));
        d.arrows.forEach(([el, shift]) => {
          animations.push(el.animate([{ transform: `translate${axis}(${shift}px)` }, { transform: 'none' }], timing));
        });
        animations.push(d.digits.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], {
          duration: 420, delay: timing.delay + OPEN * 0.55, easing: ARRIVE, fill: 'backwards',
        }));
      });
    };

    // Measured again whenever the layout moves (a resize, the web font coming in, new text);
    // redrawn only if a value actually changed
    const refresh = () => {
      if (signal.aborted) return;
      const m = measure();
      if (!m.width || !m.height) return;
      const key = JSON.stringify(m, (name, value) => (typeof value === 'number' ? Math.round(value) : value));
      if (key === drawn) return;
      drawn = key;
      draw(m);
    };

    let frame = 0;
    const soon = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(refresh);
    };
    const ro = new ResizeObserver(soon);
    ro.observe(root);
    const content = part('content');
    if (content) ro.observe(content);
    const fonts = document.fonts?.ready || Promise.resolve();
    fonts.then(soon);

    const io = new IntersectionObserver((entries) => {
      if (entered || !entries[entries.length - 1].isIntersecting) return;
      entered = true;
      io.disconnect();
      // Played once the web font is in, so the values it opens on are the ones that stay
      fonts.then(() => {
        if (signal.aborted) return;
        cancelAnimationFrame(frame);
        refresh();
        sheet.classList.remove('is-waiting');
        play();
      });
    }, { threshold: 0.25 });
    if (!entered) io.observe(root);

    refresh();

    signal.addEventListener('abort', () => {
      cancelAnimationFrame(frame);
      animations.forEach((a) => a.cancel());
      io.disconnect();
      ro.disconnect();
      sheet.remove();
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
