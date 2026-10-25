# Hero Event

[![Hero Event, live on kodza.dev](https://kodza.dev/anim/hero-event/og.jpg)](https://kodza.dev/components/hero-event/)

An event hero that counts down to the start date in its markup, each digit dropping out of its window, then gives way to "Live now" at the start and to the replay link at the end.

**[Live demo](https://kodza.dev/components/hero-event/)** · Hero · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-hero-event.html`](kodza-hero-event.html) | 2.8 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-hero-event.css`](kodza-hero-event.css) | 23.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-hero-event.js`](kodza-hero-event.js) | 15.0 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-hero-event.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-hero-event.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/hero-event/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Hero Event to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-hero-event` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-hero-event-ink` | `#0a0a0a` |  |
| `--kz-hero-event-paper` | `#f2f2f0` |  |
| `--kz-hero-event-dim` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-hero-event-faint` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-hero-event-soft` | `rgba(10, 10, 10, 0.07)` |  |
| `--kz-hero-event-line` | `rgba(10, 10, 10, 0.16)` |  |
| `--kz-hero-event-bg` | `transparent` |  |
| `--kz-hero-event-width` | `1240px` |  |
| `--kz-hero-event-gap` | `clamp(32px, 5vw, 80px)` |  |
| `--kz-hero-event-pad-y` | `clamp(72px, 9vw, 140px)` |  |
| `--kz-hero-event-gutter` | `clamp(16px, 4vw, 40px)` |  |
| `--kz-hero-event-radius` | `16px` |  |
| `--kz-hero-event-ratio` | `4 / 5` |  |
| `--kz-hero-event-size` | `clamp(36px, 4.4vw, 60px)` |  |
| `--kz-hero-event-mono` | `"Geist Mono", ui-monospace, "SF Mono", Menlo, monospace` |  |
| `--kz-hero-event-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-unit` (e.g. `days`, `hours`, `minutes`, `seconds`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-hero-event {
    --kz-hero-event-ink: #f2f2f0;
    --kz-hero-event-paper: #0a0a0a;
    --kz-hero-event-dim: rgba(242, 242, 240, 0.64);
    --kz-hero-event-faint: rgba(242, 242, 240, 0.5);
    --kz-hero-event-soft: rgba(242, 242, 240, 0.1);
    --kz-hero-event-line: rgba(242, 242, 240, 0.18);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
