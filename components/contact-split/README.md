# Contact Split

[![Contact Split, live on kodza.dev](https://kodza.dev/anim/contact-split/og.jpg)](https://kodza.dev/components/contact-split/)

A contact section: the email to copy, phone, address and a status worked out from the opening hours; a short form that rolls into the thanks. A variant for a place shows the week of hours.

**[Live demo](https://kodza.dev/components/contact-split/)** · Contact · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-contact-split.html`](kodza-contact-split.html) | 5.0 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-contact-split.css`](kodza-contact-split.css) | 51.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-contact-split.js`](kodza-contact-split.js) | 23.7 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-contact-split.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-contact-split.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/contact-split/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Contact Split to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-contact-split` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-contact-split-width` | `var(--kz-page-width, 1440px)` | widest the section gets |
| `--kz-contact-split-gap` | `64px` | between the two columns |
| `--kz-contact-split-field` | `var(--kz-color-paper, #ffffff)` | inside the fields |
| `--kz-contact-split-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-contact-split-muted` | `color-mix(in srgb, var(--kz-contact-split-fg) 62%, transparent)` |  |
| `--kz-contact-split-line` | `color-mix(in srgb, var(--kz-contact-split-fg) 10%, transparent)` |  |
| `--kz-contact-split-soft` | `color-mix(in srgb, var(--kz-contact-split-fg) 5%, transparent)` | today's row in the week |
| `--kz-contact-split-halo` | `color-mix(in srgb, var(--kz-contact-split-fg) 6%, transparent)` | around a focused field |
| `--kz-contact-split-ink` | `var(--kz-color-accent, var(--kz-contact-split-fg))` | the send button, focus rings |
| `--kz-contact-split-on-ink` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |

- Modifiers: `.kodza-contact-split--venue`
- Attributes: `data-copy` (e.g. `hello@halyard.example`), `data-failed`, `data-hours` (e.g. `mon-fri 09:00-18:00`), `data-reply` (e.g. `2 h`), `data-send`, `data-text` (e.g. `{time} in Bordeaux`, `Thanks, {name}.`), `data-timezone` (e.g. `Europe/Paris`), `data-value` (e.g. `email`)
- Events: `kodza:submit`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-contact-split {
    --kz-contact-split-field: #161616;
    --kz-contact-split-fg: #f2f2f0;
    --kz-contact-split-muted: rgba(242, 242, 240, 0.62);
    --kz-contact-split-line: rgba(255, 255, 255, 0.12);
    --kz-contact-split-soft: rgba(255, 255, 255, 0.09);
    --kz-contact-split-halo: rgba(255, 255, 255, 0.08);
    --kz-contact-split-ink: #f2f2f0;
    --kz-contact-split-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| In a field | `Enter` | Sends the message, or shows what is missing |
| In the message | `Cmd/Ctrl+Enter` | Sends the message (Enter makes a new line) |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
