# Scroll Path

[![Scroll Path, live on kodza.dev](https://kodza.dev/anim/scroll-path/og.jpg)](https://kodza.dev/components/scroll-path/)

A line drawn through the steps of a section as you read: it swings from step to step, fills each marker it reaches and ends with a ring around the button.

**[Live demo](https://kodza.dev/components/scroll-path/)** · SVG & Drawing · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-scroll-path.html`](kodza-scroll-path.html) | 2.3 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-scroll-path.css`](kodza-scroll-path.css) | 17.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-scroll-path.js`](kodza-scroll-path.js) | 15.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-scroll-path.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-scroll-path.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/scroll-path/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Scroll Path to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-scroll-path` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-scroll-path-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-scroll-path-muted` | `color-mix(in srgb, var(--kz-scroll-path-fg) 62%, transparent)` |  |
| `--kz-scroll-path-bg` | `var(--kz-color-page, #f2f2f0)` | the page behind the markers and around the pen |
| `--kz-scroll-path-ink` | `var(--kz-color-accent, var(--kz-scroll-path-fg))` | the line, the pen and the markers it reached |
| `--kz-scroll-path-on-ink` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-scroll-path-track` | `color-mix(in srgb, var(--kz-scroll-path-fg) 26%, transparent)` | the dotted route, before the ink |
| `--kz-scroll-path-rim` | `color-mix(in srgb, var(--kz-scroll-path-fg) 16%, transparent)` | a marker not reached yet |
| `--kz-scroll-path-width` | `2px` | thickness of the line |
| `--kz-scroll-path-marker` | `44px` |  |
| `--kz-scroll-path-column` | `440px` | width of a step |
| `--kz-scroll-path-gap` | `200px` | between two steps: the swings live there |
| `--kz-scroll-path-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-path-marker`, `data-path-ring`, `data-path-stop`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-scroll-path {
    --kz-scroll-path-fg: #f2f2f0;
    --kz-scroll-path-muted: rgba(242, 242, 240, 0.62);
    --kz-scroll-path-bg: #0a0a0a;
    --kz-scroll-path-ink: #f2f2f0;
    --kz-scroll-path-on-ink: #0a0a0a;
    --kz-scroll-path-track: rgba(255, 255, 255, 0.3);
    --kz-scroll-path-rim: rgba(255, 255, 255, 0.18);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
