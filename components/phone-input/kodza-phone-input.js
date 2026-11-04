// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Phone Input
// Puts the country code in front of the real tel input ("FR +33", in mono) and opens a list to
// find a country by name or code. The number groups itself as it is typed, the way that country
// writes it; a pasted or autofilled "+44 7700…" picks the country on its own, and so does typing
// "+" (or "00") then a code. Backspace over a space takes the digit behind it. The form gets the
// whole number in E.164 (+447700900123) under the input's name, from a hidden input; leaving the
// field says when the number is short or long for its country, and a tick draws itself once it
// has the right length. After setting .value from a script, fire "change" on the input.
// Settings: --kz-phone-* in the CSS; data-country (the country first shown, else the visitor's
// region), data-countries="GB,IE,FR" (the list and its order; with one country the code is a
// plain label), data-locale (the language of country names, else the page's). The words,
// timings and countries are below; each word can be set per field with data-text-<name>
// (data-text-short-one="…"), {country}, {dial}, {left}, {extra} and {count} are filled in.
(() => {
  const SELECTOR = '.kodza-phone';
  const WORDS = {
    search: 'Country or code', // the search on top of the list
    code: 'Country code: {country} +{dial}', // the code button, read out
    empty: 'No country matches.',
    count: '{count} countries', // read out as the list filters
    one: '1 country',
    short: '{left} more digits for {country}.',
    shortOne: '1 more digit for {country}.',
    long: '{extra} digits too many for {country}.',
    longOne: '1 digit too many for {country}.',
    unknown: 'No country here dials +{dial}.',
    required: 'Enter a phone number.',
    detected: '{country}, +{dial}', // read out when a typed or pasted code picks the country
  };
  const ROLL = 420; // ms, the code rolling to a new country
  const RESIZE = 240; // ms, the list changing height as it filters
  const ANNOUNCE = 400; // ms of quiet before the count is read out (a wait, not a motion)
  const PAGE = 5; // rows per PageUp / PageDown
  const LONGEST = 15; // digits after a "+" no country claims yet (E.164 caps a number at 15)
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';

  // One line per country: ISO code | dialing code | trunk prefix, what is dialled before a number
  // at home (0 in France, 1 in the US, none in Spain) | an example number as the country writes
  // it, which sets the grouping and the length | the fewest and the most digits a number takes,
  // when they differ from the example's. A length check, not a carrier lookup: add a line, or a
  // range, for a country that needs one. US before Canada: "+1" picks it unless Canada is chosen
  const COUNTRIES = `
    FR|33|0|6 12 34 56 78
    GB|44|0|7400 123456
    US|1|1|(201) 555-0123
    CA|1|1|(506) 234-5678
    DE|49|0|1512 3456789|10
    BE|32|0|470 12 34 56
    NL|31|0|6 12345678
    LU|352||628 123 456
    CH|41|0|78 123 45 67
    AT|43|0|664 123456|7|13
    ES|34||612 34 56 78
    PT|351||912 345 678
    IT|39||312 345 6789|9
    IE|353|0|85 012 3456
    DK|45||32 12 34 56
    SE|46|0|70 123 45 67
    NO|47||406 12 345
    FI|358|0|41 2345678|9|10
    IS|354||611 1234
    PL|48||512 345 678
    CZ|420||601 123 456
    SK|421|0|912 123 456
    HU|36|06|20 123 4567
    RO|40|0|712 034 567
    BG|359|0|87 123 4567|8
    GR|30||691 234 5678
    HR|385|0|92 123 4567|8
    SI|386|0|31 234 567
    RS|381|0|60 1234567|8
    UA|380|0|50 123 4567
    TR|90|0|501 234 56 78
    RU|7|8|(912) 345-67-89
    EE|372||5123 4567|7
    LV|371||21 234 567
    LT|370|8|612 34567
    MT|356||9696 1234
    CY|357||96 123456
    IL|972|0|50 234 5678
    AE|971|0|50 123 4567
    SA|966|0|51 234 5678
    QA|974||3312 3456
    EG|20|0|100 123 4567
    MA|212|0|650-123456
    DZ|213|0|551 23 45 67
    TN|216||20 123 456
    SN|221||70 123 45 67
    CI|225||01 23 45 6789
    NG|234|0|802 123 4567
    KE|254|0|712 123456
    ZA|27|0|71 123 4567
    IN|91|0|81234 56789
    PK|92|0|301 2345678
    BD|880|0|1812-345678
    CN|86|0|131 2345 6789
    HK|852||5123 4567
    TW|886|0|912 345 678
    JP|81|0|90-1234-5678
    KR|82|0|10-2345-6789
    SG|65||8123 4567
    MY|60|0|12-345 6789|9|10
    TH|66|0|81 234 5678
    VN|84|0|91 234 56 78
    PH|63|0|905 123 4567
    ID|62|0|812-345-678|9|12
    AU|61|0|412 345 678
    NZ|64|0|21 123 4567|8|10
    MX|52||222 123 4567
    BR|55||(11) 96123-4567|10
    AR|54|0|11 2345-6789|10|11
    CL|56||9 6123 4567
    CO|57||321 1234567
    PE|51||912 345 678
  `.trim().split('\n').map((line) => {
    const [iso, dial, trunk, example, min, max] = line.trim().split('|');
    const digits = example.replace(/\D/g, '');
    const most = +max || digits.length;
    return { iso, dial, trunk, pattern: example.replace(/\d/g, '#'), digits, min: +min || most, max: most };
  });
  const BY_ISO = new Map(COUNTRIES.map((country) => [country.iso, country]));
  // The short names people type for a few of them
  const ALIASES = { GB: 'uk', US: 'usa', AE: 'uae' };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The site's pace, --kz-motion-scale (set on :root, read on the instance): every duration of the
  // script times it, and 0 moves nothing, like reduced motion
  const paceOf = (el) => {
    const pace = parseFloat(getComputedStyle(el).getPropertyValue('--kz-motion-scale'));
    return pace >= 0 ? pace : 1;
  };
  const tick = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" pathLength="1"/></svg>';
  const chevron = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6.5 8 10.5l4-4"/></svg>';
  let uid = 0;

  // A national number grouped like the country's example; digits past the example run on
  // ungrouped, and the trunk prefix goes in front when it was typed ("06 12 34 56 78")
  const format = (digits, country, trunked) => {
    let out = '';
    let sep = '';
    let i = 0;
    for (const slot of country.pattern) {
      if (i >= digits.length) break;
      if (slot === '#') {
        out += sep + digits[i];
        sep = '';
        i += 1;
      } else sep += slot;
    }
    out += digits.slice(i);
    if (trunked) out = country.trunk + (out && country.trunk !== '0' ? ' ' : '') + out;
    return out;
  };
  // What counts in a phone number: its digits, and a "+" in front ("00" in front says the same)
  const clean = (text) => {
    let digits = text.replace(/[^\d+]/g, '');
    const plus = digits.startsWith('+');
    digits = digits.replace(/\+/g, '');
    if (!plus && digits.startsWith('00')) return `+${digits.slice(2)}`;
    return plus ? `+${digits}` : digits;
  };
  // Where the caret goes in a grouped number: right after its n-th digit (a "+" in front counts)
  const place = (value, n) => {
    if (n <= 0) return 0;
    let seen = 0;
    for (let i = 0; i < value.length; i += 1) {
      if (/\d/.test(value[i]) || (i === 0 && value[i] === '+')) seen += 1;
      if (seen === n) return i + 1;
    }
    return value.length;
  };

  // Text as it is searched: lower case, no accents, the typographic apostrophes as typed on a
  // keyboard. `at` gives, for each folded character, its place in the original text
  const fold = (value) => {
    let text = '';
    const at = [];
    let i = 0;
    for (const char of value) {
      const folded = char.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[‘’]/g, "'");
      for (let n = 0; n < folded.length; n += 1) at.push(i);
      text += folded;
      i += char.length;
    }
    at.push(value.length);
    return { text, at };
  };
  // Where the query starts a word ("kingdom" in "united kingdom"), or -1
  const wordAt = (text, query) => {
    for (let s = text.indexOf(query); s >= 0; s = text.indexOf(query, s + 1)) {
      if (!s || !/[\p{L}\p{N}]/u.test(text[s - 1])) return s;
    }
    return -1;
  };
  const fill = (words, values) => words.replace(/\{(\w+)\}/g, (all, key) => (key in values ? values[key] : all));
  // The matched letters, underlined (a slice of the original text, accents and all)
  const mark = (el, text, folded, start, length) => {
    if (start < 0 || !length) return el.replaceChildren(text);
    const from = folded.at[start];
    const to = Math.max(folded.at[start + length], folded.at[start + length - 1] + 1);
    const marked = document.createElement('mark');
    marked.textContent = text.slice(from, to);
    el.replaceChildren(text.slice(0, from), marked, text.slice(to));
  };

  // One instance. Everything it starts is tied to `signal`, so kodza:destroy stops it all
  function mount(root, signal) {
    const box = root.querySelector('.kodza-phone__box');
    const native = root.querySelector('.kodza-phone__native');
    const label = root.querySelector('.kodza-phone__label');
    const hint = root.querySelector('.kodza-phone__hint');
    const error = root.querySelector('.kodza-phone__error');
    if (!box || !native) return;
    const id = `kodza-phone-${++uid}`;
    const word = (key) => root.dataset[`text${key[0].toUpperCase()}${key.slice(1)}`] || WORDS[key];

    // Country names in the page's language; the first country guessed from the visitor's own
    const lang = root.dataset.locale || root.closest('[lang]')?.lang || navigator.language || 'en';
    let names = null;
    try {
      names = new Intl.DisplayNames([lang, 'en'], { type: 'region' });
    } catch {}
    const named = new Map();
    const nameOf = (country) => {
      if (!named.has(country)) {
        let name = country.iso;
        try {
          name = names?.of(country.iso) || name;
        } catch {}
        named.set(country, name);
      }
      return named.get(country);
    };
    const listed = (root.dataset.countries || '').split(',').map((iso) => BY_ISO.get(iso.trim().toUpperCase())).filter(Boolean);
    const collator = new Intl.Collator(lang);
    const allowed = listed.length ? [...new Set(listed)] : COUNTRIES.slice().sort((a, b) => collator.compare(nameOf(a), nameOf(b)));
    let region = '';
    try {
      region = new Intl.Locale(navigator.language || lang).maximize().region || '';
    } catch {}
    const first = [root.dataset.country, region].map((iso) => BY_ISO.get((iso || '').toUpperCase())).find((country) => allowed.includes(country)) || allowed[0];
    const fixed = allowed.length === 1;

    // The code in front of the number: a button that opens the list, or a plain label for one
    // country. Next to the box, not in it: a button inside a <label> is not valid HTML
    const code = document.createElement(fixed ? 'span' : 'button');
    code.className = 'kodza-phone__code';
    code.id = `${id}-code`;
    const faces = document.createElement('span');
    faces.className = 'kodza-phone__faces';
    code.append(faces);
    if (fixed) code.classList.add('is-fixed');
    else {
      code.type = 'button';
      code.setAttribute('aria-haspopup', 'listbox');
      code.setAttribute('aria-expanded', 'false');
      code.setAttribute('aria-controls', `${id}-list`);
      code.insertAdjacentHTML('beforeend', chevron);
    }
    box.before(code);

    // The number line: a hairline after the code, the tel input, and under it the rest of an
    // example number in grey (the typed part kept invisible, so the rest lines up)
    const sep = document.createElement('span');
    sep.className = 'kodza-phone__sep';
    sep.setAttribute('aria-hidden', 'true');
    const field = document.createElement('span');
    field.className = 'kodza-phone__field';
    const example = document.createElement('span');
    example.className = 'kodza-phone__example';
    example.setAttribute('aria-hidden', 'true');
    const typed = document.createElement('span');
    typed.className = 'kodza-phone__typed';
    const rest = document.createTextNode('');
    example.append(typed, rest);
    native.before(sep, field);
    field.append(native, example);
    box.insertAdjacentHTML('beforeend', `<svg class="kodza-phone__done" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" pathLength="1"/></svg>`);
    if (label) {
      label.id = `${id}-label`;
      native.setAttribute('aria-labelledby', `${id}-label ${id}-code`);
    }
    const described = [];
    if (hint) described.push((hint.id = `${id}-hint`));
    if (error) described.push((error.id = `${id}-error`));
    if (described.length) native.setAttribute('aria-describedby', described.join(' '));

    // The form gets the whole number from a hidden input that takes the field's name
    let hidden = null;
    if (native.name) {
      hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = native.name;
      native.removeAttribute('name');
      root.append(hidden);
    }
    const live = document.createElement('span');
    live.className = 'kodza-phone__live';
    live.setAttribute('aria-live', 'polite');
    root.append(live);

    // The list: a search on top, one row per country (put in the page only when there is a choice)
    const pop = document.createElement('div');
    pop.className = 'kodza-phone__pop';
    const find = document.createElement('div');
    find.className = 'kodza-phone__find';
    const search = document.createElement('input');
    search.className = 'kodza-phone__search';
    search.type = 'text';
    search.autocomplete = 'off';
    search.spellcheck = false;
    search.placeholder = word('search');
    search.setAttribute('aria-label', word('search'));
    search.setAttribute('role', 'combobox');
    search.setAttribute('aria-autocomplete', 'list');
    search.setAttribute('aria-expanded', 'false');
    search.setAttribute('aria-controls', `${id}-list`);
    find.append(search);
    const list = document.createElement('ul');
    list.className = 'kodza-phone__list';
    list.id = `${id}-list`;
    list.tabIndex = -1;
    list.setAttribute('role', 'listbox');
    if (label) list.setAttribute('aria-labelledby', `${id}-label`);
    const highlight = document.createElement('li');
    highlight.className = 'kodza-phone__highlight';
    highlight.setAttribute('role', 'presentation');
    const empty = document.createElement('li');
    empty.className = 'kodza-phone__empty';
    empty.setAttribute('role', 'presentation');
    empty.hidden = true;
    empty.textContent = word('empty');
    list.append(highlight, empty);
    const rows = allowed.map((country, order) => {
      const item = document.createElement('li');
      item.className = 'kodza-phone__option';
      item.id = `${id}-option-${order}`;
      item.setAttribute('role', 'option');
      item.innerHTML = tick;
      const abbr = document.createElement('span');
      abbr.className = 'kodza-phone__abbr';
      abbr.setAttribute('aria-hidden', 'true');
      const name = document.createElement('span');
      name.className = 'kodza-phone__name';
      const meta = document.createElement('span');
      meta.className = 'kodza-phone__meta';
      item.append(abbr, name, meta);
      list.insertBefore(item, empty);
      const text = nameOf(country);
      return { country, item, abbr, name, meta, order, text, folded: fold(text), dialed: fold(`+${country.dial}`), iso: fold(country.iso) };
    });
    const entries = new Map(rows.map((entry) => [entry.item, entry]));
    pop.append(find, list);
    if (!fixed) code.after(pop);

    const isOpen = () => root.classList.contains('is-open');
    let active = null;
    let hits = []; // the rows the search matches, best first, in the order of the list

    // The list for a search: digits look for a code (+44, 35…), letters for a name or an ISO
    // code; the best come first, the rest hide. The list changes height smoothly while open
    let resize = null;
    let announced = 0;
    const render = (query, speak = true) => {
      const raw = query.trim().replace(/^\+$/, '');
      const digits = /^\+?[\d\s]+$/.test(raw) ? raw.replace(/\D/g, '') : '';
      const q = fold(raw).text;
      const still = reduceMotion || !paceOf(root);
      const from = isOpen() && !still ? list.offsetHeight : 0;
      resize?.cancel();
      const found = [];
      rows.forEach((entry) => {
        const { country, text, folded } = entry;
        let rank = -1;
        let inName = -1;
        let inIso = -1;
        let inDial = -1;
        if (!raw) rank = 0;
        else if (digits) {
          if (country.dial === digits) [rank, inDial] = [0, 1];
          else if (country.dial.startsWith(digits)) [rank, inDial] = [1, 1];
        } else if (q === entry.iso.text) [rank, inIso] = [0, 0];
        else if (q === ALIASES[country.iso]) rank = 0;
        else if (folded.text.startsWith(q)) [rank, inName] = [1, 0];
        else if ((inName = wordAt(folded.text, q)) >= 0) rank = 2;
        else if ((inName = folded.text.indexOf(q)) >= 0) rank = 3;
        mark(entry.name, text, folded, inName, q.length);
        mark(entry.abbr, country.iso, entry.iso, inIso, country.iso.length);
        mark(entry.meta, `+${country.dial}`, entry.dialed, inDial, digits.length);
        entry.item.hidden = rank < 0;
        if (rank >= 0) found.push({ entry, rank });
      });
      found.sort((a, b) => a.rank - b.rank || a.entry.order - b.entry.order);
      hits = found.map(({ entry }) => entry);
      hits.forEach(({ item }) => list.insertBefore(item, empty));
      rows.forEach(({ item }) => item.hidden && list.insertBefore(item, empty));
      empty.hidden = hits.length > 0;
      list.scrollTop = 0;
      if (from) {
        const to = list.offsetHeight;
        if (Math.abs(to - from) > 0.5) {
          list.style.overflowY = 'hidden';
          resize = list.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: RESIZE * paceOf(root), easing: ease });
          const done = () => {
            list.style.overflowY = '';
            resize = null;
          };
          resize.onfinish = done;
          resize.oncancel = done;
        }
      }
      // Read out how many are left, once the typing pauses
      clearTimeout(announced);
      const count = hits.length;
      if (speak) announced = setTimeout(() => {
        live.textContent = !count ? word('empty') : count === 1 ? word('one') : fill(word('count'), { count });
      }, ANNOUNCE);
      return hits[0] || null;
    };

    const light = (entry, scroll = true) => {
      active = entry;
      if (!entry) {
        search.removeAttribute('aria-activedescendant');
        return list.style.setProperty('--kz-hl-on', 0);
      }
      search.setAttribute('aria-activedescendant', entry.item.id);
      list.style.setProperty('--kz-hl-y', `${entry.item.offsetTop}px`);
      list.style.setProperty('--kz-hl-h', `${entry.item.offsetHeight}px`);
      list.style.setProperty('--kz-hl-on', 1);
      // Scroll the list only (scrollIntoView would also nudge the page), with the list's own
      // padding above the very first row
      if (scroll) {
        const top = entry === hits[0] ? 0 : entry.item.offsetTop;
        const bottom = entry.item.offsetTop + entry.item.offsetHeight;
        if (top < list.scrollTop) list.scrollTop = top;
        else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
      }
    };

    // The state of the number: its country, its digits after the trunk prefix, and whether it is
    // still a "+" no country claims (intl)
    let country = null;
    let national = '';
    let trunked = false;
    let intl = false;
    let dialed = false; // the code came from the field ("+33"): the example leaves the trunk out
    let complete = false;
    let prev = '';

    // The code rolls to a new country: the old face goes up, the new one comes from below, and
    // the button eases to its new width (the number line follows its edge)
    let face = null;
    let rolls = [];
    let sized = '';
    const size = (animate) => {
      if (!root.offsetWidth || !face) return; // not rendered yet: the ResizeObserver comes back
      const scale = root.getBoundingClientRect().width / root.offsetWidth || 1; // a parent scaled by transform
      const width = Math.ceil(face.getBoundingClientRect().width / scale - 0.01);
      const extra = Math.round((code.getBoundingClientRect().width - faces.getBoundingClientRect().width) / scale);
      const start = code.offsetLeft + extra + width;
      if (sized === `${width} ${start}`) return;
      sized = `${width} ${start}`;
      const parts = [faces, sep, field];
      const still = !animate || reduceMotion || !paceOf(root);
      if (still) parts.forEach((el) => (el.style.transition = 'none'));
      root.style.setProperty('--kz-phone-face', `${width}px`);
      root.style.setProperty('--kz-phone-start', `${start}px`);
      if (still) {
        void root.offsetWidth;
        parts.forEach((el) => (el.style.transition = ''));
      }
    };
    const setCountry = (next, roll) => {
      if (next === country) return;
      country = next;
      const old = face;
      face = document.createElement('span');
      face.className = 'kodza-phone__face';
      const iso = document.createElement('span');
      iso.className = 'kodza-phone__iso';
      iso.textContent = next.iso;
      face.append(iso, `+${next.dial}`);
      rolls.forEach((animation) => animation.cancel());
      rolls = [];
      [...faces.children].forEach((el) => el !== old && el.remove());
      faces.append(face);
      if (!fixed) code.setAttribute('aria-label', fill(word('code'), { country: nameOf(next), dial: next.dial }));
      rows.forEach(({ country: c, item }) => item.setAttribute('aria-selected', String(c === next)));
      const pace = paceOf(root);
      if (old && (!roll || reduceMotion || !pace)) old.remove();
      else if (old) {
        const timing = { duration: ROLL * pace, easing: ease };
        const out = old.animate([{ transform: 'none' }, { transform: 'translateY(-110%)' }], { ...timing, fill: 'forwards' });
        out.onfinish = () => old.remove();
        rolls = [out, face.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], timing)];
      }
      size(roll);
    };

    // The country a number dialled from abroad belongs to: the allowed one whose code opens the
    // digits. The country already shown wins a shared code (+1: US or Canada)
    const detect = (digits) => {
      for (let n = 1; n <= 3 && n <= digits.length; n += 1) {
        const found = allowed.filter(({ dial }) => dial === digits.slice(0, n));
        if (found.length) return found.includes(country) ? country : found[0];
      }
      return null;
    };

    // Reads the digits of the field into a country and a national number, and returns them
    // grouped (end: the caret goes to the end). `how` is how they came: typed (one digit too
    // many does nothing, null), pasted or filled in (cut to length), deleted
    const take = (text, how, quiet = false) => {
      if (text.startsWith('+')) {
        const digits = text.slice(1);
        const found = detect(digits);
        if (!found) {
          [intl, trunked, national] = [true, false, ''];
          return { shown: `+${digits.slice(0, LONGEST)}` };
        }
        let number = digits.slice(found.dial.length);
        // "+33 (0)6…": a trunk prefix written anyway, seen by the extra digit it adds
        if (found.trunk && number.startsWith(found.trunk) && number.length > found.max) number = number.slice(found.trunk.length);
        [intl, trunked, national, dialed] = [false, false, number.slice(0, found.max), true];
        setCountry(found, !quiet);
        if (!quiet) live.textContent = fill(word('detected'), { country: nameOf(found), dial: found.dial });
        return { shown: format(national, found, false), end: true };
      }
      const hasTrunk = !!country.trunk && text.startsWith(country.trunk);
      let number = hasTrunk ? text.slice(country.trunk.length) : text;
      if (number.length > country.max) {
        if (how === 'type' && number.length > national.length) return null;
        if (how === 'paste') number = number.slice(0, country.max);
      }
      [intl, trunked, national] = [false, hasTrunk, number];
      return { shown: format(number, country, hasTrunk) };
    };

    const show = (value, n = -1) => {
      if (native.value !== value) native.value = value;
      prev = value;
      if (document.activeElement !== native) return;
      const at = n < 0 ? value.length : place(value, n);
      native.setSelectionRange(at, at);
    };

    // What the browser checks: a "+" no country here claims, too few digits, too many
    const problem = () => {
      if (intl) {
        const digits = native.value.slice(1);
        if (!digits) return native.required ? word('required') : '';
        const known = COUNTRIES.find(({ dial }) => digits.startsWith(dial));
        return fill(word('unknown'), { dial: known ? known.dial : digits.slice(0, 3) });
      }
      const values = { country: nameOf(country) };
      if (!national) return trunked ? fill(word('short'), { ...values, left: country.min }) : '';
      const left = country.min - national.length;
      if (left > 0) return fill(word(left === 1 ? 'shortOne' : 'short'), { ...values, left });
      const extra = national.length - country.max;
      if (extra > 0) return fill(word(extra === 1 ? 'longOne' : 'long'), { ...values, extra });
      return '';
    };

    // The rest of the example, in grey after what is typed, while the field has the focus and
    // the number is not whole yet. An empty field shows a trunk 0, the way people write it at home
    const hintNow = () => {
      const on = document.activeElement === native && !intl && !complete;
      if (on) {
        const withTrunk = native.value ? trunked : /^0/.test(country.trunk) && !dialed;
        typed.textContent = native.value;
        rest.data = format(country.digits, country, withTrunk).slice(native.value.length);
      }
      root.classList.toggle('is-hinting', on && !!rest.data && native.scrollWidth <= native.clientWidth);
    };

    // After any change: what the form gets, what the browser checks, the tick, the example
    const update = () => {
      if (hidden) hidden.value = !intl && national ? `+${country.dial}${national}` : '';
      complete = !intl && national.length >= country.min && national.length <= country.max;
      root.classList.toggle('is-complete', complete);
      native.setCustomValidity(problem());
      hintNow();
    };
    const load = (value) => {
      show(take(clean(value), 'paste', true).shown);
      update();
    };

    // Hint and error share the line under the field
    const say = (text) => {
      if (!error) return;
      error.textContent = text;
      root.classList.add('is-invalid');
      native.setAttribute('aria-invalid', 'true');
    };
    const clearError = () => {
      root.classList.remove('is-invalid');
      native.removeAttribute('aria-invalid');
    };

    const toNumber = () => {
      native.focus({ preventScroll: true });
      const end = native.value.length;
      native.setSelectionRange(end, end);
    };

    const open = () => {
      if (fixed || isOpen() || native.matches(':disabled')) return;
      search.value = '';
      render('', false);
      // Not enough room below and more above: the list opens upwards. A closed list that changes
      // side gets there at once, so it always unrolls from the field
      const rect = box.getBoundingClientRect();
      const above = rect.bottom + pop.offsetHeight + 16 > innerHeight && rect.top > innerHeight / 2;
      if (above !== root.classList.contains('is-above')) {
        pop.style.transition = 'none';
        root.classList.toggle('is-above', above);
        void pop.offsetWidth;
        pop.style.transition = '';
      }
      // Lit and centred on the current country; measuring settles the highlight there before the
      // open list starts animating it
      const current = rows.find((entry) => entry.country === country);
      light(current, false);
      if (current) list.scrollTop = current.item.offsetTop - (list.clientHeight - current.item.offsetHeight) / 2;
      root.classList.add('is-open');
      code.setAttribute('aria-expanded', 'true');
      search.setAttribute('aria-expanded', 'true');
      search.focus({ preventScroll: true });
    };

    const close = (back) => {
      resize?.cancel();
      clearTimeout(announced);
      if (!isOpen()) return;
      root.classList.remove('is-open');
      code.setAttribute('aria-expanded', 'false');
      search.setAttribute('aria-expanded', 'false');
      search.removeAttribute('aria-activedescendant');
      back?.focus({ preventScroll: true });
    };

    // A country from the list: the number keeps its digits, grouped the new way (the trunk
    // prefix belonged to the old country, a "+" in progress goes)
    const pick = (entry, focus = true) => {
      if (!entry) return;
      close();
      if (entry.country !== country || intl) {
        const before = hidden?.value;
        if (intl) national = '';
        // A trunk 0 typed for France still reads as one in Germany
        const keep = !intl && trunked && entry.country.trunk === country.trunk;
        [intl, trunked, dialed] = [false, keep, false];
        setCountry(entry.country, true);
        clearError();
        show(format(national, country, trunked));
        update();
        if (hidden && hidden.value !== before) hidden.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (focus) toNumber();
    };

    // Typing: the digits are read again and grouped, the caret kept after the same digit
    native.addEventListener('input', (event) => {
      const raw = native.value;
      const type = event.inputType || '';
      let text = clean(raw);
      let n = clean(raw.slice(0, native.selectionStart ?? raw.length)).length;
      // Only a space or a dash went: the digit behind it goes with it
      if (type.startsWith('deleteContent') && text && text === clean(prev)) {
        const at = type === 'deleteContentBackward' ? n - 1 : n;
        if (at >= 0 && at < text.length) {
          text = text.slice(0, at) + text.slice(at + 1);
          n = at;
        }
      }
      const how = type === 'insertText' ? 'type' : type.startsWith('delete') ? 'delete' : 'paste';
      const result = take(text, how);
      clearError();
      if (!result) return show(prev, n - 1);
      if (!text) dialed = false;
      show(result.shown, result.end ? -1 : n);
      update();
    }, { signal });
    native.addEventListener('focus', hintNow, { signal });
    native.addEventListener('blur', hintNow, { signal });
    // Set from a script: read again
    native.addEventListener('change', () => native.value !== prev && load(native.value), { signal });

    // Leaving the field says what is wrong with the number; "required" waits for the form
    root.addEventListener('focusout', (event) => {
      if (root.contains(event.relatedTarget) || document.activeElement === event.target) return;
      if (native.value && native.validationMessage) say(native.validationMessage);
    }, { signal });
    native.addEventListener('invalid', (event) => {
      event.preventDefault();
      say(native.validity.customError ? native.validationMessage : word('required'));
      const firstInvalid = native.form && [...native.form.elements].find((el) => el.willValidate && !el.validity.valid);
      if (!native.form || firstInvalid === native) native.focus();
    }, { signal });

    // The code button: a click opens the list (or closes it, back to the number), the keys too
    code.addEventListener('mousedown', (event) => isOpen() && event.preventDefault(), { signal });
    code.addEventListener('click', () => {
      if (!isOpen()) return open();
      close();
      toNumber();
    }, { signal });
    code.addEventListener('keydown', (event) => {
      if (![' ', 'Enter', 'ArrowDown', 'ArrowUp'].includes(event.key)) return;
      event.preventDefault();
      open();
    }, { signal });

    search.addEventListener('input', () => light(render(search.value)), { signal });
    search.addEventListener('keydown', (event) => {
      if (event.isComposing) return;
      const moves = { ArrowDown: 1, ArrowUp: -1, PageDown: PAGE, PageUp: -PAGE };
      if (event.key in moves) {
        event.preventDefault();
        if (!hits.length) return;
        const index = hits.indexOf(active);
        const step = moves[event.key];
        const next = index < 0 ? (step > 0 ? 0 : hits.length - 1) : Math.max(0, Math.min(hits.length - 1, index + step));
        light(hits[next]);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        pick(active);
      } else if (event.key === 'Tab' && active) {
        pick(active, false);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        close(code);
      }
    }, { signal });
    search.addEventListener('blur', (event) => {
      if (document.activeElement === search) return; // the window lost the focus, not the search
      if (!pop.contains(event.relatedTarget)) close();
    }, { signal });

    const entryAt = (event) => entries.get(event.target.closest?.('.kodza-phone__option'));
    list.addEventListener('pointermove', (event) => {
      const entry = entryAt(event);
      if (entry && active !== entry) light(entry, false);
    }, { signal });
    list.addEventListener('click', (event) => pick(entryAt(event)), { signal });
    // A click in the list keeps the focus in the search
    pop.addEventListener('mousedown', (event) => event.target !== search && event.preventDefault(), { signal });

    native.form?.addEventListener('reset', () => setTimeout(() => {
      if (signal.aborted) return;
      clearError();
      [national, trunked, intl, dialed] = ['', false, false, false];
      setCountry(first, false);
      load(native.value);
    }), { signal });

    // Disabled or required by the page: the code and the check follow
    const sync = () => {
      const off = native.matches(':disabled');
      if (!fixed) code.disabled = off;
      root.classList.toggle('is-disabled', off);
      if (off) close();
      update();
    };
    const observer = new MutationObserver(sync);
    observer.observe(native, { attributes: true, attributeFilter: ['disabled', 'required'] });
    // Measured again once shown (a closed tab, a modal) and once the fonts are in
    const watch = new ResizeObserver(() => size(false));
    watch.observe(root);
    document.fonts?.addEventListener('loadingdone', () => size(false), { signal });
    signal.addEventListener('abort', () => {
      observer.disconnect();
      watch.disconnect();
      clearTimeout(announced);
      resize?.cancel();
      rolls.forEach((animation) => animation.cancel());
    });

    // The value as written: "+44 7700 900123" picks its country at once
    setCountry(first, false);
    render('', false);
    load(native.value);
    sync();
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
