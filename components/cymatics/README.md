# Cymatics

[![Cymatics, live on kodza.dev](https://kodza.dev/anim/cymatics/og.jpg)](https://kodza.dev/components/cymatics/)

A hero beside a speaker drawn in sand: the frame and screws hold their lines while the cone rings through a sweeping tone, its sand sliding to one to five still circles. A woofer, or the whole box.

**[Live demo](https://kodza.dev/components/cymatics/)** · Backgrounds & textures · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-cymatics.html`](kodza-cymatics.html) | 0.8 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-cymatics.css`](kodza-cymatics.css) | 11.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-cymatics.js`](kodza-cymatics.js) | 30.6 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-cymatics.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-cymatics.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/cymatics/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Cymatics to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-cymatics]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-cymatics-bg` | `#ebebe8` | the plate |
| `--kz-cymatics-sand` | `#0a0a0a` | the sand |
| `--kz-cymatics-ink` | `#0a0a0a` | the text and the button |
| `--kz-cymatics-muted` | `rgba(10, 10, 10, 0.7)` |  |
| `--kz-cymatics-on-ink` | `#fff` | the button's label |
| `--kz-cymatics-gap` | `5px` | a grain for every 5 × 5 px (40,000 at most) |
| `--kz-cymatics-size` | `1.2px` | a grain |
| `--kz-cymatics-hold` | `3s` | how long the cone holds each tone |
| `--kz-cymatics-sweep` | `2.2s` | how long the tone takes to reach the next one |
| `--kz-cymatics-reach` | `110px` | how far around the pointer the sand shakes |
| `--kz-cymatics-x` | `76%` | the speaker's centre, in px or % of the section |
| `--kz-cymatics-y` | `50%` |  |
| `--kz-cymatics-speaker` | `760px` | the woofer's width, or the box's height (px) |
| `--kz-cymatics-calm` | `0.25` | how much of the sand shows under the text, 0 to 1 |
| `--kz-cymatics-height` | `600px` |  |
| `--kz-cymatics-width` | `1152px` | the text column |
| `--kz-cymatics-side` | `clamp(20px, 5vw, 64px)` |  |

- Modifiers: `.kodza-cymatics--cabinet`
- Attributes: `data-kodza-cymatics`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-cymatics {
    --kz-cymatics-bg: #0a0a0a;
    --kz-cymatics-sand: #f2f2f0;
    --kz-cymatics-ink: #f2f2f0;
    --kz-cymatics-muted: rgba(242, 242, 240, 0.78);
    --kz-cymatics-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
