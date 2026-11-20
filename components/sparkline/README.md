# Sparkline

[![Sparkline, live on kodza.dev](https://kodza.dev/anim/sparkline/og.jpg)](https://kodza.dev/components/sparkline/)

A trend the size of a word, in a sentence or a table cell: the line draws when it comes into view, its last point lands, and the last value and the change rise in mono beside it. Screen readers hear one sentence.

**[Live demo](https://kodza.dev/components/sparkline/)** · Data display · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-sparkline.html`](kodza-sparkline.html) | 1.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-sparkline.css`](kodza-sparkline.css) | 6.8 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-sparkline.js`](kodza-sparkline.js) | 11.1 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-sparkline.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-sparkline.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/sparkline/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Sparkline to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-sparkline` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-sparkline-fg` | `var(--kz-color-ink, currentColor)` |  |
| `--kz-sparkline-muted` | `color-mix(in srgb, var(--kz-sparkline-fg) 62%, transparent)` |  |
| `--kz-sparkline-line` | `color-mix(in srgb, var(--kz-sparkline-fg) 10%, transparent)` | the rows of the table |
| `--kz-sparkline-width` | `4.6em` | the curve, in the size of the text around it |
| `--kz-sparkline-height` | `1em` |  |
| `--kz-sparkline-stroke` | `1.5px` |  |
| `--kz-sparkline-dot` | `5px` | the last point |
| `--kz-sparkline-area` | `0.12` | how dark the fill of --area is |
| `--kz-sparkline-mono` | `var(--kz-font-mono, ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-sparkline-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-sparkline--area`
- Attributes: `data-change`, `data-prefix`, `data-suffix` (e.g. ` s`, `k`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-sparkline,
  .kodza-sparkline-text,
  .kodza-sparkline-table {
    --kz-sparkline-fg: #f2f2f0;
    --kz-sparkline-muted: rgba(242, 242, 240, 0.62);
    --kz-sparkline-line: rgba(255, 255, 255, 0.1);
    color: #f2f2f0;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
