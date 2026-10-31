// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Hero Rotate
// Plays the Hero Split entrance once the section is in view, its picture decoded and the fonts
// in, then turns the words: the next word rolls up into place as the old one leaves through the
// top, and the matching picture opens from the top edge over the last one, with the same timing
// and curve, while the count rolls with them. The ring around the pause button fills until the next
// word; it waits while the picture is hovered, a link in the hero has the focus, the hero is out
// of view or the tab hidden. With reduced motion, the first word and picture simply stay.
// "kodza:replay" plays the entrance again from the first word.
(() => {
  const SELECTOR = '.kodza-hero-rotate';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GLIDE = 'cubic-bezier(0.6, 0, 0.1, 1)'; // slow start, long settle
  const SOFT = 'cubic-bezier(0.25, 1, 0.5, 1)';
  const TURN = 1200; // one stroke: the word, the picture, the count and the ring move together

  const decoded = (root) => Promise.all([...root.querySelectorAll('img')].slice(0, 1).map((img) => img.decode().catch(() => {})));
  const pad = (n) => String(n).padStart(2, '0');

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    if (reduceMotion) return root.classList.add('is-shown');
    const q = (s) => root.querySelector(s);
    const slot = q('.kodza-hero-rotate__words');
    const slides = [...root.querySelectorAll('.kodza-hero-rotate__slide')];
    const words = slot ? [...slot.children].map((el) => el.textContent) : [];
    const count = q('.kodza-hero-rotate__index');
    const button = q('.kodza-hero-rotate__pause');
    const progress = q('.kodza-hero-rotate__progress');
    const interval = parseInt(root.dataset.interval, 10) || 3600;
    const turns = words.length > 1;
    let entrance = [];
    let motion = [];
    let index = 0;
    let ring = [];
    let timer = null;
    let rounds = 0;
    let started = 0;
    let visible = false;
    let hovered = false;
    let focused = false;
    let held = false;

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

    // The word: screen readers get every word once, the turning one is for the eyes
    const make = (text) => Object.assign(document.createElement('span'), { className: 'kodza-hero-rotate__word', textContent: text });
    if (turns) {
      const sr = Object.assign(document.createElement('span'), { className: 'kodza-hero-rotate__sr', textContent: words.join(', ') });
      slot.after(sr);
      slot.setAttribute('aria-hidden', 'true');
      root.classList.add('is-live');
    }

    const roll = (text) => {
      if (!count) return;
      const old = count.lastElementChild;
      const digits = Object.assign(document.createElement('span'), { textContent: text });
      count.append(digits);
      animate(motion, old, [{ transform: 'none' }, { transform: 'translateY(-100%)' }], { duration: TURN, fill: 'forwards' })?.finished.then(() => old.remove(), () => {});
      animate(motion, digits, [{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: TURN });
    };

    // Back to the first word and picture, without motion
    const reset = () => {
      stop(motion);
      index = 0;
      if (!turns) return;
      slot.replaceChildren(make(words[0]));
      slides.forEach((slide, i) => {
        slide.classList.toggle('is-current', i === 0);
        slide.classList.remove('is-leaving');
      });
      if (count) count.replaceChildren(Object.assign(document.createElement('span'), { textContent: '01' }));
    };

    const next = async (round) => {
      const from = index;
      const to = (index + 1) % words.length;
      const coming = slides[to % slides.length];
      const leaving = slides[from % slides.length];
      // The picture is ready before anything moves, so the word never runs ahead of it
      await coming?.querySelector('img')?.decode().catch(() => {});
      if (round !== rounds) return;
      index = to;

      const old = slot.lastElementChild;
      const word = make(words[to]);
      const width = slot.offsetWidth;
      slot.append(word);
      // The two words roll up together, like a strip, while the slot eases to the new width;
      // the old word and the held width go in the same task, so the slot never flashes wider
      const sized = animate(motion, slot, [{ width: `${width}px` }, { width: `${word.offsetWidth}px` }], { duration: TURN, fill: 'forwards' });
      animate(motion, old, [{ transform: 'none' }, { transform: 'translateY(-120%)' }], { duration: TURN, fill: 'forwards' }).finished.then(() => {
        old.remove();
        sized.cancel();
      }, () => {});
      animate(motion, word, [{ transform: 'translateY(120%)' }, { transform: 'none' }], { duration: TURN });
      roll(pad(to + 1));

      if (coming && coming !== leaving) {
        leaving.classList.remove('is-current');
        leaving.classList.add('is-leaving');
        coming.classList.add('is-current');
        // The new picture opens from the top edge in the same stroke as the word; the last one
        // sinks a little under it
        const opened = animate(motion, coming.querySelector('.kodza-hero-rotate__curtain'), [{ transform: 'translateY(-100%)' }, { transform: 'none' }], { duration: TURN });
        animate(motion, coming.querySelector('.kodza-hero-rotate__hold'), [{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: TURN });
        animate(motion, coming.querySelector('img'), [{ transform: 'scale(1.2)' }, { transform: 'none' }], { duration: TURN * 1.5, easing: SOFT });
        const sink = animate(motion, leaving.querySelector('.kodza-hero-rotate__hold'), [{ transform: 'none' }, { transform: 'translateY(14%)' }], { duration: TURN, fill: 'forwards' });
        opened.finished.then(() => {
          leaving.classList.remove('is-leaving');
          sink.cancel();
        }, () => {});
      }
      // The next picture starts loading now, well before its turn
      slides[(to + 1) % slides.length]?.querySelector('img')?.decode().catch(() => {});
    };

    // The timer is the ring itself: it fills over the interval, then empties forward as the
    // word turns. It holds whenever something asks it to wait.
    const waiting = () => held || hovered || focused || !visible || document.hidden;
    const sync = () => {
      if (!timer) return;
      if (waiting()) timer.pause();
      else timer.play();
    };
    const tick = (round) => {
      const filled = progress.animate([{ strokeDashoffset: 100 }, { strokeDashoffset: 0 }], { duration: interval, easing: 'linear', fill: 'forwards' });
      timer = filled;
      sync();
      filled.finished.then(() => {
        if (round !== rounds) return;
        timer = null;
        next(round);
        const emptied = progress.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: -100 }], { duration: TURN, easing: GLIDE, fill: 'forwards' });
        ring.push(filled, emptied);
        emptied.finished.then(() => {
          stop(ring);
          if (round === rounds) tick(round);
        }, () => {});
      }, () => {});
    };
    const halt = () => {
      rounds += 1;
      timer?.cancel();
      timer = null;
      stop(ring);
      clearTimeout(started);
    };

    const play = async () => {
      await decoded(root);
      if (signal.aborted) return;
      stop(entrance);
      halt();
      reset();
      root.classList.add('is-shown');
      const rise = (el, delay, duration) => animate(entrance, el, [{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration, delay });
      rise(q('.kodza-hero-rotate__eyebrow .kodza-hero-rotate__rise'), 0, 1000);
      root.querySelectorAll('.kodza-hero-rotate__line .kodza-hero-rotate__rise').forEach((line, i) => rise(line, 110 + i * 125, 1170));
      // The curtain: both layers on transforms, the picture settles from a slight zoom
      const first = slides[0];
      animate(entrance, first?.querySelector('.kodza-hero-rotate__curtain'), [{ transform: 'translateY(-100%)' }, { transform: 'none' }], { duration: 1350, delay: 200 });
      animate(entrance, first?.querySelector('.kodza-hero-rotate__hold'), [{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: 1350, delay: 200 });
      animate(entrance, first?.querySelector('img'), [{ transform: 'scale(1.2)' }, { transform: 'none' }], { duration: 2000, delay: 200, easing: SOFT });
      [q('.kodza-hero-rotate__lead'), q('.kodza-hero-rotate__actions')].forEach((el, i) => {
        animate(entrance, el, [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: 700 + i * 110, easing: SOFT });
      });
      // The faint caption is fully there halfway up: never read half-faded
      animate(entrance, q('.kodza-hero-rotate__caption'), [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, offset: 0.5 }, { opacity: 1, transform: 'none' }], { duration: 900, delay: 920, easing: SOFT });
      // The words start turning once the picture has opened
      const round = rounds;
      if (turns && progress) started = setTimeout(() => tick(round), 1550);
      slides[1]?.querySelector('img')?.decode().catch(() => {});
    };

    reset();
    button?.addEventListener('click', () => {
      held = !held;
      button.setAttribute('aria-pressed', String(held));
      sync();
    }, { signal });
    const media = q('.kodza-hero-rotate__frame');
    media?.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse') return;
      hovered = true;
      sync();
    }, { signal });
    media?.addEventListener('pointerleave', () => {
      hovered = false;
      sync();
    }, { signal });
    // A link reached with the keyboard holds the words; the pause button has its own say
    root.addEventListener('focusin', (event) => {
      focused = event.target !== button && event.target.matches(':focus-visible');
      sync();
    }, { signal });
    root.addEventListener('focusout', (event) => {
      if (!root.contains(event.relatedTarget)) focused = false;
      sync();
    }, { signal });
    document.addEventListener('visibilitychange', sync, { signal });

    root.addEventListener('kodza:replay', play, { signal });
    signal.addEventListener('abort', () => {
      stop(entrance);
      stop(motion);
      halt();
    });
    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    seen.observe(root);
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      io.disconnect();
      play();
    }, { rootMargin: '0px 0px -15% 0px' });
    signal.addEventListener('abort', () => {
      io.disconnect();
      seen.disconnect();
    });
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
