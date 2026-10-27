# Shutter Menu

[![Shutter Menu, live on kodza.dev](https://kodza.dev/anim/shutter-menu/og.jpg)](https://kodza.dev/components/shutter-menu/)

A menu that comes down under your header like a shutter: each link rises as the edge reaches it, Menu rolls to Close. The panel is a native popover, so Escape, a click outside and focus return come free.

**[Live demo](https://kodza.dev/components/shutter-menu/)** · Navigation · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-shutter-menu.html`](kodza-shutter-menu.html) | 1.4 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-shutter-menu.css`](kodza-shutter-menu.css) | 15.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-shutter-menu.js`](kodza-shutter-menu.js) | 9.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-shutter-menu.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-shutter-menu.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/shutter-menu/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Shutter Menu to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-shutter` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-shutter-bg` | `#0a0a0a` | the menu |
| `--kz-shutter-fg` | `#f2f2f0` |  |
| `--kz-shutter-muted` | `rgba(242, 242, 240, 0.62)` |  |
| `--kz-shutter-line` | `rgba(242, 242, 240, 0.16)` |  |
| `--kz-shutter-ink` | `#0a0a0a` | the Menu button, on the page |
| `--kz-shutter-on-ink` | `#ffffff` |  |
| `--kz-shutter-top` | `auto` | where the shutter starts; auto = the bottom of the header that holds the button |
| `--kz-shutter-side` | `24px` |  |
| `--kz-shutter-size` | `clamp(36px, min(9cqw, calc((100cqh - 190px) / 4.9)), 112px)` |  |
| `--kz-shutter-duration` | `0.8s` |  |
| `--kz-shutter-ease` | `cubic-bezier(0.76, 0, 0.24, 1)` |  |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-shutter {
    --kz-shutter-bg: #f2f2f0;
    --kz-shutter-fg: #0a0a0a;
    --kz-shutter-muted: rgba(10, 10, 10, 0.62);
    --kz-shutter-line: rgba(10, 10, 10, 0.14);
    --kz-shutter-ink: #f2f2f0;
    --kz-shutter-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the button | `Enter` / `Space` | Opens or closes the shutter |
| In the menu | `Escape` | Rolls it back up, focus back on Menu |
|  | `Tab` | Past the last link, rolls it up and goes on with the page |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
