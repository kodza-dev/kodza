# Team Grid

[![Team Grid, live on kodza.dev](https://kodza.dev/anim/team-grid/og.jpg)](https://kodza.dev/components/team-grid/)

A team section: people grouped by team in 4:5 frames, name and role in mono, a second picture that opens from the top on hover and focus, or a bio that rises; initials with no portrait.

**[Live demo](https://kodza.dev/components/team-grid/)** · Team & about · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-team-grid.html`](kodza-team-grid.html) | 5.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-team-grid.css`](kodza-team-grid.css) | 23.7 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-team-grid.js`](kodza-team-grid.js) | 8.5 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-team-grid.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-team-grid.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/team-grid/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Team Grid to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-team-grid]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-team-grid-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-team-grid-muted` | `color-mix(in srgb, var(--kz-team-grid-ink) 62%, transparent)` |  |
| `--kz-team-grid-line` | `color-mix(in srgb, var(--kz-team-grid-ink) 12%, transparent)` |  |
| `--kz-team-grid-paper` | `var(--kz-color-paper, #ffffff)` | the bio panel |
| `--kz-team-grid-blank` | `color-mix(in srgb, var(--kz-team-grid-ink) 6%, transparent)` | the frame of a person with no portrait |
| `--kz-team-grid-width` | `var(--kz-page-width, 1440px)` |  |
| `--kz-team-grid-gutter` | `var(--kz-page-gutter, clamp(16px, 4vw, 40px))` |  |
| `--kz-team-grid-space` | `clamp(56px, 7vw, 112px)` | above and below the section |
| `--kz-team-grid-gap` | `clamp(32px, 6vw, 96px)` | between the group and its people |
| `--kz-team-grid-split` | `minmax(0, 4fr) minmax(0, 8fr)` | the group, then its people |
| `--kz-team-grid-columns` | `3` | people per row (2 in a narrow column) |
| `--kz-team-grid-spacing` | `clamp(16px, 2vw, 28px) clamp(12px, 1.6vw, 24px)` | between people: rows, columns |
| `--kz-team-grid-ratio` | `4 / 5` | every frame, whatever the picture |
| `--kz-team-grid-radius` | `calc(12px * var(--kz-radius-scale, 1))` |  |
| `--kz-team-grid-bio-radius` | `calc(8px * var(--kz-radius-scale, 1))` | the bio panel, inside the frame |
| `--kz-team-grid-ring-radius` | `calc(16px * var(--kz-radius-scale, 1))` | the focus ring, around the person |
| `--kz-team-grid-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-team-grid-curtain` | `cubic-bezier(0.76, 0, 0.24, 1)` | the second picture coming down |
| `--kz-team-grid-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |

- Attributes: `data-kodza-team-grid`, `data-reveal` (e.g. `bio`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-team-grid {
    --kz-team-grid-ink: #f2f2f0;
    --kz-team-grid-muted: rgba(242, 242, 240, 0.62);
    --kz-team-grid-line: rgba(255, 255, 255, 0.12);
    --kz-team-grid-paper: #161616;
    --kz-team-grid-blank: rgba(255, 255, 255, 0.06);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
