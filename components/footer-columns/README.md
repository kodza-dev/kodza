# Footer Columns

[![Footer Columns, live on kodza.dev](https://kodza.dev/anim/footer-columns/og.jpg)](https://kodza.dev/components/footer-columns/)

A site footer: the logo and a line, up to five columns of links under mono titles, a bottom row with the year, legal pages and Back to top; under a link, a line comes in from the left.

**[Live demo](https://kodza.dev/components/footer-columns/)** · Footer · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-footer-columns.html`](kodza-footer-columns.html) | 3.6 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-footer-columns.css`](kodza-footer-columns.css) | 18.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-footer-columns.js`](kodza-footer-columns.js) | 4.5 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-footer-columns.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-footer-columns.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/footer-columns/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Footer Columns to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-footer-columns` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-footer-columns-bg` | `#ffffff` |  |
| `--kz-footer-columns-fg` | `#0a0a0a` |  |
| `--kz-footer-columns-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-footer-columns-line` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-footer-columns-soft` | `rgba(10, 10, 10, 0.05)` | Back to top, under the pointer |
| `--kz-footer-columns-width` | `1200px` | the content, centred |
| `--kz-footer-columns-pad` | `24px` |  |
| `--kz-footer-columns-mono` | `"Geist Mono", ui-monospace, "SF Mono", Menlo, monospace` |  |
| `--kz-footer-columns-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-footer-columns {
    --kz-footer-columns-bg: #141414;
    --kz-footer-columns-fg: #f2f2f0;
    --kz-footer-columns-muted: rgba(242, 242, 240, 0.62);
    --kz-footer-columns-line: rgba(255, 255, 255, 0.12);
    --kz-footer-columns-soft: rgba(255, 255, 255, 0.08);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

Every colour is a variable on the footer: set --kz-footer-columns-bg, -fg, -muted, -line and -soft (the demo's dark band has the recipe).

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On Back to top | `Enter` | Back to the top, focus too: Tab starts there |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
