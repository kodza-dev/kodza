# Product Gallery

[![Product Gallery, live on kodza.dev](undefined)](https://kodza.dev/components/product-gallery/)

The photos of a product page: each slides in from the side you head to and zooms towards the mouse, a click opens it full screen, and a colour chosen on the page switches the photos.

**[Live demo](https://kodza.dev/components/product-gallery/)** · E-commerce · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-product-gallery.html`](kodza-product-gallery.html) | 3.3 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-product-gallery.css`](kodza-product-gallery.css) | 22.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-product-gallery.js`](kodza-product-gallery.js) | 27.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-product-gallery.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-product-gallery.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/product-gallery/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Product Gallery to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-product-gallery` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-product-gallery-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-product-gallery-soft` | `color-mix(in srgb, var(--kz-product-gallery-fg) 6%, transparent)` |  |
| `--kz-product-gallery-line` | `color-mix(in srgb, var(--kz-product-gallery-fg) 14%, transparent)` |  |
| `--kz-product-gallery-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-product-gallery-thumb` | `76px` | width of a thumbnail, on the left of the photo |
| `--kz-product-gallery-gap` | `12px` |  |
| `--kz-product-gallery-ratio` | `4 / 5` |  |
| `--kz-product-gallery-ring` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-product-gallery-shade` | `rgba(10, 10, 10, 0.9)` |  |
| `--kz-product-gallery-viewer-fg` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-product-gallery-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-colour` (e.g. `Chalk`, `Stone`, `Ink`), `data-full` (e.g. `https://kodza.dev/media/shop/kz-shop-chair-chalk-1400.webp`, `https://kodza.dev/media/shop/kz-shop-chair-chalk-b-1400.webp`, `https://kodza.dev/media/shop/kz-shop-chair-chalk-c-1400.webp`, `https://kodza.dev/media/shop/kz-shop-chair-chalk-d-1400.webp`, `https://kodza.dev/media/shop/kz-shop-chair-stone-1400.webp`, `https://kodza.dev/media/shop/kz-shop-chair-stone-b-1400.webp`), `data-product`, `data-sharp`, `data-zoom` (e.g. `2.4`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-product-gallery {
    --kz-product-gallery-fg: #f2f2f0;
    --kz-product-gallery-soft: rgba(255, 255, 255, 0.06);
    --kz-product-gallery-line: rgba(255, 255, 255, 0.14);
    --kz-product-gallery-ring: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

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

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
