# Table

[![Table, live on kodza.dev](https://kodza.dev/anim/table/og.jpg)](https://kodza.dev/components/table/)

A data table that sorts when you click a column: rows glide to their new place, the sorted column gets a soft band, the header stays on top and the edges fade while it scrolls.

**[Live demo](https://kodza.dev/components/table/)** · Data display · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-table.html`](kodza-table.html) | 5.0 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-table.css`](kodza-table.css) | 16.7 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-table.js`](kodza-table.js) | 6.4 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-table.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-table.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/table/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Show my orders in a sortable Kodza Table.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-table` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-table-bg` | `#ffffff` |  |
| `--kz-table-fg` | `#0a0a0a` |  |
| `--kz-table-muted` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-table-line` | `rgba(10, 10, 10, 0.09)` |  |
| `--kz-table-border` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-table-soft` | `rgba(10, 10, 10, 0.035)` |  |
| `--kz-table-ink` | `#0a0a0a` |  |
| `--kz-table-on-ink` | `#ffffff` |  |
| `--kz-table-max` | `none` |  |
| `--kz-table-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-sort` (e.g. `2.1`, `12480`, `2026-10-02`, `6.8`, `9312`, `2026-10-16`), `data-status` (e.g. `beta`, `new`, `deprecated`, `stable`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-table {
    --kz-table-bg: #161616;
    --kz-table-fg: #f2f2f0;
    --kz-table-muted: rgba(242, 242, 240, 0.6);
    --kz-table-line: rgba(255, 255, 255, 0.08);
    --kz-table-border: rgba(255, 255, 255, 0.12);
    --kz-table-soft: rgba(255, 255, 255, 0.04);
    --kz-table-ink: #f2f2f0;
    --kz-table-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
