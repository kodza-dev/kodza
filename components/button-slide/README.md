# Roll Button

[![Roll Button, live on kodza.dev](https://kodza.dev/anim/button-slide/og.jpg)](https://kodza.dev/components/button-slide/)

A button whose label rolls up letter by letter on hover, and keeps rolling the same way when you leave. Plain CSS and a few lines of JS.

**[Live demo](https://kodza.dev/components/button-slide/)** · Buttons · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-button-slide.html`](kodza-button-slide.html) | 0.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-button-slide.css`](kodza-button-slide.css) | 5.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-button-slide.js`](kodza-button-slide.js) | 5.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-button-slide.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-button-slide.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/button-slide/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Use the Kodza Roll Button for my newsletter Subscribe.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-roll-button` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-roll-bg` | `#0a0a0a` |  |
| `--kz-roll-fg` | `#ffffff` |  |
| `--kz-roll-border` | `transparent` |  |
| `--kz-roll-height` | `52px` |  |
| `--kz-roll-pad-x` | `28px` |  |
| `--kz-roll-radius` | `var(--kz-radius-pill, 999px)` |  |
| `--kz-roll-duration` | `0.55s` |  |
| `--kz-roll-stagger` | `16ms` |  |
| `--kz-roll-ease` | `cubic-bezier(0.76, 0, 0.24, 1)` |  |

- Modifiers: `.kodza-roll-button--ghost`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-roll-button {
    --kz-roll-bg: #ffffff;
    --kz-roll-fg: #0a0a0a;
  }

  .kodza-roll-button--ghost {
    --kz-roll-bg: transparent;
    --kz-roll-fg: #ffffff;
    --kz-roll-border: rgba(255, 255, 255, 0.85);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
