# Header Overlay

[![Header Overlay, live on kodza.dev](https://kodza.dev/anim/header-overlay/og.jpg)](https://kodza.dev/components/header-overlay/)

A transparent header over the hero photo: once the hero passes under it, a solid bar comes down and the text turns dark along its edge; below 900 px, a full-screen menu.

**[Live demo](https://kodza.dev/components/header-overlay/)** · Header · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-header-overlay.html`](kodza-header-overlay.html) | 3.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-header-overlay.css`](kodza-header-overlay.css) | 37.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-header-overlay.js`](kodza-header-overlay.js) | 36.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-header-overlay.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-header-overlay.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/header-overlay/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Header Overlay to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-header-overlay` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-header-overlay-fg` | `#ffffff` |  |
| `--kz-header-overlay-muted` | `rgba(255, 255, 255, 0.78)` |  |
| `--kz-header-overlay-soft` | `rgba(255, 255, 255, 0.16)` | the Menu button |
| `--kz-header-overlay-cta-bg` | `#ffffff` |  |
| `--kz-header-overlay-cta-fg` | `#0a0a0a` |  |
| `--kz-header-overlay-veil` | `rgba(0, 0, 0, 0.32)` | a shade at the top of the photo, so white reads |
| `--kz-header-overlay-solid-bg` | `#f2f2f0` |  |
| `--kz-header-overlay-solid-fg` | `#0a0a0a` |  |
| `--kz-header-overlay-solid-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-header-overlay-solid-soft` | `rgba(10, 10, 10, 0.06)` |  |
| `--kz-header-overlay-solid-rule` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-header-overlay-solid-cta-bg` | `#0a0a0a` |  |
| `--kz-header-overlay-solid-cta-fg` | `#ffffff` |  |
| `--kz-header-overlay-top` | `var(--wp-admin--admin-bar--height, 0px)` | below the WordPress admin bar |
| `--kz-header-overlay-height` | `76px` |  |
| `--kz-header-overlay-width` | `1200px` | the row, centred |
| `--kz-header-overlay-pad` | `24px` |  |
| `--kz-header-overlay-duration` | `0.7s` | the blind |
| `--kz-header-overlay-ease` | `cubic-bezier(0.33, 1, 0.68, 1)` | off at once: it answers the scroll |
| `--kz-header-overlay-menu-bg` | `#0a0a0a` |  |
| `--kz-header-overlay-menu-fg` | `#f2f2f0` |  |
| `--kz-header-overlay-menu-muted` | `rgba(242, 242, 240, 0.62)` |  |
| `--kz-header-overlay-menu-top` | `calc(var(--wp-admin--admin-bar--height, 0px) + 18px)` | Close lands on Menu on its own; this is where it goes if Menu is somewhere else |
| `--kz-header-overlay-menu-side` | `24px` |  |
| `--kz-header-overlay-menu-size` | `clamp(40px, min(10cqw + 12px, calc((100cqh - 230px) / 5.3)), 132px)` |  |
| `--kz-header-overlay-menu-curve` | `1` | how far the edge bends on the way; 0 = a straight edge |
| `--kz-header-overlay-menu-shade` | `0.5` | how dark the page gets under it |
| `--kz-header-overlay-menu-depth` | `0.94` | the page's size once covered |
| `--kz-header-overlay-menu-duration` | `1s` |  |
| `--kz-header-overlay-menu-ease` | `cubic-bezier(0.76, 0, 0.24, 1)` |  |
| `--kz-header-overlay-page` | `auto` | the page colour while it backs off; auto = the first background above it |

- Attributes: `data-hero`, `data-page`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-header-overlay {
    --kz-header-overlay-solid-bg: #0a0a0a;
    --kz-header-overlay-solid-fg: #f2f2f0;
    --kz-header-overlay-solid-muted: rgba(242, 242, 240, 0.62);
    --kz-header-overlay-solid-soft: rgba(242, 242, 240, 0.08);
    --kz-header-overlay-solid-rule: rgba(242, 242, 240, 0.12);
    --kz-header-overlay-solid-cta-bg: #f2f2f0;
    --kz-header-overlay-solid-cta-fg: #0a0a0a;
    --kz-header-overlay-menu-bg: #f2f2f0;
    --kz-header-overlay-menu-fg: #0a0a0a;
    --kz-header-overlay-menu-muted: rgba(10, 10, 10, 0.62);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

Every colour is a variable on the header. Over the photo it is white (--kz-header-overlay-fg, -muted, -soft, -cta-bg, -cta-fg); once the blind is down, the -solid-* set takes over (bg, fg, muted, soft, rule, cta-bg, cta-fg): set those for an ink blind on a dark site. The curtain has its own --kz-header-overlay-menu-* set (bg, fg, muted), so it can turn to paper.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the Menu button, below 900 px | `Enter` / `Space` | Opens the curtain on the current link, or the first |
| In the curtain | `ArrowDown` / `ArrowUp` | Next or previous link, round and round |
|  | `Home` / `End` | First or last link |
|  | `Tab` / `Shift+Tab` | Stays inside the curtain, round and round |
|  | `PageUp` / `PageDown` | Held back, the page behind stays put |
| Anywhere, while it's open | `Escape` | Lifts the curtain, focus back on Menu |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
