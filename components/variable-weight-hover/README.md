# Variable Weight Hover

[![Variable Weight Hover, live on kodza.dev](https://kodza.dev/anim/variable-weight-hover/og.jpg)](https://kodza.dev/components/variable-weight-hover/)

A big link whose letters get bolder the closer the pointer comes, on the weight axis of a variable font, while the line keeps its width. Works on a title or a menu too.

**[Live demo](https://kodza.dev/components/variable-weight-hover/)** · Text effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-variable-weight-hover.html`](kodza-variable-weight-hover.html) | 0.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-variable-weight-hover.css`](kodza-variable-weight-hover.css) | 3.7 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-variable-weight-hover.js`](kodza-variable-weight-hover.js) | 15.4 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-variable-weight-hover.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-variable-weight-hover.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/variable-weight-hover/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Variable Weight Hover to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-weight-hover` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-weight-hover-rest` | `300` |  |
| `--kz-weight-hover-peak` | `800` |  |
| `--kz-weight-hover-reach` | `2.4em` |  |
| `--kz-weight-hover-fg` | `var(--kz-color-ink, #0a0a0a)` |  |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-weight-hover {
    --kz-weight-hover-fg: #f2f2f0;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| Tabbing in | `Tab` | Lands on the link, which turns bold letter after letter |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
