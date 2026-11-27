# Flip Card

[![Flip Card, live on kodza.dev](https://kodza.dev/anim/flip-card/og.jpg)](https://kodza.dev/components/flip-card/)

A two-sided card you take by an edge: it turns over from the side under the mouse, and the face that arrives lays its lines down one by one from behind a mask. Click or hover, reversible mid-turn.

**[Live demo](https://kodza.dev/components/flip-card/)** · Cards · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-flip-card.html`](kodza-flip-card.html) | 6.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-flip-card.css`](kodza-flip-card.css) | 23.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-flip-card.js`](kodza-flip-card.js) | 11.1 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-flip-card.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-flip-card.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/flip-card/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Flip Card to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-flip-card]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-flip-card-bg` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-flip-card-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-flip-card-back-bg` | `var(--kz-flip-card-fg)` |  |
| `--kz-flip-card-back-fg` | `var(--kz-flip-card-bg)` |  |
| `--kz-flip-card-border` | `color-mix(in srgb, var(--kz-flip-card-fg) 10%, transparent)` |  |
| `--kz-flip-card-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-flip-card-pad` | `28px` |  |
| `--kz-flip-card-min-height` | `380px` |  |
| `--kz-flip-card-perspective` | `1400px` |  |
| `--kz-flip-card-peek` | `7deg` | how far the edge under the mouse lifts |
| `--kz-flip-card-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-flip-card-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |

- Modifiers: `.kodza-flip-card--vertical`
- Attributes: `data-kodza-flip-card`, `data-trigger` (e.g. `hover`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-flip-card {
    --kz-flip-card-bg: #161616;
    --kz-flip-card-fg: #f2f2f0;
    --kz-flip-card-border: rgba(255, 255, 255, 0.12);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a face's button | `Enter` / `Space` | Turns the card over, focus goes to the face now shown |
| Anywhere in a flipped card | `Escape` | Turns it back to the front, focus on the front button |

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
