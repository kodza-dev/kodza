// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Sparkline
// Turns a <data value="12 14 13 …"> into a curve the size of a word, with its last value and the
// change since the first one in mono beside it. It draws when it comes into view; screen readers
// hear one sentence instead ("from 12 to 31, up 158%"). Without the script, the text of the
// element shows as it is. "kodza:replay" on the element draws it again.
// Settings: the --kz-sparkline-* variables in the CSS; on the element, data-prefix and
// data-suffix (around each number), data-change="delta" (the difference instead of a percentage)
// and the words below (data-text-<key>); the constants under them.
(() => {
  const SELECTOR = '.kodza-sparkline';
  const WORDS = {
    read: 'from {first} to {last}, {trend}',
    up: 'up {change}',
    down: 'down {change}',
    flat: 'flat',
  };
  const DRAW = 900; // ms, the line from left to right
  const LAND = 320; // ms, the last point, once the line reaches it
  const RISE = 520; // ms, each number rising from its mask
  const STAGGER = 90; // ms, between the value and the change
  const ENTER_AT = 1; // the share of the curve in view before it draws
  const INSET = 0.12; // the share of the height kept free above and under the curve
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const swing = 'cubic-bezier(0.65, 0, 0.35, 1)';

  const NS = 'http://www.w3.org/2000/svg';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const decimalsOf = (text) => (text.split('.')[1] || '').length;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const raw = (root.getAttribute('value') || '').trim().split(/[\s,;]+/);
    const values = raw.map(Number);
    if (values.length < 2 || values.some((v) => !Number.isFinite(v))) return;
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const fill = (text, parts) => text.replace(/\{(\w+)\}/g, (_, key) => parts[key] ?? '');
    const lang = root.closest('[lang]')?.lang || document.documentElement.lang || undefined;
    const digits = Math.min(4, Math.max(...raw.map(decimalsOf)));
    const number = new Intl.NumberFormat(lang, { minimumFractionDigits: digits, maximumFractionDigits: digits });
    const percent = new Intl.NumberFormat(lang, { maximumFractionDigits: 0 });
    const prefix = root.dataset.prefix || '';
    const suffix = root.dataset.suffix || '';
    const show = (v) => `${prefix}${number.format(v)}${suffix}`;

    const first = values[0];
    const last = values[values.length - 1];
    const delta = last - first;
    const byDelta = root.dataset.change === 'delta' || first === 0;
    const size = byDelta ? Math.abs(delta) : Math.abs(delta / first) * 100;
    const flat = (byDelta ? number.format(size) : percent.format(size)) === (byDelta ? number.format(0) : percent.format(0));
    const amount = byDelta ? show(size) : `${percent.format(size)}%`;
    const sign = flat ? '±' : delta > 0 ? '+' : '−';
    const trend = flat ? word('flat') : fill(word(delta > 0 ? 'up' : 'down'), { change: amount });

    // The curve: x from 0 to 100, y inside the height minus a little room for the stroke
    const low = Math.min(...values);
    const span = Math.max(...values) - low;
    const W = 100;
    const H = 30;
    const points = values.map((v, i) => [
      (i / (values.length - 1)) * W,
      span ? H * INSET + (1 - (v - low) / span) * H * (1 - 2 * INSET) : H / 2,
    ]);
    const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
    const svgEl = (tag, attrs) => {
      const el = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      return el;
    };
    const make = (className, text) => Object.assign(document.createElement('span'), { className, textContent: text || '' });

    const svg = svgEl('svg', { class: 'kodza-sparkline__svg', viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none', focusable: 'false' });
    svg.append(
      svgEl('path', { class: 'kodza-sparkline__fill', d: `${line} L${W} ${H} L0 ${H} Z` }),
      svgEl('path', { class: 'kodza-sparkline__path', d: line, 'vector-effect': 'non-scaling-stroke' }),
    );
    const dot = make('kodza-sparkline__dot');
    dot.style.left = '100%';
    dot.style.top = `${(points[points.length - 1][1] / H) * 100}%`;
    const graph = make('kodza-sparkline__graph');
    graph.append(svg, dot);
    const value = make('kodza-sparkline__value');
    const valueText = make('', show(last));
    value.append(valueText);
    const change = make('kodza-sparkline__change');
    const changeText = make('', `${sign}${flat ? (byDelta ? show(0) : '0%') : amount}`);
    change.append(changeText);
    root.replaceChildren(make('kodza-sparkline__sr', fill(word('read'), { first: show(first), last: show(last), trend })), graph, value, change);
    [graph, value, change].forEach((el) => el.setAttribute('aria-hidden', 'true'));

    const parts = [graph, dot, valueText, changeText];
    const stop = () => parts.forEach((el) => el.getAnimations().forEach((animation) => animation.cancel()));
    const draw = () => {
      stop();
      if (still) return;
      const ms = (t) => t * pace;
      graph.animate([{ clipPath: 'inset(-4px 100% -4px -4px)' }, { clipPath: 'inset(-4px -6px -4px -4px)' }], {
        duration: ms(DRAW), easing: swing, fill: 'backwards',
      });
      dot.animate([{ transform: 'scale(0)' }, { transform: 'scale(1.5)', offset: 0.55 }, { transform: 'scale(1)' }], {
        duration: ms(LAND), delay: ms(DRAW * 0.92), easing: 'ease-out', fill: 'backwards',
      });
      [valueText, changeText].forEach((el, i) => el.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], {
        duration: ms(RISE), delay: ms(DRAW * 0.7 + i * STAGGER), easing: ease, fill: 'backwards',
      }));
    };

    if (still || !('IntersectionObserver' in window)) return;
    // Hidden until it draws, so it never shows whole and then starts again
    parts.forEach((el) => (el.style.visibility = 'hidden'));
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      io.disconnect();
      parts.forEach((el) => (el.style.visibility = ''));
      draw();
    }, { threshold: ENTER_AT });
    io.observe(graph);
    signal.addEventListener('abort', () => { io.disconnect(); stop(); });
    root.addEventListener('kodza:replay', () => {
      io.disconnect();
      parts.forEach((el) => (el.style.visibility = ''));
      draw();
    }, { signal });
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
