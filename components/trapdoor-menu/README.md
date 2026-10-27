# Trapdoor Menu

[![Trapdoor Menu, live on kodza.dev](https://kodza.dev/anim/trapdoor-menu/og.jpg)](https://kodza.dev/components/trapdoor-menu/)

Press Menu and the page swings down on its hinge like a trapdoor, showing the menu underneath: links rise as the edge passes them, an image follows your pointer. Closing replays it backwards. No GSAP.

**[Live demo](https://kodza.dev/components/trapdoor-menu/)** · Navigation · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-trapdoor-menu.html`](kodza-trapdoor-menu.html) | 3.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-trapdoor-menu.css`](kodza-trapdoor-menu.css) | 19.0 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-trapdoor-menu.js`](kodza-trapdoor-menu.js) | 32.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-trapdoor-menu.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-trapdoor-menu.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/trapdoor-menu/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Trapdoor Menu to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-trapdoor` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-trapdoor-bg` | `#0a0a0a` | the menu, under the page |
| `--kz-trapdoor-fg` | `#f2f2f0` |  |
| `--kz-trapdoor-muted` | `rgba(242, 242, 240, 0.62)` |  |
| `--kz-trapdoor-line` | `rgba(242, 242, 240, 0.16)` |  |
| `--kz-trapdoor-ink` | `#0a0a0a` | the Menu button, on the page |
| `--kz-trapdoor-on-ink` | `#ffffff` |  |
| `--kz-trapdoor-page` | `auto` | the page colour while it tips; auto = the first background above it |
| `--kz-trapdoor-top` | `calc(var(--wp-admin--admin-bar--height, 0px) + 20px)` | match your header, so Close lands right where Menu was (below the WordPress admin bar) |
| `--kz-trapdoor-side` | `24px` |  |
| `--kz-trapdoor-size` | `clamp(28px, min(7.4cqw, calc(16cqh - 46px)), 104px)` |  |
| `--kz-trapdoor-angle` | `84deg` | how far the page tips back |
| `--kz-trapdoor-shade` | `0.6` | how dark it gets on the way down |
| `--kz-trapdoor-duration` | `1.1s` |  |
| `--kz-trapdoor-ease` | `cubic-bezier(0.76, 0, 0.24, 1)` |  |

- Attributes: `data-page`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-trapdoor {
    --kz-trapdoor-bg: #f2f2f0;
    --kz-trapdoor-fg: #0a0a0a;
    --kz-trapdoor-muted: rgba(10, 10, 10, 0.62);
    --kz-trapdoor-line: rgba(10, 10, 10, 0.14);
    --kz-trapdoor-ink: #f2f2f0;
    --kz-trapdoor-on-ink: #0a0a0a;
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
| Anywhere, while it's open | `Escape` | Puts the page back, focus back on Menu |

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
