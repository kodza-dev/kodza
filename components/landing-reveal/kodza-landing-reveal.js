// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Landing Reveal
// A preloader for the first visit: it counts the files the hero really needs (its images,
// decoded, and the fonts) while images come up one by one onto a pile. At 100 the hero image
// comes up last and grows into its place, the title rises from its mask, then the rest comes in.
// A click or any key skips it; data-once plays it once per visit; "kodza:replay" plays it again.
// A script that comes after the page (Next) still plays it; the heroes that come later (an app's
// next page) open straight on the hero.
// Built in three parts, so the other reveals of the family only swap the middle one:
//   1. counting  — real progress, paced between a minimum and a maximum time
//   2. hand-over — this reveal's own move (here: the pile, then its last image into the hero)
//   3. entrance  — the title lines, then everything marked data-enter
(() => {
  const SELECTOR = '.kodza-landing-reveal';
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const RISE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const SWING = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const SEEN = 'kodza-landing-reveal'; // sessionStorage key, for data-once
  // What the loader takes along when it leaves the hero: its settings, and the type the site gives it
  const VARS = [
    ...['bg', 'fg', 'muted', 'line', 'card', 'side', 'brand', 'brand-blend'].map((name) => `--kz-landing-reveal-${name}`),
    ...['display', 'display-weight', 'display-scale', 'display-tracking', 'display-case', 'mono'].map((name) => `--kz-font-${name}`),
  ];
  const HOLD_KEYS = [' ', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  const BEAT = 600; // one image every 0.6 s: each one is seen, then covered
  const LAST = 820; // the hero image rises onto the pile while the count ends: 100 as it settles
  const inOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2); // SWING, in JS
  let playing = null; // one intro at a time on a page

  // Seen already this visit: the loader of a data-once hero must not show, not even for a frame
  try {
    if (sessionStorage.getItem(SEEN)) document.documentElement.setAttribute('data-kodza-landing-reveal', 'seen');
  } catch {
    // storage blocked: the intro simply plays
  }

  const seconds = (value, fallback) => {
    const n = parseFloat(value);
    if (!isFinite(n)) return fallback;
    return /ms$/.test(value) ? n : n * 1000;
  };

  // The counter: one wheel per digit (0 to 9, then 0 again), turned like an odometer: a digit
  // only moves on when the one to its right goes from 9 to 0
  const wheels = (count) => {
    count.textContent = '';
    return [0, 1, 2].map(() => {
      const wheel = document.createElement('span');
      const digits = document.createElement('span');
      wheel.className = 'kodza-landing-reveal__wheel';
      digits.className = 'kodza-landing-reveal__digits';
      digits.textContent = '0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n0';
      wheel.append(digits);
      count.append(wheel);
      return digits;
    });
  };

  const roll = (digits, value) => {
    // Each number holds, then clicks over to the next one: legible even while it counts
    const whole = Math.floor(value);
    const step = Math.max(0, (value - whole - 0.6) / 0.4);
    const ones = (whole + step * step * (3 - 2 * step)) % 10;
    const carry = Math.max(0, ones - 9);
    const turns = [value >= 100 ? 1 : Math.max(0, value - 99), (Math.floor(value / 10) % 10) + carry, ones];
    digits.forEach((strip, i) => {
      strip.style.transform = `translateY(${(-turns[i]).toFixed(3)}em)`;
    });
  };

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const loader = root.querySelector('.kodza-landing-reveal__loader');
    if (!loader) return;
    const image = root.querySelector('.kodza-landing-reveal__image');
    const media = root.querySelector('.kodza-landing-reveal__media');
    const deck = loader.querySelector('.kodza-landing-reveal__deck');
    const cards = [...loader.querySelectorAll('.kodza-landing-reveal__card')];
    const count = loader.querySelector('.kodza-landing-reveal__count');
    const done = loader.querySelector('.kodza-landing-reveal__done');
    const total = loader.querySelector('.kodza-landing-reveal__total');
    const small = [...loader.querySelectorAll('.kodza-landing-reveal__tally, .kodza-landing-reveal__note, .kodza-landing-reveal__caption')];
    const brand = loader.querySelector('.kodza-landing-reveal__brand');
    const logo = root.querySelector('.kodza-landing-reveal__logo');
    const caption = loader.querySelector('.kodza-landing-reveal__caption');
    const lines = [...root.querySelectorAll('.kodza-landing-reveal__line')];
    const items = [...root.querySelectorAll('[data-enter]')].filter((el) => !loader.contains(el));
    const digits = count ? wheels(count) : [];
    // One caption per image of the pile (data-caption), the hero image's last
    const notes = caption ? [...cards, image].map((img) => {
      const span = document.createElement('span');
      span.textContent = img?.dataset.caption || '';
      caption.append(span);
      return span;
    }) : [];
    const home = [loader.parentNode, loader.nextSibling];
    const css = (name) => getComputedStyle(root).getPropertyValue(`--kz-landing-reveal-${name}`).trim();

    // The last card is the hero image itself, copied: same file, same crop, so the hand-over
    // ends exactly on it
    let last = null;
    if (image) {
      last = image.cloneNode(false);
      last.className = 'kodza-landing-reveal__last';
      last.alt = '';
      last.removeAttribute('loading');
      last.hidden = true;
      loader.append(last);
    }

    let run = null; // the intro being played

    // The page stays where it is while the loader is up: the wheel, a swipe or the scroll keys
    // move nothing. A dragged scrollbar is put back
    loader.addEventListener('wheel', (event) => event.preventDefault(), { passive: false, signal });
    loader.addEventListener('touchmove', (event) => event.preventDefault(), { passive: false, signal });
    loader.addEventListener('click', () => skip(), { signal });
    window.addEventListener('scroll', () => {
      if (run?.hold && (scrollX !== run.hold[0] || scrollY !== run.hold[1])) window.scrollTo({ left: run.hold[0], top: run.hold[1], behavior: 'instant' });
    }, { signal });
    // Any key skips it (shortcuts with Ctrl, Cmd or Alt still work, and Tab still moves on)
    document.addEventListener('keydown', (event) => {
      if (!run || event.ctrlKey || event.metaKey || event.altKey || /^(Shift|Control|Alt|Meta|CapsLock|Fn)$/.test(event.key)) return;
      if (run.hold && HOLD_KEYS.includes(event.key)) event.preventDefault();
      skip();
    }, { signal });
    // Once the loader is gone, a click anywhere hurries the entrance along
    document.addEventListener('pointerdown', () => run?.phase === 'enter' && skip(), { signal });
    root.addEventListener('kodza:replay', () => !motion.matches && start(true), { signal });
    // Back from another page (bfcache) halfway through: the hero as it ends up
    window.addEventListener('pageshow', (event) => event.persisted && run && end(), { signal });

    // ---------- 1. Counting ----------

    // What the hero really waits for: its images (decoded if they are still coming, so they
    // paint at once) and the fonts. A file counts once it is in, or once it failed: a broken one
    // never holds the page
    const track = () => {
      const jobs = [...cards, image].filter(Boolean).map((img) => (img.complete && img.naturalWidth ? Promise.resolve() : img.decode()));
      const token = run;
      if (document.fonts) {
        jobs.push(document.fonts.ready);
        document.fonts.ready.then(() => run === token && fit()); // the logo moves with its font
      }
      jobs.forEach((job) => job.then(() => {}, () => {}).then(() => {
        if (run === token) run.done++;
      }));
      if (total) total.textContent = String(jobs.length);
      if (done) done.textContent = '0';
      return jobs.length;
    };

    // The number follows the files and is never ahead of them. Once they are all in (and not
    // before the minimum, nor after the maximum), the hero image rises onto the pile and the
    // count ends with it: 100 the moment it settles
    const tick = (now) => {
      if (!run || (run.phase !== 'load' && run.phase !== 'last')) return;
      run.t0 = run.t0 || now; // a tab opened in the background starts counting when it is shown
      const t = now - run.t0;
      const dt = Math.min(64, now - (run.at || now));
      run.at = now;
      if (run.phase === 'load') {
        const pace = 1 - Math.pow(1 - Math.min(1, t / run.min), 2);
        const target = Math.floor(Math.min(run.done / run.total, pace) * 100) / 100;
        run.value += (target - run.value) * (1 - Math.exp(-dt / 110));
        if (Math.abs(target - run.value) < 0.004) run.value = target; // waiting for a file: a whole number, not a digit half rolled
        const ready = run.done >= run.total && t >= run.min - LAST;
        // (never on top of an image still rising, unless the maximum is reached)
        if ((ready && now >= run.beat - BEAT * 0.25) || t >= run.max - LAST) {
          if (!rise(now)) return;
        } else if (now >= run.beat) {
          reveal(cards[run.next % cards.length]);
          run.beat = now + BEAT;
        }
      } else {
        const p = Math.min(1, (now - run.from[1]) / LAST);
        run.value = run.from[0] + (1 - run.from[0]) * inOut(p);
      }
      roll(digits, run.value * 100);
      // The files shown keep up with the number, so the two never contradict each other
      const shown = Math.min(run.done, Math.floor(run.value * run.total + 1e-6));
      if (done && shown !== run.shown) done.textContent = String((run.shown = shown));
      if (run.phase === 'last' && run.value >= 1) {
        handover();
        return;
      }
      run.frame = requestAnimationFrame(tick);
    };

    // ---------- 2. Hand-over: the pile ----------

    const stack = () => run.order.forEach((card, i) => (card.style.zIndex = String(run.order.length - i)));

    // One pile: each image rises over the one before from behind its own bottom edge, like a line
    // of text from its mask (no frame, nothing shows before it). `lead`: a head start to wait for
    const reveal = (card, lead = 0) => {
      if (!card) return;
      run.order = [card, ...run.order.filter((other) => other !== card)]; // top first
      stack();
      run.next++;
      say(cards.indexOf(card), lead);
      // (the edge it rises from is as round as the image: the pile below keeps its corners)
      const round = `round ${parseFloat(getComputedStyle(card).borderTopLeftRadius) || 0}px`;
      run.anims.push(card.animate([
        { transform: 'translateY(100%)', clipPath: `inset(0% 0% 100% 0% ${round})` },
        { transform: 'translateY(0%)', clipPath: `inset(0% 0% 0% 0% ${round})` },
      ], { duration: 800, delay: lead, easing: SWING, fill: 'both' }));
    };

    const add = (el, frames, delay, duration, easing = RISE, extra = {}) => {
      const animation = el.animate(frames, { delay, duration, easing, fill: 'both', ...extra });
      run.anims.push(animation);
      return animation;
    };

    // The caption under the pile rolls with the image: the old one up, the new one from below
    const say = (i, lead = 0) => {
      const next = notes[i];
      if (!next || !next.textContent) return;
      const before = notes[run.said];
      if (before && before !== next) add(before, [{ transform: 'translateY(0%)' }, { transform: 'translateY(-110%)' }], lead, 800, SWING);
      add(next, [{ transform: 'translateY(110%)' }, { transform: 'translateY(0%)' }], lead, 800, SWING);
      run.said = i;
    };

    // The loader's own entrance: the digits rise from their masks one by one, then the small print
    const arrive = (lead = 0) => {
      const up = (el, delay) => el && add(el, [
        { transform: 'translateY(100%)', clipPath: 'inset(0% -30% 100% -30%)' },
        { transform: 'translateY(0%)', clipPath: 'inset(0% -30% 0% -30%)' },
      ], lead + delay, 900);
      digits.forEach((strip, i) => up(strip.parentNode, 80 + i * 70));
      small.filter((el) => el !== caption).forEach((el, i) => up(el, 240 + i * 80));
    };

    // The hero's logo, on the pixel where the hero has it: the header is there from the start
    const fit = () => {
      if (!brand || !logo) return;
      brand.innerHTML = logo.innerHTML;
      const box = logo.getBoundingClientRect();
      const frame = loader.getBoundingClientRect();
      const k = loader.offsetWidth ? frame.width / loader.offsetWidth : 1;
      const style = getComputedStyle(logo);
      Object.assign(brand.style, {
        left: `${(box.left - frame.left) / k}px`,
        top: `${(box.top - frame.top) / k}px`,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        letterSpacing: style.letterSpacing,
        textTransform: style.textTransform,
      });
    };

    // The last image of the pile is the hero image itself: its copy sits on the hero image,
    // scaled down and cut to the size of the frame (the same crop as object-fit: cover there),
    // and rises like the others while the count ends
    const rise = (now) => {
      const box = image?.getBoundingClientRect();
      if (!last || !box || !box.width || !box.height) {
        skip();
        return false;
      }
      run.phase = 'last';
      run.from = [run.value, now];
      const frame = loader.getBoundingClientRect();
      const k = loader.offsetWidth ? frame.width / loader.offsetWidth : 1; // a scaled page
      const spot = deck.getBoundingClientRect();
      const w = box.width / k;
      const h = box.height / k;
      const cw = spot.width / k;
      const ch = spot.height / k;
      const s = Math.max(cw / w, ch / h);
      const dx = (spot.left + spot.width / 2 - box.left - box.width / 2) / k;
      const dy = (spot.top + spot.height / 2 - box.top - box.height / 2) / k;
      const round = parseFloat(getComputedStyle(cards[0] || deck).borderTopLeftRadius) || 0;
      Object.assign(last.style, {
        left: `${(box.left - frame.left) / k}px`,
        top: `${(box.top - frame.top) / k}px`,
        width: `${w}px`,
        height: `${h}px`,
        objectPosition: getComputedStyle(image).objectPosition,
        zIndex: '1',
      });
      last.hidden = false;
      // On the pile, `below` (0 to 1) of its height still under the edge it rises from, like the
      // other images: moved down, and cut at that edge
      const fh = ch / s;
      const side = ((w - cw / s) / 2).toFixed(2);
      const edge = (h - fh) / 2;
      const r = (round / s).toFixed(2);
      const piled = (below) => ({
        transform: `translate(${dx.toFixed(2)}px, ${(dy + below * ch).toFixed(2)}px) scale(${s.toFixed(4)})`,
        clipPath: `inset(${edge.toFixed(2)}px ${side}px ${(edge + below * fh).toFixed(2)}px ${side}px round ${r}px)`,
      });
      // When the growing image will be under the logo, as a share of the growth (the paper must
      // stay until then: the logo is drawn in difference, it would vanish on the bare page)
      let cover = 0.3;
      if (brand) {
        const b = brand.getBoundingClientRect();
        const need = (from, to, edge) => (from === to ? (edge ? 0 : 1) : Math.min(1, Math.max(0, (from - edge) / (from - to))));
        const e = Math.max(
          b.left < box.left || b.top < box.top || b.right > box.right || b.bottom > box.bottom ? 1 : 0,
          spot.left > b.left ? need(spot.left, box.left, b.left) : 0,
          spot.top > b.top ? need(spot.top, box.top, b.top) : 0,
          spot.right < b.right ? need(spot.right, box.right, b.right) : 0,
          spot.bottom < b.bottom ? need(spot.bottom, box.bottom, b.bottom) : 0,
        );
        // the time it takes on the growth's curve (in-out cubic), with a little margin
        cover = Math.min(1, (e < 0.5 ? Math.cbrt(e / 4) : 1 - Math.cbrt(2 * (1 - e)) / 2) + 0.04);
      }
      run.geo = { dx, dy, cover, settled: piled(0) };
      say(notes.length - 1);
      add(last, [piled(1), run.geo.settled], 0, LAST, SWING);
      return true;
    };

    // At 100: the counter rolls away while the hero image grows into its place in the page, the
    // pile riding under it and the paper lifting. Then the entrance
    const handover = () => {
      run.phase = 'handover';
      const { dx, dy, cover, settled } = run.geo;
      const radius = parseFloat(getComputedStyle(image).borderTopLeftRadius) || 0;
      const ease = css('ease') || SWING;
      const land = 300; // a beat on 100, the hero image settled on the pile
      const grow = 900; // then the hero image grows until it fills the hero

      // (cut above and below only: a digit may spill a little sideways)
      digits.forEach((strip, i) => add(strip.parentNode, [{ transform: 'translateY(0%)', clipPath: 'inset(0% -30% 0% -30%)' }, { transform: 'translateY(-100%)', clipPath: 'inset(100% -30% 0% -30%)' }], land + i * 30, 500, SWING));
      small.forEach((el, i) => add(el, [{ transform: 'translateY(0%)', clipPath: 'inset(0% 0% 0% 0%)' }, { transform: 'translateY(-100%)', clipPath: 'inset(100% 0% 0% 0%)' }], land + 40 + i * 40, 480, SWING));
      // (filled forwards only: until it starts, the rise still shows)
      const growth = add(last, [settled, { transform: 'translate(0px, 0px) scale(1)', clipPath: `inset(0px 0px 0px 0px round ${radius}px)` }], land, grow, ease, { fill: 'forwards' });
      // The paper goes once the image is under the logo, by the time the image has landed
      const lift = Math.max(0.3, cover);
      add(loader, [{ opacity: 1 }, { opacity: 0 }], land + grow * lift, Math.max(1, grow * Math.min(0.45, 1 - lift)), 'ease', { pseudoElement: '::before' });
      // The pile rides under the growing image and lets go of it: nothing is left to take away
      add(deck, [
        { transform: 'translate(0px, 0px)', opacity: 1 },
        { opacity: 0, offset: 0.6 },
        { transform: `translate(${(-dx).toFixed(2)}px, ${(-dy).toFixed(2)}px)`, opacity: 0 },
      ], land, grow, ease, { fill: 'forwards' });
      // The image fills the hero: the text and its veil come in once it has landed, on top of it
      const enterAt = land + grow;
      run.entrance = media ? [add(media, [{ opacity: 0 }, { opacity: 1 }], enterAt, 500, 'ease', { pseudoElement: '::after' })] : [];
      lines.forEach((line, i) => run.entrance.push(add(line, [
        { transform: 'translateY(105%)', clipPath: 'inset(-20% -10% 100% -10%)' },
        { transform: 'translateY(0%)', clipPath: 'inset(-20% -10% -30% -10%)' },
      ], enterAt + 120 + i * 110, 1000)));
      const after = enterAt + 280;
      items.forEach((el, i) => {
        const y = el.dataset.enter === 'down' ? -12 : 14;
        run.entrance.push(add(el, [{ opacity: 0, transform: `translateY(${y}px)` }, { opacity: 1, transform: 'translateY(0px)' }], after + i * 50, 600));
      });

      // The copy has landed on the hero image: the real one shows, the loader goes
      const token = run;
      growth.finished.then(() => {
        if (run !== token || run.phase !== 'handover') return;
        run.phase = 'enter';
        run.hold = null;
        root.classList.add('is-landed');
        putBack();
      }, () => {});
      Promise.all([growth, ...run.entrance].map((animation) => animation.finished)).then(() => run === token && end(), () => {});
    };

    // ---------- 3. Entrance, and the way out ----------

    // The loader leaves the end of the page and goes back into the hero, hidden
    const putBack = () => {
      loader.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
      loader.hidden = true;
      loader.classList.remove('is-counting');
      loader.removeAttribute('style');
      if (last) {
        last.hidden = true;
        last.removeAttribute('style');
      }
      cards.forEach((card) => card.removeAttribute('style'));
      brand?.removeAttribute('style');
      roll(digits, 0);
      digits.forEach((strip) => strip.removeAttribute('style'));
      if (loader.parentNode !== home[0]) home[0].insertBefore(loader, home[1]?.parentNode === home[0] ? home[1] : null);
    };

    // Everything as it ends up, at once
    const end = () => {
      if (!run) return;
      cancelAnimationFrame(run.frame);
      run.anims.forEach((animation) => animation.cancel());
      run = null;
      if (playing === end) playing = null;
      putBack();
      root.classList.remove('is-intro', 'is-landed');
      root.removeAttribute('aria-busy');
    };

    // Skipped: the hero is set as it ends up, the loader stops where it is and lifts off it like
    // a curtain. During the entrance, the rest just plays faster
    const skip = () => {
      if (!run || run.phase === 'skip') return;
      if (run.phase === 'enter') {
        run.entrance.forEach((animation) => animation.updatePlaybackRate(6));
        return;
      }
      cancelAnimationFrame(run.frame);
      run.phase = 'skip';
      run.hold = null;
      run.entrance.forEach((animation) => animation.cancel());
      run.anims.forEach((animation) => animation.playState !== 'idle' && animation.pause());
      root.classList.add('is-landed');
      loader.style.pointerEvents = 'none';
      const token = run;
      // From where the curtain is (halfway down when the replay is skipped): none would not move
      const from = getComputedStyle(loader).clipPath;
      const lift = loader.animate([{ clipPath: from.startsWith('inset') ? from : 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 100% 0%)' }], { duration: 620, easing: SWING, fill: 'forwards' });
      run.anims.push(lift);
      lift.finished.then(() => run === token && end(), () => {});
    };

    const start = (replay) => {
      if (playing && playing !== end) playing();
      end();
      if (!image || !last) return;
      if (root.hasAttribute('data-once')) {
        try {
          sessionStorage.setItem(SEEN, '1');
        } catch {
          // storage blocked: it plays on every page
        }
      }
      run = {
        phase: 'load', anims: [], entrance: [], order: [], next: 0, said: -1, value: 0, done: 0, shown: -1, total: 0, t0: 0, at: 0, beat: 0, frame: 0, hold: null,
        min: seconds(css('min'), 2200),
        max: 0,
      };
      run.max = Math.max(run.min + 300, seconds(css('max'), 2800));
      playing = end;
      // The loader goes to the end of the page while it plays: a transformed parent cannot trap
      // it, the styles of a theme's content cannot reach it. It takes the hero's settings along
      const settings = getComputedStyle(root);
      VARS.forEach((name) => loader.style.setProperty(name, settings.getPropertyValue(name).trim()));
      loader.style.fontFamily = settings.fontFamily;
      document.body.append(loader);
      loader.hidden = false;
      fit();
      root.setAttribute('aria-busy', 'true');
      run.hold = [scrollX, scrollY];
      roll(digits, 0);
      run.total = track();
      loader.classList.add('is-counting');
      const token = run;
      const begin = () => {
        if (run !== token || run.phase !== 'load') return;
        root.classList.add('is-intro');
        // Played again from further down: the hero comes back to the top, behind the loader
        if (replay) {
          const top = root.getBoundingClientRect().top + scrollY;
          window.scrollTo({ left: 0, top: top < innerHeight ? 0 : top, behavior: 'instant' });
          run.hold = [scrollX, scrollY];
          fit();
        }
        if (!replay) {
          arrive(0);
          reveal(cards[0], 60);
          run.beat = performance.now() + 60 + BEAT;
        }
        run.frame = requestAnimationFrame(tick);
      };
      if (!replay) {
        begin();
        return;
      }
      // Played again: the paper first comes down over the page, like a curtain, and the first
      // image is on its way up as it lands
      const drop = loader.animate([{ clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)' }], { duration: 650, easing: SWING });
      run.anims.push(drop);
      arrive(360);
      reveal(cards[0], 420);
      run.beat = performance.now() + 420 + BEAT;
      drop.finished.then(begin, () => {});
    };

    // When it plays: its loader is still up on the screen, painted with the page and not yet let
    // go by the stylesheet's failsafe (3 s without a script). However late the script comes (an
    // app like Next loads it once the page is in), the show starts on the paper already there.
    // For a hero at the top of the page, unless the visitor came for a #section further down
    const up = () => {
      if (!loader.getClientRects().length) return false;
      const failsafe = loader.getAnimations().find((animation) => animation.animationName === 'kodza-landing-reveal-failsafe');
      return !failsafe || failsafe.currentTime < failsafe.effect.getTiming().delay;
    };
    const ahead = () => {
      try {
        const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
        return !target || root.contains(target);
      } catch {
        return true;
      }
    };
    const seen = () => {
      try {
        return root.hasAttribute('data-once') && !!sessionStorage.getItem(SEEN);
      } catch {
        return false;
      }
    };
    const top = root.getBoundingClientRect().top + scrollY < innerHeight * 0.5;
    if (up() && !motion.matches && top && ahead() && !seen()) start(false);
    else loader.hidden = true;
    // One hero has been through: those that come later (an app's next page, a theme's Ajax
    // content, kodza:init again) open straight on the hero, their loader hidden by the
    // stylesheet before it paints. Once this pass is over, so the other heroes of the page are
    // judged like this one
    queueMicrotask(() => document.documentElement.setAttribute('data-kodza-landing-reveal', 'played'));

    // Stopped halfway (kodza:destroy): the hero as it ends up, the loader back in place
    signal.addEventListener('abort', end);
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
