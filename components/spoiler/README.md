# Spoiler

[![Spoiler, live on kodza.dev](https://kodza.dev/anim/spoiler/og.jpg)](https://kodza.dev/components/spoiler/)

Hides an answer inside a sentence under a bar of ink, line by line, at its real width. A click, a tap or Enter parts the ink from the point touched; again, and it closes back.

**[Live demo](https://kodza.dev/components/spoiler/)** · Text effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-spoiler.html`](kodza-spoiler.html) | 0.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-spoiler.css`](kodza-spoiler.css) | 4.1 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-spoiler.js`](kodza-spoiler.js) | 11.5 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-spoiler.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-spoiler.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/spoiler/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Spoiler to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-spoiler]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-spoiler-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-spoiler-bar` | `var(--kz-spoiler-ink)` | the ink over the words: keep it opaque |
| `--kz-spoiler-bar-hover` | `color-mix(in srgb, var(--kz-spoiler-ink) 80%, var(--kz-color-page, #f2f2f0))` | opaque too |
| `--kz-spoiler-fill-shown` | `color-mix(in srgb, var(--kz-spoiler-ink) 6%, transparent)` | once read |
| `--kz-spoiler-pad` | `0.14em` | how far the ink reaches past the words, left and right |
| `--kz-spoiler-radius` | `calc(4px * var(--kz-radius-scale, 1))` |  |
| `--kz-spoiler-focus` | `var(--kz-spoiler-ink)` |  |

- Attributes: `data-kodza-spoiler`, `data-text-label`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-spoiler {
    --kz-spoiler-ink: #f2f2f0;
    --kz-spoiler-bar-hover: color-mix(in srgb, #f2f2f0 80%, #0a0a0a);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the hidden text | `Enter` / `Space` | Reveals the text, or covers it again |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
