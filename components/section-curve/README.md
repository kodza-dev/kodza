# Section Curve

[![Section Curve, live on kodza.dev](https://kodza.dev/anim/section-curve/og.jpg)](https://kodza.dev/components/section-curve/)

A section whose top edge comes up curved and pulls flat as it lands, tied to the scroll; scroll back up and it bends again.

**[Live demo](https://kodza.dev/components/section-curve/)** · SVG & Drawing · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-section-curve.html`](kodza-section-curve.html) | 0.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-section-curve.css`](kodza-section-curve.css) | 6.1 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-section-curve.js`](kodza-section-curve.js) | 7.4 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-section-curve.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-section-curve.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/section-curve/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Section Curve to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-section-curve` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-section-curve-bg` | `#0a0a0a` | the section, and its curve |
| `--kz-section-curve-ink` | `#f2f2f0` | its title |
| `--kz-section-curve-muted` | `rgba(242, 242, 240, 0.7)` | its text |
| `--kz-section-curve-depth` | `clamp(48px, 10vw, 160px)` | how high the middle of the curve stands |
| `--kz-section-curve-pad` | `clamp(72px, 9vw, 136px)` | the room above and below the content |
| `--kz-section-curve-width` | `1080px` | the content's widest |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-section-curve {
    --kz-section-curve-bg: #f2f2f0;
    --kz-section-curve-ink: #0a0a0a;
    --kz-section-curve-muted: rgba(10, 10, 10, 0.68);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
