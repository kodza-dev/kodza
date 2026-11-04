// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Subscribe Field
// Checks the address before anything leaves, turns the ring while it is sent, then brings the
// thanks up in place of the pill. Sending it is yours, two ways:
// - the form's action and method (Mailchimp, Brevo, a WordPress plugin's endpoint): the script
//   posts the fields there. Another site's answer cannot be read, so it counts as sent;
// - or cancel the "kodza:subscribe" event (detail: { data, done, fail }) and send it yourself,
//   then call detail.done(), or detail.fail("Your message") to show it in place of the hint.
// root.kodzaSubscribe = { done, fail, reset } does the same from anywhere. The failure message
// defaults to data-fail on the form. The motion is CSS.
(() => {
  const SELECTOR = '.kodza-subscribe';
  // The ring turns at least this long (ms), so a fast answer never flashes it
  const MIN_SPIN = 700;
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
    const input = root.querySelector('.kodza-subscribe__input');
    const pill = root.querySelector('.kodza-subscribe__pill');
    const done = root.querySelector('.kodza-subscribe__done');
    const thanks = root.querySelector('.kodza-subscribe__thanks');
    const hint = root.querySelector('.kodza-subscribe__hint');
    const error = root.querySelector('.kodza-subscribe__error');
    if (!form || !input || !pill || !done || !error) return;
    const minSpin = still ? 0 : MIN_SPIN * pace;

    const prefix = `kodza-subscribe-${++uid}`;
    const described = [];
    if (hint) described.push((hint.id = `${prefix}-hint`));
    described.push((error.id = `${prefix}-error`));
    input.setAttribute('aria-describedby', described.join(' '));

    // The thanks is written when it shows: a status that receives text is read out
    const message = thanks ? thanks.textContent.trim() : '';
    if (thanks) thanks.textContent = '';
    // The script says what is wrong, in the field's own line, instead of the browser's bubble
    const validated = form.noValidate;
    form.noValidate = true;

    // Focus is only moved for a visitor on the keyboard: after a click, a ring would show
    let fromKeyboard = false;
    root.addEventListener('keydown', () => { fromKeyboard = true; }, { signal });
    root.addEventListener('pointerdown', () => { fromKeyboard = false; }, { signal });

    const check = () => {
      const bad = !input.validity.valid;
      error.textContent = bad ? input.dataset.error || input.validationMessage : '';
      input.setAttribute('aria-invalid', String(bad));
      return !bad;
    };

    const set = (state) => {
      if (state) root.dataset.state = state;
      else delete root.dataset.state;
      input.readOnly = Boolean(state);
      if (state === 'sending') root.setAttribute('aria-busy', 'true');
      else root.removeAttribute('aria-busy');
      pill.inert = state === 'done';
      if (thanks) thanks.textContent = state === 'done' ? message : '';
    };

    let token = 0; // a reset or a new send voids the answer of the one before
    let timer = 0;
    let started = 0;
    // An answer lands once the ring has turned long enough
    const later = (id, fn) => {
      clearTimeout(timer);
      timer = setTimeout(() => id === token && root.dataset.state === 'sending' && fn(), Math.max(0, minSpin - (performance.now() - started)));
    };
    const finish = () => {
      set('done');
      if (fromKeyboard) done.focus({ preventScroll: true });
    };
    const failWith = (text) => {
      set();
      root.dataset.failed = '';
      error.textContent = text || root.dataset.fail || FAIL_TEXT;
    };
    const reset = () => {
      token += 1;
      clearTimeout(timer);
      delete root.dataset.failed;
      input.value = '';
      input.removeAttribute('aria-invalid');
      error.textContent = '';
      set();
    };

    const send = () => {
      const id = ++token;
      started = performance.now();
      const data = new FormData(form);
      set('sending');
      const ok = () => later(id, finish);
      const ko = (text) => later(id, () => failWith(text));
      const mine = root.dispatchEvent(new CustomEvent('kodza:subscribe', { bubbles: true, cancelable: true, detail: { data, done: ok, fail: ko } }));
      if (!mine) return; // the page sends it, and calls done or fail
      const action = form.getAttribute('action');
      if (!action) {
        console.warn('Kodza Subscribe Field: the form has no action, and nothing handled kodza:subscribe.');
        return ko();
      }
      const url = new URL(action, location.href);
      const method = (form.getAttribute('method') || 'get').toUpperCase();
      const fields = new URLSearchParams();
      data.forEach((value, name) => typeof value === 'string' && fields.append(name, value));
      if (method === 'GET') fields.forEach((value, name) => url.searchParams.append(name, value));
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
      if (event.submitter && !root.contains(event.submitter)) return; // another button of a larger form
      event.preventDefault();
      if (root.dataset.state) return;
      delete root.dataset.failed;
      if (check()) send();
      else input.focus();
    }, { signal });
    // Judged when the visitor leaves a filled field, then live while they fix it
    input.addEventListener('blur', () => input.value && !root.dataset.state && check(), { signal });
    input.addEventListener('input', () => {
      if (root.dataset.failed !== undefined) {
        delete root.dataset.failed;
        error.textContent = '';
      }
      if (input.getAttribute('aria-invalid') === 'true') check();
    }, { signal });

    root.kodzaSubscribe = {
      done: () => later(token, finish),
      fail: (text) => later(token, () => failWith(text)),
      reset,
    };
    signal.addEventListener('abort', () => {
      token += 1;
      clearTimeout(timer);
      delete root.kodzaSubscribe;
      form.noValidate = validated;
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
