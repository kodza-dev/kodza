// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Hero Event
// Counts down to the datetime of __start, its time zone included: every digit that changes
// falls out of its window as the next one comes from above (the Countdown engine). At the
// start, 00 lands, then the count rises away under the hairline for "Live now"; after the end
// (__end), "Live now" makes way for the replay link and the ticket button folds away. Change a
// datetime and it follows. The entrance is Hero Split's, played once the section is in view, its
// picture decoded and the fonts in; "kodza:replay" plays it again.
(() => {
  const SELECTOR = '.kodza-hero-event';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GLIDE = 'cubic-bezier(0.6, 0, 0.1, 1)'; // slow start, long settle
  const SOFT = 'cubic-bezier(0.25, 1, 0.5, 1)';
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const ROLL = 'cubic-bezier(0.65, 0, 0.35, 1)'; // the states take turns, no lurch at the start
  const SPAN = { days: 86400, hours: 3600, minutes: 60, seconds: 1 };

  const decoded = (root) => Promise.all([...root.querySelectorAll('img')].map((img) => img.decode().catch(() => {})));
  const when = (el) => new Date(el?.getAttribute('datetime') ?? '').getTime();

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const q = (s) => root.querySelector(s);
    const start = q('.kodza-hero-event__start');
    const end = q('.kodza-hero-event__end');
    const status = q('.kodza-hero-event__status');
    const ticket = q('.kodza-hero-event__ticket');
    const states = {
      count: q('.kodza-hero-event__state--count'),
      live: q('.kodza-hero-event__state--live'),
      over: q('.kodza-hero-event__state--over'),
    };
    const values = [...root.querySelectorAll('.kodza-hero-event__value')];
    const entrance = [];
    const motion = [];
    let state = '';
    let said = '';
    let timer = 0;

    const stop = (list) => {
      list.forEach((a) => a.cancel());
      list.length = 0;
    };
    const animate = (list, el, keyframes, options) => {
      if (!el) return null;
      const animation = el.animate(keyframes, { easing: GLIDE, fill: 'backwards', ...options });
      list.push(animation);
      return animation;
    };

    // Screen readers get the count as a sentence, refreshed once a minute, not every second
    states.count?.setAttribute('aria-hidden', 'true');
    const sr = Object.assign(document.createElement('span'), { className: 'kodza-hero-event__sr' });
    sr.setAttribute('role', 'timer');
    status?.append(sr);

    // A value is a row of digit windows; a digit that changes drops out, the new one comes from above.
    // Never more than two in a window: a digit still leaving goes at once, one still arriving
    // leaves from where it stands.
    const settle = (cell) => {
      const last = cell.lastElementChild;
      [...cell.children].forEach((el) => el !== last && el.remove());
      return last;
    };
    const show = (el, text, moving) => {
      const cells = [...el.children];
      if (cells.length !== text.length) {
        el.replaceChildren(...[...text].map((char) => {
          const cell = Object.assign(document.createElement('span'), { className: 'kodza-hero-event__digit' });
          cell.append(Object.assign(document.createElement('span'), { textContent: char }));
          return cell;
        }));
        return;
      }
      [...text].forEach((char, i) => {
        const cell = cells[i];
        const old = settle(cell);
        if (old.textContent === char) return;
        const next = Object.assign(document.createElement('span'), { textContent: char });
        cell.append(next);
        if (!moving || reduceMotion) return old.remove();
        const style = getComputedStyle(old);
        const y = new DOMMatrixReadOnly(style.transform).m42;
        const opacity = style.opacity;
        old.getAnimations().forEach((a) => a.cancel());
        const timing = { duration: 520, easing: EASE };
        old.animate([{ transform: `translateY(${y}px)`, opacity }, { transform: `translateY(${old.offsetHeight}px)`, opacity: 0 }], { ...timing, fill: 'forwards' }).finished.then(() => old.remove(), () => {});
        next.animate([{ transform: 'translateY(-100%)', opacity: 0 }, { transform: 'none', opacity: 1 }], timing);
      });
    };

    // The ticket button narrows to nothing, its gap with it, then leaves the row; it comes back
    // the same way. Both start from where it stands, if it was still on its way.
    const open = () => {
      const style = getComputedStyle(ticket);
      return { width: `${ticket.offsetWidth}px`, paddingLeft: style.paddingLeft, paddingRight: style.paddingRight, marginRight: style.marginRight, flexGrow: 0, flexShrink: 0, opacity: style.opacity };
    };
    const shut = () => {
      const gap = parseFloat(getComputedStyle(ticket.parentElement).columnGap) || 0;
      return { width: '0px', paddingLeft: '0px', paddingRight: '0px', marginRight: `${-gap}px`, flexGrow: 0, flexShrink: 0, opacity: 0 };
    };
    const fold = (from) => {
      if (!ticket) return root.classList.add('is-over');
      const folded = animate(motion, ticket, [from, shut()], { duration: 900, fill: 'forwards' });
      folded.finished.then(() => {
        root.classList.add('is-over');
        folded.cancel();
      }, () => {});
    };
    const unfold = (from) => {
      const to = open();
      if (from.width !== to.width) animate(motion, ticket, [from, to], { duration: 900 });
    };

    // One state at a time in the cell: the old one rises away under the hairline as the new one
    // comes up from below. A turn that comes before the last one has landed starts from where
    // everything stands: what was arriving goes back down, what was leaving comes back.
    const turn = (name, moving) => {
      if (name === state) return;
      const from = states[state];
      const to = states[name];
      const first = !state;
      const y = (el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42;
      const going = new Map(motion.filter((a) => a.playState !== 'finished' && Object.values(states).includes(a.effect?.target)).map((a) => [a.effect.target, y(a.effect.target)]));
      const ticketFrom = ticket && (root.classList.contains('is-over') ? shut() : open());
      state = name;
      Object.values(states).forEach((el) => el?.classList.toggle('is-current', el === to));
      sr.hidden = name !== 'count';
      stop(motion);
      if (name !== 'over') root.classList.remove('is-over');
      if (first || !moving || reduceMotion) {
        if (name === 'over') root.classList.add('is-over');
        return;
      }
      // One strip, the height of the whole cell: the old state clears the hairline, the new one
      // starts below the bottom edge, both at the same speed
      const strip = { duration: 900, easing: ROLL };
      const height = status.clientHeight;
      if (from && !going.has(from)) going.set(from, 0);
      going.forEach((at, el) => {
        if (el === to) return;
        const away = at > 0 ? height : -height;
        animate(motion, el, [{ transform: `translateY(${at}px)`, visibility: 'visible' }, { transform: `translateY(${away}px)`, visibility: 'visible' }], strip);
      });
      animate(motion, to, [{ transform: `translateY(${going.get(to) ?? height}px)` }, { transform: 'none' }], strip);
      if (!ticket) return name === 'over' && fold();
      if (name === 'over') fold(ticketFrom);
      else unfold(ticketFrom);
    };

    const schedule = () => {
      if (state !== 'over') timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 10);
    };
    const tick = (moving = true) => {
      clearTimeout(timer);
      const begins = when(start);
      if (Number.isNaN(begins)) return;
      let ends = when(end);
      if (Number.isNaN(ends) || ends < begins) ends = begins;
      let left = Math.max(0, Math.round((begins - Date.now()) / 1000));
      const parts = {};
      Object.entries(SPAN).forEach(([unit, span]) => {
        parts[unit] = Math.floor(left / span);
        left -= parts[unit] * span;
      });
      values.forEach((el) => show(el, String(parts[el.dataset.unit] ?? 0).padStart(2, '0'), moving && state === 'count'));
      if (begins > Date.now()) {
        turn('count', moving);
        const sentence = parts.days + parts.hours + parts.minutes
          ? `${parts.days} days, ${parts.hours} hours, ${parts.minutes} minutes left`
          : 'Less than a minute left';
        if (sentence !== said) sr.textContent = said = sentence;
        return schedule();
      }
      const next = Date.now() >= ends ? 'over' : 'live';
      // At zero, 00 lands first, then the next state takes over
      if (state === 'count' && moving && !reduceMotion) {
        timer = setTimeout(() => {
          turn(next, true);
          schedule();
        }, 900);
        return;
      }
      turn(next, moving);
      schedule();
    };

    tick(false);
    const observer = new MutationObserver(() => tick());
    [start, end].forEach((el) => el && observer.observe(el, { attributes: true, attributeFilter: ['datetime'] }));
    signal.addEventListener('abort', () => {
      observer.disconnect();
      clearTimeout(timer);
      stop(motion);
      stop(entrance);
      sr.remove();
    });

    if (reduceMotion) return root.classList.add('is-shown');

    const rise = (el, delay, duration) => animate(entrance, el, [{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration, delay });
    const play = async () => {
      await decoded(root);
      if (signal.aborted) return;
      stop(entrance);
      // A state change or a digit still on its way lands at once: the entrance brings the current state in
      stop(motion);
      values.forEach((el) => [...el.children].forEach((cell) => settle(cell)?.getAnimations().forEach((a) => a.cancel())));
      root.classList.toggle('is-over', state === 'over');
      root.classList.add('is-shown');
      rise(q('.kodza-hero-event__eyebrow .kodza-hero-event__rise'), 0, 1000);
      root.querySelectorAll('.kodza-hero-event__line .kodza-hero-event__rise').forEach((line, i) => rise(line, 110 + i * 125, 1170));
      // The curtain: both layers on transforms, the picture settles from a slight zoom
      animate(entrance, q('.kodza-hero-event__curtain'), [{ transform: 'translateY(-100%)' }, { transform: 'none' }], { duration: 1350, delay: 200 });
      animate(entrance, q('.kodza-hero-event__hold'), [{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: 1350, delay: 200 });
      animate(entrance, q('.kodza-hero-event__frame img'), [{ transform: 'scale(1.2)' }, { transform: 'none' }], { duration: 2000, delay: 200, easing: SOFT });
      // The hairline draws from the left, then the count rises from under it, unit by unit
      animate(entrance, status, [{ transform: 'scaleX(0)' }, { transform: 'none' }], { duration: 1100, delay: 760, pseudoElement: '::before' });
      const rising = state === 'count' ? [...states.count.children] : [states[state]];
      rising.forEach((el, i) => animate(entrance, el, [{ transform: 'translateY(110%)' }, { transform: 'none' }], { duration: 1000, delay: 840 + i * 70 }));
      [q('.kodza-hero-event__lead'), q('.kodza-hero-event__actions')].forEach((el, i) => {
        animate(entrance, el, [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: 700 + i * 110, easing: SOFT });
      });
      // The faint caption is fully there halfway up: never read half-faded
      animate(entrance, q('.kodza-hero-event__caption'), [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, offset: 0.5 }, { opacity: 1, transform: 'none' }], { duration: 900, delay: 920, easing: SOFT });
    };

    root.addEventListener('kodza:replay', play, { signal });
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      io.disconnect();
      play();
    }, { rootMargin: '0px 0px -15% 0px' });
    signal.addEventListener('abort', () => io.disconnect());
    Promise.all([document.fonts?.ready, decoded(root)]).then(() => {
      if (!signal.aborted) io.observe(root);
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
