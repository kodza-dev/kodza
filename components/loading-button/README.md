# Loading Button

[![Loading Button, live on kodza.dev](https://kodza.dev/anim/loading-button/og.jpg)](https://kodza.dev/components/loading-button/)

A button that shows its work: its words roll from Deploy to Deploying while a ring comes in, then the ring closes on a tick for Deployed. The width never moves.

**[Live demo](https://kodza.dev/components/loading-button/)** · Buttons · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-loading-button.html`](kodza-loading-button.html) | 0.8 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-loading-button.css`](kodza-loading-button.css) | 8.1 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-loading-button.js`](kodza-loading-button.js) | 5.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-loading-button.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-loading-button.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/loading-button/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Make the submit button of my form a Kodza Loading Button.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-loading-button` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-loading-bg` | `#0a0a0a` |  |
| `--kz-loading-fg` | `#ffffff` |  |
| `--kz-loading-height` | `52px` |  |
| `--kz-loading-pad-x` | `28px` |  |
| `--kz-loading-icon` | `18px` |  |
| `--kz-loading-gap` | `10px` |  |
| `--kz-loading-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-loading-room` | `calc((var(--kz-loading-icon) + var(--kz-loading-gap)) / 2)` |  |

- Modifiers: `.kodza-loading-button--soft`
- Attributes: `data-state` (e.g. `loading`, `done`)
- Events: `kodza:loading`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-loading-button {
    --kz-loading-bg: #ffffff;
    --kz-loading-fg: #0a0a0a;
  }

  .kodza-loading-button--soft {
    --kz-loading-bg: rgba(255, 255, 255, 0.1);
    --kz-loading-fg: #ffffff;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
