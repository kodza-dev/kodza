# Carousel

[![Carousel, live on kodza.dev](https://kodza.dev/anim/carousel/og.jpg)](https://kodza.dev/components/carousel/)

A native scroll-snap carousel that works before the script loads. Then: page buttons, a rolling count, a progress bar or dots, and mouse drag with a throw. Never steals the wheel.

**[Live demo](https://kodza.dev/components/carousel/)** · Media · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-carousel.html`](kodza-carousel.html) | 7.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-carousel.css`](kodza-carousel.css) | 28.0 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-carousel.js`](kodza-carousel.js) | 25.5 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-carousel.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-carousel.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/carousel/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Carousel to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-carousel` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-carousel-per-view` | `3` | slides in view; a decimal shows part of the next one |
| `--kz-carousel-per-view-tablet` | `2.2` | carousel narrower than 860px |
| `--kz-carousel-per-view-phone` | `1.1` | carousel narrower than 560px |
| `--kz-carousel-gap` | `16px` |  |
| `--kz-carousel-inset` | `0px` | room before the first slide and after the last (full-width layouts) |
| `--kz-carousel-fg` | `#0a0a0a` |  |
| `--kz-carousel-muted` | `rgba(10, 10, 10, 0.64)` |  |
| `--kz-carousel-dim` | `rgba(10, 10, 10, 0.45)` |  |
| `--kz-carousel-line` | `rgba(10, 10, 10, 0.12)` |  |
| `--kz-carousel-soft` | `rgba(10, 10, 10, 0.06)` |  |
| `--kz-carousel-ink` | `#0a0a0a` | the buttons, the progress bar, the dot pill |
| `--kz-carousel-ink-hover` | `#2e2e2e` |  |
| `--kz-carousel-on-ink` | `#ffffff` |  |
| `--kz-carousel-card` | `#ffffff` |  |
| `--kz-carousel-border` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-carousel-placeholder` | `rgba(10, 10, 10, 0.05)` |  |
| `--kz-carousel-radius` | `16px` |  |
| `--kz-carousel-ratio` | `4 / 3` | the picture frame of a card |
| `--kz-carousel-control` | `40px` |  |
| `--kz-carousel-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-carousel--quotes`
- Attributes: `data-autoplay`, `data-dot-label`, `data-dots-label`, `data-pause-label`, `data-play-label`, `data-slide-label`, `data-status-many`, `data-status-one`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-carousel {
    --kz-carousel-fg: #f2f2f0;
    --kz-carousel-muted: rgba(242, 242, 240, 0.64);
    --kz-carousel-dim: rgba(242, 242, 240, 0.45);
    --kz-carousel-line: rgba(255, 255, 255, 0.14);
    --kz-carousel-soft: rgba(255, 255, 255, 0.08);
    --kz-carousel-ink: #f2f2f0;
    --kz-carousel-ink-hover: #ffffff;
    --kz-carousel-on-ink: #0a0a0a;
    --kz-carousel-card: #161616;
    --kz-carousel-border: rgba(255, 255, 255, 0.12);
    --kz-carousel-placeholder: rgba(255, 255, 255, 0.06);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the slides row | `ArrowRight` / `ArrowLeft` | Next or previous slide |
|  | `Home` / `End` | First or last slide |

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
