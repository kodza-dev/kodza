# Multi-Level Menu

[![Multi-Level Menu, live on kodza.dev](https://kodza.dev/anim/multi-level-menu/og.jpg)](https://kodza.dev/components/multi-level-menu/)

A burger drawer for menus with levels: each sub-menu slides in over the last, the top row rolls to the level's name and leads back, and it reads the list wp_nav_menu() writes.

**[Live demo](https://kodza.dev/components/multi-level-menu/)** · Navigation · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-multi-level-menu.html`](kodza-multi-level-menu.html) | 2.6 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-multi-level-menu.css`](kodza-multi-level-menu.css) | 24.5 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-multi-level-menu.js`](kodza-multi-level-menu.js) | 38.7 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-multi-level-menu.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-multi-level-menu.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/multi-level-menu/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Multi-Level Menu to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-multi-level` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-multi-level-bg` | `#0a0a0a` | the drawer |
| `--kz-multi-level-fg` | `#f2f2f0` |  |
| `--kz-multi-level-muted` | `rgba(242, 242, 240, 0.62)` |  |
| `--kz-multi-level-rule` | `rgba(242, 242, 240, 0.14)` |  |
| `--kz-multi-level-ink` | `#0a0a0a` | the Menu button, on the page |
| `--kz-multi-level-on-ink` | `#ffffff` |  |
| `--kz-multi-level-gap` | `10px` | between the drawer and the edges of the screen |
| `--kz-multi-level-radius` | `20px` |  |
| `--kz-multi-level-pad` | `clamp(20px, 6cqw, 28px)` |  |
| `--kz-multi-level-width` | `min(440px, calc(100cqw - 2 * var(--kz-multi-level-gap)))` |  |
| `--kz-multi-level-size` | `clamp(24px, calc(2.6cqh + 14px), 34px)` |  |
| `--kz-multi-level-shade` | `0.5` | how dark the page gets under the drawer |
| `--kz-multi-level-shadow` | `0 24px 64px -16px rgba(0, 0, 0, 0.5)` |  |
| `--kz-multi-level-duration` | `0.8s` |  |
| `--kz-multi-level-ease` | `cubic-bezier(0.32, 0.72, 0, 1)` |  |

- Attributes: `data-all`, `data-page`, `data-side`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-multi-level {
    --kz-multi-level-bg: #f2f2f0;
    --kz-multi-level-fg: #0a0a0a;
    --kz-multi-level-muted: rgba(10, 10, 10, 0.62);
    --kz-multi-level-rule: rgba(10, 10, 10, 0.12);
    --kz-multi-level-ink: #f2f2f0;
    --kz-multi-level-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the button | `Enter` / `Space` | Opens it on the current branch, or the first row |
| On a row with a level | `ArrowRight` / `Enter` / `Space` | Opens its level, focus on its first row |
| Inside a level | `ArrowLeft` / `Escape` | Back up one level, focus on the row you came from |
| In the menu | `ArrowDown` / `ArrowUp` | Next or previous row, round and round |
|  | `Home` / `End` | First or last row |
|  | `Tab` / `Shift+Tab` | Stays inside the menu, round and round |
|  | `PageUp` / `PageDown` | Held back, the page behind stays put |
| Anywhere, while it's open | `Escape` | Closes it from the first level, focus back on Menu |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
