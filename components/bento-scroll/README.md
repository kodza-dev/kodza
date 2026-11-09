# Bento Scroll

[![Bento Scroll, live on kodza.dev](https://kodza.dev/anim/bento-scroll/og.jpg)](https://kodza.dev/components/bento-scroll/)

A bento section that opens on its main picture, full screen, title on it. On scroll the picture goes back into its box and the others rise around it. It rewinds.

**[Live demo](https://kodza.dev/components/bento-scroll/)** · Feature sections · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-bento-scroll.html`](kodza-bento-scroll.html) | 3.0 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-bento-scroll.css`](kodza-bento-scroll.css) | 35.0 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-bento-scroll.js`](kodza-bento-scroll.js) | 29.3 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-bento-scroll.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-bento-scroll.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/bento-scroll/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Bento Scroll to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-bento-scroll` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-bento-scroll-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-bento-scroll-dim` | `color-mix(in srgb, var(--kz-bento-scroll-ink) 66%, transparent)` |  |
| `--kz-bento-scroll-faint` | `color-mix(in srgb, var(--kz-bento-scroll-ink) 60%, transparent)` |  |
| `--kz-bento-scroll-bg` | `transparent` |  |
| `--kz-bento-scroll-card` | `var(--kz-color-paper, #fff)` | a box… |
| `--kz-bento-scroll-card-line` | `color-mix(in srgb, var(--kz-bento-scroll-ink) 10%, transparent)` | …its border… |
| `--kz-bento-scroll-card-line-hover` | `color-mix(in srgb, var(--kz-bento-scroll-ink) 32%, transparent)` | …hovered |
| `--kz-bento-scroll-accent` | `var(--kz-color-accent, var(--kz-bento-scroll-ink))` | the ink box (--ink) |
| `--kz-bento-scroll-on-accent` | `var(--kz-color-on-accent, var(--kz-bento-scroll-card))` | its text |
| `--kz-bento-scroll-width` | `var(--kz-page-width, 1440px)` | the content column: the page's, set by the site |
| `--kz-bento-scroll-gutter` | `var(--kz-page-gutter, clamp(16px, 4vw, 40px))` | the space kept at the screen edges |
| `--kz-bento-scroll-pad-top` | `clamp(56px, 7vw, 112px)` |  |
| `--kz-bento-scroll-pad-bottom` | `clamp(56px, 7vw, 112px)` |  |
| `--kz-bento-scroll-gap` | `16px` | between the boxes |
| `--kz-bento-scroll-row` | `232px` | the height of a row, at least: a box taller in content makes its row taller |
| `--kz-bento-scroll-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-bento-scroll-pad` | `28px` | inside a box |
| `--kz-bento-scroll-size` | `clamp(28px, 3.4vw, 44px)` | the title |
| `--kz-bento-scroll-figure-size` | `clamp(44px, 4.6vw, 64px)` | a figure |
| `--kz-bento-scroll-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-bento-scroll-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-bento-scroll-top` | `0px` | height of a fixed site header: the scene pins under it |
| `--kz-bento-scroll-distance` | `180svh` | how long the scene stays pinned |
| `--kz-bento-scroll-on-image` | `#f2f2f0` | the title on the picture, full screen |
| `--kz-bento-scroll-shade` | `rgba(0, 0, 0, 0.5)` | the veil under it, at the top of the picture |

- Attributes: `data-span` (e.g. `wide`, `tall`, `big`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-bento-scroll {
    --kz-bento-scroll-ink: #f2f2f0;
    --kz-bento-scroll-card: #161616;
    --kz-bento-scroll-card-line: rgba(255, 255, 255, 0.12);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| Tabbing in | `Tab` | Lands on a link, the scene scrolls to show every box |

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
