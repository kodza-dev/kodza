# 3D Press Button

[![3D Press Button, live on kodza.dev](https://kodza.dev/anim/press-button/og.jpg)](https://kodza.dev/components/press-button/)

A button with real thickness: the face sinks into its base, even the quickest tap goes all the way down, and it springs back with a small bounce. A keycap, a brutalist slab, or a toggle that stays down.

**[Live demo](https://kodza.dev/components/press-button/)** · Buttons · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-press-button.html`](kodza-press-button.html) | 0.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-press-button.css`](kodza-press-button.css) | 8.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-press-button.js`](kodza-press-button.js) | 5.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-press-button.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-press-button.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/press-button/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza 3D Press Button to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-press-button` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-press-face` | `#ffffff` |  |
| `--kz-press-fg` | `#0a0a0a` |  |
| `--kz-press-edge` | `#0a0a0a` | the thickness, and the outline of the face |
| `--kz-press-focus` | `#0a0a0a` |  |
| `--kz-press-line` | `1.5px` |  |
| `--kz-press-radius` | `999px` |  |
| `--kz-press-height` | `52px` |  |
| `--kz-press-pad-x` | `28px` |  |
| `--kz-press-gap` | `10px` |  |
| `--kz-press-depth-x` | `0px` |  |
| `--kz-press-depth-y` | `6px` |  |
| `--kz-press-lift` | `calc(1 / 3)` | share of the depth the face rises on hover (2px of 6: whole pixels, crisp text) |
| `--kz-press-latch` | `0.5` | how far down a latched toggle stays (3px of 6: whole pixels, crisp text) |
| `--kz-press-down` | `0.08s cubic-bezier(0.3, 0, 0.6, 1)` |  |
| `--kz-press-up` | `0.45s cubic-bezier(0.3, 1.9, 0.5, 1)` |  |
| `--kz-press-hover` | `0.25s cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-press-button--offset`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-press-button {
    --kz-press-face: #161616;
    --kz-press-fg: #f2f2f0;
    --kz-press-edge: #3d3d3c;
    --kz-press-focus: #f2f2f0;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the toggle | `Enter` / `Space` | Flips it, the face stays down while it is on |
| On the button | `Enter` / `Space` | Presses the face down, springs back on release |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
