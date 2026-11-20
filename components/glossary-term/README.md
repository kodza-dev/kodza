# Glossary Term

[![Glossary Term, live on kodza.dev](https://kodza.dev/anim/glossary-term/og.jpg)](https://kodza.dev/components/glossary-term/)

Reads the glossary at the end of a text and underlines its words where they first appear. Point, focus or tap one: a card unfolds with the definition and a link to the entry, which links back.

**[Live demo](https://kodza.dev/components/glossary-term/)** · Text effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-glossary-term.html`](kodza-glossary-term.html) | 1.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-glossary-term.css`](kodza-glossary-term.css) | 22.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-glossary-term.js`](kodza-glossary-term.js) | 18.5 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-glossary-term.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-glossary-term.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/glossary-term/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Glossary Term to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-glossary-term]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-glossary-term-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-glossary-term-muted` | `color-mix(in srgb, var(--kz-glossary-term-fg) 62%, transparent)` |  |
| `--kz-glossary-term-rule` | `color-mix(in srgb, var(--kz-glossary-term-fg) 12%, transparent)` |  |
| `--kz-glossary-term-dots` | `color-mix(in srgb, currentColor 55%, transparent)` | the underline at rest |
| `--kz-glossary-term-flag` | `color-mix(in srgb, var(--kz-glossary-term-fg) 7%, transparent)` | an entry just reached |
| `--kz-glossary-term-term` | `var(--kz-glossary-term-fg)` | the words, a step darker than the text |
| `--kz-glossary-term-weight` | `500` |  |
| `--kz-glossary-term-mark` | `color-mix(in srgb, var(--kz-glossary-term-fg) 10%, transparent)` | fills the open word |
| `--kz-glossary-term-card-bg` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-glossary-term-card-fg` | `var(--kz-glossary-term-fg)` |  |
| `--kz-glossary-term-card-border` | `color-mix(in srgb, var(--kz-glossary-term-card-fg) 10%, transparent)` |  |
| `--kz-glossary-term-card-shadow` | `rgba(10, 10, 10, 0.16)` |  |
| `--kz-glossary-term-card-width` | `300px` |  |
| `--kz-glossary-term-label-font` | `var(--kz-font-label, var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace))` |  |

- Attributes: `data-kodza-glossary-term`, `data-match` (e.g. `monthly recurring revenue`, `seats`), `data-side`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-glossary-term {
    --kz-glossary-term-fg: #f2f2f0;
    --kz-glossary-term-card-bg: #161616;
    --kz-glossary-term-card-border: rgba(255, 255, 255, 0.12);
    --kz-glossary-term-card-shadow: rgba(0, 0, 0, 0.55);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a word of the text | `Enter` / `Space` | Opens or closes its card |
|  | `Escape` | Closes the card |
| In the card | `Enter` | Goes to the entry in the glossary, which flashes |
| In the glossary | `Enter` / `Space` | Back to the word in the text |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
