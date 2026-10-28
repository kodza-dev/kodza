# Download Link

[![Download Link, live on kodza.dev](https://kodza.dev/anim/download-link/og.jpg)](https://kodza.dev/components/download-link/)

A download link that shows the file's type and weight beside its words, read from the file itself. On hover the arrow sinks into its tray; a click sends it through and back from the top.

**[Live demo](https://kodza.dev/components/download-link/)** · Links · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-download-link.html`](kodza-download-link.html) | 0.7 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-download-link.css`](kodza-download-link.css) | 6.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-download-link.js`](kodza-download-link.js) | 12.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-download-link.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-download-link.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/download-link/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Download Link to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-download-link]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-download-link-gap` | `0.32em` |  |
| `--kz-download-link-icon` | `0.82em` |  |
| `--kz-download-link-meta` | `color-mix(in srgb, currentColor 64%, transparent)` |  |
| `--kz-download-link-duration` | `0.25s` |  |
| `--kz-download-link-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-kodza-download-link`, `data-target`

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
