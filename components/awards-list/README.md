# Awards List

[![Awards List, live on kodza.dev](https://kodza.dev/anim/awards-list/og.jpg)](https://kodza.dev/components/awards-list/)

Awards, selections and press in grouped lists with totals in mono: prize, jury, project and year per row, a row that inks with its arrow, the rest folded behind Show more.

**[Live demo](https://kodza.dev/components/awards-list/)** · Testimonials & logos · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-awards-list.html`](kodza-awards-list.html) | 8.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-awards-list.css`](kodza-awards-list.css) | 28.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-awards-list.js`](kodza-awards-list.js) | 13.4 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-awards-list.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-awards-list.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/awards-list/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Awards List to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-awards-list` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-awards-list-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-awards-list-muted` | `color-mix(in srgb, var(--kz-awards-list-ink) 62%, transparent)` |  |
| `--kz-awards-list-dim` | `color-mix(in srgb, var(--kz-awards-list-ink) 26%, transparent)` |  |
| `--kz-awards-list-line` | `color-mix(in srgb, var(--kz-awards-list-ink) 12%, transparent)` |  |
| `--kz-awards-list-width` | `var(--kz-page-width, 1440px)` |  |
| `--kz-awards-list-gutter` | `var(--kz-page-gutter, clamp(16px, 4vw, 40px))` |  |
| `--kz-awards-list-space` | `clamp(56px, 7vw, 112px)` | above and below the section |
| `--kz-awards-list-gap` | `clamp(32px, 6vw, 96px)` | between the two columns of the head |
| `--kz-awards-list-split` | `minmax(0, 4fr) minmax(0, 8fr)` | the group, then its rows |
| `--kz-awards-list-columns` | `minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 72px) 16px` | prize, by, project, year, arrow |
| `--kz-awards-list-size` | `calc(clamp(20px, 2vw, 26px) * var(--kz-font-display-scale, 1))` | a prize |
| `--kz-awards-list-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-awards-list-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |

- Attributes: `data-show` (e.g. `4`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-awards-list {
    --kz-awards-list-ink: #f2f2f0;
    --kz-awards-list-muted: rgba(242, 242, 240, 0.62);
    --kz-awards-list-dim: rgba(242, 242, 240, 0.26);
    --kz-awards-list-line: rgba(255, 255, 255, 0.12);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
