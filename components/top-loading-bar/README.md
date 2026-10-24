# Top Loading Bar

[![Top Loading Bar, live on kodza.dev](https://kodza.dev/anim/top-loading-bar/og.jpg)](https://kodza.dev/components/top-loading-bar/)

The thin line at the top of the screen while a page loads: it creeps in shrinking steps, runs to the end and slips off to the right. Starts by itself on the site's links.

**[Live demo](https://kodza.dev/components/top-loading-bar/)** · Feedback & loading · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-top-loading-bar.html`](kodza-top-loading-bar.html) | 0.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-top-loading-bar.css`](kodza-top-loading-bar.css) | 2.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-top-loading-bar.js`](kodza-top-loading-bar.js) | 5.9 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-top-loading-bar.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-top-loading-bar.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/top-loading-bar/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Top Loading Bar between my pages.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-loading-bar` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-loadbar-color` | `#0a0a0a` |  |
| `--kz-loadbar-height` | `3px` |  |
| `--kz-loadbar-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-links`
- On the root element: `root.kodzaLoadingBar` (see the comment at the top of the JS)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-loading-bar {
    --kz-loadbar-color: #f2f2f0;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
