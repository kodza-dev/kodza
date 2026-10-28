# Range Slider

[![Range Slider, live on kodza.dev](https://kodza.dev/anim/range-slider/og.jpg)](https://kodza.dev/components/range-slider/)

Real range inputs on a drawn track: a value bubble pops out of the handle, ticks darken as the fill passes, and two handles push each other instead of crossing.

**[Live demo](https://kodza.dev/components/range-slider/)** · Forms · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-range-slider.html`](kodza-range-slider.html) | 0.9 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-range-slider.css`](kodza-range-slider.css) | 11.1 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-range-slider.js`](kodza-range-slider.js) | 6.9 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-range-slider.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-range-slider.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/range-slider/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Use the Kodza Range Slider for my price filter.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-range` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-range-bg` | `#ffffff` |  |
| `--kz-range-fg` | `#0a0a0a` |  |
| `--kz-range-muted` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-range-rail` | `rgba(10, 10, 10, 0.12)` |  |
| `--kz-range-ink` | `#0a0a0a` |  |
| `--kz-range-on-ink` | `#ffffff` |  |
| `--kz-range-thumb` | `22px` |  |
| `--kz-range-height` | `4px` |  |
| `--kz-range-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-prefix` (e.g. `€`), `data-suffix`, `data-ticks`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-range {
    --kz-range-bg: #161616;
    --kz-range-fg: #f2f2f0;
    --kz-range-muted: rgba(242, 242, 240, 0.62);
    --kz-range-rail: rgba(255, 255, 255, 0.16);
    --kz-range-ink: #f2f2f0;
    --kz-range-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a handle | `ArrowRight` / `ArrowUp` | One step up, the other handle gets pushed along |
|  | `ArrowLeft` / `ArrowDown` | One step down, the other handle gets pushed along |
|  | `Home` / `End` | Jumps to the minimum or the maximum |
|  | `PageUp` / `PageDown` | A tenth of the range up or down |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
