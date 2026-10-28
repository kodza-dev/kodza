# Interactive Dots

[![Interactive Dots, live on kodza.dev](https://kodza.dev/anim/interactive-dots/og.jpg)](https://kodza.dev/components/interactive-dots/)

A hero over a field of fine dots. The pointer pushes them aside like a hand in sand, they spring back, and a click sends a wave across. One canvas, asleep when nobody is looking.

**[Live demo](https://kodza.dev/components/interactive-dots/)** · Backgrounds & textures · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-interactive-dots.html`](kodza-interactive-dots.html) | 1.0 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-interactive-dots.css`](kodza-interactive-dots.css) | 10.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-interactive-dots.js`](kodza-interactive-dots.js) | 19.5 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-interactive-dots.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-interactive-dots.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/interactive-dots/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Interactive Dots to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-interactive-dots]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-interactive-dots-bg` | `#f2f2f0` | the paper |
| `--kz-interactive-dots-ink` | `#0a0a0a` | the dots, the text, the button |
| `--kz-interactive-dots-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-interactive-dots-gap` | `22px` | from one dot to the next |
| `--kz-interactive-dots-size` | `1.2px` | dot radius at rest |
| `--kz-interactive-dots-rest` | `0.24` | dot opacity at rest |
| `--kz-interactive-dots-lift` | `0.7` | how much darker a pushed dot gets, 0 to 1 |
| `--kz-interactive-dots-grow` | `0` | how much bigger it gets (0.5 = half again) |
| `--kz-interactive-dots-reach` | `104px` | radius of the hand |
| `--kz-interactive-dots-calm` | `0.3` | how much a pushed dot lights up under the text, 0 to 1 |
| `--kz-interactive-dots-height` | `600px` |  |
| `--kz-interactive-dots-width` | `1152px` | the text column |
| `--kz-interactive-dots-side` | `clamp(20px, 5vw, 64px)` |  |

- Attributes: `data-kodza-interactive-dots`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-interactive-dots {
    --kz-interactive-dots-bg: #0a0a0a;
    --kz-interactive-dots-ink: #f2f2f0;
    --kz-interactive-dots-muted: rgba(242, 242, 240, 0.62);
    --kz-interactive-dots-rest: 0.26;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
