# Text Block Reveal

[![Text Block Reveal, live on kodza.dev](https://kodza.dev/anim/text-block-reveal/og.jpg)](https://kodza.dev/components/text-block-reveal/)

A block of ink runs along each line of a heading, covers it and pulls away to leave the words written. Real line breaks, lines in cascade.

**[Live demo](https://kodza.dev/components/text-block-reveal/)** · Text effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-text-block-reveal.html`](kodza-text-block-reveal.html) | 0.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-text-block-reveal.css`](kodza-text-block-reveal.css) | 5.7 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-text-block-reveal.js`](kodza-text-block-reveal.js) | 9.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-text-block-reveal.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-text-block-reveal.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/text-block-reveal/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Text Block Reveal to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-text-block-reveal` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-text-block-reveal-color` | `var(--kz-color-accent, currentColor)` |  |
| `--kz-text-block-reveal-duration` | `1.1s` |  |
| `--kz-text-block-reveal-stagger` | `0.12s` |  |

- Modifiers: `.kodza-text-block-reveal--label`
- Attributes: `data-from` (e.g. `right`)

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
