# Shared Element Morph

[![Shared Element Morph, live on kodza.dev](https://kodza.dev/anim/shared-element-morph/og.jpg)](https://kodza.dev/components/shared-element-morph/)

Between two real pages, the picture you click grows into its place on the next page while the rest of it plays its entrance. Back, it shrinks into its card. Chrome, Edge, Safari.

**[Live demo](https://kodza.dev/components/shared-element-morph/)** · Preloaders & transitions · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-shared-element-morph.html`](kodza-shared-element-morph.html) | 1.3 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-shared-element-morph.css`](kodza-shared-element-morph.css) | 24.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-shared-element-morph.js`](kodza-shared-element-morph.js) | 30.3 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-shared-element-morph.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-shared-element-morph.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/shared-element-morph/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Shared Element Morph to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-shared-element-morph]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-shared-element-morph-duration` | `0.8s` | the trip of the image, and the pages trading places |
| `--kz-shared-element-morph-ease` | `cubic-bezier(0.65, 0, 0.35, 1)` |  |
| `--kz-shared-element-morph-radius` | `calc(16px * var(--kz-radius-scale, 1))` | its corners on the way |
| `--kz-shared-element-morph-backdrop` | `transparent` | between the two pages: your page colour shows through |
| `--kz-shared-element-morph-enter-delay` | `0.24s` | the arrival starts while the image is on its way |
| `--kz-shared-element-morph-enter-ease` | `cubic-bezier(0.2, 0.8, 0.1, 1)` |  |
| `--kz-shared-element-morph-bg` | `#f2f2f0` |  |
| `--kz-shared-element-morph-fg` | `#0a0a0a` |  |
| `--kz-shared-element-morph-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-shared-element-morph-line` | `rgba(10, 10, 10, 0.12)` |  |
| `--kz-shared-element-morph-image-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-shared-element-morph-side` | `24px` |  |

- Attributes: `data-enter` (e.g. `label`, `title`), `data-kodza-shared-element-morph`, `data-page-back`, `data-page-morph`
- Events: `kodza:page-engine`, `kodza:page-transition`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-shared-element-morph {
    --kz-shared-element-morph-bg: #0a0a0a;
    --kz-shared-element-morph-fg: #f2f2f0;
    --kz-shared-element-morph-muted: rgba(242, 242, 240, 0.62);
    --kz-shared-element-morph-line: rgba(242, 242, 240, 0.14);
    --kz-shared-element-morph-backdrop: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
