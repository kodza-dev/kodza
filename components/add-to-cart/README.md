# Add to Cart

[![Add to Cart, live on kodza.dev](https://kodza.dev/anim/add-to-cart/og.jpg)](https://kodza.dev/components/add-to-cart/)

Add-to-cart button that confirms with a tick while a copy of the product picture flies into the cart icon and its count rolls up by one. Rolls back if the request fails.

**[Live demo](https://kodza.dev/components/add-to-cart/)** · Buttons · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-add-to-cart.html`](kodza-add-to-cart.html) | 0.8 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-add-to-cart.css`](kodza-add-to-cart.css) | 10.5 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-add-to-cart.js`](kodza-add-to-cart.js) | 17.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-add-to-cart.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-add-to-cart.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/add-to-cart/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Add to Cart to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-add-to-cart, .kodza-add-to-cart__cart` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-add-to-cart-bg` | `#0a0a0a` |  |
| `--kz-add-to-cart-fg` | `#ffffff` |  |
| `--kz-add-to-cart-height` | `52px` |  |
| `--kz-add-to-cart-pad-x` | `28px` |  |
| `--kz-add-to-cart-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-add-to-cart-ink` | `#0a0a0a` |  |
| `--kz-add-to-cart-paper` | `#ffffff` |  |
| `--kz-add-to-cart-cart-size` | `44px` |  |
| `--kz-add-to-cart-cart-hover` | `rgba(10, 10, 10, 0.06)` |  |

- Modifiers: `.kodza-add-to-cart--soft`
- Attributes: `data-cart`, `data-count` (e.g. `0`), `data-image`, `data-quantity`
- Events: `kodza:add`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-add-to-cart {
    --kz-add-to-cart-bg: #ffffff;
    --kz-add-to-cart-fg: #0a0a0a;
  }

  .kodza-add-to-cart__cart {
    --kz-add-to-cart-ink: #ffffff;
    --kz-add-to-cart-paper: #0a0a0a;
    --kz-add-to-cart-cart-hover: rgba(255, 255, 255, 0.1);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the button | `Enter` / `Space` | Adds the product, the picture flies to the cart |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
