# Contact Router

[![Contact Router, live on kodza.dev](https://kodza.dev/anim/contact-router/og.jpg)](https://kodza.dev/components/contact-router/)

A contact section that asks what it is about first: Sales, Support, Press or Jobs. The fields become the ones that desk needs, the button names who reads it, Support links to help. Sent, it rolls into a receipt.

**[Live demo](https://kodza.dev/components/contact-router/)** · Contact · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-contact-router.html`](kodza-contact-router.html) | 11.6 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-contact-router.css`](kodza-contact-router.css) | 66.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-contact-router.js`](kodza-contact-router.js) | 26.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-contact-router.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-contact-router.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/contact-router/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Contact Router to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-contact-router` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-contact-router-width` | `var(--kz-page-width, 1440px)` | widest the section gets |
| `--kz-contact-router-gap` | `64px` | between the two columns |
| `--kz-contact-router-field` | `var(--kz-color-paper, #ffffff)` | inside the fields, and the cards |
| `--kz-contact-router-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-contact-router-muted` | `color-mix(in srgb, var(--kz-contact-router-fg) 62%, transparent)` |  |
| `--kz-contact-router-line` | `color-mix(in srgb, var(--kz-contact-router-fg) 10%, transparent)` |  |
| `--kz-contact-router-soft` | `color-mix(in srgb, var(--kz-contact-router-fg) 5%, transparent)` | a card under the pointer |
| `--kz-contact-router-halo` | `color-mix(in srgb, var(--kz-contact-router-fg) 6%, transparent)` | around a focused field |
| `--kz-contact-router-ink` | `var(--kz-color-accent, var(--kz-contact-router-fg))` | a picked card, the send button, focus rings |
| `--kz-contact-router-on-ink` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |

- Attributes: `data-action`, `data-desk` (e.g. `sales`, `support`, `press`, `jobs`), `data-error` (e.g. `Pick one, so it lands on the right desk.`, `Which publication? It tells us who to put on the phone.`), `data-failed`, `data-for` (e.g. `sales`, `press`, `jobs`, `support`), `data-message` (e.g. `What are you trying to fix?`, `What’s the story?`, `Why us, in three lines?`), `data-only`, `data-reply` (e.g. `Within four hours`, `The same day`, `Within a week`), `data-required`, `data-send`, `data-value` (e.g. `name`, `desk`, `reply`, `email`), `data-word` (e.g. `Send to sales`, `Send to press`, `Send to hiring`)
- Events: `kodza:submit`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-contact-router {
    --kz-contact-router-field: #161616;
    --kz-contact-router-fg: #f2f2f0;
    --kz-contact-router-muted: rgba(242, 242, 240, 0.62);
    --kz-contact-router-line: rgba(255, 255, 255, 0.12);
    --kz-contact-router-soft: rgba(255, 255, 255, 0.06);
    --kz-contact-router-halo: rgba(255, 255, 255, 0.08);
    --kz-contact-router-ink: #f2f2f0;
    --kz-contact-router-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a reason | `ArrowRight` / `ArrowDown` | Picks the next reason, and its fields come in |
|  | `ArrowLeft` / `ArrowUp` | Picks the previous reason, round and round |
| On a team size | `ArrowRight` / `ArrowDown` | Picks the next size |
|  | `ArrowLeft` / `ArrowUp` | Picks the previous size |
| In a field | `Enter` | Sends the message, or shows what is missing |
| In the message | `Cmd/Ctrl+Enter` | Sends the message (Enter makes a new line) |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
