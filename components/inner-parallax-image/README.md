# Inner Parallax Image

[![Inner Parallax Image, live on kodza.dev](https://kodza.dev/anim/inner-parallax-image/og.jpg)](https://kodza.dev/components/inner-parallax-image/)

A picture that drifts slower than the page inside a frame that stays put. It wraps the image WordPress writes in its own frame, and the picture overhangs by its whole travel, so no gap ever shows.

**[Live demo](https://kodza.dev/components/inner-parallax-image/)** · Scroll · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-inner-parallax-image.html`](kodza-inner-parallax-image.html) | 0.4 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-inner-parallax-image.css`](kodza-inner-parallax-image.css) | 6.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-inner-parallax-image.js`](kodza-inner-parallax-image.js) | 8.6 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-inner-parallax-image.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-inner-parallax-image.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/inner-parallax-image/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Inner Parallax Image to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-inner-parallax-image]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-inner-parallax-image-drift` | `0.08` |  |
| `--kz-inner-parallax-image-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-inner-parallax-image-caption` | `color-mix(in srgb, var(--kz-color-ink, #0a0a0a) 62%, transparent)` |  |
| `--kz-inner-parallax-image-caption-gap` | `12px` |  |
| `--kz-inner-parallax-image-edge` | `color-mix(in srgb, var(--kz-color-ink, #0a0a0a) 8%, transparent)` |  |

- Attributes: `data-kodza-inner-parallax-image`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-inner-parallax-image {
    --kz-inner-parallax-image-caption: rgba(242, 242, 240, 0.62);
    --kz-inner-parallax-image-edge: rgba(255, 255, 255, 0.12);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
