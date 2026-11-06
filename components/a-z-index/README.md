# A–Z Index

[![A–Z Index, live on kodza.dev](https://kodza.dev/anim/a-z-index/og.jpg)](https://kodza.dev/components/a-z-index/)

A bar of letters over a grouped list: a click glides to the group, an ink pill follows the letter you read, empty letters stay dimmed. Sticks to the top.

**[Live demo](https://kodza.dev/components/a-z-index/)** · Navigation · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-a-z-index.html`](kodza-a-z-index.html) | 10.9 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-a-z-index.css`](kodza-a-z-index.css) | 15.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-a-z-index.js`](kodza-a-z-index.js) | 14.4 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-a-z-index.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-a-z-index.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/a-z-index/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza A–Z Index to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-a-z-index]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-az-index-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-az-index-muted` | `color-mix(in srgb, var(--kz-az-index-fg) 62%, transparent)` |  |
| `--kz-az-index-faint` | `color-mix(in srgb, var(--kz-az-index-fg) 34%, transparent)` | letters with nothing under them |
| `--kz-az-index-line` | `color-mix(in srgb, var(--kz-az-index-fg) 10%, transparent)` |  |
| `--kz-az-index-hover` | `color-mix(in srgb, var(--kz-az-index-fg) 6%, transparent)` |  |
| `--kz-az-index-ink` | `var(--kz-color-accent, var(--kz-az-index-fg))` |  |
| `--kz-az-index-on-ink` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-az-index-veil` | `rgba(255, 255, 255, 0.78)` | behind the bar once it sticks |
| `--kz-az-index-top` | `0px` | height of a fixed header above it |
| `--kz-az-index-bleed` | `0px` | how far the veil reaches past the sides |
| `--kz-az-index-aside` | `160px` | the column of a group's letter, on wide layouts |
| `--kz-az-index-duration` | `0.5s` |  |
| `--kz-az-index-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-key`, `data-kodza-a-z-index`, `data-label`, `data-letters`, `data-nav-label`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-az-index {
    --kz-az-index-fg: #f2f2f0;
    --kz-az-index-muted: rgba(242, 242, 240, 0.62);
    --kz-az-index-faint: rgba(242, 242, 240, 0.34);
    --kz-az-index-line: rgba(255, 255, 255, 0.12);
    --kz-az-index-hover: rgba(255, 255, 255, 0.08);
    --kz-az-index-ink: #f2f2f0;
    --kz-az-index-on-ink: #0a0a0a;
    --kz-az-index-veil: rgba(10, 10, 10, 0.82);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
