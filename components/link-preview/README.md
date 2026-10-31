# Link Preview

[![Link Preview, live on kodza.dev](https://kodza.dev/anim/link-preview/og.jpg)](https://kodza.dev/components/link-preview/)

Point at a link and a card of where it goes unfolds above it. One card per paragraph: it glides from link to link, its picture cross-fading and its words rolling.

**[Live demo](https://kodza.dev/components/link-preview/)** · Links · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-link-preview.html`](kodza-link-preview.html) | 0.7 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-link-preview.css`](kodza-link-preview.css) | 6.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-link-preview.js`](kodza-link-preview.js) | 10.7 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-link-preview.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-link-preview.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/link-preview/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add Kodza Link Preview to the links in my blog posts.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-link-preview` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-preview-line` | `color-mix(in srgb, currentColor 30%, transparent)` |  |

- Attributes: `data-preview-image` (e.g. `https://kodza.dev/media/kz-arch-1400.webp`, `https://kodza.dev/media/kz-columns-1400.webp`, `https://kodza.dev/media/kz-steps-1400.webp`), `data-preview-title` (e.g. `The arch`, `Seven columns, no meetings`, `Stairs that lead nowhere`), `data-preview-url` (e.g. `kodza.dev/rooms/arch`, `kodza.dev/rooms/columns`, `kodza.dev/rooms/stairs`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-link-preview__card {
    --kz-preview-bg: #161616;
    --kz-preview-fg: #f2f2f0;
    --kz-preview-muted: rgba(242, 242, 240, 0.6);
    --kz-preview-border: rgba(255, 255, 255, 0.12);
    --kz-preview-shadow: rgba(0, 0, 0, 0.7);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a link | `Escape` | Hides the card |
| Anywhere | `Tab` / `Shift+Tab` | Opens the card of the link that gets focus |

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
