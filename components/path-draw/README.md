# Path Draw

[![Path Draw, live on kodza.dev](https://kodza.dev/anim/path-draw/og.jpg)](https://kodza.dev/components/path-draw/)

Any SVG drawn with strokes draws itself stroke by stroke at a steady pen speed, then fills in. Once on entering the screen, or tied to the scroll.

**[Live demo](https://kodza.dev/components/path-draw/)** · SVG & Drawing · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-path-draw.html`](kodza-path-draw.html) | 2.9 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-path-draw.css`](kodza-path-draw.css) | 3.0 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-path-draw.js`](kodza-path-draw.js) | 12.9 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-path-draw.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-path-draw.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/path-draw/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Path Draw to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-path-draw` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-path-draw-ink` | `var(--kz-color-ink, #0a0a0a)` | the colour of a drawing in currentColor |
| `--kz-path-draw-width` | `auto` | the drawing's width (auto: the width written on the svg) |
| `--kz-path-draw-fill-time` | `0.7s` | the fills coming in once the last stroke is down |

- Attributes: `data-draw`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-path-draw {
    --kz-path-draw-ink: #f2f2f0;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
