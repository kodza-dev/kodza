# Fill Button

[![Fill Button, live on kodza.dev](https://kodza.dev/anim/button-fill/og.jpg)](https://kodza.dev/components/button-fill/)

A button that fills from the exact point your cursor enters and empties toward where it leaves, with a rolling label and a looping arrow.

**[Live demo](https://kodza.dev/components/button-fill/)** · Buttons · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-button-fill.html`](kodza-button-fill.html) | 0.6 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-button-fill.css`](kodza-button-fill.css) | 7.8 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-button-fill.js`](kodza-button-fill.js) | 5.1 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-button-fill.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-button-fill.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/button-fill/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Put the Kodza Fill Button on my sign-up button.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-fill-button` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-fill-fg` | `#0a0a0a` |  |
| `--kz-fill-bg` | `transparent` |  |
| `--kz-fill-border` | `rgba(10, 10, 10, 0.9)` |  |
| `--kz-fill-fill` | `#0a0a0a` |  |
| `--kz-fill-fill-fg` | `#ffffff` |  |
| `--kz-fill-radius` | `999px` |  |
| `--kz-fill-height` | `52px` |  |
| `--kz-fill-pad-x` | `28px` |  |
| `--kz-fill-gap` | `10px` |  |
| `--kz-fill-duration` | `0.65s` |  |
| `--kz-fill-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-fill-button--solid`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-fill-button {
    --kz-fill-fg: #ffffff;
    --kz-fill-border: rgba(255, 255, 255, 0.85);
    --kz-fill-fill: #ffffff;
    --kz-fill-fill-fg: #0a0a0a;
  }

  .kodza-fill-button--solid {
    --kz-fill-bg: #ffffff;
    --kz-fill-fg: #0a0a0a;
    --kz-fill-border: transparent;
    --kz-fill-fill: #d9d9d5;
    --kz-fill-fill-fg: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
