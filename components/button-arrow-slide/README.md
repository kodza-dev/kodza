# Arrow Button

[![Arrow Button, live on kodza.dev](https://kodza.dev/anim/button-arrow-slide/og.jpg)](https://kodza.dev/components/button-arrow-slide/)

An arrow that draws itself in on hover, nudges the label aside, then carries on through the button when you leave.

**[Live demo](https://kodza.dev/components/button-arrow-slide/)** · Buttons · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-button-arrow-slide.html`](kodza-button-arrow-slide.html) | 0.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-button-arrow-slide.css`](kodza-button-arrow-slide.css) | 6.5 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-button-arrow-slide.js`](kodza-button-arrow-slide.js) | 4.6 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-button-arrow-slide.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-button-arrow-slide.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/button-arrow-slide/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Make my Get started button a Kodza Arrow Button.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-arrow-button` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-arrow-bg` | `#0a0a0a` |  |
| `--kz-arrow-fg` | `#ffffff` |  |
| `--kz-arrow-border` | `transparent` |  |
| `--kz-arrow-height` | `52px` |  |
| `--kz-arrow-pad-x` | `28px` |  |
| `--kz-arrow-radius` | `999px` |  |
| `--kz-arrow-shift` | `17px` |  |
| `--kz-arrow-duration` | `0.6s` |  |
| `--kz-arrow-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-arrow-button--ghost`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-arrow-button {
    --kz-arrow-bg: #ffffff;
    --kz-arrow-fg: #0a0a0a;
  }

  .kodza-arrow-button--ghost {
    --kz-arrow-bg: transparent;
    --kz-arrow-fg: #ffffff;
    --kz-arrow-border: rgba(255, 255, 255, 0.85);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
