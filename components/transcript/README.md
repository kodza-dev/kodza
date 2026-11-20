# Transcript

[![Transcript, live on kodza.dev](https://kodza.dev/anim/transcript/og.jpg)](https://kodza.dev/components/transcript/)

The words of a video or a podcast beside it, at their time: the sentence being said fills with ink as it is spoken, the panel follows it, lets go when you scroll and brings it back. A click plays from there.

**[Live demo](https://kodza.dev/components/transcript/)** · Text effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-transcript.html`](kodza-transcript.html) | 1.4 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-transcript.css`](kodza-transcript.css) | 20.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-transcript.js`](kodza-transcript.js) | 17.3 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-transcript.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-transcript.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/transcript/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Transcript to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-transcript]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-transcript-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-transcript-paper` | `var(--kz-color-paper, #fff)` |  |
| `--kz-transcript-accent` | `var(--kz-color-accent, var(--kz-transcript-fg))` |  |
| `--kz-transcript-on-accent` | `var(--kz-color-on-accent, var(--kz-transcript-paper))` |  |
| `--kz-transcript-dim` | `color-mix(in srgb, var(--kz-transcript-fg) 56%, transparent)` |  |
| `--kz-transcript-border` | `color-mix(in srgb, var(--kz-transcript-fg) 10%, transparent)` |  |
| `--kz-transcript-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-transcript-media-bg` | `#000` |  |
| `--kz-transcript-gap` | `20px` |  |
| `--kz-transcript-columns` | `minmax(0, 3fr) minmax(0, 2fr)` |  |
| `--kz-transcript-height` | `240px` |  |
| `--kz-transcript-text-size` | `16px` |  |
| `--kz-transcript-leading` | `1.55` |  |
| `--kz-transcript-feather` | `14px` |  |
| `--kz-transcript-font` | `var(--kz-font-label, inherit)` |  |
| `--kz-transcript-size` | `var(--kz-font-label-size, 13px)` |  |
| `--kz-transcript-weight` | `var(--kz-font-label-weight, 500)` |  |
| `--kz-transcript-tracking` | `var(--kz-font-label-tracking, 0)` |  |
| `--kz-transcript-case` | `var(--kz-font-label-case, none)` |  |
| `--kz-transcript-mono` | `var(--kz-font-mono, ui-monospace, "SFMono-Regular", Menlo, monospace)` |  |

- Attributes: `data-at` (e.g. `0:00.3`, `0:02.7`, `0:05.2`, `0:07.7`, `0:10.2`, `0:12.7`), `data-end` (e.g. `0:02.4`, `0:04.8`, `0:07.3`, `0:09.8`, `0:12.3`, `0:14.8`), `data-kodza-transcript`, `data-media`, `data-text-now`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-transcript {
    --kz-transcript-fg: #f2f2f0;
    --kz-transcript-paper: #161616;
    --kz-transcript-border: rgba(255, 255, 255, 0.12);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a sentence | `ArrowUp` / `ArrowDown` | Previous or next sentence, without moving the media |
|  | `Home` / `End` | First or last sentence |
|  | `Enter` / `Space` | Plays from this sentence |
| In the transcript | `PageUp` / `PageDown` | Scrolls the text; it stops following until Back to now |

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
