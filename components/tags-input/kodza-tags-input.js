// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Tags Input
// Builds a field of tags over the real text input, which the form still sends: the tags joined by
// commas, so type="email" multiple validates them as usual. Enter or a comma turns the typed word
// into a tag: the ink sweeps over the word where it was typed, left to right, as it settles into
// its pill and the field makes room. A pasted list gives one tag per item ("Name <address>" keeps
// the address). A value already there shakes its tag instead of coming twice. Backspace at the
// start of the field selects the last tag, a second one removes it; the arrows walk the tags.
// data-max caps the count, shown top right. On an email input each address is checked first.
// "change" fires on the real input; after setting .value from a script, fire "change" on it.
// The words and timings are below; each word can be set per field with data-text-<name>
// (data-text-max="…"), {value} and {max} are filled in.
(() => {
  const SELECTOR = '.kodza-tags';
  const WORDS = {
    placeholder: 'Type, then Enter', // shown while there is no tag
    duplicate: '“{value}” is already there.', // read out, as its tag shakes
    email: '“{value}” isn’t an email.', // under the field
    max: '{max} max. Drop one first.',
    required: 'Add at least one.',
    added: '{value} added.', // read out
    removed: '{value} removed.',
    selected: '{value} selected. Backspace removes it.',
    remove: 'Remove {value}', // the cross on each tag
  };
  const SEPARATORS = /[,;\n\t]+/; // typed or pasted, they end a tag (spaces too, on an email input)
  const SWEEP = 420; // ms, the ink sweeping over the word as it becomes a tag
  const STAGGER = 70; // ms between the tags of a pasted list
  const GLIDE = 420; // ms, the other tags and the field making room
  const LEAVE = 160; // ms, a removed tag shrinking away
  const SHAKE = 360; // ms, the tag of a value given twice
  const ROLL = 320; // ms, the count rolling to its new number
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const sweepEase = 'cubic-bezier(0.65, 0, 0.35, 1)'; // the ink: slow, fast, slow, so the sweep reads

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const cross = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 3l6 6M9 3 3 9"/></svg>';
  const fill = (words, values) => words.replace(/\{(\w+)\}/g, (all, key) => (key in values ? values[key] : all));
  // An address as the browser checks it, with a dot in the domain on top ("me@localhost" is valid
  // HTML, rarely what a form wants)
  let probe = null;
  const isEmail = (value) => {
    probe ||= Object.assign(document.createElement('input'), { type: 'email' });
    probe.value = value;
    return probe.checkValidity() && /@[^@.]+(\.[^@.]+)+$/.test(value);
  };
  let uid = 0;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const native = root.querySelector('.kodza-tags__native');
    const box = root.querySelector('.kodza-tags__box');
    const label = root.querySelector('.kodza-tags__label');
    const note = root.querySelector('.kodza-tags__note');
    const error = root.querySelector('.kodza-tags__error');
    if (!native || !box) return;
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const email = native.type === 'email';
    const max = parseInt(root.dataset.max, 10) || 0;
    const id = `kodza-tags-${++uid}`;
    root.classList.toggle('is-email', email);

    const field = document.createElement('div');
    field.className = 'kodza-tags__field';
    const input = document.createElement('input');
    input.className = 'kodza-tags__input';
    input.type = 'text'; // not "email": the caret position is needed, and an email input hides it
    if (email) input.inputMode = 'email';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.enterKeyHint = 'enter';
    input.setAttribute('autocapitalize', 'off');
    if (label) {
      label.id = `${id}-label`;
      input.setAttribute('aria-labelledby', label.id);
    }
    if (note) {
      note.id = `${id}-note`;
      input.setAttribute('aria-describedby', note.id);
    }
    field.append(input);
    box.append(field);
    native.tabIndex = -1;
    native.setAttribute('aria-hidden', 'true');
    const live = document.createElement('span');
    live.className = 'kodza-tags__live';
    live.setAttribute('aria-live', 'polite');
    root.append(live);
    const tell = (text) => { live.textContent = text; };

    // The count, top right, when there is a cap: its number rolls up as tags come, down as they go
    let now = null;
    let counted = -1;
    const count = max ? document.createElement('span') : null;
    if (count) {
      count.className = 'kodza-tags__count';
      count.setAttribute('aria-hidden', 'true');
      now = document.createElement('span');
      now.className = 'kodza-tags__now';
      count.append(now, `/${max}`);
      box.append(count);
    }
    const recount = (roll) => {
      if (!count) return;
      const n = tags.length;
      count.classList.toggle('is-full', n >= max);
      if (n === counted) return;
      const up = n > counted;
      counted = n;
      const next = document.createElement('span');
      next.textContent = n;
      // A roll still going when the next one starts: only its last number stays
      const old = now.lastElementChild;
      [...now.children].forEach((el) => el !== old && el.remove());
      if (still || !roll || !old) return now.replaceChildren(next);
      now.append(next);
      const timing = { duration: ROLL * pace, easing: ease };
      old.animate([{ transform: 'none' }, { transform: `translateY(${up ? -100 : 100}%)` }], { ...timing, fill: 'forwards' }).onfinish = () => old.remove();
      next.animate([{ transform: `translateY(${up ? 100 : -100}%)` }, { transform: 'none' }], timing);
    };

    // The values, as typed or pasted: "Name <address>" keeps the address, spaces split addresses
    const split = (raw) => {
      const text = email ? raw.replace(/[^,;<>\n]*<([^<>]+)>/g, '$1,') : raw;
      return text.split(SEPARATORS)
        .flatMap((part) => (email ? part.split(/\s+/) : [part.replace(/\s+/g, ' ')]))
        .map((part) => part.trim())
        .filter(Boolean);
    };
    let tags = [];
    const twinOf = (value) => tags.find((entry) => entry.value.toLowerCase() === value.toLowerCase());

    // The real input follows the tags, and tells the form
    let syncing = false;
    const refresh = () => {
      root.classList.toggle('is-empty', !tags.length && !input.value);
      input.placeholder = tags.length ? '' : word('placeholder');
      input.disabled = native.disabled;
      root.classList.toggle('is-disabled', native.disabled);
      input.setAttribute('aria-required', String(native.required));
      tags.forEach((entry) => { entry.remove.disabled = native.disabled; });
    };
    const write = () => {
      native.value = tags.map((entry) => entry.value).join(email ? ',' : ', ');
      syncing = true;
      native.dispatchEvent(new Event('input', { bubbles: true }));
      native.dispatchEvent(new Event('change', { bubbles: true }));
      syncing = false;
      refresh();
      recount(true);
    };

    // Hint and error share the line under the field
    const say = (text) => {
      if (!error) return;
      error.textContent = text;
      root.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
    };
    const clearError = () => {
      root.classList.remove('is-invalid');
      input.removeAttribute('aria-invalid');
    };

    // Tags and input glide to their new places, the field eases to its new height
    const glide = (change) => {
      const before = new Map([...field.children].map((el) => [el, el.getBoundingClientRect()]));
      const height = field.offsetHeight;
      change();
      if (still) return;
      const k = field.getBoundingClientRect().width / field.offsetWidth || 1;
      [...field.children].forEach((el) => {
        const a = before.get(el);
        if (!a || el.classList.contains('kodza-tags__ghost')) return;
        const b = el.getBoundingClientRect();
        const dx = (a.left - b.left) / k;
        const dy = (a.top - b.top) / k;
        if (Math.abs(dx) + Math.abs(dy) > 0.5) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: GLIDE * pace, easing: ease });
      });
      const to = field.offsetHeight;
      if (to !== height) field.animate([{ height: `${height}px` }, { height: `${to}px` }], { duration: GLIDE * pace, easing: ease });
    };

    // Selected tag: the next Backspace removes it
    let armed = null;
    const arm = (entry) => {
      if (armed === (entry || null)) return;
      armed?.tag.classList.remove('is-armed');
      armed = entry || null;
      if (!armed) return;
      armed.tag.classList.add('is-armed');
      tell(fill(word('selected'), { value: armed.value }));
    };

    const makeTag = (value) => {
      const tag = document.createElement('span');
      tag.className = 'kodza-tags__tag';
      const text = document.createElement('span');
      text.className = 'kodza-tags__text';
      text.textContent = value;
      text.title = value;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'kodza-tags__remove';
      remove.tabIndex = -1;
      remove.setAttribute('aria-label', fill(word('remove'), { value }));
      remove.innerHTML = cross;
      tag.append(text, remove);
      const entry = { value, tag, remove };
      remove.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        drop(entry);
        input.focus();
      }, { signal });
      return entry;
    };

    // The ink sweeps over the word, left to right. Typed: the word stays where it was typed, at
    // the size it was typed, and travels into its pill as the ink covers it (the plain word, a
    // ghost under the tag, shows past the edge of the ink). Pasted: the pill unrolls in place
    const sweep = (entry, from, delay) => {
      if (still) return;
      const { tag } = entry;
      const style = getComputedStyle(tag);
      const w = tag.offsetWidth;
      const radius = style.borderTopLeftRadius;
      const tip = Math.min(parseFloat(radius) || 0, tag.offsetHeight / 2);
      const timing = { duration: SWEEP * pace, delay: delay * pace, easing: sweepEase, fill: 'backwards' };
      const ink = [{ clipPath: `inset(0 ${w}px 0 0 round ${radius})` }, { clipPath: `inset(0 0px 0 0 round ${radius})` }];
      tag.animate(ink, timing);
      if (!from) return;
      const k = field.getBoundingClientRect().width / field.offsetWidth || 1;
      const s = from.size / parseFloat(style.fontSize) || 1;
      const b = tag.getBoundingClientRect();
      const dx = (from.left - b.left) / k - parseFloat(style.paddingLeft) * s;
      const dy = (from.middle - b.top - b.height / 2) / k;
      const start = `translate(${dx}px, ${dy}px) scale(${s})`;
      const ghost = document.createElement('span');
      ghost.className = 'kodza-tags__ghost';
      ghost.setAttribute('aria-hidden', 'true');
      ghost.textContent = entry.value;
      ghost.style.cssText = `left: ${tag.offsetLeft}px; top: ${tag.offsetTop}px; width: ${w}px;`;
      field.append(ghost);
      // The word travels on the arriving curve, the ink keeps its own
      const travel = [{ transform: start }, { transform: 'none' }];
      tag.animate(travel, { ...timing, easing: ease });
      ghost.animate(travel, { ...timing, easing: ease, fill: 'both' });
      // The plain word starts a little under the ink, so its round tip never shows a gap
      ghost.animate([{ clipPath: `inset(0 0 0 ${-tip}px)` }, { clipPath: `inset(0 0 0 ${w - tip}px)` }], { ...timing, fill: 'both' })
        .onfinish = () => ghost.remove();
    };

    const shake = (entry) => {
      if (still) return;
      entry.tag.animate([
        { transform: 'none' },
        { transform: 'translateX(-3px)' },
        { transform: 'translateX(3px)' },
        { transform: 'translateX(-2px)' },
        { transform: 'translateX(1px)' },
        { transform: 'none' },
      ], { duration: SHAKE * pace, easing: 'ease-out' });
    };

    // Text becomes tags: the ones already there shake, the ones refused (not an address, over the
    // cap) stay in the field with the reason under it. `from` is where the text was typed
    const take = (raw, from) => {
      const fresh = [];
      const kept = [];
      let problem = '';
      split(raw).forEach((value) => {
        const twin = twinOf(value) || fresh.find((entry) => entry.value.toLowerCase() === value.toLowerCase());
        if (twin) {
          if (!fresh.includes(twin)) shake(twin);
          tell(fill(word('duplicate'), { value: twin.value }));
          return;
        }
        if (email && !isEmail(value)) {
          kept.push(value);
          problem ||= fill(word('email'), { value });
          return;
        }
        if (max && tags.length + fresh.length >= max) {
          kept.push(value);
          problem ||= fill(word('max'), { max });
          return;
        }
        fresh.push(makeTag(value));
      });
      if (fresh.length) {
        arm(null);
        clearError();
        glide(() => fresh.forEach((entry) => input.before(entry.tag)));
        tags.push(...fresh);
        fresh.forEach((entry, i) => sweep(entry, i ? null : from, i * STAGGER));
        tell(fresh.length === 1 ? fill(word('added'), { value: fresh[0].value }) : fill(word('added'), { value: `${fresh.length} tags` }));
        write();
      }
      if (problem) say(problem);
      return kept;
    };

    // Where the typed text starts, and at what size, before the field is emptied
    const typedAt = () => {
      const r = input.getBoundingClientRect();
      const style = getComputedStyle(input);
      const k = r.width / input.offsetWidth || 1;
      return { left: r.left + (parseFloat(style.paddingLeft) - input.scrollLeft) * k, middle: r.top + r.height / 2, size: parseFloat(style.fontSize) };
    };
    // Everything typed, or what is before the last separator (the rest is still being typed)
    const commit = (all) => {
      const value = input.value;
      const cut = all ? value.length : Math.max(...[...value.matchAll(email ? /[,;\s]/g : /[,;]/g)].map((m) => m.index), -1);
      if (cut < 0) return;
      const rest = value.slice(cut + 1);
      const from = typedAt();
      input.value = '';
      const kept = take(value.slice(0, cut), from);
      input.value = [...kept, rest.trimStart()].filter(Boolean).join(', ');
      refresh();
    };

    const drop = (entry) => {
      const at = tags.indexOf(entry);
      if (at < 0) return;
      tags.splice(at, 1);
      if (armed === entry) arm(null);
      entry.tag.style.pointerEvents = 'none';
      clearError();
      write();
      tell(fill(word('removed'), { value: entry.value }));
      const gone = () => glide(() => entry.tag.remove());
      if (still) return gone();
      entry.tag.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(0.6)' }], { duration: LEAVE * pace, easing: 'ease-in', fill: 'forwards' }).onfinish = gone;
    };

    // The tags from the real input, without motion (first start, a reset, a script)
    const read = () => {
      tags.forEach((entry) => entry.tag.remove());
      tags = [];
      armed = null;
      split(native.value).forEach((value) => {
        if (twinOf(value)) return;
        const entry = makeTag(value);
        tags.push(entry);
        input.before(entry.tag);
      });
      refresh();
      recount(false);
    };
    read();

    input.addEventListener('keydown', (event) => {
      if (event.isComposing) return;
      const start = input.selectionStart === 0 && input.selectionEnd === 0;
      const at = tags.indexOf(armed);
      if (event.key === 'Enter') {
        if (!input.value.trim()) return; // nothing typed: the form is sent as usual
        event.preventDefault();
        commit(true);
      } else if (armed && (event.key === 'Backspace' || event.key === 'Delete')) {
        event.preventDefault();
        drop(armed);
      } else if (event.key === 'Backspace' || event.key === 'ArrowLeft') {
        if (armed) {
          event.preventDefault();
          if (at > 0) arm(tags[at - 1]);
        } else if (start && tags.length) {
          event.preventDefault();
          arm(tags[tags.length - 1]);
        }
      } else if (event.key === 'ArrowRight' && armed) {
        event.preventDefault();
        arm(tags[at + 1]);
      } else if (event.key === 'Escape' && armed) {
        event.preventDefault();
        arm(null);
      }
    }, { signal });
    input.addEventListener('input', () => {
      arm(null);
      clearError();
      refresh();
      commit(false); // a comma typed (or put there by a phone keyboard) ends the tag
    }, { signal });
    // A list pasted: one tag per item, joined to what was around the caret
    input.addEventListener('paste', (event) => {
      const text = event.clipboardData?.getData('text') || '';
      if (!SEPARATORS.test(text) && !(email && /\s|</.test(text.trim()))) return;
      event.preventDefault();
      const { value, selectionStart: a, selectionEnd: b } = input;
      input.value = '';
      input.value = take(value.slice(0, a) + text + value.slice(b), null).join(', ');
      refresh();
    }, { signal });
    input.addEventListener('blur', () => {
      arm(null);
      if (input.value.trim()) commit(true);
    }, { signal });

    // A click in the box goes to the input (not to the hidden native one); on a tag, selects it
    box.addEventListener('mousedown', (event) => {
      if (event.target !== input && document.activeElement === input) event.preventDefault();
    }, { signal });
    box.addEventListener('click', (event) => {
      if (event.target === input) return;
      event.preventDefault();
      if (input.disabled) return;
      const tag = event.target.closest('.kodza-tags__tag');
      const entry = tags.find((item) => item.tag === tag);
      input.focus();
      arm(entry && entry !== armed ? entry : null);
    }, { signal });

    // Sent with no tag: the field says it, not the browser's bubble on the hidden input
    native.addEventListener('invalid', (event) => {
      event.preventDefault();
      say(native.validity.valueMissing ? word('required') : native.validationMessage);
      const first = native.form && [...native.form.elements].find((el) => el.willValidate && !el.validity.valid);
      if (!native.form || first === native) input.focus();
    }, { signal });
    // The real input changed from elsewhere (a form reset, a script): follow it
    native.addEventListener('change', () => {
      if (!syncing) read();
    }, { signal });
    native.form?.addEventListener('reset', () => setTimeout(() => {
      input.value = '';
      clearError();
      read();
    }), { signal });
    const observer = new MutationObserver(refresh);
    observer.observe(native, { attributes: true, attributeFilter: ['disabled', 'required'] });
    signal.addEventListener('abort', () => observer.disconnect(), { once: true });
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
