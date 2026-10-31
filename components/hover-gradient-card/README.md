# Border Trace Card

[![Border Trace Card, live on kodza.dev](https://kodza.dev/anim/hover-gradient-card/og.jpg)](https://kodza.dev/components/hover-gradient-card/)

On hover a single line draws the card border from the exact point where the pointer came in. One way, both ways, or just the corners.

**[Live demo](https://kodza.dev/components/hover-gradient-card/)** · Cards · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-hover-gradient-card.html`](kodza-hover-gradient-card.html) | 0.7 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-hover-gradient-card.css`](kodza-hover-gradient-card.css) | 8.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-hover-gradient-card.js`](kodza-hover-gradient-card.js) | 11.6 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-hover-gradient-card.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-hover-gradient-card.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/hover-gradient-card/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Use the Kodza Border Trace Card for my feature list.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-trace` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-trace-bg` | `#ffffff` |  |
| `--kz-trace-fg` | `#0a0a0a` |  |
| `--kz-trace-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-trace-border` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-trace-stroke` | `#0a0a0a` |  |
| `--kz-trace-width` | `1.5px` |  |
| `--kz-trace-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-trace-pad` | `28px` |  |
| `--kz-trace-duration` | `0.7s` |  |
| `--kz-trace-ease` | `cubic-bezier(0.65, 0, 0.35, 1)` |  |

- Modifiers: `.kodza-trace--both`, `.kodza-trace--corners`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-trace {
    --kz-trace-bg: #161616;
    --kz-trace-fg: #f2f2f0;
    --kz-trace-muted: rgba(242, 242, 240, 0.62);
    --kz-trace-border: rgba(255, 255, 255, 0.12);
    --kz-trace-stroke: #ffffff;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
