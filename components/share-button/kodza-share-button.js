// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Share Button
// Opens and closes the options (click, Enter, Space; Escape, a click outside or Tab away close
// them), glides the tint and the label from option to option (pointer or arrows), fills each
// link with the page's URL and title ({url} and {title} in its href; data-url and data-title on
// the root to pick others), opens X and LinkedIn in a small window, and copies the link with a
// check and "Link copied" (data-copied for other words). Every share fires "kodza:share" with
// { network, url } on the root, for your analytics.
(() => {
  const SELECTOR = '.kodza-share';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const RESET_AFTER = 1800;

  async function writeText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Older browsers, pages served over http
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
      document.body.append(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    }
  }

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const toggle = root.querySelector('.kodza-share__toggle');
    const list = root.querySelector('.kodza-share__options');
    if (!toggle || !list) return;
    const options = [...list.querySelectorAll('.kodza-share__option')];
    const status = root.querySelector('.kodza-share__status');
    const templates = new Map(options.filter((o) => o.matches('a[href]')).map((a) => [a, a.getAttribute('href')]));
    options.forEach((option, i) => option.style.setProperty('--kz-share-i', i));

    const tint = Object.assign(document.createElement('span'), { className: 'kodza-share__tint' });
    tint.setAttribute('aria-hidden', 'true');
    root.prepend(tint);
    // The label above the options says what each one does (screen readers have the aria-label)
    const tip = Object.assign(document.createElement('span'), { className: 'kodza-share__tip' });
    tip.setAttribute('aria-hidden', 'true');
    const words = Object.assign(document.createElement('span'), { className: 'kodza-share__words' });
    tip.append(words);
    root.append(tip);

    const isOpen = () => root.classList.contains('is-open');
    const nameOf = (option) => option.getAttribute('aria-label') || option.textContent.trim();
    const timers = new Set();
    const later = (fn, ms) => {
      const id = setTimeout(() => {
        timers.delete(id);
        if (!signal.aborted) fn();
      }, ms);
      timers.add(id);
      return id;
    };
    signal.addEventListener('abort', () => timers.forEach(clearTimeout));

    // The page being shared, read when needed: an Ajax theme changes it without a page load
    const page = () => ({
      url: root.dataset.url || document.querySelector('link[rel="canonical"]')?.href || location.href,
      title: root.dataset.title || document.querySelector('meta[property="og:title"]')?.content || document.title,
    });
    const fill = () => {
      const { url, title } = page();
      templates.forEach((template, link) => {
        link.href = template.replace(/\{url\}/g, encodeURIComponent(url)).replace(/\{title\}/g, encodeURIComponent(title));
      });
    };

    // Positions are read on screen, divided by the button's scale (a parent enlarged by
    // transform), so they follow an option still sliding into place
    const measure = (target) => {
      const r = root.getBoundingClientRect();
      const t = target.getBoundingClientRect();
      const k = r.width / root.offsetWidth || 1;
      return { left: (t.left - r.left) / k, width: t.width / k };
    };

    // The tint: placed at once the first time, then it glides (edges from its own box, inside
    // the padding of the pill)
    let tinted = null;
    const placeTint = () => {
      const { left, width } = measure(tinted);
      root.style.setProperty('--kz-share-tint-l', `${left - tint.offsetLeft}px`);
      root.style.setProperty('--kz-share-tint-w', `${width}px`);
    };
    const tintOn = (target) => {
      const first = !tinted;
      tinted = target;
      placeTint();
      if (first) {
        root.classList.remove('is-gliding');
        void getComputedStyle(tint).clipPath;
        root.classList.add('is-gliding');
      }
      root.style.setProperty('--kz-share-tint-on', 1);
    };
    const tintOff = () => {
      root.style.setProperty('--kz-share-tint-on', 0);
      tinted = null;
    };

    // The label: above an option, it glides to the next one and its words slide along (the
    // way Tooltip does it); on the same option, new words roll up
    let tipped = null;
    let copiedTimer = 0;
    const write = (text, dir) => {
      const prev = words.lastElementChild;
      if (prev && prev.textContent === text) return;
      const span = Object.assign(document.createElement('span'), { textContent: text });
      words.append(span);
      if (!prev) return;
      if (!dir || reduceMotion) return prev.remove();
      // The leaving words step out of the flow: the bubble takes the size of the new ones, and
      // both slide right through its edge, the way the bubble goes
      const before = prev.offsetWidth;
      prev.classList.add('is-leaving');
      const after = span.offsetWidth;
      const timing = { duration: 260, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
      const away = dir === 'up' ? 'translate(-50%, -100%)' : `translateX(calc(-50% - ${dir * ((before + after) / 2 + 2)}px))`;
      const from = dir === 'up' ? 'translateY(100%)' : `translateX(${dir * (after + 2)}px)`;
      const done = () => prev.remove();
      prev.animate([{ transform: 'translateX(-50%)', opacity: 1 }, { transform: away, opacity: 0 }], { ...timing, fill: 'forwards' }).finished.then(done, done);
      span.animate([{ transform: from, opacity: 0 }, { transform: 'none', opacity: 1 }], timing);
    };
    const placeTip = () => {
      const { left, width } = measure(tipped);
      tip.style.setProperty('--kz-share-tip-x', `${left + width / 2}px`);
    };
    const textOf = (option) => (option.classList.contains('is-copied') ? option.dataset.copied || 'Link copied' : nameOf(option));
    const tipOn = (option, text = textOf(option)) => {
      const wasOn = tip.classList.contains('is-on');
      write(text, !wasOn ? 0 : tipped === option ? 'up' : Math.sign(options.indexOf(option) - options.indexOf(tipped)));
      tipped = option;
      if (wasOn) {
        tip.classList.add('is-gliding');
        placeTip();
      } else {
        // Appearing: straight above the option, it only rises into place
        tip.style.transition = 'none';
        placeTip();
        void tip.offsetWidth;
        tip.style.transition = '';
        tip.classList.add('is-on');
      }
    };
    const tipOff = () => {
      tip.classList.remove('is-on', 'is-gliding');
      tipped = null;
    };

    // Under the pointer: the tint, and the label for an option. While the button opens, the
    // options slide in under a pointer that has not moved: they wait until it has settled
    let pointer = 'mouse';
    let moving = false;
    // Where the pointer clicked to open it, until it moves away: what slid under it meanwhile is
    // not a target, and a second click there closes it (it would otherwise share by mistake)
    let rest = null;
    const resting = (event) => rest && event.detail > 0 && Math.hypot(event.clientX - rest.x, event.clientY - rest.y) < 6;
    const hover = (target) => {
      if (pointer === 'touch' || ((moving || rest) && target !== toggle)) return;
      tintOn(target);
      if (target !== toggle) tipOn(target);
      else if (tipped && !tipped.matches(':focus-visible')) tipOff();
    };
    const settle = () => {
      if (rest) return;
      const under =(isOpen() ? [toggle, ...options] : [toggle]).find((target) => target.matches(':hover'));
      if (under && under !== tinted) hover(under);
    };

    // The button eases from one width to the other, Share closing down to its cross while the
    // options open, on the timing of the options' slide (CSS): the last one rides the edge.
    // While it moves, the tint and the label stay on what they sit on, frame by frame
    const duration = () => {
      const value = getComputedStyle(root).getPropertyValue('--kz-share-duration').trim();
      return parseFloat(value) * (value.endsWith('ms') ? 1 : 1000) || 600;
    };
    let resizing = [];
    let follow = 0;
    const swap = (opened) => {
      const from = [toggle.offsetWidth, list.offsetWidth];
      resizing.forEach((animation) => animation.cancel());
      cancelAnimationFrame(follow);
      root.classList.toggle('is-open', opened);
      toggle.setAttribute('aria-expanded', String(opened));
      if (tinted && tinted !== toggle) tintOff();
      if (!opened) tipOff();
      if (reduceMotion) return settle();
      const easing = getComputedStyle(root).getPropertyValue('--kz-share-unfold').trim() || 'ease-in-out';
      resizing = [toggle, list].map((el, i) => el.animate([{ width: `${from[i]}px` }, { width: `${el.offsetWidth}px` }], { duration: duration(), easing }));
      moving = true;
      root.classList.add('is-moving');
      const step = () => {
        if (signal.aborted) return;
        if (tinted) placeTint();
        if (tipped) placeTip();
        if (resizing.some((animation) => animation.playState === 'running')) {
          follow = requestAnimationFrame(step);
          return;
        }
        moving = false;
        root.classList.remove('is-moving');
        settle();
      };
      follow = requestAnimationFrame(step);
    };
    signal.addEventListener('abort', () => {
      resizing.forEach((animation) => animation.cancel());
      cancelAnimationFrame(follow);
    });

    const open = () => {
      if (isOpen()) return;
      fill();
      swap(true);
    };
    const close = (refocus = false) => {
      if (!isOpen()) return;
      rest = null;
      if (refocus || list.contains(document.activeElement)) toggle.focus({ preventScroll: true });
      swap(false);
    };

    toggle.addEventListener('click', (event) => {
      if (isOpen()) return close();
      rest = event.detail > 0 ? { x: event.clientX, y: event.clientY } : null;
      open();
    }, { signal });
    root.addEventListener('pointermove', (event) => {
      if (!rest || Math.hypot(event.clientX - rest.x, event.clientY - rest.y) < 6) return;
      rest = null;
      if (!moving) settle();
    }, { signal });

    [toggle, ...options].forEach((target) => target.addEventListener('pointerenter', (event) => {
      pointer = event.pointerType;
      hover(target);
    }, { signal }));
    root.addEventListener('pointerleave', () => {
      tintOff();
      if (tipped && !tipped.matches(':focus-visible') && !tipped.classList.contains('is-copied')) tipOff();
    }, { signal });

    // Keyboard focus shows the label too, and the arrows go from option to option
    options.forEach((option) => {
      option.addEventListener('focus', () => option.matches(':focus-visible') && tipOn(option), { signal });
      option.addEventListener('blur', () => tipped === option && !option.matches(':hover') && !option.classList.contains('is-copied') && tipOff(), { signal });
    });
    root.addEventListener('keydown', (event) => {
      const stops = [toggle, ...options];
      const index = stops.indexOf(document.activeElement);
      const moves = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: stops.length - 1 };
      if (!isOpen() || index < 0 || !(event.key in moves)) return;
      event.preventDefault();
      stops[Math.max(0, Math.min(stops.length - 1, moves[event.key]))].focus();
    }, { signal });

    // Escape closes it wherever the focus is: opened with a click, it stays on Share (Chrome)
    // or on the page (Safari)
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !isOpen()) return;
      event.preventDefault();
      close(true);
    }, { signal });

    // Out of the button (a click elsewhere, Tab away), it closes. Checked once the focus has
    // landed: a window that takes the focus (the share window) leaves it inside, and a click on
    // an option does not count (Safari gives buttons no focus on click)
    let pressing = false;
    root.addEventListener('pointerdown', (event) => {
      pointer = event.pointerType;
      pressing = true;
    }, { signal });
    document.addEventListener('pointerup', () => later(() => (pressing = false), 0), { signal });
    document.addEventListener('pointerdown', (event) => {
      if (isOpen() && !root.contains(event.target)) close();
    }, { signal });
    root.addEventListener('focusout', () => {
      later(() => isOpen() && !pressing && document.hasFocus() && !root.contains(document.activeElement) && close(), 0);
    }, { signal });

    const share = (network, url) => root.dispatchEvent(new CustomEvent('kodza:share', { detail: { network, url }, bubbles: true }));

    options.forEach((option) => {
      const network = option.dataset.share || 'link';
      if (network === 'copy') {
        option.addEventListener('click', async (event) => {
          if (resting(event)) return close();
          const { url } = page();
          const ok = await writeText(url);
          if (signal.aborted) return;
          clearTimeout(copiedTimer);
          option.classList.toggle('is-copied', ok);
          const text = ok ? option.dataset.copied || 'Link copied' : "Couldn't copy. Use the address bar";
          if (status) status.textContent = text;
          if (pointer !== 'touch') tintOn(option);
          tipOn(option, text);
          if (ok) share('copy', url);
          copiedTimer = later(() => {
            option.classList.remove('is-copied');
            if (status) status.textContent = '';
            if (tipped !== option) return;
            if (option.matches(':hover, :focus-visible')) tipOn(option);
            else tipOff();
          }, RESET_AFTER);
        }, { signal });
        return;
      }
      option.addEventListener('click', (event) => {
        if (resting(event)) {
          event.preventDefault();
          return close();
        }
        fill();
        share(network, page().url);
        // X and LinkedIn in a small window over the page; a modified click (new tab) is left alone
        if (!option.matches('a[target="_blank"]') || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const width = 600;
        const height = 620;
        const left = Math.round(screenX + (outerWidth - width) / 2);
        const top = Math.round(screenY + (outerHeight - height) / 3);
        const win = window.open(option.href, 'kodza-share', `popup,width=${width},height=${height},left=${left},top=${top}`);
        if (!win) return; // blocked: the link opens a tab instead
        win.opener = null;
        event.preventDefault();
      }, { signal });
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
