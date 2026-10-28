# Fullscreen Menu

[![Fullscreen Menu, live on kodza.dev](https://kodza.dev/anim/fullscreen-menu/og.jpg)](https://kodza.dev/components/fullscreen-menu/)

A fullscreen menu: a curtain comes down with its edge bending as it moves, the page backs off under it, and each link rises as the edge passes. Closing plays it backwards.

**[Live demo](https://kodza.dev/components/fullscreen-menu/)** · Navigation · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-fullscreen-menu.html`](kodza-fullscreen-menu.html) | 2.9 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-fullscreen-menu.css`](kodza-fullscreen-menu.css) | 20.1 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-fullscreen-menu.js`](kodza-fullscreen-menu.js) | 31.4 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-fullscreen-menu.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-fullscreen-menu.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/fullscreen-menu/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Fullscreen Menu to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-fullscreen` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-fullscreen-bg` | `#0a0a0a` | the curtain |
| `--kz-fullscreen-fg` | `#f2f2f0` |  |
| `--kz-fullscreen-muted` | `rgba(242, 242, 240, 0.62)` |  |
| `--kz-fullscreen-ink` | `#0a0a0a` | the Menu button, on the page |
| `--kz-fullscreen-on-ink` | `#ffffff` |  |
| `--kz-fullscreen-page` | `auto` | the page colour while it backs off; auto = the first background above it |
| `--kz-fullscreen-top` | `calc(var(--wp-admin--admin-bar--height, 0px) + 20px)` | match your header, so Close lands right where Menu was (below the WordPress admin bar) |
| `--kz-fullscreen-side` | `24px` |  |
| `--kz-fullscreen-size` | `clamp(40px, min(10cqw + 12px, calc((100cqh - 230px) / 5.3)), 132px)` |  |
| `--kz-fullscreen-curve` | `1` | how far the edge bends on the way; 0 = a straight edge |
| `--kz-fullscreen-shade` | `0.5` | how dark the page gets under it |
| `--kz-fullscreen-depth` | `0.94` | the page's size once covered |
| `--kz-fullscreen-duration` | `1s` |  |
| `--kz-fullscreen-ease` | `cubic-bezier(0.76, 0, 0.24, 1)` |  |

- Modifiers: `.kodza-fullscreen--straight`
- Attributes: `data-page`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-fullscreen {
    --kz-fullscreen-bg: #f2f2f0;
    --kz-fullscreen-fg: #0a0a0a;
    --kz-fullscreen-muted: rgba(10, 10, 10, 0.62);
    --kz-fullscreen-ink: #f2f2f0;
    --kz-fullscreen-on-ink: #0a0a0a;
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
| Anywhere, while it's open | `Escape` | Lifts the curtain, focus back on Menu |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
