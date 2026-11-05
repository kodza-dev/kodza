# Book a Visit

[![Book a Visit, live on kodza.dev](https://kodza.dev/anim/book-a-visit/og.jpg)](https://kodza.dev/components/book-a-visit/)

A booking form: the coming days, the free times worked out from the opening hours, name and email. On send it rolls up into the answer, with Add to calendar as an .ics file.

**[Live demo](https://kodza.dev/components/book-a-visit/)** · Forms · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-book-a-visit.html`](kodza-book-a-visit.html) | 2.6 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-book-a-visit.css`](kodza-book-a-visit.css) | 37.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-book-a-visit.js`](kodza-book-a-visit.js) | 37.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-book-a-visit.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-book-a-visit.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/book-a-visit/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Book a Visit to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-book-visit` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-book-visit-width` | `520px` |  |
| `--kz-book-visit-bg` | `#fff` |  |
| `--kz-book-visit-fg` | `#0a0a0a` |  |
| `--kz-book-visit-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-book-visit-off` | `rgba(10, 10, 10, 0.3)` | closed days, times gone or taken |
| `--kz-book-visit-line` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-book-visit-soft` | `rgba(10, 10, 10, 0.04)` | the row of days |
| `--kz-book-visit-hover` | `rgba(10, 10, 10, 0.05)` |  |
| `--kz-book-visit-halo` | `rgba(10, 10, 10, 0.06)` | around a field in focus |
| `--kz-book-visit-ink` | `#0a0a0a` | the pill, the mark, the button |
| `--kz-book-visit-on-ink` | `#fff` |  |
| `--kz-book-visit-duration` | `0.55s` | the slide of the pill. 0s = no motion |
| `--kz-book-visit-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-address` (e.g. `Carrer de la Roca 14, 07460 Pollença, Mallorca`), `data-days` (e.g. `7`), `data-done` (e.g. `Thank you, {name}.`), `data-hours` (e.g. `mon closed; tue-fri 10:00-14:00, 16:00-19:00; sat 10:00-14:00; sun closed`), `data-length` (e.g. `40`), `data-notice` (e.g. `60`), `data-place` (e.g. `Es Pinar`), `data-taken` (e.g. `tue 11:20, wed 16:40, thu 10:40, thu 16:00, fri 11:20, sat 10:00`), `data-timezone` (e.g. `Europe/Madrid`), `data-value` (e.g. `email`)
- Events: `kodza:submit`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-book-visit {
    --kz-book-visit-bg: #161616;
    --kz-book-visit-fg: #f2f2f0;
    --kz-book-visit-muted: rgba(242, 242, 240, 0.62);
    --kz-book-visit-off: rgba(242, 242, 240, 0.3);
    --kz-book-visit-line: rgba(255, 255, 255, 0.12);
    --kz-book-visit-soft: rgba(255, 255, 255, 0.05);
    --kz-book-visit-hover: rgba(255, 255, 255, 0.07);
    --kz-book-visit-halo: rgba(255, 255, 255, 0.08);
    --kz-book-visit-ink: #f2f2f0;
    --kz-book-visit-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a day | `ArrowLeft` / `ArrowRight` | Moves to the previous or next open day |
| On a time | `ArrowLeft` / `ArrowRight` | Moves to the previous or next free time |
|  | `ArrowUp` / `ArrowDown` | Moves a row up or down |
|  | `Home` / `End` | Goes to the first or last free time |
| In a field | `Enter` | Books the visit, or shows what is missing |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
