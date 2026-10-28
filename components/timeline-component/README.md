# Timeline

[![Timeline, live on kodza.dev](https://kodza.dev/anim/timeline-component/og.jpg)](https://kodza.dev/components/timeline-component/)

Dated steps along a rail that fills as you scroll: each dot fills when the ink reaches it, each step rises into place the first time it is seen, the last one reached stays marked.

**[Live demo](https://kodza.dev/components/timeline-component/)** · Data display · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-timeline-component.html`](kodza-timeline-component.html) | 2.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-timeline-component.css`](kodza-timeline-component.css) | 12.0 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-timeline-component.js`](kodza-timeline-component.js) | 5.9 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-timeline-component.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-timeline-component.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/timeline-component/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Tell my company story with a Kodza Timeline.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-timeline` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-timeline-fg` | `#0a0a0a` |  |
| `--kz-timeline-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-timeline-line` | `rgba(10, 10, 10, 0.14)` |  |
| `--kz-timeline-soft` | `rgba(10, 10, 10, 0.06)` |  |
| `--kz-timeline-bg` | `#f2f2f0` |  |
| `--kz-timeline-ink` | `#0a0a0a` |  |
| `--kz-timeline-on-ink` | `#ffffff` |  |
| `--kz-timeline-date` | `72px` |  |
| `--kz-timeline-gap` | `56px` |  |
| `--kz-timeline-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-timeline {
    --kz-timeline-fg: #f2f2f0;
    --kz-timeline-muted: rgba(242, 242, 240, 0.62);
    --kz-timeline-line: rgba(255, 255, 255, 0.16);
    --kz-timeline-soft: rgba(255, 255, 255, 0.09);
    --kz-timeline-bg: #0a0a0a;
    --kz-timeline-ink: #f2f2f0;
    --kz-timeline-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
