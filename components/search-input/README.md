# Search Autocomplete

[![Search Autocomplete, live on kodza.dev](https://kodza.dev/anim/search-input/og.jpg)](https://kodza.dev/components/search-input/)

A search field over a real datalist: suggestions unroll under it, grouped, with the letters you typed underlined. "/" jumps in, arrows and Enter drive.

**[Live demo](https://kodza.dev/components/search-input/)** · Forms · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-search-input.html`](kodza-search-input.html) | 1.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-search-input.css`](kodza-search-input.css) | 14.5 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-search-input.js`](kodza-search-input.js) | 13.5 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-search-input.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-search-input.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/search-input/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add Kodza Search Autocomplete to my docs header.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-search` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-search-bg` | `#ffffff` |  |
| `--kz-search-fg` | `#0a0a0a` |  |
| `--kz-search-muted` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-search-line` | `rgba(10, 10, 10, 0.14)` |  |
| `--kz-search-line-hover` | `rgba(10, 10, 10, 0.3)` |  |
| `--kz-search-soft` | `rgba(10, 10, 10, 0.06)` |  |
| `--kz-search-shadow` | `0 18px 40px -16px rgba(10, 10, 10, 0.3)` |  |
| `--kz-search-height` | `48px` |  |
| `--kz-search-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-search-mono` | `ui-monospace, "SF Mono", Menlo, monospace` |  |

- Events: `kodza:search`, bubbling from the root
- On the root element: `root.kodzaSearch` (see the comment at the top of the JS)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-search {
    --kz-search-bg: #161616;
    --kz-search-fg: #f2f2f0;
    --kz-search-muted: rgba(242, 242, 240, 0.62);
    --kz-search-line: rgba(255, 255, 255, 0.14);
    --kz-search-line-hover: rgba(255, 255, 255, 0.3);
    --kz-search-soft: rgba(255, 255, 255, 0.08);
    --kz-search-shadow: 0 18px 40px -16px rgba(0, 0, 0, 0.8);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| In the field, while suggestions are open | `ArrowDown` / `ArrowUp` | Next or previous suggestion, round and round |
|  | `Enter` | Picks the highlighted suggestion |
|  | `Tab` | Closes the suggestions and moves on |
| In the field | `ArrowDown` / `ArrowUp` | Opens the suggestions |
|  | a letter | Filters the suggestions, letters in order |
|  | `Escape` | Closes the suggestions and clears the text, in two presses |
| Anywhere outside a text field | `/` | Jumps to the search field |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
