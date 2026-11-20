// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Read Aloud
// A "Listen" button above an article, read by the browser's own voice (speechSynthesis: no
// service, no key, nothing sent anywhere). The sentence being read stays lit while the rest steps
// back, a pill glides from word to word, the ring around the button fills with the article, and
// once reading has started a click on a word reads on from there. One article reads at a time on
// a page. Hidden where the browser has no speech synthesis. Settings, on the root: data-voice (a
// voice by its name, "Samantha"; the best local voice of the article's lang without it). Each
// word below can be set with data-text-<name>, {n} is filled in. The timings are the constants
// under WORDS. Inside the text, [data-read-skip] is left out of the reading (a caption, a credit).
(() => {
  const SELECTOR = '.kodza-read-aloud';
  const WORDS = {
    listen: 'Listen',
    pause: 'Pause',
    resume: 'Resume',
    time: '{n} min',
    rate: '{n}×',
    rateLabel: 'Reading speed, {n}×',
  };
  const RATES = [1, 1.5, 2]; // the speeds the second button goes through
  const WPM = 165; // words a minute at 1×, for the time left
  const ROLL = 420; // ms: a label rolls
  const NO_BOUNDARY = 900; // ms of speech with no word event: the voice gives none, the sentence alone is lit
  const ARRIVE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  // Not read, and not cut into words
  const SKIP = 'script, style, noscript, template, svg, pre, code, [aria-hidden="true"], [data-read-skip]';
  // A new one of these is a new sentence, even without a full stop (a title, an item)
  const BLOCKS = 'p, li, dt, dd, h1, h2, h3, h4, h5, h6, blockquote, figcaption, td, th, div, section, article';
  // Joke and robot voices some systems list next to the real ones: never picked on their own
  const NOVELTY = /^(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley)\b/i;
  // Voices that sound like a person, preferred among the others
  const NATURAL = /enhanced|premium|natural|neural|online|siri/i;
  const RING = 2 * Math.PI * 12.25;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const fill = (text, values) => text.replace(/\{(\w+)\}/g, (all, key) => (key in values ? values[key] : all));
  const ENDS = /[.!?…]["'”’»)\]]*$/;
  // The instance reading now, by its stop: one at a time on a page
  let speaking = null;

  // The voice for a lang: the one named, else a local voice of that lang (the system's default
  // first, then a natural one), else any voice of that lang
  const voiceFor = (lang, name) => {
    const voices = window.speechSynthesis.getVoices();
    const named = name && voices.find((v) => v.name === name);
    if (named) return named;
    const tag = (v) => v.lang.toLowerCase().replace('_', '-');
    const base = lang.split('-')[0];
    const fits = voices.filter((v) => tag(v).split('-')[0] === base && !NOVELTY.test(v.name));
    const exact = fits.filter((v) => tag(v) === lang);
    const pool = exact.length ? exact : fits;
    const local = pool.filter((v) => v.localService);
    return local.find((v) => v.default) || local.find((v) => NATURAL.test(v.name)) || local[0]
      || pool.find((v) => v.default) || pool.find((v) => NATURAL.test(v.name)) || pool[0] || null;
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    const data = root.dataset;
    const word = (key) => data[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];
    const make = (tag, name, text) => {
      const el = document.createElement(tag);
      if (name) el.className = `kodza-read-aloud__${name}`;
      if (text != null) el.textContent = text;
      return el;
    };
    const text = root.querySelector('.kodza-read-aloud__text');
    const play = root.querySelector('.kodza-read-aloud__play');
    const rateButton = root.querySelector('.kodza-read-aloud__rate');
    if (!text || !play || !('speechSynthesis' in window) || !window.SpeechSynthesisUtterance) return;
    const lang = (root.closest('[lang]')?.lang || 'en').toLowerCase();

    // The text cut into words, each one knowing its sentence; the markup around them is kept
    const words = [];
    const sentences = [];
    const indexOf = new WeakMap();
    const nodes = [];
    const walker = document.createTreeWalker(text, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const skipped = node.parentElement.closest(SKIP);
        return skipped && text.contains(skipped) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      },
    });
    while (walker.nextNode()) nodes.push(walker.currentNode);
    let gap = false;
    let lastBlock = null;
    nodes.forEach((node) => {
      if (!node.data.trim()) {
        gap = true;
        return;
      }
      const block = node.parentElement.closest(BLOCKS);
      const host = block && text.contains(block) ? block : text;
      const frag = document.createDocumentFragment();
      node.data.match(/\s+|\S+/g).forEach((token) => {
        if (/^\s/.test(token)) {
          frag.append(token);
          gap = true;
          return;
        }
        const prev = words[words.length - 1];
        const fresh = !prev || host !== lastBlock || ENDS.test(prev.text);
        if (fresh) sentences.push({ from: words.length, to: words.length });
        const el = make('span', 'word', token);
        indexOf.set(el, words.length);
        words.push({ el, text: token, sentence: sentences.length - 1, space: gap || host !== lastBlock });
        sentences[sentences.length - 1].to = words.length - 1;
        frag.append(el);
        gap = false;
        lastBlock = host;
      });
      node.replaceWith(frag);
    });
    if (!words.length) return;

    const mark = make('span', 'mark');
    mark.setAttribute('aria-hidden', 'true');
    text.prepend(mark);

    const icon = play.querySelector('.kodza-read-aloud__icon');
    const label = play.querySelector('.kodza-read-aloud__label');
    const timeEl = play.querySelector('.kodza-read-aloud__time');
    let progress = null;
    if (icon) {
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('class', 'kodza-read-aloud__ring');
      svg.setAttribute('viewBox', '0 0 28 28');
      svg.setAttribute('focusable', 'false');
      ['track', 'progress'].forEach((name) => {
        const circle = document.createElementNS(ns, 'circle');
        circle.setAttribute('class', `kodza-read-aloud__${name}`);
        ['cx', 'cy'].forEach((key) => circle.setAttribute(key, '14'));
        circle.setAttribute('r', '12.25');
        svg.append(circle);
        progress = circle;
      });
      progress.style.strokeDasharray = `${RING}`;
      progress.style.strokeDashoffset = `${RING}`;
      icon.replaceChildren(svg, make('span', 'glyph'));
    }

    // A label in its window: the old one leaves upwards, the new one rises from below, and the
    // button follows the width
    const lineOf = (box) => {
      let line = box.querySelector(':scope > .kodza-read-aloud__line');
      if (!line) {
        line = make('span', 'line');
        line.append(make('span', ''));
        box.replaceChildren(line);
      }
      return line;
    };
    const writeLine = (box, value, animate) => {
      if (!box) return;
      const line = lineOf(box);
      const prev = line.lastElementChild;
      if (prev.textContent === value) return;
      // Computed widths keep the fraction that offsetWidth rounds away, so the end does not snap
      const widthOf = (el) => parseFloat(getComputedStyle(el).width);
      const from = widthOf(line);
      const next = make('span', '', value);
      line.append(next);
      const pace = paceOf(root);
      if (!animate || !prev.textContent || reduceMotion || pace === 0) {
        prev.remove();
        return;
      }
      const timing = { duration: ROLL * pace, easing: ARRIVE };
      prev.setAttribute('aria-hidden', 'true');
      line.animate([{ width: `${from}px` }, { width: `${widthOf(next)}px` }], timing);
      prev.animate([{ transform: 'none' }, { transform: 'translateY(-110%)' }], { ...timing, fill: 'forwards' })
        .finished.then(() => prev.remove(), () => {});
      next.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], { ...timing, fill: 'backwards' });
    };

    let state = 'idle';
    let at = 0;
    let lit = -1;
    let rate = RATES[0];
    let run = 0;
    let utterance = null;
    let heard = false;
    let silence = 0;
    let lineTop = null;

    const showTime = (animate) => {
      const left = words.length - (state === 'idle' ? 0 : at);
      writeLine(timeEl, fill(word('time'), { n: Math.max(1, Math.ceil(left / (WPM * rate))) }), animate);
    };
    const showRate = (animate) => {
      if (!rateButton) return;
      writeLine(rateButton, fill(word('rate'), { n: rate }), animate);
      rateButton.setAttribute('aria-label', fill(word('rateLabel'), { n: rate }));
    };
    const show = (animate = true) => {
      root.classList.toggle('is-playing', state === 'playing');
      root.classList.toggle('is-active', state !== 'idle');
      writeLine(label, word(state === 'playing' ? 'pause' : state === 'paused' ? 'resume' : 'listen'), animate);
      showTime(animate);
      if (progress) progress.style.strokeDashoffset = `${RING * (1 - (state === 'idle' ? 0 : at / words.length))}`;
    };

    // The pill under the word: it glides along a line and jumps, without moving, to a new one.
    // Positions are divided by the scale of a parent zoomed by transform
    const radiusOf = () => getComputedStyle(mark).getPropertyValue('--kz-read-aloud-radius').trim() || '6px';
    const place = (glide) => {
      const el = words[at]?.el;
      if (state === 'idle' || !el) return;
      // The pill is a layer over the whole text, cut down to the word by clip-path: it glides and
      // resizes without touching the layout, its corners never stretched
      const box = mark.getBoundingClientRect();
      const scale = box.width / mark.offsetWidth || 1;
      const r = el.getBoundingClientRect();
      const size = parseFloat(getComputedStyle(el).fontSize);
      const padX = size * 0.18;
      const padY = size * 0.06;
      const x = (r.left - box.left) / scale - padX;
      const y = (r.top - box.top) / scale - padY;
      const right = mark.offsetWidth - x - r.width / scale - padX * 2;
      const bottom = mark.offsetHeight - y - r.height / scale - padY * 2;
      const jump = !glide || !mark.classList.contains('is-on') || Math.abs(y - lineTop) > 1;
      if (jump) mark.style.transition = 'none';
      mark.style.clipPath = `inset(${y}px ${right}px ${bottom}px ${x}px round ${radiusOf()})`;
      lineTop = y;
      if (jump) {
        void mark.offsetWidth;
        mark.style.transition = '';
      }
      mark.classList.add('is-on');
    };
    const light = (sentence) => {
      if (sentence === lit) return;
      if (lit >= 0) for (let k = sentences[lit].from; k <= sentences[lit].to; k++) words[k].el.classList.remove('is-current');
      lit = sentence;
      if (lit >= 0) for (let k = sentences[lit].from; k <= sentences[lit].to; k++) words[k].el.classList.add('is-current');
    };
    const goTo = (k, glide = true) => {
      at = k;
      light(words[k].sentence);
      place(glide);
      showTime(true);
      if (progress) progress.style.strokeDashoffset = `${RING * (1 - at / words.length)}`;
    };

    // One utterance a sentence, from word i: long ones get cut short by some browsers, and a
    // sentence is where a pause, a new speed or a click picks up
    const speakFrom = (i) => {
      const token = ++run;
      const synth = window.speechSynthesis;
      const last = sentences[words[i].sentence].to;
      let said = '';
      const starts = [];
      for (let k = i; k <= last; k++) {
        if (k > i && words[k].space) said += ' ';
        starts.push(said.length);
        said += words[k].text;
      }
      const u = new SpeechSynthesisUtterance(said);
      u.lang = lang;
      const voice = voiceFor(lang, data.voice);
      if (voice) u.voice = voice;
      u.rate = rate;
      u.onstart = () => {
        if (token !== run || heard) return;
        clearTimeout(silence);
        silence = setTimeout(() => {
          if (token === run && !heard) root.classList.add('is-sentence');
        }, NO_BOUNDARY);
      };
      u.onboundary = (event) => {
        if (token !== run || event.name === 'sentence') return;
        heard = true;
        root.classList.remove('is-sentence');
        let k = starts.length - 1;
        while (k > 0 && starts[k] > event.charIndex) k--;
        if (i + k !== at) goTo(i + k);
      };
      u.onend = () => {
        if (token !== run) return;
        if (last + 1 < words.length) speakFrom(last + 1);
        else stop();
      };
      u.onerror = (event) => {
        if (token !== run || event.error === 'interrupted' || event.error === 'canceled') return;
        stop();
      };
      utterance = u; // kept: some browsers drop the events of an utterance nothing points to
      goTo(i, i !== at);
      if (synth.speaking || synth.pending) synth.cancel();
      synth.speak(u);
    };

    const quiet = () => {
      run++;
      clearTimeout(silence);
      if (speaking === stop) window.speechSynthesis.cancel();
      utterance = null;
    };
    function stop() {
      quiet();
      if (speaking === stop) speaking = null;
      state = 'idle';
      at = 0;
      light(-1);
      mark.classList.remove('is-on');
      root.classList.remove('is-sentence');
      show();
    }
    const start = (k) => {
      if (speaking && speaking !== stop) speaking();
      speaking = stop;
      state = 'playing';
      show();
      speakFrom(k);
    };

    play.addEventListener('click', () => {
      if (state === 'playing') {
        quiet();
        state = 'paused';
        show();
      } else start(state === 'paused' ? at : 0);
    }, { signal });

    rateButton?.addEventListener('click', () => {
      rate = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
      showRate(true);
      showTime(true);
      if (state === 'playing') {
        quiet();
        speakFrom(at);
      }
    }, { signal });

    // Once reading has started, a word clicked reads on from there (not a link or a control in
    // the text, and not while selecting)
    text.addEventListener('click', (event) => {
      const el = event.target.closest?.('.kodza-read-aloud__word');
      if (state === 'idle' || !el || event.target.closest('a, button, input, select, textarea, label, summary')) return;
      if (String(window.getSelection?.() || '').trim()) return;
      quiet();
      start(indexOf.get(el));
    }, { signal });

    const resize = new ResizeObserver(() => place(false));
    resize.observe(text);
    window.addEventListener('pagehide', () => { if (state !== 'idle') stop(); }, { signal });
    signal.addEventListener('abort', () => {
      resize.disconnect();
      if (state !== 'idle') {
        quiet();
        if (speaking === stop) speaking = null;
      }
    });

    showRate(false);
    show(false);
    root.classList.add('is-voiced');
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
