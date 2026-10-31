# Countdown

[![Countdown, live on kodza.dev](https://kodza.dev/anim/event-day-counter/og.jpg)](https://kodza.dev/components/event-day-counter/)

A live countdown to a date: every digit that changes falls out of its window as the next one drops in, and at zero the figures step aside for your message. Large or inline.

**[Live demo](https://kodza.dev/components/event-day-counter/)** · Data display · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-event-day-counter.html`](kodza-event-day-counter.html) | 1.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-event-day-counter.css`](kodza-event-day-counter.css) | 7.5 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-event-day-counter.js`](kodza-event-day-counter.js) | 8.0 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-event-day-counter.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-event-day-counter.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/event-day-counter/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add a Kodza Countdown to my launch date.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-countdown` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-countdown-fg` | `#0a0a0a` |  |
| `--kz-countdown-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-countdown-soft` | `rgba(10, 10, 10, 0.07)` |  |
| `--kz-countdown-chip` | `#ffffff` |  |
| `--kz-countdown-size` | `calc(clamp(44px, 7vw, 84px) * var(--kz-font-display-scale, 1))` |  |
| `--kz-countdown-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-countdown--inline`
- Attributes: `data-date` (e.g. `2027-01-01T00:00:00`), `data-done` (e.g. `Happy new year. Ship something.`, `Early bird is gone.`), `data-unit` (e.g. `days`, `hours`, `minutes`, `seconds`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-countdown {
    --kz-countdown-fg: #f2f2f0;
    --kz-countdown-muted: rgba(242, 242, 240, 0.62);
    --kz-countdown-soft: rgba(255, 255, 255, 0.08);
    --kz-countdown-chip: #1c1c1c;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
