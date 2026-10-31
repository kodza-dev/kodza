// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Code Block
// Highlights the code in weight and light (js, css, html, shell; anything else stays plain),
// splits it into numbered lines, marks the lines of data-highlight, folds the lines of
// data-fold under a row that opens them, and copies it: the whole code, or a terminal's
// commands only (no prompt, no output). Copy rolls to Copied.
(() => {
  const SELECTOR = '.kodza-code';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const RULES = {
    js: [
      ['c', /\/\/[^\n]*|\/\*[\s\S]*?\*\//y],
      ['s', /'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/y],
      ['k', /\b(?:const|let|var|function|return|if|else|for|while|of|in|new|class|extends|import|export|from|default|await|async|try|catch|throw|typeof|instanceof|this|null|undefined|true|false)\b/y],
      ['n', /\b\d+(?:\.\d+)?\b/y],
      ['p', /=>|[{}()[\];,.]/y],
    ],
    css: [
      ['c', /\/\*[\s\S]*?\*\//y],
      ['s', /'[^'\n]*'|"[^"\n]*"/y],
      ['k', /@[\w-]+/y],
      ['a', /[\w-]+(?=\s*:[^:{}]*;)/y],
      ['n', /-?\d*\.?\d+(?:px|em|rem|%|s|ms|deg|vh|vw|fr)?\b/y],
      ['p', /[{}();:,]/y],
    ],
    html: [
      ['c', /<!--[\s\S]*?-->/y],
      ['k', /<\/?[\w-]+|\/?>/y],
      ['a', /[\w:-]+(?==)/y],
      ['s', /"[^"]*"|'[^']*'/y],
    ],
  };

  // Tokens: [class or '', text]
  const tokenize = (code, lang) => {
    const rules = RULES[lang];
    if (!rules) return [['', code]];
    const out = [];
    let i = 0;
    let plain = '';
    while (i < code.length) {
      let hit = null;
      for (const [cls, re] of rules) {
        re.lastIndex = i;
        const m = re.exec(code);
        if (m && m[0]) {
          hit = [cls, m[0]];
          break;
        }
      }
      if (hit) {
        if (plain) out.push(['', plain]);
        plain = '';
        out.push(hit);
        i += hit[1].length;
      } else {
        // Words go by whole, so a keyword is never found inside a name
        const word = /[\w$-]+|[\s\S]/y;
        word.lastIndex = i;
        const chunk = word.exec(code)[0];
        plain += chunk;
        i += chunk.length;
      }
    }
    if (plain) out.push(['', plain]);
    return out;
  };

  const span = (cls, text) => {
    const el = document.createElement('span');
    if (cls) el.className = `kodza-code__${cls}`;
    el.textContent = text;
    return el;
  };

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const pre = root.querySelector('.kodza-code__pre');
    const code = pre?.querySelector('code');
    const copy = root.querySelector('.kodza-code__copy');
    if (!code) return;
    const source = code.textContent.replace(/\n$/, '');
    const lang = pre.dataset.lang || '';
    const marked = new Set();
    (pre.dataset.highlight || '').split(',').forEach((part) => {
      const [a, b] = part.split('-').map(Number);
      for (let n = a; n <= (b || a); n++) if (n) marked.add(n);
    });

    // Lines: a terminal shows its prompt apart and quiets the output
    const lines = [document.createElement('span')];
    if (lang === 'shell') {
      source.split('\n').forEach((text, i) => {
        if (i) lines.push(document.createElement('span'));
        const line = lines[lines.length - 1];
        if (text.startsWith('$ ')) line.append(span('prompt', '$ '), text.slice(2));
        else line.append(span('out', text));
      });
    } else {
      tokenize(source, lang).forEach(([cls, text]) => text.split('\n').forEach((piece, i) => {
        if (i) lines.push(document.createElement('span'));
        if (piece) lines[lines.length - 1].append(span(cls, piece));
      }));
    }
    lines.forEach((line, i) => {
      line.classList.add('kodza-code__line');
      if (marked.has(i + 1)) line.classList.add('is-marked');
      if (!line.childNodes.length) line.append('​');
    });

    // Folded lines (data-fold="12-40"): a row takes their place, Show rolls to Hide and they
    // unroll under it. Copy still takes them. Folded, they are out of the line count: the row
    // counts them, so the lines after it keep their numbers. data-fold-label names what is
    // folded, one name per range ("theme guard": Show theme guard · 1,058 lines)
    const names = (pre.dataset.foldLabel || '').split(',').map((name) => name.trim());
    const folds = (pre.dataset.fold || '').split(',')
      .map((part, i) => {
        const [a, b = a] = part.split('-').map(Number);
        return [a, Math.min(b, lines.length), names[i] || ''];
      })
      .filter(([a, b]) => a >= 1 && b >= a)
      .sort((x, y) => x[0] - y[0])
      .filter(([a], i, all) => !i || a > all[i - 1][1]);
    const nodes = [];
    let done = 0;
    folds.forEach(([a, b, name]) => {
      const size = b - a + 1;
      const lineCount = `${size.toLocaleString('en-US')} ${size === 1 ? 'line' : 'lines'}`;
      const count = name ? `${name} · ${lineCount}` : lineCount;
      const spoken = name ? `${name}, ${lineCount}` : lineCount;
      const row = document.createElement('button');
      const body = document.createElement('span');
      row.type = 'button';
      row.className = 'kodza-code__unfold';
      row.innerHTML = '<span class="kodza-code__chevron" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M4 6l4 4 4-4" /></svg></span><span class="kodza-code__words"><span>Show</span><span>Hide</span></span>';
      row.append(` ${count}`);
      body.className = 'kodza-code__fold';
      body.append(...lines.slice(a - 1, b));
      const set = (open, animate) => {
        const from = body.hidden ? 0 : Math.min(body.offsetHeight, innerHeight);
        body.getAnimations().forEach((animation) => animation.cancel());
        row.setAttribute('aria-expanded', open);
        row.setAttribute('aria-label', `${open ? 'Hide' : 'Show'} ${spoken}`);
        const fold = () => {
          body.hidden = !open;
          row.style.counterIncrement = open ? 'none' : `kodza-code-line ${size}`;
        };
        if (open) fold();
        if (!animate) return open || fold();
        // In a block that scrolls (--kz-code-max-height), a row near its bottom edge would open
        // out of sight: the code scrolls up instead, and the lines come in from below. The line
        // before the row stops on the top edge, so no line is left cut in half above it
        const box = pre.getBoundingClientRect();
        const at = (row.previousElementSibling || row).getBoundingClientRect();
        if (open && pre.scrollHeight > pre.clientHeight && box.bottom - at.bottom < 160) {
          const scale = box.height / pre.offsetHeight || 1;
          pre.scrollBy({ top: (at.top - box.top) / scale, behavior: reduce.matches ? 'auto' : 'smooth' });
          return;
        }
        if (reduce.matches) return open || fold();
        // Only the height a screen can show is animated: the rest is below it either way
        const to = open ? Math.min(body.offsetHeight, innerHeight) : 0;
        body.animate([{ height: `${from}px` }, { height: `${to}px` }], {
          duration: open ? 520 : 420,
          easing: open ? 'cubic-bezier(0.22, 1, 0.36, 1)' : 'cubic-bezier(0.65, 0, 0.35, 1)',
        }).finished.then(() => open || fold(), () => {});
      };
      set(false, false);
      row.addEventListener('click', () => set(row.getAttribute('aria-expanded') !== 'true', true), { signal });
      nodes.push(...lines.slice(done, a - 1), row, body);
      done = b;
    });
    code.replaceChildren(...nodes, ...lines.slice(done));

    // Copy: the code, or a terminal's commands only
    const text = lang === 'shell'
      ? source.split('\n').filter((line) => line.startsWith('$ ')).map((line) => line.slice(2)).join('\n')
      : source;
    let timer = 0;
    copy?.setAttribute('aria-label', 'Copy the code');
    copy?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(text);
      } catch (error) {
        const area = Object.assign(document.createElement('textarea'), { value: text });
        area.style.cssText = 'position:fixed;opacity:0';
        document.body.append(area);
        area.select();
        document.execCommand('copy');
        area.remove();
      }
      copy.classList.add('is-copied');
      copy.setAttribute('aria-label', 'Copied');
      clearTimeout(timer);
      timer = setTimeout(() => {
        copy.classList.remove('is-copied');
        copy.setAttribute('aria-label', 'Copy the code');
      }, 1800);
    }, { signal });
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
