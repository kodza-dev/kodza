# Contact Brief

[![Contact Brief, live on kodza.dev](https://kodza.dev/anim/contact-brief/og.jpg)](https://kodza.dev/components/contact-brief/)

A project request section: tags for what is needed, a budget and a time frame picked on a sliding pill, name and email. A summary of the brief writes itself as you pick; sent, the form rolls into a receipt.

**[Live demo](https://kodza.dev/components/contact-brief/)** · Contact · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-contact-brief.html`](kodza-contact-brief.html) | 10.0 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-contact-brief.css`](kodza-contact-brief.css) | 61.8 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-contact-brief.js`](kodza-contact-brief.js) | 25.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-contact-brief.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-contact-brief.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/contact-brief/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Contact Brief to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-contact-brief` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-contact-brief-width` | `1200px` | widest the section gets |
| `--kz-contact-brief-gap` | `64px` | between the two columns |
| `--kz-contact-brief-field` | `var(--kz-color-paper, #ffffff)` | inside the fields, the tags and the tracks |
| `--kz-contact-brief-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-contact-brief-muted` | `color-mix(in srgb, var(--kz-contact-brief-fg) 62%, transparent)` |  |
| `--kz-contact-brief-line` | `color-mix(in srgb, var(--kz-contact-brief-fg) 10%, transparent)` |  |
| `--kz-contact-brief-soft` | `color-mix(in srgb, var(--kz-contact-brief-fg) 5%, transparent)` | a tag under the pointer |
| `--kz-contact-brief-halo` | `color-mix(in srgb, var(--kz-contact-brief-fg) 6%, transparent)` | around a focused field |
| `--kz-contact-brief-ink` | `var(--kz-color-accent, var(--kz-contact-brief-fg))` | a picked tag, the pill, the send button, focus rings |
| `--kz-contact-brief-on-ink` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |

- Attributes: `data-empty` (e.g. `What`, `How much`, `When`), `data-error` (e.g. `Pick at least one, so we know where to start.`, `A rough range is enough. It tells us what to propose.`), `data-failed`, `data-required`, `data-send`, `data-slot` (e.g. `need`, `budget`, `when`), `data-value` (e.g. `name`, `need`, `budget`, `when`, `email`)
- Events: `kodza:submit`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-contact-brief {
    --kz-contact-brief-field: #161616;
    --kz-contact-brief-fg: #f2f2f0;
    --kz-contact-brief-muted: rgba(242, 242, 240, 0.62);
    --kz-contact-brief-line: rgba(255, 255, 255, 0.12);
    --kz-contact-brief-soft: rgba(255, 255, 255, 0.06);
    --kz-contact-brief-halo: rgba(255, 255, 255, 0.08);
    --kz-contact-brief-ink: #f2f2f0;
    --kz-contact-brief-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a tag | `Space` | Picks the need, or drops it |
| On a range | `ArrowRight` / `ArrowDown` | Picks the next range, round and round |
|  | `ArrowLeft` / `ArrowUp` | Picks the previous range, round and round |
| In a field | `Enter` | Sends the brief, or shows what is missing |
| In the message | `Cmd/Ctrl+Enter` | Sends the brief (Enter makes a new line) |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
