# Scroll Sequence

[![Scroll Sequence, live on kodza.dev](https://kodza.dev/anim/scroll-sequence/og.jpg)](https://kodza.dev/components/scroll-sequence/)

A numbered series of pictures drawn on one canvas as the scroll runs through a section that holds the screen. Captions come in on cue, and the frames load coarse to fine: a fast scroll never shows a blank.

**[Live demo](https://kodza.dev/components/scroll-sequence/)** · Scroll · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-scroll-sequence.html`](kodza-scroll-sequence.html) | 1.9 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-scroll-sequence.css`](kodza-scroll-sequence.css) | 16.8 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-scroll-sequence.js`](kodza-scroll-sequence.js) | 15.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-scroll-sequence.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-scroll-sequence.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/scroll-sequence/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Scroll Sequence to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-scroll-sequence]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-scroll-sequence-distance` | `300svh` |  |
| `--kz-scroll-sequence-fit` | `cover` |  |
| `--kz-scroll-sequence-position` | `50% 50%` |  |
| `--kz-scroll-sequence-media-portrait` | `56%` |  |
| `--kz-scroll-sequence-position-portrait` | `83% 25%` |  |
| `--kz-scroll-sequence-gutter` | `clamp(20px, 5cqi, 72px)` |  |
| `--kz-scroll-sequence-sky` | `#e5e3e1` |  |
| `--kz-scroll-sequence-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-scroll-sequence-muted` | `color-mix(in srgb, var(--kz-scroll-sequence-ink) 66%, transparent)` |  |
| `--kz-scroll-sequence-rail` | `color-mix(in srgb, var(--kz-scroll-sequence-ink) 18%, transparent)` |  |
| `--kz-scroll-sequence-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-scroll-sequence-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace)` |  |

- Attributes: `data-at` (e.g. `0`, `0.36`, `0.7`), `data-frames` (e.g. `60`), `data-kodza-scroll-sequence`, `data-pad`, `data-src` (e.g. `https://kodza.dev/media/kz-arch-day/{index}.webp`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-scroll-sequence {
    --kz-scroll-sequence-sky: #08080a;
    --kz-scroll-sequence-ink: #f2f2f0;
    --kz-scroll-sequence-muted: rgba(242, 242, 240, 0.66);
    --kz-scroll-sequence-rail: rgba(242, 242, 240, 0.22);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
