# Bar Chart

[![Bar Chart, live on kodza.dev](https://kodza.dev/anim/bar-chart/og.jpg)](https://kodza.dev/components/bar-chart/)

A bar chart drawn from a real table: bars rise into view, the value rides above the bar you point at, series switch on one shared scale, and the table is one click away.

**[Live demo](https://kodza.dev/components/bar-chart/)** · Data display · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-bar-chart.html`](kodza-bar-chart.html) | 1.7 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-bar-chart.css`](kodza-bar-chart.css) | 36.6 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-bar-chart.js`](kodza-bar-chart.js) | 27.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-bar-chart.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-bar-chart.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/bar-chart/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Bar Chart to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-bar-chart` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-bar-chart-bg` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-bar-chart-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-bar-chart-muted` | `color-mix(in srgb, var(--kz-bar-chart-fg) 60%, transparent)` |  |
| `--kz-bar-chart-border` | `color-mix(in srgb, var(--kz-bar-chart-fg) 10%, transparent)` |  |
| `--kz-bar-chart-line` | `color-mix(in srgb, var(--kz-bar-chart-fg) 8%, transparent)` | the gridlines |
| `--kz-bar-chart-soft` | `color-mix(in srgb, var(--kz-bar-chart-fg) 5%, transparent)` | the rails of --horizontal |
| `--kz-bar-chart-bar` | `var(--kz-color-accent, var(--kz-bar-chart-fg))` |  |
| `--kz-bar-chart-on-bar` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-bar-chart-dim` | `0.2` | the opacity of the other bars while one is read |
| `--kz-bar-chart-height` | `260px` | the plot of the columns |
| `--kz-bar-chart-row` | `44px` | one line of --horizontal |
| `--kz-bar-chart-pad` | `28px` |  |
| `--kz-bar-chart-mono` | `var(--kz-font-mono, ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-bar-chart-grow` | `0.9s` | a bar rising or gliding to a new value |
| `--kz-bar-chart-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-bar-chart--horizontal`
- Attributes: `data-rank`, `data-source` (e.g. `Source: CI logs. December is a code freeze, mostly.`, `Source: one honest standup.`), `data-value`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-bar-chart {
    --kz-bar-chart-bg: #161616;
    --kz-bar-chart-fg: #f2f2f0;
    --kz-bar-chart-muted: rgba(242, 242, 240, 0.6);
    --kz-bar-chart-border: rgba(255, 255, 255, 0.12);
    --kz-bar-chart-line: rgba(255, 255, 255, 0.08);
    --kz-bar-chart-soft: rgba(255, 255, 255, 0.05);
    --kz-bar-chart-bar: #f2f2f0;
    --kz-bar-chart-on-bar: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the chart | `ArrowRight` / `ArrowDown` | Next bar, read out with its value |
|  | `ArrowLeft` / `ArrowUp` | Previous bar |
|  | `Home` / `End` | First or last bar |
|  | `Escape` | Lets go of the bar |
| On a switch | `ArrowRight` / `ArrowDown` / `ArrowLeft` / `ArrowUp` | Next or previous option: series, or Chart and Table |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
