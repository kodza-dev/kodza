# Roadmap

[![Roadmap, live on kodza.dev](https://kodza.dev/anim/roadmap/og.jpg)](https://kodza.dev/components/roadmap/)

A timeline drawn from a list of work items: bars uncover row after row, the stroke says the status, a line marks today, a row opens its detail. On a phone, a list per period.

**[Live demo](https://kodza.dev/components/roadmap/)** · Data display · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-roadmap.html`](kodza-roadmap.html) | 5.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-roadmap.css`](kodza-roadmap.css) | 32.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-roadmap.js`](kodza-roadmap.js) | 18.0 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-roadmap.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-roadmap.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/roadmap/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Roadmap to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-roadmap` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-roadmap-bg` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-roadmap-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-roadmap-muted` | `color-mix(in srgb, var(--kz-roadmap-fg) 60%, transparent)` |  |
| `--kz-roadmap-border` | `color-mix(in srgb, var(--kz-roadmap-fg) 10%, transparent)` |  |
| `--kz-roadmap-soft` | `color-mix(in srgb, var(--kz-roadmap-fg) 4%, transparent)` | a row, hovered |
| `--kz-roadmap-open` | `color-mix(in srgb, var(--kz-roadmap-fg) 4%, var(--kz-roadmap-bg))` | an open row, opaque over the rules |
| `--kz-roadmap-ink` | `var(--kz-color-accent, var(--kz-roadmap-fg))` | the bars, today's line |
| `--kz-roadmap-on-ink` | `var(--kz-color-on-accent, var(--kz-roadmap-bg))` | the text on a solid bar |
| `--kz-roadmap-dash` | `color-mix(in srgb, var(--kz-roadmap-ink) 55%, transparent)` | a planned bar |
| `--kz-roadmap-fill` | `color-mix(in srgb, var(--kz-roadmap-ink) 12%, transparent)` | the done part of a bar in progress |
| `--kz-roadmap-names` | `clamp(140px, 26%, 210px)` | the column of names |
| `--kz-roadmap-bar` | `28px` |  |
| `--kz-roadmap-pad` | `28px` |  |
| `--kz-roadmap-mono` | `var(--kz-font-mono, ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-roadmap-stagger` | `70ms` | from one row to the next |
| `--kz-roadmap-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-from`, `data-locale` (e.g. `en-GB`), `data-scale` (e.g. `month`), `data-status` (e.g. `shipped`, `progress`, `planned`), `data-until`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-roadmap {
    --kz-roadmap-bg: #161616;
    --kz-roadmap-fg: #f2f2f0;
    --kz-roadmap-muted: rgba(242, 242, 240, 0.6);
    --kz-roadmap-border: rgba(255, 255, 255, 0.12);
    --kz-roadmap-soft: rgba(255, 255, 255, 0.06);
    --kz-roadmap-open: #1d1d1d;
    --kz-roadmap-ink: #f2f2f0;
    --kz-roadmap-dash: rgba(242, 242, 240, 0.55);
    --kz-roadmap-fill: rgba(242, 242, 240, 0.14);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a row of the timeline, or an item of the list on a phone | `Enter` / `Space` | Opens or closes its detail, closing the one open before |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
