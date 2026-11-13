# Cart Drawer

[![Cart Drawer, live on kodza.dev](https://kodza.dev/anim/cart-drawer/og.jpg)](https://kodza.dev/components/cart-drawer/)

Side cart for a shop: an added product flies into the bag, the drawer opens and the line slides in. Quantities change in place, Undo after a removal, prices roll, free shipping fills up.

**[Live demo](https://kodza.dev/components/cart-drawer/)** · E-commerce · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-cart-drawer.html`](kodza-cart-drawer.html) | 3.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-cart-drawer.css`](kodza-cart-drawer.css) | 40.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-cart-drawer.js`](kodza-cart-drawer.js) | 44.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-cart-drawer.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-cart-drawer.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/cart-drawer/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Cart Drawer to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-cart-drawer` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-cart-drawer-bg` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-cart-drawer-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-cart-drawer-muted` | `color-mix(in srgb, var(--kz-cart-drawer-fg) 62%, transparent)` |  |
| `--kz-cart-drawer-line` | `color-mix(in srgb, var(--kz-cart-drawer-fg) 10%, transparent)` |  |
| `--kz-cart-drawer-soft` | `color-mix(in srgb, var(--kz-cart-drawer-fg) 5%, transparent)` |  |
| `--kz-cart-drawer-ink` | `var(--kz-color-accent, var(--kz-cart-drawer-fg))` |  |
| `--kz-cart-drawer-on-ink` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-cart-drawer-backdrop` | `rgba(10, 10, 10, 0.3)` |  |
| `--kz-cart-drawer-width` | `440px` |  |
| `--kz-cart-drawer-radius` | `calc(20px * var(--kz-radius-scale, 1))` |  |
| `--kz-cart-drawer-duration` | `0.6s` |  |
| `--kz-cart-drawer-ease` | `cubic-bezier(0.32, 0.72, 0, 1)` |  |

- Attributes: `data-count` (e.g. `0`), `data-currency` (e.g. `EUR`), `data-free-shipping` (e.g. `15000`), `data-html`, `data-id`, `data-key`, `data-locale`, `data-price` (e.g. `8900`, `12900`), `data-shown`, `data-step`, `data-title` (e.g. `Dome Lamp`, `Drum Pouf`), `data-url` (e.g. `#lamp`, `#pouf`)
- Events: `kodza:cart-change`, `kodza:cart-add`, `kodza:cart-update`, `kodza:cart-open`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-cart-drawer {
    --kz-cart-drawer-bg: #161616;
    --kz-cart-drawer-fg: #f2f2f0;
    --kz-cart-drawer-muted: rgba(242, 242, 240, 0.62);
    --kz-cart-drawer-line: rgba(255, 255, 255, 0.12);
    --kz-cart-drawer-soft: rgba(255, 255, 255, 0.07);
    --kz-cart-drawer-ink: #f2f2f0;
    --kz-cart-drawer-on-ink: #0a0a0a;
    --kz-cart-drawer-backdrop: rgba(0, 0, 0, 0.55);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the bag button | `Enter` / `Space` | Opens the bag, focus goes into the panel |
| On a quantity | `ArrowUp` / `ArrowDown` | One more or one less, the line and the subtotal follow |
|  | `Enter` | Applies a typed quantity, 0 removes the line |
| In the panel | `Tab` / `Shift+Tab` | Next or previous control, the page behind is out of reach |
| Anywhere, while it's open | `Escape` | Closes it, focus back where it was |

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
