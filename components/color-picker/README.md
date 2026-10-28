# Color Picker

[![Color Picker, live on kodza.dev](https://kodza.dev/anim/color-picker/og.jpg)](https://kodza.dev/components/color-picker/)

A real colour input with a proper panel: saturation square, hue slider, hex field, presets, eyedropper and copy. Pick a preset and the handles glide to it.

**[Live demo](https://kodza.dev/components/color-picker/)** · Forms · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-color-picker.html`](kodza-color-picker.html) | 0.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-color-picker.css`](kodza-color-picker.css) | 20.0 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-color-picker.js`](kodza-color-picker.js) | 15.7 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-color-picker.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-color-picker.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/color-picker/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Color Picker to my theme settings form.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-color` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-color-bg` | `#ffffff` |  |
| `--kz-color-fg` | `#0a0a0a` |  |
| `--kz-color-muted` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-color-line` | `rgba(10, 10, 10, 0.14)` |  |
| `--kz-color-line-hover` | `rgba(10, 10, 10, 0.3)` |  |
| `--kz-color-soft` | `rgba(10, 10, 10, 0.06)` |  |
| `--kz-color-shadow` | `0 18px 40px -16px rgba(10, 10, 10, 0.3)` |  |
| `--kz-color-height` | `56px` |  |
| `--kz-color-radius` | `12px` |  |
| `--kz-color-pad` | `16px` |  |
| `--kz-color-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-hex`, `data-presets`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-color {
    --kz-color-bg: #161616;
    --kz-color-fg: #f2f2f0;
    --kz-color-muted: rgba(242, 242, 240, 0.62);
    --kz-color-line: rgba(255, 255, 255, 0.14);
    --kz-color-line-hover: rgba(255, 255, 255, 0.3);
    --kz-color-soft: rgba(255, 255, 255, 0.08);
    --kz-color-shadow: 0 18px 40px -16px rgba(0, 0, 0, 0.8);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the colour square | `ArrowLeft` / `ArrowRight` | Less or more saturation, Shift for bigger steps |
|  | `ArrowUp` / `ArrowDown` | Brighter or darker, Shift for bigger steps |
| On the hue slider | `ArrowLeft` / `ArrowDown` | Hue one degree lower |
|  | `ArrowRight` / `ArrowUp` | Hue one degree higher |
| In the hex code field | a letter | Types a #rgb or #rrggbb code, applied once valid |
| On the field | `Enter` / `Space` | Opens the panel, focus on the colour square |
| Anywhere in it, while it's open | `Escape` | Closes it, focus back on the field |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
