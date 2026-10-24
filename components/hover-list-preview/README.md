# Hover List Preview

[![Hover List Preview, live on kodza.dev](https://kodza.dev/anim/hover-list-preview/og.jpg)](https://kodza.dev/components/hover-list-preview/)

Point at a row and its picture shows in one frame that follows the pointer, wiping to the next picture as you move down the list. Panel mode, keyboard and touch thumbnails included.

**[Live demo](https://kodza.dev/components/hover-list-preview/)** · Image effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-hover-list-preview.html`](kodza-hover-list-preview.html) | 3.4 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-hover-list-preview.css`](kodza-hover-list-preview.css) | 20.1 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-hover-list-preview.js`](kodza-hover-list-preview.js) | 16.7 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-hover-list-preview.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-hover-list-preview.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/hover-list-preview/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Hover List Preview to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-hover-list` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-hover-list-ink` | `#0a0a0a` |  |
| `--kz-hover-list-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-hover-list-dim` | `rgba(10, 10, 10, 0.26)` |  |
| `--kz-hover-list-line` | `rgba(10, 10, 10, 0.12)` |  |
| `--kz-hover-list-placeholder` | `rgba(10, 10, 10, 0.06)` |  |
| `--kz-hover-list-glass` | `auto` | behind the words that cross the picture: auto = the background behind the list, see-through |
| `--kz-hover-list-size` | `clamp(22px, 2.6vw, 30px)` |  |
| `--kz-hover-list-columns` | `minmax(0, 1fr) minmax(0, 13em) auto` |  |
| `--kz-hover-list-width` | `220px` | the frame that follows the pointer |
| `--kz-hover-list-panel` | `220px` | the frame beside the list, with --panel |
| `--kz-hover-list-sticky` | `24px` | with --panel, where the frame stops from the top of the screen |
| `--kz-hover-list-ratio` | `4 / 5` |  |
| `--kz-hover-list-radius` | `12px` |  |
| `--kz-hover-list-nudge` | `12px` |  |
| `--kz-hover-list-inline` | `560px` | narrower than this, or on touch: a thumbnail in each row |
| `--kz-hover-list-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-hover-list--panel`
- Attributes: `data-image` (e.g. `https://kodza.dev/media/kz-arch-1400.webp`, `https://kodza.dev/media/kz-columns-1400.webp`, `https://kodza.dev/media/kz-float-1400.webp`, `https://kodza.dev/media/kz-steps-1400.webp`, `https://kodza.dev/media/kz-stack-1400.webp`, `https://kodza.dev/media/kz-block-1400.webp`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-hover-list {
    --kz-hover-list-ink: #f2f2f0;
    --kz-hover-list-muted: rgba(242, 242, 240, 0.62);
    --kz-hover-list-dim: rgba(242, 242, 240, 0.26);
    --kz-hover-list-line: rgba(255, 255, 255, 0.12);
    --kz-hover-list-placeholder: rgba(255, 255, 255, 0.06);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a row | `Tab` / `Shift+Tab` | Moves between rows, the picture follows the focus |
| On a row, while its picture shows | `Escape` | Hides the picture, focus stays on the row |

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
