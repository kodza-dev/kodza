# Footnote Link

[![Footnote Link, live on kodza.dev](https://kodza.dev/anim/footnote-link/og.jpg)](https://kodza.dev/components/footnote-link/)

Footnotes that stay on their line. Wide, the note sits in the margin level with its line and inks with its number; narrow, it folds out under the line. Picks up WordPress footnotes as they are.

**[Live demo](https://kodza.dev/components/footnote-link/)** · Links · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-footnote-link.html`](kodza-footnote-link.html) | 1.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-footnote-link.css`](kodza-footnote-link.css) | 13.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-footnote-link.js`](kodza-footnote-link.js) | 12.6 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-footnote-link.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-footnote-link.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/footnote-link/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Footnote Link to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-footnote-link]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-footnote-link-ink` | `#0a0a0a` |  |
| `--kz-footnote-link-paper` | `#fff` |  |
| `--kz-footnote-link-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-footnote-link-sheet` | `rgba(10, 10, 10, 0.05)` |  |
| `--kz-footnote-link-note-width` | `210px` |  |
| `--kz-footnote-link-gap` | `48px` |  |
| `--kz-footnote-link-note-size` | `0.82em` |  |
| `--kz-footnote-link-duration` | `0.26s` |  |
| `--kz-footnote-link-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-kodza-footnote-link`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-footnote-link {
    --kz-footnote-link-ink: #f2f2f0;
    --kz-footnote-link-paper: #0a0a0a;
    --kz-footnote-link-muted: rgba(242, 242, 240, 0.62);
    --kz-footnote-link-sheet: rgba(255, 255, 255, 0.08);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a note number | `Enter` / `Space` | Opens or closes the note, or inks it in the margin |
|  | `Escape` | Closes the note, or lets go of the ink |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
