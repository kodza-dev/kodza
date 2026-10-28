# Marquee

[![Marquee, live on kodza.dev](https://kodza.dev/anim/scrolling-text-loop/og.jpg)](https://kodza.dev/components/scrolling-text-loop/)

An endless ticker that never jumps, eases to a stop under the pointer and fades at both edges. Runs either way.

**[Live demo](https://kodza.dev/components/scrolling-text-loop/)** · Text effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-scrolling-text-loop.html`](kodza-scrolling-text-loop.html) | 0.6 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-scrolling-text-loop.css`](kodza-scrolling-text-loop.css) | 2.7 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-scrolling-text-loop.js`](kodza-scrolling-text-loop.js) | 6.1 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-scrolling-text-loop.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-scrolling-text-loop.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/scrolling-text-loop/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Put my services in a Kodza Marquee under the hero.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-marquee` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-marquee-speed` | `60` | pixels per second |
| `--kz-marquee-gap` | `0.6em` |  |
| `--kz-marquee-dot` | `0.16em` |  |
| `--kz-marquee-fade` | `8%` |  |

- Modifiers: `.kodza-marquee--reverse`

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
