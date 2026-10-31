# Filter Transitions

[![Filter Transitions, live on kodza.dev](https://kodza.dev/anim/filter-transitions/og.jpg)](https://kodza.dev/components/filter-transitions/)

A filterable grid: the ink pill slides to the filter, leaving cards step back, the others glide to their new place and the new ones arrive in turn.

**[Live demo](https://kodza.dev/components/filter-transitions/)** · Data display · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-filter-transitions.html`](kodza-filter-transitions.html) | 3.7 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-filter-transitions.css`](kodza-filter-transitions.css) | 12.0 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-filter-transitions.js`](kodza-filter-transitions.js) | 10.4 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-filter-transitions.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-filter-transitions.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/filter-transitions/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Make my portfolio grid filterable with Kodza Filter Transitions.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-filter` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-filter-bg` | `#ffffff` |  |
| `--kz-filter-fg` | `#0a0a0a` |  |
| `--kz-filter-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-filter-line` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-filter-ink` | `#0a0a0a` |  |
| `--kz-filter-on-ink` | `#ffffff` |  |
| `--kz-filter-columns` | `4` |  |
| `--kz-filter-gap` | `16px` |  |
| `--kz-filter-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-filter-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-category` (e.g. `buttons`, `text`, `images`, `cards`), `data-filter` (e.g. `all`, `buttons`, `text`, `images`, `cards`)
- Events: `kodza:filter`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-filter {
    --kz-filter-bg: #161616;
    --kz-filter-fg: #f2f2f0;
    --kz-filter-muted: rgba(242, 242, 240, 0.62);
    --kz-filter-line: rgba(255, 255, 255, 0.12);
    --kz-filter-ink: #f2f2f0;
    --kz-filter-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
