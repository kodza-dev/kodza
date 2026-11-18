# Drag Cursor

[![Drag Cursor, live on kodza.dev](https://kodza.dev/anim/drag-cursor/og.jpg)](https://kodza.dev/components/drag-cursor/)

A Drag disc beside the pointer over any zone marked data-cursor="drag": it tightens on press, the arrow you pull toward leans out, and a strip gets mouse drag with its snap. Swipe under a finger.

**[Live demo](https://kodza.dev/components/drag-cursor/)** · Cursor · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-drag-cursor.html`](kodza-drag-cursor.html) | 3.6 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-drag-cursor.css`](kodza-drag-cursor.css) | 16.6 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-drag-cursor.js`](kodza-drag-cursor.js) | 19.9 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-drag-cursor.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-drag-cursor.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/drag-cursor/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Drag Cursor to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-drag-cursor]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-drag-cursor-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-drag-cursor-surface` | `var(--kz-color-paper, #fff)` |  |
| `--kz-drag-cursor-line` | `color-mix(in srgb, var(--kz-drag-cursor-ink) 10%, transparent)` |  |
| `--kz-drag-cursor-faint` | `color-mix(in srgb, var(--kz-drag-cursor-ink) 62%, transparent)` |  |
| `--kz-drag-cursor-accent` | `var(--kz-color-accent, var(--kz-drag-cursor-ink))` |  |
| `--kz-drag-cursor-on-accent` | `var(--kz-color-on-accent, var(--kz-drag-cursor-surface))` |  |
| `--kz-drag-cursor-size` | `84px` |  |
| `--kz-drag-cursor-squeeze` | `0.84` |  |
| `--kz-drag-cursor-spread` | `7px` |  |
| `--kz-drag-cursor-slide` | `clamp(220px, 34cqi, 340px)` |  |
| `--kz-drag-cursor-ratio` | `4 / 5` |  |
| `--kz-drag-cursor-zoom` | `1.18` |  |
| `--kz-drag-cursor-gap` | `clamp(10px, 1.4vw, 18px)` |  |
| `--kz-drag-cursor-gutter` | `clamp(12px, 2vw, 24px)` |  |
| `--kz-drag-cursor-corner` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-drag-cursor-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-drag-cursor-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-cursor` (e.g. `drag`), `data-kodza-drag-cursor`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-drag-cursor {
    --kz-drag-cursor-ink: #f2f2f0;
    --kz-drag-cursor-surface: #161616;
    --kz-drag-cursor-line: rgba(255, 255, 255, 0.12);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
