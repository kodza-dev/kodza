// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Tabs
// Wires the tabs to their panels (in order), slides the indicator to the chosen tab and
// handles the keyboard: arrows, Home and End move and select, as the ARIA pattern asks.
// When the tabs outgrow the row, it scrolls sideways and brings the chosen tab into view.
(() => {
  const SELECTOR = '.kodza-tabs';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let uid = 0;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const list = root.querySelector('.kodza-tabs__list');
    const tabs = [...root.querySelectorAll('.kodza-tabs__tab')];
    const panels = [...root.querySelectorAll('.kodza-tabs__panel')];
    if (!list || !tabs.length) return;

    // ids are made here, so the copied HTML stays free of them
    const prefix = `kodza-tabs-${++uid}`;
    tabs.forEach((tab, i) => {
      const panel = panels[i];
      if (!panel) return;
      tab.id = `${prefix}-tab-${i}`;
      panel.id = `${prefix}-panel-${i}`;
      tab.setAttribute('aria-controls', panel.id);
      panel.setAttribute('aria-labelledby', tab.id);
      panel.tabIndex = 0;
    });

    // The pill version gets a white copy of the labels, cut to the same shape as the pill
    if (!root.classList.contains('kodza-tabs--line')) {
      const mirror = document.createElement('span');
      mirror.className = 'kodza-tabs__mirror';
      mirror.setAttribute('aria-hidden', 'true');
      mirror.append(...tabs.map((tab) => {
        const ghost = document.createElement('span');
        ghost.className = 'kodza-tabs__ghost';
        ghost.textContent = tab.textContent;
        return ghost;
      }));
      list.append(mirror);
    }

    // The pill and the white copy span the whole row, scrolled part included
    const place = (tab, scroll = false) => {
      list.style.removeProperty('--kz-tabs-track');
      const track = list.scrollWidth;
      list.classList.toggle('is-scroll', track > list.clientWidth + 1);
      list.style.setProperty('--kz-tabs-track', `${track}px`);
      list.style.setProperty('--kz-ind-l', `${tab.offsetLeft}px`);
      list.style.setProperty('--kz-ind-r', `${track - tab.offsetLeft - tab.offsetWidth}px`);
      if (scroll && list.classList.contains('is-scroll')) {
        const left = tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2;
        list.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    };

    let current = Math.max(0, tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true'));

    const select = (index, focus = false, first = false) => {
      const next = (index + tabs.length) % tabs.length;
      tabs.forEach((tab, i) => {
        const on = i === next;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
      });
      // The old panel leaves on the side you come from, the new one enters from the other
      root.style.setProperty('--kz-tabs-leave', next > current ? -1 : 1);
      panels.forEach((panel, i) => {
        if (i !== next) panel.classList.remove('is-active');
      });
      const panel = panels[next];
      if (panel && (next !== current || first)) {
        if (!first) {
          panel.classList.add('is-from');
          void panel.offsetWidth;
          panel.classList.remove('is-from');
        }
        panel.classList.add('is-active');
      }
      current = next;
      place(tabs[next], !first);
      if (focus) tabs[next].focus();
    };

    tabs.forEach((tab, i) => tab.addEventListener('click', () => select(i), { signal }));
    list.addEventListener('keydown', (event) => {
      const keys = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: tabs.length - 1 };
      if (!(event.key in keys)) return;
      event.preventDefault();
      select(keys[event.key], true);
    }, { signal });
    // From here, the panels are shown by the script (stacked), not by the hidden attribute
    panels.forEach((panel) => panel.removeAttribute('hidden'));
    root.classList.add('is-ready');
    select(current, false, true);
    const observer = new ResizeObserver(() => place(tabs[current]));
    observer.observe(list);
    signal.addEventListener('abort', () => observer.disconnect());
    document.fonts?.ready.then(() => place(tabs[current]));
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
