# Buy Box

[![Buy Box, live on kodza.dev](undefined)](https://kodza.dev/components/buy-box/)

The right-hand column of a product page as one cart form: colours and sizes in a sliding ink pill, a price that rolls with the size, quantity, Add to cart, a ships-today line and folding details.

**[Live demo](https://kodza.dev/components/buy-box/)** · E-commerce · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-buy-box.html`](kodza-buy-box.html) | 5.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-buy-box.css`](kodza-buy-box.css) | 40.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-buy-box.js`](kodza-buy-box.js) | 29.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-buy-box.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-buy-box.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/buy-box/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Buy Box to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-buy-box` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-buy-box-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-buy-box-muted` | `color-mix(in srgb, var(--kz-buy-box-fg) 62%, transparent)` |  |
| `--kz-buy-box-line` | `color-mix(in srgb, var(--kz-buy-box-fg) 14%, transparent)` |  |
| `--kz-buy-box-soft` | `color-mix(in srgb, var(--kz-buy-box-fg) 5%, transparent)` |  |
| `--kz-buy-box-paper` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-buy-box-ink` | `var(--kz-color-accent, var(--kz-buy-box-fg))` |  |
| `--kz-buy-box-on-ink` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-buy-box-width` | `440px` | the most it takes; a column can make it narrower |
| `--kz-buy-box-title-size` | `clamp(28px, 3.2vw, 38px)` |  |
| `--kz-buy-box-control` | `52px` | the height of the quantity and of Add to cart |
| `--kz-buy-box-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-count`, `data-currency` (e.g. `EUR`), `data-cutoff` (e.g. `14:00`), `data-id` (e.g. `shell-chair`), `data-image` (e.g. `https://kodza.dev/media/shop/kz-shop-chair-chalk-800.webp`, `https://kodza.dev/media/shop/kz-shop-chair-stone-800.webp`, `https://kodza.dev/media/shop/kz-shop-chair-ink-800.webp`), `data-kodza-cart-add`, `data-now`, `data-price` (e.g. `39000`, `44000`, `46000`), `data-ship-days` (e.g. `mon-fri`), `data-step` (e.g. `-1`, `1`), `data-timezone` (e.g. `Europe/Paris`), `data-title` (e.g. `Shell Chair`), `data-url` (e.g. `/products/shell-chair`)
- Events: `kodza:variant-change`, `kodza:cart-change`, `kodza:cart-add`, `kodza:cart-update`, `kodza:cart-open`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-buy-box {
    --kz-buy-box-fg: #f2f2f0;
    --kz-buy-box-muted: rgba(242, 242, 240, 0.62);
    --kz-buy-box-line: rgba(255, 255, 255, 0.14);
    --kz-buy-box-soft: rgba(255, 255, 255, 0.06);
    --kz-buy-box-paper: #0a0a0a;
    --kz-buy-box-ink: #f2f2f0;
    --kz-buy-box-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a colour | `ArrowRight` / `ArrowLeft` | Next or previous colour, its name rolls in |
| On a size | `ArrowRight` / `ArrowLeft` | Next or previous size in stock, the pill slides |
| In the quantity | `ArrowUp` / `ArrowDown` | One more or one less, between the limits |
| On a detail | `Enter` / `Space` | Opens or closes it, the height follows |

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
