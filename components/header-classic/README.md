# Header Classic

[![Header Classic, live on kodza.dev](https://kodza.dev/anim/header-classic/og.jpg)](https://kodza.dev/components/header-classic/)

A site header with a logo, links and one button: a line glides under the links, front edge first, and returns under the current page; below 900 px the links become a shutter menu.

**[Live demo](https://kodza.dev/components/header-classic/)** · Header · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-header-classic.html`](kodza-header-classic.html) | 1.8 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-header-classic.css`](kodza-header-classic.css) | 33.6 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-header-classic.js`](kodza-header-classic.js) | 16.1 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-header-classic.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-header-classic.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/header-classic/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Header Classic to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-header-classic` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-header-classic-bg` | `transparent` |  |
| `--kz-header-classic-fg` | `#0a0a0a` |  |
| `--kz-header-classic-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-header-classic-soft` | `rgba(10, 10, 10, 0.06)` | the Menu button |
| `--kz-header-classic-ink` | `#0a0a0a` | the call to action |
| `--kz-header-classic-on-ink` | `#ffffff` |  |
| `--kz-header-classic-height` | `72px` |  |
| `--kz-header-classic-width` | `1200px` | the row, centred |
| `--kz-header-classic-pad` | `24px` |  |
| `--kz-header-classic-duration` | `0.42s` | the line gliding |
| `--kz-header-classic-lag` | `0.08s` | how long its back edge waits |
| `--kz-header-classic-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-header-classic-menu-bg` | `#0a0a0a` | the shutter, below 900 px |
| `--kz-header-classic-menu-fg` | `#f2f2f0` |  |
| `--kz-header-classic-menu-muted` | `rgba(242, 242, 240, 0.62)` |  |
| `--kz-header-classic-menu-line` | `rgba(242, 242, 240, 0.16)` |  |
| `--kz-header-classic-menu-top` | `auto` | where the shutter starts; auto = the bottom of the header |
| `--kz-header-classic-menu-side` | `24px` |  |
| `--kz-header-classic-menu-size` | `calc(clamp(34px, min(10cqw, calc((100cqh - 240px) / 6)), 96px) * var(--kz-font-display-scale, 1))` |  |
| `--kz-header-classic-menu-duration` | `0.8s` |  |
| `--kz-header-classic-menu-ease` | `cubic-bezier(0.76, 0, 0.24, 1)` |  |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-header-classic {
    --kz-header-classic-fg: #f2f2f0;
    --kz-header-classic-muted: rgba(242, 242, 240, 0.62);
    --kz-header-classic-soft: rgba(255, 255, 255, 0.08);
    --kz-header-classic-ink: #f2f2f0;
    --kz-header-classic-on-ink: #0a0a0a;
    --kz-header-classic-menu-bg: #f2f2f0;
    --kz-header-classic-menu-fg: #0a0a0a;
    --kz-header-classic-menu-muted: rgba(10, 10, 10, 0.62);
    --kz-header-classic-menu-line: rgba(10, 10, 10, 0.14);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

Every colour is a variable on the header: set --kz-header-classic-fg, -muted, -soft, -ink and -on-ink for a light bar on a dark site (the demo's dark band has the recipe). The shutter has its own --kz-header-classic-menu-* set (bg, fg, muted, line), so it can stay dark or turn to paper.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the Menu button, below 900 px | `Enter` / `Space` | Opens or closes the shutter |
| In the shutter | `Escape` | Rolls it back up, focus back on Menu |
|  | `Tab` | Past the last link, rolls it up and goes on with the page |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
