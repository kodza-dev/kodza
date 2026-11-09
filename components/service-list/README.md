# Service List

[![Service List, live on kodza.dev](https://kodza.dev/anim/service-list/og.jpg)](https://kodza.dev/components/service-list/)

An agency's services as large numbered rows on hairlines. A row opens to two lines, its deliverables, a starting price and a lead time, and a link. Native details underneath, one row open at a time.

**[Live demo](https://kodza.dev/components/service-list/)** · Feature sections · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-service-list.html`](kodza-service-list.html) | 5.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-service-list.css`](kodza-service-list.css) | 27.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-service-list.js`](kodza-service-list.js) | 13.1 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-service-list.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-service-list.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/service-list/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Service List to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-service-list` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-service-list-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-service-list-dim` | `color-mix(in srgb, var(--kz-service-list-ink) 66%, transparent)` |  |
| `--kz-service-list-faint` | `color-mix(in srgb, var(--kz-service-list-ink) 60%, transparent)` |  |
| `--kz-service-list-line` | `color-mix(in srgb, var(--kz-service-list-ink) 12%, transparent)` | the hairlines and the outlines |
| `--kz-service-list-paper` | `var(--kz-color-paper, #fff)` | the − on the ink of an open row |
| `--kz-service-list-bg` | `transparent` |  |
| `--kz-service-list-width` | `var(--kz-page-width, 1440px)` | the content column: the page's, set by the site |
| `--kz-service-list-gutter` | `var(--kz-page-gutter, clamp(16px, 4vw, 40px))` | the space kept at the screen edges |
| `--kz-service-list-pad-top` | `clamp(56px, 7vw, 112px)` |  |
| `--kz-service-list-pad-bottom` | `clamp(56px, 7vw, 112px)` |  |
| `--kz-service-list-size` | `clamp(28px, 3.4vw, 44px)` | the title |
| `--kz-service-list-name` | `clamp(24px, 3.4cqi, 44px)` | the name of a service |
| `--kz-service-list-index` | `clamp(44px, 9cqi, 132px)` | the column of the numbers |
| `--kz-service-list-gap` | `clamp(16px, 2.4cqi, 32px)` |  |
| `--kz-service-list-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-service-list-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-single`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-service-list {
    --kz-service-list-ink: #f2f2f0;
    --kz-service-list-paper: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
