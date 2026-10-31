# Hero Rotate

[![Hero Rotate, live on kodza.dev](https://kodza.dev/anim/hero-rotate/og.jpg)](https://kodza.dev/components/hero-rotate/)

A studio hero whose headline changes one word at a time: the next word rolls up into place while a matching picture opens over the last one, in the same stroke. A ring around the pause button shows the time left.

**[Live demo](https://kodza.dev/components/hero-rotate/)** · Hero · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-hero-rotate.html`](kodza-hero-rotate.html) | 3.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-hero-rotate.css`](kodza-hero-rotate.css) | 22.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-hero-rotate.js`](kodza-hero-rotate.js) | 15.3 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-hero-rotate.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-hero-rotate.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/hero-rotate/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Hero Rotate to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-hero-rotate` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-hero-rotate-ink` | `#0a0a0a` |  |
| `--kz-hero-rotate-paper` | `#f2f2f0` |  |
| `--kz-hero-rotate-dim` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-hero-rotate-faint` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-hero-rotate-soft` | `rgba(10, 10, 10, 0.07)` |  |
| `--kz-hero-rotate-track` | `rgba(10, 10, 10, 0.14)` |  |
| `--kz-hero-rotate-bg` | `transparent` |  |
| `--kz-hero-rotate-width` | `1240px` |  |
| `--kz-hero-rotate-gap` | `clamp(32px, 5vw, 80px)` |  |
| `--kz-hero-rotate-pad-y` | `clamp(72px, 9vw, 140px)` |  |
| `--kz-hero-rotate-gutter` | `clamp(16px, 4vw, 40px)` |  |
| `--kz-hero-rotate-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-hero-rotate-ratio` | `3 / 2` |  |
| `--kz-hero-rotate-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-hero-rotate-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-interval` (e.g. `3600`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-hero-rotate {
    --kz-hero-rotate-ink: #f2f2f0;
    --kz-hero-rotate-paper: #0a0a0a;
    --kz-hero-rotate-dim: rgba(242, 242, 240, 0.64);
    --kz-hero-rotate-faint: rgba(242, 242, 240, 0.6);
    --kz-hero-rotate-soft: rgba(242, 242, 240, 0.1);
    --kz-hero-rotate-track: rgba(242, 242, 240, 0.18);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the pause button | `Enter` / `Space` | Pauses the words and pictures, or starts them again |

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
