# Table of Contents

[![Table of Contents, live on kodza.dev](https://kodza.dev/anim/table-of-contents/og.jpg)](https://kodza.dev/components/table-of-contents/)

A summary card built from your headings: an ink marker follows the section you read, a ring fills, the time left counts down. A bar on phones.

**[Live demo](https://kodza.dev/components/table-of-contents/)** · Navigation · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-table-of-contents.html`](kodza-table-of-contents.html) | 1.0 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-table-of-contents.css`](kodza-table-of-contents.css) | 15.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-table-of-contents.js`](kodza-table-of-contents.js) | 9.1 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-table-of-contents.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-table-of-contents.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/table-of-contents/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add a Kodza Table of Contents to my long articles.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-toc` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-toc-bg` | `#ffffff` |  |
| `--kz-toc-fg` | `#0a0a0a` |  |
| `--kz-toc-muted` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-toc-faint` | `rgba(10, 10, 10, 0.4)` |  |
| `--kz-toc-line` | `rgba(10, 10, 10, 0.08)` |  |
| `--kz-toc-ink` | `#0a0a0a` |  |
| `--kz-toc-top` | `32px` |  |
| `--kz-toc-offset` | `32px` |  |
| `--kz-toc-duration` | `0.5s` |  |
| `--kz-toc-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-toc-mono` | `ui-monospace, "SF Mono", Menlo, monospace` |  |

- Attributes: `data-headings`, `data-target`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-toc {
    --kz-toc-bg: #161616;
    --kz-toc-fg: #f2f2f0;
    --kz-toc-muted: rgba(242, 242, 240, 0.6);
    --kz-toc-faint: rgba(242, 242, 240, 0.62);
    --kz-toc-line: rgba(255, 255, 255, 0.1);
    --kz-toc-ink: #f2f2f0;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
