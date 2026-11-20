# Text Fit

[![Text Fit, live on kodza.dev](https://kodza.dev/anim/text-fit/og.jpg)](https://kodza.dev/components/text-fit/)

Each line of a heading fills its column exactly, like a poster: every line, split at each <br>, gets the font size that reaches both edges, refitted when the column changes or the font loads. A ceiling holds short lines.

**[Live demo](https://kodza.dev/components/text-fit/)** · Text effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-text-fit.html`](kodza-text-fit.html) | 0.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-text-fit.css`](kodza-text-fit.css) | 2.1 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-text-fit.js`](kodza-text-fit.js) | 7.6 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-text-fit.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-text-fit.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/text-fit/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Text Fit to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-text-fit` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-text-fit-max` | `320px` |  |
| `--kz-text-fit-leading` | `0.9` |  |
| `--kz-text-fit-tracking` | `-0.045em` |  |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
