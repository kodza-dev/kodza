# Scroll Gauge

[![Scroll Gauge, live on kodza.dev](https://kodza.dev/anim/scroll-gauge/og.jpg)](https://kodza.dev/components/scroll-gauge/)

A figure pinned in a corner of a long page. Each section carries its value, and as you read, the figure rolls to it digit by digit, with its unit, a note and a scale of the whole story.

**[Live demo](https://kodza.dev/components/scroll-gauge/)** · Scroll · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-scroll-gauge.html`](kodza-scroll-gauge.html) | 1.9 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-scroll-gauge.css`](kodza-scroll-gauge.css) | 16.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-scroll-gauge.js`](kodza-scroll-gauge.js) | 20.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-scroll-gauge.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-scroll-gauge.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/scroll-gauge/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Scroll Gauge to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-scroll-gauge]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-scroll-gauge-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-scroll-gauge-muted` | `color-mix(in srgb, var(--kz-scroll-gauge-fg) 62%, transparent)` |  |
| `--kz-scroll-gauge-line` | `color-mix(in srgb, var(--kz-scroll-gauge-fg) 10%, transparent)` | the dial's edge and the rules between sections |
| `--kz-scroll-gauge-rule` | `color-mix(in srgb, var(--kz-scroll-gauge-fg) 24%, transparent)` | the scale and its ticks |
| `--kz-scroll-gauge-glass` | `color-mix(in srgb, var(--kz-color-paper, #ffffff) 78%, transparent)` |  |
| `--kz-scroll-gauge-shadow` | `0 1px 2px rgba(10, 10, 10, 0.04), 0 14px 32px -14px rgba(10, 10, 10, 0.22)` |  |
| `--kz-scroll-gauge-size` | `48px` | the figure |
| `--kz-scroll-gauge-width` | `208px` | the narrowest the dial gets; a longer figure widens it |
| `--kz-scroll-gauge-inset` | `24px` | from the bottom of the screen |
| `--kz-scroll-gauge-side` | `0px` | from the side of the story (left, or right with data-side="right") |
| `--kz-scroll-gauge-radius` | `calc(14px * var(--kz-radius-scale, 1))` |  |
| `--kz-scroll-gauge-z` | `20` |  |
| `--kz-scroll-gauge-section` | `560px` | the least height of a section |
| `--kz-scroll-gauge-in` | `0.6s` | the dial coming in; the figure rolls in the script's time |
| `--kz-scroll-gauge-out` | `0.4s` | and going away |
| `--kz-scroll-gauge-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-scroll-gauge-ease-out` | `cubic-bezier(0.65, 0, 0.35, 1)` |  |

- Attributes: `data-gauge` (e.g. `4`, `26`, `290`, `96`, `36.5`), `data-gauge-note` (e.g. `Cold room`, `Shaping bench`, `Oven floor`, `Inside the crumb`, `Your hand`), `data-grouping`, `data-kodza-scroll-gauge`, `data-label` (e.g. `Temperature`), `data-side` (e.g. `right`), `data-unit` (e.g. `°C`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-scroll-gauge {
    --kz-scroll-gauge-fg: #f2f2f0;
    --kz-scroll-gauge-muted: rgba(242, 242, 240, 0.62);
    --kz-scroll-gauge-line: rgba(255, 255, 255, 0.14);
    --kz-scroll-gauge-rule: rgba(255, 255, 255, 0.3);
    --kz-scroll-gauge-glass: rgba(22, 22, 22, 0.72);
    --kz-scroll-gauge-shadow: 0 14px 32px -14px rgba(0, 0, 0, 0.6);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
