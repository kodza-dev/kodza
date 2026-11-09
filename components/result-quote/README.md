# Result Quote

[![Result Quote, live on kodza.dev](https://kodza.dev/anim/result-quote/og.jpg)](https://kodza.dev/components/result-quote/)

A case study in one block: the result very large, its digits rolling up to the value, then the quote rising line by line, the person and a link to the full story. Played once, on scroll.

**[Live demo](https://kodza.dev/components/result-quote/)** · Testimonials & logos · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-result-quote.html`](kodza-result-quote.html) | 3.0 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-result-quote.css`](kodza-result-quote.css) | 25.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-result-quote.js`](kodza-result-quote.js) | 11.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-result-quote.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-result-quote.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/result-quote/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Result Quote to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-result-quote` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-result-quote-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-result-quote-dim` | `color-mix(in srgb, var(--kz-result-quote-ink) 64%, transparent)` |  |
| `--kz-result-quote-rule` | `color-mix(in srgb, var(--kz-result-quote-ink) 22%, transparent)` | the line under the result |
| `--kz-result-quote-face` | `#e6e6e3` |  |
| `--kz-result-quote-bg` | `transparent` |  |
| `--kz-result-quote-width` | `var(--kz-page-width, 1440px)` |  |
| `--kz-result-quote-measure` | `680px` | the longest line of the quote |
| `--kz-result-quote-result-col` | `5fr` | the two columns, from 860px of room |
| `--kz-result-quote-story-col` | `7fr` |  |
| `--kz-result-quote-hang` | `0.4em` | the opening quote mark hangs in the margin by its width |
| `--kz-result-quote-pad-y` | `clamp(64px, 8vw, 112px)` |  |
| `--kz-result-quote-gutter` | `var(--kz-page-gutter, clamp(16px, 4vw, 40px))` |  |
| `--kz-result-quote-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-result-quote-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-result-quote--flip`
- Attributes: `data-kodza-result-quote`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-result-quote {
    --kz-result-quote-ink: #f2f2f0;
    --kz-result-quote-dim: rgba(242, 242, 240, 0.66);
    --kz-result-quote-rule: rgba(255, 255, 255, 0.22);
    --kz-result-quote-face: #2a2a2a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

Every colour is a variable on the element: set --kz-result-quote-ink, -dim, -rule and -face (the demo's dark band has the recipe).

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
