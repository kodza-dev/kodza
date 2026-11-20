// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Revision Diff
// Compares the text with its last version (the template inside the root), block by block, then
// word by word: the words that left come back struck through where they stood, the words that
// arrived are underlined, and a mark in the margin follows each change. A switch shows or hides
// them; the arrows, N and P step from one change to the next.
// Settings: the --kz-revision-diff-* variables in the CSS, data-open and data-locale on the root,
// the words below (data-text-*) and the timings just under them.
(() => {
  const SELECTOR = '[data-kodza-revision-diff]';
  // Every word the script writes; each one can be set on the root with data-text-<key>
  // (data-text-show="Show edits"); {n}, {i} and {date} are filled in
  const WORDS = {
    changes: '{n} changes', // the total, more than one
    change: '{n} change', // the total, exactly one
    since: 'since {date}', // after the total; the date is data-date on the template
    none: 'No changes',
    show: 'Show changes', // the switch
    previous: 'Previous change',
    next: 'Next change',
    removed: 'Removed:', // read out before the words that left
    added: 'Added:', // read out before the words that arrived
    position: 'Change {i} of {n}', // read out on each step
  };
  // How long the text takes to make room for the words that left, then to give it back, in ms
  const GROW = 550;
  const SHRINK = 450;
  // How long the number of the change you are on takes to roll, in ms
  const ROLL = 380;
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const EASE_BACK = 'cubic-bezier(0.65, 0, 0.35, 1)';
  // The band of the screen, from the top, a change has to sit in; outside it, the page scrolls to it
  const BAND = [0.2, 0.8];
  // Past this many words on one side, a block counts as one change instead of word by word
  const MAX_TOKENS = 1500;
  // What counts as a block of text: blocks are paired first, then their words
  const BLOCKS = 'p, li, h1, h2, h3, h4, h5, h6, blockquote, dt, dd, figcaption, td, th, pre';
  // How much two blocks must share (words in common) to be read as the same block, edited
  const MATCH = 0.4;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };

  // Longest common subsequence of two lists, as the steps to go from a to b:
  // '=' kept, '-' only in a, '+' only in b
  const lcs = (a, b, same) => {
    const n = a.length;
    const m = b.length;
    const w = m + 1;
    const L = new Uint16Array((n + 1) * w);
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        L[i * w + j] = same(a[i], b[j]) ? L[(i + 1) * w + j + 1] + 1 : Math.max(L[(i + 1) * w + j], L[i * w + j + 1]);
      }
    }
    const ops = [];
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
      if (same(a[i], b[j])) ops.push(['=', i++, j++]);
      else if (L[(i + 1) * w + j] >= L[i * w + j + 1]) ops.push(['-', i++, j]);
      else ops.push(['+', i, j++]);
    }
    while (i < n) ops.push(['-', i++, j]);
    while (j < m) ops.push(['+', i, j++]);
    return { ops, length: L[0] };
  };

  const TOKEN = /\s+|[\p{L}\p{N}'’_-]+|[^\s\p{L}\p{N}]/gu;
  const WORD = /[\p{L}\p{N}]/u;
  const tokensOf = (text) => [...text.matchAll(TOKEN)].map((m) => ({
    key: /^\s/.test(m[0]) ? ' ' : m[0],
    s: m.index,
    e: m.index + m[0].length,
  }));
  const flat = (text) => text.replace(/\s+/g, ' ').trim();
  const wordsOf = (text) => text.toLowerCase().match(/[\p{L}\p{N}'’]+/gu) || [];
  const alike = (a, b) => {
    const wa = wordsOf(a);
    const wb = wordsOf(b);
    if (!wa.length || !wb.length || wa.length * wb.length > 250000) return 0;
    return (2 * lcs(wa, wb, (x, y) => x === y).length) / (wa.length + wb.length);
  };
  const leavesOf = (scope) => [...scope.querySelectorAll(BLOCKS)].filter((el) => !el.querySelector(BLOCKS));

  // Old and new blocks, paired: the same text first, then, between two of those, the most alike
  const pairBlocks = (olds, news) => {
    const a = olds.map((el) => flat(el.textContent));
    const b = news.map((el) => flat(el.textContent));
    const pairs = [];
    let gapA = [];
    let gapB = [];
    const flush = () => {
      if (gapA.length && gapB.length && gapA.length * gapB.length <= 400) {
        const near = gapA.map((i) => gapB.map((j) => alike(a[i], b[j]) >= MATCH));
        const { ops } = lcs(gapA.map((_, x) => x), gapB.map((_, y) => y), (x, y) => near[x][y]);
        ops.forEach(([op, x, y]) => pairs.push([op === '+' ? -1 : gapA[x], op === '-' ? -1 : gapB[y], false]));
      } else {
        const both = Math.min(gapA.length, gapB.length);
        gapA.forEach((i, x) => pairs.push([i, x < both ? gapB[x] : -1, false]));
        gapB.slice(both).forEach((j) => pairs.push([-1, j, false]));
      }
      gapA = [];
      gapB = [];
    };
    lcs(a, b, (x, y) => x === y).ops.forEach(([op, i, j]) => {
      if (op === '=') {
        flush();
        pairs.push([i, j, true]);
      } else if (op === '-') gapA.push(i);
      else gapB.push(j);
    });
    flush();
    return pairs;
  };

  const trimmed = (text, s, e) => {
    while (s < e && /\s/.test(text[s])) s++;
    while (e > s && /\s/.test(text[e - 1])) e--;
    return s < e ? [s, e] : null;
  };

  // What changed between two versions of a block: each hunk holds the words that left (del, put
  // back at `at` in the new text) and the range of the new text that arrived (ins)
  const hunksOf = (before, text) => {
    const a = tokensOf(before);
    const b = tokensOf(text);
    if (a.length > MAX_TOKENS || b.length > MAX_TOKENS) {
      const ins = trimmed(text, 0, text.length);
      return [{ del: flat(before), ins, at: ins ? ins[0] : text.length }];
    }
    const hunks = [];
    let h = null;
    lcs(a, b, (x, y) => x.key === y.key).ops.forEach(([op, i, j]) => {
      if (op === '=') {
        h = null;
        return;
      }
      if (!h) {
        h = { i0: i, i1: i, j0: j, j1: j };
        hunks.push(h);
      }
      if (op === '-') h.i1 = i + 1;
      else h.j1 = j + 1;
    });
    // Two changes a word apart read as one
    for (let k = hunks.length - 1; k > 0; k--) {
      const prev = hunks[k - 1];
      const next = hunks[k];
      const between = b.slice(prev.j1, next.j0).filter((t) => WORD.test(t.key)).length;
      if (between <= 1) {
        prev.i1 = next.i1;
        prev.j1 = next.j1;
        hunks.splice(k, 1);
      }
    }
    return hunks.map(({ i0, i1, j0, j1 }) => {
      const del = i1 > i0 ? flat(before.slice(a[i0].s, a[i1 - 1].e)) : '';
      const ins = j1 > j0 ? trimmed(text, b[j0].s, b[j1 - 1].e) : null;
      let at = text.length;
      if (ins) at = ins[0];
      else if (j0 < b.length) at = !b[j0].key.trim() ? b[j0].e : b[j0].s;
      return { del, ins, at };
    }).filter((x) => x.del || x.ins);
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const body = root.querySelector('.kodza-revision-diff__body');
    if (!body) return;
    const before = root.querySelector('template.kodza-revision-diff__before');
    const say = (key, vars = {}) => {
      const set = root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`];
      return (set ?? WORDS[key]).replace(/\{(\w+)\}/g, (all, name) => (name in vars ? vars[name] : all));
    };
    const el = (tag, cls, text) => {
      const node = document.createElement(tag);
      if (cls) node.className = `kodza-revision-diff__${cls}`;
      if (text) node.textContent = text;
      return node;
    };

    const delOf = (h, k) => {
      const del = el('del');
      del.className = 'kodza-revision-diff__del';
      del.dataset.change = k;
      del.append(el('span', 'sr', `${say('removed')} `));
      if (h.lead) del.append(' ');
      del.append(el('span', 'out', h.del));
      if (h.trail) del.append(' ');
      return del;
    };

    // Writes the hunks into a block of the page, around its own markup (links, bold...)
    const apply = (block, hunks) => {
      const text = block.textContent;
      hunks.forEach((h) => {
        if (!h.del) return;
        const prev = text[h.at - 1];
        const next = text[h.at];
        h.lead = h.at > 0 && !/[\s([“‘"']/.test(prev);
        h.trail = next !== undefined && !/[\s.,;:!?)\]'’"”…]/.test(next);
      });
      const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
      const nodes = [];
      let pos = 0;
      while (walker.nextNode()) {
        const node = walker.currentNode;
        nodes.push({ node, s: pos, e: pos + node.data.length });
        pos += node.data.length;
      }
      nodes.forEach(({ node, s, e }, n) => {
        const last = n === nodes.length - 1;
        const here = (h) => h.del && h.at >= s && (h.at < e || (last && h.at === e));
        const cuts = new Set([s, e]);
        hunks.forEach((h) => {
          if (h.ins) h.ins.forEach((p) => p > s && p < e && cuts.add(p));
          if (here(h)) cuts.add(h.at);
        });
        const points = [...cuts].sort((x, y) => x - y);
        const frag = document.createDocumentFragment();
        points.forEach((p, c) => {
          hunks.forEach((h) => here(h) && h.at === p && frag.append(delOf(h, h.k)));
          const q = points[c + 1];
          if (q === undefined || q === p) return;
          const piece = node.data.slice(p - s, q - s);
          const h = hunks.find((x) => x.ins && x.ins[0] <= p && q <= x.ins[1]);
          if (!h) {
            frag.append(piece);
            return;
          }
          const ins = el('ins');
          ins.className = 'kodza-revision-diff__ins';
          ins.dataset.change = h.k;
          if (!h.told) ins.append(el('span', 'sr', `${say('added')} `));
          h.told = true;
          ins.append(piece);
          frag.append(ins);
        });
        node.replaceWith(frag);
      });
    };

    const olds = before ? leavesOf(before.content) : [];
    const news = leavesOf(body);
    let k = 0;
    if (before) {
      const pairs = pairBlocks(olds, news);
      pairs.forEach(([i, j, same], at) => {
        if (same) return;
        if (j >= 0) {
          const block = news[j];
          const text = block.textContent;
          const whole = trimmed(text, 0, text.length);
          const hunks = i >= 0 ? hunksOf(olds[i].textContent, text) : whole ? [{ del: '', ins: whole, at: whole[0] }] : [];
          hunks.forEach((h) => { h.k = k++; });
          if (hunks.length) apply(block, hunks);
          return;
        }
        // A block that left: back in place, between its old neighbours, as one struck line
        const gone = document.importNode(olds[i], true);
        gone.classList.add('kodza-revision-diff__gone');
        gone.replaceChildren(delOf({ del: flat(olds[i].textContent) }, k++));
        const after = pairs.slice(at + 1).find((p) => p[1] >= 0);
        const prior = pairs.slice(0, at).reverse().find((p) => p[1] >= 0);
        const nextBlock = after && news[after[1]];
        const prevBlock = prior && news[prior[1]];
        if (nextBlock && (!prevBlock || nextBlock.tagName === gone.tagName || prevBlock.tagName !== gone.tagName)) nextBlock.before(gone);
        else if (prevBlock) prevBlock.after(gone);
        else body.append(gone);
      });
    }

    // Numbered in reading order, each change with every piece of it
    const marks = [...body.querySelectorAll('[data-change]')];
    const order = new Map();
    marks.forEach((m) => order.has(m.dataset.change) || order.set(m.dataset.change, order.size));
    const changes = [...order.keys()].map(() => []);
    marks.forEach((m) => {
      const n = order.get(m.dataset.change);
      m.dataset.change = n;
      changes[n].push(m);
    });
    const count = changes.length;
    const moving = [...new Set([...body.querySelectorAll('.kodza-revision-diff__del')]
      .map((d) => d.closest('.kodza-revision-diff__gone') || d.parentElement.closest(BLOCKS))
      .filter(Boolean))];

    const dateOf = (raw) => {
      if (!raw) return '';
      const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
      const date = ymd ? new Date(+ymd[1], +ymd[2] - 1, +ymd[3]) : new Date(raw);
      if (Number.isNaN(date.getTime())) return raw;
      const options = { month: 'short', day: 'numeric' };
      if (date.getFullYear() !== new Date().getFullYear()) options.year = 'numeric';
      const locale = root.dataset.locale || root.closest('[lang]')?.lang || undefined;
      try {
        return new Intl.DateTimeFormat(locale, options).format(date);
      } catch {
        return new Intl.DateTimeFormat(undefined, options).format(date);
      }
    };

    const chevron = (d) => `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const bar = el('div', 'bar');
    bar.innerHTML = `<div class="kodza-revision-diff__summary"><span class="kodza-revision-diff__dot" aria-hidden="true"></span><span></span><span class="kodza-revision-diff__since"></span></div>`
      + `<div class="kodza-revision-diff__controls"><span class="kodza-revision-diff__count" aria-hidden="true"><span class="kodza-revision-diff__index"><span>1</span></span><span></span></span>`
      + `<button type="button" class="kodza-revision-diff__step">${chevron('M4 10l4-4 4 4')}</button>`
      + `<button type="button" class="kodza-revision-diff__step">${chevron('M4 6l4 4 4-4')}</button>`
      + `<span class="kodza-revision-diff__sr" aria-live="polite"></span>`
      + `<button type="button" class="kodza-revision-diff__switch" role="switch" aria-checked="false"><span class="kodza-revision-diff__track" aria-hidden="true"><span class="kodza-revision-diff__thumb"></span></span><span></span></button></div>`;
    const [total, since] = bar.querySelector('.kodza-revision-diff__summary').querySelectorAll(':scope > span:not([aria-hidden])');
    const index = bar.querySelector('.kodza-revision-diff__index');
    const [prevButton, nextButton] = bar.querySelectorAll('.kodza-revision-diff__step');
    const live = bar.querySelector('.kodza-revision-diff__sr');
    const toggle = bar.querySelector('.kodza-revision-diff__switch');
    total.textContent = count ? say(count === 1 ? 'change' : 'changes', { n: count }) : say('none');
    const date = count ? dateOf(before?.dataset.date) : '';
    if (date) since.textContent = say('since', { date });
    else since.remove();
    index.nextElementSibling.textContent = ` / ${count}`;
    prevButton.setAttribute('aria-label', say('previous'));
    nextButton.setAttribute('aria-label', say('next'));
    toggle.lastElementChild.textContent = say('show');
    if (!count) [prevButton, nextButton, toggle].forEach((b) => { b.disabled = true; });
    root.prepend(bar);

    const gutter = el('div', 'gutter');
    gutter.setAttribute('aria-hidden', 'true');
    const ticks = changes.map(() => gutter.appendChild(el('span', 'tick')));
    const rail = gutter.appendChild(el('span', 'rail'));
    body.prepend(gutter);

    let open = false;
    let current = 0;
    let anims = [];
    let settle = 0;
    let wait = 0;
    let raf = 0;
    let trackUntil = 0;

    const scaleOf = () => (root.offsetWidth ? root.getBoundingClientRect().width / root.offsetWidth : 1);
    const span = (els) => {
      let top = Infinity;
      let bottom = -Infinity;
      els.forEach((m) => [...m.getClientRects()].forEach((r) => {
        if (r.height > 0 && r.width > 0) {
          top = Math.min(top, r.top);
          bottom = Math.max(bottom, r.bottom);
        }
      }));
      return top < bottom ? { top, bottom } : null;
    };
    const place = () => {
      if (!count) return;
      const scale = scaleOf();
      const origin = body.getBoundingClientRect().top;
      changes.forEach((els, n) => {
        const box = span(els);
        const y = box ? (box.top - origin) / scale : 0;
        const h = box ? (box.bottom - box.top) / scale : 0;
        ticks[n].style.transform = `translateY(${y}px)`;
        ticks[n].style.height = `${h}px`;
        if (n === current) {
          rail.style.transform = `translateY(${y}px)`;
          rail.style.height = `${h}px`;
        }
      });
    };
    // While the text grows or shrinks, the marks follow it frame by frame
    const track = (ms) => {
      trackUntil = performance.now() + ms;
      root.classList.add('is-tracking');
      if (raf) return;
      const frame = () => {
        place();
        if (performance.now() < trackUntil) raf = requestAnimationFrame(frame);
        else {
          raf = 0;
          root.classList.remove('is-tracking');
        }
      };
      frame();
    };

    const zero = { h: 0, mt: 0, mb: 0 };
    const measure = (block, scale) => {
      const style = getComputedStyle(block);
      if (style.display === 'none') return zero;
      return {
        h: block.getBoundingClientRect().height / scale,
        mt: parseFloat(style.marginTop) || 0,
        mb: parseFloat(style.marginBottom) || 0,
      };
    };
    const frameOf = (block, m) => (block.classList.contains('kodza-revision-diff__gone')
      ? { height: `${m.h}px`, marginTop: `${m.mt}px`, marginBottom: `${m.mb}px` }
      : { height: `${m.h}px` });
    const stopAll = () => {
      anims.forEach((a) => a.cancel());
      anims = [];
      moving.forEach((b) => b.classList.remove('is-growing'));
      clearTimeout(settle);
    };

    const setOpen = (next) => {
      if (next === open || !count) return;
      open = next;
      toggle.setAttribute('aria-checked', String(open));
      if (still) {
        stopAll();
        root.classList.add('is-measuring');
        root.classList.toggle('is-diff', open);
        root.classList.toggle('is-open', open);
        place();
        void root.offsetWidth;
        root.classList.remove('is-measuring');
        return;
      }
      const scale = scaleOf();
      const from = moving.map((b) => measure(b, scale));
      stopAll();
      // The size each block will take, measured in one go with the transitions held
      root.classList.add('is-diff', 'is-measuring');
      root.classList.toggle('is-open', open);
      const to = moving.map((b) => (!open && b.classList.contains('kodza-revision-diff__gone') ? zero : measure(b, scale)));
      root.classList.toggle('is-open', !open);
      void root.offsetWidth;
      root.classList.remove('is-measuring');
      void root.offsetWidth;
      root.classList.toggle('is-open', open);
      const duration = (open ? GROW : SHRINK) * pace;
      moving.forEach((b, n) => {
        b.classList.add('is-growing');
        const anim = b.animate([frameOf(b, from[n]), frameOf(b, to[n])], {
          duration,
          easing: open ? EASE : EASE_BACK,
          fill: open ? 'none' : 'forwards',
        });
        anims.push(anim);
      });
      settle = setTimeout(() => {
        if (!open) root.classList.remove('is-diff');
        stopAll();
        place();
      }, duration);
      track(duration + 120);
    };

    const roll = (dir) => {
      const shown = index.lastElementChild;
      const number = el('span', '', String(current + 1));
      if (still || !dir || !shown) {
        index.replaceChildren(number);
        return;
      }
      index.append(number);
      const options = { duration: ROLL * pace, easing: EASE };
      shown.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${-100 * dir}%)` }], options)
        .finished.then(() => shown.remove(), () => {});
      number.animate([{ transform: `translateY(${100 * dir}%)` }, { transform: 'translateY(0)' }], options);
    };

    const scrollerOf = (node) => {
      for (let p = node.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
        const { overflowY } = getComputedStyle(p);
        if (/(auto|scroll)/.test(overflowY) && p.scrollHeight > p.clientHeight) return p;
      }
      return null;
    };
    // The change comes into the middle of the screen, unless it is already in plain view
    const reveal = () => {
      const box = span(changes[current]);
      if (!box) return;
      const scroller = scrollerOf(root);
      const view = scroller ? scroller.getBoundingClientRect() : { top: 0, height: window.innerHeight };
      const y = (box.top + box.bottom) / 2 - view.top;
      if (y >= view.height * BAND[0] && y <= view.height * BAND[1]) return;
      (scroller || window).scrollBy({ top: y - view.height / 2, behavior: still ? 'auto' : 'smooth' });
    };

    const select = (n, dir) => {
      changes[current].forEach((m) => m.classList.remove('is-current'));
      current = (n + count) % count;
      changes[current].forEach((m) => m.classList.add('is-current'));
      if (dir) roll(dir);
      live.textContent = say('position', { i: current + 1, n: count });
      place();
    };
    // Closed, a step opens the changes on the one you are on; open, it moves to the next one
    const step = (dir) => {
      if (!count) return;
      clearTimeout(wait);
      if (!open) {
        setOpen(true);
        select(current, 0);
        wait = setTimeout(reveal, still ? 0 : GROW * pace);
        return;
      }
      select(current + dir, dir);
      reveal();
    };

    if (count) {
      changes[0].forEach((m) => m.classList.add('is-current'));
      toggle.addEventListener('click', () => setOpen(!open), { signal });
      prevButton.addEventListener('click', () => step(-1), { signal });
      nextButton.addEventListener('click', () => step(1), { signal });
      document.addEventListener('keydown', (event) => {
        if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
        const key = event.key.toLowerCase();
        if (key !== 'n' && key !== 'p') return;
        const target = event.target;
        if (target.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
        const page = target === document.body || target === document.documentElement;
        const box = root.getBoundingClientRect();
        const middle = window.innerHeight / 2;
        if (!root.contains(target) && !(page && open && box.top < middle && box.bottom > middle)) return;
        event.preventDefault();
        step(key === 'n' ? 1 : -1);
      }, { signal });

      const observer = new ResizeObserver(() => raf || place());
      observer.observe(body);
      signal.addEventListener('abort', () => {
        observer.disconnect();
        stopAll();
        clearTimeout(wait);
        cancelAnimationFrame(raf);
      });

      if (root.hasAttribute('data-open')) {
        open = true;
        toggle.setAttribute('aria-checked', 'true');
        root.classList.add('is-measuring', 'is-diff', 'is-open');
        void root.offsetWidth;
        root.classList.remove('is-measuring');
      }
      place();
    }
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
