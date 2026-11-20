# Middle Truncate

[![Middle Truncate, live on kodza.dev](https://kodza.dev/anim/middle-truncate/og.jpg)](https://kodza.dev/components/middle-truncate/)

Cuts a long name in the middle so both ends stay readable. Hover, focus or a tap widens the cut and the missing characters open from its centre.

**[Live demo](https://kodza.dev/components/middle-truncate/)** · Text effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-middle-truncate.html`](kodza-middle-truncate.html) | 0.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-middle-truncate.css`](kodza-middle-truncate.css) | 5.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-middle-truncate.js`](kodza-middle-truncate.js) | 12.6 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-middle-truncate.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-middle-truncate.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/middle-truncate/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Middle Truncate to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-middle-truncate` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-middle-truncate-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-middle-truncate-mark` | `color-mix(in srgb, var(--kz-middle-truncate-fg) 62%, transparent)` |  |
| `--kz-middle-truncate-seam` | `color-mix(in srgb, var(--kz-middle-truncate-fg) 8%, transparent)` |  |
| `--kz-middle-truncate-seam-pad` | `0.3em` |  |
| `--kz-middle-truncate-bg` | `var(--kz-color-paper, #fff)` |  |
| `--kz-middle-truncate-border` | `color-mix(in srgb, var(--kz-middle-truncate-fg) 12%, transparent)` |  |
| `--kz-middle-truncate-shadow` | `0 8px 24px rgba(10, 10, 10, 0.12), 0 1px 3px rgba(10, 10, 10, 0.08)` |  |
| `--kz-middle-truncate-radius` | `calc(8px * var(--kz-radius-scale, 1))` |  |
| `--kz-middle-truncate-pad` | `8px` |  |
| `--kz-middle-truncate-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-middle-truncate {
    --kz-middle-truncate-fg: #f2f2f0;
    --kz-middle-truncate-bg: #222;
    --kz-middle-truncate-border: rgba(255, 255, 255, 0.14);
    --kz-middle-truncate-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a cut name | `Tab` | Shows the whole name |
|  | `Escape` | Folds it back, the focus stays |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
