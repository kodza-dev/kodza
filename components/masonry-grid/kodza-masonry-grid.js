// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Masonry Grid
// Places every image in the shortest column, the leftmost when two are level, so the reading
// order survives; glides them to their new places when the column count changes, and brings the
// next ones in, one after another, on Load more. The settings are the constants under SELECTOR.
(() => {
  const SELECTOR = '.kodza-masonry-grid';
  const GLIDE = 700; // ms, each image sliding to its new place when the grid gains or loses a column
  const RISE = 800; // ms, an image coming in
  const STAGGER = 70; // ms between two images coming in, one after another
  const STAGGER_MAX = 12; // past that many, the next ones come in together
  const LIFT = 32; // px an image rises from as it comes in
  const ROLL = 420; // ms, a word or a count rolling to the next one
  const ARRIVE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const MOVE = 'cubic-bezier(0.65, 0, 0.35, 1)';
  // Every text the script writes, in English. Each one can be set per instance with a data-text-*
  // attribute (data-text-done="C'est tout"), {names} stand for the values
  const WORDS = {
    done: "That's all", // the button, once every image is shown
    count: '{shown} / {total}', // next to the button
  };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const fill = (text, values) => text.replace(/\{(\w+)\}/g, (all, name) => (name in values ? values[name] : all));

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const list = root.querySelector('.kodza-masonry-grid__list');
    if (!list) return;
    const footer = root.querySelector('.kodza-masonry-grid__footer');
    const more = root.querySelector('.kodza-masonry-grid__more');
    const label = root.querySelector('.kodza-masonry-grid__label');
    const status = root.querySelector('.kodza-masonry-grid__status');
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const isItem = (el) => el.nodeType === 1 && el.matches('.kodza-masonry-grid__item');
    const items = () => [...list.children].filter(isItem);
    const shown = () => items().filter((li) => !li.hidden);

    const all = items();
    const first = parseInt(root.dataset.show, 10) || all.length;
    const batch = parseInt(root.dataset.batch, 10) || first;
    all.forEach((li, i) => { li.hidden = i >= first; });
    root.classList.add('is-laid');

    const places = new Map(); // li → { x, y, w } where the last layout put it
    let columns = 0;
    let gliding = 0; // while images glide, their changing sizes are not a reason to lay out again
    let glideEnd = 0;
    let frame = 0;

    // The narrowest column, in px: --kz-masonry-grid-column may be written in any unit
    const narrowest = () => {
      const value = getComputedStyle(root).getPropertyValue('--kz-masonry-grid-column').trim();
      if (/^[\d.]+px$/.test(value)) return parseFloat(value);
      const probe = document.createElement('div');
      probe.style.cssText = 'position:absolute;visibility:hidden;height:0;width:var(--kz-masonry-grid-column)';
      list.append(probe);
      const width = probe.offsetWidth;
      probe.remove();
      return width || 150;
    };

    // Works out every place, then puts each image there. `glide` slides the images from where they
    // are now (mid-glide included) to their new places
    const layout = (glide = false) => {
      const visible = shown();
      const width = list.clientWidth;
      const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
      const most = Math.max(1, parseInt(getComputedStyle(root).getPropertyValue('--kz-masonry-grid-columns'), 10) || 4);
      const count = Math.min(most, Math.max(1, Math.floor((width + gap) / (narrowest() + gap))));
      const w = (width - gap * (count - 1)) / count;
      const from = glide ? visible.map((li) => {
        const style = getComputedStyle(li);
        return { transform: style.transform, width: style.width };
      }) : null;
      const before = list.offsetHeight;
      visible.forEach((li) => {
        li.getAnimations().forEach((a) => a.id === 'kodza-glide' && a.cancel());
        li.style.width = `${w}px`;
      });
      const heights = visible.map((li) => li.offsetHeight);
      const tops = new Array(count).fill(0);
      visible.forEach((li, i) => {
        let c = 0;
        for (let j = 1; j < count; j++) if (tops[j] < tops[c] - 1) c = j;
        const place = { x: c * (w + gap), y: tops[c], w };
        tops[c] += heights[i] + gap;
        places.set(li, place);
        li.style.transform = `translate(${place.x}px, ${place.y}px)`;
      });
      const height = visible.length ? Math.max(...tops) - gap : 0;
      list.style.height = `${Math.max(0, height)}px`;
      columns = count;
      if (!glide || still) return before;
      const duration = GLIDE * pace;
      visible.forEach((li, i) => {
        const to = { transform: li.style.transform, width: li.style.width };
        if (from[i].transform === to.transform && from[i].width === to.width) return;
        const a = li.animate([from[i], to], { duration, easing: MOVE });
        a.id = 'kodza-glide';
      });
      growList(before, duration, MOVE);
      gliding = 1;
      clearTimeout(glideEnd);
      glideEnd = setTimeout(() => { gliding = 0; layout(); }, duration + 40);
      return before;
    };

    const growList = (before, duration, easing) => {
      if (still) return;
      list.getAnimations().forEach((a) => a.cancel());
      const after = list.style.height;
      if (`${before}px` !== after) list.animate([{ height: `${before}px` }, { height: after }], { duration, easing });
    };

    // The new images come in from the top of the page down, left to right on a row
    const enter = (fresh) => {
      if (still || !fresh.length) return;
      const order = fresh
        .map((li) => ({ li, place: places.get(li) }))
        .filter((e) => e.place)
        .sort((a, b) => a.place.y - b.place.y || a.place.x - b.place.x);
      order.forEach(({ li }, i) => {
        const delay = Math.min(i, STAGGER_MAX) * STAGGER * pace;
        const timing = { duration: RISE * pace, delay, easing: ARRIVE, fill: 'backwards' };
        li.animate([{ translate: `0 ${LIFT}px`, opacity: 0 }, { translate: '0 0', opacity: 1 }], timing);
        li.querySelector('.kodza-masonry-grid__frame')?.animate(
          [{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], timing);
        li.querySelector('.kodza-masonry-grid__img')?.animate([{ scale: 1.12 }, { scale: 1 }], timing);
      });
    };

    // A word that changes rolls: the old one goes up, the new one comes from below, in one grid cell
    const roll = (box, text, keep = true) => {
      if (!box) return;
      const old = [...box.children].filter((el) => !el.hasAttribute('aria-hidden'));
      if (old.length === 1 && old[0].textContent === text) return;
      if (!old.length && box.textContent === text) return;
      if (!old.length) { box.textContent = ''; }
      const next = document.createElement('span');
      next.textContent = text;
      box.append(next);
      // The words already rolled out stay, hidden: the widest keeps the box's width
      old.forEach((el) => {
        el.setAttribute('aria-hidden', 'true');
        el.style.translate = '0 -110%';
        el.style.opacity = '0';
      });
      // A count only needs its latest figure: the old ones leave once they are out
      const gone = () => { if (!keep) old.forEach((el) => el.remove()); };
      if (still) return gone();
      const timing = { duration: ROLL * pace, easing: ARRIVE };
      old.forEach((el) => el.animate([{ translate: '0 0', opacity: 1 }, { translate: '0 -110%', opacity: 0 }], timing).finished.then(gone, gone));
      next.animate([{ translate: '0 110%', opacity: 0 }, { translate: '0 0', opacity: 1 }], timing);
    };

    const update = () => {
      const total = items().length;
      const count = shown().length;
      if (status) roll(status, fill(word('count'), { shown: count, total }), false);
      if (more && count === total && more.getAttribute('aria-disabled') !== 'true') {
        more.setAttribute('aria-disabled', 'true');
        roll(label, word('done'));
      }
    };

    // A hidden lazy image never loads: the next batch is fetched as soon as the button is aimed at
    const fetchNext = () => items().filter((li) => li.hidden).slice(0, batch)
      .forEach((li) => li.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = 'eager'; }));
    more?.addEventListener('pointerenter', fetchNext, { signal });
    more?.addEventListener('focus', fetchNext, { signal });

    more?.addEventListener('click', () => {
      if (more.getAttribute('aria-disabled') === 'true') return;
      const next = items().filter((li) => li.hidden).slice(0, batch);
      if (!next.length) return;
      fetchNext();
      next.forEach((li) => { li.hidden = false; });
      const before = layout();
      growList(before, RISE * pace, ARRIVE);
      enter(next);
      update();
      root.dispatchEvent(new CustomEvent('kodza:more', { bubbles: true, detail: { shown: shown().length, total: items().length } }));
    }, { signal });

    // Starts with the first images where they belong, and the count as it stands
    if (status) status.textContent = '';
    layout();
    if (footer) footer.hidden = items().every((li) => !li.hidden);
    if (status) status.append(Object.assign(document.createElement('span'), { textContent: fill(word('count'), { shown: shown().length, total: items().length }) }));

    // A new column count glides; a width that only grows or shrinks the columns follows at once.
    // Resizing again mid-glide sends the images on from where they are
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const width = list.clientWidth;
        const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
        const most = Math.max(1, parseInt(getComputedStyle(root).getPropertyValue('--kz-masonry-grid-columns'), 10) || 4);
        const count = Math.min(most, Math.max(1, Math.floor((width + gap) / (narrowest() + gap))));
        layout(count !== columns || gliding === 1);
      });
    };
    let lastWidth = list.clientWidth;
    const sizes = new ResizeObserver((entries) => {
      if (entries.some((e) => e.target === list)) {
        const width = list.clientWidth;
        if (width !== lastWidth) { lastWidth = width; return schedule(); }
      }
      // An image that loads without width and height, a font that arrives: laid out again at once
      if (!gliding) {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => layout());
      }
    });
    sizes.observe(list);
    all.forEach((li) => sizes.observe(li));

    // Images the site adds (an infinite list, a filter) are placed and come in like the others
    const added = new MutationObserver((records) => {
      const fresh = [];
      records.forEach((r) => {
        r.addedNodes.forEach((node) => { if (isItem(node)) { fresh.push(node); sizes.observe(node); } });
        r.removedNodes.forEach((node) => { if (isItem(node)) { places.delete(node); sizes.unobserve(node); } });
      });
      if (!records.some((r) => [...r.addedNodes, ...r.removedNodes].some(isItem))) return;
      const before = layout();
      growList(before, RISE * pace, ARRIVE);
      enter(fresh.filter((li) => !li.hidden));
      update();
    });
    added.observe(list, { childList: true });

    signal.addEventListener('abort', () => {
      cancelAnimationFrame(frame);
      clearTimeout(glideEnd);
      sizes.disconnect();
      added.disconnect();
      list.getAnimations({ subtree: true }).forEach((a) => a.cancel());
      root.classList.remove('is-laid');
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
