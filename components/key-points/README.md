# Key Points

[![Key Points, live on kodza.dev](https://kodza.dev/anim/key-points/og.jpg)](https://kodza.dev/components/key-points/)

Three to six facts on 1 px hairlines that draw across as each row comes into view: a term and its sentence in rows, or columns. A big figure can lead each point, its digits rolling into place.

**[Live demo](https://kodza.dev/components/key-points/)** · Content sections · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-key-points.html`](kodza-key-points.html) | 1.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-key-points.css`](kodza-key-points.css) | 17.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-key-points.js`](kodza-key-points.js) | 11.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-key-points.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-key-points.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/key-points/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Key Points to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-key-points` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-key-points-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-key-points-dim` | `color-mix(in srgb, var(--kz-key-points-ink) 66%, transparent)` |  |
| `--kz-key-points-faint` | `color-mix(in srgb, var(--kz-key-points-ink) 60%, transparent)` |  |
| `--kz-key-points-rule` | `color-mix(in srgb, var(--kz-key-points-ink) 16%, transparent)` | the hairlines |
| `--kz-key-points-bg` | `transparent` |  |
| `--kz-key-points-width` | `var(--kz-page-width, 1440px)` | the content column, the same as the other sections |
| `--kz-key-points-gutter` | `var(--kz-page-gutter, clamp(16px, 4vw, 40px))` | the space kept at the screen edges |
| `--kz-key-points-pad` | `clamp(56px, 7vw, 112px)` | above and below |
| `--kz-key-points-gap` | `clamp(32px, 5vw, 80px)` | rows: between the title and the points |
| `--kz-key-points-head-span` | `4fr` | rows: the title's share of the width… |
| `--kz-key-points-list-span` | `8fr` | …and the points' |
| `--kz-key-points-term-span` | `2fr` | rows: the term's share of a row… |
| `--kz-key-points-text-span` | `5fr` | …and the sentence's |
| `--kz-key-points-columns` | `4` | columns: how many side by side (2 on a tablet, 1 on a phone) |
| `--kz-key-points-figure` | `clamp(44px, 5.5vw, 72px)` | the size of a __figure |
| `--kz-key-points-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |

- Attributes: `data-layout` (e.g. `columns`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-key-points {
    --kz-key-points-ink: #f2f2f0;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
