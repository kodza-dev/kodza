# Dot Map

[![Dot Map, live on kodza.dev](https://kodza.dev/anim/dot-map/og.jpg)](https://kodza.dev/components/dot-map/)

A hero over a world map in fine dots, framed on the places you list. Each one shows its local time, and a ring tours them, lighting the land it crosses. A plain list without the script.

**[Live demo](https://kodza.dev/components/dot-map/)** · Backgrounds & textures · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-dot-map.html`](kodza-dot-map.html) | 1.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-dot-map.css`](kodza-dot-map.css) | 17.6 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-dot-map.js`](kodza-dot-map.js) | 37.4 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-dot-map.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-dot-map.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/dot-map/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Dot Map to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-dot-map]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-dot-map-bg` | `#f2f2f0` | the paper |
| `--kz-dot-map-ink` | `#0a0a0a` | the dots, the text, the button |
| `--kz-dot-map-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-dot-map-gap` | `9px` | from one dot of land to the next |
| `--kz-dot-map-size` | `1.5px` | dot radius |
| `--kz-dot-map-rest` | `0.26` | land at rest, 0 to 1 |
| `--kz-dot-map-calm` | `0.3` | how much the dots light up under the text, 0 to 1 (at rest they fade half as far) |
| `--kz-dot-map-zone` | `260px` | the least height left to the map above the text |
| `--kz-dot-map-height` | `720px` |  |
| `--kz-dot-map-width` | `1152px` | the text column |
| `--kz-dot-map-side` | `clamp(20px, 5vw, 64px)` |  |

- Attributes: `data-kodza-dot-map`, `data-lat` (e.g. `34.69`, `49.49`, `45.50`), `data-lon` (e.g. `135.50`, `0.11`, `-73.57`), `data-tz` (e.g. `Asia/Tokyo`, `Europe/Paris`, `America/Toronto`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-dot-map {
    --kz-dot-map-bg: #0a0a0a;
    --kz-dot-map-ink: #f2f2f0;
    --kz-dot-map-muted: rgba(242, 242, 240, 0.62);
    --kz-dot-map-rest: 0.26;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
