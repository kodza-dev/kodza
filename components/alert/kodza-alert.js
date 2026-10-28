// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Alert
// Draws the icon when an alert shows up, folds it away when dismissed (its height, its padding
// and the gap after it, so what follows slides up), and unfolds it the same way when [hidden]
// is removed. A dismissed alert sends "kodza:alert-close". The details of an error open and
// close at their real height.
(() => {
  const SELECTOR = '.kodza-alert';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const fold = 'cubic-bezier(0.65, 0, 0.35, 1)';
  let uid = 0;

  // The space between the alert and what follows it (or precedes it, for the last one)
  const space = (el) => {
    const next = el.nextElementSibling;
    const prev = el.previousElementSibling;
    if (next && !next.hidden) return { side: 'marginBottom', px: next.getBoundingClientRect().top - el.getBoundingClientRect().bottom };
    if (prev && !prev.hidden) return { side: 'marginTop', px: el.getBoundingClientRect().top - prev.getBoundingClientRect().bottom };
    return { side: 'marginBottom', px: 0 };
  };

  const draw = (root) => {
    root.classList.remove('is-drawing');
    void root.offsetWidth;
    root.classList.add('is-drawing');
  };

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const close = root.querySelector('.kodza-alert__close');
    const more = root.querySelector('.kodza-alert__more');
    const details = root.querySelector('.kodza-alert__details');
    let busy = false;
    let keyboard = false;
    document.addEventListener('keydown', () => (keyboard = true), { capture: true, signal });
    document.addEventListener('pointerdown', () => (keyboard = false), { capture: true, signal });

    // The scale of a transformed parent, so the gap is read in the alert's own pixels
    const scale = () => root.getBoundingClientRect().height / root.offsetHeight || 1;

    const dismiss = () => {
      if (busy) return;
      busy = true;
      const hadFocus = root.contains(document.activeElement) && keyboard;
      const after = () => {
        if (signal.aborted) return;
        root.getAnimations().forEach((animation) => animation.cancel());
        busy = false;
        // Without it, the icon would play once on showing again, then once more when drawn
        root.classList.remove('is-drawing');
        root.hidden = true;
        root.dispatchEvent(new CustomEvent('kodza:alert-close', { bubbles: true }));
        // Focus goes on to whatever came next, not back to the top of the page
        if (hadFocus) {
          const focusables = [...document.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')];
          focusables.find((el) => root.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING && el.offsetParent)?.focus();
        }
      };
      if (reduceMotion) return after();
      const k = scale();
      const gap = space(root);
      const style = getComputedStyle(root);
      root.animate([
        { opacity: 1, transform: 'none', height: `${root.offsetHeight}px`, paddingTop: style.paddingTop, paddingBottom: style.paddingBottom, [gap.side]: '0px', overflow: 'hidden' },
        { opacity: 0, transform: 'translateX(14px)', offset: 0.35, height: `${root.offsetHeight}px`, paddingTop: style.paddingTop, paddingBottom: style.paddingBottom, [gap.side]: '0px', overflow: 'hidden' },
        { opacity: 0, transform: 'translateX(14px)', height: '0px', paddingTop: '0px', paddingBottom: '0px', [gap.side]: `${-gap.px / k}px`, overflow: 'hidden' },
      ], { duration: 620, easing: fold, fill: 'forwards' }).onfinish = after;
    };

    const unfold = () => {
      if (reduceMotion) return;
      const k = scale();
      const gap = space(root);
      const style = getComputedStyle(root);
      root.animate([
        { opacity: 0, transform: 'translateY(6px)', height: '0px', paddingTop: '0px', paddingBottom: '0px', [gap.side]: `${-gap.px / k}px`, overflow: 'hidden' },
        { opacity: 0, transform: 'translateY(6px)', offset: 0.5, height: `${root.offsetHeight}px`, paddingTop: style.paddingTop, paddingBottom: style.paddingBottom, [gap.side]: '0px', overflow: 'hidden' },
        { opacity: 1, transform: 'none', height: `${root.offsetHeight}px`, paddingTop: style.paddingTop, paddingBottom: style.paddingBottom, [gap.side]: '0px', overflow: 'hidden' },
      ], { duration: 760, easing: ease });
      // Drawn from the start, held empty (CSS delay) until the alert has come in
      draw(root);
    };

    close?.addEventListener('click', dismiss, { signal });
    const observer = new MutationObserver(() => !root.hidden && !busy && unfold());
    observer.observe(root, { attributes: true, attributeFilter: ['hidden'] });
    // A fold still playing on the root (held by fill: forwards) would outlive the restored markup
    signal.addEventListener('abort', () => {
      observer.disconnect();
      root.getAnimations().forEach((animation) => animation.cancel());
    });

    if (more && details) {
      details.id = details.id || `kodza-alert-details-${++uid}`;
      more.setAttribute('aria-controls', details.id);
      more.addEventListener('click', () => {
        const open = more.getAttribute('aria-expanded') !== 'true';
        more.setAttribute('aria-expanded', String(open));
        details.getAnimations().forEach((animation) => animation.cancel());
        const from = details.hidden ? 0 : details.offsetHeight;
        details.hidden = false;
        const to = open ? details.offsetHeight : 0;
        if (reduceMotion) return (details.hidden = !open);
        details.animate([
          { height: `${from}px`, opacity: open ? 0 : 1 },
          { height: `${to}px`, opacity: open ? 1 : 0 },
        ], { duration: open ? 520 : 420, easing: open ? ease : fold }).onfinish = () => (details.hidden = !open);
      }, { signal });
    }
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
