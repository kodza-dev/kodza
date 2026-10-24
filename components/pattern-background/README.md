# Pattern Background

[![Pattern Background, live on kodza.dev](https://kodza.dev/anim/pattern-background/og.jpg)](https://kodza.dev/components/pattern-background/)

A hero framed by its own pattern: the grid lines up on your content, four hairlines run along its edges with crop marks on the corners, the rest fades out. Grid, dots, crosses or diagonals. No images.

**[Live demo](https://kodza.dev/components/pattern-background/)** · Backgrounds & textures · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-pattern-background.html`](kodza-pattern-background.html) | 1.0 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-pattern-background.css`](kodza-pattern-background.css) | 23.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-pattern-background.js`](kodza-pattern-background.js) | 9.1 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-pattern-background.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-pattern-background.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/pattern-background/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Pattern Background to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-pattern-background]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-pattern-background-bg` | `#f2f2f0` | the paper |
| `--kz-pattern-background-ink` | `#0a0a0a` | the pattern, the text, the button |
| `--kz-pattern-background-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-pattern-background-size` | `40px` | one cell, in px (dots sit at half of it) |
| `--kz-pattern-background-line` | `1px` | stroke, and dot radius |
| `--kz-pattern-background-strength` | `1` | 0.5 is fainter, 2 is twice as present |
| `--kz-pattern-background-air` | `24px` | the least room between the content and its frame |
| `--kz-pattern-background-mark` | `11px` | the crosses on the corners of the frame |
| `--kz-pattern-background-fade-x` | `14%` | how far the left and right edges fade |
| `--kz-pattern-background-fade-y` | `24%` | same, top and bottom |
| `--kz-pattern-background-draw` | `1.6s` | --draw: how long the whole trace takes |
| `--kz-pattern-background-ease` | `cubic-bezier(0.33, 1, 0.68, 1)` |  |
| `--kz-pattern-background-height` | `600px` |  |
| `--kz-pattern-background-width` | `1152px` | the text column |
| `--kz-pattern-background-side` | `clamp(20px, 5vw, 64px)` |  |

- Modifiers: `.kodza-pattern-background--cross`, `.kodza-pattern-background--diagonal`, `.kodza-pattern-background--dots`, `.kodza-pattern-background--draw`
- Attributes: `data-kodza-pattern-background`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-pattern-background {
    --kz-pattern-background-bg: #0a0a0a;
    --kz-pattern-background-ink: #f2f2f0;
    --kz-pattern-background-muted: rgba(242, 242, 240, 0.62);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
