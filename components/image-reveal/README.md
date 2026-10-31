# Image Reveal

[![Image Reveal, live on kodza.dev](https://kodza.dev/anim/image-reveal/og.jpg)](https://kodza.dev/components/image-reveal/)

A picture that unveils itself when it comes into view: a curtain opens from below, from the side or like an iris while the picture settles from a slight zoom.

**[Live demo](https://kodza.dev/components/image-reveal/)** · Image effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-image-reveal.html`](kodza-image-reveal.html) | 1.0 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-image-reveal.css`](kodza-image-reveal.css) | 6.6 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-image-reveal.js`](kodza-image-reveal.js) | 5.6 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-image-reveal.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-image-reveal.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/image-reveal/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add Kodza Image Reveal to the pictures of my case study.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-image-reveal` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-image-reveal-duration` | `1.1s` |  |
| `--kz-image-reveal-ease` | `cubic-bezier(0.76, 0, 0.24, 1)` |  |
| `--kz-image-reveal-settle` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-image-reveal-radius` | `calc(12px * var(--kz-radius-scale, 1))` |  |
| `--kz-image-reveal-muted` | `rgba(10, 10, 10, 0.62)` |  |

- Attributes: `data-from` (e.g. `left`, `center`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-image-reveal {
    --kz-image-reveal-muted: rgba(242, 242, 240, 0.62);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
