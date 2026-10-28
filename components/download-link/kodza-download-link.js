// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Download Link
// Reads the file's weight on the file itself (one HEAD request, same site only, once per file for
// the whole page) and rolls it in if the link said otherwise. A click sends the arrow through its
// tray and back from the top. An empty root (<div data-kodza-download-link></div>, a Custom HTML
// block in WordPress) dresses the File blocks of the article around or beside it (data-target).
(() => {
  const SELECTOR = '[data-kodza-download-link]';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte'];
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const sizes = new Map();

  // The icon, written once and copied for each File block
  const ICON = '<span class="kodza-download-link__icon" aria-hidden="true"><svg viewBox="0 0 16 16" focusable="false"><path class="kodza-download-link__tray" d="M2.75 10.5v1.75c0 .69.56 1.25 1.25 1.25h8c.69 0 1.25-.56 1.25-1.25V10.5" /><g class="kodza-download-link__arrow"><path d="M8 2.5v7.25" /><path d="M4.75 6.5 8 9.75l3.25-3.25" /></g></svg></span>';
  const META = '<span class="kodza-download-link__meta"><span class="kodza-download-link__type"></span> <span class="kodza-download-link__size"></span></span>';

  // "PDF" from the file's extension, or from its media type when the address has none
  const typeOf = (url, mime = '') => {
    const ext = url.pathname.match(/\.([a-z0-9]{2,5})$/i)?.[1];
    if (ext) return ext.toUpperCase();
    const sub = mime.split(';')[0].split('/')[1] || '';
    return sub.length <= 5 ? sub.toUpperCase() : '';
  };

  // "4.3 MB" in English, "4,3 Mo" on a French page
  const sizeOf = (bytes, lang) => {
    let n = bytes;
    let i = 0;
    while (n >= 1000 && i < UNITS.length - 1) { n /= 1000; i += 1; }
    const options = { style: 'unit', unit: UNITS[i], unitDisplay: 'short', maximumFractionDigits: i && n < 10 ? 1 : 0 };
    try { return new Intl.NumberFormat(lang, options).format(n); } catch { return new Intl.NumberFormat('en', options).format(n); }
  };

  // One HEAD request per file. Not the site's page answering for a missing file, not a compressed length
  const weigh = (url) => {
    if (!sizes.has(url.href)) {
      sizes.set(url.href, fetch(url.href, { method: 'HEAD', cache: 'no-cache' }).then((res) => {
        const mime = res.headers.get('content-type') || '';
        const bytes = Number(res.headers.get('content-length'));
        const packed = !/^(identity)?$/i.test(res.headers.get('content-encoding') || '');
        const page = /^text\/html/i.test(mime) && !/\.html?$/i.test(url.pathname);
        return res.ok && bytes > 0 && !packed && !page ? { bytes, mime } : null;
      }).catch(() => null));
    }
    return sizes.get(url.href);
  };

  // The old text goes up out of its mask while the new one comes up from below, the width
  // following from one to the other
  const roll = (el, text, signal) => {
    const before = el.textContent;
    if (before === text) return;
    if (reduceMotion || !el.parentElement?.offsetParent) { el.textContent = text; return; }
    const from = before ? el.offsetWidth : 0;
    const was = document.createElement('span');
    was.className = 'kodza-download-link__was';
    was.setAttribute('aria-hidden', 'true');
    was.textContent = before;
    const now = document.createElement('span');
    now.className = 'kodza-download-link__now';
    now.textContent = text;
    el.replaceChildren(now);
    const to = el.offsetWidth;
    const pad = getComputedStyle(el).paddingInlineStart;
    if (before) el.prepend(was);
    el.classList.add('is-rolling');
    const timing = { duration: 460, easing: EASE };
    const moves = [
      now.animate([{ transform: 'translateY(100%)' }, { transform: 'none' }], timing),
      el.animate(before
        ? [{ width: `${from}px` }, { width: `${to}px` }]
        : [{ width: '0px', paddingInlineStart: '0px' }, { width: `${to}px`, paddingInlineStart: pad }], timing),
    ];
    if (before) moves.push(was.animate([{ transform: 'none' }, { transform: 'translateY(-100%)' }], timing));
    signal.addEventListener('abort', () => moves.forEach((move) => move.cancel()), { once: true });
    moves[0].finished.then(() => {
      el.classList.remove('is-rolling');
      el.textContent = text;
    }, () => {});
  };

  // One link: its type from the address, its weight from the file, its arrow on a click
  const dress = (link, signal, watcher) => {
    const type = link.querySelector('.kodza-download-link__type');
    const size = link.querySelector('.kodza-download-link__size');
    const arrow = link.querySelector('.kodza-download-link__arrow');
    const tray = link.querySelector('.kodza-download-link__tray');
    let url;
    try { url = new URL(link.href, location.href); } catch { return; }
    if (type && !type.textContent.trim()) type.textContent = typeOf(url);

    let moves = [];
    link.addEventListener('click', () => {
      if (reduceMotion || !arrow) return;
      moves.forEach((move) => move.cancel());
      // Down and faster into the tray, out through its floor, then back in from the top
      moves = [
        arrow.animate([
          { transform: 'none', easing: 'cubic-bezier(0.55, 0, 1, 0.45)' },
          { transform: 'translateY(15px)', offset: 0.4 },
          { transform: 'translateY(-15px)', offset: 0.4, easing: EASE },
          { transform: 'none' },
        ], { duration: 720 }),
        tray?.animate([
          { transform: 'none', easing: 'cubic-bezier(0.65, 0, 0.35, 1)' },
          { transform: 'translateY(1.25px)', offset: 0.38, easing: EASE },
          { transform: 'none' },
        ], { duration: 720 }),
      ].filter(Boolean);
    }, { signal });

    // Same site only (the browser would not say, nor save under another site's name), never the page itself
    const local = /^https?:$/.test(url.protocol) && url.origin === location.origin && url.pathname !== location.pathname;
    if (!size || !local) return;
    const lang = link.closest('[lang]')?.lang || 'en';
    watcher.add(link, () => weigh(url).then((file) => {
      if (!file || signal.aborted) return;
      if (type && !type.textContent.trim()) type.textContent = typeOf(url, file.mime);
      roll(size, sizeOf(file.bytes, lang), signal);
    }));
  };

  // The weight is asked for when the link comes near the screen, not for every file of the page at once
  const watch = (signal) => {
    const calls = new Map();
    const observer = new IntersectionObserver((entries) => entries.forEach(({ isIntersecting, target }) => {
      if (!isIntersecting) return;
      observer.unobserve(target);
      calls.get(target)?.();
    }), { rootMargin: '200px' });
    signal.addEventListener('abort', () => observer.disconnect(), { once: true });
    return { add: (link, call) => { calls.set(link, call); observer.observe(link); } };
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const watcher = watch(signal);
    if (root.matches('a[href]')) { dress(root, signal, watcher); return; }

    // An empty root: the File blocks of its article, their file name made the link, the button hidden
    const selector = root.dataset.target || 'article, main, .entry-content';
    let scope = root.parentElement?.closest(selector);
    for (let up = root.parentElement; !scope && up; up = up.parentElement) scope = up.querySelector(selector);
    if (!scope) return;
    scope.querySelectorAll('.wp-block-file').forEach((block) => {
      if (block.parentElement.closest('[class*="kodza-"]')) return;
      const button = block.querySelector('a.wp-block-file__button');
      const link = block.querySelector('a[href]:not(.wp-block-file__button)') || button;
      if (!link || link.classList.contains('kodza-download-link')) return;
      const saved = { html: link.innerHTML, className: link.getAttribute('class'), download: link.getAttribute('download'), hidden: button?.hidden };
      const label = document.createElement('span');
      label.className = 'kodza-download-link__label';
      label.append(...link.childNodes);
      link.replaceChildren(label);
      // The spaces keep the words apart for a screen reader; the flex layout ignores them
      link.insertAdjacentHTML('afterbegin', `${ICON} `);
      link.insertAdjacentHTML('beforeend', ` ${META}`);
      link.classList.add('kodza-download-link');
      if (button?.hasAttribute('download') && !link.hasAttribute('download')) link.setAttribute('download', button.getAttribute('download'));
      if (button && button !== link) button.hidden = true;
      dress(link, signal, watcher);
      signal.addEventListener('abort', () => {
        link.innerHTML = saved.html;
        if (saved.className === null) link.removeAttribute('class');
        else link.setAttribute('class', saved.className);
        if (saved.download === null) link.removeAttribute('download');
        if (button && button !== link) button.hidden = saved.hidden;
      }, { once: true });
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
