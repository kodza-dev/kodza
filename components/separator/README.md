# Separator

[![Separator, live on kodza.dev](https://kodza.dev/anim/separator/og.jpg)](https://kodza.dev/components/separator/)

Lines that draw themselves from their middle when they come into view: a plain rule, one with a label or a section title, one around a CSS dot, and verticals between items.

**[Live demo](https://kodza.dev/components/separator/)** · Data display · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-separator.html`](kodza-separator.html) | 0.8 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-separator.css`](kodza-separator.css) | 5.6 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-separator.js`](kodza-separator.js) | 4.1 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-separator.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-separator.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/separator/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Separate my page sections with Kodza Separators.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-separator` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-separator-line` | `rgba(10, 10, 10, 0.16)` |  |
| `--kz-separator-fg` | `#0a0a0a` |  |
| `--kz-separator-muted` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-separator-ease` | `cubic-bezier(0.65, 0, 0.35, 1)` |  |
| `--kz-separator-duration` | `0.9s` |  |

- Modifiers: `.kodza-separator--dot`, `.kodza-separator--label`, `.kodza-separator--start`, `.kodza-separator--vertical`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-separator,
  .kodza-separator-row {
    --kz-separator-line: rgba(255, 255, 255, 0.18);
    --kz-separator-fg: #f2f2f0;
    --kz-separator-muted: rgba(242, 242, 240, 0.6);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
