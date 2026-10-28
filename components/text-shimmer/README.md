# Shimmer Text

[![Shimmer Text, live on kodza.dev](https://kodza.dev/anim/text-shimmer/og.jpg)](https://kodza.dev/components/text-shimmer/)

A band of light that sweeps across text, the way a busy interface says "still working on it". Looping, on hover, or following the pointer.

**[Live demo](https://kodza.dev/components/text-shimmer/)** · Text effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-text-shimmer.html`](kodza-text-shimmer.html) | 0.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-text-shimmer.css`](kodza-text-shimmer.css) | 3.1 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-text-shimmer.js`](kodza-text-shimmer.js) | 3.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-text-shimmer.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-text-shimmer.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/text-shimmer/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add Kodza Shimmer Text to my loading message.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-shimmer--pointer` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-shimmer-base` | `rgba(10, 10, 10, 0.42)` |  |
| `--kz-shimmer-light` | `#0a0a0a` |  |
| `--kz-shimmer-width` | `18%` |  |
| `--kz-shimmer-duration` | `2.2s` |  |

- Modifiers: `.kodza-shimmer--hover`, `.kodza-shimmer--pointer`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-shimmer {
    --kz-shimmer-base: rgba(255, 255, 255, 0.4);
    --kz-shimmer-light: #ffffff;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
