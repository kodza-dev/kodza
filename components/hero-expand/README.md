# Hero Expand

[![Hero Expand, live on kodza.dev](https://kodza.dev/anim/hero-expand/og.jpg)](https://kodza.dev/components/hero-expand/)

A big title with a small picture set between two words. On scroll the scene pins, the picture opens to full screen and pushes the words aside, then a caption and a button rise. Scroll back up: it rewinds.

**[Live demo](https://kodza.dev/components/hero-expand/)** · Hero · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-hero-expand.html`](kodza-hero-expand.html) | 2.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-hero-expand.css`](kodza-hero-expand.css) | 20.1 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-hero-expand.js`](kodza-hero-expand.js) | 15.7 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-hero-expand.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-hero-expand.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/hero-expand/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Hero Expand to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-hero-expand` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-hero-expand-ink` | `#0a0a0a` |  |
| `--kz-hero-expand-dim` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-hero-expand-faint` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-hero-expand-soft` | `rgba(10, 10, 10, 0.07)` |  |
| `--kz-hero-expand-bg` | `transparent` |  |
| `--kz-hero-expand-light` | `#f2f2f0` | words and button over the picture, both themes |
| `--kz-hero-expand-dark` | `#0a0a0a` | the button's label |
| `--kz-hero-expand-shade` | `rgba(10, 10, 10, 0.72)` | the readability veil, at its darkest |
| `--kz-hero-expand-width` | `1240px` |  |
| `--kz-hero-expand-gutter` | `clamp(16px, 4vw, 40px)` |  |
| `--kz-hero-expand-pad-y` | `clamp(24px, 3.4vw, 44px)` |  |
| `--kz-hero-expand-top` | `0px` | height of a fixed site header: the scene pins under it |
| `--kz-hero-expand-distance` | `200svh` | how long the scene stays pinned |
| `--kz-hero-expand-crop` | `16%` | on a tall screen, how far the picture rises above it: its top (sky) stays out of view |
| `--kz-hero-expand-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace)` |  |
| `--kz-hero-expand-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-hero-expand {
    --kz-hero-expand-ink: #f2f2f0;
    --kz-hero-expand-dim: rgba(242, 242, 240, 0.64);
    --kz-hero-expand-faint: rgba(242, 242, 240, 0.5);
    --kz-hero-expand-soft: rgba(242, 242, 240, 0.1);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the button | `Enter` | Follows the link |
|  | `Tab` | Moves on, the page scrolls along |
| Tabbing in | `Tab` | Lands on the button, the scene scrolls to where it is up |

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
