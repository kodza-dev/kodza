# Stairs Transition

[![Stairs Transition, live on kodza.dev](https://kodza.dev/anim/stairs-transition/og.jpg)](https://kodza.dev/components/stairs-transition/)

Between two real pages, five ink bands climb over the page like a staircase, then step off onto the next one. Back starts from the other edge. Chrome, Edge, Safari.

**[Live demo](https://kodza.dev/components/stairs-transition/)** · Preloaders & transitions · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-stairs-transition.html`](kodza-stairs-transition.html) | 1.3 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-stairs-transition.css`](kodza-stairs-transition.css) | 23.8 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-stairs-transition.js`](kodza-stairs-transition.js) | 25.7 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-stairs-transition.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-stairs-transition.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/stairs-transition/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Stairs Transition to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-stairs-transition]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-stairs-transition-duration` | `1.2s` | the whole staircase, first band up to last band off |
| `--kz-stairs-transition-stagger` | `0.05s` | from one band to the next |
| `--kz-stairs-transition-ease` | `cubic-bezier(0.76, 0, 0.24, 1)` |  |
| `--kz-stairs-transition-ink` | `var(--kz-color-ink, #0a0a0a)` | the bands |
| `--kz-stairs-transition-way` | `1` | 1: up from the bottom, -1: down from the top |
| `--kz-stairs-transition-enter-delay` | `0.8s` | the arrival starts as the bands step off it |
| `--kz-stairs-transition-enter-ease` | `cubic-bezier(0.2, 0.8, 0.1, 1)` |  |
| `--kz-stairs-transition-bg` | `var(--kz-color-page, #f2f2f0)` |  |
| `--kz-stairs-transition-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-stairs-transition-muted` | `color-mix(in srgb, var(--kz-stairs-transition-fg) 62%, transparent)` |  |
| `--kz-stairs-transition-line` | `color-mix(in srgb, var(--kz-stairs-transition-fg) 12%, transparent)` |  |
| `--kz-stairs-transition-image-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-stairs-transition-side` | `24px` |  |

- Modifiers: `.kodza-stairs-transition--from-top`
- Attributes: `data-enter` (e.g. `label`, `title`, `image`), `data-kodza-stairs-transition`, `data-page-back`
- Events: `kodza:page-engine`, `kodza:page-transition`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-stairs-transition {
    --kz-stairs-transition-bg: #0a0a0a;
    --kz-stairs-transition-fg: #f2f2f0;
    --kz-stairs-transition-muted: rgba(242, 242, 240, 0.62);
    --kz-stairs-transition-line: rgba(242, 242, 240, 0.14);
    --kz-stairs-transition-ink: #f2f2f0;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
