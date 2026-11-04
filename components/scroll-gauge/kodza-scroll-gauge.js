// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Scroll Gauge
// A real figure pinned in a corner that follows the reading. Each section carries its value
// (data-gauge="290", a plain number with a dot for decimals: "36.5" keeps one) and, if you like,
// a note (data-gauge-note="Oven floor"). Once a section's top passes the reading line, the figure
// rolls to its value digit by digit, like an odometer: up when the value climbs, down when it
// falls, and the needle slides along the scale of the whole story.
// On the root: data-label (what it measures), data-unit, data-side="right" for the right corner,
// data-grouping for thousands separators (an amount has them, a year does not).
// Settings: the --kz-scroll-gauge-* variables in the CSS, and the constants below.
(() => {
  const SELECTOR = '[data-kodza-scroll-gauge]';
  const LINE = 0.6; // the reading line, from the top of the screen (0 to 1): a section is read once its top passes it
  const LINE_SHORT = 0.5; // the reading line on a screen 720 px tall or less, where a section shows less of itself
  const ROLL = 1100; // ms: the highest digit that changes rolls straight to its new value in this time
  const LAG = 150; // ms more for each digit on its right, which spin past and land later
  const TURNS = 2; // full turns of the last digit; the digits in between spin 1 to this
  const NOTE = 650; // ms: the note rolling to the next section's
  const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'; // fast start, gentle landing: an odometer settling
  const NOTE_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const CELL = 1.1; // em: the height of a digit window, the line-height of the figure in the CSS

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site

    // The story: every section with a value, in the order of the page (inside nested blocks too)
    const stops = [...root.querySelectorAll('[data-gauge]')]
      .filter((el) => el.closest(SELECTOR) === root)
      .map((el) => {
        const raw = el.getAttribute('data-gauge').replace(/\s/g, '').replace('−', '-');
        return {
          el,
          raw,
          value: Number(raw),
          decimals: (raw.split('.')[1] || '').length,
          note: (el.getAttribute('data-gauge-note') || '').trim(),
        };
      })
      .filter((stop) => stop.raw !== '' && Number.isFinite(stop.value));
    if (!stops.length) return;

    const label = (root.getAttribute('data-label') || '').trim();
    const unit = (root.getAttribute('data-unit') || '').trim();
    const grouping = root.hasAttribute('data-grouping');
    // The decimal point and the thousands separator of the page's language (36,5 in French)
    const lang = root.closest('[lang]')?.getAttribute('lang') || undefined;
    let decimalChar = '.';
    let groupChar = ',';
    try {
      const parts = new Intl.NumberFormat(lang).formatToParts(12345.6);
      decimalChar = parts.find((part) => part.type === 'decimal')?.value || '.';
      groupChar = parts.find((part) => part.type === 'group')?.value || ',';
    } catch (error) {
      // An unknown language tag: the dot and the comma
    }
    const spoken = (stop) => {
      try {
        return new Intl.NumberFormat(lang, { minimumFractionDigits: stop.decimals, maximumFractionDigits: stop.decimals, useGrouping: grouping }).format(stop.value);
      } catch (error) {
        return stop.raw;
      }
    };

    // The places of the figure: as many whole digits and decimals as the longest value needs.
    // A value shows only its own: no leading zeros, no decimals it does not have
    const DECIMALS = Math.max(...stops.map((stop) => stop.decimals));
    const scaled = (stop) => Math.round(Math.abs(stop.value) * 10 ** DECIMALS);
    const wholeLength = (stop) => String(Math.floor(scaled(stop) / 10 ** DECIMALS)).length;
    const WHOLE = Math.max(...stops.map(wholeLength));
    const PLACES = WHOLE + DECIMALS;
    const shapeOf = (stop) => {
      const digits = String(scaled(stop)).padStart(PLACES, '0').split('').map(Number);
      const length = wholeLength(stop);
      return {
        digits,
        visible: digits.map((digit, place) => (place < WHOLE ? place >= WHOLE - length : place - WHOLE < stop.decimals)),
        negative: stop.value < 0 && scaled(stop) > 0,
        point: stop.decimals > 0,
        value: stop.value,
      };
    };
    const EMPTY = { digits: Array(PLACES).fill(0), visible: Array(PLACES).fill(false), negative: false, point: false, value: null };

    const make = (tag, part, text) => {
      const el = document.createElement(tag);
      el.className = `kodza-scroll-gauge__${part}`;
      if (text != null) el.textContent = text;
      return el;
    };

    // The dial, on a rail of no height pinned to the bottom of the screen with position: sticky:
    // it rides along while the story scrolls and leaves with the end of it
    const rail = make('div', 'rail');
    const dial = make('div', 'dial');
    dial.setAttribute('aria-hidden', 'true');
    const sr = make('span', 'sr'); // what the dial says, for screen readers
    rail.append(dial, sr);
    if (label) {
      const row = make('span', 'label');
      row.append(make('span', 'in', label));
      dial.append(row);
    }
    const reading = make('span', 'reading');
    const figure = make('span', 'figure');
    reading.append(figure);
    if (unit) {
      const box = make('span', 'unit');
      box.append(make('span', 'in', unit));
      reading.append(box);
    }
    dial.append(reading);

    // The slots, left to right: sign, whole digits (with their thousands separators), decimal
    // point, decimals. A digit spins in its window; an empty slot closes to no width
    const slots = [];
    const digitSlots = [];
    const addChar = (kind, char, place) => {
      const el = make('span', 'char', char);
      figure.append(el);
      slots.push({ el, kind, place });
    };
    if (stops.some((stop) => stop.value < 0)) addChar('sign', '−');
    for (let place = 0; place < PLACES; place += 1) {
      if (place === WHOLE) addChar('point', decimalChar);
      const el = make('span', 'digit');
      const strip = make('span', 'strip');
      strip.append(make('span', 'cell', ''));
      el.append(strip);
      figure.append(el);
      const slot = { el, kind: 'digit', place, strip, anim: null };
      slots.push(slot);
      digitSlots.push(slot);
      if (grouping && place < WHOLE - 1 && (WHOLE - 1 - place) % 3 === 0) addChar('group', groupChar, place);
    }

    const notes = stops.some((stop) => stop.note) ? stops.map((stop) => make('span', 'line', stop.note)) : [];
    if (notes.length) {
      const row = make('span', 'note');
      row.append(...notes);
      dial.append(row);
    }

    // The scale of the whole story, from its lowest value to its highest: a tick for each section,
    // and the needle on the one being read
    const values = stops.map((stop) => stop.value);
    const low = Math.min(...values);
    const high = Math.max(...values);
    const at = (v) => (high > low ? (v - low) / (high - low) : 0.5);
    const scale = make('span', 'scale');
    scale.append(make('span', 'track'));
    stops.forEach((stop) => {
      const tick = make('span', 'stop');
      tick.style.left = `calc(${at(stop.value).toFixed(4)} * (100% - 1px))`;
      scale.append(tick);
    });
    const needle = make('span', 'needle');
    needle.append(make('span', 'tick'));
    scale.append(needle);
    dial.append(scale);
    root.append(rail);

    // The width of each kind of slot, in em of the figure, measured in the page's own font
    const ems = { digit: 0.62, sign: 0.6, point: 0.28, group: 0.28 };
    let measured = false;
    const measure = () => {
      const probe = make('span', 'probe');
      figure.append(probe);
      const size = parseFloat(getComputedStyle(figure).fontSize) || 0;
      const widthOf = (text) => {
        probe.textContent = text.repeat(10);
        return probe.offsetWidth / 10 / size;
      };
      const digit = size ? Math.max(...'0123456789'.split('').map(widthOf)) : 0;
      if (digit > 0) {
        Object.assign(ems, { digit, sign: widthOf('−'), point: widthOf(decimalChar), group: widthOf(groupChar) });
        measured = true;
      }
      probe.remove();
    };
    const open = (slot, shape) => {
      if (slot.kind === 'sign') return shape.negative;
      if (slot.kind === 'point') return shape.point;
      return shape.visible[slot.place];
    };
    // animate: false sets the widths at once (the dial coming in, the font loading)
    const size = (shape, animate) => {
      slots.forEach((slot) => {
        if (!animate) slot.el.style.transition = 'none';
        const shown = open(slot, shape);
        slot.el.style.width = `${shown ? ems[slot.kind].toFixed(4) : 0}em`;
        slot.el.classList.toggle('is-closed', !shown);
      });
      if (animate) return;
      void figure.offsetWidth;
      slots.forEach((slot) => {
        slot.el.style.transition = '';
      });
    };

    let shape = EMPTY; // what the figure shows, EMPTY while the dial is away
    let current = -1; // the section on the dial, -1 before the first one

    // The digit a slot shows right now, and how far past it: a roll cut short by the next one
    // starts again from there, nothing jumps
    const cellOf = (slot) => {
      if (slot.anim?.playState !== 'running') return null;
      const cells = slot.strip.children;
      const height = parseFloat(getComputedStyle(cells[0]).height) || 1;
      const pos = -new DOMMatrixReadOnly(getComputedStyle(slot.strip).transform).m42 / height;
      const index = Math.min(cells.length - 1, Math.max(0, Math.round(pos)));
      const text = cells[index].textContent;
      return { digit: text === '' ? 0 : Number(text), blank: text === '', offset: pos - index };
    };

    const rollTo = (stop, animate) => {
      const to = shapeOf(stop);
      const from = shape;
      const up = from.value === null || stop.value >= from.value;
      const now = digitSlots.map((slot) => (from.value !== null && cellOf(slot)) || { digit: from.digits[slot.place], blank: !from.visible[slot.place], offset: 0 });
      // The highest digit that changes rolls straight to its value; the ones on its right spin
      // 1 to TURNS full turns more and land later, the ones on its left stay put
      const first = now.findIndex((cell, i) => cell.digit !== to.digits[i] || cell.blank === to.visible[i]);
      let last = -1;
      now.forEach((cell, i) => {
        if (!cell.blank || to.visible[i]) last = i;
      });
      digitSlots.forEach((slot, i) => {
        const cell = now[i];
        const blank = !to.visible[i];
        let steps = 0;
        if (first >= 0 && i >= first && !(cell.blank && blank)) {
          steps = ((((up ? to.digits[i] - cell.digit : cell.digit - to.digits[i]) % 10) + 10) % 10);
          if (i > first) steps += 10 * (last - first > 1 ? 1 + Math.round(((i - first - 1) / (last - first - 1)) * (TURNS - 1)) : 1);
        }
        // The cells from the digit shown to the new one, in the direction of the value: the
        // strip goes up when it climbs (new digits from below), down when it falls (from above)
        let texts = [blank ? '' : String(to.digits[i])];
        if (steps) {
          texts = [];
          for (let s = 0; s <= steps; s += 1) texts.push(String((((up ? cell.digit + s : cell.digit - s) % 10) + 10) % 10));
          if (cell.blank) texts[0] = '';
          if (blank) texts[steps] = '';
          if (!up) texts.reverse();
        }
        const end = up ? steps : 0;
        // Cut short, a roll carries on from where it was, when that cell has a neighbour
        const offset = steps && (up ? cell.offset > 0 : cell.offset < 0) ? cell.offset : 0;
        const start = (up ? 0 : steps) + offset;
        slot.anim?.cancel();
        slot.anim = null;
        slot.strip.replaceChildren(...texts.map((text) => make('span', 'cell', text)));
        slot.strip.style.transform = `translateY(${(-end * CELL).toFixed(3)}em)`;
        if (!animate || start === end) return;
        slot.anim = slot.strip.animate(
          [{ transform: `translateY(${(-start * CELL).toFixed(3)}em)` }, { transform: `translateY(${(-end * CELL).toFixed(3)}em)` }],
          { duration: (ROLL + Math.max(0, i - first) * LAG) * pace, easing: EASE },
        );
      });
      size(to, animate);
      shape = to;
    };

    // The needle: from where it is, even halfway through a slide
    const point = (to, from, animate) => {
      const target = `translateX(${(at(to) * 100).toFixed(2)}%)`;
      const before = needle.getAnimations().length ? getComputedStyle(needle).transform : from;
      needle.getAnimations().forEach((anim) => anim.cancel());
      needle.style.transform = target;
      if (animate) needle.animate([{ transform: before }, { transform: target }], { duration: ROLL * pace, easing: EASE });
    };

    // The note rolls like a word: the old one leaves on the side you scroll from, the new one
    // comes in from the side you scroll to
    const note = (index, dir, animate) => {
      notes.forEach((line, i) => {
        const on = i === index;
        if (line.classList.contains('is-current') === on) return;
        const before = line.getAnimations().length ? getComputedStyle(line).transform : null;
        line.getAnimations().forEach((anim) => anim.cancel());
        // The class gives the resting place, the animation the way there
        line.classList.toggle('is-current', on);
        if (!animate) return;
        line.animate(
          [{ transform: before || (on ? `translateY(${dir * 110}%)` : 'none') }, { transform: on ? 'none' : `translateY(${-dir * 110}%)` }],
          { duration: NOTE * pace, easing: NOTE_EASE },
        );
      });
    };

    const show = (index) => {
      const stop = stops[index];
      if (current < 0) {
        // The dial comes in from its corner: the figure rolls up from nothing, the needle sweeps
        // from the start of the scale, the note rises with the label
        if (!measured) measure();
        shape = EMPTY;
        size(EMPTY, false);
        rollTo(stop, !still);
        notes.forEach((line) => line.classList.remove('is-current'));
        note(index, 1, !still);
        point(stop.value, 'translateX(0%)', !still);
        root.classList.add('is-shown');
      } else {
        rollTo(stop, !still);
        note(index, index > current ? 1 : -1, !still);
        point(stop.value, needle.style.transform, !still);
      }
      current = index;
      sr.textContent = `${[label, spoken(stop), unit].filter(Boolean).join(' ')}${stop.note ? `, ${stop.note}` : ''}`;
    };
    const hide = () => {
      current = -1;
      root.classList.remove('is-shown');
      sr.textContent = '';
    };

    let frame = 0;
    const read = () => {
      frame = 0;
      const line = window.innerHeight * (window.innerHeight <= 720 ? LINE_SHORT : LINE);
      let index = -1;
      stops.forEach((stop, i) => {
        if (stop.el.getBoundingClientRect().top <= line) index = i;
      });
      if (index === current) return;
      if (index < 0) hide();
      else show(index);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };

    measure();
    size(EMPTY, false);
    document.fonts?.ready.then(() => {
      if (signal.aborted) return;
      measure();
      size(shape, false);
    });
    // Scrolling anywhere: the page, or a box the story scrolls in
    document.addEventListener('scroll', schedule, { capture: true, passive: true, signal });
    window.addEventListener('resize', schedule, { signal });
    signal.addEventListener('abort', () => cancelAnimationFrame(frame));
    schedule();
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
