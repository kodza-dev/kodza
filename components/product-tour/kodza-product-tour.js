// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Product Tour
// Builds the spotlight and the card, then walks the steps: scrolls the target into view, moves
// the spotlight onto it (it glides and reshapes between steps), places the card beside it
// (below, above, or to the side, kept on screen) and slides the words the way you go.
// Next / Back / Skip, the arrow keys and Escape. Fires "kodza:tour" with { step } and
// "kodza:tour-end" with { completed }. root.kodzaTour(index) starts it from code.
(() => {
  const SELECTOR = '.kodza-tour';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const pad2 = (n) => String(n).padStart(2, '0');
  let uid = 0;

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const start = root.querySelector('.kodza-tour__start');
    const steps = [...root.querySelectorAll('.kodza-tour__steps > li')].map((li) => ({ target: li.dataset.target, title: li.dataset.title || '', text: li.textContent.trim() }));
    if (!steps.length) return;
    const scope = (root.dataset.scope && root.closest(root.dataset.scope)) || document;
    const id = `kodza-tour-${++uid}`;

    const spot = Object.assign(document.createElement('div'), { className: 'kodza-tour__spot' });
    spot.setAttribute('aria-hidden', 'true');
    const blocker = Object.assign(document.createElement('div'), { className: 'kodza-tour__blocker' });
    const card = document.createElement('div');
    card.className = 'kodza-tour__card';
    card.tabIndex = -1;
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-labelledby', `${id}-title`);
    card.innerHTML = `
      <p class="kodza-tour__count" aria-hidden="true"></p>
      <div class="kodza-tour__words" aria-live="polite"></div>
      <div class="kodza-tour__foot">
        <span class="kodza-tour__dots" aria-hidden="true">${steps.map(() => '<span></span>').join('')}</span>
        <button class="kodza-tour__back" type="button">Back</button>
        <button class="kodza-tour__next" type="button">Next</button>
      </div>
      <button class="kodza-tour__skip" type="button">Skip</button>`;
    root.append(blocker, spot, card);
    const count = card.querySelector('.kodza-tour__count');
    const words = card.querySelector('.kodza-tour__words');
    const dots = [...card.querySelectorAll('.kodza-tour__dots span')];
    const back = card.querySelector('.kodza-tour__back');
    const next = card.querySelector('.kodza-tour__next');

    let current = -1;
    let from = null;

    const page = (step) => {
      const box = Object.assign(document.createElement('div'), { className: 'kodza-tour__page' });
      const title = Object.assign(document.createElement('p'), { className: 'kodza-tour__title', textContent: step.title, id: `${id}-title` });
      box.append(title, Object.assign(document.createElement('p'), { className: 'kodza-tour__text', textContent: step.text }));
      return box;
    };

    // The spotlight and the card, onto the target
    const place = (target, animate) => {
      const pad = parseFloat(getComputedStyle(root).getPropertyValue('--kz-tour-pad')) || 6;
      const r = target.getBoundingClientRect();
      const box = { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 };
      const to = { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` };
      // The first time, the hole closes in from the whole screen onto the target, like an iris
      const start = from || { left: '0px', top: '0px', width: `${innerWidth}px`, height: `${innerHeight}px` };
      if (animate && !reduceMotion) spot.animate([start, to], { duration: from ? 550 : 700, easing: ease });
      Object.assign(spot.style, to);
      from = to;
      // The card: below, else above, else to the right; always on screen
      const w = card.offsetWidth;
      const h = card.offsetHeight;
      let x = Math.min(innerWidth - w - 12, Math.max(12, box.left + box.width / 2 - w / 2));
      let y = box.top + box.height + 14;
      if (y + h > innerHeight - 12) y = box.top - h - 14;
      if (y < 12) {
        y = Math.min(innerHeight - h - 12, Math.max(12, box.top));
        x = box.left + box.width + 14 + w < innerWidth ? box.left + box.width + 14 : Math.max(12, box.left - w - 14);
      }
      // The first time, the card appears in place instead of flying in from the corner
      if (!card.kzPlaced) card.style.transition = 'opacity 0.3s ease 0.35s';
      card.style.setProperty('--kz-card-x', `${x}px`);
      card.style.setProperty('--kz-card-y', `${y}px`);
      if (!card.kzPlaced) {
        card.kzPlaced = true;
        requestAnimationFrame(() => requestAnimationFrame(() => card.style.removeProperty('transition')));
      }
    };

    const show = async (index) => {
      const step = steps[index];
      const target = step && scope.querySelector(step.target);
      if (!target) return end(false);
      const dir = index > current ? 1 : -1;
      current = index;
      // Bring it into view first
      const r = target.getBoundingClientRect();
      const roomDown = scrollY + innerHeight < document.documentElement.scrollHeight - 1;
      if ((r.top < 80 && scrollY > 0) || (r.bottom > innerHeight - 220 && roomDown)) {
        target.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
        await new Promise((resolve) => setTimeout(resolve, reduceMotion ? 0 : 450));
        if (signal.aborted) return;
      }
      // The words slide the way you go
      const old = words.firstElementChild;
      const fresh = page(step);
      words.append(fresh);
      if (old) {
        old.querySelector('.kodza-tour__title')?.removeAttribute('id');
        if (reduceMotion) old.remove();
        else {
          const timing = { duration: 380, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
          old.animate([{ transform: 'none', opacity: 1 }, { transform: `translateX(${dir * -24}px)`, opacity: 0 }], { ...timing, fill: 'forwards' }).finished.then(() => old.remove());
          fresh.animate([{ transform: `translateX(${dir * 24}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { ...timing, delay: 80, fill: 'backwards' });
        }
      }
      count.textContent = `${pad2(index + 1)} / ${pad2(steps.length)}`;
      dots.forEach((dot, i) => dot.classList.toggle('is-on', i === index));
      back.hidden = index === 0;
      next.textContent = index === steps.length - 1 ? 'Done' : 'Next';
      // The tour shows once the first step is written and in place, never empty or elsewhere
      place(target, true);
      root.classList.add('is-on');
      root.dispatchEvent(new CustomEvent('kodza:tour', { detail: { step: index }, bubbles: true }));
    };

    const begin = (index = 0) => {
      from = null;
      current = -1;
      words.replaceChildren();
      card.kzPlaced = false;
      show(index).then(() => card.focus({ preventScroll: true }));
    };
    const end = (completed) => {
      if (!root.classList.contains('is-on')) return;
      root.classList.remove('is-on');
      card.kzPlaced = false;
      root.dispatchEvent(new CustomEvent('kodza:tour-end', { detail: { completed }, bubbles: true }));
      start?.focus({ preventScroll: true });
    };
    root.kodzaTour = begin;
    signal.addEventListener('abort', () => delete root.kodzaTour);

    start?.addEventListener('click', () => begin(0), { signal });
    next.addEventListener('click', () => (current >= steps.length - 1 ? end(true) : show(current + 1)), { signal });
    back.addEventListener('click', () => current > 0 && show(current - 1), { signal });
    card.querySelector('.kodza-tour__skip').addEventListener('click', () => end(false), { signal });
    document.addEventListener('keydown', (event) => {
      if (!root.classList.contains('is-on')) return;
      if (event.key === 'Escape') end(false);
      else if (event.key === 'ArrowRight' && current < steps.length - 1) show(current + 1);
      else if (event.key === 'ArrowLeft' && current > 0) show(current - 1);
      else if (event.key === 'Tab') {
        // Keep the focus in the card
        const stops = [...card.querySelectorAll('button:not([hidden])')];
        const at = stops.indexOf(document.activeElement);
        event.preventDefault();
        stops[(at + (event.shiftKey ? -1 : 1) + stops.length) % stops.length]?.focus();
      }
    }, { signal });
    // While the page scrolls, the spotlight and the card stick to the target instead of gliding after it
    let still = 0;
    const follow = () => {
      if (!root.classList.contains('is-on') || current < 0) return;
      spot.getAnimations().forEach((animation) => animation.finish());
      card.classList.add('is-following');
      place(scope.querySelector(steps[current].target), false);
      clearTimeout(still);
      still = setTimeout(() => card.classList.remove('is-following'), 140);
    };
    addEventListener('resize', follow, { signal });
    addEventListener('scroll', follow, { passive: true, signal });
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
