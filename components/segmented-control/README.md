# Segmented Control

[![Segmented Control, live on kodza.dev](https://kodza.dev/anim/segmented-control/og.jpg)](https://kodza.dev/components/segmented-control/)

Two to five exclusive choices on real radio buttons. An ink pill slides to the one you pick, stretching on the way, and the labels turn white exactly at its edges.

**[Live demo](https://kodza.dev/components/segmented-control/)** · Forms · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-segmented-control.html`](kodza-segmented-control.html) | 3.6 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-segmented-control.css`](kodza-segmented-control.css) | 14.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-segmented-control.js`](kodza-segmented-control.js) | 11.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-segmented-control.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-segmented-control.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/segmented-control/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Segmented Control to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-segmented` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-segmented-bg` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-segmented-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-segmented-muted` | `color-mix(in srgb, var(--kz-segmented-fg) 58%, transparent)` |  |
| `--kz-segmented-border` | `color-mix(in srgb, var(--kz-segmented-fg) 10%, transparent)` |  |
| `--kz-segmented-ink` | `var(--kz-color-accent, var(--kz-segmented-fg))` |  |
| `--kz-segmented-on-ink` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-segmented-badge` | `color-mix(in srgb, var(--kz-segmented-fg) 7%, transparent)` | the badge on the track |
| `--kz-segmented-badge-on-ink` | `color-mix(in srgb, var(--kz-segmented-on-ink) 20%, transparent)` | the badge under the pill |
| `--kz-segmented-height` | `44px` | the whole pill; the options are 2 × --kz-segmented-pad shorter |
| `--kz-segmented-pad` | `4px` | the room around the ink pill |
| `--kz-segmented-width` | `var(--kz-field-width, 360px)` | --block: the width it fills, at most |
| `--kz-segmented-duration` | `0.55s` | the slide of the pill. 0s = no motion |

- Modifiers: `.kodza-segmented--block`, `.kodza-segmented--icons`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-segmented {
    --kz-segmented-bg: #161616;
    --kz-segmented-fg: #f2f2f0;
    --kz-segmented-muted: rgba(242, 242, 240, 0.62);
    --kz-segmented-border: rgba(255, 255, 255, 0.12);
    --kz-segmented-ink: #f2f2f0;
    --kz-segmented-on-ink: #0a0a0a;
    --kz-segmented-badge: rgba(255, 255, 255, 0.1);
    --kz-segmented-badge-on-ink: rgba(10, 10, 10, 0.12);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On an option | `ArrowRight` / `ArrowDown` | Picks the next option, round and round |
|  | `ArrowLeft` / `ArrowUp` | Picks the previous option, round and round |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
