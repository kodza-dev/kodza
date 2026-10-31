# Back to Top

[![Back to Top, live on kodza.dev](https://kodza.dev/anim/back-to-top/og.jpg)](https://kodza.dev/components/back-to-top/)

A round button that shows up a screen down, its ring filling as you read. Its label unrolls on hover, the arrow takes off when you click.

**[Live demo](https://kodza.dev/components/back-to-top/)** · Scroll · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-back-to-top.html`](kodza-back-to-top.html) | 0.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-back-to-top.css`](kodza-back-to-top.css) | 8.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-back-to-top.js`](kodza-back-to-top.js) | 6.0 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-back-to-top.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-back-to-top.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/back-to-top/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Back to Top button to my WordPress blog.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-top` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-top-bg` | `#ffffff` |  |
| `--kz-top-fg` | `#0a0a0a` |  |
| `--kz-top-line` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-top-shadow` | `0 10px 30px -10px rgba(10, 10, 10, 0.3)` |  |
| `--kz-top-size` | `48px` |  |
| `--kz-top-gap` | `24px` |  |
| `--kz-top-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-top-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |  |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-top {
    --kz-top-bg: #f2f2f0;
    --kz-top-fg: #0a0a0a;
    --kz-top-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.8);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
