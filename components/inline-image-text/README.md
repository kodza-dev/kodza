# Inline Image Text

[![Inline Image Text, live on kodza.dev](https://kodza.dev/anim/inline-image-text/og.jpg)](https://kodza.dev/components/inline-image-text/)

A large sentence with small pictures set in its lines, at letter height. Lines rise from their mask and each picture opens as its line lands. Sized in em; a muted loop works too.

**[Live demo](https://kodza.dev/components/inline-image-text/)** · Text effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-inline-image-text.html`](kodza-inline-image-text.html) | 0.9 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-inline-image-text.css`](kodza-inline-image-text.css) | 7.0 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-inline-image-text.js`](kodza-inline-image-text.js) | 15.1 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-inline-image-text.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-inline-image-text.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/inline-image-text/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Inline Image Text to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-inline-image-text` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-inline-image-text-width` | `2em` |  |
| `--kz-inline-image-text-height` | `0.9em` |  |
| `--kz-inline-image-text-radius` | `calc(0.26em * var(--kz-radius-scale, 1))` |  |
| `--kz-inline-image-text-gap` | `0.06em` | on each side, on top of the spaces |
| `--kz-inline-image-text-offset` | `-0.08em` | below the baseline, to sit centred on the letters |
| `--kz-inline-image-text-duration` | `0.9s` |  |
| `--kz-inline-image-text-stagger` | `90ms` |  |
| `--kz-inline-image-text-zoom` | `1.14` |  |
| `--kz-inline-image-text-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
