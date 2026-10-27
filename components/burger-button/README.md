# Burger Button

[![Burger Button, live on kodza.dev](https://kodza.dev/anim/burger-button/og.jpg)](https://kodza.dev/components/burger-button/)

A menu button: the lines meet, then cross, and Menu rolls to Close at a fixed width. It follows aria-expanded and fires kodza:burger, so it drives the menu you already have.

**[Live demo](https://kodza.dev/components/burger-button/)** · Navigation · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-burger-button.html`](kodza-burger-button.html) | 0.8 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-burger-button.css`](kodza-burger-button.css) | 7.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-burger-button.js`](kodza-burger-button.js) | 6.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-burger-button.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-burger-button.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/burger-button/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Burger Button to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-burger` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-burger-ink` | `#0a0a0a` |  |
| `--kz-burger-on-ink` | `#ffffff` |  |
| `--kz-burger-height` | `40px` |  |
| `--kz-burger-duration` | `0.5s` |  |
| `--kz-burger-meet` | `cubic-bezier(0.65, 0, 0.35, 1)` |  |
| `--kz-burger-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-burger-gap` | `6px` |  |
| `--kz-burger-half` | `calc(var(--kz-burger-gap) / 2)` |  |

- Modifiers: `.kodza-burger--bare`, `.kodza-burger--round`, `.kodza-burger--three`
- Attributes: `data-target`
- Events: `kodza:burger`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-burger {
    --kz-burger-ink: #f2f2f0;
    --kz-burger-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the button | `Enter` / `Space` | Opens or closes, the lines cross or part |
| While it is open | `Escape` | Closes, and brings the focus back from the menu |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
