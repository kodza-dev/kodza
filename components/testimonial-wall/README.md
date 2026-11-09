# Testimonial Wall

[![Testimonial Wall, live on kodza.dev](https://kodza.dev/anim/testimonial-wall/og.jpg)](https://kodza.dev/components/testimonial-wall/)

A testimonials section: three columns of cards drift slowly in opposite directions, with no end and no jump, faded top and bottom. A column under the mouse slows to a stop; a pause button stops the wall.

**[Live demo](https://kodza.dev/components/testimonial-wall/)** · Testimonials & logos · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-testimonial-wall.html`](kodza-testimonial-wall.html) | 7.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-testimonial-wall.css`](kodza-testimonial-wall.css) | 20.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-testimonial-wall.js`](kodza-testimonial-wall.js) | 12.4 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-testimonial-wall.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-testimonial-wall.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/testimonial-wall/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Testimonial Wall to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-testimonial-wall]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-testimonial-wall-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-testimonial-wall-dim` | `color-mix(in srgb, var(--kz-testimonial-wall-ink) 64%, transparent)` |  |
| `--kz-testimonial-wall-card` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-testimonial-wall-line` | `color-mix(in srgb, var(--kz-testimonial-wall-ink) 10%, transparent)` |  |
| `--kz-testimonial-wall-line-strong` | `color-mix(in srgb, var(--kz-testimonial-wall-ink) 42%, transparent)` | the pointed card |
| `--kz-testimonial-wall-face` | `#e6e6e3` |  |
| `--kz-testimonial-wall-track` | `color-mix(in srgb, var(--kz-testimonial-wall-ink) 16%, transparent)` |  |
| `--kz-testimonial-wall-bg` | `transparent` |  |
| `--kz-testimonial-wall-columns` | `3` | 2 under 860px, 1 under 560px (below) |
| `--kz-testimonial-wall-height` | `640px` | the window the columns drift through |
| `--kz-testimonial-wall-speed` | `24` | pixels per second |
| `--kz-testimonial-wall-fade` | `112px` |  |
| `--kz-testimonial-wall-gap` | `16px` |  |
| `--kz-testimonial-wall-width` | `var(--kz-page-width, 1440px)` |  |
| `--kz-testimonial-wall-pad-y` | `clamp(64px, 8vw, 112px)` |  |
| `--kz-testimonial-wall-gutter` | `var(--kz-page-gutter, clamp(16px, 4vw, 40px))` |  |
| `--kz-testimonial-wall-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-testimonial-wall-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-testimonial-wall-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-kodza-testimonial-wall`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-testimonial-wall {
    --kz-testimonial-wall-ink: #f2f2f0;
    --kz-testimonial-wall-dim: rgba(242, 242, 240, 0.64);
    --kz-testimonial-wall-card: #161616;
    --kz-testimonial-wall-line: rgba(255, 255, 255, 0.12);
    --kz-testimonial-wall-line-strong: rgba(255, 255, 255, 0.42);
    --kz-testimonial-wall-face: #2a2a2a;
    --kz-testimonial-wall-track: rgba(242, 242, 240, 0.18);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

Every colour is a variable on the section: set --kz-testimonial-wall-ink, -dim, -card, -line, -line-strong, -face and -track (the demo's dark band has the recipe).

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the pause button | `Enter` / `Space` | Stops the wall, or starts it again |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
