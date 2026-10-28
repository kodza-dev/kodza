# Hero Split

[![Hero Split, live on kodza.dev](https://kodza.dev/anim/hero-split/og.jpg)](https://kodza.dev/components/hero-split/)

A split hero, words on the left and a 4:5 picture on the right: the title lines rise out of their masks while the picture opens from the top edge down.

**[Live demo](https://kodza.dev/components/hero-split/)** · Hero · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-hero-split.html`](kodza-hero-split.html) | 1.4 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-hero-split.css`](kodza-hero-split.css) | 15.8 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-hero-split.js`](kodza-hero-split.js) | 6.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-hero-split.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-hero-split.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/hero-split/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Hero Split to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-hero-split` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-hero-split-ink` | `#0a0a0a` |  |
| `--kz-hero-split-paper` | `#f2f2f0` |  |
| `--kz-hero-split-dim` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-hero-split-faint` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-hero-split-soft` | `rgba(10, 10, 10, 0.07)` |  |
| `--kz-hero-split-bg` | `transparent` |  |
| `--kz-hero-split-width` | `1240px` |  |
| `--kz-hero-split-gap` | `clamp(32px, 5vw, 80px)` |  |
| `--kz-hero-split-pad-y` | `clamp(72px, 9vw, 140px)` |  |
| `--kz-hero-split-gutter` | `clamp(16px, 4vw, 40px)` |  |
| `--kz-hero-split-radius` | `16px` |  |
| `--kz-hero-split-ratio` | `4 / 5` |  |
| `--kz-hero-split-mono` | `"Geist Mono", ui-monospace, "SF Mono", Menlo, monospace` |  |
| `--kz-hero-split-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-hero-split {
    --kz-hero-split-ink: #f2f2f0;
    --kz-hero-split-paper: #0a0a0a;
    --kz-hero-split-dim: rgba(242, 242, 240, 0.64);
    --kz-hero-split-faint: rgba(242, 242, 240, 0.5);
    --kz-hero-split-soft: rgba(242, 242, 240, 0.1);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
