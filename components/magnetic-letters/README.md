# Magnetic Letters

[![Magnetic Letters, live on kodza.dev](https://kodza.dev/anim/magnetic-letters/og.jpg)](https://kodza.dev/components/magnetic-letters/)

The letters of a big word step a few pixels away from the mouse, lean a little and spring back when it leaves. The word stays readable, keeps its own spacing, and a finger moves nothing.

**[Live demo](https://kodza.dev/components/magnetic-letters/)** · Text effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-magnetic-letters.html`](kodza-magnetic-letters.html) | 0.0 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-magnetic-letters.css`](kodza-magnetic-letters.css) | 2.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-magnetic-letters.js`](kodza-magnetic-letters.js) | 11.9 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-magnetic-letters.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-magnetic-letters.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/magnetic-letters/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Magnetic Letters to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-magnetic-letters` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-magnetic-letters-reach` | `1.4em` |  |
| `--kz-magnetic-letters-push` | `0.07em` |  |
| `--kz-magnetic-letters-tilt` | `3deg` |  |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
