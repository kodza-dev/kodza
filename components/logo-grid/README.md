# Logo Grid

[![Logo Grid, live on kodza.dev](https://kodza.dev/anim/logo-grid/og.jpg)](https://kodza.dev/components/logo-grid/)

Client logos in a hairline grid, grey and all the same weight. A cell can link to its case study: on hover or focus the logo rolls up and the result rises in. Tiers for sponsors.

**[Live demo](https://kodza.dev/components/logo-grid/)** · Testimonials & logos · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-logo-grid.html`](kodza-logo-grid.html) | 29.6 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-logo-grid.css`](kodza-logo-grid.css) | 21.5 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-logo-grid.js`](kodza-logo-grid.js) | 5.5 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-logo-grid.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-logo-grid.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/logo-grid/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Logo Grid to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-logo-grid]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-logo-grid-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-logo-grid-dim` | `color-mix(in srgb, var(--kz-logo-grid-ink) 64%, transparent)` |  |
| `--kz-logo-grid-logo` | `color-mix(in srgb, var(--kz-logo-grid-ink) 56%, transparent)` | the logos at rest, grey; a link turns its logo to the ink |
| `--kz-logo-grid-img-filter` | `grayscale(1) opacity(0.56)` | a logo given as an img; on a dark band: brightness(0) invert(1) opacity(0.56) |
| `--kz-logo-grid-img-filter-hover` | `grayscale(1)` | none to give an img logo its colours back on hover |
| `--kz-logo-grid-rule` | `color-mix(in srgb, var(--kz-logo-grid-ink) 10%, transparent)` | the hairlines between cells and tiers |
| `--kz-logo-grid-hover-bg` | `color-mix(in srgb, var(--kz-logo-grid-ink) 3%, transparent)` | a link cell under the pointer |
| `--kz-logo-grid-bg` | `transparent` |  |
| `--kz-logo-grid-columns` | `4` |  |
| `--kz-logo-grid-columns-narrow` | `2` | under 760px |
| `--kz-logo-grid-cell` | `128px` | the height of a cell |
| `--kz-logo-grid-cell-narrow` | `104px` |  |
| `--kz-logo-grid-area` | `2600` | square pixels per logo: every logo weighs the same |
| `--kz-logo-grid-area-narrow` | `1600` |  |
| `--kz-logo-grid-max` | `44px` | the tallest a logo gets |
| `--kz-logo-grid-tier-label` | `200px` | the column of the tier names |
| `--kz-logo-grid-width` | `1120px` |  |
| `--kz-logo-grid-pad-y` | `clamp(56px, 7vw, 96px)` |  |
| `--kz-logo-grid-gutter` | `clamp(16px, 4vw, 40px)` |  |
| `--kz-logo-grid-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-logo-grid-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-kodza-logo-grid`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-logo-grid {
    --kz-logo-grid-ink: #f2f2f0;
    --kz-logo-grid-dim: rgba(242, 242, 240, 0.64);
    --kz-logo-grid-logo: rgba(242, 242, 240, 0.56);
    --kz-logo-grid-img-filter: brightness(0) invert(1) opacity(0.56);
    --kz-logo-grid-img-filter-hover: brightness(0) invert(1);
    --kz-logo-grid-rule: rgba(242, 242, 240, 0.12);
    --kz-logo-grid-hover-bg: rgba(242, 242, 240, 0.04);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

Every colour is a variable on the section: set --kz-logo-grid-ink, -dim, -logo, -rule and -hover-bg, and -img-filter and -img-filter-hover for img logos (the demo's dark band has the recipe).

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
