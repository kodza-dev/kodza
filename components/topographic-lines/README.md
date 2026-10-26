# Topographic Lines

[![Topographic Lines, live on kodza.dev](https://kodza.dev/anim/topographic-lines/og.jpg)](https://kodza.dev/components/topographic-lines/)

A hero over a contour map drawn by a native WebGL shader: the lines drift very slowly, the pointer raises a hill under it, and they thin out under the text. Plain CSS rings without WebGL.

**[Live demo](https://kodza.dev/components/topographic-lines/)** · Backgrounds & textures · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-topographic-lines.html`](kodza-topographic-lines.html) | 1.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-topographic-lines.css`](kodza-topographic-lines.css) | 12.6 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-topographic-lines.js`](kodza-topographic-lines.js) | 21.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-topographic-lines.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-topographic-lines.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/topographic-lines/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Topographic Lines to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-topographic-lines]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-topographic-lines-bg` | `#f2f2f0` | the paper |
| `--kz-topographic-lines-ink` | `#0a0a0a` | the lines, the text, the button |
| `--kz-topographic-lines-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-topographic-lines-minor` | `0.16` | opacity of a contour line, 0 to 1 |
| `--kz-topographic-lines-major` | `0.34` | every fifth line, the index contour, a little thicker |
| `--kz-topographic-lines-levels` | `12` | how many lines a hill gets: more for steeper ground |
| `--kz-topographic-lines-scale` | `520px` | the size of the hills |
| `--kz-topographic-lines-speed` | `1` | how fast the ground drifts (0: a still map) |
| `--kz-topographic-lines-lift` | `0.5` | how high the pointer raises the ground (0: not at all) |
| `--kz-topographic-lines-reach` | `140px` | the radius of that hill |
| `--kz-topographic-lines-calm` | `0.2` | how much of a line shows under the text, 0 to 1 |
| `--kz-topographic-lines-height` | `600px` |  |
| `--kz-topographic-lines-width` | `1152px` | the text column |
| `--kz-topographic-lines-side` | `clamp(20px, 5vw, 64px)` |  |

- Attributes: `data-kodza-topographic-lines`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-topographic-lines {
    --kz-topographic-lines-bg: #0a0a0a;
    --kz-topographic-lines-ink: #f2f2f0;
    --kz-topographic-lines-muted: rgba(242, 242, 240, 0.62);
    --kz-topographic-lines-minor: 0.13;
    --kz-topographic-lines-major: 0.28;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
