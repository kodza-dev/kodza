# Header Mega

[![Header Mega, live on kodza.dev](https://kodza.dev/anim/header-mega/og.jpg)](https://kodza.dev/components/header-mega/)

A full site header whose mega menus share one panel: from a link to the next it changes shape and slides instead of closing, a soft pill follows the pointer, and below 900 px the links become a drawer with levels.

**[Live demo](https://kodza.dev/components/header-mega/)** · Header · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-header-mega.html`](kodza-header-mega.html) | 7.8 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-header-mega.css`](kodza-header-mega.css) | 49.6 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-header-mega.js`](kodza-header-mega.js) | 56.5 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-header-mega.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-header-mega.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/header-mega/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Header Mega to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-header-mega` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-header-mega-bg` | `transparent` |  |
| `--kz-header-mega-fg` | `#0a0a0a` |  |
| `--kz-header-mega-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-header-mega-soft` | `rgba(10, 10, 10, 0.06)` | the pill under the pointer, the card |
| `--kz-header-mega-surface` | `#ffffff` | the panel |
| `--kz-header-mega-border` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-header-mega-shadow` | `0 18px 40px -16px rgba(10, 10, 10, 0.3)` |  |
| `--kz-header-mega-ink` | `#0a0a0a` | the call to action |
| `--kz-header-mega-on-ink` | `#ffffff` |  |
| `--kz-header-mega-height` | `72px` |  |
| `--kz-header-mega-width` | `1200px` | the row, centred |
| `--kz-header-mega-pad` | `24px` |  |
| `--kz-header-mega-gap` | `8px` | between the bar and the panel |
| `--kz-header-mega-radius` | `calc(14px * var(--kz-radius-scale, 1))` |  |
| `--kz-header-mega-duration` | `0.45s` | the panel changing shape, the pill gliding |
| `--kz-header-mega-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-header-mega-menu-bg` | `#0a0a0a` | the drawer, below 900 px |
| `--kz-header-mega-menu-fg` | `#f2f2f0` |  |
| `--kz-header-mega-menu-muted` | `rgba(242, 242, 240, 0.62)` |  |
| `--kz-header-mega-menu-rule` | `rgba(242, 242, 240, 0.14)` |  |
| `--kz-header-mega-menu-ink` | `rgba(10, 10, 10, 0.06)` | the Menu button |
| `--kz-header-mega-menu-on-ink` | `#0a0a0a` |  |
| `--kz-header-mega-menu-gap` | `10px` | between the drawer and the edges of the screen |
| `--kz-header-mega-menu-radius` | `calc(20px * var(--kz-radius-scale, 1))` |  |
| `--kz-header-mega-menu-pad` | `clamp(20px, 6cqw, 28px)` |  |
| `--kz-header-mega-menu-width` | `min(440px, calc(100cqw - 2 * var(--kz-header-mega-menu-gap)))` |  |
| `--kz-header-mega-menu-size` | `calc(clamp(24px, calc(2.6cqh + 14px), 34px) * var(--kz-font-display-scale, 1))` |  |
| `--kz-header-mega-menu-shade` | `0.5` | how dark the page gets under the drawer |
| `--kz-header-mega-menu-shadow` | `0 24px 64px -16px rgba(0, 0, 0, 0.5)` |  |
| `--kz-header-mega-menu-duration` | `0.8s` |  |
| `--kz-header-mega-menu-ease` | `cubic-bezier(0.32, 0.72, 0, 1)` |  |

- Attributes: `data-all`, `data-page`, `data-side`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-header-mega {
    --kz-header-mega-fg: #f2f2f0;
    --kz-header-mega-muted: rgba(242, 242, 240, 0.62);
    --kz-header-mega-soft: rgba(255, 255, 255, 0.08);
    --kz-header-mega-surface: #161616;
    --kz-header-mega-border: rgba(255, 255, 255, 0.12);
    --kz-header-mega-shadow: 0 18px 40px -16px rgba(0, 0, 0, 0.8);
    --kz-header-mega-ink: #f2f2f0;
    --kz-header-mega-on-ink: #0a0a0a;
    --kz-header-mega-menu-bg: #f2f2f0;
    --kz-header-mega-menu-fg: #0a0a0a;
    --kz-header-mega-menu-muted: rgba(10, 10, 10, 0.62);
    --kz-header-mega-menu-rule: rgba(10, 10, 10, 0.12);
    --kz-header-mega-menu-ink: rgba(255, 255, 255, 0.08);
    --kz-header-mega-menu-on-ink: #f2f2f0;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

Every colour is a variable on the header: set --kz-header-mega-fg, -muted, -soft, -surface, -border, -ink and -on-ink for a dark bar and panel (the demo's dark band has the recipe). The phone drawer has its own --kz-header-mega-menu-* set, so it can stay dark or turn to paper.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| In an open menu | `ArrowDown` / `ArrowUp` | Next or previous row, up from the first back to its link |
|  | `Home` / `End` | First or last row |
|  | `Escape` | Closes it, focus back on its link |
| On a link with a menu | `Enter` / `Space` | Opens or closes its menu |
|  | `ArrowDown` | Opens its menu, focus on the first row |
| Along the bar | `ArrowRight` / `ArrowLeft` | Next or previous link, an open menu follows |
| Anywhere, while a menu is open | `Escape` | Closes the menu |
| On the Menu button, below 900 px | `Enter` / `Space` | Opens the drawer on the current branch |
| On a row with a level | `ArrowRight` / `Enter` / `Space` | Opens its level, focus on its first row |
| Inside a level | `ArrowLeft` / `Escape` | Back up one level, focus on the row you came from |
| In the drawer | `ArrowDown` / `ArrowUp` | Next or previous row, round and round |
|  | `Home` / `End` | First or last row |
|  | `Tab` / `Shift+Tab` | Stays inside the drawer, round and round |
|  | `PageUp` / `PageDown` | Held back, the page behind stays put |
|  | `Escape` | Closes it from the first level, focus back on Menu |

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
