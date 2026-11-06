# Curtain Transition

[![Curtain Transition, live on kodza.dev](https://kodza.dev/anim/curtain-transition/og.jpg)](https://kodza.dev/components/curtain-transition/)

Between two real pages, an ink panel rises with the name of the next page, then lifts off onto it. Back plays it in reverse. Curved edge or from the top. Chrome, Edge, Safari.

**[Live demo](https://kodza.dev/components/curtain-transition/)** · Preloaders & transitions · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-curtain-transition.html`](kodza-curtain-transition.html) | 1.3 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-curtain-transition.css`](kodza-curtain-transition.css) | 24.6 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-curtain-transition.js`](kodza-curtain-transition.js) | 26.3 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-curtain-transition.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-curtain-transition.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/curtain-transition/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Curtain Transition to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-curtain-transition]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-curtain-transition-duration` | `1.2s` | the whole curtain: up, a beat on the name, off |
| `--kz-curtain-transition-ease` | `cubic-bezier(0.76, 0, 0.24, 1)` |  |
| `--kz-curtain-transition-ink` | `var(--kz-color-ink, #0a0a0a)` | the panel |
| `--kz-curtain-transition-ink-fg` | `var(--kz-color-page, #f2f2f0)` | the name on it |
| `--kz-curtain-transition-way` | `1` | 1: up from the bottom, -1: down from the top |
| `--kz-curtain-transition-curve` | `0px` | how far its leading edge bows |
| `--kz-curtain-transition-enter-delay` | `0.8s` | the arrival starts as the curtain lifts off it |
| `--kz-curtain-transition-enter-ease` | `cubic-bezier(0.2, 0.8, 0.1, 1)` |  |
| `--kz-curtain-transition-bg` | `var(--kz-color-page, #f2f2f0)` |  |
| `--kz-curtain-transition-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-curtain-transition-muted` | `color-mix(in srgb, var(--kz-curtain-transition-fg) 62%, transparent)` |  |
| `--kz-curtain-transition-line` | `color-mix(in srgb, var(--kz-curtain-transition-fg) 12%, transparent)` |  |
| `--kz-curtain-transition-image-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-curtain-transition-side` | `24px` |  |

- Modifiers: `.kodza-curtain-transition--curved`, `.kodza-curtain-transition--from-top`
- Attributes: `data-enter` (e.g. `label`, `title`, `image`), `data-kodza-curtain-transition`, `data-page-back`, `data-page-name` (e.g. `Null & Void`)
- Events: `kodza:page-engine`, `kodza:page-transition`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-curtain-transition {
    --kz-curtain-transition-bg: #0a0a0a;
    --kz-curtain-transition-fg: #f2f2f0;
    --kz-curtain-transition-muted: rgba(242, 242, 240, 0.62);
    --kz-curtain-transition-line: rgba(242, 242, 240, 0.14);
    --kz-curtain-transition-ink: #f2f2f0;
    --kz-curtain-transition-ink-fg: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
