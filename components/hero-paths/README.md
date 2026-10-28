# Hero Paths

[![Hero Paths, live on kodza.dev](https://kodza.dev/anim/hero-paths/og.jpg)](https://kodza.dev/components/hero-paths/)

A hero that splits visitors in two: a title, then two tall pictures that are links, and the one under the pointer widens while its call to action rises.

**[Live demo](https://kodza.dev/components/hero-paths/)** · Hero · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-hero-paths.html`](kodza-hero-paths.html) | 2.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-hero-paths.css`](kodza-hero-paths.css) | 13.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-hero-paths.js`](kodza-hero-paths.js) | 6.3 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-hero-paths.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-hero-paths.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/hero-paths/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Hero Paths to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-hero-paths` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-hero-paths-ink` | `#0a0a0a` |  |
| `--kz-hero-paths-dim` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-hero-paths-faint` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-hero-paths-on-image` | `#f2f2f0` |  |
| `--kz-hero-paths-veil` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-hero-paths-bg` | `transparent` |  |
| `--kz-hero-paths-width` | `1440px` |  |
| `--kz-hero-paths-pad-y` | `clamp(56px, 7vw, 112px)` |  |
| `--kz-hero-paths-gutter` | `clamp(16px, 4vw, 40px)` |  |
| `--kz-hero-paths-height` | `clamp(380px, 32vw, 460px)` |  |
| `--kz-hero-paths-gap` | `12px` |  |
| `--kz-hero-paths-grow` | `1.8` |  |
| `--kz-hero-paths-radius` | `16px` |  |
| `--kz-hero-paths-mono` | `"Geist Mono", ui-monospace, "SF Mono", Menlo, monospace` |  |
| `--kz-hero-paths-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-hero-paths-sway` | `cubic-bezier(0.65, 0, 0.35, 1)` |  |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-hero-paths {
    --kz-hero-paths-ink: #f2f2f0;
    --kz-hero-paths-dim: rgba(242, 242, 240, 0.64);
    --kz-hero-paths-faint: rgba(242, 242, 240, 0.5);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
