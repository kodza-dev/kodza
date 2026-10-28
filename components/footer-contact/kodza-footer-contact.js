// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Footer Contact
// Sets the address across the whole width of the footer, ink edge to ink edge (measured like
// Footer Wordmark, again when the width or the font changes), copies it on a click (the line under
// it rolls to its data-copied words, then back), keeps the local time of data-timezone to the
// minute (the minutes roll) and writes the year of the ©. A copy fires "kodza:copy" with
// { text, ok }.
(() => {
  const SELECTOR = '.kodza-footer-contact';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const REF = 100; // the size the address is measured at, in px
  const VARS = ['size', 'height', 'lift', 'shift'].map((name) => `--kz-footer-contact-${name}`);
  const ICONS = {
    copy: '<rect x="5.5" y="5.5" width="8" height="8" rx="1.5" /><path d="M10.5 3.5v-.5A1.5 1.5 0 0 0 9 1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5" />',
    tick: '<path d="M3 8.5l3.2 3L13 4.5" />',
  };

  // The ink of one glyph at the reference size, from its origin: where it starts and ends, how
  // far it rises above the baseline and drops below it
  let context;
  const ink = (char, font) => {
    context ||= document.createElement('canvas').getContext('2d');
    context.font = font;
    const m = context.measureText(char);
    return { left: -m.actualBoundingBoxLeft, right: m.actualBoundingBoxRight, ascent: m.actualBoundingBoxAscent, descent: Math.max(0, m.actualBoundingBoxDescent) };
  };

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

  // A line rolls into its box: the old one leaves upwards, the new one rises from below, and the
  // box eases to its new width instead of jumping
  const line = (text, icon) => {
    const span = document.createElement('span');
    span.textContent = text;
    span.dataset.icon = icon || '';
    if (icon) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 16 16');
      svg.setAttribute('aria-hidden', 'true');
      svg.innerHTML = ICONS[icon];
      span.prepend(svg);
    }
    return span;
  };
  const roll = (box, text, icon) => {
    const prev = box.lastElementChild;
    if (!prev || (prev.textContent === text && prev.dataset.icon === (icon || ''))) return;
    const from = box.offsetWidth;
    const span = line(text, icon);
    box.append(span);
    if (reduceMotion) return prev.remove();
    const to = span.offsetWidth;
    const timing = { duration: 450, easing: EASE };
    prev.setAttribute('aria-hidden', 'true');
    box.animate([{ width: `${from}px` }, { width: `${to}px` }], { ...timing, fill: 'backwards' });
    prev.animate([{ transform: 'none' }, { transform: 'translateY(-110%)' }], { ...timing, fill: 'forwards' }).finished.then(() => prev.remove(), () => {});
    span.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], { ...timing, fill: 'backwards' });
  };

  // The time at the place, as "14:32" and "CET", in the visitor's zone if data-timezone is wrong
  const zoned = (zone, options) => {
    try {
      return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: zone || undefined });
    } catch {
      return new Intl.DateTimeFormat('en-GB', options);
    }
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const q = (s) => root.querySelector(s);
    root.querySelectorAll('.kodza-footer-contact__year').forEach((el) => {
      el.textContent = String(new Date().getFullYear());
    });

    // ---------- The address, at the width of the footer ----------
    const box = q('.kodza-footer-contact__address');
    const text = q('.kodza-footer-contact__ink');
    if (box && text) {
      const address = text.textContent.trim();
      const base = document.createElement('span');
      base.className = 'kodza-footer-contact__base-line';
      text.replaceChildren(address, base);
      const glyph = (i) => {
        const range = document.createRange();
        range.setStart(text.firstChild, i);
        range.setEnd(text.firstChild, i + 1);
        return range.getBoundingClientRect();
      };

      // Measured at the reference size, then scaled: the ink of the first letter on the left
      // edge, the last one on the right edge, the box from the top of the ink to its bottom.
      // Screen pixels are divided by the scale of a parent that would be zoomed by a transform
      let width = 0;
      const fit = () => {
        const w = box.clientWidth;
        if (!w || !address) return;
        width = w;
        VARS.forEach((v) => box.style.removeProperty(v));
        box.style.setProperty(VARS[0], `${REF}px`);
        const style = getComputedStyle(box);
        const font = `${style.fontStyle} ${style.fontWeight} ${REF}px ${style.fontFamily}`;
        const chars = [...address];
        const marks = chars.map((char) => ink(char, font));
        const scale = box.getBoundingClientRect().width / box.offsetWidth || 1;
        const row = text.getBoundingClientRect();
        const left = (glyph(0).left - row.left) / scale + marks[0].left;
        const right = (glyph(address.length - 1).left - row.left) / scale + marks.at(-1).right;
        const baseline = (base.getBoundingClientRect().top - row.top) / scale;
        const top = baseline - Math.max(...marks.map((m) => m.ascent));
        const bottom = baseline + Math.max(...marks.map((m) => m.descent));
        const k = w / (right - left);
        [REF, bottom - top, top, left].forEach((value, i) => box.style.setProperty(VARS[i], `${value * k}px`));
        // The line's ascent is rounded to whole pixels at each size: the baseline is read again at
        // the final size, so the top of the ink lands on the top of the box
        const final = (base.getBoundingClientRect().top - text.getBoundingClientRect().top) / scale;
        box.style.setProperty(VARS[2], `${final - (baseline - top) * k}px`);
      };

      // A new width refits on the next frame, outside the observer
      let frame = 0;
      const observer = new ResizeObserver(() => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          if (box.clientWidth !== width) fit();
        });
      });
      observer.observe(box);
      document.fonts?.addEventListener('loadingdone', fit, { signal });
      signal.addEventListener('abort', () => {
        observer.disconnect();
        cancelAnimationFrame(frame);
      });
      fit();
      document.fonts?.ready.then(() => !signal.aborted && fit());
    }

    // ---------- The copy ----------
    const email = q('.kodza-footer-contact__email');
    const said = q('.kodza-footer-contact__said');
    if (email && said) {
      const idle = said.textContent.trim();
      said.replaceChildren(line(idle, 'copy'));
      let timer = 0;
      email.addEventListener('click', async () => {
        const value = email.dataset.copy || text?.textContent.trim() || '';
        const ok = await writeText(value);
        if (signal.aborted) return;
        clearTimeout(timer);
        root.classList.toggle('is-copied', ok);
        roll(said, ok ? said.dataset.copied || 'Copied.' : said.dataset.failed || 'Copy failed.', ok ? 'tick' : '');
        root.dispatchEvent(new CustomEvent('kodza:copy', { bubbles: true, detail: { text: value, ok } }));
        timer = setTimeout(() => {
          root.classList.remove('is-copied');
          roll(said, idle, 'copy');
        }, ok ? 2400 : 4000);
      }, { signal });
      signal.addEventListener('abort', () => clearTimeout(timer));
    }

    // ---------- The local time, every minute on the minute ----------
    const time = q('.kodza-footer-contact__time');
    const zone = q('.kodza-footer-contact__zone');
    if (time) {
      let clock;
      let label;
      const read = () => {
        clock = zoned(root.dataset.timezone, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
        label = zoned(root.dataset.timezone, { hour: '2-digit', timeZoneName: 'short' });
      };
      const update = (moving) => {
        const now = new Date();
        const hhmm = clock.format(now);
        if (moving) roll(time, hhmm);
        else time.replaceChildren(line(hhmm));
        if (zone) zone.textContent = label.formatToParts(now).find((p) => p.type === 'timeZoneName')?.value || zone.textContent;
      };
      read();
      update(false);
      let timer = 0;
      const tick = () => {
        update(true);
        timer = setTimeout(tick, 60000 - (Date.now() % 60000) + 50);
      };
      timer = setTimeout(tick, 60000 - (Date.now() % 60000) + 50);
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) update(true);
      }, { signal });
      const watch = new MutationObserver(() => {
        read();
        update(true);
      });
      watch.observe(root, { attributes: true, attributeFilter: ['data-timezone'] });
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        watch.disconnect();
      });
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
