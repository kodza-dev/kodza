# Hero Cover

[![Hero Cover, live on kodza.dev](https://kodza.dev/anim/hero-cover/og.jpg)](https://kodza.dev/components/hero-cover/)

A cover hero: a full-width picture under a monochrome veil, the title at the bottom left. The picture opens from the top edge, the title lines rise. A modifier sets it mid-page, played on scroll.

**[Live demo](https://kodza.dev/components/hero-cover/)** · Hero · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-hero-cover.html`](kodza-hero-cover.html) | 1.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-hero-cover.css`](kodza-hero-cover.css) | 20.1 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-hero-cover.js`](kodza-hero-cover.js) | 7.3 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-hero-cover.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-hero-cover.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/hero-cover/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Hero Cover to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-hero-cover` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-hero-cover-light` | `var(--kz-color-page, #f2f2f0)` |  |
| `--kz-hero-cover-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-hero-cover-dim` | `color-mix(in srgb, var(--kz-hero-cover-light) 80%, transparent)` |  |
| `--kz-hero-cover-faint` | `color-mix(in srgb, var(--kz-hero-cover-light) 70%, transparent)` |  |
| `--kz-hero-cover-glass` | `color-mix(in srgb, var(--kz-hero-cover-light) 14%, transparent)` |  |
| `--kz-hero-cover-shade` | `rgba(10, 10, 10, 0.8)` |  |
| `--kz-hero-cover-base` | `transparent` |  |
| `--kz-hero-cover-bg` | `transparent` |  |
| `--kz-hero-cover-height` | `clamp(560px, 54vw, 800px)` |  |
| `--kz-hero-cover-gutter` | `clamp(12px, 2vw, 24px)` |  |
| `--kz-hero-cover-pad` | `clamp(24px, 4.5vw, 64px)` |  |
| `--kz-hero-cover-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-hero-cover-position` | `50% 50%` |  |
| `--kz-hero-cover-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-hero-cover-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-hero-cover-glide` | `cubic-bezier(0.6, 0, 0.1, 1)` |  |
| `--kz-hero-cover-soft-ease` | `cubic-bezier(0.25, 1, 0.5, 1)` |  |

- Modifiers: `.kodza-hero-cover--section`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-hero-cover {
    --kz-hero-cover-base: #161616;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
