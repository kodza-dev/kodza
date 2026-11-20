# Local Time

[![Local Time, live on kodza.dev](https://kodza.dev/anim/local-time/og.jpg)](https://kodza.dev/components/local-time/)

The time at your place, to the minute: the digits roll on the minute like a counter, the gap to the visitor is worked out in their browser, and office hours say when you reply.

**[Live demo](https://kodza.dev/components/local-time/)** · Text effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-local-time.html`](kodza-local-time.html) | 0.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-local-time.css`](kodza-local-time.css) | 7.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-local-time.js`](kodza-local-time.js) | 15.7 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-local-time.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-local-time.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/local-time/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Local Time to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-local-time` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-local-time-font` | `var(--kz-font-label, var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace))` |  |
| `--kz-local-time-size` | `var(--kz-font-label-size, 14px)` |  |
| `--kz-local-time-weight` | `var(--kz-font-label-weight, 400)` |  |
| `--kz-local-time-tracking` | `var(--kz-font-label-tracking, 0)` |  |
| `--kz-local-time-case` | `var(--kz-font-label-case, none)` |  |
| `--kz-local-time-leading` | `var(--kz-font-label-leading, 1.5)` |  |
| `--kz-local-time-fg` | `var(--kz-color-ink, currentColor)` |  |
| `--kz-local-time-muted` | `color-mix(in srgb, var(--kz-local-time-fg) 62%, transparent)` |  |
| `--kz-local-time-space` | `0.75em` |  |

- Attributes: `data-hours` (e.g. `mon-fri 09:00-18:00`), `data-timezone` (e.g. `Europe/Paris`, `America/Toronto`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-local-time {
    --kz-local-time-fg: #f2f2f0;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
