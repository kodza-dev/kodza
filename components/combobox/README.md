# Combobox

[![Combobox, live on kodza.dev](https://kodza.dev/anim/combobox/og.jpg)](https://kodza.dev/components/combobox/)

A real select you can type into: the list filters as you type, accents and case aside, the matched letters underlined and the best match lit for Enter. Codes on the right are searched too.

**[Live demo](https://kodza.dev/components/combobox/)** · Forms · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-combobox.html`](kodza-combobox.html) | 7.8 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-combobox.css`](kodza-combobox.css) | 29.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-combobox.js`](kodza-combobox.js) | 27.5 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-combobox.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-combobox.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/combobox/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Combobox to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-combobox` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-combobox-bg` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-combobox-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-combobox-muted` | `color-mix(in srgb, var(--kz-combobox-fg) 60%, transparent)` |  |
| `--kz-combobox-line` | `color-mix(in srgb, var(--kz-combobox-fg) 14%, transparent)` |  |
| `--kz-combobox-line-hover` | `color-mix(in srgb, var(--kz-combobox-fg) 30%, transparent)` |  |
| `--kz-combobox-soft` | `color-mix(in srgb, var(--kz-combobox-fg) 6%, transparent)` |  |
| `--kz-combobox-selection` | `rgba(128, 128, 128, 0.35)` | the selected text: grey, not the browser blue |
| `--kz-combobox-error` | `var(--kz-color-error, var(--kz-combobox-fg))` | a message, never colour alone: set a red here if you want one |
| `--kz-combobox-shadow` | `0 18px 40px -16px rgba(10, 10, 10, 0.3)` |  |
| `--kz-combobox-height` | `56px` |  |
| `--kz-combobox-radius` | `calc(12px * var(--kz-radius-scale, 1))` |  |
| `--kz-combobox-pad` | `16px` |  |
| `--kz-combobox-width` | `var(--kz-field-width, 320px)` |  |
| `--kz-combobox-list-height` | `280px` | the open list, at most: it scrolls past that |
| `--kz-combobox-duration` | `0.35s` |  |
| `--kz-combobox-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-meta` (e.g. `AR`, `AU`, `AT`, `BE`, `BR`, `CA`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-combobox {
    --kz-combobox-bg: #161616;
    --kz-combobox-fg: #f2f2f0;
    --kz-combobox-muted: rgba(242, 242, 240, 0.62);
    --kz-combobox-line: rgba(255, 255, 255, 0.14);
    --kz-combobox-line-hover: rgba(255, 255, 255, 0.3);
    --kz-combobox-soft: rgba(255, 255, 255, 0.08);
    --kz-combobox-error: #f2f2f0;
    --kz-combobox-shadow: 0 18px 40px -16px rgba(0, 0, 0, 0.8);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| In the field, while it's open | `ArrowDown` / `ArrowUp` | Next or previous option in the list, no looping |
|  | `PageDown` / `PageUp` | Five options down or up |
|  | `Enter` | Picks the highlighted option and closes |
|  | `Tab` | Picks the highlighted option and moves on |
|  | `Escape` | Closes it and puts the last choice back |
| In the field | a letter | Filters the list, best match first and lit |
|  | `ArrowDown` / `ArrowUp` | Opens the whole list on the current choice |
|  | `Backspace` | Edits the search; leaving it empty clears the choice |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
