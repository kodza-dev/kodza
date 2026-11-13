# Product Grid

[![Product Grid, live on kodza.dev](undefined)](https://kodza.dev/components/product-grid/)

A shop collection grid with category pills, colour dots and a sort: cards that go step back, the rest glide to their place, the count rolls and the address keeps the filters.

**[Live demo](https://kodza.dev/components/product-grid/)** · E-commerce · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-product-grid.html`](kodza-product-grid.html) | 17.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-product-grid.css`](kodza-product-grid.css) | 68.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-product-grid.js`](kodza-product-grid.js) | 48.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-product-grid.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-product-grid.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/product-grid/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Product Grid to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-product-grid` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-product-grid-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-product-grid-muted` | `color-mix(in srgb, var(--kz-product-grid-fg) 62%, transparent)` |  |
| `--kz-product-grid-line` | `color-mix(in srgb, var(--kz-product-grid-fg) 14%, transparent)` |  |
| `--kz-product-grid-soft` | `color-mix(in srgb, var(--kz-product-grid-fg) 5%, transparent)` |  |
| `--kz-product-grid-paper` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-product-grid-ink` | `var(--kz-color-accent, var(--kz-product-grid-fg))` |  |
| `--kz-product-grid-on-ink` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-product-grid-columns` | `3` | two below 640 px of room, whatever this says |
| `--kz-product-grid-gap` | `32px 20px` |  |
| `--kz-product-grid-radius` | `calc(14px * var(--kz-radius-scale, 1))` |  |
| `--kz-product-grid-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-alt` (e.g. `A long, low sofa in chalk-white bouclé`, `A long, low sofa in stone-grey bouclé`, `A long, low sofa in ink-black bouclé`, `A chalk-white mushroom lamp, its dome on a round foot`, `An ink-black mushroom lamp, its dome on a round foot`, `A chalk-white shell chair on four thin legs`), `data-category` (e.g. `seating`, `lighting`, `storage`), `data-colours` (e.g. `chalk stone ink`, `chalk ink`, `stone ink`, `chalk stone`), `data-count`, `data-currency` (e.g. `EUR`), `data-id`, `data-image` (e.g. `https://kodza.dev/media/shop/kz-shop-sofa-chalk-800.webp`, `https://kodza.dev/media/shop/kz-shop-sofa-stone-800.webp`, `https://kodza.dev/media/shop/kz-shop-sofa-ink-800.webp`, `https://kodza.dev/media/shop/kz-shop-lamp-chalk-800.webp`, `https://kodza.dev/media/shop/kz-shop-lamp-ink-800.webp`, `https://kodza.dev/media/shop/kz-shop-chair-chalk-800.webp`), `data-image-second` (e.g. `https://kodza.dev/media/shop/kz-shop-sofa-chalk-b-800.webp`, `https://kodza.dev/media/shop/kz-shop-sofa-stone-b-800.webp`, `https://kodza.dev/media/shop/kz-shop-sofa-ink-b-800.webp`, `https://kodza.dev/media/shop/kz-shop-lamp-chalk-b-800.webp`, `https://kodza.dev/media/shop/kz-shop-lamp-ink-b-800.webp`, `https://kodza.dev/media/shop/kz-shop-chair-chalk-b-800.webp`), `data-kodza-cart-add`, `data-price` (e.g. `129000`, `28900`, `39000`, `27500`, `18900`), `data-title` (e.g. `Low Sofa`, `Dome Lamp`, `Shell Chair`, `Tool Trolley`, `Round Pouf`), `data-url` (e.g. `/products/low-sofa`, `/products/dome-lamp`, `/products/shell-chair`, `/products/tool-trolley`, `/products/round-pouf`)
- Events: `kodza:filter`, `kodza:cart-change`, `kodza:cart-add`, `kodza:cart-update`, `kodza:cart-open`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-product-grid {
    --kz-product-grid-fg: #f2f2f0;
    --kz-product-grid-muted: rgba(242, 242, 240, 0.62);
    --kz-product-grid-line: rgba(255, 255, 255, 0.14);
    --kz-product-grid-soft: rgba(255, 255, 255, 0.06);
    --kz-product-grid-paper: #161616;
    --kz-product-grid-ink: #f2f2f0;
    --kz-product-grid-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a category | `ArrowRight` / `ArrowLeft` | Next or previous category, the grid changes at once |
| On the sort, while it's open | `ArrowDown` / `ArrowUp` | Next or previous option, no looping |
|  | `Home` / `End` | First or last option |
|  | `PageDown` / `PageUp` | Five options down or up |
|  | a letter | Jumps to the option starting with that letter |
|  | `Enter` / `Space` | Picks the highlighted option and closes |
|  | `Tab` | Picks the highlighted option and moves on |
| On the sort | `Enter` / `Space` / `ArrowDown` / `ArrowUp` | Opens it on the current choice |
|  | a letter | Picks the option starting with that letter, no opening |
| Anywhere, while it's open | `Escape` | Closes it, focus back on the field |
| On a colour of the filters | `ArrowRight` / `ArrowLeft` | Next or previous colour, every card turns to it |
|  | `Space` | On the chosen colour, lets go of it |
| On Add, with sizes | `Enter` / `Space` | Shows the sizes, focus goes to the first one in stock |
| On a size | `ArrowRight` / `ArrowLeft` | Next or previous size in stock |
|  | `Enter` / `Space` | Adds that size to the cart, Added rolls in |
|  | `Escape` | Hides the sizes, focus back on Add |
| On a colour of a card | `ArrowRight` / `ArrowLeft` | Next or previous colour, the photo swaps in place |

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
