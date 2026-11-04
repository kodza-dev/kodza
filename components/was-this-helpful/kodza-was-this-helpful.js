// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Was This Helpful
// Yes is sent as soon as it is pressed. No opens "Tell us more" and waits for its Send button,
// so the note stays optional. Sending it is yours, two ways:
// - the form's action and method (your endpoint, a WordPress plugin): the script posts the
//   fields there, helpful=yes|no and more (the note, with No only). Another site's answer
//   cannot be read, so it counts as sent;
// - or cancel the "kodza:helpful" event (detail: { value, more, data, done, fail }) and send it
//   yourself, then call detail.done(), or detail.fail("Your message") to show it in place of the
//   line that was sent.
// root.kodzaHelpful = { done, fail, reset } does the same from anywhere. The failure message
// defaults to data-fail on the form. The motion is CSS.
(() => {
  const SELECTOR = '.kodza-helpful';
  // The answer waits at least this long (ms): the ink always fills, and a fast answer never
  // flashes the ring
  const MIN_WAIT = 900;
  const FAIL_TEXT = 'Could not send. Try again.';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  let uid = 0;

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const form = root.closest('form');
    const ask = root.querySelector('.kodza-helpful__ask');
    const question = root.querySelector('.kodza-helpful__question');
    const yes = root.querySelector('.kodza-helpful__choice:not(.kodza-helpful__choice--no)');
    const no = root.querySelector('.kodza-helpful__choice--no');
    const done = root.querySelector('.kodza-helpful__done');
    const text = root.querySelector('.kodza-helpful__text');
    const sendButton = root.querySelector('.kodza-helpful__send');
    const errors = {
      ask: root.querySelector('.kodza-helpful__label .kodza-helpful__error'),
      more: root.querySelector('.kodza-helpful__note .kodza-helpful__error'),
    };
    if (!form || !ask || !yes || !no || !done || !errors.ask) return;
    const minWait = still ? 0 : MIN_WAIT * pace;

    if (question) {
      question.id = `kodza-helpful-${++uid}`;
      ask.setAttribute('aria-labelledby', question.id);
    }
    yes.setAttribute('aria-pressed', 'false');
    no.setAttribute('aria-pressed', 'false');

    // Each thanks is written when it shows: a status that receives text is read out
    const thanks = [...root.querySelectorAll('.kodza-helpful__thanks')];
    const said = new Map(thanks.map((el) => [el, el.textContent.trim()]));
    thanks.forEach((el) => { el.textContent = ''; });

    // Focus is only moved for a visitor on the keyboard: after a click, a ring would show
    let fromKeyboard = false;
    root.addEventListener('keydown', () => { fromKeyboard = true; }, { signal });
    root.addEventListener('pointerdown', () => { fromKeyboard = false; }, { signal });

    const press = (value) => {
      yes.setAttribute('aria-pressed', String(value === 'yes'));
      no.setAttribute('aria-pressed', String(value === 'no'));
      if (value) root.dataset.value = value;
      else delete root.dataset.value;
    };
    const open = (on) => {
      if (on) root.dataset.more = '';
      else delete root.dataset.more;
    };
    const set = (state) => {
      if (state) root.dataset.state = state;
      else delete root.dataset.state;
      if (state === 'sending') root.setAttribute('aria-busy', 'true');
      else root.removeAttribute('aria-busy');
      ask.inert = state === 'done';
      if (text) text.readOnly = Boolean(state);
      thanks.forEach((el) => {
        el.textContent = state === 'done' && el.dataset.for === root.dataset.value ? said.get(el) : '';
      });
    };

    let token = 0; // a reset or a new send voids the answer of the one before
    let timer = 0;
    let started = 0;
    // An answer lands once the ink has filled and the ring has turned long enough
    const later = (id, fn) => {
      clearTimeout(timer);
      timer = setTimeout(() => id === token && root.dataset.state === 'sending' && fn(), Math.max(0, minWait - (performance.now() - started)));
    };
    const finish = () => {
      set('done');
      if (fromKeyboard) done.focus({ preventScroll: true });
    };
    const failWith = (message) => {
      const inMore = root.dataset.more !== undefined && errors.more;
      set();
      if (!inMore) press(null);
      root.dataset.failed = '';
      (inMore ? errors.more : errors.ask).textContent = message || root.dataset.fail || FAIL_TEXT;
    };
    const reset = () => {
      token += 1;
      clearTimeout(timer);
      delete root.dataset.failed;
      errors.ask.textContent = '';
      if (errors.more) errors.more.textContent = '';
      if (text) text.value = '';
      press(null);
      open(false);
      set();
    };

    const send = (value) => {
      const id = ++token;
      started = performance.now();
      const data = new FormData(form);
      data.set('helpful', value);
      if (value === 'yes') data.delete('more');
      const more = value === 'no' && text ? text.value.trim() : '';
      set('sending');
      const ok = () => later(id, finish);
      const ko = (message) => later(id, () => failWith(message));
      const mine = root.dispatchEvent(new CustomEvent('kodza:helpful', { bubbles: true, cancelable: true, detail: { value, more, data, done: ok, fail: ko } }));
      if (!mine) return; // the page sends it, and calls done or fail
      const action = form.getAttribute('action');
      if (!action) {
        console.warn('Kodza Was This Helpful: the form has no action, and nothing handled kodza:helpful.');
        return ko();
      }
      const url = new URL(action, location.href);
      const method = (form.getAttribute('method') || 'get').toUpperCase();
      const fields = new URLSearchParams();
      data.forEach((field, name) => typeof field === 'string' && fields.append(name, field));
      if (method === 'GET') fields.forEach((field, name) => url.searchParams.append(name, field));
      const same = url.origin === location.origin;
      fetch(url, {
        method,
        body: method === 'GET' ? undefined : fields,
        mode: same ? 'same-origin' : 'no-cors',
        credentials: same ? 'same-origin' : 'omit',
        signal,
      }).then((response) => (response.type === 'opaque' || response.ok ? ok() : ko()), () => !signal.aborted && ko());
    };

    form.addEventListener('submit', (event) => {
      const button = event.submitter;
      if (button && !root.contains(button)) return; // another button of a larger form
      event.preventDefault();
      if (!button || root.dataset.state) return;
      delete root.dataset.failed;
      if (button === no) {
        // No only opens the note; pressed again, it lets go
        const on = no.getAttribute('aria-pressed') !== 'true';
        press(on ? 'no' : null);
        open(on);
        if (on && fromKeyboard && text) text.focus({ preventScroll: true });
      } else if (button === yes) {
        press('yes');
        open(false);
        send('yes');
      } else if (button === sendButton) {
        send('no');
      }
    }, { signal });

    if (text) {
      text.addEventListener('input', () => { delete root.dataset.failed; }, { signal });
      text.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !root.dataset.state) {
          event.preventDefault();
          press(null);
          open(false);
          no.focus({ preventScroll: true });
        } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && sendButton) {
          event.preventDefault();
          form.requestSubmit(sendButton);
        }
      }, { signal });
    }

    root.kodzaHelpful = {
      done: () => later(token, finish),
      fail: (message) => later(token, () => failWith(message)),
      reset,
    };
    signal.addEventListener('abort', () => {
      token += 1;
      clearTimeout(timer);
      delete root.kodzaHelpful;
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
