# Image Hotspots

[![Image Hotspots, live on kodza.dev](https://kodza.dev/anim/image-hotspots/og.jpg)](https://kodza.dev/components/image-hotspots/)

Points on a picture, each opening a card about what it marks. One card serves them all: it glides from point to point while its text rolls.

**[Live demo](https://kodza.dev/components/image-hotspots/)** · Media · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-image-hotspots.html`](kodza-image-hotspots.html) | 2.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-image-hotspots.css`](kodza-image-hotspots.css) | 18.0 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-image-hotspots.js`](kodza-image-hotspots.js) | 16.5 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-image-hotspots.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-image-hotspots.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/image-hotspots/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Image Hotspots to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-image-hotspots` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-image-hotspots-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-image-hotspots-paper` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-image-hotspots-muted` | `color-mix(in srgb, var(--kz-image-hotspots-ink) 62%, transparent)` |  |
| `--kz-image-hotspots-line` | `color-mix(in srgb, var(--kz-image-hotspots-ink) 12%, transparent)` |  |
| `--kz-image-hotspots-active` | `var(--kz-color-accent, var(--kz-image-hotspots-ink))` |  |
| `--kz-image-hotspots-on-active` | `var(--kz-color-on-accent, var(--kz-image-hotspots-paper))` |  |
| `--kz-image-hotspots-glass` | `color-mix(in srgb, var(--kz-image-hotspots-paper) 84%, transparent)` |  |
| `--kz-image-hotspots-dot-shadow` | `0 6px 16px -6px rgba(10, 10, 10, 0.45)` |  |
| `--kz-image-hotspots-shadow` | `0 18px 40px -16px rgba(10, 10, 10, 0.32)` |  |
| `--kz-image-hotspots-dot` | `30px` |  |
| `--kz-image-hotspots-card-width` | `288px` |  |
| `--kz-image-hotspots-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-image-hotspots-ratio` | `auto` |  |
| `--kz-image-hotspots-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-image-hotspots-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-side` (e.g. `above`, `below`), `data-x` (e.g. `9`, `30`, `44.7`, `59`, `84.5`), `data-y` (e.g. `47`, `30`, `51`, `48`, `36`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-image-hotspots {
    --kz-image-hotspots-ink: #f2f2f0;
    --kz-image-hotspots-paper: #161616;
    --kz-image-hotspots-line: rgba(255, 255, 255, 0.14);
    --kz-image-hotspots-muted: rgba(242, 242, 240, 0.62);
    --kz-image-hotspots-glass: rgba(22, 22, 22, 0.78);
    --kz-image-hotspots-dot-shadow: 0 6px 16px -6px rgba(0, 0, 0, 0.8);
    --kz-image-hotspots-shadow: 0 18px 40px -16px rgba(0, 0, 0, 0.8);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a point | `Enter` | Opens its card, or closes it |
| Anywhere, while a card is open | `Escape` | Closes it, focus back on its point |

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
