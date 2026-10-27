# Side Reveal Menu

[![Side Reveal Menu, live on kodza.dev](https://kodza.dev/anim/side-reveal-menu/og.jpg)](https://kodza.dev/components/side-reveal-menu/)

A menu under the page: the page slides left and shrinks into a card, the menu was underneath, and each link rises as the page's edge passes. A click on the card closes it.

**[Live demo](https://kodza.dev/components/side-reveal-menu/)** · Navigation · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-side-reveal-menu.html`](kodza-side-reveal-menu.html) | 2.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-side-reveal-menu.css`](kodza-side-reveal-menu.css) | 18.8 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-side-reveal-menu.js`](kodza-side-reveal-menu.js) | 30.3 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-side-reveal-menu.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-side-reveal-menu.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/side-reveal-menu/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Side Reveal Menu to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-side-reveal` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-side-reveal-bg` | `#0a0a0a` | the menu, under the page |
| `--kz-side-reveal-fg` | `#f2f2f0` |  |
| `--kz-side-reveal-muted` | `rgba(242, 242, 240, 0.62)` |  |
| `--kz-side-reveal-ink` | `#0a0a0a` | the Menu button, on the page |
| `--kz-side-reveal-on-ink` | `#ffffff` |  |
| `--kz-side-reveal-page` | `auto` | the page colour while it steps aside; auto = the first background above it |
| `--kz-side-reveal-top` | `calc(var(--wp-admin--admin-bar--height, 0px) + 20px)` | match your header, so Close lands right where Menu was (below the WordPress admin bar) |
| `--kz-side-reveal-side` | `24px` |  |
| `--kz-side-reveal-width` | `min(clamp(340px, 40cqw, 560px), calc(100cqw - 56px))` | the menu column; on a phone a strip of the page stays in view |
| `--kz-side-reveal-size` | `clamp(36px, min(4.6cqw + 8px, calc((100cqh - 300px) / 5.6)), 72px)` |  |
| `--kz-side-reveal-depth` | `0.88` | the page's size once aside |
| `--kz-side-reveal-shadow` | `0 32px 80px -24px rgba(0, 0, 0, 0.45)` | under the card, seen on a light menu |
| `--kz-side-reveal-shade` | `0.5` | without a page: how dark the page gets under the menu |
| `--kz-side-reveal-duration` | `1s` |  |
| `--kz-side-reveal-ease` | `cubic-bezier(0.76, 0, 0.24, 1)` |  |

- Attributes: `data-page`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-side-reveal {
    --kz-side-reveal-bg: #f2f2f0;
    --kz-side-reveal-fg: #0a0a0a;
    --kz-side-reveal-muted: rgba(10, 10, 10, 0.62);
    --kz-side-reveal-ink: #f2f2f0;
    --kz-side-reveal-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the button | `Enter` / `Space` | Opens it on the current link, or the first |
| In the menu | `ArrowDown` / `ArrowUp` | Next or previous link, round and round |
|  | `Home` / `End` | First or last link |
|  | `Tab` / `Shift+Tab` | Stays inside the menu, round and round |
|  | `PageUp` / `PageDown` | Held back, the page behind stays put |
| Anywhere, while it's open | `Escape` | Brings the page back, focus back on Menu |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
