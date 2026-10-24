# Image Gallery

[![Image Gallery, live on kodza.dev](https://kodza.dev/anim/image-gallery/og.jpg)](https://kodza.dev/components/image-gallery/)

An editorial image grid: each image grows into a fullscreen viewer in one continuous motion, with curtain transitions between images and keyboard and swipe support.

**[Live demo](https://kodza.dev/components/image-gallery/)** · Media · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-image-gallery.html`](kodza-image-gallery.html) | 4.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-image-gallery.css`](kodza-image-gallery.css) | 16.6 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-image-gallery.js`](kodza-image-gallery.js) | 15.7 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-image-gallery.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-image-gallery.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/image-gallery/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Turn my photos into a Kodza Image Gallery.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-gallery]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-gal-gap` | `clamp(14px, 2vw, 28px)` |  |
| `--kz-gal-radius` | `4px` |  |
| `--kz-gal-ink` | `#0a0a0a` |  |
| `--kz-gal-muted` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-gal-placeholder` | `rgba(10, 10, 10, 0.06)` |  |
| `--kz-gal-viewer-bg` | `#0a0a0a` |  |
| `--kz-gal-viewer-fg` | `#ffffff` |  |
| `--kz-gal-duration` | `900ms` |  |
| `--kz-gal-ease` | `cubic-bezier(0.76, 0, 0.24, 1)` |  |

- Attributes: `data-dir`, `data-full` (e.g. `https://kodza.dev/media/kz-steps-2400.webp`, `https://kodza.dev/media/kz-block-2400.webp`, `https://kodza.dev/media/kz-arch-2400.webp`, `https://kodza.dev/media/kz-stack-2400.webp`, `https://kodza.dev/media/kz-columns-2400.webp`, `https://kodza.dev/media/kz-float-2400.webp`), `data-kodza-gallery`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-gallery {
    --kz-gal-ink: #f2f2f0;
    --kz-gal-muted: rgba(242, 242, 240, 0.62);
    --kz-gal-placeholder: rgba(255, 255, 255, 0.06);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| In the viewer | `ArrowRight` / `ArrowLeft` | Next or previous image, round and round |
|  | `Escape` | Closes it, the image flies back to its thumbnail |

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
