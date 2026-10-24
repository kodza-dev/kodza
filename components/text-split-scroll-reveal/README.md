# Text Reveal

[![Text Reveal, live on kodza.dev](https://kodza.dev/anim/text-split-scroll-reveal/og.jpg)](https://kodza.dev/components/text-split-scroll-reveal/)

Text that writes itself in when it reaches the screen: lines rising from a mask, words coming into focus, or letters. Plays once.

**[Live demo](https://kodza.dev/components/text-split-scroll-reveal/)** · Text effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-text-split-scroll-reveal.html`](kodza-text-split-scroll-reveal.html) | 0.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-text-split-scroll-reveal.css`](kodza-text-split-scroll-reveal.css) | 3.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-text-split-scroll-reveal.js`](kodza-text-split-scroll-reveal.js) | 6.5 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-text-split-scroll-reveal.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-text-split-scroll-reveal.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/text-split-scroll-reveal/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Reveal my section titles with Kodza Text Reveal.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-text-reveal` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-text-reveal-duration` | `0.9s` |  |
| `--kz-text-reveal-stagger` | `90ms` |  |
| `--kz-text-reveal-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-split` (e.g. `words`, `chars`)

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
