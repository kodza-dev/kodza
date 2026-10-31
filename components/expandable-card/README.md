# Expandable Card

[![Expandable Card, live on kodza.dev](https://kodza.dev/anim/expandable-card/og.jpg)](https://kodza.dev/components/expandable-card/)

A row of cards where one is always open: click another and it widens while the others step back. Stacked on small screens.

**[Live demo](https://kodza.dev/components/expandable-card/)** · Cards · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-expandable-card.html`](kodza-expandable-card.html) | 1.4 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-expandable-card.css`](kodza-expandable-card.css) | 13.0 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-expandable-card.js`](kodza-expandable-card.js) | 7.4 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-expandable-card.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-expandable-card.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/expandable-card/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Show my services as a row of Kodza Expandable Cards.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-expand` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-expand-bg` | `#ffffff` |  |
| `--kz-expand-fg` | `#0a0a0a` |  |
| `--kz-expand-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-expand-border` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-expand-open-bg` | `#0a0a0a` |  |
| `--kz-expand-open-fg` | `#ffffff` |  |
| `--kz-expand-open-muted` | `rgba(255, 255, 255, 0.68)` |  |
| `--kz-expand-height` | `300px` |  |
| `--kz-expand-grow` | `2.6` |  |
| `--kz-expand-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-expand-pad` | `28px` |  |
| `--kz-expand-duration` | `0.75s` |  |
| `--kz-expand-ease` | `cubic-bezier(0.76, 0, 0.24, 1)` |  |
| `--kz-expand-text-ease` | `cubic-bezier(0.16, 1, 0.3, 1)` |  |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-expand {
    --kz-expand-bg: #161616;
    --kz-expand-fg: #f2f2f0;
    --kz-expand-muted: rgba(242, 242, 240, 0.62);
    --kz-expand-border: rgba(255, 255, 255, 0.12);
    --kz-expand-open-bg: #ffffff;
    --kz-expand-open-fg: #0a0a0a;
    --kz-expand-open-muted: rgba(10, 10, 10, 0.68);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
