// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Review Summary
// The average rolls up to its value (the engine of Counter) while the stars and the five bars fill
// in turn, once the summary comes into view. A bar is a button: it shows only the reviews with that
// rating, the others fade out and those that stay glide to their new place; again, or "Show all",
// brings them all back. A long review stops after a few lines, with "Read more" under it.
// The words come from the markup ("Read more" and "Read less": data-more and data-less on
// .kodza-review-summary__reviews); the timings are the constants below.
// "kodza:replay" on the element plays the entrance again.
(() => {
  const SELECTOR = '.kodza-review-summary';
  const GLIDE = 560; // ms, a review sliding to its new place, and the list to its new height
  const LEAVE = 240; // ms, a review fading out of the filter
  const ENTER = 420; // ms, a review coming back
  const OPEN = 520; // ms, "Read more" opening the review
  const FOLD = 420; // ms, and folding it back
  const ROLL = 380; // ms, a word of the status rolling to the next
  const THRESHOLD = 0.35; // share of the summary in view before it fills
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const make = (tag, className, text) => Object.assign(document.createElement(tag), className ? { className } : {}, text != null ? { textContent: text } : {});

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const inline = root.classList.contains('kodza-review-summary--inline');

    // The average: a column of spinning digits per digit (screen readers keep the plain text)
    const strips = [];
    root.querySelectorAll('.kodza-review-summary__value').forEach((value) => {
      const text = value.textContent.trim();
      const count = (text.match(/\d/g) || []).length;
      let rank = 0;
      value.setAttribute('aria-hidden', 'true');
      value.after(make('span', 'kodza-review-summary__sr', text));
      value.replaceChildren(...[...text].map((char) => {
        if (!/\d/.test(char)) return make('span', 'kodza-review-summary__char', char);
        // The digits on the right spin more: one turn on the left, up to three on the right
        const turns = 1 + Math.round((rank / Math.max(1, count - 1)) * 2);
        const column = make('span', 'kodza-review-summary__digit');
        const strip = make('span', 'kodza-review-summary__strip');
        for (let i = 0; i < (turns + 1) * 10; i++) strip.append(make('span', '', i % 10));
        column.append(make('span', 'kodza-review-summary__fit', char), strip);
        strips.push({ strip, stop: turns * 10 + Number(char), rank: rank++ });
        return column;
      }));
    });
    const land = () => strips.forEach(({ strip, stop }) => (strip.style.transform = `translateY(${-stop * 1.1}em)`));
    const roll = () => strips.forEach(({ strip, stop, rank }) => {
      strip.getAnimations().forEach((animation) => animation.cancel());
      strip.style.transform = '';
      strip.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${-stop * 1.1}em)` }], {
        duration: (1500 + rank * 160) * pace,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'forwards',
      });
    });

    // The entrance: empty until the summary is in view, then the stars and the bars fill (CSS)
    const enter = () => {
      root.classList.add('is-in');
      roll();
    };
    if (still || !('IntersectionObserver' in window)) land();
    else {
      root.classList.add('is-armed');
      const io = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        io.disconnect();
        enter();
      }, { threshold: THRESHOLD });
      io.observe(inline ? root : root.querySelector('.kodza-review-summary__summary') || root);
      signal.addEventListener('abort', () => io.disconnect());
      root.addEventListener('kodza:replay', () => {
        root.classList.remove('is-in');
        void root.offsetWidth; // empty again for one frame, so the fill plays from the start
        enter();
      }, { signal });
    }

    const list = root.querySelector('.kodza-review-summary__reviews');
    if (!list) return;
    const reviews = [...list.querySelectorAll('.kodza-review-summary__review')];
    const bars = [...root.querySelectorAll('.kodza-review-summary__bar')];
    const empty = list.querySelector('.kodza-review-summary__empty');

    // "Read more": a long review stops after a few lines, and opens at its real height
    const moreText = list.dataset.more || 'Read more';
    const lessText = list.dataset.less || 'Read less';
    const folds = new Map();
    reviews.forEach((review) => {
      const quote = review.querySelector('.kodza-review-summary__quote');
      if (!quote) return;
      let button = null;
      let open = false;
      let width = 0;
      let run = null;
      const toggle = () => {
        const from = quote.offsetHeight;
        run?.cancel();
        open = !open;
        button.classList.toggle('is-open', open);
        button.setAttribute('aria-expanded', String(open));
        button.firstChild.toggleAttribute('aria-hidden', open);
        button.lastChild.toggleAttribute('aria-hidden', !open);
        quote.classList.toggle('is-closing', !open);
        quote.classList.remove('is-open');
        const low = quote.offsetHeight;
        quote.classList.add('is-open');
        const to = open ? quote.offsetHeight : low;
        const done = () => {
          run = null;
          if (!open) quote.classList.remove('is-open', 'is-closing');
        };
        if (still) return done();
        run = quote.animate([{ height: `${from}px` }, { height: `${to}px` }], {
          duration: (open ? OPEN : FOLD) * pace,
          easing: open ? EASE : 'cubic-bezier(0.65, 0, 0.35, 1)',
        });
        run.onfinish = done;
      };
      // Long or not depends on the width: measured again when it changes, never while hidden or open
      folds.set(quote, () => {
        const w = quote.clientWidth;
        if (!w || w === width || open) return;
        width = w;
        quote.classList.add('is-long');
        const long = quote.scrollHeight > quote.clientHeight + 1;
        quote.classList.toggle('is-long', long);
        if (long && !button) {
          button = make('button', 'kodza-review-summary__more');
          button.type = 'button';
          button.setAttribute('aria-expanded', 'false');
          const less = make('span', '', lessText);
          less.setAttribute('aria-hidden', 'true');
          button.append(make('span', '', moreText), less);
          button.addEventListener('click', toggle, { signal });
          quote.after(button);
        } else if (!long && button) {
          button.remove();
          button = null;
        }
      });
    });
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver((entries) => entries.forEach((entry) => folds.get(entry.target)?.()));
      folds.forEach((_, quote) => ro.observe(quote));
      signal.addEventListener('abort', () => ro.disconnect());
    } else folds.forEach((measure) => measure());

    // The status over the list: its words roll (the old one goes up, the new one comes from below)
    const status = root.querySelector('.kodza-review-summary__status');
    const label = root.querySelector('.kodza-review-summary__status-label');
    const count = root.querySelector('.kodza-review-summary__status-count');
    const allLabel = label ? label.textContent.trim() : '';
    let live = null;
    [label, count].forEach((el) => {
      if (!el) return;
      el.replaceChildren(make('span', '', el.textContent.trim()));
      el.classList.add('kodza-review-summary__slot');
    });
    if (status) {
      // Screen readers hear the change once, from a quiet copy, not the words on their way out
      status.setAttribute('aria-hidden', 'true');
      live = make('span', 'kodza-review-summary__sr', `${allLabel}: ${reviews.length}`);
      live.setAttribute('aria-live', 'polite');
      status.after(live);
    }
    const rollTo = (el, text) => {
      if (!el) return;
      const words = [...el.children];
      const current = words.pop();
      if (current.textContent === text) return;
      words.forEach((word) => word.remove());
      const word = make('span', '', text);
      if (still) return current.replaceWith(word);
      [el, current].forEach((node) => node.getAnimations().forEach((animation) => animation.cancel()));
      const from = el.offsetWidth;
      current.replaceWith(word);
      const to = el.offsetWidth;
      el.prepend(current);
      current.setAttribute('aria-hidden', 'true');
      const timing = { duration: ROLL * pace, easing: EASE };
      current.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-100%)', opacity: 0 }], { ...timing, fill: 'forwards' })
        .onfinish = () => current.remove();
      word.animate([{ transform: 'translateY(100%)', opacity: 0 }, { transform: 'none', opacity: 1 }], timing);
      if (from !== to) el.animate([{ width: `${from}px` }, { width: `${to}px` }], timing);
    };

    // The filter. A review on its way out is laid over the grid where it was, behind the others, and
    // fades; the others glide from where they were (measured before and after, FLIP)
    const leaving = new Set();
    const moves = new Map();
    let sizing = null;
    let current = null;
    const release = (review) => {
      ['position', 'left', 'top', 'width', 'margin', 'z-index'].forEach((name) => review.style.removeProperty(name));
      review.inert = false;
    };
    const arrange = (shows, shown) => {
      if (still) {
        reviews.forEach((review) => (review.hidden = !shows(review)));
        if (empty) empty.hidden = shown > 0;
        return;
      }
      // A parent scaled by transform (the catalogue, a theme): screen pixels back to the list's own
      const scale = list.getBoundingClientRect().width / list.offsetWidth || 1;
      const box = list.getBoundingClientRect();
      const height = list.offsetHeight;
      const from = new Map();
      reviews.forEach((review) => {
        if (review.hidden || (leaving.has(review) && !shows(review))) return;
        const rect = review.getBoundingClientRect();
        from.set(review, {
          x: (rect.left - box.left) / scale,
          y: (rect.top - box.top) / scale,
          width: review.offsetWidth,
          opacity: Number(getComputedStyle(review).opacity),
        });
      });
      if (sizing) {
        sizing.cancel();
        sizing = null;
        list.classList.remove('is-sizing');
      }
      reviews.forEach((review) => {
        if (leaving.has(review) && !shows(review)) return; // already on its way out
        moves.get(review)?.cancel();
        moves.delete(review);
        if (leaving.delete(review)) release(review);
      });
      reviews.forEach((review) => {
        if (leaving.has(review)) return;
        const was = from.get(review);
        if (shows(review) || !was) return void (review.hidden = !shows(review));
        leaving.add(review);
        review.inert = true;
        Object.assign(review.style, { position: 'absolute', left: `${was.x}px`, top: `${was.y}px`, width: `${was.width}px`, margin: '0', zIndex: '-1' });
        const out = review.animate([{ opacity: was.opacity, transform: 'none' }, { opacity: 0, transform: 'scale(0.96)' }], {
          duration: LEAVE * pace,
          easing: 'cubic-bezier(0.4, 0, 1, 1)',
          fill: 'forwards',
        });
        moves.set(review, out);
        out.onfinish = () => {
          leaving.delete(review);
          moves.delete(review);
          review.hidden = true;
          release(review);
          out.cancel();
        };
      });
      if (empty) {
        const was = !empty.hidden;
        empty.hidden = shown > 0;
        if (!empty.hidden && !was) empty.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ENTER * pace, delay: LEAVE * pace, easing: EASE, fill: 'backwards' });
      }
      const next = list.offsetHeight;
      let k = 0;
      reviews.forEach((review) => {
        if (review.hidden || leaving.has(review)) return;
        const was = from.get(review);
        if (!was) {
          moves.set(review, review.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], {
            duration: ENTER * pace,
            delay: (LEAVE * 0.6 + k++ * 50) * pace,
            easing: EASE,
            fill: 'backwards',
          }));
          return;
        }
        const dx = was.x - review.offsetLeft;
        const dy = was.y - review.offsetTop;
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && was.opacity === 1) return;
        moves.set(review, review.animate([{ transform: `translate(${dx}px, ${dy}px)`, opacity: was.opacity }, { transform: 'none', opacity: 1 }], {
          duration: GLIDE * pace,
          easing: EASE,
        }));
      });
      // The list takes its new height in the same time, so the page under it never jumps. Shorter,
      // it waits for the reviews on their way out to be mostly gone
      if (Math.abs(next - height) > 0.5) {
        list.classList.add('is-sizing');
        sizing = list.animate([{ height: `${height}px` }, { height: `${next}px` }], {
          duration: GLIDE * pace,
          delay: next < height ? LEAVE * 0.6 * pace : 0,
          easing: EASE,
          fill: 'backwards',
        });
        sizing.onfinish = () => {
          sizing = null;
          list.classList.remove('is-sizing');
        };
      }
    };
    const filter = (rating) => {
      current = rating === current ? null : rating;
      bars.forEach((bar) => bar.setAttribute('aria-pressed', String(bar.dataset.rating === current)));
      root.classList.toggle('is-filtered', current !== null);
      const shows = (review) => current === null || review.dataset.rating === current;
      const shown = reviews.filter(shows).length;
      const bar = bars.find((item) => item.dataset.rating === current);
      const word = bar ? (bar.querySelector('.kodza-review-summary__bar-label') || bar).textContent.trim() : allLabel;
      rollTo(label, word);
      rollTo(count, String(shown));
      if (live) live.textContent = `${word}: ${shown}`;
      arrange(shows, shown);
    };
    bars.forEach((bar) => bar.addEventListener('click', () => filter(bar.dataset.rating), { signal }));
    root.querySelector('.kodza-review-summary__clear')?.addEventListener('click', (event) => {
      const bar = bars.find((item) => item.dataset.rating === current);
      filter(null);
      // From the keyboard, the focus goes back to the bar instead of the button that just went away
      if (event.detail === 0) bar?.focus();
    }, { signal });
    signal.addEventListener('abort', () => {
      sizing?.cancel();
      moves.forEach((animation) => animation.cancel());
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
