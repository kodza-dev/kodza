# Horizontal Scroll

[![Horizontal Scroll, live on kodza.dev](https://kodza.dev/anim/horizontal-scroll/og.jpg)](https://kodza.dev/components/horizontal-scroll/)

A section that pins itself while its cards slide sideways as you scroll down. Pictures drift in their frames, the counter rolls. A swipe on touch.

**[Live demo](https://kodza.dev/components/horizontal-scroll/)** · Scroll · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-horizontal-scroll.html`](kodza-horizontal-scroll.html) | 2.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-horizontal-scroll.css`](kodza-horizontal-scroll.css) | 11.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-horizontal-scroll.js`](kodza-horizontal-scroll.js) | 7.6 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-horizontal-scroll.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-horizontal-scroll.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/horizontal-scroll/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Show my case studies in a Kodza Horizontal Scroll section.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-hscroll` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-hscroll-fg` | `#0a0a0a` |  |
| `--kz-hscroll-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-hscroll-line` | `rgba(10, 10, 10, 0.12)` |  |
| `--kz-hscroll-card` | `46vh` |  |
| `--kz-hscroll-gap` | `16px` |  |
| `--kz-hscroll-gutter` | `max(24px, calc((100vw - 1080px) / 2))` |  |
| `--kz-hscroll-radius` | `16px` |  |
| `--kz-hscroll-drift` | `8%` |  |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-hscroll {
    --kz-hscroll-fg: #f2f2f0;
    --kz-hscroll-muted: rgba(242, 242, 240, 0.62);
    --kz-hscroll-line: rgba(255, 255, 255, 0.16);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
