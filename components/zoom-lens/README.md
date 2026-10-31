# Zoom Lens

[![Zoom Lens, live on kodza.dev](https://kodza.dev/anim/zoom-lens/og.jpg)](https://kodza.dev/components/zoom-lens/)

A closer look under the pointer: a round lens follows with a little lag and shows the detail from a sharper file, or the picture itself zooms towards the pointer.

**[Live demo](https://kodza.dev/components/zoom-lens/)** · Media · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-zoom-lens.html`](kodza-zoom-lens.html) | 0.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-zoom-lens.css`](kodza-zoom-lens.css) | 5.0 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-zoom-lens.js`](kodza-zoom-lens.js) | 8.0 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-zoom-lens.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-zoom-lens.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/zoom-lens/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Zoom Lens to my product photos.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-zoom` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-zoom-lens` | `180px` |  |
| `--kz-zoom-ring` | `#ffffff` |  |
| `--kz-zoom-radius` | `calc(14px * var(--kz-radius-scale, 1))` |  |
| `--kz-zoom-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-zoom--inside`
- Attributes: `data-zoom` (e.g. `2.5`, `2.2`), `data-zoom-loaded`, `data-zoom-src` (e.g. `https://kodza.dev/media/kz-steps-2400.webp`, `https://kodza.dev/media/kz-float-2400.webp`)

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
