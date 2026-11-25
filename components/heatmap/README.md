# Heatmap

[![Heatmap, live on kodza.dev](https://kodza.dev/anim/heatmap/og.jpg)](https://kodza.dev/components/heatmap/)

A heatmap drawn from a real table: the cells fill in a wave, a ring glides to the cell you point at with its value in a bubble, the arrows walk the grid, and the table is one click away.

**[Live demo](https://kodza.dev/components/heatmap/)** · Data display · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-heatmap.html`](kodza-heatmap.html) | 5.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-heatmap.css`](kodza-heatmap.css) | 35.5 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-heatmap.js`](kodza-heatmap.js) | 25.1 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-heatmap.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-heatmap.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/heatmap/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Heatmap to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-heatmap` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-heatmap-bg` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-heatmap-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-heatmap-muted` | `color-mix(in srgb, var(--kz-heatmap-fg) 60%, transparent)` |  |
| `--kz-heatmap-border` | `color-mix(in srgb, var(--kz-heatmap-fg) 10%, transparent)` |  |
| `--kz-heatmap-line` | `color-mix(in srgb, var(--kz-heatmap-fg) 8%, transparent)` | the rules of the table |
| `--kz-heatmap-empty` | `color-mix(in srgb, var(--kz-heatmap-fg) 5%, transparent)` | a cell with nothing in it |
| `--kz-heatmap-ink` | `var(--kz-color-accent, var(--kz-heatmap-fg))` | the shades, and the bubble |
| `--kz-heatmap-on-ink` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-heatmap-level-1` | `0.2` | the four shades, as opacities of the ink |
| `--kz-heatmap-level-2` | `0.42` |  |
| `--kz-heatmap-level-3` | `0.68` |  |
| `--kz-heatmap-level-4` | `1` |  |
| `--kz-heatmap-cell` | `30px` | the height of a cell (--squares: as wide as it is tall) |
| `--kz-heatmap-gap` | `4px` |  |
| `--kz-heatmap-min` | `16px` | the narrowest a cell gets: under it, the grid scrolls sideways |
| `--kz-heatmap-corner` | `calc(5px * var(--kz-radius-scale, 1))` |  |
| `--kz-heatmap-pad` | `28px` |  |
| `--kz-heatmap-mono` | `var(--kz-font-mono, ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-heatmap-fill` | `0.5s` | a cell taking its shade |
| `--kz-heatmap-wave` | `22ms` | the delay from one diagonal of cells to the next |
| `--kz-heatmap-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-heatmap--squares`
- Attributes: `data-at`, `data-source` (e.g. `Source: the door counter. Go at 14:00.`, `August: offline, on purpose.`), `data-value`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-heatmap {
    --kz-heatmap-bg: #161616;
    --kz-heatmap-fg: #f2f2f0;
    --kz-heatmap-muted: rgba(242, 242, 240, 0.6);
    --kz-heatmap-border: rgba(255, 255, 255, 0.12);
    --kz-heatmap-line: rgba(255, 255, 255, 0.08);
    --kz-heatmap-empty: rgba(255, 255, 255, 0.06);
    --kz-heatmap-ink: #f2f2f0;
    --kz-heatmap-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the grid | `ArrowRight` / `ArrowLeft` | Next or previous cell in the row, read out with its value |
|  | `ArrowDown` / `ArrowUp` | Same column, next or previous row |
|  | `Home` / `End` | First or last cell of the row |
|  | `Escape` | Lets go of the cell |
| On the switch | `ArrowRight` / `ArrowDown` / `ArrowLeft` / `ArrowUp` | Chart or Table |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
