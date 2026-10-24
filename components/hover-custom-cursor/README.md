# Custom Cursor

[![Custom Cursor, live on kodza.dev](https://kodza.dev/anim/hover-custom-cursor/og.jpg)](https://kodza.dev/components/hover-custom-cursor/)

Inside its zone the pointer becomes a dot with a soft lag, and a pill that says what a click will do over each item. No GSAP.

**[Live demo](https://kodza.dev/components/hover-custom-cursor/)** · Cursor · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-hover-custom-cursor.html`](kodza-hover-custom-cursor.html) | 0.7 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-hover-custom-cursor.css`](kodza-hover-custom-cursor.css) | 5.5 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-hover-custom-cursor.js`](kodza-hover-custom-cursor.js) | 5.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-hover-custom-cursor.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-hover-custom-cursor.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/hover-custom-cursor/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Custom Cursor to my project grid.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-cursor-zone` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-cursor-bg` | `#0a0a0a` |  |
| `--kz-cursor-fg` | `#ffffff` |  |
| `--kz-cursor-dot` | `10px` |  |
| `--kz-cursor-ratio` | `4 / 5` |  |
| `--kz-cursor-radius` | `4px` |  |
| `--kz-cursor-placeholder` | `rgba(10, 10, 10, 0.06)` |  |

- Attributes: `data-cursor` (e.g. `View`, `Open`, `Ship it`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-cursor-zone {
    --kz-cursor-bg: #ffffff;
    --kz-cursor-fg: #0a0a0a;
    --kz-cursor-placeholder: rgba(255, 255, 255, 0.06);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
