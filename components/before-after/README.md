# Before / After

[![Before / After, live on kodza.dev](https://kodza.dev/anim/before-after/og.jpg)](https://kodza.dev/components/before-after/)

Two pictures in one frame and a handle between them: drag it, click and it glides, or use the arrow keys. It nudges once when first seen; the labels step aside.

**[Live demo](https://kodza.dev/components/before-after/)** · Media · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-before-after.html`](kodza-before-after.html) | 0.7 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-before-after.css`](kodza-before-after.css) | 7.6 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-before-after.js`](kodza-before-after.js) | 6.9 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-before-after.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-before-after.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/before-after/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Compare my old and new homepage with a Kodza Before / After.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-compare` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-compare-line` | `#ffffff` |  |
| `--kz-compare-grip-bg` | `#ffffff` |  |
| `--kz-compare-grip-fg` | `#0a0a0a` |  |
| `--kz-compare-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the slider | `ArrowRight` / `ArrowUp` | Slides the divider right by 1% |
|  | `ArrowLeft` / `ArrowDown` | Slides the divider left by 1% |
|  | `PageUp` / `PageDown` | Slides it 10% right or left |
|  | `Home` / `End` | Jumps to the far left or the far right |

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
