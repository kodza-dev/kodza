// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Stat Card
// Draws the curve from data-points at the chart's real size (and again when it resizes),
// rolls the figure and draws the curve when the card comes into view, and moves a guide with
// the value of the nearest day under the pointer. "kodza:replay" plays it again.
(() => {
  const SELECTOR = '.kodza-stat';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const make = (tag, attrs = {}) => {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
  };
  let uid = 0;

  // A smooth curve through the points (Catmull-Rom as cubic Beziers)
  const curve = (pts) => pts.reduce((d, [x, y], i) => {
    if (!i) return `M${x},${y}`;
    const [x0, y0] = pts[i - 2] || pts[i - 1];
    const [x1, y1] = pts[i - 1];
    const [x3, y3] = pts[i + 1] || [x, y];
    return `${d} C${x1 + (x - x0) / 6},${y1 + (y - y0) / 6} ${x - (x3 - x1) / 6},${y - (y3 - y1) / 6} ${x},${y}`;
  }, '');

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const svg = root.querySelector('.kodza-stat__chart');
    const value = root.querySelector('.kodza-stat__value');
    const data = (root.dataset.points || '').split(',').map(Number).filter((n) => !Number.isNaN(n));
    const labels = (root.dataset.labels || '').split(',');
    const format = (n) => n.toLocaleString('en-US');
    if (!svg || data.length < 2) return;

    // The figure: digits in windows, the plain text for screen readers
    const strips = [];
    if (value) {
      const text = value.textContent.trim();
      let rank = 0;
      value.setAttribute('aria-hidden', 'true');
      value.after(Object.assign(document.createElement('span'), { className: 'kodza-stat__sr', textContent: text }));
      value.replaceChildren(...[...text].map((char) => {
        if (!/\d/.test(char)) return Object.assign(document.createElement('span'), { className: 'kodza-stat__char', textContent: char });
        const column = Object.assign(document.createElement('span'), { className: 'kodza-stat__digit' });
        const strip = document.createElement('span');
        for (let i = 0; i < 20; i++) strip.append(Object.assign(document.createElement('span'), { textContent: i % 10 }));
        column.append(strip);
        strips.push({ strip, stop: 10 + Number(char), rank: rank++ });
        return column;
      }));
    }

    // The chart parts
    const id = `kodza-stat-${++uid}`;
    const defs = make('defs');
    const gradient = make('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 });
    gradient.append(make('stop', { offset: '0', class: 'kodza-stat__area', 'stop-opacity': '0.14' }), make('stop', { offset: '1', class: 'kodza-stat__area', 'stop-opacity': '0' }));
    defs.append(gradient);
    const area = make('path', { fill: `url(#${id})` });
    const line = make('path', { class: 'kodza-stat__line', pathLength: '1' });
    const end = make('circle', { class: 'kodza-stat__end', r: '3.5' });
    const guide = make('line', { class: 'kodza-stat__guide' });
    const spot = make('circle', { class: 'kodza-stat__spot', r: '4' });
    svg.append(defs, area, guide, line, end, spot);
    const tip = Object.assign(document.createElement('span'), { className: 'kodza-stat__tip' });
    tip.setAttribute('aria-hidden', 'true');
    root.append(tip);

    let points = [];
    const draw = () => {
      const w = svg.clientWidth;
      const h = svg.clientHeight;
      if (!w || !h) return;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const min = Math.min(...data);
      const max = Math.max(...data);
      const pad = 6;
      points = data.map((v, i) => [i / (data.length - 1) * w, max === min ? h * 0.6 : h - pad - (v - min) / (max - min) * (h - pad * 2)]);
      const d = curve(points);
      line.setAttribute('d', d);
      area.setAttribute('d', `${d} L${w},${h} L0,${h} Z`);
      const [ex, ey] = points[points.length - 1];
      end.setAttribute('cx', ex);
      end.setAttribute('cy', ey);
      guide.setAttribute('y1', 0);
      guide.setAttribute('y2', h);
    };
    draw();
    const resize = new ResizeObserver(draw);
    resize.observe(svg);
    signal.addEventListener('abort', () => resize.disconnect());

    const play = () => {
      if (reduceMotion) {
        strips.forEach(({ strip, stop }) => (strip.style.transform = `translateY(${-stop * 1.1}em)`));
        return;
      }
      const ease = 'cubic-bezier(0.16, 1, 0.3, 1)';
      strips.forEach(({ strip, stop, rank }) => strip.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${-stop * 1.1}em)` }], { duration: 1300 + rank * 140, easing: ease, fill: 'forwards' }));
      line.animate([{ strokeDasharray: '1', strokeDashoffset: '1' }, { strokeDasharray: '1', strokeDashoffset: '0' }], { duration: 1400, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'both' });
      area.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: 500, easing: ease, fill: 'both' });
      end.animate([{ transform: 'scale(0)' }, { transform: 'scale(1.4)', offset: 0.6 }, { transform: 'none' }], { duration: 500, delay: 1250, easing: ease, fill: 'both' });
    };
    end.style.transformBox = 'fill-box';
    end.style.transformOrigin = 'center';

    if (reduceMotion || !('IntersectionObserver' in window)) play();
    else {
      strips.forEach(({ strip }) => (strip.style.transform = 'translateY(0)'));
      const io = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        io.disconnect();
        strips.forEach(({ strip }) => (strip.style.transform = ''));
        play();
      }, { threshold: 0.5 });
      io.observe(root);
      signal.addEventListener('abort', () => io.disconnect());
    }
    root.addEventListener('kodza:replay', () => {
      [line, area, end, ...strips.map(({ strip }) => strip)].forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
      play();
    }, { signal });

    // The guide: the nearest day under the pointer
    svg.addEventListener('pointermove', (event) => {
      const box = svg.getBoundingClientRect();
      const k = box.width / svg.clientWidth || 1;
      // An <svg> has no offsetTop: its place in the card, in the card's own pixels
      const card = root.getBoundingClientRect();
      const left0 = (box.left - card.left) / k;
      const top0 = (box.top - card.top) / k;
      const x = (event.clientX - box.left) / k;
      const i = Math.round(x / svg.clientWidth * (data.length - 1));
      const [px, py] = points[Math.max(0, Math.min(points.length - 1, i))];
      const index = Math.max(0, Math.min(data.length - 1, i));
      guide.setAttribute('x1', px);
      guide.setAttribute('x2', px);
      spot.setAttribute('cx', px);
      spot.setAttribute('cy', py);
      tip.textContent = `${labels[index] ? `${labels[index]} · ` : ''}${format(data[index])}`;
      const left = left0 + px - tip.offsetWidth / 2;
      tip.style.transform = `translate(${Math.max(8, Math.min(root.clientWidth - tip.offsetWidth - 8, left))}px, ${top0 + py - tip.offsetHeight - 12}px)`;
      root.classList.add('is-pointing');
    }, { signal });
    svg.addEventListener('pointerleave', () => root.classList.remove('is-pointing'), { signal });
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
