// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — FAQ Split
// Builds the list of topics from the groups (an ink pill follows the one you read, a click glides
// to it), opens each answer at its real height, and writes the FAQPage structured data (JSON-LD)
// from the questions on the page. One FAQPage per page: the first section writes it, and none is
// added when the page already has one. Settings: the --kz-faq-split-* variables in the CSS, the
// constants below, and three attributes on the root: data-single (one answer open at a time),
// data-nav-label (the name of the topics for screen readers) and data-schema="off" (no JSON-LD).
(() => {
  const SELECTOR = '[data-kodza-faq-split]';
  const READ_LINE = 0.35; // the reading line, as a share of the screen height: the topic whose group has passed it is the one read
  const GLIDE_WAIT = 1600; // ms the pill waits at most for a glide to land before it follows the page again (a wait, not motion)
  const OPEN = 520; // ms, the answer unfolding to its height
  const RISE = 620; // ms, its paragraphs rising into place
  const STAGGER = 70; // ms between two paragraphs
  const CLOSE = 420; // ms, the answer folding back
  const ROOM = 40; // px kept free under the pinned column: taller than the screen minus this, it scrolls with the page
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const FOLD = 'cubic-bezier(0.65, 0, 0.35, 1)';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const fold = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toUpperCase();
  const slug = (text) => fold(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'group';
  const words = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const own = (el) => el.closest(SELECTOR) === root;
    const items = [...root.querySelectorAll('.kodza-faq-split__item')].filter(own);
    const single = root.hasAttribute('data-single');

    // The answers: open at their real height, paragraphs rising; close folding back
    const open = (item) => {
      const panel = item.querySelector('.kodza-faq-split__panel');
      item.classList.remove('is-closing');
      panel.getAnimations().forEach((animation) => animation.cancel());
      item.open = true;
      if (still) return;
      panel.animate([{ height: '0px' }, { height: `${panel.scrollHeight}px` }], { duration: OPEN * pace, easing: EASE });
      [...panel.children].forEach((child, i) => child.animate([
        { opacity: 0, transform: 'translateY(14px)' },
        { opacity: 1, transform: 'none' },
      ], { duration: RISE * pace, delay: (60 + i * STAGGER) * pace, easing: EASE, fill: 'backwards' }));
    };
    const close = (item) => {
      const panel = item.querySelector('.kodza-faq-split__panel');
      if (!item.open || item.classList.contains('is-closing')) return;
      if (still) return (item.open = false);
      item.classList.add('is-closing');
      panel.animate([{ height: `${panel.offsetHeight}px`, opacity: 1 }, { height: '0px', opacity: 0.4 }], { duration: CLOSE * pace, easing: FOLD }).onfinish = () => {
        item.classList.remove('is-closing');
        item.open = false;
      };
    };
    items.forEach((item) => {
      const trigger = item.querySelector('.kodza-faq-split__trigger');
      if (!trigger || !item.querySelector('.kodza-faq-split__panel')) return;
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        if (item.open && !item.classList.contains('is-closing')) return close(item);
        if (single) items.forEach((other) => other !== item && close(other));
        open(item);
      }, { signal });
    });

    // The FAQPage structured data, written from the questions as they are on the page
    const hasSchema = () => [...document.querySelectorAll('script[type="application/ld+json"]')].some((script) => /FAQPage/.test(script.textContent));
    if (root.dataset.schema !== 'off' && items.length && !hasSchema()) {
      const schema = document.createElement('script');
      schema.type = 'application/ld+json';
      schema.setAttribute('data-kodza-faq-split-schema', '');
      schema.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map((item) => ({
          '@type': 'Question',
          name: words(item.querySelector('.kodza-faq-split__question')),
          acceptedAnswer: { '@type': 'Answer', text: words(item.querySelector('.kodza-faq-split__panel')) },
        })).filter((entry) => entry.name && entry.acceptedAnswer.text),
      });
      document.head.append(schema);
      signal.addEventListener('abort', () => schema.remove());
    }

    // The topics: one link per group, built from its heading
    const aside = [...root.querySelectorAll('.kodza-faq-split__aside')].find(own);
    const groups = [...root.querySelectorAll('.kodza-faq-split__group')].filter((group) => own(group) && group.querySelector('.kodza-faq-split__heading'));
    if (!aside || !groups.length) return;
    const headings = groups.map((group) => group.querySelector('.kodza-faq-split__heading'));
    groups.forEach((group, i) => {
      if (group.id) return;
      const base = `kz-faq-${slug(words(headings[i]))}`;
      let id = base;
      for (let n = 2; document.getElementById(id); n += 1) id = `${base}-${n}`;
      group.id = id;
    });

    const nav = document.createElement('nav');
    nav.className = 'kodza-faq-split__topics';
    nav.setAttribute('aria-label', root.dataset.navLabel || 'FAQ topics');
    const track = document.createElement('div');
    track.className = 'kodza-faq-split__track';
    const indicator = document.createElement('span');
    indicator.className = 'kodza-faq-split__indicator';
    indicator.setAttribute('aria-hidden', 'true');
    const mirror = document.createElement('span');
    mirror.className = 'kodza-faq-split__mirror';
    mirror.setAttribute('aria-hidden', 'true');
    const fill = (el, i) => {
      const label = document.createElement('span');
      label.className = 'kodza-faq-split__label';
      label.textContent = words(headings[i]);
      const count = document.createElement('span');
      count.className = 'kodza-faq-split__count';
      count.setAttribute('aria-hidden', 'true');
      count.textContent = groups[i].querySelectorAll('.kodza-faq-split__item').length;
      el.append(label, count);
      return el;
    };
    const links = groups.map((group, i) => {
      const link = document.createElement('a');
      link.className = 'kodza-faq-split__topic';
      link.href = `#${group.id}`;
      return fill(link, i);
    });
    groups.forEach((group, i) => {
      const ghost = document.createElement('span');
      ghost.className = 'kodza-faq-split__ghost';
      mirror.append(fill(ghost, i));
    });
    track.append(indicator, ...links, mirror);
    nav.append(track);
    const head = [...aside.querySelectorAll('.kodza-faq-split__head')].find(own);
    if (head) head.after(nav);
    else aside.prepend(nav);

    // The pill and its white twin are cut to the current topic: four insets on the track
    let current = -1;
    let live = false;
    const measure = () => {
      const link = links[current];
      if (!link) return;
      const l = link.offsetLeft;
      const t = link.offsetTop;
      track.style.setProperty('--kz-faq-split-l', `${l}px`);
      track.style.setProperty('--kz-faq-split-t', `${t}px`);
      track.style.setProperty('--kz-faq-split-r', `${track.clientWidth - l - link.offsetWidth}px`);
      track.style.setProperty('--kz-faq-split-b', `${track.clientHeight - t - link.offsetHeight}px`);
    };
    const show = (index) => {
      if (index === current) return;
      const first = current < 0;
      links[current]?.removeAttribute('aria-current');
      current = index;
      links[index].setAttribute('aria-current', 'true');
      // The first topic lights up in place, it does not slide in from nowhere
      if (first) root.classList.remove('is-live');
      measure();
      if (first) {
        void track.offsetWidth;
        if (live) root.classList.add('is-live');
      }
    };

    // Which topic is read: the last group whose top has passed the reading line. A click holds its
    // topic while the page glides there, and until the visitor scrolls
    const stickAt = () => parseFloat(getComputedStyle(aside).top) || 0;
    let held = null;
    let heldAt = 0;
    let gliding = false;
    let wait = 0;
    let frame = 0;
    const spy = () => {
      frame = 0;
      if (!track.offsetHeight || gliding) return;
      if (held !== null && Math.abs(scrollY - heldAt) < 2) return show(held);
      held = null;
      const end = innerHeight + scrollY >= document.documentElement.scrollHeight - 2 && root.getBoundingClientRect().bottom <= innerHeight + 2;
      const line = end ? innerHeight - 1 : Math.max(stickAt() + 1, innerHeight * READ_LINE);
      let index = 0;
      groups.forEach((group, i) => {
        if (group.getBoundingClientRect().top <= line) index = i;
      });
      show(index);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(spy);
    };
    const land = () => {
      if (!gliding) return;
      gliding = false;
      heldAt = scrollY;
      clearTimeout(wait);
      schedule();
    };
    const go = (index, smooth) => {
      const y = groups[index].getBoundingClientRect().top + scrollY - stickAt();
      show(index);
      held = index;
      if (smooth) {
        gliding = true;
        clearTimeout(wait);
        wait = setTimeout(land, GLIDE_WAIT);
      }
      scrollTo({ top: Math.max(0, Math.round(y)), behavior: smooth ? 'smooth' : 'instant' });
      if (!smooth) heldAt = scrollY;
    };
    track.addEventListener('click', (event) => {
      const link = event.target.closest('.kodza-faq-split__topic');
      if (!link || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const index = links.indexOf(link);
      go(index, !still);
      history.replaceState(history.state, '', `#${groups[index].id}`);
      // From the keyboard, the focus follows to the group's title
      if (event.detail === 0) {
        const heading = headings[index];
        if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    }, { signal });

    // Pinned only while it fits: a column taller than the screen scrolls with the page
    const loosen = () => root.classList.toggle('is-loose', aside.offsetHeight > innerHeight - stickAt() - ROOM);
    window.addEventListener('scroll', schedule, { passive: true, signal });
    window.addEventListener('scrollend', land, { signal });
    window.addEventListener('resize', () => {
      loosen();
      schedule();
    }, { signal });
    const observer = new ResizeObserver(() => {
      measure();
      loosen();
      schedule();
    });
    observer.observe(root);
    observer.observe(track);
    document.fonts?.ready.then(() => !signal.aborted && measure());
    signal.addEventListener('abort', () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(wait);
    });

    loosen();
    const landed = groups.findIndex((group) => `#${group.id}` === decodeURIComponent(location.hash));
    if (landed >= 0) go(landed, false);
    spy();
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
