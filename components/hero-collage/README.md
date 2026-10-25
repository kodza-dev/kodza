# Hero Collage

[![Hero Collage, live on kodza.dev](https://kodza.dev/anim/hero-collage/og.jpg)](https://kodza.dev/components/hero-collage/)

A centred hero with pictures scattered around the title: they open one after the other, then follow the mouse a little, each at its own depth.

**[Live demo](https://kodza.dev/components/hero-collage/)** · Hero · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-hero-collage.html`](kodza-hero-collage.html) | 2.7 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-hero-collage.css`](kodza-hero-collage.css) | 16.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-hero-collage.js`](kodza-hero-collage.js) | 8.4 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-hero-collage.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-hero-collage.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/hero-collage/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Hero Collage to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-hero-collage` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-hero-collage-ink` | `#0a0a0a` |  |
| `--kz-hero-collage-paper` | `#f2f2f0` |  |
| `--kz-hero-collage-dim` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-hero-collage-faint` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-hero-collage-soft` | `rgba(10, 10, 10, 0.07)` |  |
| `--kz-hero-collage-bg` | `transparent` |  |
| `--kz-hero-collage-height` | `clamp(640px, 54vw, 820px)` |  |
| `--kz-hero-collage-gutter` | `clamp(16px, 4vw, 40px)` |  |
| `--kz-hero-collage-radius` | `12px` |  |
| `--kz-hero-collage-drift` | `32px` |  |
| `--kz-hero-collage-mono` | `"Geist Mono", ui-monospace, "SF Mono", Menlo, monospace` |  |
| `--kz-hero-collage-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-hero-collage {
    --kz-hero-collage-ink: #f2f2f0;
    --kz-hero-collage-paper: #0a0a0a;
    --kz-hero-collage-dim: rgba(242, 242, 240, 0.64);
    --kz-hero-collage-faint: rgba(242, 242, 240, 0.5);
    --kz-hero-collage-soft: rgba(242, 242, 240, 0.1);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
