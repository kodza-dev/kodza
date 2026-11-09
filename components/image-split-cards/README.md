# Image Split Cards

[![Image Split Cards, live on kodza.dev](https://kodza.dev/anim/image-split-cards/og.jpg)](https://kodza.dev/components/image-split-cards/)

One image laid over a row of cards. Pinned while you scroll, it splits along the gaps, then each piece turns over to show its card, one after the other. Scroll back and the picture comes back together.

**[Live demo](https://kodza.dev/components/image-split-cards/)** · Scroll · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-image-split-cards.html`](kodza-image-split-cards.html) | 1.9 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-image-split-cards.css`](kodza-image-split-cards.css) | 19.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-image-split-cards.js`](kodza-image-split-cards.js) | 12.7 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-image-split-cards.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-image-split-cards.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/image-split-cards/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Image Split Cards to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-image-split-cards]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-image-split-cards-width` | `var(--kz-page-width, 1440px)` |  |
| `--kz-image-split-cards-gutter` | `var(--kz-page-gutter, clamp(16px, 4vw, 40px))` |  |
| `--kz-image-split-cards-gap` | `16px` |  |
| `--kz-image-split-cards-height` | `clamp(300px, 52svh, 440px)` |  |
| `--kz-image-split-cards-height-stacked` | `clamp(150px, 21svh, 200px)` |  |
| `--kz-image-split-cards-distance` | `150svh` |  |
| `--kz-image-split-cards-position` | `50% 50%` |  |
| `--kz-image-split-cards-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-image-split-cards-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-image-split-cards-muted` | `color-mix(in srgb, var(--kz-image-split-cards-ink) 62%, transparent)` |  |
| `--kz-image-split-cards-surface` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-image-split-cards-border` | `color-mix(in srgb, var(--kz-image-split-cards-ink) 10%, transparent)` |  |
| `--kz-image-split-cards-shade` | `#0a0a0a` |  |
| `--kz-image-split-cards-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace)` |  |

- Attributes: `data-kodza-image-split-cards`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-image-split-cards {
    --kz-image-split-cards-ink: #f2f2f0;
    --kz-image-split-cards-muted: rgba(242, 242, 240, 0.62);
    --kz-image-split-cards-surface: #161616;
    --kz-image-split-cards-border: rgba(255, 255, 255, 0.12);
    --kz-image-split-cards-shade: #000;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
