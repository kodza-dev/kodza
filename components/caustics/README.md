# Caustics

[![Caustics, live on kodza.dev](https://kodza.dev/anim/caustics/og.jpg)](https://kodza.dev/components/caustics/)

A hero over the floor of a pool in the sun: a net of bright lines ray-traced by native WebGL 2 from two dozen swells, and calm water under the text.

**[Live demo](https://kodza.dev/components/caustics/)** · Backgrounds & textures · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-caustics.html`](kodza-caustics.html) | 0.9 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-caustics.css`](kodza-caustics.css) | 11.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-caustics.js`](kodza-caustics.js) | 29.9 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-caustics.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-caustics.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/caustics/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Caustics to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-caustics]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-caustics-bg` | `#babab6` | the floor in the shade |
| `--kz-caustics-light` | `#fff` | the light on it |
| `--kz-caustics-strength` | `0.55` | how much light reaches the floor, 0 to 1 |
| `--kz-caustics-ink` | `#0a0a0a` | the text and the button |
| `--kz-caustics-muted` | `rgba(10, 10, 10, 0.7)` |  |
| `--kz-caustics-on-ink` | `#fff` | the button's label |
| `--kz-caustics-scale` | `480px` | the size of the waves |
| `--kz-caustics-speed` | `1` | how fast the water moves (0: still water) |
| `--kz-caustics-calm` | `0.3` | how much the water moves under the text, 0 to 1 |
| `--kz-caustics-height` | `600px` |  |
| `--kz-caustics-width` | `1152px` | the text column |
| `--kz-caustics-side` | `clamp(20px, 5vw, 64px)` |  |

- Attributes: `data-kodza-caustics`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-caustics {
    --kz-caustics-bg: #0a0a0a;
    --kz-caustics-light: #c2c2bf;
    --kz-caustics-strength: 0.45;
    --kz-caustics-ink: #f2f2f0;
    --kz-caustics-muted: rgba(242, 242, 240, 0.78);
    --kz-caustics-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
