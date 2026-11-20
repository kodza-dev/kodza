# Drop Cap

[![Drop Cap, live on kodza.dev](https://kodza.dev/anim/drop-cap/og.jpg)](https://kodza.dev/components/drop-cap/)

A drop cap set to the pixel over two or three lines, measured from your fonts. The letter rises from its baseline, then the paragraph shows. Works on WordPress .has-drop-cap.

**[Live demo](https://kodza.dev/components/drop-cap/)** · Text effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-drop-cap.html`](kodza-drop-cap.html) | 0.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-drop-cap.css`](kodza-drop-cap.css) | 5.0 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-drop-cap.js`](kodza-drop-cap.js) | 12.7 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-drop-cap.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-drop-cap.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/drop-cap/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Drop Cap to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-drop-cap` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-drop-cap-lines` | `3` |  |
| `--kz-drop-cap-gap` | `0.4em` |  |
| `--kz-drop-cap-color` | `var(--kz-color-accent, currentColor)` |  |
| `--kz-drop-cap-font` | `var(--kz-font-display, inherit)` |  |
| `--kz-drop-cap-weight` | `var(--kz-font-display-weight, 600)` |  |
| `--kz-drop-cap-case` | `var(--kz-font-display-case, none)` |  |
| `--kz-drop-cap-rise` | `0.9s` |  |
| `--kz-drop-cap-follow` | `0.3s` |  |
| `--kz-drop-cap-sweep` | `1.1s` |  |

- Attributes: `data-lines` (e.g. `2`)

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
