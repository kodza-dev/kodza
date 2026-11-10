// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Spec Sheet
// With two models or more, the script turns them into one sheet and a tab per model: the name
// wipes across with the pictures, the count and every value roll up out of their line (a number
// the way its value goes), the text slides across and each picture wipes in from the side you go
// to. It also lets the pinned sheet go when it is taller than the screen. The settings are the
// constants below.
(() => {
  const SELECTOR = '[data-kodza-spec-sheet]';
  // Durations in ms, all times the site's pace (--kz-motion-scale)
  const ROLL = 700; // a value rolling out of its line while the next one rolls in
  const ROLL_EASE = 'cubic-bezier(0.76, 0, 0.24, 1)';
  const ROW_STAGGER = 45; // between two rows of the sheet
  const NAME_ROOM = 0.2; // em kept around the name by its wipe: the font's full height, accents and descenders
  const ROLL_ROOM = 0.25; // em kept on each side of a value by its line, for the last letter's overhang
  const ABOUT_OUT = 380; // the text of the model you leave slides away
  const ABOUT_IN = 520; // the text of the model you go to slides in
  const ABOUT_DELAY = 120;
  const ABOUT_SHIFT = 16; // px the texts slide across
  const OUT_EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const IN_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const WIPE = 950; // a picture wiping in over the last one
  const WIPE_STAGGER = 90; // between two pictures
  const WIPE_ZOOM = 1.15; // the new picture settles from this scale
  const WIPE_PUSH = 8; // % the old picture is pushed aside
  const CAPTION_DELAY = 150; // the new caption rolls in after the old one
  const ROOM = 40; // px kept free under the pinned sheet: taller than the screen minus this, it scrolls with the page
  const EMPTY = '—'; // a value a model does not have
  // The name of the tab row for screen readers; data-text-models on the root replaces it
  const WORDS = { models: 'Models' };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const NUMBER = /^[^\p{L}\d\s]?\d/u; // a value that starts with a number rolls the way its value goes
  const numberOf = (text) => parseFloat((text.match(/\d[\d,   ]*(?:\.\d+)?/) || ['0'])[0].replace(/[^\d.]/g, '')) || 0;
  let uid = 0;

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const ms = (time) => time * pace;
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const el = (tag, part) => {
      const node = document.createElement(tag);
      node.className = `kodza-spec-sheet__${part}`;
      return node;
    };
    const models = [...root.querySelectorAll('.kodza-spec-sheet__model')];

    // The pinned sheet lets go when it is taller than the screen
    const loosen = () => {
      const sheet = root.querySelector('.kodza-spec-sheet__sheet');
      if (!sheet) return;
      const top = parseFloat(getComputedStyle(sheet).top) || 0;
      root.classList.toggle('is-loose', sheet.offsetHeight > innerHeight - top - ROOM);
    };
    addEventListener('resize', loosen, { signal });

    if (models.length < 2) {
      const watch = new ResizeObserver(loosen);
      watch.observe(root);
      signal.addEventListener('abort', () => watch.disconnect());
      return;
    }

    const n = models.length;
    const first = models[0];
    const id = `kodza-spec-sheet-${++uid}`;
    const names = models.map((model) => model.querySelector('.kodza-spec-sheet__name')?.textContent.trim() || '');
    root.classList.add('has-models');

    // —— The slots: every text a slot can show sits in one cell (the widest sets its size), one is shown ——
    const slots = [];
    const slotOf = (texts, row) => {
      const slot = el('span', 'slot');
      slot.setAttribute('aria-hidden', 'true');
      const sizers = texts.map((text) => {
        const sizer = el('span', 'sizer');
        sizer.textContent = text;
        slot.append(sizer);
        return sizer;
      });
      const r = { slot, sizers, texts, row, target: 0, token: 0, anims: [] };
      slots.push(r);
      return r;
    };
    const show = (r, i) => r.sizers.forEach((sizer, j) => sizer.classList.toggle('is-shown', j === i));
    // Ends a change where it is going: the text it was going to shows alone
    const settle = (r) => {
      r.token++;
      r.anims.forEach((anim) => anim.cancel());
      r.anims = [];
      r.slot.style.removeProperty('clip-path');
      show(r, r.target);
    };
    const finish = (r) => {
      const token = r.token;
      Promise.all(r.anims.map((anim) => anim.finished)).then(() => {
        if (token === r.token && !signal.aborted) settle(r);
      }).catch(() => {});
    };
    // The name: one edge crosses it, the same way and in the same time as the pictures
    const wipe = ({ r, from, wa, wb, room }, to, dir) => {
      r.target = to;
      const a = r.sizers[from];
      const b = r.sizers[to];
      const w = Math.max(wa, wb);
      a.classList.add('is-shown');
      b.classList.add('is-shown');
      // The edge, in px from the left of the name: from beyond the wider name to before it, or back
      const [e0, e1] = dir > 0 ? [w + room, -room] : [-room, w + room];
      const cut = (right, left) => `inset(${-room}px ${right}px ${-room}px ${left}px)`;
      const timing = (fill) => ({ duration: ms(WIPE), easing: ROLL_EASE, fill });
      r.anims = dir > 0
        ? [a.animate([{ clipPath: cut(wa - e0, -room) }, { clipPath: cut(wa - e1, -room) }], timing('forwards')),
          b.animate([{ clipPath: cut(-room, e0) }, { clipPath: cut(-room, e1) }], timing('backwards'))]
        : [a.animate([{ clipPath: cut(-room, e0) }, { clipPath: cut(-room, e1) }], timing('forwards')),
          b.animate([{ clipPath: cut(wb - e0, -room) }, { clipPath: cut(wb - e1, -room) }], timing('backwards'))];
      finish(r);
    };
    // A value or the count, as one word: it rolls out of its line while the next one rolls in behind
    // it, row after row; a number the way its value goes (up: the next one comes from below), a text
    // the way you go. The same text in both models stays still
    const roll = ({ r, from }, to, tabDir) => {
      r.target = to;
      const before = r.texts[from];
      const after = r.texts[to];
      if (before === after) return show(r, to);
      const numeric = NUMBER.test(before) && NUMBER.test(after);
      const dir = numeric ? Math.sign(numberOf(after) - numberOf(before)) || tabDir : tabDir;
      const a = r.sizers[from];
      const b = r.sizers[to];
      a.classList.add('is-shown');
      b.classList.add('is-shown');
      r.slot.style.clipPath = `inset(0 ${-ROLL_ROOM}em)`;
      const timing = (fill) => ({ duration: ms(ROLL), delay: ms(r.row * ROW_STAGGER), easing: ROLL_EASE, fill });
      r.anims = [
        a.animate([{ transform: 'none' }, { transform: `translateY(${-dir * 100}%)` }], timing('forwards')),
        b.animate([{ transform: `translateY(${dir * 100}%)` }, { transform: 'none' }], timing('backwards')),
      ];
      finish(r);
    };
    // Every slot to model `to`: all settled first, all measured, then all started (one layout)
    const rollAll = (to, dir) => {
      slots.forEach(settle);
      const jobs = slots.filter((r) => r.target !== to).map((r) => {
        const from = r.target;
        if (!r.name) return { r, from };
        const size = parseFloat(getComputedStyle(r.slot).fontSize) || 16;
        return { r, from, wa: r.sizers[from].offsetWidth, wb: r.sizers[to].offsetWidth, room: NAME_ROOM * size };
      });
      jobs.forEach((job) => (job.r.name ? wipe(job, to, dir) : roll(job, to, dir)));
    };

    // —— The line on top: the eyebrow on the left, "01 / 03" on the right ——
    const head = el('div', 'head');
    const eyebrow = root.querySelector('.kodza-spec-sheet__eyebrow');
    if (eyebrow) head.append(eyebrow);
    const count = el('p', 'count');
    count.setAttribute('aria-hidden', 'true');
    const two = (i) => String(i).padStart(2, '0');
    count.append(slotOf(models.map((_, i) => two(i + 1)), 0).slot, ` / ${two(n)}`);
    head.append(count);
    first.before(head);

    // —— The name: read as text, drawn by its slot ——
    const name = first.querySelector('.kodza-spec-sheet__name');
    const nameSr = el('span', 'sr');
    const nameSlot = slotOf(names, 0);
    nameSlot.name = true;
    if (name) name.replaceChildren(nameSr, nameSlot.slot);

    // —— The tabs, with the pill of Tabs ——
    const sheet = first.querySelector('.kodza-spec-sheet__sheet') || first.appendChild(el('div', 'sheet'));
    const list = el('div', 'tabs');
    list.setAttribute('role', 'tablist');
    list.setAttribute('aria-label', word('models'));
    list.append(el('span', 'indicator'));
    const tabs = models.map((model, i) => {
      const tab = el('button', 'tab');
      tab.type = 'button';
      tab.id = `${id}-tab-${i}`;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', `${id}-panel`);
      tab.textContent = model.dataset.label || names[i];
      list.append(tab);
      return tab;
    });
    // A double of the labels in the pill's colour, cut to the pill's shape
    const mirror = el('span', 'mirror');
    mirror.setAttribute('aria-hidden', 'true');
    tabs.forEach((tab) => {
      const ghost = el('span', 'ghost');
      ghost.textContent = tab.textContent;
      mirror.append(ghost);
    });
    list.append(mirror);

    // —— The panel: every model's text in one cell, one spec sheet for all ——
    const panel = el('div', 'panel');
    panel.id = `${id}-panel`;
    panel.setAttribute('role', 'tabpanel');
    const abouts = el('div', 'abouts');
    const aboutOf = models.map((model) => model.querySelector('.kodza-spec-sheet__about'));
    aboutOf.forEach((about) => about && abouts.append(about));
    panel.append(abouts);
    // Every term of every model, in the order they come; a model without one shows EMPTY
    const terms = [];
    const tables = models.map((model) => {
      const table = new Map();
      model.querySelectorAll('.kodza-spec-sheet__spec').forEach((row) => {
        const term = row.querySelector('.kodza-spec-sheet__term');
        if (!term) return;
        const key = term.textContent.trim();
        if (!terms.some((t) => t.key === key)) terms.push({ key, term });
        table.set(key, row.querySelector('.kodza-spec-sheet__value')?.textContent.trim() || '');
      });
      return table;
    });
    const specs = document.createElement('dl');
    specs.className = 'kodza-spec-sheet__specs';
    const values = terms.map(({ key, term }, row) => {
      const line = el('div', 'spec');
      const value = el('dd', 'value');
      const sr = el('span', 'sr');
      const r = slotOf(tables.map((table) => table.get(key) || EMPTY), row + 1);
      value.append(sr, r.slot);
      line.append(term, value);
      specs.append(line);
      return { r, sr };
    });
    panel.append(specs);
    sheet.querySelector('.kodza-spec-sheet__specs')?.remove();
    sheet.prepend(list, panel);

    // —— The pictures: rank by rank, every model's picture in one cell ——
    const figuresOf = models.map((model) => [...model.querySelectorAll('.kodza-spec-sheet__figure')]);
    const ranks = Math.max(0, ...figuresOf.map((figures) => figures.length));
    const shots = [];
    for (let rank = 0; rank < ranks; rank++) {
      const shot = el('div', 'shot');
      const figures = figuresOf.map((list) => list[rank] || null);
      figures.forEach((figure) => figure && shot.append(figure));
      shots.push(figures);
    }
    figuresOf.flat().forEach((figure) => {
      const caption = figure.querySelector('.kodza-spec-sheet__caption');
      if (!caption) return;
      const line = el('span', 'line');
      line.append(...caption.childNodes);
      caption.append(line);
    });
    if (ranks) {
      const media = first.querySelector('.kodza-spec-sheet__media') || first.appendChild(el('div', 'media'));
      media.replaceChildren(...shots.map((figures) => figures.find(Boolean).parentNode));
    }
    models.slice(1).forEach((model) => model.remove());

    // —— State ——
    let current = 0;
    const setOn = (node, on) => {
      if (!node) return;
      node.classList.toggle('is-active', on);
      node.toggleAttribute('inert', !on);
      if (on) node.removeAttribute('aria-hidden');
      else node.setAttribute('aria-hidden', 'true');
    };
    const state = (i) => {
      tabs.forEach((tab, j) => {
        tab.setAttribute('aria-selected', String(j === i));
        tab.tabIndex = j === i ? 0 : -1;
      });
      panel.setAttribute('aria-labelledby', tabs[i].id);
      nameSr.textContent = names[i];
      values.forEach(({ r, sr }) => { sr.textContent = r.texts[i]; });
      aboutOf.forEach((about, j) => setOn(about, j === i));
      shots.forEach((figures) => figures.forEach((figure, j) => setOn(figure, j === i)));
    };

    // The pill: clip-path of a full-width ink layer, from the tab's edges
    const place = (tab, scroll = false) => {
      list.style.removeProperty('--kz-spec-sheet-tabs-track');
      const track = list.scrollWidth;
      list.classList.toggle('is-scroll', track > list.clientWidth + 1);
      list.style.setProperty('--kz-spec-sheet-tabs-track', `${track}px`);
      list.style.setProperty('--kz-spec-sheet-ind-l', `${tab.offsetLeft}px`);
      list.style.setProperty('--kz-spec-sheet-ind-r', `${track - tab.offsetLeft - tab.offsetWidth}px`);
      if (scroll && list.classList.contains('is-scroll')) {
        const left = tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2;
        list.scrollTo({ left, behavior: still ? 'auto' : 'smooth' });
      }
    };

    // —— The change: texts slide, pictures wipe, a finished change cleans up after itself ——
    const leaving = [...aboutOf, ...shots.flat()].filter(Boolean);
    let moving = [];
    let token = 0;
    const stop = () => {
      token++;
      leaving.forEach((node) => node.classList.remove('is-leaving'));
      moving.forEach((anim) => anim.cancel());
      moving = [];
    };
    const go = (node, frames, options) => {
      if (!node) return;
      const anim = node.animate(frames, { ...options, duration: ms(options.duration), delay: ms(options.delay || 0) });
      moving.push(anim);
    };
    const swap = (from, to, dir) => {
      const oldAbout = aboutOf[from];
      oldAbout?.classList.add('is-leaving');
      go(oldAbout, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-dir * ABOUT_SHIFT}px)` }], { duration: ABOUT_OUT, easing: OUT_EASE, fill: 'forwards' });
      go(aboutOf[to], [{ opacity: 0, transform: `translateX(${dir * ABOUT_SHIFT}px)` }, { opacity: 1, transform: 'none' }], { duration: ABOUT_IN, delay: ABOUT_DELAY, easing: IN_EASE, fill: 'backwards' });
      shots.forEach((figures, rank) => {
        const out = figures[from];
        const next = figures[to];
        const delay = rank * WIPE_STAGGER;
        const part = (figure, name) => figure?.querySelector(`.kodza-spec-sheet__${name}`);
        const round = (frame) => `round ${getComputedStyle(frame).borderTopLeftRadius}`;
        if (out) {
          out.classList.add('is-leaving');
          go(part(out, 'line'), [{ transform: 'none' }, { transform: `translateY(${-dir * 100}%)` }], { duration: ROLL, delay, easing: ROLL_EASE, fill: 'forwards' });
          if (next) go(out.querySelector('img'), [{ transform: 'none' }, { transform: `translateX(${-dir * WIPE_PUSH}%)` }], { duration: WIPE, delay, easing: ROLL_EASE, fill: 'forwards' });
          else {
            // No picture of this rank for the next model: this one closes towards where you go
            const frame = part(out, 'frame');
            if (frame) go(frame, [{ clipPath: `inset(0 0 0 0 ${round(frame)})` }, { clipPath: dir > 0 ? `inset(0 100% 0 0 ${round(frame)})` : `inset(0 0 0 100% ${round(frame)})` }], { duration: WIPE, delay, easing: ROLL_EASE, fill: 'forwards' });
          }
        }
        if (next) {
          const frame = part(next, 'frame');
          if (frame) go(frame, [{ clipPath: dir > 0 ? `inset(0 0 0 100% ${round(frame)})` : `inset(0 100% 0 0 ${round(frame)})` }, { clipPath: `inset(0 0 0 0 ${round(frame)})` }], { duration: WIPE, delay, easing: ROLL_EASE, fill: 'backwards' });
          go(next.querySelector('img'), [{ transform: `scale(${WIPE_ZOOM})` }, { transform: 'none' }], { duration: WIPE * 1.2, delay, easing: IN_EASE, fill: 'backwards' });
          go(part(next, 'line'), [{ transform: `translateY(${dir * 100}%)` }, { transform: 'none' }], { duration: ROLL, delay: delay + CAPTION_DELAY, easing: ROLL_EASE, fill: 'backwards' });
        }
      });
      const run = token;
      Promise.all(moving.map((anim) => anim.finished)).then(() => {
        if (run === token && !signal.aborted) stop();
      }).catch(() => {});
    };

    const select = (index, focus = false) => {
      const next = (index + n) % n;
      if (focus) tabs[next].focus();
      if (next === current) return;
      const from = current;
      const dir = Math.sign(next - from);
      current = next;
      stop();
      state(next);
      place(tabs[next], true);
      if (still) {
        slots.forEach((r) => {
          settle(r);
          r.target = next;
          show(r, next);
        });
        return;
      }
      rollAll(next, dir);
      swap(from, next, dir);
    };

    slots.forEach((r) => show(r, 0));
    state(0);
    tabs.forEach((tab, i) => tab.addEventListener('click', () => select(i), { signal }));
    list.addEventListener('keydown', (event) => {
      const keys = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: n - 1 };
      if (!(event.key in keys)) return;
      event.preventDefault();
      select(keys[event.key], true);
    }, { signal });

    const tabsWatch = new ResizeObserver(() => place(tabs[current]));
    tabsWatch.observe(list);
    // A new width moves every name: a change in flight ends where it is going
    const rootWatch = new ResizeObserver(() => {
      loosen();
      slots.forEach((r) => r.anims.length && settle(r));
    });
    rootWatch.observe(root);
    signal.addEventListener('abort', () => {
      tabsWatch.disconnect();
      rootWatch.disconnect();
    });
    document.fonts?.ready.then(() => {
      if (signal.aborted) return;
      place(tabs[current]);
      loosen();
    });
    place(tabs[0]);
    loosen();
    requestAnimationFrame(() => !signal.aborted && root.classList.add('is-live'));
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
