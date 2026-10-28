// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Quote Link
// Words selected in the article bring up a pill that copies a link to them: the page's address with
// a text fragment (#:~:text=…), which opens the page scrolled to the quote and highlighted. The
// quote is widened to whole words, long ones are written by their first and last words, and a
// start that the page repeats gets the words before it. The heading above gives the link a
// fallback for a browser that ignores the fragment.
// An empty root works on the article around or beside it (data-target), like a Custom HTML block
// in WordPress.
(() => {
  const SELECTOR = '[data-kodza-quote-link]';
  const RESET_AFTER = 1500;
  const GAP = 10;
  const GAP_TOUCH = 28; // clear of the selection handles
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LETTER = /[\p{L}\p{N}]/u;
  const FIELD = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';

  // The pill, written once
  const MARK = document.createElement('template');
  MARK.innerHTML = '<span class="kodza-quote-link__float"><button class="kodza-quote-link__pill" type="button"><span class="kodza-quote-link__icon" aria-hidden="true"><svg class="kodza-quote-link__chain" viewBox="0 0 16 16" focusable="false"><path d="M6.75 9.25a2.75 2.75 0 0 0 3.9 0l2-2a2.75 2.75 0 0 0-3.9-3.9l-.6.6" /><path d="M9.25 6.75a2.75 2.75 0 0 0-3.9 0l-2 2a2.75 2.75 0 0 0 3.9 3.9l.6-.6" /></svg><svg class="kodza-quote-link__check" viewBox="0 0 16 16" focusable="false"><path d="M3 8.5l3.2 3L13 4.5" pathLength="1" /></svg></span><span class="kodza-quote-link__label"><span class="kodza-quote-link__word"></span><span class="kodza-quote-link__done" aria-hidden="true"></span></span></button></span>';

  async function writeText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
      document.body.append(area);
      area.select();
      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch {}
      area.remove();
      return ok;
    }
  }

  // The bottom of what stays at the top of the window (a fixed or sticky header): the pill does not
  // go under it
  function headerBottom() {
    const width = document.documentElement.clientWidth;
    let bottom = 0;
    [width / 2, 24, width - 24].forEach((x) => {
      for (let el = document.elementFromPoint(x, 1); el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
        const { position } = getComputedStyle(el);
        if (position !== 'fixed' && position !== 'sticky') continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= 1 && rect.height < window.innerHeight / 2) bottom = Math.max(bottom, rect.bottom);
        break;
      }
    });
    return bottom;
  }

  const blockOf = (el) => {
    for (; el; el = el.parentElement) {
      const { display } = getComputedStyle(el);
      if (!display.startsWith('inline') && display !== 'contents') return el;
    }
    return document.body;
  };

  // The text of a range as the page shows it, one string per block: hidden text, marks drawn for
  // the eye (a heading's #) and the pill left out
  const blocksOf = (range) => {
    const out = [];
    let block = null;
    let text = '';
    const top = range.commonAncestorContainer;
    const walker = document.createTreeWalker(top.nodeType === Node.TEXT_NODE ? top.parentNode : top, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!range.intersectsNode(node)) continue;
      const el = node.parentElement;
      if (!el.getClientRects().length || el.closest('[aria-hidden="true"], .kodza-quote-link__float')) continue;
      const from = node === range.startContainer ? range.startOffset : 0;
      const to = node === range.endContainer ? range.endOffset : node.length;
      const at = blockOf(el);
      if (at !== block) {
        out.push({ block: at, text: '' });
        block = at;
      }
      text = node.data.slice(from, to);
      out[out.length - 1].text += text;
    }
    return out.map((part) => ({ ...part, words: part.text.split(/\s+/).filter(Boolean) })).filter((part) => part.words.length);
  };

  // The selection widened to whole words: a fragment only matches on word boundaries
  const whole = (range) => {
    const r = range.cloneRange();
    const { startContainer: start, endContainer: end } = r;
    if (start.nodeType === Node.TEXT_NODE) {
      let i = r.startOffset;
      while (i > 0 && LETTER.test(start.data[i - 1])) i -= 1;
      r.setStart(start, i);
    }
    if (end.nodeType === Node.TEXT_NODE) {
      let i = r.endOffset;
      while (i < end.data.length && LETTER.test(end.data[i])) i += 1;
      r.setEnd(end, i);
    }
    return r;
  };

  const encode = (text) => encodeURIComponent(text).replace(/-/g, '%2D');
  const flat = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();

  // The link: the whole quote when it is short and in one block, its first and last words
  // otherwise, with the words before it (or after it) when the page says its start more than once
  const linkTo = (selected, scope) => {
    const range = whole(selected);
    const parts = blocksOf(range);
    if (!parts.length) return location.href;
    const first = parts[0];
    const last = parts[parts.length - 1];
    let start = first.words.join(' ');
    let end = '';
    if (parts.length > 1 || first.words.length > 10) {
      start = first.words.slice(0, 4).join(' ');
      end = last.words.slice(-4).join(' ');
    }
    const page = flat(document.body.innerText);
    const twice = (term) => page.indexOf(flat(term)) !== page.lastIndexOf(flat(term));
    let prefix = '';
    let suffix = '';
    if (twice(start)) {
      const before = document.createRange();
      before.setStart(first.block, 0);
      before.setEnd(range.startContainer, range.startOffset);
      prefix = blocksOf(before).pop()?.words.slice(-3).join(' ') || '';
      if (!prefix) {
        const after = document.createRange();
        after.setStart(range.endContainer, range.endOffset);
        after.setEnd(last.block, last.block.childNodes.length);
        suffix = blocksOf(after)[0]?.words.slice(0, 3).join(' ') || '';
      }
    }
    const terms = [prefix && `${encode(prefix)}-`, encode(start), end && encode(end), suffix && `-${encode(suffix)}`].filter(Boolean);

    // A browser without fragments still lands on the section: the heading above the quote
    const headings = [...scope.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]')]
      .filter((heading) => heading.compareDocumentPosition(range.startContainer) & Node.DOCUMENT_POSITION_FOLLOWING || heading.contains(range.startContainer));
    const id = headings.pop()?.id;
    const hash = id ? `#${encodeURIComponent(id)}` : location.hash.split(':~:')[0] || '#';
    return `${location.href.split('#')[0]}${hash}:~:text=${terms.join(',')}`;
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    let scope = root;
    if (!root.textContent.trim()) {
      const selector = root.dataset.target || 'article, main, .entry-content';
      scope = root.parentElement?.closest(selector);
      for (let up = root.parentElement; !scope && up; up = up.parentElement) scope = up.querySelector(selector);
      if (!scope) return;
    }

    const label = root.dataset.label || 'Copy link to quote';
    const copied = root.dataset.copied || 'Link copied';
    const failed = root.dataset.failed || "Couldn't copy";
    const float = MARK.content.firstElementChild.cloneNode(true);
    const pill = float.querySelector('.kodza-quote-link__pill');
    const text = float.querySelector('.kodza-quote-link__label');
    const done = float.querySelector('.kodza-quote-link__done');
    float.querySelector('.kodza-quote-link__word').textContent = label;
    done.textContent = copied;
    const status = document.createElement('span');
    status.className = 'kodza-quote-link__status';
    status.setAttribute('role', 'status');
    root.append(float, status);

    let saved = null; // the selection the pill stands for
    let shown = false;
    let pressing = false; // a mouse button held down: the selection is being made
    let holding = false; // the pill pressed: the selection may blink out before the click
    let copying = false;
    let touch = false;
    const timers = {};
    const later = (name, call, ms) => {
      clearTimeout(timers[name]);
      timers[name] = setTimeout(call, ms);
    };

    // The selection, if it is words in this article and not in a field
    const current = () => {
      const selection = getSelection();
      if (!selection?.rangeCount || selection.isCollapsed) return null;
      const range = selection.getRangeAt(0);
      const node = range.commonAncestorContainer;
      const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
      if (!scope.contains(node) || float.contains(node) || el?.closest(FIELD)) return null;
      const words = selection.toString().trim();
      return words.length >= 3 && LETTER.test(words) ? range : null;
    };
    const same = (a, b) => a.compareBoundaryPoints(Range.START_TO_START, b) === 0 && a.compareBoundaryPoints(Range.END_TO_END, b) === 0;

    // Back to "Copy link to quote", without rolling: the pill is out of sight
    const reset = () => {
      pill.classList.remove('is-copied', 'is-failed');
      text.getAnimations().forEach((animation) => animation.cancel());
      status.textContent = '';
    };

    // Over the middle of the first line, or under the last; kept on screen
    const place = () => {
      const rects = [...saved.getClientRects()].filter((rect) => rect.width > 1 && rect.height > 0);
      if (!rects.length) return false;
      const line = (at) => {
        const own = rects.filter((rect) => rect.bottom > at.top + 2 && rect.top < at.bottom - 2);
        return { left: Math.min(...own.map((r) => r.left)), right: Math.max(...own.map((r) => r.right)), top: Math.min(...own.map((r) => r.top)), bottom: Math.max(...own.map((r) => r.bottom)) };
      };
      const top = line(rects[0]);
      const bottom = line(rects[rects.length - 1]);
      const box = root.getBoundingClientRect();
      const scale = box.width / root.offsetWidth || 1;
      const width = pill.offsetWidth * scale;
      const height = pill.offsetHeight * scale;
      const gap = (touch ? GAP_TOUCH : GAP) * scale;
      const above = top.top - GAP * scale - height >= headerBottom() + 8;
      const below = bottom.bottom + gap + height <= window.innerHeight - 8;
      const under = touch ? below || !above : !above;
      const at = under ? bottom : top;
      const page = document.documentElement.clientWidth;
      const x = Math.min(Math.max((at.left + at.right) / 2, 8 + width / 2), page - 8 - width / 2);
      const y = under ? at.bottom + gap : at.top - GAP * scale;
      float.classList.toggle('is-below', under);
      float.style.translate = `${(x - box.left) / scale - root.clientLeft}px ${(y - box.top) / scale - root.clientTop}px`;
      return true;
    };

    // The label rolls, its width following from one word to the other: to "Link copied" (or
    // "Couldn't copy"), and back to "Copy link to quote" when other words are chosen
    const roll = (word) => {
      const from = text.offsetWidth;
      if (word) done.textContent = word;
      pill.classList.toggle('is-failed', word === failed);
      pill.classList.toggle('is-copied', Boolean(word));
      status.textContent = '';
      const to = text.offsetWidth;
      if (!reduceMotion && from !== to) text.animate([{ width: `${from}px` }, { width: `${to}px` }], { duration: 380, easing: EASE });
    };

    const show = (range) => {
      clearTimeout(timers.leave);
      saved = range.cloneRange();
      if (!shown) {
        clearTimeout(timers.reset);
        reset();
      } else if (pill.classList.contains('is-copied')) {
        roll(null);
      }
      if (!place()) return;
      if (shown) return;
      void float.offsetWidth; // placed before it appears: it comes up where it stands, not from the last place
      float.classList.add('is-shown');
      shown = true;
    };

    const hide = () => {
      clearTimeout(timers.show);
      clearTimeout(timers.leave);
      if (!shown) return;
      shown = false;
      if (float.contains(document.activeElement)) pill.blur();
      float.classList.remove('is-shown');
      later('reset', reset, 200);
    };

    const check = () => {
      if (copying) return;
      const range = current();
      if (!range) hide();
      else if (!shown || !saved || !same(range, saved)) show(range);
    };

    const copy = async () => {
      if (!saved || copying) return;
      copying = true;
      const range = saved;
      const focused = document.activeElement === pill;
      const ok = await writeText(linkTo(range, scope));
      // The copy's fallback borrowed the selection and the focus: both come back
      const selection = getSelection();
      if (selection && (!selection.rangeCount || !same(selection.getRangeAt(0), range))) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      if (focused) pill.focus({ preventScroll: true });
      copying = false;
      if (signal.aborted || !shown) return;
      roll(ok ? copied : failed);
      status.textContent = ok ? copied : `${failed}. Copy the address from the bar.`;
      later('leave', hide, RESET_AFTER);
    };

    // The mouse: the pill goes as the button goes down and comes up with it, once the words are chosen
    document.addEventListener('pointerdown', (event) => {
      touch = event.pointerType === 'touch' || event.pointerType === 'pen';
      if (float.contains(event.target) || event.pointerType !== 'mouse' || event.button) return;
      pressing = true;
      hide();
    }, { signal, capture: true });
    document.addEventListener('pointerup', (event) => {
      if (!pressing || event.pointerType !== 'mouse') return;
      pressing = false;
      later('show', check, 0);
    }, { signal, capture: true });
    // A finger or the keyboard: once the selection holds still
    document.addEventListener('selectionchange', () => {
      if (pressing || holding || copying) return;
      if (!current()) hide();
      else later('show', check, 280);
    }, { signal });

    // Pressing the pill keeps the selection and gives no focus ring to a click
    pill.addEventListener('mousedown', (event) => event.preventDefault(), { signal });
    pill.addEventListener('pointerdown', () => {
      holding = true;
      later('hold', () => { holding = false; }, 600);
    }, { signal });
    pill.addEventListener('click', () => {
      holding = false;
      copy();
    }, { signal });

    // Tab goes to the pill while it is up; Escape puts it away, the selection stays
    document.addEventListener('keydown', (event) => {
      if (!shown) return;
      if (event.key === 'Escape') {
        hide();
      } else if (event.key === 'Tab' && !event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey
        && document.activeElement !== pill && !document.activeElement?.closest(FIELD)) {
        event.preventDefault();
        pill.focus({ preventScroll: true });
      }
    }, { signal });
    // Tabbing past it says no
    pill.addEventListener('focusout', (event) => {
      if (copying || !document.hasFocus() || float.contains(event.relatedTarget)) return;
      hide();
    }, { signal });

    const replace = () => {
      if (shown && saved) place();
    };
    window.addEventListener('resize', replace, { signal });
    document.fonts?.ready.then(() => {
      if (!signal.aborted) replace();
    });

    signal.addEventListener('abort', () => {
      Object.values(timers).forEach(clearTimeout);
      float.remove();
      status.remove();
    });
  }

  // Kodza lifecycle, the same in every component: `kodza:init` starts the instances inside
  // event.detail.root (the whole page by default), `kodza:destroy` stops them and puts their
  // markup back. For themes and apps that swap content without a page load. Each running root
  // keeps its markup as written under KODZA, shared by every Kodza script on the page: a Kodza
  // component inside another one is saved as written, not half-started, and stopped with it.
  const KODZA = Symbol.for('kodza');
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
    if (root.classList.contains('is-ready')) return; // already running, maybe from another copy of this script
    // Rendered by React (data-kodza-manual): React starts it, with an init aimed at that markup once
    // it has hydrated it. Any earlier start would change markup React has not taken over yet
    const owner = root.closest('[data-kodza-manual]');
    if (owner && !(scope && owner.contains(scope))) return;
    const controller = new AbortController();
    const saved = { html: written(root), attrs: attrsOf(root), stop: () => destroy(root) };
    instances.set(root, { controller, saved });
    root[KODZA] = saved;
    mount(root, controller.signal);
    root.classList.add('is-ready');
  });
  const destroy = (scope) => find(scope).forEach((root) => {
    const instance = instances.get(root);
    if (!instance) return;
    instances.delete(root);
    // The Kodza components running inside it stop first: once its markup is put back, their own
    // script could not find them any more
    root.querySelectorAll('*').forEach((el) => el[KODZA]?.stop());
    instance.controller.abort();
    delete root[KODZA];
    put(root, instance.saved);
  });
  document.addEventListener('kodza:init', (event) => init(event.detail?.root));
  document.addEventListener('kodza:destroy', (event) => destroy(event.detail?.root));
  init();
  // Loaded in <head>, the script runs before the markup exists: once more when it is parsed
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(), { once: true });
})();
