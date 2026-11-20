# Overflow Marquee

[![Overflow Marquee, live on kodza.dev](https://kodza.dev/anim/overflow-marquee/og.jpg)](https://kodza.dev/components/overflow-marquee/)

A one-line title cut by an ellipsis glides on hover or keyboard focus to show its end, waits, then comes back. A title that fits never moves; soft edges stand in for the ellipsis while it glides.

**[Live demo](https://kodza.dev/components/overflow-marquee/)** · Text effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-overflow-marquee.html`](kodza-overflow-marquee.html) | 0.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-overflow-marquee.css`](kodza-overflow-marquee.css) | 2.7 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-overflow-marquee.js`](kodza-overflow-marquee.js) | 10.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-overflow-marquee.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-overflow-marquee.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/overflow-marquee/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Overflow Marquee to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-overflow-marquee` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-overflow-marquee-speed` | `90` |  |
| `--kz-overflow-marquee-fade` | `1.25em` |  |

- Attributes: `data-host`

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
