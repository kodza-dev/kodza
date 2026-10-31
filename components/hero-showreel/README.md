# Hero Showreel

[![Hero Showreel, live on kodza.dev](https://kodza.dev/anim/hero-showreel/og.jpg)](https://kodza.dev/components/hero-showreel/)

A showreel hero: a muted loop under the title and a Play reel pill that follows the pointer. A click grows the pill into a player with sound, pause, mute and a seek track.

**[Live demo](https://kodza.dev/components/hero-showreel/)** · Hero · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-hero-showreel.html`](kodza-hero-showreel.html) | 1.6 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-hero-showreel.css`](kodza-hero-showreel.css) | 29.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-hero-showreel.js`](kodza-hero-showreel.js) | 19.6 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-hero-showreel.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-hero-showreel.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/hero-showreel/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Hero Showreel to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-hero-showreel` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-hero-showreel-light` | `#f2f2f0` |  |
| `--kz-hero-showreel-ink` | `#0a0a0a` |  |
| `--kz-hero-showreel-dim` | `rgba(242, 242, 240, 0.8)` |  |
| `--kz-hero-showreel-faint` | `rgba(242, 242, 240, 0.7)` |  |
| `--kz-hero-showreel-glass` | `rgba(242, 242, 240, 0.14)` |  |
| `--kz-hero-showreel-shade` | `rgba(10, 10, 10, 0.8)` |  |
| `--kz-hero-showreel-base` | `#1c1c1c` |  |
| `--kz-hero-showreel-curtain` | `rgba(10, 10, 10, 0.9)` |  |
| `--kz-hero-showreel-bg` | `transparent` |  |
| `--kz-hero-showreel-height` | `clamp(560px, 54vw, 800px)` |  |
| `--kz-hero-showreel-gutter` | `clamp(12px, 2vw, 24px)` |  |
| `--kz-hero-showreel-pad` | `clamp(24px, 4.5vw, 64px)` |  |
| `--kz-hero-showreel-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-hero-showreel-position` | `50% 50%` |  |
| `--kz-hero-showreel-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-hero-showreel-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-hero-showreel-glide` | `cubic-bezier(0.6, 0, 0.1, 1)` |  |
| `--kz-hero-showreel-soft-ease` | `cubic-bezier(0.25, 1, 0.5, 1)` |  |

- Attributes: `data-poster` (e.g. `https://kodza.dev/media/kz-reel-poster.webp`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-hero-showreel {
    --kz-hero-showreel-base: #161616;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the pill | `Enter` | Opens the reel, with sound |
| In the player | `ArrowLeft` / `ArrowRight` | Goes 5 seconds back or ahead |
|  | `Escape` | Closes it, the player goes back into the pill |

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
