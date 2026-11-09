# Feature Grid

[![Feature Grid, live on kodza.dev](https://kodza.dev/anim/feature-grid/og.jpg)](https://kodza.dev/components/feature-grid/)

Features in 3 or 4 columns on hairlines that never double up or hang loose, at any width. A linked cell is a link as a whole, its arrow passing through. Cells rise row by row; --cards sets them apart.

**[Live demo](https://kodza.dev/components/feature-grid/)** · Feature sections · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-feature-grid.html`](kodza-feature-grid.html) | 4.4 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-feature-grid.css`](kodza-feature-grid.css) | 27.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-feature-grid.js`](kodza-feature-grid.js) | 11.3 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-feature-grid.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-feature-grid.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/feature-grid/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Feature Grid to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-feature-grid` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-feature-grid-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-feature-grid-dim` | `color-mix(in srgb, var(--kz-feature-grid-ink) 66%, transparent)` |  |
| `--kz-feature-grid-faint` | `color-mix(in srgb, var(--kz-feature-grid-ink) 60%, transparent)` |  |
| `--kz-feature-grid-line` | `color-mix(in srgb, var(--kz-feature-grid-ink) 12%, transparent)` | the hairlines |
| `--kz-feature-grid-veil` | `color-mix(in srgb, var(--kz-feature-grid-ink) 4%, transparent)` | a linked cell, hovered |
| `--kz-feature-grid-bg` | `transparent` |  |
| `--kz-feature-grid-card` | `var(--kz-color-paper, #fff)` | --cards: the card… |
| `--kz-feature-grid-card-line` | `color-mix(in srgb, var(--kz-feature-grid-ink) 10%, transparent)` | …and its border |
| `--kz-feature-grid-width` | `var(--kz-page-width, 1440px)` | the content column: the page's, set by the site |
| `--kz-feature-grid-gutter` | `var(--kz-page-gutter, clamp(16px, 4vw, 40px))` | the space kept at the screen edges |
| `--kz-feature-grid-pad-top` | `clamp(56px, 7vw, 112px)` |  |
| `--kz-feature-grid-pad-bottom` | `clamp(56px, 7vw, 112px)` |  |
| `--kz-feature-grid-space` | `clamp(16px, 2.6vw, 36px)` | on each side of a hairline |
| `--kz-feature-grid-card-gap` | `16px` | --cards: between the cards |
| `--kz-feature-grid-size` | `clamp(28px, 3.4vw, 44px)` | the title |
| `--kz-feature-grid-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-feature-grid-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-feature-grid--cards`
- Attributes: `data-columns` (e.g. `4`, `3`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-feature-grid {
    --kz-feature-grid-ink: #f2f2f0;
    --kz-feature-grid-card: #161616;
    --kz-feature-grid-card-line: rgba(255, 255, 255, 0.12);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
