# Menu Board

[![Menu Board, live on kodza.dev](https://kodza.dev/anim/menu-board/og.jpg)](https://kodza.dev/components/menu-board/)

A restaurant menu by service: dish, original name, a tabular price on a dotted leader, marks in icon and words. Opens on the service served now; tabs, or stacked with pinned titles (data-layout="stack").

**[Live demo](https://kodza.dev/components/menu-board/)** · Data display · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-menu-board.html`](kodza-menu-board.html) | 8.8 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-menu-board.css`](kodza-menu-board.css) | 22.5 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-menu-board.js`](kodza-menu-board.js) | 13.5 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-menu-board.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-menu-board.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/menu-board/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Menu Board to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-menu-board]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-menu-board-fg` | `#0a0a0a` |  |
| `--kz-menu-board-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-menu-board-line` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-menu-board-dots` | `rgba(10, 10, 10, 0.34)` | the leader between a dish and its price |
| `--kz-menu-board-tabs-bg` | `#ffffff` |  |
| `--kz-menu-board-ink` | `#0a0a0a` |  |
| `--kz-menu-board-on-ink` | `#ffffff` |  |
| `--kz-menu-board-veil` | `rgba(255, 255, 255, 0.78)` | behind a pinned title (stack layout) |
| `--kz-menu-board-top` | `0px` | height of a fixed header above it (stack layout) |
| `--kz-menu-board-width` | `720px` |  |
| `--kz-menu-board-duration` | `0.5s` |  |
| `--kz-menu-board-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-hours` (e.g. `12:00-14:30`, `19:00-22:30`), `data-kodza-menu-board`, `data-label` (e.g. `Menu`), `data-layout`, `data-mark` (e.g. `veg`, `vegan`, `spicy`, `allergens`, `out`), `data-now`, `data-timezone` (e.g. `Europe/Paris`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-menu-board {
    --kz-menu-board-fg: #f2f2f0;
    --kz-menu-board-muted: rgba(242, 242, 240, 0.62);
    --kz-menu-board-line: rgba(255, 255, 255, 0.12);
    --kz-menu-board-dots: rgba(242, 242, 240, 0.36);
    --kz-menu-board-tabs-bg: #161616;
    --kz-menu-board-ink: #f2f2f0;
    --kz-menu-board-on-ink: #0a0a0a;
    --kz-menu-board-veil: rgba(10, 10, 10, 0.82);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a tab | `ArrowRight` / `ArrowLeft` | Shows the next or previous service, round and round |
|  | `Home` / `End` | Shows the first or last service |
|  | `Tab` | Skips the other tabs, on to the dishes |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
