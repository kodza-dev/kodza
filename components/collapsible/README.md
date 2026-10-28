# Show More

[![Show More, live on kodza.dev](https://kodza.dev/anim/collapsible/og.jpg)](https://kodza.dev/components/collapsible/)

Long content kept short until asked: a text cut by a soft fade, or a list that says how many items are left. It opens at its real height and the button's words roll.

**[Live demo](https://kodza.dev/components/collapsible/)** · Data display · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-collapsible.html`](kodza-collapsible.html) | 1.6 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-collapsible.css`](kodza-collapsible.css) | 11.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-collapsible.js`](kodza-collapsible.js) | 6.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-collapsible.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-collapsible.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/collapsible/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Shorten my long product description with Kodza Show More.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-more` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-more-fg` | `#0a0a0a` |  |
| `--kz-more-muted` | `rgba(10, 10, 10, 0.64)` |  |
| `--kz-more-line` | `rgba(10, 10, 10, 0.12)` |  |
| `--kz-more-soft` | `rgba(10, 10, 10, 0.05)` |  |
| `--kz-more-height` | `9.6em` |  |
| `--kz-more-fade` | `4em` |  |
| `--kz-more-width` | `auto` | 100%: the content fills the width, for blocks (cards, a table) |
| `--kz-more-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-more--list`
- Attributes: `data-visible` (e.g. `4`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-more {
    --kz-more-fg: #f2f2f0;
    --kz-more-muted: rgba(242, 242, 240, 0.64);
    --kz-more-line: rgba(255, 255, 255, 0.12);
    --kz-more-soft: rgba(255, 255, 255, 0.08);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
