# Statement

[![Statement, live on kodza.dev](https://kodza.dev/anim/statement/og.jpg)](https://kodza.dev/components/statement/)

One big sentence of two to four lines, with a mono label in the indent of its first line. Its lines rise from their masks as it comes into view. A modifier makes it a quote with the name and role.

**[Live demo](https://kodza.dev/components/statement/)** · Content sections · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-statement.html`](kodza-statement.html) | 0.7 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-statement.css`](kodza-statement.css) | 11.6 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-statement.js`](kodza-statement.js) | 8.3 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-statement.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-statement.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/statement/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Statement to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-statement` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-statement-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-statement-dim` | `color-mix(in srgb, var(--kz-statement-ink) 66%, transparent)` |  |
| `--kz-statement-faint` | `color-mix(in srgb, var(--kz-statement-ink) 60%, transparent)` |  |
| `--kz-statement-bg` | `transparent` |  |
| `--kz-statement-width` | `1240px` | the content column, the same as the other sections |
| `--kz-statement-gutter` | `clamp(16px, 4vw, 40px)` | the space kept at the screen edges |
| `--kz-statement-pad` | `clamp(72px, 9vw, 140px)` | above and below |
| `--kz-statement-size` | `clamp(28px, 4cqi, 52px)` | the sentence, from the width it is given |
| `--kz-statement-indent` | `clamp(110px, 16cqi, 220px)` | the first line's indent, where the label sits |
| `--kz-statement-hang` | `0.33em` | --quote: how far the opening mark hangs out (its width in Geist) |
| `--kz-statement-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |

- Modifiers: `.kodza-statement--quote`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-statement {
    --kz-statement-ink: #f2f2f0;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
