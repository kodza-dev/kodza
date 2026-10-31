# Multi Select

[![Multi Select, live on kodza.dev](https://kodza.dev/anim/multi-select/og.jpg)](https://kodza.dev/components/multi-select/)

A real multiple select as a field of tags: type to filter, pick to add a tag. Removed tags shrink away while the others glide into their place.

**[Live demo](https://kodza.dev/components/multi-select/)** · Forms · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-multi-select.html`](kodza-multi-select.html) | 0.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-multi-select.css`](kodza-multi-select.css) | 20.8 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-multi-select.js`](kodza-multi-select.js) | 15.3 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-multi-select.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-multi-select.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/multi-select/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Use Kodza Multi Select to pick tags in my post form.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-multi` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-multi-bg` | `#ffffff` |  |
| `--kz-multi-fg` | `#0a0a0a` |  |
| `--kz-multi-muted` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-multi-line` | `rgba(10, 10, 10, 0.14)` |  |
| `--kz-multi-line-hover` | `rgba(10, 10, 10, 0.3)` |  |
| `--kz-multi-soft` | `rgba(10, 10, 10, 0.06)` |  |
| `--kz-multi-ink` | `#0a0a0a` |  |
| `--kz-multi-on-ink` | `#ffffff` |  |
| `--kz-multi-shadow` | `0 18px 40px -16px rgba(10, 10, 10, 0.3)` |  |
| `--kz-multi-radius` | `calc(12px * var(--kz-radius-scale, 1))` |  |
| `--kz-multi-pad` | `16px` |  |
| `--kz-multi-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-multi-width` | `var(--kz-field-width, 420px)` |  |

- Attributes: `data-placeholder`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-multi {
    --kz-multi-bg: #161616;
    --kz-multi-fg: #f2f2f0;
    --kz-multi-muted: rgba(242, 242, 240, 0.62);
    --kz-multi-line: rgba(255, 255, 255, 0.14);
    --kz-multi-line-hover: rgba(255, 255, 255, 0.3);
    --kz-multi-soft: rgba(255, 255, 255, 0.08);
    --kz-multi-ink: #f2f2f0;
    --kz-multi-on-ink: #0a0a0a;
    --kz-multi-shadow: 0 18px 40px -16px rgba(0, 0, 0, 0.8);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| In the field | `ArrowDown` / `ArrowUp` | Opens the list, then next or previous, round and round |
|  | `Enter` | Adds or removes the highlighted option |
|  | `Escape` | Closes the list |
|  | `Backspace` | On an empty field, removes the last tag |
|  | `Tab` | Closes the list and moves on |
|  | a letter | Filters the list, matching anywhere in the name |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
