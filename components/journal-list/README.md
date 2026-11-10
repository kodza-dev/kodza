# Journal List

[![Journal List, live on kodza.dev](https://kodza.dev/anim/journal-list/og.jpg)](https://kodza.dev/components/journal-list/)

A blog or news section: the latest post in large, the others in rows with date, category and reading time, a picture that follows the pointer over a row, and categories in a sliding pill that filter the rows.

**[Live demo](https://kodza.dev/components/journal-list/)** · Blog & news · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-journal-list.html`](kodza-journal-list.html) | 6.3 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-journal-list.css`](kodza-journal-list.css) | 46.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-journal-list.js`](kodza-journal-list.js) | 26.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-journal-list.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-journal-list.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/journal-list/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Journal List to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-journal-list]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-journal-list-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-journal-list-muted` | `color-mix(in srgb, var(--kz-journal-list-ink) 62%, transparent)` |  |
| `--kz-journal-list-dim` | `color-mix(in srgb, var(--kz-journal-list-ink) 26%, transparent)` |  |
| `--kz-journal-list-line` | `color-mix(in srgb, var(--kz-journal-list-ink) 12%, transparent)` |  |
| `--kz-journal-list-placeholder` | `color-mix(in srgb, var(--kz-journal-list-ink) 6%, transparent)` |  |
| `--kz-journal-list-filters-bg` | `var(--kz-color-paper, #ffffff)` | behind the categories |
| `--kz-journal-list-pill` | `var(--kz-color-accent, var(--kz-journal-list-ink))` | the pill on the chosen category |
| `--kz-journal-list-on-pill` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-journal-list-glass` | `auto` | behind the words that cross the picture: auto = the background behind the section, see-through |
| `--kz-journal-list-width` | `var(--kz-page-width, 1440px)` |  |
| `--kz-journal-list-gutter` | `var(--kz-page-gutter, clamp(16px, 4vw, 40px))` |  |
| `--kz-journal-list-space` | `clamp(56px, 7vw, 112px)` | above and below the section |
| `--kz-journal-list-gap` | `clamp(32px, 6vw, 96px)` | between the two columns of the head and of the latest post |
| `--kz-journal-list-columns` | `minmax(0, 112px) minmax(0, 120px) minmax(0, 1fr) auto` | date, category, title, reading time |
| `--kz-journal-list-size` | `calc(clamp(20px, 2vw, 26px) * var(--kz-font-display-scale, 1))` | a row's title |
| `--kz-journal-list-frame` | `220px` | the picture that follows the pointer |
| `--kz-journal-list-ratio` | `4 / 5` |  |
| `--kz-journal-list-radius` | `calc(12px * var(--kz-radius-scale, 1))` |  |
| `--kz-journal-list-inline` | `640px` | narrower than this, or on touch: a thumbnail in each row |
| `--kz-journal-list-thumb` | `52px` |  |
| `--kz-journal-list-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-journal-list-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |

- Attributes: `data-category` (e.g. `releases`, `press`, `studio`, `talks`), `data-filter` (e.g. `all`, `releases`, `studio`, `press`, `talks`), `data-image` (e.g. `https://kodza.dev/media/kz-block-1400.webp`, `https://kodza.dev/media/kz-center-1400.webp`, `https://kodza.dev/media/kz-clamp-1400.webp`, `https://kodza.dev/media/kz-columns-1400.webp`, `https://kodza.dev/media/kz-radius-1400.webp`, `https://kodza.dev/media/kz-float-1400.webp`), `data-kodza-journal-list`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-journal-list {
    --kz-journal-list-ink: #f2f2f0;
    --kz-journal-list-muted: rgba(242, 242, 240, 0.62);
    --kz-journal-list-dim: rgba(242, 242, 240, 0.26);
    --kz-journal-list-line: rgba(255, 255, 255, 0.12);
    --kz-journal-list-placeholder: rgba(255, 255, 255, 0.06);
    --kz-journal-list-filters-bg: #161616;
    --kz-journal-list-pill: #f2f2f0;
    --kz-journal-list-on-pill: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a post, while its picture shows | `Escape` | Hides the picture, the focus stays on the post |
| On a category | `Enter` / `Space` | Shows that category, the other rows slide into place |

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
