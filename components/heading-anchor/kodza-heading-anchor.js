// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Heading Anchor
// Gives every heading a link to itself: a # in the margin (after the last word on a touch screen,
// in a narrow column or a centred heading) that puts the section's address in the bar and copies it.
// With a mouse, a click on the heading does the same.
// Headings without an id get one, removed again when the script stops. An empty root works on the
// headings of the article around or beside it (data-target), like a Custom HTML block in WordPress.
(() => {
  const SELECTOR = '[data-kodza-heading-anchor]';
  const RESET_AFTER = 1800;
  const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  // One link, written once and copied for each heading
  const MARK = document.createElement('template');
  MARK.innerHTML = '<a class="kodza-heading-anchor__link"><span class="kodza-heading-anchor__glyph" aria-hidden="true"><span class="kodza-heading-anchor__hash">#</span><svg class="kodza-heading-anchor__check" viewBox="0 0 16 16"><path d="M3 8.5l3.2 3L13 4.5" pathLength="1" /></svg></span><span class="kodza-heading-anchor__label" aria-hidden="true"><span class="kodza-heading-anchor__word"></span></span></a>';

  const slug = (text) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';

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

  // The bottom of what stays at the top of the window (a fixed or sticky header): a section reached
  // by its link starts below it, not under it
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

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const which = root.dataset.headings || 'h2, h3';
    let scope = root;
    let headings = [...root.querySelectorAll(which)];
    if (!headings.length) {
      const selector = root.dataset.target || 'article, main, .entry-content';
      scope = root.parentElement?.closest(selector);
      for (let up = root.parentElement; !scope && up; up = up.parentElement) scope = up.querySelector(selector);
      headings = scope ? [...scope.querySelectorAll(which)] : [];
    }
    // Not the headings of another component, nor those that already hold a link
    headings = headings.filter((heading) => {
      const owner = heading.parentElement.closest('[class*="kodza-"]');
      return /^H[1-6]$/.test(heading.tagName) && heading.textContent.trim() && (!owner || owner === root)
        && !heading.querySelector('a[href]') && !heading.closest('a[href]');
    });
    if (!headings.length) return;

    const label = root.dataset.label || 'Copy link';
    const copied = root.dataset.copied || 'Link copied';
    const failed = root.dataset.failed || 'In the address bar';
    const status = document.createElement('span');
    status.className = 'kodza-heading-anchor__status';
    status.setAttribute('role', 'status');
    root.append(status);

    const items = headings.map((heading) => {
      const item = { heading, named: !heading.id, timer: 0 };
      if (item.named) {
        let id = slug(heading.textContent);
        for (let n = 2; document.getElementById(id); n++) id = `${slug(heading.textContent)}-${n}`;
        heading.id = id;
      }
      const link = MARK.content.firstElementChild.cloneNode(true);
      link.href = `#${heading.id}`;
      link.setAttribute('aria-label', label);
      item.link = link;
      item.hash = link.querySelector('.kodza-heading-anchor__hash');
      item.word = link.querySelector('.kodza-heading-anchor__word');
      item.text = link.querySelector('.kodza-heading-anchor__label');
      // The mark never starts a line on its own: it is tied to the last word
      const last = heading.lastChild;
      if (last?.nodeType === Node.TEXT_NODE && /\S\s*$/.test(last.data)) {
        const at = last.data.search(/\S+\s*$/);
        const word = at > 0 ? last.splitText(at) : last;
        const end = word.data.search(/\s*$/);
        if (end < word.data.length) word.splitText(end);
        item.tie = document.createElement('span');
        item.tie.className = 'kodza-heading-anchor__tie';
        word.before(item.tie);
        item.tie.append(word, link);
      } else {
        heading.append(link);
      }
      const style = getComputedStyle(heading);
      item.style = { position: heading.style.position, scroll: heading.style.scrollMarginTop };
      item.ownScroll = parseFloat(style.scrollMarginTop) > 0;
      if (style.position === 'static') heading.style.position = 'relative';
      return item;
    });

    // In the margin on a real pointer, when every heading has room on its start side and starts its
    // lines there; after the last word otherwise. The scroll margin follows the header.
    const layout = () => {
      if (!root.isConnected) return;
      const width = document.documentElement.clientWidth;
      const was = items.map(({ link, heading }) => {
        link.style.setProperty('--kz-heading-anchor-top', getComputedStyle(heading).paddingTop);
        const on = link.classList.contains('is-margin');
        link.classList.add('is-margin');
        return on;
      });
      const margin = pointer.matches && items.every(({ heading, link }) => {
        const style = getComputedStyle(heading);
        const ltr = style.direction !== 'rtl';
        if (!['start', 'justify', ltr ? 'left' : 'right'].includes(style.textAlign)) return false;
        const rect = link.getBoundingClientRect();
        return ltr ? rect.left >= 8 : rect.right <= width - 8;
      });
      // A mark that changes side gets there without sliding
      items.forEach(({ link, hash }, i) => {
        if (!margin) link.classList.remove('is-margin');
        if (was[i] !== margin) hash.getAnimations().forEach((animation) => animation.finish());
      });
      const padded = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) > 0;
      const offset = parseFloat(getComputedStyle(items[0].link).getPropertyValue('--kz-heading-anchor-offset')) || 24;
      const top = padded ? 0 : Math.round(headerBottom() + offset);
      items.forEach(({ heading, ownScroll }) => {
        if (!ownScroll && !padded) heading.style.scrollMarginTop = `${top}px`;
      });
    };

    // Beside the mark on the side away from the text when it fits, above it otherwise
    const show = (item, ok) => {
      const { link, word, text, heading } = item;
      clearTimeout(item.timer);
      word.textContent = ok ? copied : failed;
      link.classList.remove('is-above');
      const ltr = getComputedStyle(heading).direction !== 'rtl';
      const mark = link.getBoundingClientRect();
      const room = text.getBoundingClientRect().width + 12;
      const box = heading.getBoundingClientRect();
      const fits = link.classList.contains('is-margin')
        ? (ltr ? mark.left - room >= 8 : mark.right + room <= document.documentElement.clientWidth - 8)
        : (ltr ? mark.right + room <= box.right : mark.left - room >= box.left);
      link.classList.toggle('is-above', !fits);
      text.getAnimations({ subtree: true }).forEach((animation) => animation.finish()); // it changes side without sliding
      link.classList.add('is-copied');
      status.textContent = ok ? copied : `Couldn't copy. The link is ${failed.toLowerCase()}.`;
      item.timer = setTimeout(() => {
        link.classList.remove('is-copied');
        status.textContent = '';
      }, RESET_AFTER);
    };

    const copy = async (item) => {
      history.replaceState(history.state, '', `#${item.heading.id}`);
      const ok = await writeText(location.href);
      if (!signal.aborted) show(item, ok);
    };
    const plain = (event) => !event.button && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

    items.forEach((item) => {
      item.link.addEventListener('click', (event) => {
        if (!plain(event)) return; // a new tab, a new window
        event.preventDefault();
        copy(item);
      }, { signal });
      // With a mouse, the heading itself does what its mark does: not while its words are being
      // selected, nor from a control written in it
      item.heading.addEventListener('click', (event) => {
        if (!pointer.matches || !plain(event) || event.defaultPrevented) return;
        if (event.target.closest('a, button, input, select, textarea, label, summary')) return;
        if (getSelection()?.toString().trim()) return;
        copy(item);
      }, { signal });
    });

    let frame = 0;
    const later = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(layout);
    };
    const observer = new ResizeObserver(later);
    layout();
    observer.observe(scope);
    window.addEventListener('resize', later, { signal });
    pointer.addEventListener('change', later, { signal });
    document.fonts?.ready.then(() => {
      if (!signal.aborted) layout();
    });

    // Arriving on a section named here: the browser looked for it before it had its id
    let target = null;
    try {
      target = items.find(({ heading, named }) => named && `#${heading.id}` === decodeURIComponent(location.hash));
    } catch {}
    if (target) target.heading.scrollIntoView({ block: 'start' });

    signal.addEventListener('abort', () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      status.remove();
      items.forEach((item) => {
        clearTimeout(item.timer);
        const { heading, link, tie } = item;
        link.remove();
        if (tie) {
          tie.replaceWith(...tie.childNodes);
          heading.normalize();
        }
        heading.style.position = item.style.position;
        heading.style.scrollMarginTop = item.style.scroll;
        if (!heading.getAttribute('style')) heading.removeAttribute('style');
        if (item.named) heading.removeAttribute('id');
      });
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
