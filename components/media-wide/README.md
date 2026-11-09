# Media Wide

[![Media Wide, live on kodza.dev](https://kodza.dev/anim/media-wide/og.jpg)](https://kodza.dev/components/media-wide/)

One wide picture between a head and a few short notes: title and intro side by side, the picture across the column (or the whole screen) uncovered from its top edge, then a mono caption.

**[Live demo](https://kodza.dev/components/media-wide/)** · Content sections · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-media-wide.html`](kodza-media-wide.html) | 1.4 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-media-wide.css`](kodza-media-wide.css) | 18.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-media-wide.js`](kodza-media-wide.js) | 10.1 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-media-wide.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-media-wide.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/media-wide/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Media Wide to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-media-wide` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-media-wide-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-media-wide-dim` | `color-mix(in srgb, var(--kz-media-wide-ink) 66%, transparent)` |  |
| `--kz-media-wide-faint` | `color-mix(in srgb, var(--kz-media-wide-ink) 60%, transparent)` |  |
| `--kz-media-wide-rule` | `color-mix(in srgb, var(--kz-media-wide-ink) 14%, transparent)` |  |
| `--kz-media-wide-bg` | `transparent` |  |
| `--kz-media-wide-width` | `var(--kz-page-width, 1440px)` | the content column, the same as the other sections |
| `--kz-media-wide-gutter` | `var(--kz-page-gutter, clamp(16px, 4vw, 40px))` | the space kept at the screen edges |
| `--kz-media-wide-pad-y` | `clamp(72px, 9vw, 140px)` | above and below |
| `--kz-media-wide-gap` | `clamp(32px, 5vw, 80px)` | between the title and the intro |
| `--kz-media-wide-space` | `clamp(40px, 5vw, 72px)` | between the head and the picture |
| `--kz-media-wide-ratio` | `12 / 5` |  |
| `--kz-media-wide-ratio-narrow` | `3 / 2` | on a phone |
| `--kz-media-wide-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-media-wide-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-media-wide-bleed` | `calc((100cqi - min(100cqi - 2 * var(--kz-media-wide-gutter), var(--kz-media-wide-width))) / 2)` |  |

- Modifiers: `.kodza-media-wide--full`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-media-wide {
    --kz-media-wide-ink: #f2f2f0;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
