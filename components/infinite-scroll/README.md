# Infinite Scroll

[![Infinite Scroll, live on kodza.dev](https://kodza.dev/anim/infinite-scroll/og.jpg)](https://kodza.dev/components/infinite-scroll/)

Placeholders the size of a post shimmer in, then turn into the posts without a jump. Two loads on their own, then a button, so the footer stays reachable.

**[Live demo](https://kodza.dev/components/infinite-scroll/)** · Scroll · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-infinite-scroll.html`](kodza-infinite-scroll.html) | 5.7 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-infinite-scroll.css`](kodza-infinite-scroll.css) | 17.6 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-infinite-scroll.js`](kodza-infinite-scroll.js) | 9.7 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-infinite-scroll.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-infinite-scroll.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/infinite-scroll/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Load more blog posts with Kodza Infinite Scroll.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-feed` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-feed-fg` | `#0a0a0a` |  |
| `--kz-feed-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-feed-line` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-feed-soft` | `rgba(10, 10, 10, 0.06)` |  |
| `--kz-feed-shine` | `rgba(10, 10, 10, 0.11)` |  |
| `--kz-feed-ink` | `#0a0a0a` |  |
| `--kz-feed-on-ink` | `#ffffff` |  |
| `--kz-feed-media` | `112px` |  |
| `--kz-feed-radius` | `calc(12px * var(--kz-radius-scale, 1))` |  |
| `--kz-feed-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-auto` (e.g. `2`), `data-batch` (e.g. `3`), `data-delay` (e.g. `700`)
- Events: `kodza:loaded`, bubbling from the root
- On the root element: `root.kodzaLoad` (see the comment at the top of the JS)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-feed {
    --kz-feed-fg: #f2f2f0;
    --kz-feed-muted: rgba(242, 242, 240, 0.62);
    --kz-feed-line: rgba(255, 255, 255, 0.1);
    --kz-feed-soft: rgba(255, 255, 255, 0.06);
    --kz-feed-shine: rgba(255, 255, 255, 0.12);
    --kz-feed-ink: #f2f2f0;
    --kz-feed-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
