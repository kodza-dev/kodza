# Page Lift

[![Page Lift, live on kodza.dev](https://kodza.dev/anim/page-lift/og.jpg)](https://kodza.dev/components/page-lift/)

Between two real pages, the one you leave recedes as the next rises over it on a rounded edge. The header stays, back plays it in reverse. Chrome, Edge, Safari; Firefox loads plainly for now. No GSAP.

**[Live demo](https://kodza.dev/components/page-lift/)** · Preloaders & transitions · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-page-lift.html`](kodza-page-lift.html) | 1.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-page-lift.css`](kodza-page-lift.css) | 18.6 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-page-lift.js`](kodza-page-lift.js) | 23.3 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-page-lift.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-page-lift.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/page-lift/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Page Lift to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-page-lift]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-page-lift-duration` | `0.8s` | the lift, both ways |
| `--kz-page-lift-ease` | `cubic-bezier(0.76, 0, 0.24, 1)` |  |
| `--kz-page-lift-depth` | `0.92` | how far the page you leave recedes |
| `--kz-page-lift-veil` | `0.55` | and how dark it gets |
| `--kz-page-lift-rise` | `16%` | the next page starts this far down, under its own top edge |
| `--kz-page-lift-radius` | `calc(20px * var(--kz-radius-scale, 1))` | its top corners, flat once it lands |
| `--kz-page-lift-backdrop` | `#0a0a0a` | behind the page that recedes |
| `--kz-page-lift-enter-delay` | `0.36s` | the arrival starts while the page is still rising |
| `--kz-page-lift-enter-ease` | `cubic-bezier(0.2, 0.8, 0.1, 1)` |  |
| `--kz-page-lift-reveal-ease` | `cubic-bezier(0.65, 0, 0.35, 1)` | the image uncovering: gentle start, no flash |
| `--kz-page-lift-bg` | `#f2f2f0` |  |
| `--kz-page-lift-fg` | `#0a0a0a` |  |
| `--kz-page-lift-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-page-lift-line` | `rgba(10, 10, 10, 0.12)` |  |
| `--kz-page-lift-image-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-page-lift-side` | `24px` |  |

- Attributes: `data-enter` (e.g. `label`, `title`, `image`), `data-kodza-page-lift`, `data-page-back`
- Events: `kodza:page-engine`, `kodza:page-transition`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-page-lift {
    --kz-page-lift-bg: #0a0a0a;
    --kz-page-lift-fg: #f2f2f0;
    --kz-page-lift-muted: rgba(242, 242, 240, 0.62);
    --kz-page-lift-line: rgba(242, 242, 240, 0.14);
    --kz-page-lift-backdrop: #222;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
