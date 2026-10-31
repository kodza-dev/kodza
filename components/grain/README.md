# Grain

[![Grain, live on kodza.dev](https://kodza.dev/anim/grain/og.jpg)](https://kodza.dev/components/grain/)

Film grain from one inline SVG noise, jumping ten times a second like the next frame of a roll: under the words of a section, over its photo. The specks take your two colours. Nothing to download.

**[Live demo](https://kodza.dev/components/grain/)** · Backgrounds & textures · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-grain.html`](kodza-grain.html) | 1.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-grain.css`](kodza-grain.css) | 16.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-grain.js`](kodza-grain.js) | 4.9 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-grain.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-grain.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/grain/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Grain to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-grain]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-grain-bg` | `#f2f2f0` | the paper, and the light specks on the photo |
| `--kz-grain-ink` | `#0a0a0a` | the text, and the dark specks |
| `--kz-grain-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-grain-amount` | `0.16` | grain on the section: 0 is clean, 0.25 is pushed |
| `--kz-grain-photo` | `0.35` | grain on the photo |
| `--kz-grain-scale` | `1` | 1.5 or 2 for a coarser grain |
| `--kz-grain-speed` | `1s` | one cycle of ten frames |
| `--kz-grain-height` | `600px` |  |
| `--kz-grain-width` | `1152px` | the content column |
| `--kz-grain-side` | `clamp(20px, 5vw, 64px)` |  |

- Modifiers: `.kodza-grain--still`
- Attributes: `data-kodza-grain`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-grain {
    --kz-grain-bg: #0a0a0a;
    --kz-grain-ink: #f2f2f0;
    --kz-grain-muted: rgba(242, 242, 240, 0.62);
    --kz-grain-amount: 0.13;
    --kz-grain-photo: 0.25;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
