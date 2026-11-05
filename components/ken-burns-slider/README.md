# Ken Burns Slider

[![Ken Burns Slider, live on kodza.dev](https://kodza.dev/anim/ken-burns-slider/og.jpg)](https://kodza.dev/components/ken-burns-slider/)

A background slideshow behind fixed words: each photo drifts slowly toward its point of interest, and the next is uncovered by a slow curtain in the same direction. A thin line counts the time, with a pause button.

**[Live demo](https://kodza.dev/components/ken-burns-slider/)** · Image effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-ken-burns-slider.html`](kodza-ken-burns-slider.html) | 3.3 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-ken-burns-slider.css`](kodza-ken-burns-slider.css) | 20.8 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-ken-burns-slider.js`](kodza-ken-burns-slider.js) | 14.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-ken-burns-slider.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-ken-burns-slider.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/ken-burns-slider/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Ken Burns Slider to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-ken-burns-slider` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-ken-burns-slider-height` | `640px` | 100svh for a full-screen hero |
| `--kz-ken-burns-slider-ink` | `#0a0a0a` |  |
| `--kz-ken-burns-slider-paper` | `#ffffff` |  |
| `--kz-ken-burns-slider-text` | `rgba(255, 255, 255, 0.9)` |  |
| `--kz-ken-burns-slider-faint` | `rgba(255, 255, 255, 0.9)` |  |
| `--kz-ken-burns-slider-track` | `rgba(255, 255, 255, 0.3)` |  |
| `--kz-ken-burns-slider-backdrop` | `#1c1c1c` | under the photos while they load |
| `--kz-ken-burns-slider-shade` | `linear-gradient(to top, rgba(10, 10, 10, 0.82), rgba(10, 10, 10, 0.66) 300px, rgba(10, 10, 10, 0.54) 460px, rgba(10, 10, 10, 0.16)), linear-gradient(to right, rgba(10, 10, 10, 0.3), rgba(10, 10, 10, 0) 60%)` |  |
| `--kz-ken-burns-slider-pad` | `clamp(22px, 4.4vw, 56px)` |  |
| `--kz-ken-burns-slider-radius` | `0px` |  |
| `--kz-ken-burns-slider-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-ken-burns-slider-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-focus` (e.g. `60% 62%`, `42% 56%`, `64% 50%`, `50% 58%`), `data-interval` (e.g. `6000`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-ken-burns-slider {
    --kz-ken-burns-slider-backdrop: #161616;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the pause button | `Enter` / `Space` | Pauses the slideshow, or starts it again |

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
