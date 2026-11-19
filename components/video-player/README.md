# Video Player

[![Video Player, live on kodza.dev](https://kodza.dev/anim/video-player/og.jpg)](https://kodza.dev/components/video-player/)

A native video with its own controls: the Play pill stretches into a bar with chapters on the track, captions, sound and full screen. It steps aside while the video plays.

**[Live demo](https://kodza.dev/components/video-player/)** · Media · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-video-player.html`](kodza-video-player.html) | 4.3 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-video-player.css`](kodza-video-player.css) | 31.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-video-player.js`](kodza-video-player.js) | 27.7 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-video-player.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-video-player.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/video-player/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Video Player to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-video-player` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-video-player-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-video-player-light` | `var(--kz-color-page, #f2f2f0)` |  |
| `--kz-video-player-surface` | `color-mix(in srgb, var(--kz-video-player-light) 86%, transparent)` |  |
| `--kz-video-player-track` | `color-mix(in srgb, var(--kz-video-player-ink) 14%, transparent)` |  |
| `--kz-video-player-buffered-fill` | `color-mix(in srgb, var(--kz-video-player-ink) 16%, transparent)` |  |
| `--kz-video-player-hover` | `color-mix(in srgb, var(--kz-video-player-ink) 8%, transparent)` |  |
| `--kz-video-player-base` | `#141414` |  |
| `--kz-video-player-on-video` | `#fff` |  |
| `--kz-video-player-caption-scrim` | `rgba(10, 10, 10, 0.66)` |  |
| `--kz-video-player-bar-shadow` | `0 10px 30px rgba(10, 10, 10, 0.16), 0 1px 2px rgba(10, 10, 10, 0.08)` |  |
| `--kz-video-player-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-video-player-gap` | `12px` |  |
| `--kz-video-player-bar-height` | `52px` |  |
| `--kz-video-player-button` | `36px` |  |
| `--kz-video-player-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-video-player-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-captions`, `data-leaving`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-video-player {
    --kz-video-player-ink: #f2f2f0;
    --kz-video-player-light: #161616;
    --kz-video-player-base: #161616;
    --kz-video-player-bar-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the volume | `ArrowLeft` / `ArrowRight` | Volume down or up |
|  | `Home` / `End` | Silent or full volume |
| Anywhere in the player | `Space` / `K` | Plays or pauses |
|  | `J` / `L` | Back or forward 10 seconds |
|  | `ArrowLeft` / `ArrowRight` | Back or forward 5 seconds |
|  | `ArrowUp` / `ArrowDown` | Volume up or down |
|  | `Home` / `End` | Start or end of the video |
|  | `M` | Mutes or brings the sound back |
|  | `C` | Captions on or off |
|  | `F` | Full screen, or back out of it |

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
