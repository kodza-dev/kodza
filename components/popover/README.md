# Popover

[![Popover, live on kodza.dev](https://kodza.dev/anim/popover/og.jpg)](https://kodza.dev/components/popover/)

A panel that grows out of its trigger, arrow pointing back at it, and flips when there is no room. On click, or on hover as a hover card that stays put.

**[Live demo](https://kodza.dev/components/popover/)** · Overlays · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-popover.html`](kodza-popover.html) | 1.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-popover.css`](kodza-popover.css) | 13.5 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-popover.js`](kodza-popover.js) | 11.6 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-popover.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-popover.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/popover/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Show user details in a Kodza Popover on hover.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-popover` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-pop-bg` | `#ffffff` |  |
| `--kz-pop-fg` | `#0a0a0a` |  |
| `--kz-pop-muted` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-pop-line` | `rgba(10, 10, 10, 0.12)` |  |
| `--kz-pop-soft` | `rgba(10, 10, 10, 0.05)` |  |
| `--kz-pop-ink` | `#0a0a0a` |  |
| `--kz-pop-on-ink` | `#ffffff` |  |
| `--kz-pop-shadow` | `0 18px 40px -16px rgba(10, 10, 10, 0.3)` |  |
| `--kz-pop-width` | `300px` |  |
| `--kz-pop-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-popover--hover`
- Attributes: `data-side` (e.g. `bottom`, `top`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-popover {
    --kz-pop-bg: #161616;
    --kz-pop-fg: #f2f2f0;
    --kz-pop-muted: rgba(242, 242, 240, 0.62);
    --kz-pop-line: rgba(255, 255, 255, 0.14);
    --kz-pop-soft: rgba(255, 255, 255, 0.07);
    --kz-pop-ink: #f2f2f0;
    --kz-pop-on-ink: #0a0a0a;
    --kz-pop-shadow: 0 18px 40px -16px rgba(0, 0, 0, 0.8);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the button | `Enter` / `Space` | Opens it with focus inside, or closes it |
| On the link | `Tab` / `Shift+Tab` | Closes the card and moves on |
| In the panel | `Escape` | Closes it, focus back on the button |
| Anywhere, while it's open | `Escape` | Closes it |

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
