# Image Trail

[![Image Trail, live on kodza.dev](https://kodza.dev/anim/image-trail/og.jpg)](https://kodza.dev/components/image-trail/)

A hero that deals its pictures under the pointer: the next one lands where the hand is, on top of the last, then shrinks away. Quick hands scatter more. A still fan under a finger.

**[Live demo](https://kodza.dev/components/image-trail/)** · Cursor · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-image-trail.html`](kodza-image-trail.html) | 3.0 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-image-trail.css`](kodza-image-trail.css) | 20.8 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-image-trail.js`](kodza-image-trail.js) | 15.7 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-image-trail.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-image-trail.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/image-trail/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Image Trail to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-image-trail]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-image-trail-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-image-trail-surface` | `var(--kz-color-paper, #fff)` |  |
| `--kz-image-trail-dim` | `color-mix(in srgb, var(--kz-image-trail-ink) 72%, transparent)` |  |
| `--kz-image-trail-faint` | `color-mix(in srgb, var(--kz-image-trail-ink) 62%, transparent)` |  |
| `--kz-image-trail-accent` | `var(--kz-color-accent, var(--kz-image-trail-ink))` |  |
| `--kz-image-trail-on-accent` | `var(--kz-color-on-accent, var(--kz-image-trail-surface))` |  |
| `--kz-image-trail-size` | `clamp(112px, 15cqi, 230px)` |  |
| `--kz-image-trail-card` | `min(176px, 23cqi)` |  |
| `--kz-image-trail-shadow` | `0 24px 48px -24px rgba(0, 0, 0, 0.45)` |  |
| `--kz-image-trail-height` | `max(520px, 100svh)` |  |
| `--kz-image-trail-pad` | `clamp(24px, 4.5vw, 56px)` |  |
| `--kz-image-trail-picture-corner` | `calc(8px * var(--kz-radius-scale, 1))` |  |
| `--kz-image-trail-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-image-trail-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-image-trail-glide` | `cubic-bezier(0.6, 0, 0.1, 1)` |  |

- Attributes: `data-kodza-image-trail`, `data-layer` (e.g. `over`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-image-trail {
    --kz-image-trail-ink: #f2f2f0;
    --kz-image-trail-surface: #161616;
    --kz-image-trail-shadow: 0 24px 48px -24px rgba(0, 0, 0, 0.8);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
