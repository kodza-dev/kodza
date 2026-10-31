# Dimension Lines

[![Dimension Lines, live on kodza.dev](https://kodza.dev/anim/dimension-lines/og.jpg)](https://kodza.dev/components/dimension-lines/)

A hero dimensioned like a technical drawing: arrowed lines measure its real margins, columns, title and height, and recompute on resize. They open one by one on entry.

**[Live demo](https://kodza.dev/components/dimension-lines/)** · Backgrounds & textures · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-dimension-lines.html`](kodza-dimension-lines.html) | 1.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-dimension-lines.css`](kodza-dimension-lines.css) | 13.7 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-dimension-lines.js`](kodza-dimension-lines.js) | 17.7 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-dimension-lines.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-dimension-lines.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/dimension-lines/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Dimension Lines to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-dimension-lines]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-dimension-lines-bg` | `#f2f2f0` | the paper |
| `--kz-dimension-lines-ink` | `#0a0a0a` | the lines, the text, the button |
| `--kz-dimension-lines-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-dimension-lines-lines` | `0.4` | opacity of the dimension lines and arrows, 0 to 1 |
| `--kz-dimension-lines-guides` | `0.09` | opacity of the construction lines |
| `--kz-dimension-lines-values` | `0.62` | opacity of the values |
| `--kz-dimension-lines-height` | `600px` |  |
| `--kz-dimension-lines-width` | `1152px` | the text column |
| `--kz-dimension-lines-side` | `clamp(20px, 5vw, 64px)` |  |

- Attributes: `data-kodza-dimension-lines`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-dimension-lines {
    --kz-dimension-lines-bg: #0a0a0a;
    --kz-dimension-lines-ink: #f2f2f0;
    --kz-dimension-lines-muted: rgba(242, 242, 240, 0.62);
    --kz-dimension-lines-lines: 0.34;
    --kz-dimension-lines-guides: 0.08;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
