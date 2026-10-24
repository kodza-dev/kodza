# Code Block

[![Code Block, live on kodza.dev](https://kodza.dev/anim/code-block/og.jpg)](https://kodza.dev/components/code-block/)

Code to read and copy: file name, line numbers, highlighted lines and a monochrome syntax in weight and light. Copy rolls to Copied; a terminal copies its commands only.

**[Live demo](https://kodza.dev/components/code-block/)** · Data display · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-code-block.html`](kodza-code-block.html) | 1.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-code-block.css`](kodza-code-block.css) | 10.5 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-code-block.js`](kodza-code-block.js) | 7.5 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-code-block.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-code-block.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/code-block/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Show my install snippets in a Kodza Code Block.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-code` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-code-bg` | `#0f0f0f` |  |
| `--kz-code-fg` | `rgba(255, 255, 255, 0.84)` |  |
| `--kz-code-bright` | `#ffffff` |  |
| `--kz-code-dim` | `rgba(255, 255, 255, 0.58)` |  |
| `--kz-code-line` | `rgba(255, 255, 255, 0.09)` |  |
| `--kz-code-mark` | `rgba(255, 255, 255, 0.06)` |  |
| `--kz-code-max-height` | `none` |  |
| `--kz-code-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-code--terminal`
- Attributes: `data-highlight` (e.g. `4-6`), `data-lang` (e.g. `js`, `shell`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-code {
    --kz-code-bg: #161616;
    --kz-code-line: rgba(255, 255, 255, 0.12);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
