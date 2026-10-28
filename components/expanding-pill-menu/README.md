# Expanding Pill Menu

[![Expanding Pill Menu, live on kodza.dev](https://kodza.dev/anim/expanding-pill-menu/og.jpg)](https://kodza.dev/components/expanding-pill-menu/)

A Menu button that grows into the menu around itself: the card widens, then unfolds, Close stays on the button, and each link rises as the edge uncovers it. Grows upward near the bottom.

**[Live demo](https://kodza.dev/components/expanding-pill-menu/)** · Navigation · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-expanding-pill-menu.html`](kodza-expanding-pill-menu.html) | 2.4 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-expanding-pill-menu.css`](kodza-expanding-pill-menu.css) | 19.1 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-expanding-pill-menu.js`](kodza-expanding-pill-menu.js) | 32.9 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-expanding-pill-menu.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-expanding-pill-menu.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/expanding-pill-menu/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Expanding Pill Menu to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-expanding-pill` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-expanding-pill-bg` | `#0a0a0a` | the button, and the card it becomes |
| `--kz-expanding-pill-fg` | `#f2f2f0` |  |
| `--kz-expanding-pill-muted` | `rgba(242, 242, 240, 0.62)` |  |
| `--kz-expanding-pill-shade` | `rgba(10, 10, 10, 0.2)` | over the page while it is open |
| `--kz-expanding-pill-width` | `360px` | the card, never wider than the screen minus 12px a side |
| `--kz-expanding-pill-size` | `34px` | the links |
| `--kz-expanding-pill-inset` | `6px` | from the card's edge to Close: the corners stay concentric |
| `--kz-expanding-pill-duration` | `0.8s` |  |
| `--kz-expanding-pill-ease` | `cubic-bezier(0.62, 0, 0.22, 1)` |  |

- Attributes: `data-page`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-expanding-pill {
    --kz-expanding-pill-bg: #f2f2f0;
    --kz-expanding-pill-fg: #0a0a0a;
    --kz-expanding-pill-muted: rgba(10, 10, 10, 0.62);
    --kz-expanding-pill-shade: rgba(0, 0, 0, 0.5);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the button | `Enter` / `Space` | Opens it on the current link, or the first |
| In the menu | `ArrowDown` / `ArrowUp` | Next or previous link, round and round |
|  | `Home` / `End` | First or last link |
|  | `Tab` / `Shift+Tab` | Stays inside the menu, round and round |
|  | `PageUp` / `PageDown` | Held back, the page behind stays put |
| Anywhere, while it's open | `Escape` | Folds it back into the button, focus on Menu |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
