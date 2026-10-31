# Magnetic Button

[![Magnetic Button, live on kodza.dev](https://kodza.dev/anim/magnetic-button/og.jpg)](https://kodza.dev/components/magnetic-button/)

A button that leans towards the pointer as it comes near, its words a little further, and settles back softly. Its click area moves with it. Calm on touch screens.

**[Live demo](https://kodza.dev/components/magnetic-button/)** · Buttons · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-magnetic-button.html`](kodza-magnetic-button.html) | 0.3 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-magnetic-button.css`](kodza-magnetic-button.css) | 4.5 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-magnetic-button.js`](kodza-magnetic-button.js) | 6.7 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-magnetic-button.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-magnetic-button.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/magnetic-button/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Make my main call to action a Kodza Magnetic Button.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-magnetic` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-magnetic-bg` | `#0a0a0a` |  |
| `--kz-magnetic-fg` | `#ffffff` |  |
| `--kz-magnetic-height` | `52px` |  |
| `--kz-magnetic-pad-x` | `30px` |  |

- Modifiers: `.kodza-magnetic--round`
- Attributes: `data-strength`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-magnetic {
    --kz-magnetic-bg: #ffffff;
    --kz-magnetic-fg: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
