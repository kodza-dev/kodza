# Product Card

[![Product Card, live on kodza.dev](https://kodza.dev/anim/product-card/og.jpg)](https://kodza.dev/components/product-card/)

A shop grid card: the second photo rises on hover (a swipe on phones), colour swatches swap the photos in place, and Add rolls into the sizes and sends the form to the cart.

**[Live demo](https://kodza.dev/components/product-card/)** · E-commerce · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-product-card.html`](kodza-product-card.html) | 3.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-product-card.css`](kodza-product-card.css) | 24.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-product-card.js`](kodza-product-card.js) | 23.0 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-product-card.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-product-card.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/product-card/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Product Card to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-product-card` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-product-card-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-product-card-muted` | `color-mix(in srgb, var(--kz-product-card-fg) 62%, transparent)` |  |
| `--kz-product-card-line` | `color-mix(in srgb, var(--kz-product-card-fg) 14%, transparent)` |  |
| `--kz-product-card-soft` | `color-mix(in srgb, var(--kz-product-card-fg) 5%, transparent)` |  |
| `--kz-product-card-paper` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-product-card-ink` | `var(--kz-color-accent, var(--kz-product-card-fg))` |  |
| `--kz-product-card-on-ink` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-product-card-width` | `360px` | the most it takes; a grid column can make it narrower |
| `--kz-product-card-radius` | `calc(14px * var(--kz-radius-scale, 1))` |  |
| `--kz-product-card-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-alt` (e.g. `A long, low sofa in chalk-white bouclé`, `A long, low sofa in stone-grey bouclé`, `A long, low sofa in ink-black bouclé`), `data-count`, `data-currency` (e.g. `EUR`), `data-id`, `data-image` (e.g. `https://kodza.dev/media/shop/kz-shop-sofa-chalk-800.webp`, `https://kodza.dev/media/shop/kz-shop-sofa-stone-800.webp`, `https://kodza.dev/media/shop/kz-shop-sofa-ink-800.webp`), `data-image-second` (e.g. `https://kodza.dev/media/shop/kz-shop-sofa-chalk-b-800.webp`, `https://kodza.dev/media/shop/kz-shop-sofa-stone-b-800.webp`, `https://kodza.dev/media/shop/kz-shop-sofa-ink-b-800.webp`), `data-kodza-cart-add`, `data-price` (e.g. `129000`), `data-title` (e.g. `Low Sofa`), `data-url` (e.g. `/products/low-sofa`)
- Events: `kodza:cart-change`, `kodza:cart-add`, `kodza:cart-update`, `kodza:cart-open`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-product-card {
    --kz-product-card-fg: #f2f2f0;
    --kz-product-card-muted: rgba(242, 242, 240, 0.62);
    --kz-product-card-line: rgba(255, 255, 255, 0.14);
    --kz-product-card-soft: rgba(255, 255, 255, 0.06);
    --kz-product-card-paper: #161616;
    --kz-product-card-ink: #f2f2f0;
    --kz-product-card-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On Add, with sizes | `Enter` / `Space` | Shows the sizes, focus goes to the first one in stock |
| On a size | `ArrowRight` / `ArrowLeft` | Next or previous size in stock |
|  | `Enter` / `Space` | Adds that size to the cart, Added rolls in |
|  | `Escape` | Hides the sizes, focus back on Add |
| On a colour | `ArrowRight` / `ArrowLeft` | Next or previous colour, the photo swaps in place |

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
