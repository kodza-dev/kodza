// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Filter Chips
// A row of filter chips over a list that already exists. The chips are checkboxes in a plain GET
// form: with no script, Apply sends them and the page answers. With it, a picked chip fills with
// ink from its centre, a tag lifts off it into the head of the bar (a click or Backspace on the
// tag drops the filter), and nothing waits for Apply:
// - with data-target (a selector: the nearest match around the form), the script filters that
//   list itself, like Filter Transitions: the items that go step back, the ones that stay glide
//   to their new place, the new ones come in one by one, the list eases to its new height, and
//   each choice's count rolls (a choice that would leave nothing is disabled). Each fieldset's
//   data-filter names the data-* of the items it reads (data-filter="colour": data-colour="ink").
//   The address keeps the filters (the first such bar of the page; data-url="off" leaves it alone).
// - without it, each change loads the page again with the filters in the address, the way the
//   shop reads them (WooCommerce: name="filter_color", data-join="," to send ?filter_color=a,b;
//   Shopify: name="filter.v.option.color"), keeping the address's other parameters and leaving
//   the page of results it was on. The chips read the address, so the templates need no change.
// Fires "kodza:filter" { filters, count } on the form; a page that answers in Ajax cancels it
// (event.preventDefault()) and nothing reloads.
// Settings: the --kz-filter-chips-* variables in the CSS, data-target, data-join, data-url and
// data-text-* on the root, the constants below.
(() => {
  const SELECTOR = '.kodza-filter-chips';

  // Timings, in milliseconds (times the site's pace)
  const LIFT = 560; // a tag flying from its chip to the head
  const DROP = 240; // a tag fading where it was
  const SLIDE = 420; // the other tags gliding to their place
  const COUNT = 450; // a number rolling
  const OUT = 220; // the items that go, stepping back
  const MOVE = 650; // the items that stay gliding to their place, the list easing to its height
  const IN = 80; // the first new item's wait; each next one waits STAGGER more
  const STAGGER = 60;
  const SEND = 320; // without data-target: the ink plays this long before the page loads

  // What the script writes, in English unless the root says otherwise (data-text-<key>)
  const WORDS = {
    one: 'product', // after the count, for one
    many: 'products', // after the count, for any other number
    remove: 'Remove {label}', // a tag's name for screen readers
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const ADDRESS = Symbol.for('kodza filter-chips address'); // the bar that keeps the address
  const PAGED = ['paged', 'page', 'product-page']; // a page of results, left when the filters change
  const CROSS = '<svg class="kodza-filter-chips__cross" viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 5.5l5 5m0-5l-5 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all, and gives the list back as it was.
  function mount(root, signal) {
    const pace = paceOf(root);
    const still = reduceMotion || !pace; // the still path: no motion asked, by the visitor or the site
    const ms = (t) => (still ? 0 : t * pace);
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const q = (name) => root.querySelector(`.kodza-filter-chips__${name}`);
    const head = q('head');
    const active = q('active');
    const clear = q('clear');
    const row = q('row');
    const num = q('num');
    const unit = q('unit');
    const empty = q('empty');
    const groups = [...root.querySelectorAll('.kodza-filter-chips__group')];
    const inputs = [...root.querySelectorAll('.kodza-filter-chips__input')];
    if (!row || !inputs.length) return;
    const join = root.dataset.join || '';
    const names = new Set(inputs.map((input) => input.name));
    const groupOf = (input) => input.closest('.kodza-filter-chips__group');
    const keyOf = (group) => (group?.dataset.filter || '').toLowerCase();
    const valueOf = (input) => input.value.toLowerCase();
    const labelOf = (input) => input.closest('.kodza-filter-chips__chip')?.querySelector('.kodza-filter-chips__label')?.textContent.trim() || input.value;

    // ---------- The list it filters, if any: the nearest match of data-target around the form ----------
    let list = null;
    if (root.dataset.target) {
      for (let el = root.parentElement; el && !list; el = el.parentElement) {
        try {
          list = [...el.querySelectorAll(root.dataset.target)].find((node) => !root.contains(node) && !node.contains(root)) || null;
        } catch {
          break;
        }
      }
    }
    const items = list ? [...list.children].filter((el) => !el.matches('script, template, style')) : [];
    const wasHidden = new Map(items.map((item) => [item, item.hidden]));
    const words = (item, key) => (item.dataset[key] || '').toLowerCase().split(/[\s,]+/).filter(Boolean);

    // ---------- The chips: their face, and the inked copy laid over it ----------
    const tallies = new Map(); // input → its count, on the face and on the ink
    inputs.forEach((input) => {
      const chip = input.closest('.kodza-filter-chips__chip');
      if (!chip) return;
      const face = document.createElement('span');
      face.className = 'kodza-filter-chips__face';
      face.append(...[...chip.childNodes].filter((node) => node !== input));
      const ink = face.cloneNode(true);
      ink.className = 'kodza-filter-chips__ink';
      ink.setAttribute('aria-hidden', 'true');
      chip.append(face, ink);
      const pair = [face, ink].map((side) => side.querySelector('.kodza-filter-chips__tally')).filter(Boolean);
      pair.forEach((tally) => tally.replaceChildren(Object.assign(document.createElement('span'), { textContent: tally.textContent.trim() })));
      if (pair.length) tallies.set(input, pair);
    });
    if (num) num.replaceChildren(Object.assign(document.createElement('span'), { textContent: num.textContent.trim() }));

    // A number rolls: the old one goes up, the new one comes from below (down when it falls)
    const roll = (box, value, quiet) => {
      const prev = box.lastElementChild;
      if (!prev || prev.textContent === String(value)) return;
      const next = Object.assign(document.createElement('span'), { textContent: value });
      box.append(next);
      if (quiet || still) return prev.remove();
      const up = Number(value) > Number(prev.textContent) ? 1 : -1;
      const timing = { duration: ms(COUNT), easing: ease };
      prev.animate([{ transform: 'none' }, { transform: `translateY(${-110 * up}%)` }], { ...timing, fill: 'forwards' }).finished.then(() => prev.remove(), () => prev.remove());
      next.animate([{ transform: `translateY(${110 * up}%)` }, { transform: 'none' }], timing);
    };

    // ---------- The state: what is ticked, read from the address when it holds any of it ----------
    const own = !list || (root.dataset.url !== 'off' && !(window[ADDRESS]?.isConnected && window[ADDRESS] !== root));
    if (list && own) {
      window[ADDRESS] = root;
      signal.addEventListener('abort', () => window[ADDRESS] === root && delete window[ADDRESS]);
    }
    const params = new URLSearchParams(location.search);
    if ([...names].some((name) => params.has(name))) {
      const asked = new Map([...names].map((name) => [name, params.getAll(name).flatMap((v) => (join ? v.split(join) : [v])).map((v) => v.toLowerCase())]));
      inputs.forEach((input) => (input.checked = asked.get(input.name).includes(valueOf(input))));
    }
    const picked = () => new Map(groups.map((group) => [group, inputs.filter((input) => input.checked && groupOf(input) === group).map(valueOf)]));
    const matches = (item, state, skip) => [...state].every(([group, values]) => group === skip || !values.length || words(item, keyOf(group)).some((v) => values.includes(v)));
    const filters = () => Object.fromEntries([...picked()].map(([group, values]) => [keyOf(group) || group.querySelector('input')?.name, values]));

    const write = () => {
      if (!list || !own) return;
      const url = new URL(location.href);
      names.forEach((name) => url.searchParams.delete(name));
      inputs.filter((input) => input.checked).forEach((input) => {
        if (join && url.searchParams.has(input.name)) url.searchParams.set(input.name, `${url.searchParams.get(input.name)}${join}${input.value}`);
        else url.searchParams.append(input.name, input.value);
      });
      // A sandboxed frame can refuse the address: the filters still work
      try {
        if (url.href !== location.href) history.replaceState(history.state, '', url);
      } catch {}
    };

    // Without a list: the page the shop answers, with the other parameters of the address kept
    const send = () => {
      const url = new URL(root.getAttribute('action') ? root.action : location.href);
      if (!root.getAttribute('action')) url.pathname = url.pathname.replace(/\/page\/\d+\/?$/, '/');
      PAGED.forEach((name) => url.searchParams.delete(name));
      const sent = new Map();
      new FormData(root).forEach((value, name) => sent.set(name, [...(sent.get(name) || []), value]));
      [...names, ...sent.keys()].forEach((name) => url.searchParams.delete(name));
      sent.forEach((values, name) => (join && names.has(name) ? url.searchParams.set(name, values.join(join)) : values.forEach((v) => url.searchParams.append(name, v))));
      location.assign(url);
    };

    // ---------- The counts: each choice, given the other groups, and the whole list ----------
    const count = (quiet) => {
      if (!list) return;
      const state = picked();
      tallies.forEach((pair, input) => {
        const group = groupOf(input);
        const n = items.filter((item) => matches(item, state, group) && words(item, keyOf(group)).includes(valueOf(input))).length;
        pair.forEach((tally) => roll(tally, n, quiet));
        input.disabled = !n && !input.checked;
      });
    };
    const total = (n, quiet) => {
      if (num) roll(num, n, quiet);
      if (unit) unit.textContent = word(n === 1 ? 'one' : 'many');
      if (empty) empty.hidden = n > 0;
    };

    // ---------- The list: Filter Transitions' two beats ----------
    let running = [];
    let outs = [];
    let token = 0;
    const show = (item, on) => {
      item.hidden = !on;
      item.style.display = on ? '' : 'none'; // a theme's display on its items outranks [hidden]
    };
    const apply = async (quiet) => {
      const id = ++token;
      outs.forEach((animation) => animation.cancel());
      running.forEach((animation) => animation.finish());
      outs = [];
      running = [];
      const state = picked();
      const leaving = items.filter((item) => !item.hidden && !matches(item, state));
      const entering = items.filter((item) => item.hidden && matches(item, state));
      const staying = items.filter((item) => !item.hidden && matches(item, state));
      total(staying.length + entering.length, quiet);
      if (quiet || still) {
        items.forEach((item) => show(item, matches(item, state)));
        return;
      }
      // Beat one: the items that go step back
      if (leaving.length) {
        outs = leaving.map((item) => item.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(0.94)' }], { duration: ms(OUT), easing: 'ease-in', fill: 'forwards' }));
        await Promise.all(outs.map((animation) => animation.finished.catch(() => {})));
        if (id !== token || signal.aborted) return;
      }
      // Beat two: the layout changes; what stays glides there, what comes arrives, the list eases
      const before = new Map(staying.map((item) => [item, item.getBoundingClientRect()]));
      const from = list.offsetHeight;
      leaving.forEach((item) => show(item, false));
      outs.forEach((animation) => animation.cancel());
      outs = [];
      entering.forEach((item) => show(item, true));
      const to = list.offsetHeight;
      // Screen pixels back to the list's own (a parent may be scaled with a transform)
      const k = list.getBoundingClientRect().width / list.offsetWidth || 1;
      staying.forEach((item) => {
        const a = before.get(item);
        const b = item.getBoundingClientRect();
        if (Math.abs(a.left - b.left) + Math.abs(a.top - b.top) < 1) return;
        running.push(item.animate([{ transform: `translate(${(a.left - b.left) / k}px, ${(a.top - b.top) / k}px)` }, { transform: 'none' }], { duration: ms(MOVE), easing: ease }));
      });
      entering
        .sort((a, b) => a.offsetTop - b.offsetTop || a.offsetLeft - b.offsetLeft)
        .forEach((item, i) => running.push(item.animate([{ opacity: 0, transform: 'translateY(16px) scale(0.96)' }, { opacity: 1, transform: 'none' }], { duration: ms(MOVE), delay: ms(IN + i * STAGGER), easing: ease, fill: 'backwards' })));
      if (from !== to) running.push(list.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: ms(MOVE), easing: ease }));
    };
    signal.addEventListener('abort', () => {
      outs.forEach((animation) => animation.cancel());
      running.forEach((animation) => animation.cancel());
      items.forEach((item) => {
        item.hidden = wasHidden.get(item);
        item.style.display = '';
        if (!item.getAttribute('style')) item.removeAttribute('style');
      });
    });

    // ---------- The edges of a line that scrolls fade where there is more ----------
    const strips = [row, active].filter(Boolean);
    const edge = (strip) => {
      const more = strip.scrollWidth - strip.clientWidth > 1;
      strip.classList.toggle('is-scroll', more);
      strip.classList.toggle('has-before', more && strip.scrollLeft > 1);
      strip.classList.toggle('has-after', more && strip.scrollLeft < strip.scrollWidth - strip.clientWidth - 1);
    };
    strips.forEach((strip) => strip.addEventListener('scroll', () => edge(strip), { passive: true, signal }));
    const observer = new ResizeObserver(() => strips.forEach(edge));
    strips.forEach((strip) => observer.observe(strip));
    signal.addEventListener('abort', () => observer.disconnect());

    // ---------- The tags in the head ----------
    const tags = new Map(); // input → its tag
    const scale = () => root.getBoundingClientRect().width / root.offsetWidth || 1;
    const makeTag = (input) => {
      const tag = document.createElement('button');
      tag.type = 'button';
      tag.className = 'kodza-filter-chips__tag';
      tag.setAttribute('aria-label', word('remove').replace('{label}', labelOf(input)));
      tag.append(Object.assign(document.createElement('span'), { className: 'kodza-filter-chips__tag-label', textContent: labelOf(input) }));
      tag.insertAdjacentHTML('beforeend', CROSS);
      tag.addEventListener('click', () => drop(input, tag), { signal });
      tag.addEventListener('keydown', (event) => {
        if (event.key !== 'Backspace' && event.key !== 'Delete') return;
        event.preventDefault();
        drop(input, tag);
      }, { signal });
      return tag;
    };
    // A copy laid on the root, outside the head's scrolling line, which would cut it
    const ghost = (tag) => {
      const k = scale();
      const box = root.getBoundingClientRect();
      const r = tag.getBoundingClientRect();
      const copy = tag.cloneNode(true);
      copy.removeAttribute('aria-label');
      copy.setAttribute('aria-hidden', 'true');
      copy.tabIndex = -1;
      copy.classList.add('kodza-filter-chips__ghost');
      Object.assign(copy.style, { left: `${(r.left - box.left) / k}px`, top: `${(r.top - box.top) / k}px` });
      root.append(copy);
      return copy;
    };
    const tagsFrom = (from, quiet) => {
      const before = new Map([...tags.values(), clear].filter((el) => el && !el.hidden).map((el) => [el, el.getBoundingClientRect()]));
      const gone = [];
      tags.forEach((tag, input) => {
        if (input.checked) return;
        if (!quiet && !still) {
          const copy = ghost(tag);
          copy.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(0.8)' }], { duration: ms(DROP), easing: 'ease-out', fill: 'forwards' }).finished.then(() => copy.remove(), () => copy.remove());
          signal.addEventListener('abort', () => copy.remove());
        }
        gone.push(tag);
        tags.delete(input);
      });
      gone.forEach((tag) => tag.remove());
      const born = [];
      inputs.forEach((input) => {
        if (!input.checked) return;
        if (!tags.has(input)) {
          tags.set(input, makeTag(input));
          born.push(input);
        }
        active?.append(tags.get(input)); // in the order of the chips
      });
      const any = tags.size > 0;
      if (clear) clear.hidden = !any;
      if (active) {
        // The new tag in view, when the line scrolls
        const last = born.length && tags.get(born[born.length - 1]);
        if (last && last.offsetLeft + last.offsetWidth > active.scrollLeft + active.clientWidth) active.scrollLeft = last.offsetLeft + last.offsetWidth - active.clientWidth + 4;
        edge(active);
      }
      if (quiet || still) return;
      const k = scale();
      before.forEach((a, el) => {
        if (!el.isConnected || el.hidden) return;
        const b = el.getBoundingClientRect();
        if (Math.abs(a.left - b.left) + Math.abs(a.top - b.top) < 1) return;
        el.animate([{ transform: `translate(${(a.left - b.left) / k}px, ${(a.top - b.top) / k}px)` }, { transform: 'none' }], { duration: ms(SLIDE), easing: ease });
      });
      if (clear && any && !before.has(clear)) clear.animate([{ opacity: 0, transform: 'translateX(-8px)' }, { opacity: 1, transform: 'none' }], { duration: ms(SLIDE), easing: ease });
      // The new tag lifts off its chip and lands in the head
      born.forEach((input) => {
        const tag = tags.get(input);
        const chip = input.closest('.kodza-filter-chips__chip');
        if (!chip || from !== input) return;
        const a = chip.getBoundingClientRect();
        const b = tag.getBoundingClientRect();
        const copy = ghost(tag);
        tag.style.visibility = 'hidden';
        const dx = (a.left + a.width / 2 - (b.left + b.width / 2)) / k;
        const dy = (a.top + a.height / 2 - (b.top + b.height / 2)) / k;
        const done = () => {
          copy.remove();
          tag.style.visibility = '';
          if (!tag.getAttribute('style')) tag.removeAttribute('style');
        };
        copy.animate(
          [
            { transform: `translate(${dx}px, ${dy}px) scale(${Math.min(1.15, a.height / b.height)})`, opacity: 0 },
            { opacity: 1, offset: 0.2 },
            { transform: 'none', opacity: 1 },
          ],
          { duration: ms(LIFT), easing: ease },
        ).finished.then(done, done);
        signal.addEventListener('abort', done);
      });
    };

    // ---------- A change: tags, counts, the list or the page, the address ----------
    let leaving = 0;
    const change = (from) => {
      tagsFrom(from);
      count();
      const detail = { filters: filters(), count: list ? items.filter((item) => matches(item, picked())).length : null };
      const go = root.dispatchEvent(new CustomEvent('kodza:filter', { detail, bubbles: true, cancelable: true }));
      if (list) {
        apply();
        write();
      } else if (go) {
        clearTimeout(leaving);
        leaving = setTimeout(send, ms(SEND));
      }
    };
    signal.addEventListener('abort', () => clearTimeout(leaving));
    root.addEventListener('change', (event) => {
      if (inputs.includes(event.target)) change(event.target);
    }, { signal });
    // A form sent with Enter, or Apply: without a list it loads the page, with one it has nothing to do
    root.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!list) send();
    }, { signal });

    // Dropping a filter from its tag; from the keyboard, the focus goes to the next tag, or back to the chip
    const fromKeys = (el) => el.matches(':focus-visible');
    const drop = (input, tag) => {
      const keys = fromKeys(tag);
      const order = [...tags.values()];
      const at = order.indexOf(tag);
      input.checked = false;
      change(input);
      if (!keys) return;
      const next = [...tags.values()];
      (next[Math.min(at, next.length - 1)] || input).focus();
    };
    clear?.addEventListener('click', () => {
      const keys = fromKeys(clear);
      inputs.forEach((input) => (input.checked = false));
      change(null);
      if (keys) inputs.find((input) => !input.disabled)?.focus();
    }, { signal });

    // ---------- Start: everything in place at once ----------
    count(true);
    if (list) apply(true);
    tagsFrom(null, true);
    if (list) write();
    strips.forEach(edge);
    document.fonts?.ready.then(() => !signal.aborted && strips.forEach(edge));
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
