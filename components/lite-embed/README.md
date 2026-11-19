# Lite Embed

[![Lite Embed, live on kodza.dev](https://kodza.dev/anim/lite-embed/og.jpg)](https://kodza.dev/components/lite-embed/)

A YouTube or Vimeo facade: a poster and a Play pill, nothing loaded from YouTube before the click. The player loads behind the poster, which lifts away once it's there. Without the script, a link to the video.

**[Live demo](https://kodza.dev/components/lite-embed/)** · Media · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-lite-embed.html`](kodza-lite-embed.html) | 0.8 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-lite-embed.css`](kodza-lite-embed.css) | 9.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-lite-embed.js`](kodza-lite-embed.js) | 9.3 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-lite-embed.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-lite-embed.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/lite-embed/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Lite Embed to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-lite-embed` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-lite-embed-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-lite-embed-light` | `var(--kz-color-page, #f2f2f0)` |  |
| `--kz-lite-embed-surface` | `color-mix(in srgb, var(--kz-lite-embed-light) 86%, transparent)` |  |
| `--kz-lite-embed-base` | `#141414` |  |
| `--kz-lite-embed-shadow` | `0 10px 30px rgba(10, 10, 10, 0.16), 0 1px 2px rgba(10, 10, 10, 0.08)` |  |
| `--kz-lite-embed-ratio` | `16 / 9` |  |
| `--kz-lite-embed-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-lite-embed-pill-height` | `52px` |  |
| `--kz-lite-embed-dot` | `36px` |  |
| `--kz-lite-embed-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-lite-embed-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-id` (e.g. `Doc8I2bhKbk`), `data-provider` (e.g. `youtube`), `data-start`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-lite-embed {
    --kz-lite-embed-ink: #f2f2f0;
    --kz-lite-embed-light: #161616;
    --kz-lite-embed-base: #161616;
    --kz-lite-embed-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.16);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
