# Scramble Text

[![Scramble Text, live on kodza.dev](https://kodza.dev/anim/scramble-text/og.jpg)](https://kodza.dev/components/scramble-text/)

A label or a short title that decodes when it reaches the screen, and again whenever its text changes: symbols settling letter by letter, or a split-flap. Letters keep their width; screen readers read the final text.

**[Live demo](https://kodza.dev/components/scramble-text/)** · Text effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-scramble-text.html`](kodza-scramble-text.html) | 0.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-scramble-text.css`](kodza-scramble-text.css) | 3.1 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-scramble-text.js`](kodza-scramble-text.js) | 14.1 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-scramble-text.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-scramble-text.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/scramble-text/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Scramble Text to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-scramble-text` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-scramble-text-muted` | `color-mix(in srgb, currentColor 42%, transparent)` |  |
| `--kz-scramble-text-duration` | `0.9s` |  |

- Modifiers: `.kodza-scramble-text--label`
- Attributes: `data-scramble` (e.g. `flap`)

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
