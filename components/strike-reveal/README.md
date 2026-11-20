# Strike Reveal

[![Strike Reveal, live on kodza.dev](https://kodza.dev/anim/strike-reveal/og.jpg)](https://kodza.dev/components/strike-reveal/)

A hand-drawn stroke strikes a word in a heading, the word dims, then the line opens and the right word rises from its mask. Real <del> and <ins>.

**[Live demo](https://kodza.dev/components/strike-reveal/)** · Text effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-strike-reveal.html`](kodza-strike-reveal.html) | 0.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-strike-reveal.css`](kodza-strike-reveal.css) | 8.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-strike-reveal.js`](kodza-strike-reveal.js) | 13.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-strike-reveal.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-strike-reveal.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/strike-reveal/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Strike Reveal to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-strike-reveal` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-strike-reveal-color` | `var(--kz-color-accent, currentColor)` |  |
| `--kz-strike-reveal-width` | `0.065em` |  |
| `--kz-strike-reveal-fade` | `0.38` |  |
| `--kz-strike-reveal-draw` | `0.55s` |  |
| `--kz-strike-reveal-open` | `0.6s` |  |
| `--kz-strike-reveal-rise` | `0.7s` |  |
| `--kz-strike-reveal-stagger` | `0.9s` |  |

- Attributes: `data-strike` (e.g. `scribble`)

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
