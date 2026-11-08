// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Contact Router
// One form for every desk. The reason comes first (Sales, Support, Press, Jobs, as choice cards),
// then the fields turn into the ones that desk needs: what stays slides to its new place, what
// goes fades up and out while the new fields come in from behind their mask, and the form's
// height follows. The send button and the message's label roll to the desk's words, and the
// "Who reads it" list lights the desk that will answer. On send, the form rolls up into the
// receipt (desk, reply time, address), whose lines rise one after the other.
// The form is a real one. A field (or any block in the fields) marked data-for="sales" shows for
// that reason only (several reasons: data-for="sales press"); hidden, its controls are disabled,
// so they are neither checked nor sent. The reason goes with the message (its input's name).
// On a reason: data-word (the button), data-message (the message's label), data-reply (the reply
// time in the receipt), data-action (its own address to send to), data-only (the reason is just a
// link: only its data-for blocks show, Support → the help center). Each control's data-error says
// what is wrong with it. The rest as in every Kodza form: it goes to its `action` the usual way,
// or with fetch under data-send="fetch"; data-failed is the message when that fails; a hidden
// field catches robots; the page hears kodza:submit (cancelable, event.detail.data the FormData).
// Settings: the variables at the top of component.css; the words of the script below, each one
// replaced by a data-text-<key> on the root (data-text-failed-plain for failedPlain); the timings
// are the constants under them.
(() => {
  const SELECTOR = '.kodza-contact-router';
  const WORDS = {
    left: '{left} left', // the message's count, from 80 % of its maxlength
    name: 'Your name, so we know who we write to.',
    email: 'That email does not look right.',
    required: 'This one is needed for that desk.', // a required field with no data-error
    url: 'That link does not look right.',
    failed: 'That did not go through. Write to {email} instead.',
    failedPlain: 'That did not go through. Try again.',
  };
  const MOVE = 600; // ms: the fields that stay slide to their new place, the form's height follows
  const OUT = 260; // ms: a field that goes fades out...
  const LIFT = 8; // ...rising this many px
  const IN = 560; // ms: a field that comes rises from behind its mask...
  const DROP = 10; // ...from this many px below
  const IN_AT = 160; // ms after the change, the first new field comes in
  const IN_EACH = 60; // ms between two new fields
  const STAGE = 900; // ms: the form rolls up and away, the receipt comes in, the box shrinks to it
  const REACH = 140; // px each of them travels: the form's full height would read as a page scroll
  const HAND_OVER = 0.35; // the form is gone at 35 % of STAGE, the receipt comes in from there
  const ROOM = 24; // px kept above the receipt when the page scrolls back up to it
  const LINE = 450; // ms: a word rolls to the next one (the button, the message's label)
  const RISE = 600; // ms: a line of the receipt rises from behind its mask
  const RISE_AT = 180; // ms after the receipt starts coming in, the first line rises
  const RISE_EACH = 80; // ms between two lines
  const FIT = 220; // ms: the message box grows with the text
  const ROLL = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const ARRIVE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const LEAVE = 'cubic-bezier(0.55, 0, 1, 0.45)';

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
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const q = (name) => root.querySelector(`.kodza-contact-router__${name}`);
    const make = (tag, name, text) => {
      const el = document.createElement(tag);
      el.className = `kodza-contact-router__${name}`;
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
    const say = (box, text, animate) => {
      if (!box || !text) return;
      if (animate) return roll(box, text, 'said');
      if (box.children.length === 1 && box.firstElementChild.textContent === text) return;
      box.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
      box.classList.remove('is-rolling');
      box.replaceChildren(make('span', 'said', text));
    };

    // The form
    const form = q('form');
    if (!form) return;
    const stage = q('stage');
    const panel = q('panel');
    const done = q('done');
    const thanks = q('thanks');
    const button = q('send');
    const error = q('error');
    const flow = q('flow');
    const nameInput = form.elements.name;
    const emailInput = form.elements.email;
    const area = form.elements.message;
    const trap = form.elements.website;
    const frame = area?.closest('.kodza-contact-router__box');
    const count = q('count');
    const groups = [...form.querySelectorAll('.kodza-contact-router__group')];
    const topics = [...form.querySelectorAll('.kodza-contact-router__radio')];
    const desks = [...root.querySelectorAll('.kodza-contact-router__desk')];
    const wordBox = button?.querySelector('.kodza-contact-router__roll');
    const labelBox = frame?.querySelector('.kodza-contact-router__roll');
    // The address to write to when a send fails, from the email link
    const address = (q('mail')?.getAttribute('href') || '').replace(/^mailto:/i, '').split('?')[0];
    // As written: the form's action, the words of a reason with none of its own, the receipt's
    // placeholders
    const action = form.getAttribute('action');
    const defaults = { send: wordBox?.textContent.trim() || '', message: labelBox?.textContent.trim() || '' };
    const blanks = new Map([...done.querySelectorAll('[data-value]')].map((el) => [el, el.textContent]));

    // Which blocks of the fields a reason wants: the ones for every reason (no data-for) and its
    // own; a reason that is only a link wants its own only
    const chosen = () => topics.find((topic) => topic.checked) || null;
    const parts = flow ? [...flow.children].filter((el) => !el.matches('.kodza-contact-router__trap')) : [];
    const wants = (part, topic) => {
      if (!part.dataset.for) return !topic?.hasAttribute('data-only');
      return !!topic && part.dataset.for.split(/\s+/).includes(topic.value);
    };
    const controlsOf = (el) => (el.matches('input, select, textarea, button') ? [el] : [...el.querySelectorAll('input, select, textarea, button')]);
    // A control disabled as written stays disabled
    const off = new WeakSet();
    parts.forEach((part) => controlsOf(part).forEach((control) => control.disabled && off.add(control)));
    const enable = (part, on) => controlsOf(part).forEach((control) => {
      if (!off.has(control)) control.disabled = !on;
    });

    // A change of reason, measured before and after (FLIP): what stays slides from where it was,
    // what goes is lifted out of the grid where it stood and fades, what comes rises in turn
    let trip = 0;
    let flight = [];
    let leaving = [];
    const land = () => {
      trip += 1;
      flight.forEach((animation) => animation.cancel());
      flight = [];
      leaving.forEach((el) => {
        el.hidden = true;
        el.inert = false;
        ['position', 'top', 'left', 'width', 'margin', 'grid-area'].forEach((name) => el.style.removeProperty(name));
      });
      leaving = [];
      flow?.classList.remove('is-moving');
    };
    // An element's place in the fields, in their own pixels (a parent scaled by transform does not
    // shift it)
    const boxIn = (el, origin, scale) => {
      const rect = el.getBoundingClientRect();
      return { x: (rect.left - origin.left) / scale, y: (rect.top - origin.top) / scale, w: rect.width / scale };
    };
    const route = (animate) => {
      const topic = chosen();
      root.classList.toggle('has-desk', !!topic);
      desks.forEach((desk) => desk.classList.toggle('is-current', !!topic && desk.dataset.desk === topic.value));
      if (topic?.dataset.action) form.setAttribute('action', topic.dataset.action);
      else if (action == null) form.removeAttribute('action');
      else form.setAttribute('action', action);
      // A reason that is only a link leaves the words as they are (the button goes with the fields)
      if (!topic?.hasAttribute('data-only')) {
        say(wordBox, topic?.dataset.word || defaults.send, animate);
        say(labelBox, topic?.dataset.message || defaults.message, animate);
      }
      if (!flow) return;
      const move = animate && !still && !!flow.offsetParent;
      const before = new Map();
      let origin = null;
      let scale = 1;
      let from = 0;
      if (move) {
        origin = flow.getBoundingClientRect();
        scale = origin.width / flow.offsetWidth || 1;
        from = origin.height / scale;
        parts.forEach((part) => {
          if (!part.hidden && !leaving.includes(part)) before.set(part, boxIn(part, origin, scale));
        });
      }
      land();
      const coming = [];
      parts.forEach((part) => {
        if (wants(part, topic)) {
          enable(part, true);
          if (part.hidden) coming.push(part);
          part.hidden = false;
          return;
        }
        enable(part, false);
        if (before.has(part)) {
          part.inert = true;
          leaving.push(part);
          return;
        }
        part.hidden = true;
      });
      if (errorField?.disabled) clean();
      if (!move) return;
      // Out of the grid, where it stood: the fields that stay take their new places at once
      leaving.forEach((part) => {
        const box = before.get(part);
        Object.assign(part.style, { position: 'absolute', top: `${box.y}px`, left: `${box.x}px`, width: `${box.w}px`, margin: '0', gridArea: 'auto' });
      });
      const to = flow.offsetHeight;
      const after = flow.getBoundingClientRect();
      flow.classList.add('is-moving');
      const go = (el, frames, timing) => flight.push(el.animate(frames, timing));
      if (Math.abs(to - from) > 0.5) go(flow, [{ height: `${from}px` }, { height: `${to}px` }], { duration: MOVE * pace, easing: ARRIVE });
      before.forEach((was, part) => {
        if (leaving.includes(part)) return;
        const now = boxIn(part, after, scale);
        const dx = was.x - now.x;
        const dy = was.y - now.y;
        if (Math.abs(dx) + Math.abs(dy) < 0.5) return;
        go(part, [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: MOVE * pace, easing: ARRIVE });
      });
      coming.forEach((part, i) => go(part, [
        { opacity: 0, transform: `translateY(${DROP}px)`, clipPath: 'inset(0 0 100% 0)' },
        { opacity: 1, offset: 0.5 },
        { opacity: 1, transform: 'none', clipPath: 'inset(0)' },
      ], { duration: IN * pace, delay: (IN_AT + i * IN_EACH) * pace, easing: ARRIVE, fill: 'backwards' }));
      leaving.forEach((part) => go(part, [
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0, transform: `translateY(-${LIFT}px)` },
      ], { duration: OUT * pace, easing: LEAVE, fill: 'forwards' }));
      const mine = trip;
      Promise.all(flight.map((animation) => animation.finished)).then(() => {
        if (trip === mine) land();
      }, () => {});
    };
    signal.addEventListener('abort', land);

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
      count.textContent = fill(word('left'), { left: max - used });
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

    // A link typed without its scheme ("ferry.studio/work") gets one, rather than an error
    const mend = (field) => {
      if (field?.type !== 'url') return;
      const value = field.value.trim();
      if (value && !/^[a-z][a-z\d+.-]*:/i.test(value) && /^[^\s/]+\.[^\s]+$/.test(value)) field.value = `https://${value}`;
    };

    // Checked before the send, in order: the reason, the name, the email, then the fields of that
    // desk. The message says what is missing, the frame of the group (or the field) turns to ink,
    // the focus goes there
    let errorField = null;
    const marked = (field) => {
      if (field.matches('fieldset')) return [...field.querySelectorAll('input')];
      return field.matches('input, textarea, select') ? [field] : [];
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
    const wrong = (field) => {
      if (field.type === 'url') return word('url');
      if (field.type === 'email') return word('email');
      return field.dataset.error || word('required');
    };
    const invalid = () => {
      const group = groups.find((one) => one.hasAttribute('data-required') && empty(one));
      if (group) return fail(group, group.dataset.error || '', group.querySelector('input')) || true;
      if (chosen()?.hasAttribute('data-only')) return true; // nothing to send: the reason is a link
      if (nameInput && !nameInput.disabled && !nameInput.value.trim()) return fail(nameInput, word('name')) || true;
      if (emailInput && !emailInput.disabled && (!emailInput.value.trim() || !emailInput.validity.valid)) return fail(emailInput, word('email')) || true;
      const fields = flow ? [...flow.querySelectorAll('input, select, textarea')] : [];
      const field = fields.find((one) => {
        if (one.disabled || one === nameInput || one === emailInput || one === trap) return false;
        mend(one);
        return one.value.trim() ? !one.validity.valid : one.required;
      });
      if (field) return fail(field, field.value.trim() ? wrong(field) : field.dataset.error || word('required')) || true;
      return false;
    };
    form.noValidate = true;
    form.addEventListener('input', () => {
      if (!errorField) return;
      let fixed;
      if (errorField.matches('fieldset')) fixed = !empty(errorField);
      else fixed = errorField.value?.trim() && errorField.validity?.valid !== false;
      if (fixed) clean();
    }, { signal });
    form.addEventListener('change', (event) => {
      if (topics.includes(event.target)) route(true);
      else mend(event.target);
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

    // The receipt: which desk, when it answers, where; each line rising from behind its mask
    let sent = false;
    const finish = (values) => {
      sent = true;
      land();
      const topic = chosen();
      const said = {
        name: String(values.get('name') || '').trim().split(/\s+/)[0],
        email: String(values.get('email') || '').trim(),
        desk: topic?.closest('label')?.querySelector('.kodza-contact-router__name')?.textContent.trim() || '',
        reply: topic?.dataset.reply || '',
      };
      blanks.forEach((blank, el) => {
        el.textContent = said[el.dataset.value] || blank;
      });
      swap(stage, panel, done);
      if (!still) {
        done.querySelectorAll('.kodza-contact-router__row > dd > span').forEach((line, i) => {
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

    // The send: kodza:submit first (the page can take it over), then the form's action (the
    // reason's own, under data-action), the usual way, or with fetch under data-send="fetch"
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
        fail(button, form.dataset.failed || (address ? fill(word('failed'), { email: address }) : word('failedPlain')), null);
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

    // Send another (the form's reset): the reason as written comes back with its fields, and the
    // empty form comes back down
    form.addEventListener('reset', () => requestAnimationFrame(() => {
      if (signal.aborted) return;
      clean();
      route(true);
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

    route(false);
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
