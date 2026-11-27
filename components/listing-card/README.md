# Listing Card

[![Listing Card, live on kodza.dev](https://kodza.dev/anim/listing-card/og.jpg)](https://kodza.dev/components/listing-card/)

A rental or property card: each photo sweeps over the last one with a slight depth, under the finger too, the dots stretch to the new photo, and the heart fills with ink and says Saved.

**[Live demo](https://kodza.dev/components/listing-card/)** · Cards · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-listing-card.html`](kodza-listing-card.html) | 3.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-listing-card.css`](kodza-listing-card.css) | 32.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-listing-card.js`](kodza-listing-card.js) | 24.1 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-listing-card.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-listing-card.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/listing-card/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Listing Card to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-listing-card]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-listing-card-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-listing-card-paper` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-listing-card-muted` | `color-mix(in srgb, var(--kz-listing-card-fg) 62%, transparent)` |  |
| `--kz-listing-card-soft` | `color-mix(in srgb, var(--kz-listing-card-fg) 6%, transparent)` |  |
| `--kz-listing-card-ring` | `color-mix(in srgb, var(--kz-listing-card-fg) 12%, transparent)` |  |
| `--kz-listing-card-on-image` | `#ffffff` | the dots, over the photo |
| `--kz-listing-card-veil` | `rgba(10, 10, 10, 0.42)` | the dots' pill |
| `--kz-listing-card-width` | `360px` | the most it takes; a grid column can make it narrower |
| `--kz-listing-card-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-listing-card-ratio` | `4 / 3` |  |
| `--kz-listing-card-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-listing-card-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |

- Attributes: `data-kodza-listing-card`
- Events: `kodza:like`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-listing-card {
    --kz-listing-card-fg: #f2f2f0;
    --kz-listing-card-paper: #161616;
    --kz-listing-card-muted: rgba(242, 242, 240, 0.62);
    --kz-listing-card-soft: rgba(255, 255, 255, 0.06);
    --kz-listing-card-ring: rgba(255, 255, 255, 0.12);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the photos | `ArrowRight` / `ArrowLeft` | Next or previous photo |
|  | `Home` / `End` | First or last photo |
| On the heart | `Enter` / `Space` | Saves the listing, or takes it off your list |

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
