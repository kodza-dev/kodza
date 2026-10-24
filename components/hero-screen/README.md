# Hero Screen

[![Hero Screen, live on kodza.dev](https://kodza.dev/anim/hero-screen/og.jpg)](https://kodza.dev/components/hero-screen/)

A centred title and its buttons over a screenshot of the product, leaning back in perspective. On scroll the screen stands up to face you and grows while the title steps back.

**[Live demo](https://kodza.dev/components/hero-screen/)** · Hero · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-hero-screen.html`](kodza-hero-screen.html) | 2.0 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-hero-screen.css`](kodza-hero-screen.css) | 18.0 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-hero-screen.js`](kodza-hero-screen.js) | 13.6 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-hero-screen.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-hero-screen.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/hero-screen/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Hero Screen to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-hero-screen` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-hero-screen-ink` | `#0a0a0a` |  |
| `--kz-hero-screen-paper` | `#f2f2f0` |  |
| `--kz-hero-screen-dim` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-hero-screen-faint` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-hero-screen-soft` | `rgba(10, 10, 10, 0.07)` |  |
| `--kz-hero-screen-bg` | `transparent` |  |
| `--kz-hero-screen-bezel` | `#fff` | the frame around the screenshot |
| `--kz-hero-screen-edge` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-hero-screen-shadow-far` | `0 60px 110px -34px rgba(10, 10, 10, 0.34), 0 24px 48px -24px rgba(10, 10, 10, 0.16)` | leaning back |
| `--kz-hero-screen-shadow-near` | `0 1px 2px rgba(10, 10, 10, 0.06), 0 22px 48px -22px rgba(10, 10, 10, 0.24)` | upright |
| `--kz-hero-screen-veil` | `linear-gradient(rgba(10, 10, 10, 0.14), rgba(10, 10, 10, 0.03) 70%)` | the shade on the screen while it leans |
| `--kz-hero-screen-width` | `1240px` |  |
| `--kz-hero-screen-gutter` | `clamp(16px, 4vw, 40px)` |  |
| `--kz-hero-screen-pad-y` | `clamp(20px, 3svh, 40px)` |  |
| `--kz-hero-screen-size` | `clamp(36px, min(6.4cqi, 9.4svh), 96px)` | the title lines |
| `--kz-hero-screen-ratio` | `1.6` | the screenshot's width / height |
| `--kz-hero-screen-tilt` | `24deg` | how far the screen leans back at rest |
| `--kz-hero-screen-shrink` | `0.86` | its scale at rest: it grows to full size |
| `--kz-hero-screen-depth` | `1600px` | the perspective: shorter is stronger |
| `--kz-hero-screen-radius` | `18px` |  |
| `--kz-hero-screen-top` | `0px` | height of a fixed site header: the scene pins under it |
| `--kz-hero-screen-distance` | `140svh` | how long the scene holds |
| `--kz-hero-screen-mono` | `"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |  |
| `--kz-hero-screen-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-hero-screen {
    --kz-hero-screen-ink: #f2f2f0;
    --kz-hero-screen-paper: #0a0a0a;
    --kz-hero-screen-dim: rgba(242, 242, 240, 0.64);
    --kz-hero-screen-faint: rgba(242, 242, 240, 0.5);
    --kz-hero-screen-soft: rgba(242, 242, 240, 0.1);
    --kz-hero-screen-bezel: #161616;
    --kz-hero-screen-edge: rgba(255, 255, 255, 0.12);
    --kz-hero-screen-shadow-far: 0 60px 110px -34px rgba(0, 0, 0, 0.7), 0 24px 48px -24px rgba(0, 0, 0, 0.5);
    --kz-hero-screen-shadow-near: 0 1px 2px rgba(0, 0, 0, 0.4), 0 22px 48px -22px rgba(0, 0, 0, 0.6);
    --kz-hero-screen-veil: linear-gradient(rgba(0, 0, 0, 0.34), rgba(0, 0, 0, 0.08) 70%);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a button | `Enter` | Follows the link |
| Tabbing back in | `Shift+Tab` | Lands on a button, the hero scrolls back to show it whole |

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
