# Header Shop

[![Header Shop, live on kodza.dev](https://kodza.dev/anim/header-shop/og.jpg)](https://kodza.dev/components/header-shop/)

A shop header: the name, the categories, a search that opens over them, the account and a bag whose count rolls when something is added. Below 900 px, a menu the page steps aside for.

**[Live demo](https://kodza.dev/components/header-shop/)** · Header · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-header-shop.html`](kodza-header-shop.html) | 3.9 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-header-shop.css`](kodza-header-shop.css) | 45.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-header-shop.js`](kodza-header-shop.js) | 38.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-header-shop.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-header-shop.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/header-shop/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Header Shop to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-header-shop` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-header-shop-bg` | `#f2f2f0` |  |
| `--kz-header-shop-fg` | `#0a0a0a` |  |
| `--kz-header-shop-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-header-shop-soft` | `rgba(10, 10, 10, 0.06)` | the round buttons under the pointer, the Menu button |
| `--kz-header-shop-rule` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-header-shop-field` | `color-mix(in srgb, var(--kz-header-shop-fg) 6%, var(--kz-header-shop-bg))` | the search field |
| `--kz-header-shop-top` | `var(--wp-admin--admin-bar--height, 0px)` | below the WordPress admin bar |
| `--kz-header-shop-height` | `72px` |  |
| `--kz-header-shop-width` | `1200px` | the row, centred |
| `--kz-header-shop-pad` | `24px` |  |
| `--kz-header-shop-search-duration` | `0.6s` |  |
| `--kz-header-shop-search-ease` | `cubic-bezier(0.76, 0, 0.24, 1)` |  |
| `--kz-header-shop-menu-bg` | `#0a0a0a` |  |
| `--kz-header-shop-menu-fg` | `#f2f2f0` |  |
| `--kz-header-shop-menu-muted` | `rgba(242, 242, 240, 0.62)` |  |
| `--kz-header-shop-menu-top` | `calc(var(--wp-admin--admin-bar--height, 0px) + 20px)` | Close lands on Menu on its own; this is where it goes if Menu is somewhere else |
| `--kz-header-shop-menu-side` | `24px` |  |
| `--kz-header-shop-menu-width` | `min(clamp(340px, 40cqw, 560px), calc(100cqw - 56px))` |  |
| `--kz-header-shop-menu-size` | `clamp(36px, min(4.6cqw + 8px, calc((100cqh - 300px) / 6.6)), 72px)` |  |
| `--kz-header-shop-menu-depth` | `0.88` | the page's size once it has stepped aside |
| `--kz-header-shop-menu-shadow` | `0 32px 80px -24px rgba(0, 0, 0, 0.45)` |  |
| `--kz-header-shop-menu-shade` | `0.5` | how dark the page gets when the menu slides over it |
| `--kz-header-shop-menu-duration` | `1s` |  |
| `--kz-header-shop-menu-ease` | `cubic-bezier(0.76, 0, 0.24, 1)` |  |
| `--kz-header-shop-page` | `auto` | the page colour while it steps aside; auto = the first background above it |

- Attributes: `data-close` (e.g. `Close search`), `data-count` (e.g. `0`, `2`), `data-page`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-header-shop {
    --kz-header-shop-bg: #0a0a0a;
    --kz-header-shop-fg: #f2f2f0;
    --kz-header-shop-muted: rgba(242, 242, 240, 0.62);
    --kz-header-shop-soft: rgba(242, 242, 240, 0.08);
    --kz-header-shop-rule: rgba(242, 242, 240, 0.12);
    --kz-header-shop-menu-bg: #f2f2f0;
    --kz-header-shop-menu-fg: #0a0a0a;
    --kz-header-shop-menu-muted: rgba(10, 10, 10, 0.62);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

Every colour is a variable on the header: --kz-header-shop-bg, -fg, -muted, -soft and -rule (the search field is worked out from them). Set those for an ink bar on a dark site. The phone menu has its own --kz-header-shop-menu-* set (bg, fg, muted), so it can turn to paper.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the glass | `Enter` / `Space` | Opens the search over the categories, or folds it |
| In the search field | `Enter` | Searches the shop |
|  | `Escape` | Folds the search, focus back on the glass |
| On the Menu button, below 900 px | `Enter` / `Space` | Opens the menu on the current link, or the first |
| In the menu | `ArrowDown` / `ArrowUp` | Next or previous link, round and round |
|  | `Home` / `End` | First or last link |
|  | `Tab` / `Shift+Tab` | Stays inside the menu, round and round |
|  | `PageUp` / `PageDown` | Held back, the page behind stays put |
| Anywhere, while it's open | `Escape` | Brings the page back, focus back on Menu |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
