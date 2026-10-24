# Hero Showcase

[![Hero Showcase, live on kodza.dev](https://kodza.dev/anim/hero-showcase/og.jpg)](https://kodza.dev/components/hero-showcase/)

A title over a wall of project thumbnails laid back like prints on a table. On scroll the rows slide in opposite directions and click into line as the wall stands up, every thumbnail a link.

**[Live demo](https://kodza.dev/components/hero-showcase/)** · Hero · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-hero-showcase.html`](kodza-hero-showcase.html) | 7.4 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-hero-showcase.css`](kodza-hero-showcase.css) | 22.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-hero-showcase.js`](kodza-hero-showcase.js) | 17.0 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-hero-showcase.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-hero-showcase.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/hero-showcase/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Hero Showcase to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-hero-showcase` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-hero-showcase-ink` | `#0a0a0a` |  |
| `--kz-hero-showcase-paper` | `#f2f2f0` |  |
| `--kz-hero-showcase-dim` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-hero-showcase-faint` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-hero-showcase-soft` | `rgba(10, 10, 10, 0.07)` |  |
| `--kz-hero-showcase-well` | `rgba(10, 10, 10, 0.06)` | behind a thumbnail while it loads |
| `--kz-hero-showcase-edge` | `rgba(10, 10, 10, 0.08)` | hairline round a thumbnail, so a dark picture keeps its edge |
| `--kz-hero-showcase-bg` | `transparent` |  |
| `--kz-hero-showcase-width` | `1240px` |  |
| `--kz-hero-showcase-gutter` | `clamp(16px, 4vw, 40px)` |  |
| `--kz-hero-showcase-size` | `clamp(38px, min(7cqi, 10svh), 104px)` | the title lines |
| `--kz-hero-showcase-card` | `clamp(150px, min(21cqi, 32svh), 320px)` | a thumbnail's width on the wall |
| `--kz-hero-showcase-gap` | `clamp(10px, 1.2cqi, 18px)` |  |
| `--kz-hero-showcase-radius` | `12px` |  |
| `--kz-hero-showcase-tilt` | `38deg` | how far the wall lies back at rest |
| `--kz-hero-showcase-depth` | `1600px` | the perspective: shorter is stronger |
| `--kz-hero-showcase-top` | `0px` | height of a fixed site header: the scene pins under it |
| `--kz-hero-showcase-distance` | `150svh` | how long the scene holds |
| `--kz-hero-showcase-mono` | `"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |  |
| `--kz-hero-showcase-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-hero-showcase {
    --kz-hero-showcase-ink: #f2f2f0;
    --kz-hero-showcase-paper: #0a0a0a;
    --kz-hero-showcase-dim: rgba(242, 242, 240, 0.64);
    --kz-hero-showcase-faint: rgba(242, 242, 240, 0.5);
    --kz-hero-showcase-soft: rgba(242, 242, 240, 0.1);
    --kz-hero-showcase-well: rgba(242, 242, 240, 0.08);
    --kz-hero-showcase-edge: rgba(242, 242, 240, 0.12);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a button | `Enter` | Follows the link |
| On a project | `Enter` | Follows the link |
| Tabbing on | `Tab` | Reaching a project lays the wall flat, every link in line |
| Tabbing back in | `Shift+Tab` | Lands on a button, the hero scrolls back to show it whole |

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
