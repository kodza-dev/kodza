# Footer Venue

[![Footer Venue, live on kodza.dev](https://kodza.dev/anim/footer-venue/og.jpg)](https://kodza.dev/components/footer-venue/)

A footer for a place with opening hours: address and Directions, the week with today under an ink pill, a status worked out at the place's own time that rolls when it changes, the phone and Book.

**[Live demo](https://kodza.dev/components/footer-venue/)** · Footer · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-footer-venue.html`](kodza-footer-venue.html) | 4.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-footer-venue.css`](kodza-footer-venue.css) | 32.7 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-footer-venue.js`](kodza-footer-venue.js) | 16.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-footer-venue.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-footer-venue.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/footer-venue/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Footer Venue to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-footer-venue` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-footer-venue-bg` | `#ffffff` |  |
| `--kz-footer-venue-fg` | `#0a0a0a` |  |
| `--kz-footer-venue-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-footer-venue-line` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-footer-venue-width` | `1200px` | the content, centred |
| `--kz-footer-venue-pad` | `24px` |  |
| `--kz-footer-venue-mono` | `"Geist Mono", ui-monospace, "SF Mono", Menlo, monospace` |  |
| `--kz-footer-venue-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-day` (e.g. `mon`, `tue`, `wed`, `thu`, `fri`, `sat`), `data-now`, `data-soon`, `data-timezone` (e.g. `Europe/Paris`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-footer-venue {
    --kz-footer-venue-bg: #141414;
    --kz-footer-venue-fg: #f2f2f0;
    --kz-footer-venue-muted: rgba(242, 242, 240, 0.62);
    --kz-footer-venue-line: rgba(255, 255, 255, 0.12);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

Every colour is a variable on the footer: set --kz-footer-venue-bg, -fg, -muted and -line (the demo's dark band has the recipe). The pill and its text follow -fg and -bg.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On All hours, on a phone | `Enter` / `Space` | Unfolds the week, or folds it back to today |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
