# Media Collage

[![Media Collage, live on kodza.dev](https://kodza.dev/anim/media-collage/og.jpg)](https://kodza.dev/components/media-collage/)

A text beside three pictures of different shapes set off from each other, the wide one running out to the screen edge. The text stays in view, and each picture is uncovered from its top edge in turn.

**[Live demo](https://kodza.dev/components/media-collage/)** · Content sections · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-media-collage.html`](kodza-media-collage.html) | 2.8 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-media-collage.css`](kodza-media-collage.css) | 16.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-media-collage.js`](kodza-media-collage.js) | 11.7 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-media-collage.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-media-collage.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/media-collage/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Media Collage to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-media-collage` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-media-collage-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-media-collage-dim` | `color-mix(in srgb, var(--kz-media-collage-ink) 66%, transparent)` |  |
| `--kz-media-collage-faint` | `color-mix(in srgb, var(--kz-media-collage-ink) 60%, transparent)` |  |
| `--kz-media-collage-bg` | `transparent` |  |
| `--kz-media-collage-width` | `var(--kz-page-width, 1440px)` | the content column, the same as the other sections |
| `--kz-media-collage-gutter` | `var(--kz-page-gutter, clamp(16px, 4vw, 40px))` | the space kept at the screen edges |
| `--kz-media-collage-pad-y` | `clamp(72px, 9vw, 140px)` | above and below |
| `--kz-media-collage-gap` | `clamp(16px, 2vw, 28px)` | between two pictures |
| `--kz-media-collage-offset` | `clamp(48px, 9cqi, 160px)` | how much lower the second picture sits |
| `--kz-media-collage-top` | `96px` | where the text holds while the pictures scroll past |
| `--kz-media-collage-ratio-1` | `4 / 5` |  |
| `--kz-media-collage-ratio-2` | `1 / 1` |  |
| `--kz-media-collage-ratio-3` | `3 / 2` |  |
| `--kz-media-collage-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-media-collage-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-media-collage-bleed` | `calc((100cqi - min(100cqi - 2 * var(--kz-media-collage-gutter), var(--kz-media-collage-width))) / 2)` |  |

- Modifiers: `.kodza-media-collage--reverse`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-media-collage {
    --kz-media-collage-ink: #f2f2f0;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
