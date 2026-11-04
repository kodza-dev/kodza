# Signature Pad

[![Signature Pad, live on kodza.dev](https://kodza.dev/anim/signature-pad/og.jpg)](https://kodza.dev/components/signature-pad/)

A box to sign with a finger, a mouse or a stylus: the ink thins as the pen speeds up, Undo backs the last stroke out along its path, and a typed name signs too. The form gets a trimmed PNG.

**[Live demo](https://kodza.dev/components/signature-pad/)** · Forms · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-signature-pad.html`](kodza-signature-pad.html) | 0.9 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-signature-pad.css`](kodza-signature-pad.css) | 18.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-signature-pad.js`](kodza-signature-pad.js) | 23.4 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-signature-pad.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-signature-pad.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/signature-pad/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Signature Pad to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-signature` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-signature-bg` | `#ffffff` |  |
| `--kz-signature-fg` | `#0a0a0a` |  |
| `--kz-signature-muted` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-signature-line` | `rgba(10, 10, 10, 0.14)` |  |
| `--kz-signature-line-hover` | `rgba(10, 10, 10, 0.3)` |  |
| `--kz-signature-soft` | `rgba(10, 10, 10, 0.06)` |  |
| `--kz-signature-error` | `#0a0a0a` | a message, never colour alone: set a red here if you want one |
| `--kz-signature-ink` | `#0a0a0a` | the ink on screen |
| `--kz-signature-print` | `#0a0a0a` | the ink in the image the form gets, for a white page |
| `--kz-signature-pen-min` | `0.8px` | the thinnest line, at full speed (read by the script) |
| `--kz-signature-pen-max` | `3.2px` | the thickest, when the pen slows down |
| `--kz-signature-name-size` | `34px` | the name typed on the line |
| `--kz-signature-height` | `200px` |  |
| `--kz-signature-width` | `var(--kz-field-width, 480px)` |  |
| `--kz-signature-radius` | `calc(12px * var(--kz-radius-scale, 1))` |  |
| `--kz-signature-duration` | `0.35s` |  |
| `--kz-signature-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-locale`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-signature {
    --kz-signature-bg: #161616;
    --kz-signature-fg: #f2f2f0;
    --kz-signature-muted: rgba(242, 242, 240, 0.62);
    --kz-signature-line: rgba(255, 255, 255, 0.14);
    --kz-signature-line-hover: rgba(255, 255, 255, 0.3);
    --kz-signature-soft: rgba(255, 255, 255, 0.08);
    --kz-signature-error: #f2f2f0;
    --kz-signature-ink: #f2f2f0;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the signature line | a letter | Types your name in place of a drawing |
| On Undo | `Enter` / `Space` | Removes the last stroke |
| On Clear | `Enter` / `Space` | Clears the drawing or the typed name |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
