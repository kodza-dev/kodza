# Logo Swap

[![Logo Swap, live on kodza.dev](https://kodza.dev/anim/logo-swap/og.jpg)](https://kodza.dev/components/logo-swap/)

More customer logos than cells: every few seconds one cell swaps its logo, the old one leaving upwards as the next rises in. Every logo weighs the same; hover or pause holds them.

**[Live demo](https://kodza.dev/components/logo-swap/)** · Testimonials & logos · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-logo-swap.html`](kodza-logo-swap.html) | 28.9 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-logo-swap.css`](kodza-logo-swap.css) | 18.7 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-logo-swap.js`](kodza-logo-swap.js) | 13.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-logo-swap.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-logo-swap.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/logo-swap/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Logo Swap to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-logo-swap]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-logo-swap-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-logo-swap-dim` | `color-mix(in srgb, var(--kz-logo-swap-ink) 64%, transparent)` |  |
| `--kz-logo-swap-logo` | `color-mix(in srgb, var(--kz-logo-swap-ink) 72%, transparent)` | the logos, a step under the ink |
| `--kz-logo-swap-img-filter` | `grayscale(1) opacity(0.72)` | a logo given as an img; on a dark band: brightness(0) invert(1) opacity(0.72) |
| `--kz-logo-swap-rule` | `color-mix(in srgb, var(--kz-logo-swap-ink) 10%, transparent)` | the hairlines of the grid |
| `--kz-logo-swap-track` | `color-mix(in srgb, var(--kz-logo-swap-ink) 16%, transparent)` |  |
| `--kz-logo-swap-bg` | `transparent` |  |
| `--kz-logo-swap-columns` | `6` |  |
| `--kz-logo-swap-rows` | `1` | the cells on show: columns x rows; the other logos wait their turn |
| `--kz-logo-swap-columns-narrow` | `3` | under 760px |
| `--kz-logo-swap-rows-narrow` | `2` |  |
| `--kz-logo-swap-cell` | `88px` | the height of a cell |
| `--kz-logo-swap-area` | `2300` | square pixels per logo: a wide one sits lower, a square one taller, all weigh the same |
| `--kz-logo-swap-max` | `40px` | the tallest a logo gets |
| `--kz-logo-swap-width` | `var(--kz-page-width, 1440px)` |  |
| `--kz-logo-swap-pad-y` | `clamp(56px, 7vw, 96px)` |  |
| `--kz-logo-swap-gutter` | `var(--kz-page-gutter, clamp(16px, 4vw, 40px))` |  |
| `--kz-logo-swap-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-logo-swap-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-logo-swap--grid`
- Attributes: `data-interval` (e.g. `2600`), `data-kodza-logo-swap`
- On the root element: `root.kodzaSwap` (see the comment at the top of the JS)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-logo-swap {
    --kz-logo-swap-ink: #f2f2f0;
    --kz-logo-swap-dim: rgba(242, 242, 240, 0.64);
    --kz-logo-swap-logo: rgba(242, 242, 240, 0.72);
    --kz-logo-swap-img-filter: brightness(0) invert(1) opacity(0.72);
    --kz-logo-swap-rule: rgba(242, 242, 240, 0.12);
    --kz-logo-swap-track: rgba(242, 242, 240, 0.18);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

Every colour is a variable on the section: set --kz-logo-swap-ink, -dim, -logo, -rule and -track, and -img-filter for img logos (the demo's dark band has the recipe).

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the pause button | `Enter` / `Space` | Stops the logos, or starts them again |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
