// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — File Upload
// Wakes the zone up while files are dragged over the page, takes drops and picks, and gives
// each file a row: thumbnail, size, progress, done or error. Files too big (data-max-mb) are
// refused with a reason. If root.kodzaUpload = (file, onProgress) => Promise is set, each file
// is uploaded through it; otherwise the files stay attached to the input for the form.
// root.kodzaAdd(files) adds files from a script. Fires "kodza:files" with { files }.
(() => {
  const SELECTOR = '.kodza-upload';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const size = (bytes) => (bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(0)} KB` : `${Number((bytes / 1048576).toFixed(1))} MB`);
  const tick = '<svg class="kodza-upload__tick" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 9.5l3.2 3 6.8-7.5" pathLength="1"/></svg>';
  const cross = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 3l6 6M9 3 3 9"/></svg>';

  // A word rolls to its new value
  const roll = (box, text) => {
    const prev = box.lastElementChild;
    if (prev && prev.textContent === text) return;
    const span = Object.assign(document.createElement('span'), { textContent: text });
    box.append(span);
    if (!prev) return;
    if (reduceMotion) return prev.remove();
    const timing = { duration: 380, easing: ease };
    prev.animate([{ transform: 'none' }, { transform: 'translateY(-110%)' }], { ...timing, fill: 'forwards' }).finished.then(() => prev.remove());
    span.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], timing);
  };

  const hasFiles = (event) => [...(event.dataTransfer?.types || [])].includes('Files');

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const input = root.querySelector('.kodza-upload__input');
    const zone = root.querySelector('.kodza-upload__zone');
    const list = root.querySelector('.kodza-upload__list');
    const words = root.querySelector('.kodza-upload__words');
    if (!input || !zone || !list) return;

    // Files dragged anywhere over the page: the zone wakes up
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
      root.classList.remove('is-dragging', 'is-over');
    }, { signal });
    // A drop next to the zone should not open the file in the tab
    window.addEventListener('dragover', (event) => hasFiles(event) && event.preventDefault(), { signal });
    const maxBytes = (Number(root.dataset.maxMb) || 0) * 1048576;
    const idle = words?.firstElementChild?.cloneNode(true);
    const attached = new DataTransfer();

    const setWords = (over) => {
      if (!words) return;
      const prev = words.lastElementChild;
      if (over === prev.classList.contains('is-over')) return;
      const span = over ? Object.assign(document.createElement('span'), { textContent: 'Let go. We have got it.', className: 'is-over' }) : idle.cloneNode(true);
      words.append(span);
      if (reduceMotion) return prev.remove();
      const timing = { duration: 380, easing: ease };
      prev.animate([{ transform: 'none' }, { transform: 'translateY(-110%)' }], { ...timing, fill: 'forwards' }).finished.then(() => prev.remove());
      span.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], timing);
    };

    const row = (file) => {
      const item = document.createElement('li');
      item.className = 'kodza-upload__item';
      const ext = (file.name.split('.').pop() || '').slice(0, 4);
      item.innerHTML = `
        <div class="kodza-upload__row">
          <span class="kodza-upload__thumb" aria-hidden="true"></span>
          <span class="kodza-upload__info">
            <span class="kodza-upload__name"></span>
            <span class="kodza-upload__meta"><span>${size(file.size)}</span><span class="kodza-upload__status"></span></span>
            <span class="kodza-upload__bar"><span></span></span>
          </span>
          <span class="kodza-upload__end">${tick}<button class="kodza-upload__remove" type="button">${cross}</button></span>
        </div>`;
      item.querySelector('.kodza-upload__name').textContent = file.name;
      item.querySelector('.kodza-upload__remove').setAttribute('aria-label', `Remove ${file.name}`);
      const thumb = item.querySelector('.kodza-upload__thumb');
      if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.alt = '';
        img.src = URL.createObjectURL(file);
        img.onload = () => URL.revokeObjectURL(img.src);
        thumb.append(img);
      } else {
        thumb.textContent = ext;
      }
      return item;
    };

    const remove = (item, file) => {
      item.classList.remove('is-shown');
      item.kzCancel?.();
      // Take it off the input too
      const keep = new DataTransfer();
      [...attached.files].filter((f) => f !== file).forEach((f) => keep.items.add(f));
      attached.items.clear();
      [...keep.files].forEach((f) => attached.items.add(f));
      input.files = attached.files;
      setTimeout(() => item.remove(), reduceMotion ? 0 : 450);
    };

    const add = (files) => {
      const added = [...files];
      added.forEach((file, i) => {
        const item = row(file);
        const status = item.querySelector('.kodza-upload__status');
        const bar = item.querySelector('.kodza-upload__bar');
        list.append(item);
        // One after the other: the row opens, then fills
        setTimeout(() => item.classList.add('is-shown'), reduceMotion ? 0 : 30 + i * 90);
        item.querySelector('.kodza-upload__remove').addEventListener('click', () => remove(item, file), { signal });

        if (maxBytes && file.size > maxBytes) {
          item.classList.add('is-error');
          roll(status, `Too big. The limit is ${size(maxBytes)}.`);
          return;
        }
        attached.items.add(file);
        input.files = attached.files;
        const upload = root.kodzaUpload;
        if (typeof upload !== 'function') {
          item.classList.add('is-ready');
          roll(status, 'Ready');
          return;
        }
        let cancelled = false;
        item.kzCancel = () => (cancelled = true);
        roll(status, '0%');
        upload(file, (fraction) => {
          if (cancelled) return;
          const pct = Math.max(0, Math.min(100, Math.round(fraction * 100)));
          bar.style.setProperty('--kz-progress', pct / 100);
          roll(status, `${pct}%`);
        }).then(() => {
          if (cancelled) return;
          bar.style.setProperty('--kz-progress', 1);
          item.classList.add('is-done');
          roll(status, 'Done');
        }).catch((error) => {
          if (cancelled) return;
          item.classList.add('is-error');
          roll(status, error?.message || 'Upload failed. Try again.');
        });
      });
      root.dispatchEvent(new CustomEvent('kodza:files', { detail: { files: added }, bubbles: true }));
    };
    root.kodzaAdd = add;
    signal.addEventListener('abort', () => delete root.kodzaAdd);

    input.addEventListener('change', () => {
      // The picker replaces the input's files: take them, then put the whole set back
      const picked = [...input.files];
      input.files = attached.files;
      add(picked);
    }, { signal });
    zone.addEventListener('dragover', (event) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      root.classList.add('is-over');
      setWords(true);
    }, { signal });
    zone.addEventListener('dragleave', (event) => {
      if (zone.contains(event.relatedTarget)) return;
      root.classList.remove('is-over');
      setWords(false);
    }, { signal });
    zone.addEventListener('drop', (event) => {
      event.preventDefault();
      root.classList.remove('is-over');
      setWords(false);
      if (event.dataTransfer?.files.length) add(event.dataTransfer.files);
    }, { signal });
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
