# Circle Text

[![Circle Text, live on kodza.dev](https://kodza.dev/anim/circle-text/og.jpg)](https://kodza.dev/components/circle-text/)

A round link with its label written around the edge, repeated to close the circle. It turns slowly, speeds up with the scroll, slows down under the pointer.

**[Live demo](https://kodza.dev/components/circle-text/)** · Text effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-circle-text.html`](kodza-circle-text.html) | 0.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-circle-text.css`](kodza-circle-text.css) | 8.5 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-circle-text.js`](kodza-circle-text.js) | 10.1 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-circle-text.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-circle-text.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/circle-text/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Circle Text to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-circle-text` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-circle-text-size` | `128px` |  |
| `--kz-circle-text-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-circle-text-bg` | `transparent` |  |
| `--kz-circle-text-border` | `color-mix(in srgb, var(--kz-circle-text-fg) 16%, transparent)` |  |
| `--kz-circle-text-text` | `calc(var(--kz-circle-text-size) * 0.086)` |  |
| `--kz-circle-text-inset` | `calc(var(--kz-circle-text-size) * 0.05)` |  |
| `--kz-circle-text-turn` | `18s` |  |
| `--kz-circle-text-icon` | `calc(var(--kz-circle-text-size) * 0.22)` |  |

- Modifiers: `.kodza-circle-text--solid`
- Attributes: `data-icon` (e.g. `out`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-circle-text {
    --kz-circle-text-fg: #f2f2f0;
  }

  .kodza-circle-text--solid {
    --kz-circle-text-bg: #f2f2f0;
    --kz-circle-text-fg: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
