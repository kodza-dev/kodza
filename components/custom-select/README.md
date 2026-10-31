# Select

[![Select, live on kodza.dev](https://kodza.dev/anim/custom-select/og.jpg)](https://kodza.dev/components/custom-select/)

A real select, dressed up: the list unrolls from the field, a highlight slides between options and the value rolls to your choice. A pill for toolbars too.

**[Live demo](https://kodza.dev/components/custom-select/)** · Forms · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-custom-select.html`](kodza-custom-select.html) | 1.6 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-custom-select.css`](kodza-custom-select.css) | 20.7 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-custom-select.js`](kodza-custom-select.js) | 16.6 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-custom-select.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-custom-select.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/custom-select/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Swap the country select of my checkout for a Kodza Select.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-select` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-select-bg` | `#ffffff` |  |
| `--kz-select-fg` | `#0a0a0a` |  |
| `--kz-select-muted` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-select-line` | `rgba(10, 10, 10, 0.14)` |  |
| `--kz-select-line-hover` | `rgba(10, 10, 10, 0.3)` |  |
| `--kz-select-soft` | `rgba(10, 10, 10, 0.06)` |  |
| `--kz-select-shadow` | `0 18px 40px -16px rgba(10, 10, 10, 0.3)` |  |
| `--kz-select-height` | `56px` |  |
| `--kz-select-radius` | `calc(12px * var(--kz-radius-scale, 1))` |  |
| `--kz-select-pad` | `16px` |  |
| `--kz-select-duration` | `0.35s` |  |
| `--kz-select-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-select-width` | `var(--kz-field-width, 320px)` |  |

- Modifiers: `.kodza-select--inline`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-select {
    --kz-select-bg: #161616;
    --kz-select-fg: #f2f2f0;
    --kz-select-muted: rgba(242, 242, 240, 0.62);
    --kz-select-line: rgba(255, 255, 255, 0.14);
    --kz-select-line-hover: rgba(255, 255, 255, 0.3);
    --kz-select-soft: rgba(255, 255, 255, 0.08);
    --kz-select-shadow: 0 18px 40px -16px rgba(0, 0, 0, 0.8);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the field, while it's open | `ArrowDown` / `ArrowUp` | Next or previous option, no looping |
|  | `Home` / `End` | First or last option |
|  | `PageDown` / `PageUp` | Five options down or up |
|  | a letter | Jumps to the option starting with that letter |
|  | `Enter` / `Space` | Picks the highlighted option and closes |
|  | `Tab` | Picks the highlighted option and moves on |
| On the field | `Enter` / `Space` / `ArrowDown` / `ArrowUp` | Opens it on the current choice |
|  | a letter | Picks the option starting with that letter, no opening |
| Anywhere, while it's open | `Escape` | Closes it, focus back on the field |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
