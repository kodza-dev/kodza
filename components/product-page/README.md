# Product Page

[![Product Page, live on kodza.dev](undefined)](https://kodza.dev/components/product-page/)

A whole product page in one block: photos held in view while the buy box scrolls past, colours that switch the photos, the reviews, You may also like, and on a phone a bar with Add to cart once the buy box has gone.

**[Live demo](https://kodza.dev/components/product-page/)** · E-commerce · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-product-page.html`](kodza-product-page.html) | 36.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-product-page.css`](kodza-product-page.css) | 147.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-product-page.js`](kodza-product-page.js) | 89.9 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-product-page.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-product-page.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/product-page/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Product Page to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-product-page` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-product-page-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-product-page-muted` | `color-mix(in srgb, var(--kz-product-page-fg) 62%, transparent)` |  |
| `--kz-product-page-line` | `color-mix(in srgb, var(--kz-product-page-fg) 12%, transparent)` |  |
| `--kz-product-page-paper` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-product-page-ink` | `var(--kz-color-accent, var(--kz-product-page-fg))` |  |
| `--kz-product-page-on-ink` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-product-page-width` | `var(--kz-page-width, 1440px)` | the edge of the content |
| `--kz-product-page-gutter` | `var(--kz-page-gutter, clamp(16px, 4vw, 40px))` | from the screen's edges |
| `--kz-product-page-photos` | `1fr` | the photos' column: all the room the buy box leaves (or a cap, 760px) |
| `--kz-product-page-side` | `420px` | the most the buy box takes |
| `--kz-product-page-gap` | `clamp(32px, 5vw, 80px)` | between the photos and the buy box |
| `--kz-product-page-sticky` | `24px` | the photos stay this far from the top while the buy box scrolls |
| `--kz-product-page-pad-y` | `clamp(24px, 4vw, 56px)` |  |
| `--kz-product-page-related` | `4` | cards in a row under "You may also like" |
| `--kz-product-page-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-alt` (e.g. `A chalk-white mushroom lamp, its dome on a round foot`, `An ink-black mushroom lamp, its dome on a round foot`, `A chalk-white round pouf, low and soft`, `A stone-grey round pouf, low and soft`, `A stone-grey three-tier trolley on castors`, `An ink-black three-tier trolley on castors`), `data-colour` (e.g. `Chalk`, `Stone`, `Ink`), `data-count`, `data-currency` (e.g. `EUR`), `data-cutoff` (e.g. `14:00`), `data-full` (e.g. `https://kodza.dev/media/shop/kz-shop-chair-chalk-1400.webp`, `https://kodza.dev/media/shop/kz-shop-chair-chalk-b-1400.webp`, `https://kodza.dev/media/shop/kz-shop-chair-chalk-c-1400.webp`, `https://kodza.dev/media/shop/kz-shop-chair-chalk-d-1400.webp`, `https://kodza.dev/media/shop/kz-shop-chair-stone-1400.webp`, `https://kodza.dev/media/shop/kz-shop-chair-stone-b-1400.webp`), `data-id` (e.g. `shell-chair`), `data-image` (e.g. `https://kodza.dev/media/shop/kz-shop-chair-chalk-800.webp`, `https://kodza.dev/media/shop/kz-shop-chair-stone-800.webp`, `https://kodza.dev/media/shop/kz-shop-chair-ink-800.webp`, `https://kodza.dev/media/shop/kz-shop-lamp-chalk-800.webp`, `https://kodza.dev/media/shop/kz-shop-lamp-ink-800.webp`, `https://kodza.dev/media/shop/kz-shop-pouf-chalk-800.webp`), `data-image-second` (e.g. `https://kodza.dev/media/shop/kz-shop-lamp-chalk-b-800.webp`, `https://kodza.dev/media/shop/kz-shop-lamp-ink-b-800.webp`, `https://kodza.dev/media/shop/kz-shop-pouf-chalk-b-800.webp`, `https://kodza.dev/media/shop/kz-shop-pouf-stone-b-800.webp`, `https://kodza.dev/media/shop/kz-shop-trolley-stone-b-800.webp`, `https://kodza.dev/media/shop/kz-shop-trolley-ink-b-800.webp`), `data-kodza-cart-add`, `data-kodza-product-page__reviews`, `data-less` (e.g. `Read less`), `data-more` (e.g. `Read more`), `data-now`, `data-price` (e.g. `39000`, `44000`, `46000`, `28900`, `18900`, `27500`), `data-product`, `data-rating` (e.g. `5`, `4`, `3`, `2`, `1`), `data-sharp`, `data-ship-days` (e.g. `mon-fri`), `data-step` (e.g. `-1`, `1`), `data-timezone` (e.g. `Europe/Paris`), `data-title` (e.g. `Shell Chair`, `Dome Lamp`, `Round Pouf`, `Tool Trolley`, `Low Sofa`), `data-url` (e.g. `/products/shell-chair`, `/products/dome-lamp`, `/products/round-pouf`, `/products/tool-trolley`, `/products/low-sofa`), `data-zoom` (e.g. `2.4`)
- Events: `kodza:variant-change`, `kodza:cart-change`, `kodza:cart-add`, `kodza:cart-update`, `kodza:cart-open`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-product-page {
    --kz-product-page-fg: #f2f2f0;
    --kz-product-page-paper: #161616;
    --kz-product-page-ink: #f2f2f0;
    --kz-product-page-on-ink: #0a0a0a;
  }

  .kodza-product-page__gallery {
    --kz-product-page-gallery-fg: #f2f2f0;
    --kz-product-page-gallery-soft: rgba(255, 255, 255, 0.06);
    --kz-product-page-gallery-line: rgba(255, 255, 255, 0.14);
    --kz-product-page-gallery-ring: #0a0a0a;
  }

  .kodza-product-page__buy {
    --kz-product-page-buy-fg: #f2f2f0;
    --kz-product-page-buy-muted: rgba(242, 242, 240, 0.62);
    --kz-product-page-buy-line: rgba(255, 255, 255, 0.14);
    --kz-product-page-buy-soft: rgba(255, 255, 255, 0.06);
    --kz-product-page-buy-paper: #0a0a0a;
    --kz-product-page-buy-ink: #f2f2f0;
    --kz-product-page-buy-on-ink: #0a0a0a;
  }

  .kodza-product-page__reviews {
    --kz-product-page-reviews-ink: #f2f2f0;
    --kz-product-page-reviews-dim: rgba(242, 242, 240, 0.66);
    --kz-product-page-reviews-card: #161616;
    --kz-product-page-reviews-line: rgba(255, 255, 255, 0.12);
    --kz-product-page-reviews-rail: rgba(255, 255, 255, 0.14);
    --kz-product-page-reviews-muted: rgba(242, 242, 240, 0.3);
    --kz-product-page-reviews-face: #2a2a2a;
    --kz-product-page-reviews-hover: rgba(255, 255, 255, 0.05);
    --kz-product-page-reviews-pressed: rgba(255, 255, 255, 0.09);
  }

  .kodza-product-page__card {
    --kz-product-page-card-fg: #f2f2f0;
    --kz-product-page-card-muted: rgba(242, 242, 240, 0.62);
    --kz-product-page-card-line: rgba(255, 255, 255, 0.14);
    --kz-product-page-card-soft: rgba(255, 255, 255, 0.06);
    --kz-product-page-card-paper: #161616;
    --kz-product-page-card-ink: #f2f2f0;
    --kz-product-page-card-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

Every colour is a variable: the page's --kz-product-page-fg, -paper, -ink and -on-ink, then each part's own (-gallery-*, -buy-*, -reviews-*, -card-*). The demo's dark part has the recipe.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a thumbnail | `ArrowDown` / `ArrowRight` | Next photo |
|  | `ArrowUp` / `ArrowLeft` | Previous photo |
|  | `Home` / `End` | First or last photo |
| On the large photo | `ArrowRight` / `ArrowLeft` | Next or previous photo |
|  | `Enter` / `Space` | Opens it full screen |
| Full screen | `ArrowRight` / `ArrowLeft` | Next or previous photo |
|  | `Escape` | Closes it, back to the photo on the page |
| On a colour | `ArrowRight` / `ArrowLeft` | Next or previous colour, its name rolls in |
| On a size | `ArrowRight` / `ArrowLeft` | Next or previous size in stock, the pill slides |
| In the quantity | `ArrowUp` / `ArrowDown` | One more or one less, between the limits |
| On a detail | `Enter` / `Space` | Opens or closes it, the height follows |
| On a bar | `Enter` / `Space` | Shows only that rating's reviews, or all of them again |
| On Show all | `Enter` / `Space` | Shows every review, focus back on the bar |
| On Read more | `Enter` / `Space` | Opens the whole review, or folds it again |
| On Add, with sizes (You may also like) | `Enter` / `Space` | Shows the sizes, focus goes to the first one in stock |
| On a size (You may also like) | `ArrowRight` / `ArrowLeft` | Next or previous size in stock |
|  | `Enter` / `Space` | Adds that size to the cart, Added rolls in |
|  | `Escape` | Hides the sizes, focus back on Add |
| On a colour (You may also like) | `ArrowRight` / `ArrowLeft` | Next or previous colour, the photo swaps in place |

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
