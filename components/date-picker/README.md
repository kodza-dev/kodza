# Date Picker

[![Date Picker, live on kodza.dev](https://kodza.dev/anim/date-picker/og.jpg)](https://kodza.dev/components/date-picker/)

A real date input with a calendar: months slide the way you go, the month name rolls, and the ink mark travels to the day you pick. Full keyboard.

**[Live demo](https://kodza.dev/components/date-picker/)** · Forms · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-date-picker.html`](kodza-date-picker.html) | 0.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-date-picker.css`](kodza-date-picker.css) | 17.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-date-picker.js`](kodza-date-picker.js) | 17.0 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-date-picker.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-date-picker.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/date-picker/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Use the Kodza Date Picker for the booking date in my form.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-date` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-date-bg` | `#ffffff` |  |
| `--kz-date-fg` | `#0a0a0a` |  |
| `--kz-date-muted` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-date-line` | `rgba(10, 10, 10, 0.14)` |  |
| `--kz-date-line-hover` | `rgba(10, 10, 10, 0.3)` |  |
| `--kz-date-soft` | `rgba(10, 10, 10, 0.06)` |  |
| `--kz-date-ink` | `#0a0a0a` |  |
| `--kz-date-on-ink` | `#ffffff` |  |
| `--kz-date-shadow` | `0 18px 40px -16px rgba(10, 10, 10, 0.3)` |  |
| `--kz-date-height` | `56px` |  |
| `--kz-date-radius` | `12px` |  |
| `--kz-date-pad` | `16px` |  |
| `--kz-date-cell` | `38px` |  |
| `--kz-date-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-date`, `data-locale` (e.g. `en-GB`), `data-step`, `data-week-start`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-date {
    --kz-date-bg: #161616;
    --kz-date-fg: #f2f2f0;
    --kz-date-muted: rgba(242, 242, 240, 0.62);
    --kz-date-line: rgba(255, 255, 255, 0.14);
    --kz-date-line-hover: rgba(255, 255, 255, 0.3);
    --kz-date-soft: rgba(255, 255, 255, 0.08);
    --kz-date-ink: #f2f2f0;
    --kz-date-on-ink: #0a0a0a;
    --kz-date-shadow: 0 18px 40px -16px rgba(0, 0, 0, 0.8);
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
|  | `Enter` / `Space` | Picks the day, closes, focus back on the field |
| On the field | `Enter` / `Space` | Opens the calendar on the chosen day |
| Anywhere, while it's open | `Escape` | Closes it, focus back on the field |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
