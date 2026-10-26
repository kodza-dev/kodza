// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Ruled Paper
// Sets the text down on the rules. The rules take their phase from the first baseline of the lead
// (the real text), then every other block of text (title, labels, your own paragraphs) is nudged
// by a few pixels onto its nearest rule: lines are a whole number of rules apart, so the rest of
// the block follows. Measured again when the section reflows or a web font comes in. The first
// time it is seen, the page is ruled in (see the CSS); "kodza:replay" rules it in again.
(() => {
  const SELECTOR = '[data-kodza-ruled-paper]';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TEXT = 'h1, h2, h3, h4, h5, h6, p, li, blockquote, figcaption, dt, dd';

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const content = root.querySelector('.kodza-ruled-paper__content');
    if (!content) return;

    // The blocks of text: outermost ones only (a paragraph in a quote moves with it), not the
    // row of buttons, not an empty one
    const blocks = () => [...content.querySelectorAll(TEXT)].filter((el) => !el.parentElement.closest(TEXT)
      && !el.matches('.kodza-ruled-paper__actions') && el.textContent.trim());

    // The baseline of a block's first line, in the root's own pixels: a zero-size box set on the
    // baseline, just before its first letter, then taken away again before anything is painted
    const baseline = (el, top, k) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (node) => (node.data.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP) });
      const first = walker.nextNode();
      if (!first) return null;
      const probe = document.createElement('span');
      probe.setAttribute('aria-hidden', 'true');
      probe.style.cssText = 'display:inline-block;width:0;height:0;margin:0;padding:0;border:0;vertical-align:baseline';
      first.parentNode.insertBefore(probe, first);
      const y = (probe.getBoundingClientRect().bottom - top) / k;
      probe.remove();
      return y;
    };

    // The rule spacing as the page resolves it (it can be a clamp() of your own)
    const ruleOf = (k) => {
      const probe = document.createElement('div');
      probe.style.cssText = 'position:absolute;width:0;height:var(--kz-ruled-paper-rule);visibility:hidden';
      root.append(probe);
      const rule = probe.getBoundingClientRect().height / k;
      probe.remove();
      return rule;
    };

    let set = [];
    const align = () => {
      if (signal.aborted) return;
      set.forEach((el) => el.style.removeProperty('translate'));
      const box = root.getBoundingClientRect();
      const k = box.width / root.offsetWidth || 1; // a parent scaled by transform must not move a rule
      const rule = ruleOf(k);
      const list = blocks();
      const lines = list.map((el) => baseline(el, box.top, k));
      if (!(rule > 1) || !lines.length) return;
      const lead = Math.max(0, list.findIndex((el) => el.matches('.kodza-ruled-paper__lead')));
      // A rule is one pixel, on the bottom row of each band of the background: right under the letters
      const anchor = Math.round(lines[lead]);
      root.style.setProperty('--kz-ruled-paper-phase', `${(((anchor + 1) % rule) + rule) % rule}px`);
      set = list.filter((el, i) => {
        if (lines[i] == null) return false;
        const nudge = anchor + Math.round((lines[i] - anchor) / rule) * rule - lines[i];
        if (Math.abs(nudge) < 0.25) return false;
        el.style.translate = `0 ${nudge.toFixed(2)}px`;
        return true;
      });
    };

    let frame = 0;
    const soon = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(align);
    };
    const ro = new ResizeObserver(soon);
    ro.observe(root);
    ro.observe(content);
    const fonts = document.fonts?.ready || Promise.resolve();
    fonts.then(soon);
    document.fonts?.addEventListener('loadingdone', soon, { signal });

    // Ruled in when a quarter of it shows and the web font is in (no rule moves after it)
    let io = null;
    const ruleIn = () => {
      io?.disconnect();
      fonts.then(() => {
        if (signal.aborted) return;
        cancelAnimationFrame(frame);
        align();
        root.classList.add('is-in');
      });
    };
    if (reduceMotion) root.classList.add('is-in');
    else {
      io = new IntersectionObserver((entries) => {
        if (entries[entries.length - 1].isIntersecting) ruleIn();
      }, { threshold: 0.25 });
      io.observe(root);
      // Ruled in again: blank at once (only the way in is animated), drawn blank, then ruled
      root.addEventListener('kodza:replay', () => {
        root.classList.remove('is-in');
        void root.offsetWidth;
        ruleIn();
      }, { signal });
    }

    align();

    signal.addEventListener('abort', () => {
      cancelAnimationFrame(frame);
      io?.disconnect();
      ro.disconnect();
      set.forEach((el) => el.style.removeProperty('translate'));
      root.style.removeProperty('--kz-ruled-paper-phase');
      root.classList.remove('is-in');
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
