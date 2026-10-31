# Sticky Cards

[![Sticky Cards, live on kodza.dev](https://kodza.dev/anim/sticky-cards/og.jpg)](https://kodza.dev/components/sticky-cards/)

Cards that stack as you scroll, each covered card stepping back and darkening. Plain position: sticky and a few lines of JS. No GSAP.

**[Live demo](https://kodza.dev/components/sticky-cards/)** · Cards · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-sticky-cards.html`](kodza-sticky-cards.html) | 2.0 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-sticky-cards.css`](kodza-sticky-cards.css) | 8.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-sticky-cards.js`](kodza-sticky-cards.js) | 5.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-sticky-cards.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-sticky-cards.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/sticky-cards/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Stack my testimonials as Kodza Sticky Cards.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-stack` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-stack-bg` | `#ffffff` |  |
| `--kz-stack-fg` | `#0a0a0a` |  |
| `--kz-stack-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-stack-border` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-stack-shade` | `#0a0a0a` |  |
| `--kz-stack-top` | `10vh` |  |
| `--kz-stack-offset` | `18px` |  |
| `--kz-stack-height` | `72vh` |  |
| `--kz-stack-gap` | `12vh` |  |
| `--kz-stack-scale` | `0.08` |  |
| `--kz-stack-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-stack-pad` | `28px` |  |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-stack {
    --kz-stack-bg: #161616;
    --kz-stack-fg: #f2f2f0;
    --kz-stack-muted: rgba(242, 242, 240, 0.62);
    --kz-stack-border: rgba(255, 255, 255, 0.12);
    --kz-stack-shade: #000000;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
