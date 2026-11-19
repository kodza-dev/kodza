# Masonry Grid

[![Masonry Grid, live on kodza.dev](https://kodza.dev/anim/masonry-grid/og.jpg)](https://kodza.dev/components/masonry-grid/)

Images of every height in columns that keep the reading order. Each one glides to its new place when the column count changes, and Load more brings the next ones in, one after another.

**[Live demo](https://kodza.dev/components/masonry-grid/)** · Media · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-masonry-grid.html`](kodza-masonry-grid.html) | 7.7 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-masonry-grid.css`](kodza-masonry-grid.css) | 13.6 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-masonry-grid.js`](kodza-masonry-grid.js) | 16.3 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-masonry-grid.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-masonry-grid.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/masonry-grid/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Masonry Grid to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-masonry-grid` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-masonry-grid-column` | `130px` | the narrowest a column gets before the grid drops one |
| `--kz-masonry-grid-columns` | `4` | the most columns, on a wide screen |
| `--kz-masonry-grid-gap` | `clamp(12px, 1.6vw, 20px)` |  |
| `--kz-masonry-grid-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-masonry-grid-paper` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-masonry-grid-muted` | `color-mix(in srgb, var(--kz-masonry-grid-ink) 62%, transparent)` |  |
| `--kz-masonry-grid-placeholder` | `color-mix(in srgb, var(--kz-masonry-grid-ink) 6%, transparent)` |  |
| `--kz-masonry-grid-button` | `var(--kz-color-accent, var(--kz-masonry-grid-ink))` |  |
| `--kz-masonry-grid-on-button` | `var(--kz-color-on-accent, var(--kz-masonry-grid-paper))` |  |
| `--kz-masonry-grid-radius` | `calc(10px * var(--kz-radius-scale, 1))` |  |
| `--kz-masonry-grid-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-masonry-grid-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-batch` (e.g. `4`), `data-show` (e.g. `9`)
- Events: `kodza:more`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-masonry-grid {
    --kz-masonry-grid-ink: #f2f2f0;
    --kz-masonry-grid-paper: #0a0a0a;
    --kz-masonry-grid-placeholder: rgba(255, 255, 255, 0.06);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
