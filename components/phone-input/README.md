# Phone Input

[![Phone Input, live on kodza.dev](https://kodza.dev/anim/phone-input/og.jpg)](https://kodza.dev/components/phone-input/)

A real tel input with its country code in front and a searchable list of countries: the number groups itself as it is typed, a pasted or typed +44 picks the country, and the form gets the number in E.164.

**[Live demo](https://kodza.dev/components/phone-input/)** · Forms · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-phone-input.html`](kodza-phone-input.html) | 1.3 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-phone-input.css`](kodza-phone-input.css) | 32.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-phone-input.js`](kodza-phone-input.js) | 38.3 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-phone-input.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-phone-input.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/phone-input/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Phone Input to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-phone` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-phone-bg` | `#ffffff` |  |
| `--kz-phone-fg` | `#0a0a0a` |  |
| `--kz-phone-muted` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-phone-line` | `rgba(10, 10, 10, 0.14)` |  |
| `--kz-phone-line-hover` | `rgba(10, 10, 10, 0.3)` |  |
| `--kz-phone-soft` | `rgba(10, 10, 10, 0.06)` |  |
| `--kz-phone-error` | `#0a0a0a` | a message, never colour alone: set a red here if you want one |
| `--kz-phone-shadow` | `0 18px 40px -16px rgba(10, 10, 10, 0.3)` |  |
| `--kz-phone-height` | `56px` |  |
| `--kz-phone-radius` | `calc(12px * var(--kz-radius-scale, 1))` |  |
| `--kz-phone-pad` | `16px` |  |
| `--kz-phone-width` | `var(--kz-field-width, 320px)` |  |
| `--kz-phone-list-height` | `236px` | the open list of countries, at most: it scrolls past that |
| `--kz-phone-duration` | `0.35s` |  |
| `--kz-phone-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-countries` (e.g. `GB,IE,FR,BE,NL,DE,ES,IT,PT`, `US`), `data-country` (e.g. `FR`, `GB`), `data-locale`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-phone {
    --kz-phone-bg: #161616;
    --kz-phone-fg: #f2f2f0;
    --kz-phone-muted: rgba(242, 242, 240, 0.62);
    --kz-phone-line: rgba(255, 255, 255, 0.14);
    --kz-phone-line-hover: rgba(255, 255, 255, 0.3);
    --kz-phone-soft: rgba(255, 255, 255, 0.08);
    --kz-phone-error: #f2f2f0;
    --kz-phone-shadow: 0 18px 40px -16px rgba(0, 0, 0, 0.8);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the country code | `Enter` / `Space` / `ArrowDown` / `ArrowUp` | Opens the list of countries, in the search |
| In the search, while it's open | `ArrowDown` / `ArrowUp` | Next or previous country, no looping |
|  | `PageDown` / `PageUp` | Five countries down or up |
|  | `Enter` | Picks the country, back to the number |
|  | `Tab` | Picks the highlighted country and moves on |
|  | `Escape` | Closes it, focus back on the code |
| In the number | `Backspace` | Erases a digit, stepping over the spaces |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
