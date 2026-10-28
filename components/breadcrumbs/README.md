# Breadcrumbs

[![Breadcrumbs, live on kodza.dev](https://kodza.dev/anim/breadcrumbs/og.jpg)](https://kodza.dev/components/breadcrumbs/)

A breadcrumb trail that folds its middle behind a "…" button when it would not fit on one line, and unfolds it crumb after crumb.

**[Live demo](https://kodza.dev/components/breadcrumbs/)** · Navigation · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-breadcrumbs.html`](kodza-breadcrumbs.html) | 1.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-breadcrumbs.css`](kodza-breadcrumbs.css) | 9.7 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-breadcrumbs.js`](kodza-breadcrumbs.js) | 7.9 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-breadcrumbs.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-breadcrumbs.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/breadcrumbs/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add Kodza Breadcrumbs above my product pages.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-breadcrumbs` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-crumbs-fg` | `#0a0a0a` |  |
| `--kz-crumbs-muted` | `rgba(10, 10, 10, 0.58)` |  |
| `--kz-crumbs-separator` | `rgba(10, 10, 10, 0.28)` |  |
| `--kz-crumbs-soft` | `rgba(10, 10, 10, 0.06)` |  |
| `--kz-crumbs-soft-fg` | `#ffffff` |  |
| `--kz-crumbs-size` | `15px` |  |
| `--kz-crumbs-gap` | `10px` |  |
| `--kz-crumbs-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-breadcrumbs--collapse`
- On the root element: `root.kodzaFold` (see the comment at the top of the JS)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-breadcrumbs {
    --kz-crumbs-fg: #f2f2f0;
    --kz-crumbs-muted: rgba(242, 242, 240, 0.6);
    --kz-crumbs-separator: rgba(242, 242, 240, 0.3);
    --kz-crumbs-soft: rgba(255, 255, 255, 0.1);
    --kz-crumbs-soft-fg: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
