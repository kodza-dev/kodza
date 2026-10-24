# Pagination

[![Pagination, live on kodza.dev](https://kodza.dev/anim/pagination/og.jpg)](https://kodza.dev/components/pagination/)

Seven slots that never jump: the ink pill slides to the page and the numbers that change roll into place. Compact version included.

**[Live demo](https://kodza.dev/components/pagination/)** · Navigation · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-pagination.html`](kodza-pagination.html) | 0.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-pagination.css`](kodza-pagination.css) | 13.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-pagination.js`](kodza-pagination.js) | 11.7 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-pagination.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-pagination.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/pagination/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add Kodza Pagination under my blog list.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-pagination` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-pages-fg` | `#0a0a0a` |  |
| `--kz-pages-muted` | `rgba(10, 10, 10, 0.58)` |  |
| `--kz-pages-border` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-pages-soft` | `rgba(10, 10, 10, 0.06)` |  |
| `--kz-pages-ink` | `#0a0a0a` |  |
| `--kz-pages-on-ink` | `#ffffff` |  |
| `--kz-pages-size` | `40px` |  |
| `--kz-pages-gap` | `4px` |  |
| `--kz-pages-duration` | `0.5s` |  |
| `--kz-pages-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-pagination--compact`
- Attributes: `data-current` (e.g. `3`), `data-href`, `data-page`, `data-pages` (e.g. `12`)
- Events: `kodza:page`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-pagination {
    --kz-pages-fg: #f2f2f0;
    --kz-pages-muted: rgba(242, 242, 240, 0.6);
    --kz-pages-border: rgba(255, 255, 255, 0.14);
    --kz-pages-soft: rgba(255, 255, 255, 0.08);
    --kz-pages-ink: #f2f2f0;
    --kz-pages-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the pagination | `ArrowLeft` / `ArrowRight` | Previous or next page |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
