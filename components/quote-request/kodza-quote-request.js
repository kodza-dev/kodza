// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Quote Request
// The quote form of a trade, in five steps: the job, the postcode, photos, a rough timing, you.
// Each step's number turns into a tick once it is answered. The postcode is checked against your
// area as you type (the sentence beside it rolls to "In our area" or "Outside our area"). Photos
// come from the picker or a drop anywhere on the zone, as thumbnails you can take back out. On
// send, the form folds into the receipt of what you asked for: every step slides up to its line,
// the line's name and number carry over, and the answers rise in.
// The form is a real one: it goes to its `action` (job, postcode, photos, when, name, email, phone,
// message) the usual way, or with fetch under data-send="fetch". A hidden field catches robots:
// filled, nothing is sent. A group marked data-required must be picked, its data-error says why.
// Settings: the variables at the top of component.css; on the postcode, data-area (postcodes or
// their first digits, apart by spaces) and data-place (the town the receipt names); on the file
// field, data-max (photos) and data-max-mb (per photo); on the form, data-send and data-failed (the
// message when a fetch send fails); the words below, each one replaced by a data-text-<key> on the
// root (data-text-too-big for tooBig); the timings are the constants under them.
// The page hears kodza:submit (cancelable, event.detail.data the FormData) before the send.
(() => {
  const SELECTOR = '.kodza-quote-request';
  const WORDS = {
    inside: 'In our area. We come to you.', // the postcode is in data-area
    outside: 'Outside our area. Call us, we’ll find you someone.',
    where: '{code}, {place}', // the receipt, a postcode in the area
    none: 'None. We come and look.', // the receipt, no photo
    one: '1 photo',
    photos: '{n} photos',
    open: 'We’ll ask', // the receipt, no timing picked
    left: '{left} left', // the message's count, from 80 % of its maxlength
    required: 'This one is needed.', // a required field with no data-error
    room: 'Room for {left} more.', // the drop zone, photos in
    full: 'That’s the lot. Remove one to swap it.',
    tooMany: '{max} photos at most. The first ones are in.',
    tooBig: '{name} is over {mb} MB. Leave it out or shrink it.',
    notPhoto: '{name} is not a picture.',
    remove: 'Remove {name}', // the label of a thumbnail's button
    failed: 'That did not go through. Call {phone} instead.', // the number of the "Rather call?" link
    failedPlain: 'That did not go through. Try again.',
  };
  const FOLD = 1000; // ms: the form folds into the receipt (and back, on Start over)
  const LEAVE_UNTIL = 0.3; // the steps' answers are gone at 30 % of FOLD...
  const HEAD_AT = 0.36; // ...the receipt's title rises from 36 %, once they have left...
  const VALUE_AT = 0.38; // ...its answers from 38 %...
  const VALUE_EACH = 0.06; // ...one after the other...
  const END_AT = 0.5; // ...and what comes next from 50 %
  const ROOM = 24; // px kept above the receipt when the page scrolls back up to it
  const LINE = 450; // ms: a sentence rolls to the next one
  const SHOT = 420; // ms: a thumbnail comes in, or goes
  const FIT = 220; // ms: the message box grows with the text
  const ROLL = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const ARRIVE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const LEAVE = 'cubic-bezier(0.55, 0, 1, 0.45)';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The page's pace: --kz-motion-scale (1 = Kodza, 0.5 = twice as fast, 0 = no motion at all)
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const fill = (text, values) => text.replace(/\{(\w+)\}/g, (all, key) => (key in values ? values[key] : all));
  const C = 'kodza-quote-request';

  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace;
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
    if (!form || !stage || !panel || !done || !button || !error) return;
    const steps = [...panel.querySelectorAll(`.${C}__step`)];
    const code = q('code');
    const zone = q('zone')?.querySelector(`.${C}__roll`);
    const drop = q('drop');
    const file = q('file');
    const shots = q('shots');
    const photos = q('photos');
    const hint = drop?.querySelector(`.${C}__drop-hint .${C}__roll`);
    const area = q('area');
    const frame = area?.closest(`.${C}__box`);
    const count = q('count');
    const call = q('call');
    const trap = form.querySelector('[name="website"]');
    const idle = { zone: zone?.textContent || '', hint: hint?.textContent || '' };

    // A sentence rolls to the next one: the old one goes up, the new one comes from below, and the
    // box's height follows (two sentences may not take the same number of lines)
    const roll = (box, text) => {
      if (!box) return;
      const old = box.lastElementChild;
      if (old?.textContent === text) return;
      box.getAnimations({ subtree: true }).forEach((a) => a.finish());
      [...box.children].slice(0, -1).forEach((el) => el.remove());
      const line = make('span', 'said', text);
      if (still || !old || !box.offsetParent) {
        box.replaceChildren(line);
        return;
      }
      const from = box.offsetHeight;
      box.append(line);
      old.setAttribute('aria-hidden', 'true');
      const to = line.offsetHeight;
      box.classList.add('is-rolling');
      const timing = { duration: LINE * pace, easing: ARRIVE };
      if (from !== to) box.animate([{ height: `${from}px` }, { height: `${to}px` }], timing);
      old.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-110%)' }], { ...timing, fill: 'forwards' });
      line.animate([{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }], timing).onfinish = () => {
        old.remove();
        if (box.lastElementChild === line) box.classList.remove('is-rolling');
      };
    };
    // A box whose content changes height (thumbnails in, thumbnails out) grows or shrinks to it
    const settle = (box, change) => {
      const from = box?.offsetHeight;
      change();
      if (still || !box?.offsetParent) return;
      box.getAnimations().forEach((a) => a.cancel());
      const to = box.offsetHeight;
      if (from === to) return;
      box.classList.add('is-rolling');
      box.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: SHOT * pace, easing: ARRIVE }).onfinish = () => box.classList.remove('is-rolling');
    };

    // A step is answered once its required fields are filled and valid (or, with none required, once
    // one of them is): its number turns into a tick
    const fieldsOf = (step) => [...step.querySelectorAll('input[name], textarea[name], select[name]')].filter((f) => f !== trap && !f.disabled);
    const has = (f) => {
      if (f.type === 'radio' || f.type === 'checkbox') return f.checked;
      if (f.type === 'file') return f.files.length > 0;
      return f.value.trim() !== '';
    };
    const good = (f) => has(f) && f.validity.valid;
    const answered = (step) => {
      const fields = fieldsOf(step);
      const needed = fields.filter((f) => f.required);
      return needed.length ? needed.every(good) : fields.some(good);
    };
    const mark = () => steps.forEach((step) => step.classList.toggle('is-answered', answered(step)));

    // The postcode: digits only, and at five, the sentence beside it says if we come
    const areas = (code?.dataset.area || '').split(/[\s,]+/).filter(Boolean);
    const inArea = () => code?.value.length === 5 && areas.some((a) => code.value.startsWith(a));
    const check = () => {
      if (!code || !areas.length) return;
      const set = code.value.length === 5;
      zone.parentElement.classList.toggle('is-set', set);
      roll(zone, set ? word(inArea() ? 'inside' : 'outside') : idle.zone);
    };
    code?.addEventListener('input', () => {
      const digits = code.value.replace(/\D/g, '').slice(0, 5);
      if (digits !== code.value) code.value = digits;
      check();
    }, { signal });

    // Photos: the picker and a drop add to the list, a thumbnail's button takes one back out; the
    // file field is kept in step with the list, so the form sends what you see
    const maxShots = Number(file?.dataset.max) || Infinity;
    const maxMb = Number(file?.dataset.maxMb) || 0;
    let list = [];
    let stale = []; // addresses of photos taken out, freed once nothing shows them any more
    const free = () => {
      stale.forEach((url) => URL.revokeObjectURL(url));
      stale = [];
    };
    const sync = () => {
      if (!file) return;
      const files = new DataTransfer();
      list.forEach((shot) => files.items.add(shot.file));
      file.files = files.files;
      mark();
    };
    const tell = (warning) => {
      drop?.classList.toggle('is-warned', !!warning);
      if (warning) roll(hint, warning);
      else if (list.length) roll(hint, list.length >= maxShots ? word('full') : fill(word('room'), { left: maxShots - list.length }));
      else roll(hint, idle.hint);
    };
    const add = (files) => {
      if (!file || !shots) return;
      let warning = '';
      const fresh = [];
      for (const picked of files) {
        if (!picked.type.startsWith('image/')) {
          warning ||= fill(word('notPhoto'), { name: picked.name });
          continue;
        }
        if (maxMb && picked.size > maxMb * 1048576) {
          warning ||= fill(word('tooBig'), { name: picked.name, mb: maxMb });
          continue;
        }
        if (list.some((shot) => shot.file.name === picked.name && shot.file.size === picked.size && shot.file.lastModified === picked.lastModified)) continue;
        if (list.length >= maxShots) {
          warning ||= fill(word('tooMany'), { max: maxShots });
          break;
        }
        const url = URL.createObjectURL(picked);
        const item = make('li', 'shot');
        const image = make('img');
        image.src = url;
        image.alt = picked.name;
        const remove = make('button', 'remove');
        remove.type = 'button';
        remove.setAttribute('aria-label', fill(word('remove'), { name: picked.name }));
        remove.innerHTML = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 2l6 6M8 2 2 8" /></svg>';
        item.append(image, remove);
        const shot = { file: picked, url, item, remove };
        list.push(shot);
        fresh.push(shot);
      }
      if (fresh.length) {
        settle(photos, () => shots.append(...fresh.map((shot) => shot.item)));
        if (!still) {
          fresh.forEach((shot, i) => shot.item.animate([{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'none' }], {
            duration: SHOT * pace, delay: i * 50 * pace, easing: ARRIVE, fill: 'backwards',
          }));
        }
      }
      sync();
      tell(warning);
    };
    const take = (shot) => {
      const at = list.indexOf(shot);
      if (at < 0) return;
      list.splice(at, 1);
      sync();
      tell('');
      // The focus was on its button: it moves to the next thumbnail's, or back to the picker
      if (shot.item.contains(document.activeElement)) ((list[at] || list[at - 1])?.remove || file).focus();
      shot.item.inert = true;
      stale.push(shot.url);
      const gone = () => settle(photos, () => shot.item.remove());
      if (still) {
        gone();
        return;
      }
      shot.item.animate([
        { width: '64px', marginRight: '0px', opacity: 1, transform: 'none' },
        { width: '0px', marginRight: '-8px', opacity: 0, transform: 'scale(0.6)' },
      ], { duration: SHOT * pace, easing: ROLL, fill: 'forwards' }).onfinish = gone;
    };
    file?.addEventListener('change', () => {
      const picked = [...file.files];
      if (picked.length) add(picked);
      else sync(); // a picker closed with nothing: the list stays
    }, { signal });
    shots?.addEventListener('click', (event) => {
      const remove = event.target.closest(`.${C}__remove`);
      const shot = remove && list.find((s) => s.remove === remove);
      if (shot) take(shot);
    }, { signal });

    // Files dragged anywhere over the page: the zone wakes up, and marches once they are over it
    const hasFiles = (event) => [...(event.dataTransfer?.types || [])].includes('Files');
    let depth = 0;
    window.addEventListener('dragenter', (event) => {
      if (!hasFiles(event)) return;
      depth++;
      root.classList.add('is-dragging');
    }, { signal });
    window.addEventListener('dragleave', () => {
      depth = Math.max(0, depth - 1);
      if (!depth) root.classList.remove('is-dragging');
    }, { signal });
    window.addEventListener('drop', () => {
      depth = 0;
      root.classList.remove('is-dragging');
      drop?.classList.remove('is-over');
    }, { signal });
    // A drop next to the zone should not open the file in the tab
    window.addEventListener('dragover', (event) => hasFiles(event) && event.preventDefault(), { signal });
    drop?.addEventListener('dragover', (event) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      drop.classList.add('is-over');
    }, { signal });
    drop?.addEventListener('dragleave', (event) => {
      if (!drop.contains(event.relatedTarget)) drop.classList.remove('is-over');
    }, { signal });
    drop?.addEventListener('drop', (event) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      add([...event.dataTransfer.files]);
    }, { signal });

    // The message box grows with the text, and counts down near its maxlength
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
    // Cmd+Enter (Ctrl+Enter) in the message sends the form
    area?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      form.requestSubmit(button);
    }, { signal });
    counted();

    // The checks, in the order of the form: the first one missing says why, and takes the focus
    let errorField = null;
    const marked = (field) => (field.matches('fieldset') ? [...field.querySelectorAll('input')] : (field.matches('input, textarea') ? [field] : []));
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
    form.noValidate = true;
    const invalid = () => {
      for (const step of steps) {
        if (step.matches('fieldset') && step.hasAttribute('data-required') && !step.querySelector('input:checked')) {
          fail(step, step.dataset.error || word('required'), step.querySelector('input'));
          return true;
        }
        for (const field of fieldsOf(step)) {
          if (field.type === 'radio' || field.type === 'checkbox' || field.type === 'file') continue;
          const value = field.value.trim();
          if ((field.required && !value) || (value && !field.validity.valid)) {
            fail(field, field.dataset.error || word('required'));
            return true;
          }
        }
      }
      return false;
    };
    form.addEventListener('input', (event) => {
      mark();
      if (!errorField) return;
      const fixed = errorField.matches('fieldset')
        ? !!errorField.querySelector('input:checked')
        : errorField === event.target && event.target.value.trim() && event.target.validity.valid;
      if (fixed) clean();
    }, { signal });
    form.addEventListener('change', mark, { signal });

    // The fold: the form and the receipt share one cell. Each step slides up to its line of the
    // receipt, cut off where the next line starts, while its answers fade; the line takes its name
    // and number over, splits from the one above it, and its answer rises. The foot turns into
    // what comes next. Played backwards, it unfolds the empty form again.
    let folding = [];
    const fold = (back, ended) => {
      folding.forEach((a) => a.cancel());
      folding = [];
      root.classList.remove('is-morphing');
      panel.hidden = false;
      done.hidden = false;
      const close = () => {
        (back ? done : panel).hidden = true;
        root.classList.remove('is-morphing');
        folding.forEach((a) => a.cancel());
        folding = [];
        ended?.();
      };
      if (still) {
        close();
        return;
      }
      // Measured on screen, divided by the parent's scale (a scaled thumbnail, a theme's transform)
      const box = stage.getBoundingClientRect();
      const ratio = box.height / stage.offsetHeight || 1;
      const top = (el) => (el.getBoundingClientRect().top - box.top) / ratio;
      const left = (el) => (el.getBoundingClientRect().left - box.left) / ratio;
      const end = q('end');
      const foot = q('foot');
      const privacy = q('privacy');
      const lines = steps.map((step) => ({ step, row: done.querySelector(`[data-row="${step.dataset.step}"]`) })).filter((pair) => pair.row);
      const tall = { panel: panel.offsetHeight, done: done.offsetHeight };
      const play = (el, frames, at, length, easing) => {
        const animation = el?.animate(frames, {
          duration: length * FOLD * pace,
          delay: (back ? 1 - at - length : at) * FOLD * pace,
          easing,
          direction: back ? 'reverse' : 'normal',
          fill: 'both',
        });
        if (animation) folding.push(animation);
        return animation;
      };
      const shift = (y) => `translateY(${y}px)`;
      const sides = lines.map(({ step, row }, i) => {
        const s = top(step);
        const r = top(row);
        const next = lines[i + 1] ? top(lines[i + 1].row) : (end ? top(end) : r + row.offsetHeight);
        const cut = Math.max(0, step.offsetHeight - (next - r));
        const from = step.querySelector(`.${C}__name`);
        const to = row.querySelector(`.${C}__name`);
        return { step, row, s, r, cut, dx: from && to ? left(from) - left(to) : 0, dy: from && to ? top(from) - top(to) - (s - r) : 0 };
      });
      const footTop = foot ? top(foot) : tall.panel;
      const endTop = end ? top(end) : tall.done;
      root.classList.add('is-morphing');
      const main = play(stage, [{ height: `${tall.panel}px` }, { height: `${tall.done}px` }], 0, 1, ROLL);
      sides.forEach(({ step, row, s, r, cut, dx, dy }, i) => {
        play(row, [{ transform: shift(s - r) }, { transform: 'none' }], 0, 1, ROLL);
        play(row.querySelector('dt'), [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], 0, 1, ROLL);
        play(step, [
          { transform: 'none', clipPath: 'inset(0px 0px 0px 0px)' },
          { transform: shift(r - s), clipPath: `inset(0px 0px ${cut}px 0px)` },
        ], 0, 1, ROLL);
        step.querySelectorAll(':scope > :not(legend, p)').forEach((el) => play(el, [{ opacity: 1 }, { opacity: 0 }], 0, LEAVE_UNTIL, LEAVE));
        play(step.querySelector(`.${C}__hint`), [{ opacity: 1 }, { opacity: 0 }], 0, LEAVE_UNTIL, LEAVE);
        play(row.querySelector(`.${C}__value`), [{ transform: 'translateY(110%)' }, { transform: 'none' }], VALUE_AT + i * VALUE_EACH, 0.42, ARRIVE);
      });
      [foot, privacy].forEach((el) => {
        play(el, [{ transform: 'none' }, { transform: shift(endTop - footTop) }], 0, 1, ROLL);
        play(el, [{ opacity: 1 }, { opacity: 0 }], 0, 0.35, LEAVE);
      });
      play(end, [{ transform: shift(footTop - endTop) }, { transform: 'none' }], 0, 1, ROLL);
      [...(end?.children || [])].forEach((el, i) => play(el, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], END_AT + i * 0.05, 0.45, ARRIVE));
      const head = done.querySelector(`.${C}__row--head`);
      head?.querySelectorAll(`.${C}__eyebrow, .${C}__thanks`).forEach((el) => play(el, [{ transform: 'translateY(110%)' }, { transform: 'none' }], HEAD_AT, 0.45, ARRIVE));
      main.onfinish = close;
    };

    // Sent: the receipt says back what was asked, then the form folds into it
    let sent = false;
    const finish = (values) => {
      sent = true;
      const text = (key) => String(values.get(key) || '').trim();
      const put = (key, value) => done.querySelectorAll(`[data-value="${key}"]`).forEach((el) => { el.textContent = value; });
      put('name', text('name').split(/\s+/)[0] || 'you');
      put('job', text('job'));
      const place = code?.dataset.place;
      put('where', inArea() && place ? fill(word('where'), { code: text('postcode'), place }) : text('postcode'));
      put('photos', list.length ? (list.length === 1 ? word('one') : fill(word('photos'), { n: list.length })) : word('none'));
      const thumbs = done.querySelector(`.${C}__thumbs`);
      thumbs?.replaceChildren(...list.slice(0, 3).map((shot) => {
        const image = make('img');
        image.src = shot.url;
        image.alt = '';
        return image;
      }));
      put('when', text('when') || word('open'));
      put('you', [text('email'), text('phone')].filter(Boolean).join(', '));
      steps.forEach((step) => done.querySelector(`[data-row="${step.dataset.step}"]`)?.classList.toggle('is-answered', step.classList.contains('is-answered')));
      // Sent from the foot of a tall form, the receipt would land above the screen: the page follows it
      const top = stage.getBoundingClientRect().top;
      if (top < ROOM) window.scrollBy({ top: top - ROOM, behavior: still ? 'instant' : 'smooth' });
      fold(false);
      q('thanks')?.focus({ preventScroll: true });
    };

    // The send: kodza:submit first (the page can take it over), then the form's action, the usual
    // way, or with fetch under data-send="fetch"
    let sending = false;
    const send = async (values) => {
      sending = true;
      button.setAttribute('aria-busy', 'true');
      const method = (form.getAttribute('method') || 'get').toUpperCase();
      const query = () => new URLSearchParams([...values].filter(([, value]) => typeof value === 'string'));
      const url = method === 'GET' ? `${form.action}${form.action.includes('?') ? '&' : '?'}${query()}` : form.action;
      try {
        const response = await fetch(url, { method, body: method === 'GET' ? undefined : values, headers: { Accept: 'application/json' }, signal });
        if (!response.ok) throw new Error(String(response.status));
        sending = false;
        finish(values);
      } catch {
        if (signal.aborted) return;
        sending = false;
        // What was picked, typed and dropped stays; the phone is the way out
        const phone = call?.textContent.trim();
        fail(button, form.dataset.failed || (phone ? fill(word('failed'), { phone }) : word('failedPlain')), null);
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

    // Start over (the form's reset): the photos go, the sentences go back to their first words,
    // and the empty form unfolds from the receipt
    form.addEventListener('reset', () => requestAnimationFrame(() => {
      if (signal.aborted) return;
      clean();
      stale.push(...list.map((shot) => shot.url));
      list = [];
      shots?.replaceChildren();
      drop?.classList.remove('is-warned');
      roll(hint, idle.hint);
      zone?.parentElement.classList.remove('is-set');
      roll(zone, idle.zone);
      if (area) {
        area.style.height = '';
        area.classList.remove('is-long');
      }
      counted();
      mark();
      if (!sent) {
        free();
        return;
      }
      const inside = done.contains(document.activeElement);
      sent = false;
      done.querySelectorAll(`.${C}__row`).forEach((row) => row.classList.remove('is-answered'));
      fold(true, () => {
        done.querySelector(`.${C}__thumbs`)?.replaceChildren();
        free();
      });
      if (inside) form.querySelector('input')?.focus({ preventScroll: true });
    }), { signal });
    mark();
    signal.addEventListener('abort', () => {
      stale.push(...list.map((shot) => shot.url));
      free();
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
