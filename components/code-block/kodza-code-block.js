// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Code Block
// Highlights the code in weight and light (js, css, html, shell; anything else stays plain),
// splits it into numbered lines, marks the lines of data-highlight, and copies it: the
// whole code, or a terminal's commands only (no prompt, no output). Copy rolls to Copied.
(() => {
  const SELECTOR = '.kodza-code';
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
    code.replaceChildren(...lines);

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
