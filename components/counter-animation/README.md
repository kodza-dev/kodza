# Counter

[![Counter, live on kodza.dev](https://kodza.dev/anim/counter-animation/og.jpg)](https://kodza.dev/components/counter-animation/)

A figure that rolls into place like an odometer when it comes into view: digits on the right spin more and land last, a zero takes a full turn. Readable without the script.

**[Live demo](https://kodza.dev/components/counter-animation/)** · Data display · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-counter-animation.html`](kodza-counter-animation.html) | 0.4 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-counter-animation.css`](kodza-counter-animation.css) | 4.1 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-counter-animation.js`](kodza-counter-animation.js) | 5.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-counter-animation.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-counter-animation.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/counter-animation/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Animate my key figures with the Kodza Counter.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-counter` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-counter-fg` | `#0a0a0a` |  |
| `--kz-counter-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-counter-size` | `clamp(44px, 6vw, 72px)` |  |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-counter {
    --kz-counter-fg: #f2f2f0;
    --kz-counter-muted: rgba(242, 242, 240, 0.62);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
