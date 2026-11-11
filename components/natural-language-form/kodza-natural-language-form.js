// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Natural Language Form
// The contact form is a sentence: "Hi, I'm [name] from [company]. We need [a website] by [the
// summer]…". Each blank is a real field that grows with what is typed in it; each choice is a real
// <select> under a word, whose list opens right there, and the word rolls to the one you pick. On
// send, the sentence turns into the reply: its words go up behind their masks, the visitor's own
// words travel to their place in it ("Got it, Florent: a website for Kodza by the summer."), and
// the reply's words rise around them. Start over plays it backwards.
// The form is a real one: it goes to its `action` (name, company, need, when, budget, email) the
// usual way, or with fetch under data-send="fetch". A hidden field catches robots: filled, nothing
// is sent. A required blank's data-error says what is missing.
// Settings: the variables at the top of component.css; on the form, data-send and data-failed (the
// message when a fetch send fails); in the reply, a [data-value="<field name>"] takes that field's
// answer (its own text when the field is empty), and a [data-if="<field name>"] part is left out
// when the field is empty; the words below, each one replaced by a data-text-<key> on the root;
// the timings are the constants under them.
// The page hears kodza:submit (cancelable, event.detail.data the FormData) before the send.
(() => {
  const SELECTOR = '.kodza-natural-language-form';
  const WORDS = {
    required: 'This one is needed.', // a required blank with no data-error
    failedPlain: 'That did not go through. Try again.', // a fetch send failed, no data-failed on the form
  };
  const ANSWER = 1100; // ms: the question turns into the reply (and back, on Start over)
  const SPREAD = 0.25; // the words leave one after the other over the first 25 % of ANSWER...
  const LEAVE_FOR = 0.4; // ...each one in 40 %
  const TRAVEL_FROM = 0.1; // the visitor's words travel to the reply from 10 %...
  const TRAVEL_TO = 0.72; // ...to 72 %
  const REPLY_AT = 0.58; // the new words rise from 58 %, once the travelers are nearly there...
  const REPLY_SPREAD = 0.12; // ...one after the other...
  const REPLY_FOR = 0.3; // ...each one in 30 %
  const END_AT = 0.55; // what comes next under the reply arrives from 55 %
  const LINE = 420; // ms: a picked word, or the error line, rolls to the next one
  const ROOM = 24; // px kept above the reply when the page scrolls back up to it
  const RESERVE = 0.4; // em left in the focused blank after what is typed, for the next letter
  const TYPE_AHEAD = 600; // ms: letters typed within it add up to one search in a list
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
  const C = 'kodza-natural-language-form';
  const UP = [{ transform: 'none' }, { transform: 'translateY(-110%)' }];
  const RISE = [{ transform: 'translateY(110%)' }, { transform: 'none' }];
  const TICK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" pathLength="1"/></svg>';
  const CHEVRON = `<svg class="${C}__chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6.5 8 10.5l4-4"/></svg>`;
  let uid = 0;

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const q = (name) => root.querySelector(`.${C}__${name}`);
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const make = (tag, name, text) => {
      const el = document.createElement(tag);
      if (name) el.className = `${C}__${name}`;
      if (text != null) el.textContent = text;
      return el;
    };
    const form = q('form');
    const stage = q('stage');
    const panel = q('panel');
    const done = q('done');
    const button = q('send');
    const error = q('error');
    const question = panel?.querySelector(`.${C}__sentence`);
    const reply = done?.querySelector(`.${C}__sentence`);
    if (!form || !stage || !panel || !done || !button || !error || !question || !reply) return;
    const foot = q('foot');
    const privacy = q('privacy');
    const end = q('end');
    const trap = form.querySelector('[name="website"]');
    const inputs = [...question.querySelectorAll(`.${C}__input`)];
    // Screen pixels to the component's own (a parent scaled by transform: a thumbnail, a theme)
    const scale = () => root.getBoundingClientRect().width / root.offsetWidth || 1;

    // The words, each one in its own mask, so the question can leave and the reply arrive word by
    // word. The reply's answers travel whole. A word glued to a field or an answer (the stop after
    // it) stays on its line.
    const values = [...done.querySelectorAll('[data-value]')];
    const fallback = new Map(values.map((el) => [el, el.textContent]));
    values.filter((el) => reply.contains(el)).forEach((el) => {
      const mask = make('span', 'w');
      mask.classList.add(`${C}__carry`);
      el.before(mask);
      mask.append(el);
      el.classList.add(`${C}__wi`);
    });
    const glue = (a, b) => {
      if (a.parentElement?.classList.contains(`${C}__tie`)) return;
      const tie = make('span', 'tie');
      a.before(tie);
      tie.append(a, b);
    };
    const kept = ['blank', 'choice', 'label', 'w'].map((name) => `${C}__${name}`);
    const split = (el) => [...el.childNodes].forEach((node) => {
      if (node.nodeType === 1) {
        if (!node.hasAttribute('data-value') && !kept.some((name) => node.classList.contains(name))) split(node);
        return;
      }
      if (node.nodeType !== 3) return;
      const text = node.textContent.replace(/[ \t\n\r\f]+/g, ' '); // a no-break space stays inside its word
      if (!text.trim()) {
        node.textContent = text;
        return;
      }
      const made = text.split(/( )/).filter(Boolean).map((part) => {
        if (part === ' ') return document.createTextNode(' ');
        const mask = make('span', 'w');
        mask.append(make('span', 'wi', part));
        return mask;
      });
      const before = node.previousSibling;
      const after = node.nextSibling;
      node.replaceWith(...made);
      if (made[0].nodeType === 1 && before?.nodeType === 1) glue(before, made[0]);
      const last = made[made.length - 1];
      if (last.nodeType === 1 && after?.nodeType === 1) glue(last, after);
    });
    split(question);
    split(reply);

    // A word or a line rolls to the next one: the old one goes up, the new one comes from below, and
    // the box follows the new one's width (a picked word) or height (the error line)
    const roll = (box, text, wide) => {
      const old = box.lastElementChild;
      if (old?.textContent === text) return;
      box.getAnimations({ subtree: true }).forEach((a) => a.finish());
      [...box.children].slice(0, -1).forEach((el) => el.remove());
      const line = make('span', null, text);
      if (still || !old || !box.offsetParent) {
        box.replaceChildren(line);
        return;
      }
      const size = (el) => (wide ? el.getBoundingClientRect().width / scale() : el.offsetHeight);
      const from = size(box);
      box.append(line);
      old.setAttribute('aria-hidden', 'true');
      const to = size(line);
      const side = wide ? 'width' : 'height';
      const timing = { duration: LINE * pace, easing: ARRIVE };
      box.classList.add('is-rolling');
      if (Math.abs(from - to) > 0.5) box.animate([{ [side]: `${from}px` }, { [side]: `${to}px` }], timing);
      old.animate(UP, { ...timing, fill: 'forwards' });
      line.animate(RISE, timing).onfinish = () => {
        old.remove();
        if (box.lastElementChild === line) box.classList.remove('is-rolling');
      };
    };

    // A blank is as wide as what is typed in it (or its placeholder), measured in its own letters,
    // and given in em, so it follows the sentence's size
    const measure = make('span', 'measure');
    measure.setAttribute('aria-hidden', 'true');
    question.append(measure);
    let fitted = false;
    const fit = (input, instant) => {
      measure.textContent = input.value || input.placeholder || ' ';
      const style = getComputedStyle(input);
      const size = parseFloat(style.fontSize) || 16;
      const width = measure.getBoundingClientRect().width / scale() + parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      if (instant) input.style.transition = 'none';
      // the room for the next letter only while typing: at rest the stop sits right after the word
      const room = input === document.activeElement ? RESERVE : 0;
      input.style.width = `${(width / size + room).toFixed(3)}em`;
      if (instant) {
        void input.offsetWidth;
        input.style.transition = '';
      }
    };
    const fitAll = () => {
      inputs.forEach((input) => fit(input, true));
      fitted = question.offsetWidth > 0;
    };
    fitAll();
    // The font arrives late, or the form was hidden at first: measured again
    document.fonts?.ready.then(() => !signal.aborted && fitAll());
    document.fonts?.addEventListener('loadingdone', fitAll, { signal });
    const watch = new ResizeObserver(() => !fitted && fitAll());
    watch.observe(question);
    signal.addEventListener('abort', () => watch.disconnect());

    // A choice: a word over the real select, whose list opens under it. Keyboard as in the ARIA
    // "select-only combobox" pattern: the focus stays on the word, arrows move, letters jump,
    // Enter picks, Escape closes
    const choices = [...question.querySelectorAll(`.${C}__choice`)].map((choice) => {
      const native = choice.querySelector('select');
      if (!native) return null;
      const id = `${C}-${++uid}`;
      const name = native.getAttribute('aria-label');
      const pick = make('button', 'pick');
      pick.type = 'button';
      pick.setAttribute('role', 'combobox');
      pick.setAttribute('aria-haspopup', 'listbox');
      pick.setAttribute('aria-expanded', 'false');
      pick.setAttribute('aria-controls', `${id}-list`);
      if (name) pick.setAttribute('aria-label', name);
      const value = make('span', 'value');
      pick.append(value);
      pick.insertAdjacentHTML('beforeend', CHEVRON);
      const list = make('ul', 'list');
      list.id = `${id}-list`;
      list.setAttribute('role', 'listbox');
      if (name) list.setAttribute('aria-label', name);
      const highlight = make('li', 'highlight');
      highlight.setAttribute('role', 'presentation');
      list.append(highlight);
      const entries = [...native.options].filter((option) => !option.hidden).map((option, i) => {
        const item = make('li', 'option');
        item.id = `${id}-${i}`;
        item.setAttribute('role', 'option');
        item.innerHTML = TICK;
        item.append(option.textContent.trim());
        if (option.disabled) item.setAttribute('aria-disabled', 'true');
        list.append(item);
        return { option, item };
      });
      native.after(pick, list);
      native.tabIndex = -1;
      native.setAttribute('aria-hidden', 'true');

      const enabled = () => entries.filter(({ item }) => item.getAttribute('aria-disabled') !== 'true');
      const isOpen = () => choice.classList.contains('is-open');
      let active = null;
      const light = (entry, scroll = true) => {
        active = entry;
        if (!entry) {
          pick.removeAttribute('aria-activedescendant');
          list.style.setProperty('--kz-hl-on', 0);
          return;
        }
        pick.setAttribute('aria-activedescendant', entry.item.id);
        list.style.setProperty('--kz-hl-y', `${entry.item.offsetTop}px`);
        list.style.setProperty('--kz-hl-h', `${entry.item.offsetHeight}px`);
        list.style.setProperty('--kz-hl-on', 1);
        // The list scrolls, never the page
        if (scroll) {
          const top = entry.item.offsetTop;
          const bottom = top + entry.item.offsetHeight;
          if (top < list.scrollTop) list.scrollTop = top === entries[0].item.offsetTop ? 0 : top;
          else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
        }
      };
      const sync = (animate) => {
        entries.forEach(({ option, item }) => item.setAttribute('aria-selected', String(option.selected)));
        const text = native.selectedOptions[0]?.textContent.trim() || '';
        if (animate) roll(value, text, true);
        else value.replaceChildren(make('span', null, text));
      };
      const close = () => {
        if (!isOpen()) return;
        choice.classList.remove('is-open');
        pick.setAttribute('aria-expanded', 'false');
        light(null);
      };
      const open = () => {
        if (isOpen()) return;
        choices.forEach((other) => other?.close());
        // No room below and more above: it opens upwards. Past the section's right edge: it slides
        // back in. Set while closed, so it always unrolls from the word
        const box = pick.getBoundingClientRect();
        list.style.transition = 'none';
        choice.classList.toggle('is-above', box.bottom + Math.min(280, list.scrollHeight) + 16 > innerHeight && box.top > innerHeight / 2);
        list.style.setProperty('--kz-nlf-shift', '0px');
        const over = list.getBoundingClientRect().right - root.getBoundingClientRect().right;
        if (over > 0) list.style.setProperty('--kz-nlf-shift', `${-over / scale()}px`);
        void list.offsetWidth;
        list.style.transition = '';
        choice.classList.add('is-open');
        pick.setAttribute('aria-expanded', 'true');
        light(entries.find(({ option }) => option.selected) || enabled()[0]);
      };
      const choose = (entry) => {
        if (!entry || entry.item.getAttribute('aria-disabled') === 'true') return;
        const changed = !entry.option.selected;
        entry.option.selected = true;
        sync(true);
        close();
        if (changed) native.dispatchEvent(new Event('change', { bubbles: true }));
      };
      // Typing a few letters jumps to the first option they start
      let typed = '';
      let typedTimer = 0;
      const typeAhead = (char) => {
        clearTimeout(typedTimer);
        typed += char.toLowerCase();
        typedTimer = setTimeout(() => (typed = ''), TYPE_AHEAD);
        const pool = enabled();
        const start = active ? pool.indexOf(active) + (typed.length === 1 ? 1 : 0) : 0;
        const match = [...pool.slice(start), ...pool.slice(0, start)].find(({ item }) => item.textContent.trim().toLowerCase().startsWith(typed));
        if (!match) return;
        if (isOpen()) light(match);
        else choose(match);
      };
      signal.addEventListener('abort', () => clearTimeout(typedTimer));
      const letter = (event) => event.key.length === 1 && /\S/.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey;

      pick.addEventListener('click', () => (isOpen() ? close() : open()), { signal });
      pick.addEventListener('keydown', (event) => {
        const pool = enabled();
        const index = pool.indexOf(active);
        if (!isOpen()) {
          if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
            event.preventDefault();
            open();
          } else if (letter(event)) {
            typeAhead(event.key);
          }
          return;
        }
        const moves = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: pool.length - 1 };
        if (event.key in moves) {
          event.preventDefault();
          light(pool[Math.max(0, Math.min(pool.length - 1, moves[event.key]))]);
        } else if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          choose(active);
        } else if (event.key === 'Tab') {
          choose(active);
        } else if (letter(event)) {
          typeAhead(event.key);
        }
      }, { signal });
      const entryAt = (event) => entries.find(({ item }) => item === event.target.closest?.(`.${C}__option`));
      list.addEventListener('pointermove', (event) => {
        const entry = entryAt(event);
        if (entry && active !== entry && entry.item.getAttribute('aria-disabled') !== 'true') light(entry, false);
      }, { signal });
      list.addEventListener('click', (event) => choose(entryAt(event)), { signal });
      list.addEventListener('mousedown', (event) => event.preventDefault(), { signal }); // the focus stays on the word
      // The real select changed from elsewhere (a script): the word follows it
      native.addEventListener('change', () => sync(true), { signal });
      sync(false);
      return { choice, pick, value, close, sync, isOpen };
    }).filter(Boolean);
    const closeAll = () => choices.forEach((choice) => choice.close());
    document.addEventListener('pointerdown', (event) => choices.forEach((choice) => !choice.choice.contains(event.target) && choice.close()), { signal });
    // Escape closes a list wherever the focus is: opened with a click, it stays on the word (Chrome)
    // or on the page (Safari)
    document.addEventListener('keydown', (event) => {
      const open = choices.find((choice) => choice.isOpen());
      if (event.key !== 'Escape' || !open) return;
      event.preventDefault();
      open.close();
      open.pick.focus();
    }, { signal });

    // The error shares the help's line: the help goes up, the error comes in, a new error rolls
    const say = make('span', 'say');
    error.replaceChildren(say);
    let errorField = null;
    const clean = () => {
      inputs.forEach((input) => input.removeAttribute('aria-invalid'));
      errorField = null;
      form.classList.remove('is-error');
    };
    const fail = (field, message, focus = field) => {
      const shown = form.classList.contains('is-error');
      clean();
      if (shown) roll(say, message);
      else say.replaceChildren(make('span', null, message));
      form.classList.add('is-error');
      errorField = field;
      if (inputs.includes(field)) field.setAttribute('aria-invalid', 'true');
      focus?.focus();
    };
    form.noValidate = true;
    const invalid = () => {
      const wrong = inputs.find((input) => {
        const text = input.value.trim();
        return (input.required && !text) || (text && !input.validity.valid);
      });
      if (wrong) fail(wrong, wrong.dataset.error || word('required'));
      return !!wrong;
    };
    const refit = (event) => inputs.includes(event.target) && fit(event.target);
    form.addEventListener('focusin', refit, { signal });
    form.addEventListener('focusout', refit, { signal });
    form.addEventListener('input', (event) => {
      const input = event.target;
      if (!inputs.includes(input)) return;
      fit(input);
      if (errorField === input && input.value.trim() && input.validity.valid) clean();
    }, { signal });

    // The answer: the question and the reply share one cell. The question's words go up behind
    // their masks, one after the other; what the visitor typed and picked travels from its blank
    // to its place in the reply; the reply's own words rise around it; the rule under the sentence
    // glides to its new place, and the cell's height follows. Backwards, the reply leaves the same
    // way and the empty question rises.
    let running = [];
    const halt = () => {
      running.forEach((a) => a.cancel());
      running = [];
    };
    const morph = (back) => {
      halt();
      closeAll();
      panel.hidden = false;
      done.hidden = false;
      root.classList.remove('is-sending');
      root.classList.add('is-morphing');
      const gone = [];
      const settle = () => {
        (back ? done : panel).hidden = true;
        panel.inert = false;
        done.inert = false;
        root.classList.remove('is-morphing', 'is-sending');
        gone.forEach((el) => el.classList.remove('is-gone'));
        halt();
      };
      if (still) {
        settle();
        return;
      }
      (back ? done : panel).inert = true;
      const length = ANSWER * pace;
      const play = (el, frames, at, part, easing) => {
        if (!el) return null;
        const a = el.animate(frames, { duration: part * length, delay: at * length, easing, fill: 'both' });
        running.push(a);
        return a;
      };
      const ratio = scale();
      const box = stage.getBoundingClientRect();
      const top = (el) => (el ? (el.getBoundingClientRect().top - box.top) / ratio : 0);
      const from = { height: panel.offsetHeight, rule: top(foot) };
      const to = { height: done.offsetHeight, rule: top(end) };
      if (back) [from.height, to.height, from.rule, to.rule] = [to.height, from.height, to.rule, from.rule];
      const askWords = [...question.querySelectorAll(`.${C}__wi, .${C}__input, .${C}__pick`)];
      const replyWords = [...reply.querySelectorAll(`.${C}__wi`)].filter((el) => !el.closest('[hidden]'));
      const leaving = back ? replyWords : askWords;
      let arriving = back ? askWords : replyWords;
      if (!back) {
        root.classList.add('is-sending');
        const traveling = [];
        replyWords.filter((el) => el.matches('[data-value]')).forEach((target) => {
          const field = form.elements[target.dataset.value];
          if (!field?.value?.trim()) return;
          let source;
          let left;
          if (field.matches('select')) {
            const choice = choices.find((c) => c.choice.contains(field));
            source = choice?.value.lastElementChild;
            if (!source) return;
            left = source.getBoundingClientRect().left;
            gone.push(choice.pick);
          } else {
            source = field;
            left = source.getBoundingClientRect().left + parseFloat(getComputedStyle(field).paddingLeft) * ratio;
            gone.push(field.closest(`.${C}__blank`) || field);
          }
          const a = source.getBoundingClientRect();
          const b = target.getBoundingClientRect();
          const dx = (left - b.left) / ratio;
          const dy = (a.top + a.height / 2 - (b.top + b.height / 2)) / ratio;
          play(target, [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], TRAVEL_FROM, TRAVEL_TO - TRAVEL_FROM, ROLL);
          traveling.push(target);
        });
        gone.forEach((el) => el.classList.add('is-gone'));
        arriving = arriving.filter((el) => !traveling.includes(el));
      }
      leaving.forEach((el, i) => play(el, UP, (i / leaving.length) * SPREAD, LEAVE_FOR, LEAVE));
      arriving.forEach((el, i) => play(el, RISE, REPLY_AT + (i / arriving.length) * REPLY_SPREAD, REPLY_FOR, ARRIVE));
      // The rule under the sentence glides from one place to the other: the reply's carries it (the
      // question's is cleared while it moves), and what sits on it changes on the way
      const shift = (y) => ({ transform: `translateY(${y}px)` });
      const gap = to.rule - from.rule;
      [foot, privacy].forEach((el) => {
        play(el, back ? [shift(-gap), shift(0)] : [shift(0), shift(gap)], 0, 1, ROLL);
        play(el, back ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }], back ? END_AT : 0, back ? 0.4 : 0.3, back ? ARRIVE : LEAVE);
      });
      play(end, back ? [shift(0), shift(gap)] : [shift(-gap), shift(0)], 0, 1, ROLL);
      [...(end?.children || [])].forEach((el, i) => {
        if (back) play(el, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-12px)' }], 0, 0.3, LEAVE);
        else play(el, [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], END_AT + i * 0.05, 0.4, ARRIVE);
      });
      play(stage, [{ height: `${from.height}px` }, { height: `${to.height}px` }], 0, 1, ROLL).onfinish = settle;
    };

    // Sent: the reply takes the answers, then the sentence turns into it
    let sent = false;
    const answer = (data) => {
      sent = true;
      const text = (key) => String(data.get(key) || '').trim();
      values.forEach((el) => {
        el.textContent = text(el.dataset.value) || fallback.get(el);
      });
      done.querySelectorAll('[data-if]').forEach((el) => {
        el.hidden = !text(el.dataset.if);
      });
      // Sent from below the fold, the reply would land above the screen: the page follows it
      const top = stage.getBoundingClientRect().top;
      if (top < ROOM) window.scrollBy({ top: top - ROOM, behavior: still ? 'instant' : 'smooth' });
      morph(false);
      reply.focus({ preventScroll: true });
    };

    // The send: kodza:submit first (the page can take it over), then the form's action, the usual
    // way, or with fetch under data-send="fetch"
    let sending = false;
    const send = async (data) => {
      sending = true;
      button.setAttribute('aria-busy', 'true');
      const method = (form.getAttribute('method') || 'get').toUpperCase();
      const query = () => new URLSearchParams([...data].filter(([, value]) => typeof value === 'string'));
      const url = method === 'GET' ? `${form.action}${form.action.includes('?') ? '&' : '?'}${query()}` : form.action;
      try {
        const response = await fetch(url, { method, body: method === 'GET' ? undefined : data, headers: { Accept: 'application/json' }, signal });
        if (!response.ok) throw new Error(String(response.status));
        sending = false;
        answer(data);
      } catch {
        if (signal.aborted) return;
        sending = false;
        fail(button, form.dataset.failed || word('failedPlain'), null); // what was typed stays
      }
      button.removeAttribute('aria-busy');
    };
    form.addEventListener('submit', (event) => {
      closeAll();
      if (sent || sending || invalid()) {
        event.preventDefault();
        return;
      }
      clean();
      const data = new FormData(form);
      // A robot filled the hidden field: it gets its reply, nothing leaves
      if (trap?.value) {
        event.preventDefault();
        answer(data);
        return;
      }
      data.delete('website');
      if (!form.dispatchEvent(new CustomEvent('kodza:submit', { detail: { data }, bubbles: true, cancelable: true }))) {
        event.preventDefault();
        answer(data);
        return;
      }
      if (form.dataset.send !== 'fetch') return; // sent the usual way
      event.preventDefault();
      send(data);
    }, { signal });

    // Start over (the form's reset): the blanks empty, the words go back to their first choice, and
    // the reply turns back into the question
    form.addEventListener('reset', () => requestAnimationFrame(() => {
      if (signal.aborted) return;
      clean();
      closeAll();
      panel.hidden = false;
      fitAll();
      choices.forEach((choice) => choice.sync(false));
      if (!sent) return;
      sent = false;
      const inside = done.contains(document.activeElement);
      morph(true);
      if (inside) inputs[0]?.focus({ preventScroll: true });
    }), { signal });
    signal.addEventListener('abort', halt);
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
