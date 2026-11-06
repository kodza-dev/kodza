# Time Picker

[![Time Picker, live on kodza.dev](https://kodza.dev/anim/time-picker/og.jpg)](https://kodza.dev/components/time-picker/)

A time field over the real input: a wheel that snaps and takes the time once it stops, or the free slots of a day.

**[Live demo](https://kodza.dev/components/time-picker/)** · Forms · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-time-picker.html`](kodza-time-picker.html) | 0.4 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-time-picker.css`](kodza-time-picker.css) | 22.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-time-picker.js`](kodza-time-picker.js) | 33.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-time-picker.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-time-picker.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/time-picker/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Time Picker to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-time` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-time-bg` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-time-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-time-muted` | `color-mix(in srgb, var(--kz-time-fg) 60%, transparent)` |  |
| `--kz-time-line` | `color-mix(in srgb, var(--kz-time-fg) 14%, transparent)` |  |
| `--kz-time-line-hover` | `color-mix(in srgb, var(--kz-time-fg) 30%, transparent)` |  |
| `--kz-time-soft` | `color-mix(in srgb, var(--kz-time-fg) 6%, transparent)` |  |
| `--kz-time-ink` | `var(--kz-color-accent, var(--kz-time-fg))` |  |
| `--kz-time-on-ink` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-time-shadow` | `0 18px 40px -16px rgba(10, 10, 10, 0.3)` |  |
| `--kz-time-height` | `56px` |  |
| `--kz-time-radius` | `calc(12px * var(--kz-radius-scale, 1))` |  |
| `--kz-time-pad` | `16px` |  |
| `--kz-time-row` | `36px` |  |
| `--kz-time-col` | `64px` |  |
| `--kz-time-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-time-width` | `var(--kz-field-width, 320px)` |  |

- Modifiers: `.kodza-time--slots`
- Attributes: `data-clock`, `data-index`, `data-locale` (e.g. `en-GB`, `en-US`), `data-shape`, `data-taken` (e.g. `10:00 11:30 12:30`), `data-time`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-time {
    --kz-time-bg: #161616;
    --kz-time-fg: #f2f2f0;
    --kz-time-muted: rgba(242, 242, 240, 0.62);
    --kz-time-line: rgba(255, 255, 255, 0.14);
    --kz-time-line-hover: rgba(255, 255, 255, 0.3);
    --kz-time-soft: rgba(255, 255, 255, 0.08);
    --kz-time-ink: #f2f2f0;
    --kz-time-on-ink: #0a0a0a;
    --kz-time-shadow: 0 18px 40px -16px rgba(0, 0, 0, 0.8);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a column of the wheel | `ArrowUp` / `ArrowDown` | Turns the column by one line |
|  | `PageUp` / `PageDown` | Turns it by five lines |
|  | `Home` / `End` | Goes to the first or the last line allowed |
|  | `ArrowLeft` / `ArrowRight` | Moves to the next column |
|  | `Enter` / `Space` | Takes the time and closes the panel |
| On a slot | `ArrowLeft` / `ArrowRight` | Moves to the previous or next free slot |
|  | `ArrowUp` / `ArrowDown` | Moves to the free slot above or below |
|  | `Home` / `End` | Goes to the first or the last free slot |
|  | `Enter` / `Space` | Takes the slot and closes the panel |
| On the field | `Enter` / `Space` | Opens the panel on the chosen time |
| Anywhere, while it's open | `Escape` | Closes it, focus back on the field |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
