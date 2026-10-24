# Hero Focus

[![Hero Focus, live on kodza.dev](https://kodza.dev/anim/hero-focus/og.jpg)](https://kodza.dev/components/hero-focus/)

A title sharp over a blurred picture. On scroll the focus moves to the picture, the title blurs and leaves, a readout counts the distance, then notes point out the details. It rewinds.

**[Live demo](https://kodza.dev/components/hero-focus/)** · Hero · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-hero-focus.html`](kodza-hero-focus.html) | 3.3 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-hero-focus.css`](kodza-hero-focus.css) | 21.5 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-hero-focus.js`](kodza-hero-focus.js) | 21.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-hero-focus.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-hero-focus.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/hero-focus/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Hero Focus to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-hero-focus` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-hero-focus-ink` | `#0a0a0a` |  |
| `--kz-hero-focus-paper` | `#f2f2f0` |  |
| `--kz-hero-focus-dim` | `rgba(10, 10, 10, 0.66)` |  |
| `--kz-hero-focus-line` | `rgba(10, 10, 10, 0.12)` |  |
| `--kz-hero-focus-card` | `#fff` |  |
| `--kz-hero-focus-veil` | `242, 242, 240` | the readability veil, rgb of the paper |
| `--kz-hero-focus-ratio` | `1` | the picture's width / height |
| `--kz-hero-focus-crop-x` | `0.5` | which part stays in view when the screen crops it, 0 to 1 |
| `--kz-hero-focus-crop-y` | `0.45` |  |
| `--kz-hero-focus-blur` | `18px` | how soft the picture is behind the words |
| `--kz-hero-focus-gutter` | `clamp(16px, 4vw, 40px)` |  |
| `--kz-hero-focus-pad-y` | `clamp(20px, 3vw, 40px)` |  |
| `--kz-hero-focus-top` | `0px` | height of a fixed site header: the scene pins under it |
| `--kz-hero-focus-distance` | `200svh` | how long the scene stays pinned |
| `--kz-hero-focus-mono` | `"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |  |
| `--kz-hero-focus-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-place` (e.g. `left`, `below`, `above`), `data-side` (e.g. `right`, `left`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-hero-focus {
    --kz-hero-focus-ink: #f2f2f0;
    --kz-hero-focus-paper: #0a0a0a;
    --kz-hero-focus-dim: rgba(242, 242, 240, 0.66);
    --kz-hero-focus-line: rgba(255, 255, 255, 0.14);
    --kz-hero-focus-card: #161616;
    --kz-hero-focus-veil: 10, 10, 10;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the button | `Enter` | Follows the link |

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
