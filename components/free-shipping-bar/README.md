# Free Shipping Bar

[![Free Shipping Bar, live on kodza.dev](undefined)](https://kodza.dev/components/free-shipping-bar/)

A free shipping progress bar that listens to the cart: the amount left rolls digit by digit, a small van rides the line, and the sentence rolls into a thank-you once the threshold is met.

**[Live demo](https://kodza.dev/components/free-shipping-bar/)** · E-commerce · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-free-shipping-bar.html`](kodza-free-shipping-bar.html) | 0.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-free-shipping-bar.css`](kodza-free-shipping-bar.css) | 8.8 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-free-shipping-bar.js`](kodza-free-shipping-bar.js) | 20.7 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-free-shipping-bar.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-free-shipping-bar.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/free-shipping-bar/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Free Shipping Bar to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-free-shipping-bar` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-free-shipping-bar-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-free-shipping-bar-muted` | `color-mix(in srgb, var(--kz-free-shipping-bar-fg) 62%, transparent)` |  |
| `--kz-free-shipping-bar-line` | `color-mix(in srgb, var(--kz-free-shipping-bar-fg) 12%, transparent)` |  |
| `--kz-free-shipping-bar-ink` | `var(--kz-color-accent, var(--kz-free-shipping-bar-fg))` |  |
| `--kz-free-shipping-bar-width` | `380px` |  |
| `--kz-free-shipping-bar-van` | `20px` | the van, and how high the road is |
| `--kz-free-shipping-bar-duration` | `calc(0.8s * var(--kz-motion-scale, 1))` |  |
| `--kz-free-shipping-bar-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-free-shipping-bar-band-bg` | `var(--kz-color-accent, var(--kz-color-ink, #0a0a0a))` |  |
| `--kz-free-shipping-bar-band-fg` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-free-shipping-bar-band-height` | `44px` |  |
| `--kz-free-shipping-bar-band-road` | `120px` |  |

- Modifiers: `.kodza-free-shipping-bar--band`
- Attributes: `data-count`, `data-currency` (e.g. `EUR`), `data-html`, `data-id`, `data-locale`, `data-shown`, `data-threshold` (e.g. `15000`)
- Events: `kodza:cart-change`, `kodza:cart-add`, `kodza:cart-update`, `kodza:cart-open`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-free-shipping-bar {
    --kz-free-shipping-bar-fg: #f2f2f0;
    --kz-free-shipping-bar-muted: rgba(242, 242, 240, 0.62);
    --kz-free-shipping-bar-line: rgba(255, 255, 255, 0.14);
    --kz-free-shipping-bar-ink: #f2f2f0;
    --kz-free-shipping-bar-band-bg: #f2f2f0;
    --kz-free-shipping-bar-band-fg: #0a0a0a;
  }

  .kodza-free-shipping-bar--band {
    --kz-free-shipping-bar-fg: #0a0a0a;
    --kz-free-shipping-bar-muted: rgba(10, 10, 10, 0.68);
    --kz-free-shipping-bar-line: rgba(10, 10, 10, 0.2);
    --kz-free-shipping-bar-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
