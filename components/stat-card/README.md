# Stat Card

[![Stat Card, live on kodza.dev](https://kodza.dev/anim/stat-card/og.jpg)](https://kodza.dev/components/stat-card/)

A key figure, its change and the curve behind it: the figure rolls, the curve draws itself and a guide follows your pointer with the value of the day. Trends told by arrows.

**[Live demo](https://kodza.dev/components/stat-card/)** · Data display · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-stat-card.html`](kodza-stat-card.html) | 1.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-stat-card.css`](kodza-stat-card.css) | 10.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-stat-card.js`](kodza-stat-card.js) | 11.4 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-stat-card.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-stat-card.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/stat-card/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Show my dashboard numbers in Kodza Stat Cards.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-stat` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-stat-bg` | `#ffffff` |  |
| `--kz-stat-fg` | `#0a0a0a` |  |
| `--kz-stat-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-stat-border` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-stat-soft` | `rgba(10, 10, 10, 0.06)` |  |
| `--kz-stat-ink` | `#0a0a0a` |  |
| `--kz-stat-on-ink` | `#ffffff` |  |
| `--kz-stat-pad` | `28px 28px 22px` |  |
| `--kz-stat-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-labels` (e.g. `Mon,Tue,Wed,Thu,Fri,Sat,Sun`), `data-points` (e.g. `1420,1610,1580,1890,2050,1730,2200`, `0,0,0,0,0,0,0`, `14,12,11,9,8,5,3`), `data-trend` (e.g. `down`, `flat`, `up`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-stat {
    --kz-stat-bg: #161616;
    --kz-stat-fg: #f2f2f0;
    --kz-stat-muted: rgba(242, 242, 240, 0.62);
    --kz-stat-border: rgba(255, 255, 255, 0.12);
    --kz-stat-soft: rgba(255, 255, 255, 0.08);
    --kz-stat-ink: #f2f2f0;
    --kz-stat-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
