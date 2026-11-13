# Quick View

[![Quick View, live on kodza.dev](undefined)](https://kodza.dev/components/quick-view/)

Shop card whose photo grows into a window with a short buy form: colour, size, Add to cart. Escape or the veil send it back into its card, which keeps the chosen colour. A sheet on phones.

**[Live demo](https://kodza.dev/components/quick-view/)** · E-commerce · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-quick-view.html`](kodza-quick-view.html) | 4.4 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-quick-view.css`](kodza-quick-view.css) | 45.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-quick-view.js`](kodza-quick-view.js) | 30.3 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-quick-view.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-quick-view.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/quick-view/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Quick View to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-quick-view` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-quick-view-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-quick-view-muted` | `color-mix(in srgb, var(--kz-quick-view-fg) 62%, transparent)` |  |
| `--kz-quick-view-line` | `color-mix(in srgb, var(--kz-quick-view-fg) 14%, transparent)` |  |
| `--kz-quick-view-soft` | `color-mix(in srgb, var(--kz-quick-view-fg) 5%, transparent)` |  |
| `--kz-quick-view-paper` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-quick-view-ink` | `var(--kz-color-accent, var(--kz-quick-view-fg))` |  |
| `--kz-quick-view-on-ink` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-quick-view-backdrop` | `rgba(10, 10, 10, 0.32)` |  |
| `--kz-quick-view-width` | `360px` | the card; a grid column can make it narrower |
| `--kz-quick-view-window` | `880px` | the window, at most |
| `--kz-quick-view-radius` | `calc(14px * var(--kz-radius-scale, 1))` | the card's photo |
| `--kz-quick-view-window-radius` | `calc(20px * var(--kz-radius-scale, 1))` |  |
| `--kz-quick-view-duration` | `0.64s` | the veil and the sheet; the window's grow is in the script |
| `--kz-quick-view-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-quick-view-sheet-ease` | `cubic-bezier(0.32, 0.72, 0, 1)` |  |

- Attributes: `data-alt` (e.g. `A long, low sofa in chalk-white bouclé`, `A long, low sofa in stone-grey bouclé`, `A long, low sofa in ink-black bouclé`), `data-card-image` (e.g. `https://kodza.dev/media/shop/kz-shop-sofa-chalk-800.webp`, `https://kodza.dev/media/shop/kz-shop-sofa-stone-800.webp`, `https://kodza.dev/media/shop/kz-shop-sofa-ink-800.webp`), `data-count`, `data-currency` (e.g. `EUR`), `data-id`, `data-image` (e.g. `https://kodza.dev/media/shop/kz-shop-sofa-chalk-1400.webp`, `https://kodza.dev/media/shop/kz-shop-sofa-stone-1400.webp`, `https://kodza.dev/media/shop/kz-shop-sofa-ink-1400.webp`), `data-kodza-cart-add`, `data-price` (e.g. `129000`, `159000`, `219000`), `data-title` (e.g. `Low Sofa`), `data-url` (e.g. `/products/low-sofa`)
- Events: `kodza:cart-change`, `kodza:cart-add`, `kodza:cart-update`, `kodza:cart-open`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-quick-view {
    --kz-quick-view-fg: #f2f2f0;
    --kz-quick-view-muted: rgba(242, 242, 240, 0.62);
    --kz-quick-view-line: rgba(255, 255, 255, 0.14);
    --kz-quick-view-soft: rgba(255, 255, 255, 0.06);
    --kz-quick-view-paper: #161616;
    --kz-quick-view-ink: #f2f2f0;
    --kz-quick-view-on-ink: #0a0a0a;
    --kz-quick-view-backdrop: rgba(0, 0, 0, 0.6);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On Quick view | `Enter` / `Space` | Opens the window, focus goes into it |
| On a colour or a size | `ArrowLeft` / `ArrowRight` | Previous or next choice, the photo or the price follows |
| In the window | `Tab` / `Shift+Tab` | Next or previous control, the page behind is out of reach |
| Anywhere, while it's open | `Escape` | Sends it back into its card, focus back on Quick view |

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
