# Relative Time

[![Relative Time, live on kodza.dev](https://kodza.dev/anim/relative-time/og.jpg)](https://kodza.dev/components/relative-time/)

"3 minutes ago" on a real <time>, in the page's language and kept up to date: only the part that changes rolls, and hover or focus shows the exact date in your time zone.

**[Live demo](https://kodza.dev/components/relative-time/)** · Text effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-relative-time.html`](kodza-relative-time.html) | 0.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-relative-time.css`](kodza-relative-time.css) | 7.6 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-relative-time.js`](kodza-relative-time.js) | 14.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-relative-time.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-relative-time.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/relative-time/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Relative Time to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-relative-time` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-relative-time-line` | `color-mix(in srgb, currentColor 40%, transparent)` |  |
| `--kz-relative-time-tip-bg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-relative-time-tip-fg` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-relative-time-tip-muted` | `color-mix(in srgb, var(--kz-relative-time-tip-fg) 62%, transparent)` |  |
| `--kz-relative-time-tip-font` | `var(--kz-font-label, var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace))` |  |
| `--kz-relative-time-tip-size` | `var(--kz-font-label-size, 12px)` |  |
| `--kz-relative-time-tip-weight` | `var(--kz-font-label-weight, 400)` |  |
| `--kz-relative-time-tip-tracking` | `var(--kz-font-label-tracking, 0)` |  |
| `--kz-relative-time-tip-case` | `var(--kz-font-label-case, none)` |  |
| `--kz-relative-time-tip-leading` | `var(--kz-font-label-leading, 1.45)` |  |
| `--kz-relative-time-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-relative-time {
    --kz-relative-time-tip-bg: #f2f2f0;
    --kz-relative-time-tip-fg: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a date | `Tab` | Shows the exact date, in your time zone |
|  | `Escape` | Hides it, the focus stays |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
