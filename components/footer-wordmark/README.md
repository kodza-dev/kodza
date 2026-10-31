# Footer Wordmark

[![Footer Wordmark, live on kodza.dev](https://kodza.dev/anim/footer-wordmark/og.jpg)](https://kodza.dev/components/footer-wordmark/)

A site footer that waits under the page: its content rises slower than the scroll while a shade lifts off it, and the brand name is set across the whole width, ink edge to ink edge, its letters rising from their masks.

**[Live demo](https://kodza.dev/components/footer-wordmark/)** · Footer · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-footer-wordmark.html`](kodza-footer-wordmark.html) | 2.4 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-footer-wordmark.css`](kodza-footer-wordmark.css) | 18.0 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-footer-wordmark.js`](kodza-footer-wordmark.js) | 15.5 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-footer-wordmark.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-footer-wordmark.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/footer-wordmark/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Footer Wordmark to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-footer-wordmark` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-footer-wordmark-bg` | `#0a0a0a` |  |
| `--kz-footer-wordmark-fg` | `#f2f2f0` |  |
| `--kz-footer-wordmark-muted` | `rgba(242, 242, 240, 0.62)` |  |
| `--kz-footer-wordmark-line` | `rgba(242, 242, 240, 0.16)` |  |
| `--kz-footer-wordmark-veil` | `#0a0a0a` |  |
| `--kz-footer-wordmark-shade` | `0.85` | the veil when the footer starts to show; 0 = none |
| `--kz-footer-wordmark-depth` | `0.55` | how far behind the page it waits: 0 scrolls in as usual, 1 stays put |
| `--kz-footer-wordmark-pad-top` | `clamp(56px, 7vw, 104px)` |  |
| `--kz-footer-wordmark-gutter` | `clamp(16px, 4vw, 40px)` |  |
| `--kz-footer-wordmark-weight` | `var(--kz-font-display-weight, 600)` |  |
| `--kz-footer-wordmark-tracking` | `var(--kz-font-display-tracking, -0.05em)` |  |
| `--kz-footer-wordmark-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-footer-wordmark-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-split` (e.g. `chars`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-footer-wordmark {
    --kz-footer-wordmark-bg: #f2f2f0;
    --kz-footer-wordmark-fg: #0a0a0a;
    --kz-footer-wordmark-muted: rgba(10, 10, 10, 0.62);
    --kz-footer-wordmark-line: rgba(10, 10, 10, 0.14);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

Every colour is a variable on the footer: set --kz-footer-wordmark-bg, -fg, -muted and -line for a paper footer on a dark site (the demo's dark band has the recipe). The shade the page casts has its own --kz-footer-wordmark-veil, ink in both.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| Tabbing in | `Tab` | On the first link, scrolls on until the footer is in place |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
