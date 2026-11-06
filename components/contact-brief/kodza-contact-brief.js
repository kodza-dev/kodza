// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Contact Brief
// A project request in three clicks: what you need (tags that tick), a budget and a time frame
// (an ink pill that slides from one range to the next), then a name and an email. Under the form,
// "Your brief" writes itself as you pick: each part rolls from its grey word ("How much") to what
// you chose ("10–20k €"), and back when you change your mind. On send, the form rolls up into the
// receipt, whose lines rise one after the other; if the send fails, what was picked stays, with
// the address to write to instead.
// The form is a real one: it goes to its `action` (need, budget, when, name, email, message), the
// usual way, or with fetch under data-send="fetch". A hidden field catches robots: filled, nothing
// is sent. A group marked data-required must be picked, its data-error says why when it is not.
// Settings: the variables at the top of component.css; on the form, data-send and data-failed (the
// message when a fetch send fails); the words of the script and the timings are the constants below.
// The page hears kodza:submit (cancelable, event.detail.data the FormData) before the send.
(() => {
  const SELECTOR = '.kodza-contact-brief';
  const WORDS = {
    two: '{first} + {second}', // the brief, two needs picked
    more: '{first} + {n} more', // the brief, three needs and up
    open: 'We’ll ask', // the receipt, when no time frame was picked
    left: '{left} left', // the message's count, from 80 % of its maxlength
    name: 'Your name, so we know who we write to.',
    email: 'That email does not look right.',
    failed: 'That did not go through. Write to {email} instead.',
    failedPlain: 'That did not go through. Try again.',
  };
  const STAGE = 900; // ms: the form rolls up and away, the receipt comes in, the box shrinks to it
  const REACH = 140; // px each of them travels: the form's full height would read as a page scroll
  const HAND_OVER = 0.35; // the form is gone at 35 % of STAGE, the receipt comes in from there
  const ROOM = 24; // px kept above the receipt when the page scrolls back up to it
  const LINE = 450; // ms: a part of the brief rolls to its new words
  const SLIDE = 550; // ms: the ink pill slides to the picked range
  const LEAD = 0.7; // the pill's leading edge arrives at 70 % of the slide...
  const LAG = 0.14; // ...its trailing edge waits 14 % before it follows: the pill stretches, then catches up
  const SAMPLES = 30; // keyframes per slide
  const RISE = 600; // ms: a line of the receipt rises from behind its mask
  const RISE_AT = 180; // ms after the receipt starts coming in, the first line rises
  const RISE_EACH = 80; // ms between two lines
  const FIT = 220; // ms: the message box grows with the text
  const ROLL = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const ARRIVE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const LEAVE = 'cubic-bezier(0.55, 0, 1, 0.45)';
  const ease = (t) => 1 - (1 - t) ** 4; // the pill's edges

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const fill = (text, values) => text.replace(/\{(\w+)\}/g, (all, key) => (key in values ? values[key] : all));

  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace;
    const q = (name) => root.querySelector(`.kodza-contact-brief__${name}`);
    const make = (tag, name, text) => {
      const el = document.createElement(tag);
      el.className = `kodza-contact-brief__${name}`;
      if (text != null) el.textContent = text;
      return el;
    };
    // A line in a box rolls to new words: the old one goes up, the new one comes from below, and
    // the box's width follows
    const roll = (box, text, name) => {
      const old = box.lastElementChild;
      if (old?.textContent === text) return;
      box.getAnimations({ subtree: true }).forEach((animation) => animation.finish());
      [...box.children].slice(0, -1).forEach((el) => el.remove());
      const line = make('span', name, text);
      if (still || !old || !box.offsetParent) {
        box.replaceChildren(line);
        return;
      }
      const from = box.offsetWidth;
      box.append(line);
      old.setAttribute('aria-hidden', 'true');
      const to = line.offsetWidth;
      box.classList.add('is-rolling');
      const timing = { duration: LINE * pace, easing: ARRIVE };
      box.animate([{ width: `${from}px` }, { width: `${to}px` }], timing);
      old.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-110%)' }], { ...timing, fill: 'forwards' });
      line.animate([{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }], timing).onfinish = () => {
        old.remove();
        if (box.lastElementChild === line) box.classList.remove('is-rolling');
      };
    };

    // The ink pill of a range (budget, time frame): two windows slide in the lane, one cut at the
    // pill's left edge, one at its right edge, while the ink inside them holds still. The labels
    // under it have white twins in the ink, so they turn white exactly at the pill's edges
    const pillOf = (track) => {
      const options = [...track.querySelectorAll('.kodza-contact-brief__option')];
      const inputs = options.map((option) => option.querySelector('.kodza-contact-brief__radio'));
      if (!options.length || inputs.some((input) => !input)) return;
      const duration = SLIDE * pace;
      const layer = (name) => make('span', name);
      const lane = layer('lane');
      lane.setAttribute('aria-hidden', 'true');
      const pill = layer('pill');
      const edge = layer('edge');
      const mirror = layer('mirror');
      const ghosts = options.map((option) => {
        const ghost = layer('ghost');
        const said = option.querySelector('.kodza-contact-brief__said');
        if (said) ghost.append(said.cloneNode(true));
        return ghost;
      });
      mirror.append(...ghosts);
      edge.append(mirror);
      pill.append(edge);
      lane.append(pill);
      track.append(lane);
      track.classList.add('is-ready');

      // Each option's edges in the lane, in its own pixels (a parent scaled by transform does not
      // shift them)
      let boxes = [];
      const measure = () => {
        const box = lane.getBoundingClientRect();
        const scale = box.width / lane.offsetWidth || 1;
        const full = lane.offsetWidth;
        boxes = options.map((option) => {
          const rect = option.getBoundingClientRect();
          const left = (rect.left - box.left) / scale;
          const width = rect.width / scale;
          return { left, width, right: full - left - width };
        });
        ghosts.forEach((ghost, i) => {
          ghost.style.left = `${boxes[i].left}px`;
          ghost.style.width = `${boxes[i].width}px`;
        });
      };
      const shifts = ({ left, right }) => [left, -left - right, right];
      const rest = (edges) => {
        track.style.setProperty('--kz-contact-brief-pill-l', `${edges.left}px`);
        track.style.setProperty('--kz-contact-brief-pill-r', `${edges.right}px`);
      };
      let move = null;
      // The leading edge goes first and the trailing one follows: the pill stretches, then catches up.
      // The first pick grows from the middle of its option
      const edgesAt = ({ from, to, forward, grow }, t) => {
        const front = ease(grow ? t : Math.min(1, t / LEAD));
        const back = grow ? front : ease(Math.max(0, (t - LAG) / (1 - LAG)));
        return {
          left: from.left + (to.left - from.left) * (forward ? back : front),
          right: from.right + (to.right - from.right) * (forward ? front : back),
        };
      };
      // Where the pill is right now, to start a new slide from there
      const now = () => {
        const t = move?.animations[0].currentTime;
        return move && t != null && move.animations[0].playState === 'running' ? edgesAt(move, Math.min(1, t / duration)) : null;
      };
      const stop = () => {
        move?.animations.forEach((animation) => animation.cancel());
        move = null;
      };
      const slide = (from, to) => {
        stop();
        rest(to);
        if (still) return;
        const grow = !from;
        if (grow) from = { left: to.left + to.width / 2, right: to.right + to.width / 2 };
        const plan = { from, to, grow, forward: to.left > from.left };
        const frames = [[], [], []];
        for (let i = 0; i <= SAMPLES; i += 1) {
          shifts(edgesAt(plan, i / SAMPLES)).forEach((x, n) => frames[n].push({ transform: `translateX(${x}px)` }));
        }
        const timing = { duration, easing: 'linear' };
        move = { ...plan, animations: [pill, edge, mirror].map((el, n) => el.animate(frames[n], timing)) };
        move.animations[0].onfinish = () => {
          move = null;
        };
      };
      const clear = () => {
        stop();
        track.style.removeProperty('--kz-contact-brief-pill-l');
        track.style.removeProperty('--kz-contact-brief-pill-r');
      };
      let current = inputs.findIndex((input) => input.checked);
      const update = () => {
        const next = inputs.findIndex((input) => input.checked);
        if (next === current) return;
        const from = now() || boxes[current] || null;
        current = next;
        if (next < 0) return clear();
        slide(from, boxes[next]);
      };
      // Measured again when the track changes size (fonts, a narrower column, the form shown again)
      const place = () => {
        const before = boxes;
        measure();
        const same = move && boxes.every((box, i) => Math.abs(box.left - before[i].left) < 0.5 && Math.abs(box.width - before[i].width) < 0.5);
        if (same) return;
        stop();
        if (current >= 0) rest(boxes[current]);
        else clear();
      };
      track.addEventListener('change', update, { signal });
      track.closest('form')?.addEventListener('reset', () => requestAnimationFrame(update), { signal });
      place();
      const observer = new ResizeObserver(place);
      observer.observe(track);
      signal.addEventListener('abort', () => {
        observer.disconnect();
        stop();
      });
      document.fonts?.ready.then(() => !signal.aborted && place());
    };
    root.querySelectorAll('.kodza-contact-brief__track').forEach(pillOf);

    // The form
    const form = q('form');
    if (!form) return;
    const stage = q('stage');
    const panel = q('panel');
    const done = q('done');
    const thanks = q('thanks');
    const button = q('send');
    const error = q('error');
    const nameInput = form.elements.name;
    const emailInput = form.elements.email;
    const area = form.elements.message;
    const trap = form.elements.website;
    const frame = area?.closest('.kodza-contact-brief__box');
    const count = q('count');
    const groups = [...form.querySelectorAll('.kodza-contact-brief__group')];
    // The address to write to when a send fails, from the email link
    const address = (q('mail')?.getAttribute('href') || '').replace(/^mailto:/i, '').split('?')[0];

    // What was picked, in the words of its labels ("Yesterday", not "ASAP")
    const saidOf = (input) => input.closest('label')?.querySelector('.kodza-contact-brief__said')?.textContent.trim() || input.value;
    const picked = (name) => [...form.querySelectorAll(`input[name="${CSS.escape(name)}"]:checked`)].map(saidOf);

    // "Your brief" writes itself: each part rolls from its grey word to what was picked
    const slots = [...root.querySelectorAll('.kodza-contact-brief__slot')];
    const briefOf = (name) => {
      const said = picked(name);
      if (said.length < 2) return said[0] || '';
      return fill(said.length === 2 ? WORDS.two : WORDS.more, { first: said[0], second: said[1], n: said.length - 1 });
    };
    const compose = (animate) => slots.forEach((slot) => {
      const said = slot.querySelector('.kodza-contact-brief__roll');
      if (!said) return;
      const text = briefOf(slot.dataset.slot || '');
      const words = text || slot.dataset.empty || '';
      slot.classList.toggle('is-set', !!text);
      if (animate) return roll(said, words, 'part');
      said.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
      said.classList.remove('is-rolling');
      said.replaceChildren(make('span', 'part', words));
    });
    compose(false);
    form.addEventListener('change', () => compose(true), { signal });

    // The message box grows with the text, up to its max-height, then scrolls
    const fit = (animate) => {
      if (!area) return;
      const from = area.offsetHeight;
      area.style.height = 'auto';
      const full = area.scrollHeight;
      area.style.height = `${full}px`;
      const to = area.offsetHeight;
      area.classList.toggle('is-long', full > to);
      if (animate && !still && from && from !== to) area.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: FIT * pace, easing: ARRIVE });
    };
    const counted = () => {
      const max = area?.maxLength;
      if (!frame || !count || !(max > 0)) return;
      const used = area.value.length;
      frame.classList.toggle('is-near', used >= max * 0.8);
      count.textContent = fill(WORDS.left, { left: max - used });
    };
    area?.addEventListener('input', () => {
      fit(true);
      counted();
    }, { signal });
    // Mod+Enter sends from the message, where Enter makes a new line
    area?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      form.requestSubmit(button);
    }, { signal });

    // Checked before the send, in order: the groups that must be picked, the name, the email. The
    // message says what is missing, the frame of the group (or the field) turns to ink, the focus
    // goes there
    let errorField = null;
    const marked = (field) => {
      if (field.matches('fieldset')) return [...field.querySelectorAll('input')];
      return field.matches('input, textarea') ? [field] : [];
    };
    const empty = (group) => !group.querySelector('input:checked');
    const clean = () => {
      if (errorField) {
        errorField.classList.remove('is-error');
        marked(errorField).forEach((el) => el.removeAttribute('aria-invalid'));
      }
      errorField = null;
      form.classList.remove('is-error');
    };
    const fail = (field, message, focus = field) => {
      clean();
      error.textContent = message;
      form.classList.add('is-error');
      errorField = field;
      if (field.matches('fieldset')) field.classList.add('is-error');
      marked(field).forEach((el) => el.setAttribute('aria-invalid', 'true'));
      focus?.focus();
    };
    const invalid = () => {
      const group = groups.find((one) => one.hasAttribute('data-required') && empty(one));
      if (group) return fail(group, group.dataset.error || '', group.querySelector('input')) || true;
      if (nameInput && !nameInput.value.trim()) return fail(nameInput, WORDS.name) || true;
      if (emailInput && (!emailInput.value.trim() || !emailInput.validity.valid)) return fail(emailInput, WORDS.email) || true;
      return false;
    };
    form.noValidate = true;
    form.addEventListener('input', () => {
      if (!errorField) return;
      let fixed;
      if (errorField.matches('fieldset')) fixed = !empty(errorField);
      else if (errorField === emailInput) fixed = emailInput.value.trim() && emailInput.validity.valid;
      else fixed = errorField.value?.trim();
      if (fixed) clean();
    }, { signal });

    // Two blocks in one place: the one leaving rolls up (down on the way back), the other follows,
    // and the box between them changes height with them
    const swap = (cell, out, into, backwards) => {
      cell.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
      out.hidden = false;
      into.hidden = false;
      if (still) {
        out.hidden = true;
        return;
      }
      const hOut = out.offsetHeight;
      const hIn = into.offsetHeight;
      cell.classList.add('is-rolling');
      const timing = { duration: STAGE * pace, easing: ROLL };
      const travel = backwards ? [REACH, -REACH] : [-REACH, REACH];
      const grow = cell.animate(
        [{ height: `${Math.max(hOut, 1)}px` }, { height: `${Math.max(hIn, 1)}px` }],
        { ...timing, fill: 'forwards' },
      );
      // The two blocks share the top of the box: the one leaving is gone before the other shows
      out.animate([
        { transform: 'translateY(0)', opacity: 1 },
        { transform: `translateY(${travel[0]}px)`, opacity: 0 },
      ], { duration: STAGE * HAND_OVER * pace, easing: LEAVE, fill: 'forwards' });
      into.animate([
        { transform: `translateY(${travel[1]}px)`, opacity: 0 },
        { opacity: 1, offset: 0.4 },
        { transform: 'translateY(0)', opacity: 1 },
      ], {
        duration: STAGE * (1 - HAND_OVER) * pace, delay: STAGE * HAND_OVER * pace, easing: ARRIVE, fill: 'backwards',
      }).onfinish = () => {
        out.hidden = true;
        cell.classList.remove('is-rolling');
        out.getAnimations().forEach((animation) => animation.cancel());
        grow.cancel();
      };
    };

    // The receipt: what was asked for, each line rising from behind its mask, one after the other
    let sent = false;
    const finish = (values) => {
      sent = true;
      const name = String(values.get('name') || '').trim().split(/\s+/)[0];
      const email = String(values.get('email') || '').trim();
      const said = { need: picked('need').join(', '), budget: picked('budget')[0] || '', when: picked('when')[0] || WORDS.open };
      done.querySelectorAll('[data-value]').forEach((el) => {
        const key = el.dataset.value;
        if (key === 'name' && name) el.textContent = name;
        else if (key === 'email' && email) el.textContent = email;
        else if (key in said) el.textContent = said[key];
      });
      swap(stage, panel, done);
      if (!still) {
        done.querySelectorAll('.kodza-contact-brief__row > dd > span').forEach((line, i) => {
          line.animate([{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }], {
            duration: RISE * pace, delay: (STAGE * HAND_OVER + RISE_AT + i * RISE_EACH) * pace, easing: ARRIVE, fill: 'backwards',
          });
        });
      }
      // Sent from the foot of a tall form, the receipt would land above the screen: the page follows it
      const top = stage.getBoundingClientRect().top;
      if (top < ROOM) window.scrollBy({ top: top - ROOM, behavior: still ? 'instant' : 'smooth' });
      if (thanks) {
        thanks.tabIndex = -1;
        thanks.focus({ preventScroll: true });
      }
    };

    // The send: kodza:submit first (the page can take it over), then the form's action, the usual
    // way, or with fetch under data-send="fetch"
    let sending = false;
    const send = async (values) => {
      sending = true;
      button.setAttribute('aria-busy', 'true');
      const method = (form.getAttribute('method') || 'get').toUpperCase();
      const url = method === 'GET' ? `${form.action}${form.action.includes('?') ? '&' : '?'}${new URLSearchParams(values)}` : form.action;
      try {
        const response = await fetch(url, { method, body: method === 'GET' ? undefined : values, headers: { Accept: 'application/json' }, signal });
        if (!response.ok) throw new Error(String(response.status));
        sending = false;
        finish(values);
      } catch {
        if (signal.aborted) return;
        sending = false;
        // What was picked and typed stays; the address is the way out
        fail(button, form.dataset.failed || (address ? fill(WORDS.failed, { email: address }) : WORDS.failedPlain), null);
      }
      button.removeAttribute('aria-busy');
    };
    form.addEventListener('submit', (event) => {
      if (sent || sending || invalid()) {
        event.preventDefault();
        return;
      }
      clean();
      const values = new FormData(form);
      // A robot filled the hidden field: it gets its receipt, nothing leaves
      if (trap?.value) {
        event.preventDefault();
        finish(values);
        return;
      }
      values.delete('website');
      if (!form.dispatchEvent(new CustomEvent('kodza:submit', { detail: { data: values }, bubbles: true, cancelable: true }))) {
        event.preventDefault();
        finish(values);
        return;
      }
      if (form.dataset.send !== 'fetch') return; // sent the usual way
      event.preventDefault();
      send(values);
    }, { signal });

    // Start over (the form's reset): the brief goes back to its grey words, and the empty form
    // comes back down
    form.addEventListener('reset', () => requestAnimationFrame(() => {
      if (signal.aborted) return;
      clean();
      compose(false);
      if (area) {
        area.style.height = '';
        area.classList.remove('is-long');
      }
      counted();
      if (!sent) return;
      const inside = done.contains(document.activeElement);
      sent = false;
      swap(stage, done, panel, true);
      if (inside) form.querySelector('input')?.focus({ preventScroll: true });
    }), { signal });
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
