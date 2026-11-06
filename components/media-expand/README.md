# Media Expand

[![Media Expand, live on kodza.dev](https://kodza.dev/anim/media-expand/og.jpg)](https://kodza.dev/components/media-expand/)

An image or a video in a rounded frame, set in from the edges, takes the full width as the scroll brings it to the middle of the screen. The corners square off, the caption rises, and it all reverses on the way back up.

**[Live demo](https://kodza.dev/components/media-expand/)** · Scroll · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-media-expand.html`](kodza-media-expand.html) | 0.7 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-media-expand.css`](kodza-media-expand.css) | 10.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-media-expand.js`](kodza-media-expand.js) | 8.6 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-media-expand.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-media-expand.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/media-expand/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Media Expand to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-media-expand]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-media-expand-ratio` | `16 / 9` |  |
| `--kz-media-expand-ratio-medium` | `4 / 3` |  |
| `--kz-media-expand-ratio-narrow` | `4 / 5` |  |
| `--kz-media-expand-max-height` | `100svh` |  |
| `--kz-media-expand-inset` | `8%` |  |
| `--kz-media-expand-radius` | `calc(24px * var(--kz-radius-scale, 1))` |  |
| `--kz-media-expand-radius-end` | `0px` |  |
| `--kz-media-expand-zoom` | `1.12` |  |
| `--kz-media-expand-caption-ink` | `#fff` |  |
| `--kz-media-expand-caption-pad` | `clamp(20px, 4.5cqi, 56px)` |  |
| `--kz-media-expand-veil` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-media-expand-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace)` |  |
| `--kz-media-expand-duration` | `0.7s` |  |
| `--kz-media-expand-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-kodza-media-expand`

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
