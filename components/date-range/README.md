# Date Range

[![Date Range, live on kodza.dev](https://kodza.dev/anim/date-range/og.jpg)](https://kodza.dev/components/date-range/)

Two real date inputs behind one field and a two-month calendar: the ink band follows the pointer from the start to the end, the length counted as it goes, with optional shortcuts. Full keyboard.

**[Live demo](https://kodza.dev/components/date-range/)** · Forms · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-date-range.html`](kodza-date-range.html) | 1.0 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-date-range.css`](kodza-date-range.css) | 29.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-date-range.js`](kodza-date-range.js) | 32.6 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-date-range.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-date-range.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/date-range/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Date Range to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-date-range` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-date-range-bg` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-date-range-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-date-range-muted` | `color-mix(in srgb, var(--kz-date-range-fg) 60%, transparent)` |  |
| `--kz-date-range-line` | `color-mix(in srgb, var(--kz-date-range-fg) 14%, transparent)` |  |
| `--kz-date-range-line-hover` | `color-mix(in srgb, var(--kz-date-range-fg) 30%, transparent)` |  |
| `--kz-date-range-soft` | `color-mix(in srgb, var(--kz-date-range-fg) 6%, transparent)` |  |
| `--kz-date-range-band` | `color-mix(in srgb, var(--kz-date-range-fg) 7%, transparent)` |  |
| `--kz-date-range-ink` | `var(--kz-color-accent, var(--kz-date-range-fg))` |  |
| `--kz-date-range-on-ink` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-date-range-shadow` | `0 18px 40px -16px rgba(10, 10, 10, 0.3)` |  |
| `--kz-date-range-height` | `56px` |  |
| `--kz-date-range-radius` | `calc(12px * var(--kz-radius-scale, 1))` |  |
| `--kz-date-range-pad` | `16px` |  |
| `--kz-date-range-cell` | `38px` |  |
| `--kz-date-range-gap` | `24px` | between the two months |
| `--kz-date-range-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-date-range-width` | `var(--kz-field-width, 360px)` |  |

- Attributes: `data-date`, `data-locale` (e.g. `en-GB`, `en-US`), `data-months`, `data-preset`, `data-presets` (e.g. `last-7 last-30 this-month last-month`), `data-step` (e.g. `-1`, `1`), `data-unit` (e.g. `night`), `data-week-start`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-date-range {
    --kz-date-range-bg: #161616;
    --kz-date-range-fg: #f2f2f0;
    --kz-date-range-muted: rgba(242, 242, 240, 0.62);
    --kz-date-range-line: rgba(255, 255, 255, 0.14);
    --kz-date-range-line-hover: rgba(255, 255, 255, 0.3);
    --kz-date-range-soft: rgba(255, 255, 255, 0.08);
    --kz-date-range-band: rgba(255, 255, 255, 0.09);
    --kz-date-range-ink: #f2f2f0;
    --kz-date-range-on-ink: #0a0a0a;
    --kz-date-range-shadow: 0 18px 40px -16px rgba(0, 0, 0, 0.8);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a day of the calendar | `ArrowLeft` / `ArrowRight` | Previous or next day |
|  | `ArrowUp` / `ArrowDown` | Previous or next week |
|  | `Home` / `End` | First or last day of the week |
|  | `PageUp` / `PageDown` | Previous or next month |
|  | `Enter` / `Space` | Picks the start, then the end, and closes |
| On the field | `Enter` / `Space` | Opens the calendar on that date |
| Anywhere, while it's open | `Escape` | Closes it, focus back on the field |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
