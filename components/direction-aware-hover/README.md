# Direction-Aware Hover

[![Direction-Aware Hover, live on kodza.dev](https://kodza.dev/anim/direction-aware-hover/og.jpg)](https://kodza.dev/components/direction-aware-hover/)

Tiles whose caption, or a second photo, slides in from the edge the pointer comes from and leaves by the edge it goes out. The keyboard opens it from the bottom; on touch the caption sits under the photo.

**[Live demo](https://kodza.dev/components/direction-aware-hover/)** · Image effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-direction-aware-hover.html`](kodza-direction-aware-hover.html) | 6.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-direction-aware-hover.css`](kodza-direction-aware-hover.css) | 17.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-direction-aware-hover.js`](kodza-direction-aware-hover.js) | 7.3 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-direction-aware-hover.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-direction-aware-hover.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/direction-aware-hover/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Direction-Aware Hover to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-direction-hover` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-direction-hover-columns` | `4` |  |
| `--kz-direction-hover-columns-narrow` | `2` | when the grid is narrower than 640px |
| `--kz-direction-hover-ratio` | `4 / 5` |  |
| `--kz-direction-hover-gap` | `28px 16px` |  |
| `--kz-direction-hover-radius` | `calc(12px * var(--kz-radius-scale, 1))` |  |
| `--kz-direction-hover-duration` | `0.5s` |  |
| `--kz-direction-hover-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-direction-hover-ink` | `#0a0a0a` |  |
| `--kz-direction-hover-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-direction-hover-placeholder` | `rgba(10, 10, 10, 0.06)` | under a photo while it loads |
| `--kz-direction-hover-veil` | `rgba(10, 10, 10, 0.64)` |  |
| `--kz-direction-hover-paper` | `#ffffff` |  |
| `--kz-direction-hover-faint` | `rgba(255, 255, 255, 0.86)` |  |
| `--kz-direction-hover-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |

- Attributes: `data-edge` (e.g. `top`, `right`, `left`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-direction-hover {
    --kz-direction-hover-ink: #f2f2f0;
    --kz-direction-hover-muted: rgba(242, 242, 240, 0.64);
    --kz-direction-hover-placeholder: rgba(255, 255, 255, 0.06);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a tile | `Tab` | Next tile: its caption or second photo rises from the bottom |

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
