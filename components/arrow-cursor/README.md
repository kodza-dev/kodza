# Arrow Cursor

[![Arrow Cursor, live on kodza.dev](https://kodza.dev/anim/arrow-cursor/og.jpg)](https://kodza.dev/components/arrow-cursor/)

A disc beside the pointer over any picture marked data-cursor="arrows": its arrow swings to the half you are on, the slide count rolls under it, and a click calls the host's own Previous / Next buttons.

**[Live demo](https://kodza.dev/components/arrow-cursor/)** · Cursor · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-arrow-cursor.html`](kodza-arrow-cursor.html) | 2.9 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-arrow-cursor.css`](kodza-arrow-cursor.css) | 21.7 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-arrow-cursor.js`](kodza-arrow-cursor.js) | 24.1 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-arrow-cursor.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-arrow-cursor.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/arrow-cursor/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Arrow Cursor to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-arrow-cursor]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-arrow-cursor-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-arrow-cursor-surface` | `var(--kz-color-paper, #fff)` |  |
| `--kz-arrow-cursor-line` | `color-mix(in srgb, var(--kz-arrow-cursor-ink) 12%, transparent)` |  |
| `--kz-arrow-cursor-faint` | `color-mix(in srgb, var(--kz-arrow-cursor-ink) 62%, transparent)` |  |
| `--kz-arrow-cursor-ratio` | `16 / 10` |  |
| `--kz-arrow-cursor-gutter` | `clamp(12px, 2vw, 24px)` |  |
| `--kz-arrow-cursor-corner` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-arrow-cursor-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-arrow-cursor-turn` | `0.9s` |  |
| `--kz-arrow-cursor-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-cursor` (e.g. `arrows`), `data-cursor-count`, `data-cursor-next`, `data-cursor-prev`, `data-kodza-arrow-cursor`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-arrow-cursor {
    --kz-arrow-cursor-ink: #f2f2f0;
    --kz-arrow-cursor-surface: #161616;
    --kz-arrow-cursor-line: rgba(255, 255, 255, 0.12);
  }

  .kodza-arrow-cursor__disc {
    --kz-arrow-cursor-disc-ink: #f2f2f0;
    --kz-arrow-cursor-disc-paper: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the gallery buttons | `ArrowLeft` / `ArrowRight` | Previous / next frame |
|  | `Enter` / `Space` | Presses the button: previous or next frame |

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
