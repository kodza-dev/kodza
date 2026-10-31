# Badge

[![Badge, live on kodza.dev](https://kodza.dev/anim/badge/og.jpg)](https://kodza.dev/components/badge/)

Small labels: soft, solid, live, mono and a count that rolls. Remove a tag and it shrinks away while its neighbours glide to their new place, across lines too.

**[Live demo](https://kodza.dev/components/badge/)** · Data display · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-badge.html`](kodza-badge.html) | 1.7 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-badge.css`](kodza-badge.css) | 6.7 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-badge.js`](kodza-badge.js) | 8.3 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-badge.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-badge.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/badge/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Tag my blog posts with Kodza Badges.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

- Attributes: `data-count` (e.g. `3`)
- Events: `kodza:badge-remove`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-badge {
    --kz-badge-fg: #f2f2f0;
    --kz-badge-soft: rgba(255, 255, 255, 0.1);
    --kz-badge-line: rgba(255, 255, 255, 0.22);
    --kz-badge-ink: #f2f2f0;
    --kz-badge-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
