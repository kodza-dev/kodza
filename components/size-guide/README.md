# Size Guide

[![Size Guide, live on kodza.dev](undefined)](https://kodza.dev/components/size-guide/)

A size guide link that opens the size chart in a drawer, with cm and inches that roll from one to the other and the size picked in the product form underlined.

**[Live demo](https://kodza.dev/components/size-guide/)** · E-commerce · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-size-guide.html`](kodza-size-guide.html) | 2.3 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-size-guide.css`](kodza-size-guide.css) | 35.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-size-guide.js`](kodza-size-guide.js) | 14.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-size-guide.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-size-guide.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/size-guide/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Size Guide to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-size-guide` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-size-guide-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-size-guide-muted` | `color-mix(in srgb, var(--kz-size-guide-fg) 62%, transparent)` |  |
| `--kz-size-guide-line` | `color-mix(in srgb, var(--kz-size-guide-fg) 10%, transparent)` |  |
| `--kz-size-guide-soft` | `color-mix(in srgb, var(--kz-size-guide-fg) 5%, transparent)` |  |
| `--kz-size-guide-paper` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-size-guide-ink` | `var(--kz-color-accent, var(--kz-size-guide-fg))` |  |
| `--kz-size-guide-on-ink` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-size-guide-backdrop` | `rgba(10, 10, 10, 0.3)` |  |
| `--kz-size-guide-width` | `460px` |  |
| `--kz-size-guide-radius` | `calc(20px * var(--kz-radius-scale, 1))` |  |
| `--kz-size-guide-duration` | `0.55s` |  |
| `--kz-size-guide-ease` | `cubic-bezier(0.32, 0.72, 0, 1)` |  |
| `--kz-size-guide-font-mono` | `var(--kz-font-mono, ui-monospace, "SF Mono", Menlo, monospace)` |  |

- Attributes: `data-field` (e.g. `options[Size]`), `data-in`, `data-size` (e.g. `XS`, `S`, `M`, `L`, `XL`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-size-guide {
    --kz-size-guide-fg: #f2f2f0;
    --kz-size-guide-muted: rgba(242, 242, 240, 0.62);
    --kz-size-guide-line: rgba(255, 255, 255, 0.12);
    --kz-size-guide-soft: rgba(255, 255, 255, 0.07);
    --kz-size-guide-paper: #161616;
    --kz-size-guide-ink: #f2f2f0;
    --kz-size-guide-on-ink: #0a0a0a;
    --kz-size-guide-backdrop: rgba(0, 0, 0, 0.55);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the link | `Enter` / `Space` | Opens the chart, focus goes into the drawer |
| On cm / in | `ArrowLeft` / `ArrowRight` | Switches the unit, the figures roll |
| In the drawer | `Tab` / `Shift+Tab` | Next or previous control, the page behind is out of reach |
| Anywhere, while it's open | `Escape` | Closes it, focus back on the link |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
