# Sticky Scroll Reveal

[![Sticky Scroll Reveal, live on kodza.dev](https://kodza.dev/anim/sticky-scroll-reveal/og.jpg)](https://kodza.dev/components/sticky-scroll-reveal/)

A block that pins itself while big statements take turns as you scroll: each line leaves through its own mask while the next one rises.

**[Live demo](https://kodza.dev/components/sticky-scroll-reveal/)** · Scroll · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-sticky-scroll-reveal.html`](kodza-sticky-scroll-reveal.html) | 0.8 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-sticky-scroll-reveal.css`](kodza-sticky-scroll-reveal.css) | 6.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-sticky-scroll-reveal.js`](kodza-sticky-scroll-reveal.js) | 10.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-sticky-scroll-reveal.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-sticky-scroll-reveal.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/sticky-scroll-reveal/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Pin my three big promises in a Kodza Sticky Scroll Reveal.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-sticky-reveal` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-sreveal-fg` | `#0a0a0a` |  |
| `--kz-sreveal-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-sreveal-line` | `rgba(10, 10, 10, 0.12)` |  |
| `--kz-sreveal-size` | `clamp(44px, 7.4vw, 108px)` |  |
| `--kz-sreveal-segment` | `75vh` |  |
| `--kz-sreveal-gutter` | `max(24px, calc((100vw - 1080px) / 2))` |  |
| `--kz-sreveal-duration` | `0.9s` |  |
| `--kz-sreveal-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-sreveal-stagger` | `70ms` |  |

- Attributes: `data-step`
- Events: `kodza:statement`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-sticky-reveal {
    --kz-sreveal-fg: #f2f2f0;
    --kz-sreveal-muted: rgba(242, 242, 240, 0.62);
    --kz-sreveal-line: rgba(255, 255, 255, 0.16);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| While the block is pinned | `ArrowUp` / `PageUp` / `Shift+Space` | Previous statement |
|  | `ArrowDown` / `PageDown` / `Space` | Next statement, one per press |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
