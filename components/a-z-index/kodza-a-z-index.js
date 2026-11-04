// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — A–Z Index
// Builds the bar of letters from the groups below it: a click glides to the group, and as you
// scroll, the ink pill slides to the letter of the group you read. Settings: the --kz-az-index-*
// variables, the constants below, and these attributes:
//   data-letters on the root: absent, A to Z; "groups", one label per group, in their order
//     (months, years, chapters); anything else, the letters as written ("#ABC…") or separated by
//     commas ("2024, 2025, 2026")
//   data-nav-label on the root: the bar's name for screen readers ("Jump to")
//   data-key on a group: the letter it files under (by default its heading's first letter,
//     accents dropped); data-label: its text in the bar with data-letters="groups"
(() => {
  const SELECTOR = '[data-kodza-a-z-index]';
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  // A group counts as the one being read once its top passes this far under the bar (px)
  const READ_LINE = 24;
  // After a click the pill stays on the chosen letter until the page stops scrolling; this is the
  // longest it waits for that, a time to wait and not a movement (ms)
  const GLIDE_WAIT = 1600;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  // Accented letters file under their plain letter
  const fold = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toUpperCase();
  const slug = (text) => fold(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'group';

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const groups = [...root.querySelectorAll('.kodza-az-index__group')].filter((group) => group.closest(SELECTOR) === root);
    if (!groups.length) return;
    const headingOf = (group) => group.querySelector('.kodza-az-index__heading');
    const fileOf = (group) => fold(group.dataset.key || headingOf(group)?.textContent.trim().charAt(0) || '');

    // The keys of the bar, each with the group it jumps to (none: nothing under that letter)
    const mode = root.dataset.letters?.trim();
    let keys;
    if (mode === 'groups') {
      keys = groups.map((group) => ({ label: group.dataset.label || group.dataset.key || headingOf(group)?.textContent.trim() || '', group }));
    } else {
      const letters = mode ? (mode.includes(',') ? mode.split(',') : [...mode]).map((s) => s.trim()).filter(Boolean) : [...ALPHABET];
      const taken = new Set();
      keys = letters.map((label) => {
        const group = groups.find((g) => !taken.has(g) && fileOf(g) === fold(label)) || null;
        if (group) taken.add(group);
        return { label, group };
      });
    }
    const keyOf = new Map(keys.filter((key) => key.group).map((key) => [key.group, key]));

    // Groups get an id to link to (the markup comes back as written on kodza:destroy)
    keyOf.forEach((key, group) => {
      if (group.id) return;
      const base = `kz-az-${slug(key.label)}`;
      let id = base;
      for (let n = 2; document.getElementById(id); n += 1) id = `${base}-${n}`;
      group.id = id;
    });

    const bar = document.createElement('nav');
    bar.className = 'kodza-az-index__bar';
    bar.setAttribute('aria-label', root.dataset.navLabel || 'Jump to');
    const track = document.createElement('div');
    track.className = 'kodza-az-index__track';
    const indicator = document.createElement('span');
    indicator.className = 'kodza-az-index__indicator';
    indicator.setAttribute('aria-hidden', 'true');
    const mirror = document.createElement('span');
    mirror.className = 'kodza-az-index__mirror';
    mirror.setAttribute('aria-hidden', 'true');
    keys.forEach((key) => {
      key.el = document.createElement(key.group ? 'a' : 'span');
      key.el.className = 'kodza-az-index__key';
      key.el.textContent = key.label;
      if (key.group) key.el.href = `#${key.group.id}`;
      else key.el.setAttribute('aria-hidden', 'true');
      const ghost = document.createElement('span');
      ghost.className = 'kodza-az-index__ghost';
      ghost.textContent = key.label;
      mirror.append(ghost);
    });
    track.append(indicator, ...keys.map((key) => key.el), mirror);
    bar.append(track);
    root.prepend(bar);

    let current = null;
    let live = false;
    // The pill, cut down to the current key; the row scrolled so that key is in view
    const measure = () => {
      track.style.removeProperty('--kz-az-index-track');
      const width = track.scrollWidth;
      track.classList.toggle('is-scroll', width > track.clientWidth + 1);
      track.style.setProperty('--kz-az-index-track', `${width}px`);
      if (!current) return;
      const { offsetLeft: left, offsetWidth: size } = current.el;
      track.style.setProperty('--kz-az-index-l', `${left}px`);
      track.style.setProperty('--kz-az-index-r', `${width - left - size}px`);
    };
    const edges = () => {
      const end = track.scrollWidth - track.clientWidth;
      track.classList.toggle('has-before', track.scrollLeft > 1);
      track.classList.toggle('has-after', track.scrollLeft < end - 1);
    };
    const follow = (smooth) => {
      if (!current || !track.classList.contains('is-scroll')) return;
      const left = current.el.offsetLeft - (track.clientWidth - current.el.offsetWidth) / 2;
      track.scrollTo({ left: Math.max(0, left), behavior: smooth && !still ? 'smooth' : 'auto' });
    };
    const show = (key, smooth = true) => {
      if (!key || key === current) return;
      const first = !current;
      current?.el.removeAttribute('aria-current');
      current = key;
      key.el.setAttribute('aria-current', 'true');
      // The first letter is placed, not slid in from the edge (a band that was hidden)
      if (first) root.classList.remove('is-live');
      measure();
      follow(smooth && !first);
      if (first && live) {
        void track.offsetWidth;
        root.classList.add('is-live');
      }
    };

    const stickAt = () => parseFloat(getComputedStyle(bar).top) || 0;
    // The group being read: the last one whose top has passed under the bar. At the very end of
    // the page, the last group in view (a short last group never reaches the bar). A letter clicked
    // stays lit until the page moves again, even when its group cannot reach the bar
    let gliding = false;
    let held = null;
    let heldAt = 0;
    let frame = 0;
    const spy = () => {
      frame = 0;
      if (!bar.offsetHeight) return; // hidden (display: none): measured once it shows
      const below = stickAt() + bar.offsetHeight;
      root.classList.toggle('is-stuck', groups[0].getBoundingClientRect().top < bar.getBoundingClientRect().bottom - 0.5);
      if (gliding) return;
      if (held) {
        if (Math.abs(window.scrollY - heldAt) < 2) return show(held);
        held = null;
      }
      let read = null;
      const end = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
        && root.getBoundingClientRect().bottom <= window.innerHeight + 2;
      for (const group of groups) {
        const top = group.getBoundingClientRect().top;
        if (top > (end ? window.innerHeight - 1 : below + READ_LINE)) break;
        if (keyOf.has(group)) read = group;
      }
      show(keyOf.get(read) || keyOf.get(groups.find((group) => keyOf.has(group))));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(spy);
    };

    let wait = 0;
    const land = () => {
      if (!gliding) return;
      gliding = false;
      heldAt = window.scrollY;
      clearTimeout(wait);
      schedule();
    };
    const go = (key, smooth) => {
      const y = key.group.getBoundingClientRect().top + window.scrollY - stickAt() - bar.offsetHeight;
      show(key);
      held = key;
      if (smooth) {
        gliding = true;
        clearTimeout(wait);
        wait = setTimeout(land, GLIDE_WAIT);
      }
      window.scrollTo({ top: Math.max(0, Math.round(y)), behavior: smooth ? 'smooth' : 'auto' });
      if (!smooth) heldAt = window.scrollY;
    };

    track.addEventListener('click', (event) => {
      const key = keys.find((k) => k.group && k.el === event.target.closest?.('.kodza-az-index__key'));
      if (!key || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      go(key, !still);
      history.replaceState(history.state, '', `#${key.group.id}`);
      // From the keyboard, the focus follows to the group's heading
      if (event.detail === 0) {
        const target = headingOf(key.group) || key.group;
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    }, { signal });
    track.addEventListener('scroll', edges, { passive: true, signal });
    window.addEventListener('scroll', schedule, { passive: true, signal });
    window.addEventListener('scrollend', land, { signal });
    window.addEventListener('resize', schedule, { signal });

    // The bar's height, for the groups' sticky letters; the widths, once fonts load or the row resizes
    const resize = new ResizeObserver(() => {
      root.style.setProperty('--kz-az-index-bar', `${bar.offsetHeight}px`);
      measure();
      edges();
      schedule();
    });
    [bar, track, ...keys.map((key) => key.el)].forEach((el) => resize.observe(el));
    signal.addEventListener('abort', () => {
      resize.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(wait);
    });

    // A link to one of the groups (#kz-az-c) lands on it once the bar exists
    const landed = keys.find((key) => key.group && `#${key.group.id}` === decodeURIComponent(location.hash));
    if (landed) go(landed, false);
    spy();
    follow(false);
    edges();
    requestAnimationFrame(() => {
      if (signal.aborted) return;
      live = true;
      root.classList.add('is-live');
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
