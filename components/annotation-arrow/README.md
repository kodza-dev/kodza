# Annotation Arrow

[![Annotation Arrow, live on kodza.dev](https://kodza.dev/anim/annotation-arrow/og.jpg)](https://kodza.dev/components/annotation-arrow/)

A note that draws a hand-drawn arrow to the element it points at, picked by a CSS selector. The curve avoids both boxes and redraws when the layout moves.

**[Live demo](https://kodza.dev/components/annotation-arrow/)** · SVG & Drawing · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-annotation-arrow.html`](kodza-annotation-arrow.html) | 0.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-annotation-arrow.css`](kodza-annotation-arrow.css) | 5.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-annotation-arrow.js`](kodza-annotation-arrow.js) | 22.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-annotation-arrow.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-annotation-arrow.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/annotation-arrow/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Annotation Arrow to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-annotation-arrow` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-annotation-arrow-ink` | `var(--kz-color-ink, #0a0a0a)` | the note and its line |
| `--kz-annotation-arrow-stroke` | `1.75px` | the line's thickness |
| `--kz-annotation-arrow-width` | `240px` | the note's widest, before it wraps |

- Attributes: `data-mark`, `data-target` (e.g. `.hero-cta`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-annotation-arrow {
    --kz-annotation-arrow-ink: #f2f2f0;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
