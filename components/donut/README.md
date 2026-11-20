# Donut

[![Donut, live on kodza.dev](https://kodza.dev/anim/donut/og.jpg)](https://kodza.dev/components/donut/)

A donut chart drawn from a real table: the parts draw one after the other in shades of ink, the total counts up in the centre, and pointing at a part rolls the centre to its value.

**[Live demo](https://kodza.dev/components/donut/)** · Data display · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-donut.html`](kodza-donut.html) | 0.7 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-donut.css`](kodza-donut.css) | 32.8 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-donut.js`](kodza-donut.js) | 25.0 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-donut.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-donut.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/donut/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Donut to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-donut` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-donut-bg` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-donut-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-donut-muted` | `color-mix(in srgb, var(--kz-donut-fg) 60%, transparent)` |  |
| `--kz-donut-border` | `color-mix(in srgb, var(--kz-donut-fg) 10%, transparent)` |  |
| `--kz-donut-grid` | `color-mix(in srgb, var(--kz-donut-fg) 8%, transparent)` | the lines between rows |
| `--kz-donut-fill` | `var(--kz-color-accent, var(--kz-donut-fg))` | the largest part; the others are paler shades of it |
| `--kz-donut-size` | `220px` | the ring |
| `--kz-donut-lift` | `8px` | how far a part steps out of the ring |
| `--kz-donut-dim` | `0.32` | the other parts, while one is pointed at |
| `--kz-donut-pad` | `28px` |  |
| `--kz-donut-mono` | `var(--kz-font-mono, ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-donut-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-i`, `data-source` (e.g. `Source: CI logs, last 30 days. Almost half of it is npm install.`), `data-value`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-donut {
    --kz-donut-bg: #161616;
    --kz-donut-fg: #f2f2f0;
    --kz-donut-muted: rgba(242, 242, 240, 0.6);
    --kz-donut-border: rgba(255, 255, 255, 0.12);
    --kz-donut-grid: rgba(255, 255, 255, 0.08);
    --kz-donut-fill: #f2f2f0;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the chart | `ArrowRight` / `ArrowDown` | Next part, read out with its value and share |
|  | `ArrowLeft` / `ArrowUp` | Previous part |
|  | `Home` / `End` | Largest or smallest part |
|  | `Escape` | Back to the total |
| On the switch | `ArrowRight` / `ArrowLeft` | Chart or Table |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
