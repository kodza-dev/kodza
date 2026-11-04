// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Form Wizard
// One real form, cut into steps. Next is the form's own submit button (Enter in a field does it
// too) and checks the step first: every faulty answer gets its error and the focus goes to the
// first one. Then the line fills, the old step leaves on the side you come from while the new one
// comes in from the other, and the card's height eases from one to the other. Back keeps every
// answer; a step already reached on the line jumps to it. The last step reads the answers back,
// each with its Edit: once the review is reached, Next on any step returns straight there, and the
// answer you changed rolls in.
// On the review, Next fires "kodza:submit" (cancelable, detail { data: FormData }): cancel it to
// send the answers yourself, and the done panel shows. Otherwise data-send="fetch" on the form
// posts them to its action without leaving the page (the label rolls to data-sending), and without
// it the form is sent the usual way. Fires "kodza:step" with { step } (0-based; the number of
// steps means sent).
// Settings: the --kz-wizard-* variables in the CSS, the words in data-* on the form (data-next,
// data-to-review, data-sending, data-edit, data-failed) and the distances below.
(() => {
  const SELECTOR = '.kodza-wizard';
  const LEAVE = 20; // px the old step slides as it leaves
  const ENTER = 28; // px the new step slides in from
  const FAILED = 'That did not go through. Try again.'; // a failed fetch, unless data-failed says otherwise
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  let uid = 0;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const box = root.querySelector('.kodza-wizard__panels');
    const next = root.querySelector('.kodza-wizard__next');
    if (root.tagName !== 'FORM' || !box || !next) return;
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const style = getComputedStyle(root);
    const duration = (parseFloat(style.getPropertyValue('--kz-wizard-duration')) * 1000 || 600) * pace;
    const ease = style.getPropertyValue('--kz-wizard-ease').trim() || 'ease';
    const steps = [...root.querySelectorAll('.kodza-wizard__step')];
    const review = box.querySelector(':scope > .kodza-wizard__review');
    const done = box.querySelector(':scope > .kodza-wizard__done');
    const panels = [...box.querySelectorAll(':scope > .kodza-wizard__panel')].filter((panel) => panel !== review && panel !== done);
    if (!panels.length) return;
    const pages = review ? [...panels, review] : panels; // what the line walks through
    const last = pages.length - 1;
    const summary = review?.querySelector('.kodza-wizard__summary');
    const back = root.querySelector('.kodza-wizard__back');
    const status = root.querySelector('.kodza-wizard__status');
    const actions = root.querySelector('.kodza-wizard__actions');
    const labels = {
      next: root.dataset.next || 'Next',
      back: root.dataset.toReview || 'Back to review',
      send: next.textContent.trim() || 'Send',
      sending: root.dataset.sending || 'Sending…',
    };
    root.noValidate = true; // each step is checked here, and says why in the form's own words
    root.style.setProperty('--kz-wizard-n', steps.length);
    const titleOf = (panel) => panel?.querySelector('.kodza-wizard__title');
    [review, done].forEach((panel) => titleOf(panel)?.setAttribute('tabindex', '-1'));

    // Mouse or keyboard: the focus only moves for the keyboard (or to an error)
    let byKeyboard = false;
    root.addEventListener('keydown', () => { byKeyboard = true; }, { signal });
    root.addEventListener('pointerdown', () => { byKeyboard = false; }, { signal });

    // A word that changes rolls: the old one goes up, the new one comes from below
    const roll = (holder, text, delay = 0) => {
      const prev = holder.lastElementChild;
      if (prev?.textContent === text) return;
      const span = document.createElement('span');
      span.textContent = text;
      holder.append(span);
      if (!prev) return;
      if (still) return prev.remove();
      prev.setAttribute('aria-hidden', 'true');
      const timing = { duration: duration * 0.8, delay, easing: ease };
      prev.animate([{ transform: 'none' }, { transform: 'translateY(-110%)' }], { ...timing, fill: 'forwards' }).finished.then(() => prev.remove(), () => {});
      span.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], { ...timing, fill: 'backwards' });
    };

    // The button label sits in a little window, and the button is as wide as its longest label
    const word = document.createElement('span');
    const window_ = document.createElement('span');
    window_.className = 'kodza-wizard__roll';
    window_.append(word);
    next.replaceChildren(window_);
    next.style.minWidth = `${Math.max(...Object.values(labels).map((text) => {
      word.textContent = text;
      return next.offsetWidth;
    }))}px`;
    word.textContent = labels.next;

    // Every answer (a field, or a group of radios) with its note: the hint and the error are wired
    // to it, in the order of the steps
    const prefix = `kodza-wizard-${++uid}`;
    const fields = [];
    panels.forEach((panel, page) => {
      panel.querySelectorAll('.kodza-wizard__field, .kodza-wizard__group').forEach((wrap) => {
        const inputs = [...wrap.querySelectorAll('input, select, textarea')];
        if (!inputs.length) return;
        const note = wrap.querySelector(':scope > .kodza-wizard__note');
        const hint = note?.querySelector('.kodza-wizard__hint');
        const error = note?.querySelector('.kodza-wizard__error');
        const id = `${prefix}-${fields.length}`;
        const described = [];
        if (hint) described.push((hint.id = `${id}-hint`));
        if (error) described.push((error.id = `${id}-error`));
        if (described.length) inputs.forEach((input) => input.setAttribute('aria-describedby', described.join(' ')));
        const name = wrap.querySelector('.kodza-wizard__legend, .kodza-wizard__label')?.textContent.trim() || inputs[0].name;
        fields.push({ inputs, note, error, page, name });
      });
    });
    const pick = (input) => input.type === 'radio' || input.type === 'checkbox';
    const firstOf = (field) => field.inputs.find((input) => input.checked) || field.inputs[0];

    const check = (field) => {
      const bad = field.inputs.find((input) => !input.validity.valid);
      if (field.error) field.error.textContent = bad ? bad.dataset.error || field.inputs.find((input) => input.dataset.error)?.dataset.error || bad.validationMessage : '';
      field.note?.classList.toggle('is-invalid', !!bad);
      field.inputs.forEach((input) => input.setAttribute('aria-invalid', String(!!bad)));
      return !bad;
    };
    // Every answer of the step, so that all its errors show at once
    const checkPage = (page) => fields.filter((field) => field.page === page).map(check).every(Boolean);
    const focusError = (page) => {
      const field = fields.find((item) => item.page === page && item.inputs[0].getAttribute('aria-invalid') === 'true');
      field?.inputs[0].focus();
    };
    // Judged on Next, then live while the visitor fixes it. A field left with a typed value is
    // judged right away (an email with no @); an empty one waits for Next
    fields.forEach((field) => field.inputs.forEach((input) => {
      input.addEventListener(pick(input) ? 'change' : 'input', () => {
        if (status) status.textContent = '';
        if (input.getAttribute('aria-invalid') === 'true') check(field);
      }, { signal });
      if (!pick(input)) input.addEventListener('blur', () => input.value && check(field), { signal });
    }));

    // The review: one line per answer given, in the order of the steps
    const rows = new Map();
    let editing = null; // the answer whose Edit was pressed, to come back to on the review
    const answer = (field) => field.inputs
      .filter((input) => (pick(input) ? input.checked : input.value.trim()))
      .map((input) => (pick(input) ? input.closest('label')?.textContent.trim() || input.value : input.value.trim()))
      .join(', ');
    const fill = (delay) => {
      if (!summary) return;
      let index = 0;
      fields.forEach((field) => {
        const value = answer(field);
        let row = rows.get(field);
        if (!value) {
          row?.el.remove();
          rows.delete(field);
          return;
        }
        if (!row) {
          const el = document.createElement('div');
          el.className = 'kodza-wizard__row';
          const term = document.createElement('dt');
          term.textContent = field.name;
          const desc = document.createElement('dd');
          const holder = document.createElement('span');
          holder.className = 'kodza-wizard__value';
          const edit = document.createElement('button');
          edit.type = 'button';
          edit.className = 'kodza-wizard__edit';
          edit.textContent = root.dataset.edit || 'Edit';
          edit.setAttribute('aria-label', `${edit.textContent} ${field.name.toLowerCase()}`);
          edit.addEventListener('click', () => {
            editing = field;
            go(field.page);
            if (byKeyboard) firstOf(field).focus({ preventScroll: true });
          }, { signal });
          desc.append(holder, edit);
          el.append(term, desc);
          row = { el, holder, edit };
          rows.set(field, row);
        }
        roll(row.holder, value, delay);
        if (summary.children[index] !== row.el) summary.insertBefore(row.el, summary.children[index] || null);
        index += 1;
      });
    };

    // The step change: the old step leaves (placed over the new one) while the new one comes in
    // from the side you head to, and the panels' height eases between the two. On sending, the buttons fade
    // and the card closes over them
    let moving = [];
    const swap = (from, to, forward, sent) => {
      const h0 = box.offsetHeight; // where a change still running stands
      const H0 = root.offsetHeight;
      moving.forEach((animation) => animation.cancel());
      moving = [];
      box.querySelectorAll(':scope > .is-leaving').forEach((panel) => panel.classList.remove('is-leaving'));
      from?.classList.remove('is-current');
      to.classList.add('is-current');
      root.classList.toggle('is-sent', sent);
      if (!from || still) return;
      from.classList.add('is-leaving');
      const h1 = box.offsetHeight;
      const H1 = root.offsetHeight;
      if (sent) root.classList.remove('is-sent');
      const side = forward ? -1 : 1;
      const run = (el, frames, timing) => moving.push(el.animate(frames, timing)) && moving[moving.length - 1];
      run(from, [{ opacity: 1 }, { opacity: 0 }], { duration: 220 * pace, easing: 'ease', fill: 'forwards' });
      run(from, [{ transform: 'none' }, { transform: `translateX(${side * LEAVE}px)` }], { duration: 320 * pace, easing: 'ease-in', fill: 'forwards' });
      run(to, [{ opacity: 0 }, { opacity: 1 }], { duration: 400 * pace, delay: 40 * pace, easing: 'ease', fill: 'backwards' });
      run(to, [{ transform: `translateX(${side * -ENTER}px)` }, { transform: 'none' }], { duration, easing: ease });
      box.style.clipPath = 'inset(-8px -28px 0)'; // what is past the moving edge stays hidden
      const height = run(box, [{ height: `${h0}px` }, { height: `${h1}px` }], { duration, easing: ease });
      if (sent && actions) {
        root.style.overflow = 'hidden';
        run(actions, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(8px)' }], { duration: 220 * pace, easing: 'ease', fill: 'forwards' });
        run(root, [{ height: `${H0}px` }, { height: `${H1}px` }], { duration, easing: ease });
      }
      height.finished.then(() => {
        from.classList.remove('is-leaving');
        box.style.removeProperty('clip-path');
        root.style.removeProperty('overflow');
        if (sent) root.classList.add('is-sent');
        moving.forEach((animation) => animation.cancel());
        moving = [];
      }, () => {});
    };

    let current = -1;
    let reached = 0; // the furthest step shown: every step up to it can be jumped to
    const go = (target, focus = false) => {
      if (target === current) return;
      const sent = target > last;
      const from = current < 0 ? null : current > last ? done : pages[current];
      const to = sent ? done : pages[target];
      if (!to) return;
      const forward = target > current;
      const hadBack = document.activeElement === back;
      reached = Math.max(reached, Math.min(target, last));
      if (to === review) fill(from && !still ? duration * 0.5 : 0);
      steps.forEach((step, i) => {
        const finished = sent || (i < reached && i !== target);
        step.classList.toggle('is-done', finished);
        step.classList.toggle('is-current', i === target);
        const dot = step.querySelector('.kodza-wizard__dot');
        const label = step.querySelector('.kodza-wizard__step-label')?.textContent.trim() || `Step ${i + 1}`;
        if (!dot) return;
        dot.disabled = sent || i === target || i > reached;
        dot.setAttribute('aria-label', `${label}, step ${i + 1} of ${steps.length}${finished ? ', done' : i === target ? ', current' : ''}`);
        if (i === target) step.setAttribute('aria-current', 'step');
        else step.removeAttribute('aria-current');
      });
      root.style.setProperty('--kz-wizard-progress', sent || !last ? 1 : reached / last);
      if (back) back.disabled = target === 0 || sent;
      if (status) status.textContent = '';
      roll(window_, target >= last ? labels.send : reached === last ? labels.back : labels.next);
      swap(from, to, forward, sent);
      current = target;
      root.dispatchEvent(new CustomEvent('kodza:step', { detail: { step: target }, bubbles: true }));

      // The button that had the focus is gone: the focus goes to the news. Otherwise it only moves
      // for the keyboard: to the step's first answer, or back to the Edit you left from
      if (sent) return titleOf(done)?.focus({ preventScroll: true });
      if (focus) {
        const field = fields.find((item) => item.page === target);
        const back_ = to === review && editing && rows.get(editing)?.edit;
        (back_ || (field ? firstOf(field) : titleOf(to)))?.focus({ preventScroll: true });
      } else if (hadBack && back.disabled) next.focus({ preventScroll: true });
      if (to === review) editing = null;
    };

    // Moving on checks every step on the way: the first faulty one stops it there
    const reach = (target) => {
      for (let page = current; page < target; page += 1) {
        if (page < panels.length && !checkPage(page)) {
          go(page);
          return focusError(page);
        }
      }
      go(target, byKeyboard);
    };

    let sending = false;
    const send = async (data) => {
      sending = true;
      next.setAttribute('aria-busy', 'true');
      roll(window_, labels.sending);
      const method = (root.getAttribute('method') || 'get').toUpperCase();
      const url = method === 'GET' ? `${root.action}${root.action.includes('?') ? '&' : '?'}${new URLSearchParams(data)}` : root.action;
      try {
        const response = await fetch(url, { method, body: method === 'GET' ? undefined : data, headers: { Accept: 'application/json' }, signal });
        if (!response.ok) throw new Error(String(response.status));
        sending = false;
        go(last + 1);
      } catch (error) {
        if (signal.aborted) return;
        sending = false;
        if (status) status.textContent = root.dataset.failed || FAILED;
        roll(window_, labels.send);
      }
      next.removeAttribute('aria-busy');
    };

    root.addEventListener('submit', (event) => {
      if (sending || current > last) return event.preventDefault();
      if (current < last) {
        event.preventDefault();
        return reach(reached === last ? last : current + 1);
      }
      // The review (or the last step): every step once more, then the form goes
      const faulty = panels.findIndex((_, page) => !checkPage(page));
      if (faulty >= 0) {
        event.preventDefault();
        go(faulty);
        return focusError(faulty);
      }
      const data = new FormData(root);
      if (!root.dispatchEvent(new CustomEvent('kodza:submit', { detail: { data }, bubbles: true, cancelable: true }))) {
        event.preventDefault();
        return go(last + 1);
      }
      if (root.dataset.send !== 'fetch') return; // sent the usual way
      event.preventDefault();
      send(data);
    }, { signal });
    back?.addEventListener('click', () => go(current - 1, byKeyboard), { signal });
    steps.forEach((step, i) => step.querySelector('.kodza-wizard__dot')?.addEventListener('click', () => (i < current ? go(i, byKeyboard) : reach(i)), { signal }));

    // From here, the steps are shown by the script, one at a time, not by the hidden attribute
    [review, done].forEach((panel) => panel?.removeAttribute('hidden'));
    root.classList.add('is-ready');
    go(0);
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
