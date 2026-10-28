# Scramble Link

[![Scramble Link, live on kodza.dev](https://kodza.dev/anim/hover-link-text-shuffle/og.jpg)](https://kodza.dev/components/hover-link-text-shuffle/)

Hover a link and its word scrambles, then settles from left to right: symbols that decode, its own letters shuffling, or a split-flap.

**[Live demo](https://kodza.dev/components/hover-link-text-shuffle/)** · Links · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-hover-link-text-shuffle.html`](kodza-hover-link-text-shuffle.html) | 0.3 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-hover-link-text-shuffle.css`](kodza-hover-link-text-shuffle.css) | 3.5 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-hover-link-text-shuffle.js`](kodza-hover-link-text-shuffle.js) | 7.1 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-hover-link-text-shuffle.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-hover-link-text-shuffle.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/hover-link-text-shuffle/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Put Kodza Scramble Link on my footer links.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-scramble` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-scramble-muted` | `rgba(10, 10, 10, 0.4)` |  |
| `--kz-scramble-duration` | `0.6s` |  |

- Attributes: `data-scramble` (e.g. `shuffle`, `flap`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-scramble {
    --kz-scramble-muted: rgba(255, 255, 255, 0.4);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
