# Comparison Table

[![Comparison Table, live on kodza.dev](https://kodza.dev/anim/comparison-table/og.jpg)](https://kodza.dev/components/comparison-table/)

The table under the pricing cards: plan headers that stay on top, feature groups that fold, ticks that draw in. On a phone, a switch picks the plan and its values roll in place.

**[Live demo](https://kodza.dev/components/comparison-table/)** · Data display · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-comparison-table.html`](kodza-comparison-table.html) | 5.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-comparison-table.css`](kodza-comparison-table.css) | 45.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-comparison-table.js`](kodza-comparison-table.js) | 18.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-comparison-table.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-comparison-table.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/comparison-table/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Comparison Table to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-comparison-table` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-comparison-table-bg` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-comparison-table-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-comparison-table-muted` | `color-mix(in srgb, var(--kz-comparison-table-fg) 60%, transparent)` |  |
| `--kz-comparison-table-border` | `color-mix(in srgb, var(--kz-comparison-table-fg) 10%, transparent)` |  |
| `--kz-comparison-table-line` | `color-mix(in srgb, var(--kz-comparison-table-fg) 8%, transparent)` | between two rows |
| `--kz-comparison-table-soft` | `color-mix(in srgb, var(--kz-comparison-table-fg) 4%, transparent)` | the band, a row under the pointer |
| `--kz-comparison-table-featured-bg` | `var(--kz-color-accent, var(--kz-comparison-table-fg))` |  |
| `--kz-comparison-table-featured-fg` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-comparison-table-pad` | `28px` |  |
| `--kz-comparison-table-top` | `0px` | where the header sticks: the height of a fixed site header |
| `--kz-comparison-table-label` | `32%` | the column of the feature names |
| `--kz-comparison-table-mono` | `var(--kz-font-mono, ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-comparison-table-fold` | `0.6s` | a group folding or unfolding |
| `--kz-comparison-table-draw` | `0.5s` | a tick drawing |
| `--kz-comparison-table-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-comparison-table-fold-ease` | `cubic-bezier(0.65, 0, 0.35, 1)` |  |

- Attributes: `data-closed`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-comparison-table {
    --kz-comparison-table-bg: #161616;
    --kz-comparison-table-fg: #f2f2f0;
    --kz-comparison-table-muted: rgba(242, 242, 240, 0.6);
    --kz-comparison-table-border: rgba(255, 255, 255, 0.12);
    --kz-comparison-table-line: rgba(255, 255, 255, 0.08);
    --kz-comparison-table-soft: rgba(255, 255, 255, 0.05);
    --kz-comparison-table-featured-bg: #f2f2f0;
    --kz-comparison-table-featured-fg: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a group title | `Enter` / `Space` | Folds or unfolds the group |
| On the plan switch, on a narrow width | `ArrowRight` / `ArrowDown` / `ArrowLeft` / `ArrowUp` | Next or previous plan, its values rolling in |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
