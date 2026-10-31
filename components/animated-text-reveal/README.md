# Scroll Text Reveal

[![Scroll Text Reveal, live on kodza.dev](https://kodza.dev/anim/animated-text-reveal/og.jpg)](https://kodza.dev/components/animated-text-reveal/)

Words light up one after the other as a paragraph scrolls by, and dim again on the way back. Fade, blur or rise. No GSAP.

**[Live demo](https://kodza.dev/components/animated-text-reveal/)** · Text effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-animated-text-reveal.html`](kodza-animated-text-reveal.html) | 0.4 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-animated-text-reveal.css`](kodza-animated-text-reveal.css) | 1.6 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-animated-text-reveal.js`](kodza-animated-text-reveal.js) | 6.4 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-animated-text-reveal.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-animated-text-reveal.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/animated-text-reveal/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Make my manifesto paragraph a Kodza Scroll Text Reveal.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-scroll-reveal` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-reveal-dim` | `0.16` |  |
| `--kz-reveal-blur` | `10px` |  |
| `--kz-reveal-rise` | `0.45em` |  |

- Attributes: `data-reveal` (e.g. `blur`, `rise`)

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
