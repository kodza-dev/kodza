# Hover Nav

[![Hover Nav, live on kodza.dev](https://kodza.dev/anim/hover-nav/og.jpg)](https://kodza.dev/components/hover-nav/)

A pill of links where the highlight slides under the pointer and settles back on the current page. The ink version turns the text white right at its edges.

**[Live demo](https://kodza.dev/components/hover-nav/)** · Navigation · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-hover-nav.html`](kodza-hover-nav.html) | 0.6 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-hover-nav.css`](kodza-hover-nav.css) | 6.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-hover-nav.js`](kodza-hover-nav.js) | 7.0 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-hover-nav.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-hover-nav.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/hover-nav/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Turn my header links into a Kodza Hover Nav.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-hover-nav` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-hnav-bg` | `#ffffff` |  |
| `--kz-hnav-fg` | `#0a0a0a` |  |
| `--kz-hnav-muted` | `rgba(10, 10, 10, 0.58)` |  |
| `--kz-hnav-border` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-hnav-soft` | `rgba(10, 10, 10, 0.06)` |  |
| `--kz-hnav-ink` | `#0a0a0a` |  |
| `--kz-hnav-on-ink` | `#ffffff` |  |
| `--kz-hnav-duration` | `0.45s` |  |
| `--kz-hnav-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-hover-nav--ink`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-hover-nav {
    --kz-hnav-bg: #161616;
    --kz-hnav-fg: #f2f2f0;
    --kz-hnav-muted: rgba(242, 242, 240, 0.6);
    --kz-hnav-border: rgba(255, 255, 255, 0.12);
    --kz-hnav-soft: rgba(255, 255, 255, 0.09);
    --kz-hnav-ink: #f2f2f0;
    --kz-hnav-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
