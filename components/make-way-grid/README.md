# Make Way Grid

[![Make Way Grid, live on kodza.dev](https://kodza.dev/anim/make-way-grid/og.jpg)](https://kodza.dev/components/make-way-grid/)

A grid of pictures where the one you click takes two by two cells and the others slide out of its way, then its caption card unfolds from the name pill. Two columns in narrow containers.

**[Live demo](https://kodza.dev/components/make-way-grid/)** · Image effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-make-way-grid.html`](kodza-make-way-grid.html) | 6.0 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-make-way-grid.css`](kodza-make-way-grid.css) | 17.6 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-make-way-grid.js`](kodza-make-way-grid.js) | 14.0 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-make-way-grid.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-make-way-grid.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/make-way-grid/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Make Way Grid to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-make-way` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-make-way-columns` | `3` |  |
| `--kz-make-way-columns-small` | `2` | under 560px of container |
| `--kz-make-way-ratio` | `0.75` | row height for a column width of 1 |
| `--kz-make-way-ratio-small` | `1` |  |
| `--kz-make-way-span` | `2` | cells the open picture takes, across and down |
| `--kz-make-way-gap` | `12px` |  |
| `--kz-make-way-inset` | `16px` | pill, card and close button, from the picture's edges |
| `--kz-make-way-inset-small` | `10px` |  |
| `--kz-make-way-card` | `340px` | the card's widest |
| `--kz-make-way-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-make-way-card-radius` | `calc(12px * var(--kz-radius-scale, 1))` |  |
| `--kz-make-way-bg` | `#e9e9e6` | behind a picture still loading |
| `--kz-make-way-pill-bg` | `#ffffff` | pill, card and close button |
| `--kz-make-way-pill-fg` | `#0a0a0a` |  |
| `--kz-make-way-muted` | `rgba(10, 10, 10, 0.64)` |  |
| `--kz-make-way-focus` | `#0a0a0a` |  |
| `--kz-make-way-line` | `transparent` | a hairline round each picture, for dark pictures on a dark page |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-make-way {
    --kz-make-way-bg: #1c1c1c;
    --kz-make-way-pill-bg: #161616;
    --kz-make-way-pill-fg: #f2f2f0;
    --kz-make-way-muted: rgba(242, 242, 240, 0.62);
    --kz-make-way-focus: #f2f2f0;
    --kz-make-way-line: rgba(255, 255, 255, 0.12);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a picture | `Enter` / `Space` | Opens it, or closes it |
|  | `ArrowLeft` / `ArrowRight` | Previous or next picture, opened if one is open |
|  | `Home` / `End` | First or last picture |
| Anywhere, while one is open | `Escape` | Closes it, focus back on the picture |

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
