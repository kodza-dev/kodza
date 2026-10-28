// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Color Picker
// Builds a field and a panel over the real <input type="color"> and keeps it in step (firing
// "input" while you drag and "change" when you let go). The square sets saturation and
// brightness (drag, or arrows: Shift for bigger steps), the slider sets the hue, the hex field
// takes any #rgb or #rrggbb. Presets come from data-presets (comma-separated hex codes).
(() => {
  const SELECTOR = '.kodza-color';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PRESETS = ['#0a0a0a', '#f2f2f0', '#ff5c35', '#f5b700', '#12b76a', '#14b8a6', '#2f6bff', '#a855f7'];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const hexToRgb = (hex) => {
    let h = hex.replace('#', '').trim();
    if (h.length === 3) h = [...h].map((c) => c + c).join('');
    if (!/^[0-9a-f]{6}$/i.test(h)) return null;
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  };
  const rgbToHex = (rgb) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
  const rgbToHsv = ([r, g, b]) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const d = max - Math.min(r, g, b);
    let h = 0;
    if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [(h * 60 + 360) % 360, max ? d / max : 0, max];
  };
  const hsvToRgb = ([h, s, v]) => {
    const f = (n) => {
      const k = (n + h / 60) % 6;
      return (v - v * s * clamp(Math.min(k, 4 - k), 0, 1)) * 255;
    };
    return [f(5), f(3), f(1)];
  };
  const copy = '<svg class="kodza-color__idle" viewBox="0 0 16 16" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 5.5V3.8c0-.7-.6-1.3-1.3-1.3H3.8c-.7 0-1.3.6-1.3 1.3v5.4c0 .7.6 1.3 1.3 1.3h1.7"/></svg><svg class="kodza-color__done" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"/></svg>';
  const dropper = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 2.5l3 3-1.5 1.5-3-3zM9 4l3 3-6 6H3v-3z"/></svg>';
  let uid = 0;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const native = root.querySelector('.kodza-color__native');
    const label = root.querySelector('.kodza-color__label');
    if (!native) return;
    const id = `kodza-color-${++uid}`;
    const presets = (root.dataset.presets || '').split(',').map((s) => s.trim()).filter((s) => hexToRgb(s));

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'kodza-color__trigger';
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    if (label) {
      label.id = `${id}-label`;
      trigger.setAttribute('aria-labelledby', `${id}-label ${id}-hex`);
    }
    trigger.innerHTML = `<span class="kodza-color__swatch" aria-hidden="true"></span><span class="kodza-color__hex" id="${id}-hex"></span>`;

    const pop = document.createElement('div');
    pop.className = 'kodza-color__pop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', label ? `${label.textContent}: pick a colour` : 'Pick a colour');
    pop.innerHTML = `
      <div class="kodza-color__area" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="100" aria-label="Saturation and brightness"><span class="kodza-color__handle"></span></div>
      <input class="kodza-color__hue" type="range" min="0" max="359" step="1" aria-label="Hue">
      <div class="kodza-color__row">
        <input class="kodza-color__input" type="text" maxlength="7" spellcheck="false" autocomplete="off" aria-label="Hex code">
        ${'EyeDropper' in window ? `<button class="kodza-color__tool" type="button" data-tool="drop" aria-label="Pick a colour from the screen">${dropper}</button>` : ''}
        <button class="kodza-color__tool" type="button" data-tool="copy" aria-label="Copy the hex code">${copy}</button>
      </div>
      <div class="kodza-color__presets"></div>`;
    native.after(trigger, pop);
    native.tabIndex = -1;
    native.setAttribute('aria-hidden', 'true');
    const area = pop.querySelector('.kodza-color__area');
    const handle = pop.querySelector('.kodza-color__handle');
    const hue = pop.querySelector('.kodza-color__hue');
    const input = pop.querySelector('.kodza-color__input');
    const hexText = trigger.querySelector('.kodza-color__hex');
    const presetBox = pop.querySelector('.kodza-color__presets');
    const presetButtons = (presets.length ? presets : PRESETS).map((hex) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'kodza-color__preset';
      button.style.background = hex;
      button.dataset.hex = hex.toLowerCase();
      button.setAttribute('aria-label', hex);
      presetBox.append(button);
      return button;
    });

    let hsv = rgbToHsv(hexToRgb(native.value) || [0, 0, 0]);

    // Everything follows the current colour
    const paint = ({ fromInput = false } = {}) => {
      const hex = rgbToHex(hsvToRgb(hsv));
      root.style.setProperty('--kz-color-value', hex);
      root.style.setProperty('--kz-color-hue', rgbToHex(hsvToRgb([hsv[0], 1, 1])));
      handle.style.setProperty('--kz-x', `${hsv[1] * area.clientWidth}px`);
      handle.style.setProperty('--kz-y', `${(1 - hsv[2]) * area.clientHeight}px`);
      hue.value = Math.round(hsv[0]);
      hexText.textContent = hex;
      if (!fromInput) input.value = hex;
      area.setAttribute('aria-valuenow', Math.round(hsv[2] * 100));
      area.setAttribute('aria-valuetext', `Saturation ${Math.round(hsv[1] * 100)}%, brightness ${Math.round(hsv[2] * 100)}%`);
      presetButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.hex === hex)));
      return hex;
    };
    const commit = (kind) => {
      native.value = rgbToHex(hsvToRgb(hsv));
      native.dispatchEvent(new Event(kind, { bubbles: true }));
    };

    // A preset or a typed code: the colour itself travels there (hue by the shortest way), so
    // both handles and the square glide together instead of jumping
    let glide = 0;
    const glideTo = (hex) => {
      const rgb = hexToRgb(hex);
      if (!rgb) return;
      const next = rgbToHsv(rgb);
      // Greys keep the current hue, so the hue handle does not fly away for nothing
      if (next[1] === 0) next[0] = hsv[0];
      cancelAnimationFrame(glide);
      const from = [...hsv];
      const turn = ((next[0] - from[0] + 540) % 360) - 180;
      const done = () => {
        hsv = next;
        paint();
        commit('input');
        commit('change');
      };
      if (reduceMotion) return done();
      const start = performance.now();
      const step = (now) => {
        if (signal.aborted) return;
        const t = Math.min(1, (now - start) / 450);
        const e = 1 - Math.pow(1 - t, 3);
        hsv = [(from[0] + turn * e + 360) % 360, from[1] + (next[1] - from[1]) * e, from[2] + (next[2] - from[2]) * e];
        paint();
        if (t < 1) glide = requestAnimationFrame(step);
        else done();
      };
      glide = requestAnimationFrame(step);
    };

    // Dragging in the square
    const fromPointer = (event) => {
      const box = area.getBoundingClientRect();
      hsv = [hsv[0], clamp((event.clientX - box.left) / box.width, 0, 1), 1 - clamp((event.clientY - box.top) / box.height, 0, 1)];
      paint();
      commit('input');
    };
    area.addEventListener('pointerdown', (event) => {
      area.setPointerCapture(event.pointerId);
      root.classList.add('is-dragging');
      cancelAnimationFrame(glide);
      fromPointer(event);
    }, { signal });
    area.addEventListener('pointermove', (event) => area.hasPointerCapture(event.pointerId) && fromPointer(event), { signal });
    const stop = (event) => {
      if (!area.hasPointerCapture(event.pointerId)) return;
      area.releasePointerCapture(event.pointerId);
      root.classList.remove('is-dragging');
      commit('change');
    };
    area.addEventListener('pointerup', stop, { signal });
    area.addEventListener('pointercancel', stop, { signal });
    area.addEventListener('keydown', (event) => {
      const step = event.shiftKey ? 0.1 : 0.01;
      const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
      if (!moves[event.key]) return;
      event.preventDefault();
      hsv = [hsv[0], clamp(hsv[1] + moves[event.key][0], 0, 1), clamp(hsv[2] + moves[event.key][1], 0, 1)];
      paint();
      commit('input');
      commit('change');
    }, { signal });

    hue.addEventListener('input', () => {
      hsv = [Number(hue.value), hsv[1], hsv[2]];
      paint();
      commit('input');
    }, { signal });
    hue.addEventListener('change', () => commit('change'), { signal });

    input.addEventListener('input', () => {
      const value = input.value.startsWith('#') ? input.value : `#${input.value}`;
      if (hexToRgb(value) && (value.length === 4 || value.length === 7)) {
        hsv = rgbToHsv(hexToRgb(value));
        paint({ fromInput: true });
        commit('input');
      }
    }, { signal });
    input.addEventListener('change', () => {
      paint();
      commit('change');
    }, { signal });

    presetButtons.forEach((button) => button.addEventListener('click', () => glideTo(button.dataset.hex), { signal }));
    pop.querySelector('[data-tool="copy"]')?.addEventListener('click', async (event) => {
      const button = event.currentTarget;
      try {
        await navigator.clipboard.writeText(rgbToHex(hsvToRgb(hsv)));
        button.classList.add('is-done');
        button.setAttribute('aria-label', 'Copied');
        setTimeout(() => {
          button.classList.remove('is-done');
          button.setAttribute('aria-label', 'Copy the hex code');
        }, 1400);
      } catch {
        input.select();
      }
    }, { signal });
    pop.querySelector('[data-tool="drop"]')?.addEventListener('click', async () => {
      try {
        const { sRGBHex } = await new window.EyeDropper().open({ signal });
        glideTo(sRGBHex);
      } catch {
        /* cancelled */
      }
    }, { signal });

    // Opening and closing
    const isOpen = () => root.classList.contains('is-open');
    // Opened from the keyboard, the focus goes into the panel; with a click, it stays put
    let viaKeyboard = false;
    trigger.addEventListener('keydown', (event) => (viaKeyboard = event.key === 'Enter' || event.key === ' '), { signal });
    trigger.addEventListener('pointerdown', () => (viaKeyboard = false), { signal });
    const open = () => {
      // Not enough room below and enough above: the panel opens upwards. A closed panel that
      // changes side gets there at once, so it always unrolls from the field
      const box = trigger.getBoundingClientRect();
      const room = pop.offsetHeight + 16;
      const above = box.bottom + room > innerHeight && box.top > room;
      if (above !== root.classList.contains('is-above')) {
        pop.style.transition = 'none';
        root.classList.toggle('is-above', above);
        void pop.offsetWidth;
        pop.style.transition = '';
      }
      root.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      paint();
      if (viaKeyboard) requestAnimationFrame(() => area.focus({ preventScroll: true }));
    };
    const close = (refocus = true) => {
      if (!isOpen()) return;
      root.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      if (refocus) trigger.focus({ preventScroll: true });
    };
    trigger.addEventListener('click', () => (isOpen() ? close() : open()), { signal });
    // Escape closes it from the field too (opened with a click, the focus stays there)
    root.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !isOpen()) return;
      event.preventDefault();
      close();
    }, { signal });
    root.addEventListener('click', (event) => {
      if (trigger.contains(event.target) || pop.contains(event.target)) return;
      event.preventDefault();
      trigger.focus();
    }, { signal });
    pop.addEventListener('click', (event) => event.target.closest('button') && event.preventDefault(), { signal });
    document.addEventListener('pointerdown', (event) => !root.contains(event.target) && close(false), { signal });
    root.addEventListener('focusout', (event) => {
      if (isOpen() && event.relatedTarget && !root.contains(event.relatedTarget)) close(false);
    }, { signal });
    native.addEventListener('change', () => {
      const rgb = hexToRgb(native.value);
      if (rgb && native.value.toLowerCase() !== rgbToHex(hsvToRgb(hsv))) glideTo(native.value);
    }, { signal });

    paint();
  }

  // Kodza lifecycle, the same in every component: `kodza:init` starts the instances inside
  // event.detail.root (the whole page by default), `kodza:destroy` stops them and puts their
  // markup back. For themes and apps that swap content without a page load. Each running root
  // keeps its markup as written under KODZA, shared by every Kodza script on the page: a Kodza
  // component inside another one is saved as written, not half-started, and stopped with it.
  const KODZA = Symbol.for('kodza');
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
    if (root.classList.contains('is-ready')) return; // already running, maybe from another copy of this script
    // Rendered by React (data-kodza-manual): React starts it, with an init aimed at that markup once
    // it has hydrated it. Any earlier start would change markup React has not taken over yet
    const owner = root.closest('[data-kodza-manual]');
    if (owner && !(scope && owner.contains(scope))) return;
    const controller = new AbortController();
    const saved = { html: written(root), attrs: attrsOf(root), stop: () => destroy(root) };
    instances.set(root, { controller, saved });
    root[KODZA] = saved;
    mount(root, controller.signal);
    root.classList.add('is-ready');
  });
  const destroy = (scope) => find(scope).forEach((root) => {
    const instance = instances.get(root);
    if (!instance) return;
    instances.delete(root);
    // The Kodza components running inside it stop first: once its markup is put back, their own
    // script could not find them any more
    root.querySelectorAll('*').forEach((el) => el[KODZA]?.stop());
    instance.controller.abort();
    delete root[KODZA];
    put(root, instance.saved);
  });
  document.addEventListener('kodza:init', (event) => init(event.detail?.root));
  document.addEventListener('kodza:destroy', (event) => destroy(event.detail?.root));
  init();
  // Loaded in <head>, the script runs before the markup exists: once more when it is parsed
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(), { once: true });
})();
