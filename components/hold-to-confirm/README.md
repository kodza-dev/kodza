# Hold to Confirm

[![Hold to Confirm, live on kodza.dev](https://kodza.dev/anim/hold-to-confirm/og.jpg)](https://kodza.dev/components/hold-to-confirm/)

For the actions you cannot take back: hold it down and an ink pill fills the button, let go too early and it drains back, hold to the end and it ticks. Mouse, finger, Space or Enter.

**[Live demo](https://kodza.dev/components/hold-to-confirm/)** · Buttons · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-hold-to-confirm.html`](kodza-hold-to-confirm.html) | 0.8 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-hold-to-confirm.css`](kodza-hold-to-confirm.css) | 9.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-hold-to-confirm.js`](kodza-hold-to-confirm.js) | 10.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-hold-to-confirm.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-hold-to-confirm.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/hold-to-confirm/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Hold to Confirm to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-hold-to-confirm` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-hold-bg` | `rgba(10, 10, 10, 0.07)` |  |
| `--kz-hold-fg` | `#0a0a0a` |  |
| `--kz-hold-fill` | `#0a0a0a` |  |
| `--kz-hold-fill-fg` | `#ffffff` |  |
| `--kz-hold-ring` | `#0a0a0a` |  |
| `--kz-hold-height` | `52px` |  |
| `--kz-hold-pad-x` | `28px` |  |
| `--kz-hold-icon` | `18px` |  |
| `--kz-hold-gap` | `10px` |  |
| `--kz-hold-peek` | `12px` | how far the ink shows on hover |
| `--kz-hold-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-hold-to-confirm--solid`
- Attributes: `data-hold` (e.g. `2400`), `data-reset`
- Events: `kodza:confirm`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-hold-to-confirm {
    --kz-hold-bg: rgba(255, 255, 255, 0.1);
    --kz-hold-fg: #ffffff;
    --kz-hold-fill: #ffffff;
    --kz-hold-fill-fg: #0a0a0a;
    --kz-hold-ring: #ffffff;
  }

  .kodza-hold-to-confirm--solid {
    --kz-hold-bg: #ffffff;
    --kz-hold-fg: #0a0a0a;
    --kz-hold-fill: #c8c8c3;
    --kz-hold-fill-fg: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the button | `Enter` / `Space` | Hold to fill and confirm, let go early to cancel |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
