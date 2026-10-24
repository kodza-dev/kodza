# Image Hover

[![Image Hover, live on kodza.dev](https://kodza.dev/anim/image-scale/og.jpg)](https://kodza.dev/components/image-scale/)

Four ways for an image to answer the pointer, inside its own frame: a slow zoom, coming into focus, rounding off, or drifting with the cursor.

**[Live demo](https://kodza.dev/components/image-scale/)** · Image effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-image-scale.html`](kodza-image-scale.html) | 0.9 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-image-scale.css`](kodza-image-scale.css) | 5.5 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-image-scale.js`](kodza-image-scale.js) | 3.7 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-image-scale.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-image-scale.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/image-scale/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add Kodza Image Hover to my product thumbnails.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-image-hover--parallax` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-image-ratio` | `4 / 5` |  |
| `--kz-image-radius` | `4px` |  |
| `--kz-image-zoom` | `1.08` |  |
| `--kz-image-duration` | `1.1s` |  |
| `--kz-image-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-image-placeholder` | `rgba(10, 10, 10, 0.06)` |  |

- Modifiers: `.kodza-image-hover--focus`, `.kodza-image-hover--parallax`, `.kodza-image-hover--round`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-image-hover {
    --kz-image-placeholder: rgba(255, 255, 255, 0.06);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
