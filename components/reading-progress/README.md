# Reading Progress

[![Reading Progress, live on kodza.dev](https://kodza.dev/anim/reading-progress/og.jpg)](https://kodza.dev/components/reading-progress/)

A thin line under the header that fills as you read the article, not the whole page. Cut at each section, it can show the minutes left, and runs on the scroll itself where the browser can.

**[Live demo](https://kodza.dev/components/reading-progress/)** · Scroll · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-reading-progress.html`](kodza-reading-progress.html) | 0.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-reading-progress.css`](kodza-reading-progress.css) | 6.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-reading-progress.js`](kodza-reading-progress.js) | 11.3 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-reading-progress.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-reading-progress.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/reading-progress/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Reading Progress to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-reading-progress]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-reading-progress-offset` | `0px` | the height of a fixed header above it |
| `--kz-reading-progress-height` | `3px` |  |
| `--kz-reading-progress-color` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-reading-progress-track` | `color-mix(in srgb, var(--kz-reading-progress-color) 10%, transparent)` |  |
| `--kz-reading-progress-notch` | `2px` | the cut at each heading; 0 for a plain line |
| `--kz-reading-progress-label-color` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-reading-progress-label-bg` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-reading-progress-label-border` | `color-mix(in srgb, var(--kz-reading-progress-label-color) 10%, transparent)` |  |
| `--kz-reading-progress-gutter` | `16px` | the label's distance from the screen edge |
| `--kz-reading-progress-layer` | `40` |  |

- Attributes: `data-done`, `data-headings`, `data-kodza-reading-progress`, `data-target`, `data-time`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-reading-progress {
    --kz-reading-progress-color: #f2f2f0;
    --kz-reading-progress-track: rgba(242, 242, 240, 0.14);
    --kz-reading-progress-label-color: #f2f2f0;
    --kz-reading-progress-label-bg: #161616;
    --kz-reading-progress-label-border: rgba(255, 255, 255, 0.12);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
