# Sheet

[![Sheet, live on kodza.dev](https://kodza.dev/anim/drawer/og.jpg)](https://kodza.dev/components/drawer/)

A panel that slides in from the right, and on phones rises from the bottom as a sheet you drag, with half and full stops and a flick to dismiss.

**[Live demo](https://kodza.dev/components/drawer/)** · Overlays · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-drawer.html`](kodza-drawer.html) | 1.6 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-drawer.css`](kodza-drawer.css) | 23.5 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-drawer.js`](kodza-drawer.js) | 10.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-drawer.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-drawer.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/drawer/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Open my cart in a Kodza Sheet.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-sheet` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-sheet-bg` | `#ffffff` |  |
| `--kz-sheet-fg` | `#0a0a0a` |  |
| `--kz-sheet-muted` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-sheet-line` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-sheet-soft` | `rgba(10, 10, 10, 0.05)` |  |
| `--kz-sheet-ink` | `#0a0a0a` |  |
| `--kz-sheet-on-ink` | `#ffffff` |  |
| `--kz-sheet-backdrop` | `rgba(10, 10, 10, 0.3)` |  |
| `--kz-sheet-width` | `420px` |  |
| `--kz-sheet-radius` | `calc(20px * var(--kz-radius-scale, 1))` |  |
| `--kz-sheet-duration` | `0.55s` |  |
| `--kz-sheet-ease` | `cubic-bezier(0.32, 0.72, 0, 1)` |  |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-sheet {
    --kz-sheet-bg: #161616;
    --kz-sheet-fg: #f2f2f0;
    --kz-sheet-muted: rgba(242, 242, 240, 0.62);
    --kz-sheet-line: rgba(255, 255, 255, 0.12);
    --kz-sheet-soft: rgba(255, 255, 255, 0.07);
    --kz-sheet-ink: #f2f2f0;
    --kz-sheet-on-ink: #0a0a0a;
    --kz-sheet-backdrop: rgba(0, 0, 0, 0.55);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the button | `Enter` / `Space` | Opens it, focus goes into the panel |
| In the panel | `Tab` / `Shift+Tab` | Next or previous control, the page behind is out of reach |
| Anywhere, while it's open | `Escape` | Closes it, focus back on the button |

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
