# Quote Request

[![Quote Request, live on kodza.dev](https://kodza.dev/anim/quote-request/og.jpg)](https://kodza.dev/components/quote-request/)

A quote request form for a trade: the job on cards, a postcode checked against the service area as you type, photos dropped as thumbnails, a timing, then contact details. Sent, it folds into the receipt.

**[Live demo](https://kodza.dev/components/quote-request/)** · Contact · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-quote-request.html`](kodza-quote-request.html) | 13.6 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-quote-request.css`](kodza-quote-request.css) | 66.5 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-quote-request.js`](kodza-quote-request.js) | 30.1 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-quote-request.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-quote-request.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/quote-request/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Quote Request to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-quote-request` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-quote-request-width` | `var(--kz-page-width, 1440px)` | widest the section gets |
| `--kz-quote-request-gap` | `64px` | between a step's name and its answers |
| `--kz-quote-request-code-width` | `168px` | the postcode field |
| `--kz-quote-request-field` | `var(--kz-color-paper, #ffffff)` | inside the fields, the cards and the pills |
| `--kz-quote-request-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-quote-request-muted` | `color-mix(in srgb, var(--kz-quote-request-fg) 62%, transparent)` |  |
| `--kz-quote-request-line` | `color-mix(in srgb, var(--kz-quote-request-fg) 10%, transparent)` |  |
| `--kz-quote-request-soft` | `color-mix(in srgb, var(--kz-quote-request-fg) 5%, transparent)` | a card under the pointer, the drop zone |
| `--kz-quote-request-halo` | `color-mix(in srgb, var(--kz-quote-request-fg) 6%, transparent)` | around a focused field |
| `--kz-quote-request-ink` | `var(--kz-color-accent, var(--kz-quote-request-fg))` | a picked card or pill, the ticks, the send button |
| `--kz-quote-request-on-ink` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-quote-request-radius` | `calc(12px * var(--kz-radius-scale, 1))` | fields and drop zone |
| `--kz-quote-request-indent` | `calc((100% - var(--kz-quote-request-gap)) * 4 / 11 + var(--kz-quote-request-gap))` |  |

- Attributes: `data-area` (e.g. `76000 76100 76130 76230 76240 76300 76380 76500 76520 76800`), `data-error` (e.g. `Pick the closest one. We sort out the details on site.`, `A five-digit postcode, so we know if we come to you.`, `Your name, so we know who to write to.`, `An email we can send the quote to.`), `data-failed`, `data-max` (e.g. `6`), `data-max-mb` (e.g. `10`), `data-place` (e.g. `Rouen`), `data-required`, `data-row` (e.g. `job`, `where`, `photos`, `when`, `you`), `data-send`, `data-step` (e.g. `job`, `where`, `photos`, `when`, `you`), `data-value` (e.g. `name`, `job`, `where`, `photos`, `when`, `you`)
- Events: `kodza:submit`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-quote-request {
    --kz-quote-request-field: #161616;
    --kz-quote-request-fg: #f2f2f0;
    --kz-quote-request-muted: rgba(242, 242, 240, 0.62);
    --kz-quote-request-line: rgba(255, 255, 255, 0.12);
    --kz-quote-request-soft: rgba(255, 255, 255, 0.06);
    --kz-quote-request-halo: rgba(255, 255, 255, 0.08);
    --kz-quote-request-ink: #f2f2f0;
    --kz-quote-request-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a job card | `ArrowRight` / `ArrowDown` | Picks the next job, round and round |
|  | `ArrowLeft` / `ArrowUp` | Picks the previous job, round and round |
| On a timing | `ArrowRight` / `ArrowDown` | Picks the next timing, round and round |
|  | `ArrowLeft` / `ArrowUp` | Picks the previous timing, round and round |
| On the drop zone | `Space` | Opens the picker for photos |
| On a photo | `Enter` / `Space` | Takes the photo out, the focus moves to the next one |
| In a field | `Enter` | Sends the request, or shows what is missing |
| In the message | `Cmd/Ctrl+Enter` | Sends the request (Enter makes a new line) |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
