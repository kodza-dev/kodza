# Departure Board

[![Departure Board, live on kodza.dev](https://kodza.dev/anim/departure-board/og.jpg)](https://kodza.dev/components/departure-board/)

The next departures from a place, worked out at its own time: the day's timetable by season and weekday, the next trip on top with a countdown that rolls every minute, gone trips faded, a line once the day is over.

**[Live demo](https://kodza.dev/components/departure-board/)** · Data display · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-departure-board.html`](kodza-departure-board.html) | 3.7 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-departure-board.css`](kodza-departure-board.css) | 18.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-departure-board.js`](kodza-departure-board.js) | 25.1 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-departure-board.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-departure-board.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/departure-board/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Departure Board to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-departure-board` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-departure-board-fg` | `#0a0a0a` |  |
| `--kz-departure-board-muted` | `rgba(10, 10, 10, 0.62)` | gone trips, via, duration, labels |
| `--kz-departure-board-line` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-departure-board-bg` | `#ffffff` |  |
| `--kz-departure-board-ink` | `#0a0a0a` | the countdown pill |
| `--kz-departure-board-on-ink` | `#ffffff` |  |
| `--kz-departure-board-mark` | `rgba(10, 10, 10, 0.05)` | behind the next trip |
| `--kz-departure-board-width` | `520px` |  |
| `--kz-departure-board-duration` | `0.5s` | a gone trip fading |
| `--kz-departure-board-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-clock`, `data-days` (e.g. `mon-sat`, `sun`), `data-end` (e.g. `No more boats today`), `data-from` (e.g. `04-01`, `10-01`), `data-next` (e.g. `Next boat`), `data-now`, `data-timezone` (e.g. `Europe/Paris`), `data-to` (e.g. `09-30`, `03-31`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-departure-board {
    --kz-departure-board-fg: #f2f2f0;
    --kz-departure-board-muted: rgba(242, 242, 240, 0.62);
    --kz-departure-board-line: rgba(255, 255, 255, 0.12);
    --kz-departure-board-bg: #161616;
    --kz-departure-board-ink: #f2f2f0;
    --kz-departure-board-on-ink: #0a0a0a;
    --kz-departure-board-mark: rgba(255, 255, 255, 0.06);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
