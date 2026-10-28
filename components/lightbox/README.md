# Lightbox

[![Lightbox, live on kodza.dev](https://kodza.dev/anim/lightbox/og.jpg)](https://kodza.dev/components/lightbox/)

Wrap an article and every picture in it opens large: it grows from its own place to the screen, arrows or a swipe go to the next, and it returns to its place on Escape.

**[Live demo](https://kodza.dev/components/lightbox/)** · Media · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-lightbox.html`](kodza-lightbox.html) | 0.6 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-lightbox.css`](kodza-lightbox.css) | 11.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-lightbox.js`](kodza-lightbox.js) | 13.6 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-lightbox.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-lightbox.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/lightbox/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Open my article images in a Kodza Lightbox.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-lightbox` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-lightbox-shade` | `rgba(10, 10, 10, 0.9)` |  |
| `--kz-lightbox-fg` | `#ffffff` |  |
| `--kz-lightbox-muted` | `rgba(255, 255, 255, 0.62)` |  |
| `--kz-lightbox-soft` | `rgba(255, 255, 255, 0.1)` |  |
| `--kz-lightbox-radius` | `12px` |  |
| `--kz-lightbox-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-full` (e.g. `https://kodza.dev/media/kz-steps-2400.webp`, `https://kodza.dev/media/kz-arch-2400.webp`, `https://kodza.dev/media/kz-columns-2400.webp`), `data-no-lightbox`, `data-step`

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| In the viewer | `ArrowRight` / `ArrowLeft` | Next or previous picture, round and round |
|  | `Escape` | Closes it, the picture goes back to its place |

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
