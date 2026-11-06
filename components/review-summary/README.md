# Review Summary

[![Review Summary, live on kodza.dev](https://kodza.dev/anim/review-summary/og.jpg)](https://kodza.dev/components/review-summary/)

Reviews with their summary: the average rolls up, the stars fill to the decimal, five bars fill in turn. Click a bar to filter, the reviews glide into place. Read more, and a one-line variant.

**[Live demo](https://kodza.dev/components/review-summary/)** · Testimonials & logos · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-review-summary.html`](kodza-review-summary.html) | 15.3 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-review-summary.css`](kodza-review-summary.css) | 45.0 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-review-summary.js`](kodza-review-summary.js) | 19.3 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-review-summary.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-review-summary.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/review-summary/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Review Summary to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-review-summary` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-review-summary-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-review-summary-dim` | `color-mix(in srgb, var(--kz-review-summary-ink) 64%, transparent)` |  |
| `--kz-review-summary-card` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-review-summary-line` | `color-mix(in srgb, var(--kz-review-summary-ink) 10%, transparent)` |  |
| `--kz-review-summary-rail` | `color-mix(in srgb, var(--kz-review-summary-ink) 10%, transparent)` | empty stars and bar tracks |
| `--kz-review-summary-muted` | `color-mix(in srgb, var(--kz-review-summary-ink) 26%, transparent)` | the bars not chosen while filtered |
| `--kz-review-summary-face` | `#e6e6e3` |  |
| `--kz-review-summary-hover` | `color-mix(in srgb, var(--kz-review-summary-ink) 4%, transparent)` |  |
| `--kz-review-summary-pressed` | `color-mix(in srgb, var(--kz-review-summary-ink) 7%, transparent)` |  |
| `--kz-review-summary-bg` | `transparent` |  |
| `--kz-review-summary-star` | `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z' stroke='black' stroke-width='1.2' stroke-linejoin='round'/%3E%3C/svg%3E")` |  |
| `--kz-review-summary-lines` | `5` | lines shown before "Read more" |
| `--kz-review-summary-columns` | `minmax(280px, 340px) minmax(0, 1fr)` | summary, reviews |
| `--kz-review-summary-card-min` | `280px` | the narrowest review card |
| `--kz-review-summary-sticky` | `24px` | where the summary stays while the reviews scroll |
| `--kz-review-summary-width` | `1200px` |  |
| `--kz-review-summary-pad-y` | `clamp(64px, 8vw, 112px)` |  |
| `--kz-review-summary-gutter` | `clamp(16px, 4vw, 40px)` |  |
| `--kz-review-summary-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-review-summary-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-review-summary-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-review-summary--inline`
- Attributes: `data-kodza-review-summary`, `data-less` (e.g. `Read less`), `data-more` (e.g. `Read more`), `data-rating` (e.g. `5`, `4`, `3`, `2`, `1`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-review-summary {
    --kz-review-summary-ink: #f2f2f0;
    --kz-review-summary-dim: rgba(242, 242, 240, 0.66);
    --kz-review-summary-card: #161616;
    --kz-review-summary-line: rgba(255, 255, 255, 0.12);
    --kz-review-summary-rail: rgba(255, 255, 255, 0.14);
    --kz-review-summary-muted: rgba(242, 242, 240, 0.3);
    --kz-review-summary-face: #2a2a2a;
    --kz-review-summary-hover: rgba(255, 255, 255, 0.05);
    --kz-review-summary-pressed: rgba(255, 255, 255, 0.09);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

Every colour is a variable on the element: set --kz-review-summary-ink, -dim, -card, -line, -rail, -muted, -face, -hover and -pressed (the demo's dark band has the recipe).

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a bar | `Enter` / `Space` | Shows only that rating's reviews, or all of them again |
| On Show all | `Enter` / `Space` | Shows every review, focus back on the bar |
| On Read more | `Enter` / `Space` | Opens the whole review, or folds it again |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
