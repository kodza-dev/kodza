# Callback Request

[![Callback Request, live on kodza.dev](https://kodza.dev/anim/callback-request/og.jpg)](https://kodza.dev/components/callback-request/)

A callback form: the next days drawn as lines of time from the opening hours, the past hatched, a window picked in ink, a phone number grouped as typed. Sent, the window flies into the reply.

**[Live demo](https://kodza.dev/components/callback-request/)** · Contact · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-callback-request.html`](kodza-callback-request.html) | 4.3 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-callback-request.css`](kodza-callback-request.css) | 51.5 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-callback-request.js`](kodza-callback-request.js) | 44.7 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-callback-request.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-callback-request.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/callback-request/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Callback Request to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-callback-request` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-callback-request-width` | `var(--kz-page-width, 1440px)` | widest the section gets |
| `--kz-callback-request-gap` | `64px` | between the title and the lead |
| `--kz-callback-request-side` | `132px` | the day's name, left of its line |
| `--kz-callback-request-track` | `52px` | the height of a day's line |
| `--kz-callback-request-field` | `var(--kz-color-paper, #ffffff)` | inside the fields and the windows |
| `--kz-callback-request-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-callback-request-muted` | `color-mix(in srgb, var(--kz-callback-request-fg) 62%, transparent)` |  |
| `--kz-callback-request-line` | `color-mix(in srgb, var(--kz-callback-request-fg) 10%, transparent)` |  |
| `--kz-callback-request-soft` | `color-mix(in srgb, var(--kz-callback-request-fg) 5%, transparent)` | a day's line |
| `--kz-callback-request-halo` | `color-mix(in srgb, var(--kz-callback-request-fg) 6%, transparent)` | around a focused field |
| `--kz-callback-request-ink` | `var(--kz-color-accent, var(--kz-callback-request-fg))` | the picked window, the send button |
| `--kz-callback-request-on-ink` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-callback-request-radius` | `calc(12px * var(--kz-radius-scale, 1))` | fields and a day's line |
| `--kz-callback-request-slot-radius` | `calc(8px * var(--kz-radius-scale, 1))` | a window |

- Attributes: `data-days` (e.g. `3`), `data-dial` (e.g. `+33`), `data-error` (e.g. `Pick a window. We ring inside it.`, `A full number: 10 digits, like 06 12 34 56 78.`), `data-format` (e.g. `## ## ## ## ##`), `data-hours` (e.g. `mon-fri 08:00-12:00, 14:00-18:00`), `data-length` (e.g. `120`), `data-notice` (e.g. `30`), `data-place` (e.g. `Le Havre`), `data-required`, `data-timezone` (e.g. `Europe/Paris`), `data-trunk` (e.g. `0`), `data-value` (e.g. `day`, `when`, `eta`, `phone`)
- Events: `kodza:submit`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-callback-request {
    --kz-callback-request-field: #161616;
    --kz-callback-request-fg: #f2f2f0;
    --kz-callback-request-muted: rgba(242, 242, 240, 0.62);
    --kz-callback-request-line: rgba(255, 255, 255, 0.12);
    --kz-callback-request-soft: rgba(255, 255, 255, 0.06);
    --kz-callback-request-halo: rgba(255, 255, 255, 0.08);
    --kz-callback-request-ink: #f2f2f0;
    --kz-callback-request-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a window | `ArrowLeft` / `ArrowRight` | Picks the previous or next free window, day after day |
|  | `ArrowUp` / `ArrowDown` | Goes to the day above or below, on the nearest free window |
| In a field | `Enter` | Sends the request, or shows what is missing |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
