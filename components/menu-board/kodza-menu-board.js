// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Menu Board
// Turns the services into tabs (the ink pill of Tabs) and opens on the one served now at the place,
// a dot before its name. data-layout="stack" keeps them one under the other instead, each title
// pinned on a frosted veil while its dishes scroll by. Without the script, the menu reads as is.
// Settings: data-hours on a service ("12:00-14:30", several with commas, past midnight allowed),
// data-timezone on the root (the place's, "Europe/Paris"), data-now="19:30" to fix the time (a
// screenshot, a test), data-label (the name of the row of tabs), and TICK below.
(() => {
  const SELECTOR = '[data-kodza-menu-board]';
  const TICK = 60000; // how often the dot checks the hour (a clock, not motion: it is not paced)
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  let uid = 0;

  // "12:30" -> 750
  const minutes = (time) => {
    const [h, m] = time.trim().split(':').map(Number);
    return h * 60 + (m || 0);
  };
  // The hour at the place, whatever the visitor's clock says
  const clockOf = (zone) => {
    const options = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
    try {
      return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: zone || undefined });
    } catch {
      return new Intl.DateTimeFormat('en-GB', options);
    }
  };
  // "12:00-14:30, 19:00-22:30" -> [[720, 870], [1140, 1350]]
  const rangesOf = (hours) => (hours || '').split(',').map((part) => part.split('-'))
    .filter((pair) => pair.length === 2 && pair.every((t) => /^\s*\d{1,2}(:\d{2})?\s*$/.test(t)))
    .map(([a, b]) => [minutes(a), minutes(b)]);
  const within = (t, [a, b]) => (a < b ? a <= t && t < b : t >= a || t < b);

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const services = [...root.querySelectorAll(':scope > .kodza-menu-board__service')];
    if (!services.length) return;

    // Stack: the titles pin themselves (CSS); the script only lays the veil once a dish passes under
    if (root.dataset.layout === 'stack') {
      root.classList.add('is-stack');
      const heads = services.map((service) => [service, service.querySelector('.kodza-menu-board__head')]).filter(([, head]) => head);
      let frame = 0;
      const spy = () => {
        frame = 0;
        heads.forEach(([service, head]) => {
          head.classList.toggle('is-stuck', service.getBoundingClientRect().top < head.getBoundingClientRect().top - 0.5);
        });
      };
      const queue = () => { frame ||= requestAnimationFrame(spy); };
      window.addEventListener('scroll', queue, { passive: true, signal });
      window.addEventListener('resize', queue, { passive: true, signal });
      signal.addEventListener('abort', () => cancelAnimationFrame(frame));
      spy();
      return;
    }

    root.classList.add('is-tabs');
    const prefix = `kodza-menu-board-${++uid}`; // ids are made here, so the copied HTML stays free of them
    const list = document.createElement('div');
    list.className = 'kodza-menu-board__tabs';
    list.setAttribute('role', 'tablist');
    list.setAttribute('aria-label', root.dataset.label || 'Menu');
    const indicator = document.createElement('span');
    indicator.className = 'kodza-menu-board__indicator';
    indicator.setAttribute('aria-hidden', 'true');
    list.append(indicator);

    const tabs = services.map((service, i) => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'kodza-menu-board__tab';
      tab.setAttribute('role', 'tab');
      tab.id = `${prefix}-tab-${i}`;
      const name = document.createElement('span');
      name.textContent = (service.querySelector('.kodza-menu-board__title')?.textContent || `${i + 1}`).trim();
      // Drawn first (CSS order), read last: "Dinner, served now"
      const now = document.createElement('span');
      now.className = 'kodza-menu-board__now';
      const said = document.createElement('span');
      said.className = 'kodza-menu-board__hidden';
      said.textContent = ', served now';
      now.append(said);
      tab.append(name, now);
      service.id = `${prefix}-panel-${i}`;
      service.setAttribute('role', 'tabpanel');
      service.setAttribute('aria-labelledby', tab.id);
      service.tabIndex = 0;
      tab.setAttribute('aria-controls', service.id);
      list.append(tab);
      return tab;
    });

    // A white copy of the names, cut to the same shape as the pill
    const mirror = document.createElement('span');
    mirror.className = 'kodza-menu-board__mirror';
    mirror.setAttribute('aria-hidden', 'true');
    const ghosts = tabs.map((tab) => {
      const ghost = document.createElement('span');
      ghost.className = 'kodza-menu-board__ghost';
      ghost.append(...[...tab.childNodes].map((node) => node.cloneNode(true)));
      return ghost;
    });
    mirror.append(...ghosts);
    list.append(mirror);
    root.prepend(list);

    // The pill and the white copy span the whole row, scrolled part included
    const place = (tab, scroll = false) => {
      list.style.removeProperty('--kz-menu-board-track');
      const track = list.scrollWidth;
      list.classList.toggle('is-scroll', track > list.clientWidth + 1);
      list.style.setProperty('--kz-menu-board-track', `${track}px`);
      list.style.setProperty('--kz-menu-board-l', `${tab.offsetLeft}px`);
      list.style.setProperty('--kz-menu-board-r', `${track - tab.offsetLeft - tab.offsetWidth}px`);
      if (scroll && list.classList.contains('is-scroll')) {
        const left = tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2;
        list.scrollTo({ left, behavior: still ? 'auto' : 'smooth' });
      }
    };

    // The time at the place, or the one written in data-now
    const clock = clockOf(root.dataset.timezone);
    const now = () => {
      if (/^\d{1,2}:\d{2}$/.test(root.dataset.now || '')) return minutes(root.dataset.now);
      const parts = Object.fromEntries(clock.formatToParts(new Date()).map((p) => [p.type, p.value]));
      return minutes(`${parts.hour}:${parts.minute}`);
    };
    const hours = services.map((service) => rangesOf(service.dataset.hours));
    const servedAt = (t) => hours.findIndex((ranges) => ranges.some((range) => within(t, range)));

    let current = 0;
    const select = (index, focus = false, first = false) => {
      const next = (index + tabs.length) % tabs.length;
      tabs.forEach((tab, i) => {
        const on = i === next;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
      });
      // The old service leaves on the side you come from, the new one enters from the other
      root.style.setProperty('--kz-menu-board-leave', next > current ? -1 : 1);
      services.forEach((service, i) => {
        if (i !== next) service.classList.remove('is-active');
      });
      const service = services[next];
      if (next !== current || first) {
        if (!first) {
          service.classList.add('is-from');
          void service.offsetWidth;
          service.classList.remove('is-from');
        }
        service.classList.add('is-active');
      }
      current = next;
      place(tabs[next], !first);
      if (focus) tabs[next].focus();
    };

    // The dot follows the hour; the open tab never changes under the reader
    let timer = 0;
    const mark = () => {
      const served = servedAt(now());
      tabs.forEach((tab, i) => {
        tab.classList.toggle('is-now', i === served);
        ghosts[i].classList.toggle('is-now', i === served);
      });
      place(tabs[current]);
    };
    const tick = () => {
      mark();
      timer = setTimeout(tick, TICK - (Date.now() % TICK) + 50);
    };
    signal.addEventListener('abort', () => clearTimeout(timer));

    // Opens on the service served now, else the next one today, else the first
    const t = now();
    let start = servedAt(t);
    if (start < 0) {
      let soonest = Infinity;
      hours.forEach((ranges, i) => ranges.forEach(([a]) => {
        if (a > t && a < soonest) {
          soonest = a;
          start = i;
        }
      }));
    }
    current = Math.max(0, start);

    tabs.forEach((tab, i) => tab.addEventListener('click', () => select(i), { signal }));
    list.addEventListener('keydown', (event) => {
      const keys = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: tabs.length - 1 };
      if (!(event.key in keys)) return;
      event.preventDefault();
      select(keys[event.key], true);
    }, { signal });
    select(current, false, true);
    tick();
    const observer = new ResizeObserver(() => place(tabs[current]));
    observer.observe(list);
    signal.addEventListener('abort', () => observer.disconnect());
    document.fonts?.ready.then(() => !signal.aborted && place(tabs[current]));
    // The first placement is instant; only later moves slide
    requestAnimationFrame(() => !signal.aborted && root.classList.add('is-live'));
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
