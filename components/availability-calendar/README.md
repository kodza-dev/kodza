# Availability Calendar

[![Availability Calendar, live on kodza.dev](https://kodza.dev/anim/availability-calendar/og.jpg)](https://kodza.dev/components/availability-calendar/)

A calendar drawn from a list of booked dates: the bands draw in reading order, check-in and changeover days are cut on the diagonal, the next free night shows, and the arrows slide the months.

**[Live demo](https://kodza.dev/components/availability-calendar/)** · Data display · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-availability-calendar.html`](kodza-availability-calendar.html) | 1.8 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-availability-calendar.css`](kodza-availability-calendar.css) | 31.5 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-availability-calendar.js`](kodza-availability-calendar.js) | 19.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-availability-calendar.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-availability-calendar.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/availability-calendar/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Availability Calendar to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-availability` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-availability-bg` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-availability-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-availability-muted` | `color-mix(in srgb, var(--kz-availability-fg) 60%, transparent)` |  |
| `--kz-availability-border` | `color-mix(in srgb, var(--kz-availability-fg) 10%, transparent)` |  |
| `--kz-availability-soft` | `color-mix(in srgb, var(--kz-availability-fg) 6%, transparent)` | the arrows, hovered |
| `--kz-availability-ink` | `var(--kz-color-accent, var(--kz-availability-fg))` | today's ring, the strike, the status dot |
| `--kz-availability-band` | `color-mix(in srgb, var(--kz-availability-ink) 10%, transparent)` | under a booked day |
| `--kz-availability-cell` | `38px` | the height of a day |
| `--kz-availability-gap` | `32px` | between two months |
| `--kz-availability-pad` | `28px` |  |
| `--kz-availability-mono` | `var(--kz-font-mono, ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-availability-draw` | `0.42s` | a band drawing across its day |
| `--kz-availability-stagger` | `26ms` | the delay from one booked day to the next |
| `--kz-availability-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-booked`, `data-count`, `data-from`, `data-locale` (e.g. `en-GB`), `data-months` (e.g. `1`), `data-unit` (e.g. `night`, `day`), `data-until`, `data-week-start`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-availability {
    --kz-availability-bg: #161616;
    --kz-availability-fg: #f2f2f0;
    --kz-availability-muted: rgba(242, 242, 240, 0.6);
    --kz-availability-border: rgba(255, 255, 255, 0.12);
    --kz-availability-soft: rgba(255, 255, 255, 0.08);
    --kz-availability-ink: #f2f2f0;
    --kz-availability-band: rgba(242, 242, 240, 0.14);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
