# Line Chart

[![Line Chart, live on kodza.dev](https://kodza.dev/anim/line-chart/og.jpg)](https://kodza.dev/components/line-chart/)

A line chart drawn from a real table: one or two lines draw into view, a guide snaps to the nearest point with every value in one bubble, and the table is one click away.

**[Live demo](https://kodza.dev/components/line-chart/)** · Data display · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-line-chart.html`](kodza-line-chart.html) | 1.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-line-chart.css`](kodza-line-chart.css) | 37.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-line-chart.js`](kodza-line-chart.js) | 27.9 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-line-chart.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-line-chart.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/line-chart/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Line Chart to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-line-chart` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-line-chart-bg` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-line-chart-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-line-chart-muted` | `color-mix(in srgb, var(--kz-line-chart-fg) 60%, transparent)` |  |
| `--kz-line-chart-border` | `color-mix(in srgb, var(--kz-line-chart-fg) 10%, transparent)` |  |
| `--kz-line-chart-grid` | `color-mix(in srgb, var(--kz-line-chart-fg) 8%, transparent)` | the gridlines |
| `--kz-line-chart-stroke` | `var(--kz-color-accent, var(--kz-line-chart-fg))` | the first line, the bubble |
| `--kz-line-chart-on-stroke` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-line-chart-second` | `color-mix(in srgb, var(--kz-line-chart-fg) 50%, transparent)` | the dashed line |
| `--kz-line-chart-area` | `0.12` | the opacity of the area under the first line, at its top |
| `--kz-line-chart-width` | `2px` | the lines |
| `--kz-line-chart-height` | `240px` | the plot |
| `--kz-line-chart-pad` | `28px` |  |
| `--kz-line-chart-mono` | `var(--kz-font-mono, ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-line-chart-draw` | `1.4s` | the lines drawing from left to right |
| `--kz-line-chart-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-source` (e.g. `Source: server logs. The spike is one Hacker News thread.`), `data-value`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-line-chart {
    --kz-line-chart-bg: #161616;
    --kz-line-chart-fg: #f2f2f0;
    --kz-line-chart-muted: rgba(242, 242, 240, 0.6);
    --kz-line-chart-border: rgba(255, 255, 255, 0.12);
    --kz-line-chart-grid: rgba(255, 255, 255, 0.08);
    --kz-line-chart-stroke: #f2f2f0;
    --kz-line-chart-on-stroke: #0a0a0a;
    --kz-line-chart-second: rgba(242, 242, 240, 0.5);
    --kz-line-chart-area: 0.16;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the chart | `ArrowRight` | Next point, read out with every value |
|  | `ArrowLeft` | Previous point |
|  | `Home` / `End` | First or last point |
|  | `Escape` | Lets go of the point |
| On the switch | `ArrowRight` / `ArrowLeft` | Chart or Table |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
