# Hero Wordmark

[![Hero Wordmark, live on kodza.dev](https://kodza.dev/anim/hero-wordmark/og.jpg)](https://kodza.dev/components/hero-wordmark/)

A hero that sets the name across the whole width, ink edge to ink edge: its letters rise one by one and a wide picture opens right under them.

**[Live demo](https://kodza.dev/components/hero-wordmark/)** · Hero · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-hero-wordmark.html`](kodza-hero-wordmark.html) | 1.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-hero-wordmark.css`](kodza-hero-wordmark.css) | 16.1 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-hero-wordmark.js`](kodza-hero-wordmark.js) | 10.1 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-hero-wordmark.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-hero-wordmark.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/hero-wordmark/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Hero Wordmark to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-hero-wordmark` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-hero-wordmark-ink` | `#0a0a0a` |  |
| `--kz-hero-wordmark-paper` | `#f2f2f0` |  |
| `--kz-hero-wordmark-dim` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-hero-wordmark-faint` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-hero-wordmark-soft` | `rgba(10, 10, 10, 0.07)` |  |
| `--kz-hero-wordmark-bg` | `transparent` |  |
| `--kz-hero-wordmark-width` | `none` |  |
| `--kz-hero-wordmark-pad-top` | `clamp(56px, 7vw, 112px)` |  |
| `--kz-hero-wordmark-gutter` | `clamp(16px, 4vw, 40px)` |  |
| `--kz-hero-wordmark-gap` | `clamp(10px, 1.2vw, 18px)` |  |
| `--kz-hero-wordmark-radius` | `16px` |  |
| `--kz-hero-wordmark-ratio` | `12 / 5` |  |
| `--kz-hero-wordmark-weight` | `700` |  |
| `--kz-hero-wordmark-tracking` | `-0.04em` |  |
| `--kz-hero-wordmark-mono` | `"Geist Mono", ui-monospace, "SF Mono", Menlo, monospace` |  |
| `--kz-hero-wordmark-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-hero-wordmark {
    --kz-hero-wordmark-ink: #f2f2f0;
    --kz-hero-wordmark-paper: #0a0a0a;
    --kz-hero-wordmark-dim: rgba(242, 242, 240, 0.64);
    --kz-hero-wordmark-faint: rgba(242, 242, 240, 0.5);
    --kz-hero-wordmark-soft: rgba(242, 242, 240, 0.1);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
