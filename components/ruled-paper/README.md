# Ruled Paper

[![Ruled Paper, live on kodza.dev](https://kodza.dev/anim/ruled-paper/og.jpg)](https://kodza.dev/components/ruled-paper/)

A section ruled like a notebook page, with an ink margin line. The rules follow the text's line height and every line of text sits on its rule, at every size.

**[Live demo](https://kodza.dev/components/ruled-paper/)** · Backgrounds & textures · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-ruled-paper.html`](kodza-ruled-paper.html) | 1.0 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-ruled-paper.css`](kodza-ruled-paper.css) | 14.0 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-ruled-paper.js`](kodza-ruled-paper.js) | 7.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-ruled-paper.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-ruled-paper.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/ruled-paper/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Ruled Paper to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-ruled-paper]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-ruled-paper-bg` | `#f2f2f0` | the paper |
| `--kz-ruled-paper-ink` | `#0a0a0a` | the rules, the text, the button |
| `--kz-ruled-paper-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-ruled-paper-rule` | `30px` | rule spacing = the line height of the text |
| `--kz-ruled-paper-lines` | `13%` | strength of the rules, 0% to 100% of the ink |
| `--kz-ruled-paper-margin-line` | `42%` | strength of the margin line |
| `--kz-ruled-paper-margin` | `clamp(28px, 6vw, 88px)` | from the text column's edge to the margin line |
| `--kz-ruled-paper-gap` | `clamp(14px, 2vw, 24px)` | from the margin line to the text |
| `--kz-ruled-paper-title-rules` | `2` | rules per line of the title |
| `--kz-ruled-paper-height` | `600px` |  |
| `--kz-ruled-paper-width` | `1152px` | the text column, margin included |
| `--kz-ruled-paper-side` | `clamp(20px, 5vw, 64px)` |  |

- Attributes: `data-kodza-ruled-paper`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-ruled-paper {
    --kz-ruled-paper-bg: #0a0a0a;
    --kz-ruled-paper-ink: #f2f2f0;
    --kz-ruled-paper-muted: rgba(242, 242, 240, 0.62);
    --kz-ruled-paper-lines: 11%;
    --kz-ruled-paper-margin-line: 36%;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
