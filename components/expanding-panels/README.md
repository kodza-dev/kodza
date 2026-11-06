# Expanding Panels

[![Expanding Panels, live on kodza.dev](https://kodza.dev/anim/expanding-panels/og.jpg)](https://kodza.dev/components/expanding-panels/)

Full-height photo panels side by side: the one you hover, focus or tap widens as the others close in, its spine title slides away and rises upright with a line of text and a link. Stacked when narrow.

**[Live demo](https://kodza.dev/components/expanding-panels/)** · Image effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-expanding-panels.html`](kodza-expanding-panels.html) | 5.0 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-expanding-panels.css`](kodza-expanding-panels.css) | 21.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-expanding-panels.js`](kodza-expanding-panels.js) | 11.5 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-expanding-panels.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-expanding-panels.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/expanding-panels/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Expanding Panels to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-expanding-panels` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-expanding-panels-height` | `520px` | side by side |
| `--kz-expanding-panels-grow` | `4` | the open panel, against 1 for a closed one |
| `--kz-expanding-panels-gap` | `8px` |  |
| `--kz-expanding-panels-strip` | `72px` | a closed panel, stacked (under 600px of container) |
| `--kz-expanding-panels-open-height` | `380px` | the open panel, stacked |
| `--kz-expanding-panels-pad` | `24px` | title and text, from the photo's edges |
| `--kz-expanding-panels-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-expanding-panels-bg` | `#1c1c1c` | behind a photo still loading |
| `--kz-expanding-panels-fg` | `#ffffff` |  |
| `--kz-expanding-panels-muted` | `rgba(255, 255, 255, 0.86)` |  |
| `--kz-expanding-panels-veil` | `rgba(10, 10, 10, 0.3)` | over a closed photo |
| `--kz-expanding-panels-shade` | `rgba(10, 10, 10, 0.72)` | at the foot of every photo, under the text |
| `--kz-expanding-panels-link-bg` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-expanding-panels-link-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-expanding-panels-focus` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-expanding-panels-line` | `transparent` | a hairline round each photo, for dark photos on a dark page |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-expanding-panels {
    --kz-expanding-panels-bg: #1c1c1c;
    --kz-expanding-panels-focus: #f2f2f0;
    --kz-expanding-panels-line: rgba(255, 255, 255, 0.12);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a panel | `ArrowLeft` / `ArrowUp` | Previous panel, opened |
|  | `ArrowRight` / `ArrowDown` | Next panel, opened |
|  | `Home` / `End` | First or last panel, opened |

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
