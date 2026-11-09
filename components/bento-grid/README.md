# Bento Grid

[![Bento Grid, live on kodza.dev](https://kodza.dev/anim/bento-grid/og.jpg)](https://kodza.dev/components/bento-grid/)

A bento section in boxes of 1, 2 or 4 cells that pack without holes: pictures, figures that roll in, small screens that play once, one ink box at most. Boxes open in reading order; --ruled turns them into a board.

**[Live demo](https://kodza.dev/components/bento-grid/)** · Feature sections · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-bento-grid.html`](kodza-bento-grid.html) | 4.6 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-bento-grid.css`](kodza-bento-grid.css) | 41.7 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-bento-grid.js`](kodza-bento-grid.js) | 17.7 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-bento-grid.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-bento-grid.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/bento-grid/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Bento Grid to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-bento-grid` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-bento-grid-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-bento-grid-dim` | `color-mix(in srgb, var(--kz-bento-grid-ink) 66%, transparent)` |  |
| `--kz-bento-grid-faint` | `color-mix(in srgb, var(--kz-bento-grid-ink) 60%, transparent)` |  |
| `--kz-bento-grid-line` | `color-mix(in srgb, var(--kz-bento-grid-ink) 12%, transparent)` | --ruled hairlines, keys, the switch |
| `--kz-bento-grid-veil` | `color-mix(in srgb, var(--kz-bento-grid-ink) 4%, transparent)` | --ruled: a linked box, hovered |
| `--kz-bento-grid-bg` | `transparent` |  |
| `--kz-bento-grid-card` | `var(--kz-color-paper, #fff)` | a box… |
| `--kz-bento-grid-card-line` | `color-mix(in srgb, var(--kz-bento-grid-ink) 10%, transparent)` | …its border… |
| `--kz-bento-grid-card-line-hover` | `color-mix(in srgb, var(--kz-bento-grid-ink) 32%, transparent)` | …hovered |
| `--kz-bento-grid-accent` | `var(--kz-color-accent, var(--kz-bento-grid-ink))` | the ink box (--ink) |
| `--kz-bento-grid-on-accent` | `var(--kz-color-on-accent, var(--kz-bento-grid-card))` | its text |
| `--kz-bento-grid-width` | `var(--kz-page-width, 1440px)` | the content column: the page's, set by the site |
| `--kz-bento-grid-gutter` | `var(--kz-page-gutter, clamp(16px, 4vw, 40px))` | the space kept at the screen edges |
| `--kz-bento-grid-pad-top` | `clamp(56px, 7vw, 112px)` |  |
| `--kz-bento-grid-pad-bottom` | `clamp(56px, 7vw, 112px)` |  |
| `--kz-bento-grid-gap` | `16px` | between the boxes |
| `--kz-bento-grid-row` | `232px` | the height of a row, at least: a box taller in content makes its row taller |
| `--kz-bento-grid-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-bento-grid-pad` | `28px` | inside a box |
| `--kz-bento-grid-size` | `clamp(28px, 3.4vw, 44px)` | the title |
| `--kz-bento-grid-figure-size` | `clamp(44px, 4.6vw, 64px)` | a figure |
| `--kz-bento-grid-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-bento-grid-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-bento-grid--ruled`
- Attributes: `data-span` (e.g. `wide`, `tall`, `big`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-bento-grid {
    --kz-bento-grid-ink: #f2f2f0;
    --kz-bento-grid-card: #161616;
    --kz-bento-grid-card-line: rgba(255, 255, 255, 0.12);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
