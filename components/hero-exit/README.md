# Hero Exit

[![Hero Exit, live on kodza.dev](https://kodza.dev/anim/hero-exit/og.jpg)](https://kodza.dev/components/hero-exit/)

A centred title in two big lines. On scroll the scene holds, the lines part, a picture opens between them and tightens into a card, then the next section slides over it.

**[Live demo](https://kodza.dev/components/hero-exit/)** · Hero · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-hero-exit.html`](kodza-hero-exit.html) | 1.7 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-hero-exit.css`](kodza-hero-exit.css) | 18.7 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-hero-exit.js`](kodza-hero-exit.js) | 16.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-hero-exit.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-hero-exit.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/hero-exit/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Hero Exit to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-hero-exit` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-hero-exit-ink` | `#0a0a0a` |  |
| `--kz-hero-exit-paper` | `#f2f2f0` |  |
| `--kz-hero-exit-dim` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-hero-exit-faint` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-hero-exit-soft` | `rgba(10, 10, 10, 0.07)` |  |
| `--kz-hero-exit-bg` | `transparent` |  |
| `--kz-hero-exit-shade` | `#0a0a0a` | the card darkens toward it as the next section covers it |
| `--kz-hero-exit-width` | `1240px` |  |
| `--kz-hero-exit-gutter` | `clamp(16px, 4vw, 40px)` |  |
| `--kz-hero-exit-pad-y` | `clamp(20px, 2.6vw, 36px)` |  |
| `--kz-hero-exit-size` | `calc(clamp(44px, min(14cqi, 17svh), 168px) * var(--kz-font-display-scale, 1))` | the title lines |
| `--kz-hero-exit-focus` | `50% 42%` | the part of the picture the card shows |
| `--kz-hero-exit-card` | `0.74` | the card's height, as a share of the screen |
| `--kz-hero-exit-ratio` | `0.8` | the card's width / height |
| `--kz-hero-exit-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-hero-exit-top` | `0px` | height of a fixed site header: the scene pins under it |
| `--kz-hero-exit-distance` | `180svh` | how long the scene holds before the next section comes |
| `--kz-hero-exit-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace)` |  |
| `--kz-hero-exit-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-hero-exit {
    --kz-hero-exit-ink: #f2f2f0;
    --kz-hero-exit-paper: #0a0a0a;
    --kz-hero-exit-dim: rgba(242, 242, 240, 0.64);
    --kz-hero-exit-faint: rgba(242, 242, 240, 0.5);
    --kz-hero-exit-soft: rgba(242, 242, 240, 0.1);
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
