# Heading Anchor

[![Heading Anchor, live on kodza.dev](https://kodza.dev/anim/heading-anchor/og.jpg)](https://kodza.dev/components/heading-anchor/)

A # beside every heading. It slides out of the margin when the heading is pointed at, or waits after the last word on a touch screen. Click it, or the heading, to put the section in the bar and copy the link.

**[Live demo](https://kodza.dev/components/heading-anchor/)** · Links · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-heading-anchor.html`](kodza-heading-anchor.html) | 0.7 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-heading-anchor.css`](kodza-heading-anchor.css) | 17.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-heading-anchor.js`](kodza-heading-anchor.js) | 15.0 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-heading-anchor.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-heading-anchor.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/heading-anchor/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Heading Anchor to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-heading-anchor]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-heading-anchor-heading` | `#0a0a0a` |  |
| `--kz-heading-anchor-text` | `rgba(10, 10, 10, 0.72)` |  |
| `--kz-heading-anchor-ink` | `currentColor` |  |
| `--kz-heading-anchor-muted` | `color-mix(in srgb, currentColor 50%, transparent)` |  |
| `--kz-heading-anchor-paper` | `#fff` |  |
| `--kz-heading-anchor-line` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-heading-anchor-gap` | `0.3em` |  |
| `--kz-heading-anchor-size` | `0.75em` |  |
| `--kz-heading-anchor-offset` | `24px` |  |
| `--kz-heading-anchor-duration` | `0.24s` |  |
| `--kz-heading-anchor-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-copied`, `data-failed`, `data-headings`, `data-kodza-heading-anchor`, `data-label`, `data-target`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-heading-anchor {
    --kz-heading-anchor-heading: #f2f2f0;
    --kz-heading-anchor-text: rgba(242, 242, 240, 0.72);
    --kz-heading-anchor-ink: #f2f2f0;
    --kz-heading-anchor-paper: #161616;
    --kz-heading-anchor-line: rgba(255, 255, 255, 0.12);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a heading link | `Enter` | Copies the section's link and puts it in the address bar |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
