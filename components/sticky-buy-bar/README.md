# Sticky Buy Bar

[![Sticky Buy Bar, live on kodza.dev](undefined)](https://kodza.dev/components/sticky-buy-bar/)

A bar that comes up from the bottom once the page's Add to cart has scrolled away: picture, name, variant, price and the same button. Never over the footer or the open cart.

**[Live demo](https://kodza.dev/components/sticky-buy-bar/)** · E-commerce · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-sticky-buy-bar.html`](kodza-sticky-buy-bar.html) | 0.6 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-sticky-buy-bar.css`](kodza-sticky-buy-bar.css) | 10.5 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-sticky-buy-bar.js`](kodza-sticky-buy-bar.js) | 22.0 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-sticky-buy-bar.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-sticky-buy-bar.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/sticky-buy-bar/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Sticky Buy Bar to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-sticky-buy-bar` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-sticky-buy-bar-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-sticky-buy-bar-muted` | `color-mix(in srgb, var(--kz-sticky-buy-bar-fg) 62%, transparent)` |  |
| `--kz-sticky-buy-bar-line` | `color-mix(in srgb, var(--kz-sticky-buy-bar-fg) 12%, transparent)` |  |
| `--kz-sticky-buy-bar-paper` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-sticky-buy-bar-ink` | `var(--kz-color-accent, var(--kz-sticky-buy-bar-fg))` |  |
| `--kz-sticky-buy-bar-on-ink` | `var(--kz-color-on-accent, var(--kz-sticky-buy-bar-paper))` |  |
| `--kz-sticky-buy-bar-width` | `560px` |  |
| `--kz-sticky-buy-bar-gap` | `12px` |  |
| `--kz-sticky-buy-bar-layer` | `40` | z-index: under a modal (the Cart Drawer's dialog), above the page |
| `--kz-sticky-buy-bar-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-count`, `data-currency`, `data-id`, `data-image`, `data-price`, `data-target`, `data-until` (e.g. `footer`)
- Events: `kodza:cart-change`, `kodza:cart-add`, `kodza:cart-update`, `kodza:cart-open`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-sticky-buy-bar {
    --kz-sticky-buy-bar-fg: #f2f2f0;
    --kz-sticky-buy-bar-muted: rgba(242, 242, 240, 0.62);
    --kz-sticky-buy-bar-line: rgba(255, 255, 255, 0.12);
    --kz-sticky-buy-bar-paper: #161616;
    --kz-sticky-buy-bar-ink: #f2f2f0;
    --kz-sticky-buy-bar-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

Every colour is a variable: --kz-sticky-buy-bar-fg, -muted, -line, -paper, -ink and -on-ink. The demo's dark part has the recipe.

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
