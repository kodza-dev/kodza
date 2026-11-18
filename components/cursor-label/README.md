# Cursor Label

[![Cursor Label, live on kodza.dev](https://kodza.dev/anim/cursor-label/og.jpg)](https://kodza.dev/components/cursor-label/)

A project grid whose name tags follow the pointer inside each card, a step behind, cut by the card's edge and leaving by the edge the hand leaves by. In the corner on focus and under a finger.

**[Live demo](https://kodza.dev/components/cursor-label/)** · Cursor · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-cursor-label.html`](kodza-cursor-label.html) | 2.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-cursor-label.css`](kodza-cursor-label.css) | 13.6 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-cursor-label.js`](kodza-cursor-label.js) | 13.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-cursor-label.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-cursor-label.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/cursor-label/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Cursor Label to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-cursor-label]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-cursor-label-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-cursor-label-surface` | `var(--kz-color-paper, #fff)` |  |
| `--kz-cursor-label-line` | `color-mix(in srgb, var(--kz-cursor-label-ink) 10%, transparent)` |  |
| `--kz-cursor-label-faint` | `color-mix(in srgb, var(--kz-cursor-label-ink) 62%, transparent)` |  |
| `--kz-cursor-label-accent` | `var(--kz-color-accent, var(--kz-cursor-label-ink))` |  |
| `--kz-cursor-label-on-accent` | `var(--kz-color-on-accent, var(--kz-cursor-label-surface))` |  |
| `--kz-cursor-label-year` | `color-mix(in srgb, var(--kz-cursor-label-on-accent) 62%, transparent)` |  |
| `--kz-cursor-label-tag-height` | `34px` |  |
| `--kz-cursor-label-inset` | `16px` |  |
| `--kz-cursor-label-ratio` | `4 / 3` |  |
| `--kz-cursor-label-gap` | `clamp(10px, 1.4vw, 18px)` |  |
| `--kz-cursor-label-gutter` | `clamp(12px, 2vw, 24px)` |  |
| `--kz-cursor-label-corner` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-cursor-label-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-cursor-label-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-kodza-cursor-label`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-cursor-label {
    --kz-cursor-label-ink: #f2f2f0;
    --kz-cursor-label-surface: #161616;
    --kz-cursor-label-line: rgba(255, 255, 255, 0.12);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
