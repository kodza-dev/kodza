# Annotated Text

[![Annotated Text, live on kodza.dev](https://kodza.dev/anim/text-highlight/og.jpg)](https://kodza.dev/components/text-highlight/)

Hand-drawn marks that draw themselves on key words when the paragraph shows up: underline, strike, circle or marker.

**[Live demo](https://kodza.dev/components/text-highlight/)** · Text effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-text-highlight.html`](kodza-text-highlight.html) | 0.4 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-text-highlight.css`](kodza-text-highlight.css) | 4.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-text-highlight.js`](kodza-text-highlight.js) | 8.0 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-text-highlight.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-text-highlight.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/text-highlight/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Mark the key words of my intro with Kodza Annotated Text.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-annotate-text` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-annotate-color` | `currentColor` |  |
| `--kz-annotate-marker` | `rgba(10, 10, 10, 0.13)` |  |
| `--kz-annotate-width` | `2.5px` |  |
| `--kz-annotate-duration` | `0.8s` |  |
| `--kz-annotate-gap` | `0.25s` |  |

- Attributes: `data-annotate` (e.g. `marker`, `underline`, `strike`, `circle`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-annotate-text {
    --kz-annotate-marker: rgba(255, 255, 255, 0.2);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
