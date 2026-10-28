# Fullscreen Slider

[![Fullscreen Slider, live on kodza.dev](https://kodza.dev/anim/slider-horizontal-fullscreen/og.jpg)](https://kodza.dev/components/slider-horizontal-fullscreen/)

Full-bleed slides that change with a curtain while the title rises from a mask. Horizontal or vertical, buttons, arrow keys and swipe. No GSAP.

**[Live demo](https://kodza.dev/components/slider-horizontal-fullscreen/)** · Media · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-slider-horizontal-fullscreen.html`](kodza-slider-horizontal-fullscreen.html) | 2.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-slider-horizontal-fullscreen.css`](kodza-slider-horizontal-fullscreen.css) | 11.8 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-slider-horizontal-fullscreen.js`](kodza-slider-horizontal-fullscreen.js) | 8.1 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-slider-horizontal-fullscreen.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-slider-horizontal-fullscreen.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/slider-horizontal-fullscreen/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Make my homepage hero a Kodza Fullscreen Slider.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-slider` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-slider-height` | `100vh` |  |
| `--kz-slider-fg` | `#ffffff` |  |
| `--kz-slider-shade` | `rgba(0, 0, 0, 0.38)` |  |
| `--kz-slider-duration` | `1s` |  |
| `--kz-slider-ease` | `cubic-bezier(0.76, 0, 0.24, 1)` |  |

- Attributes: `data-dir` (e.g. `-1`, `1`), `data-direction` (e.g. `vertical`)

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| Over the slider, or focus inside | `ArrowRight` / `ArrowLeft` | Next or previous slide, round and round |
| Over a vertical slider, or focus inside | `ArrowDown` / `ArrowUp` | Next or previous slide, round and round |

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
