# Read Aloud

[![Read Aloud, live on kodza.dev](https://kodza.dev/anim/read-aloud/og.jpg)](https://kodza.dev/components/read-aloud/)

A Listen button that reads an article with the browser's own voice: the sentence being read stays lit, a pill follows each word, a click on a word reads on from there. Hidden without speech synthesis.

**[Live demo](https://kodza.dev/components/read-aloud/)** · Text effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-read-aloud.html`](kodza-read-aloud.html) | 0.9 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-read-aloud.css`](kodza-read-aloud.css) | 16.1 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-read-aloud.js`](kodza-read-aloud.js) | 19.6 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-read-aloud.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-read-aloud.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/read-aloud/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Read Aloud to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-read-aloud` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-read-aloud-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-read-aloud-paper` | `var(--kz-color-paper, #fff)` |  |
| `--kz-read-aloud-accent` | `var(--kz-color-accent, var(--kz-read-aloud-fg))` |  |
| `--kz-read-aloud-on-accent` | `var(--kz-color-on-accent, var(--kz-read-aloud-paper))` |  |
| `--kz-read-aloud-dim` | `0.56` |  |
| `--kz-read-aloud-mark` | `color-mix(in srgb, var(--kz-read-aloud-fg) 11%, transparent)` |  |
| `--kz-read-aloud-gap` | `24px` |  |
| `--kz-read-aloud-text-size` | `17px` |  |
| `--kz-read-aloud-leading` | `1.6` |  |
| `--kz-read-aloud-title-size` | `30px` |  |
| `--kz-read-aloud-font` | `var(--kz-font-label, inherit)` |  |
| `--kz-read-aloud-size` | `var(--kz-font-label-size, 14px)` |  |
| `--kz-read-aloud-weight` | `var(--kz-font-label-weight, 500)` |  |
| `--kz-read-aloud-tracking` | `var(--kz-font-label-tracking, 0)` |  |
| `--kz-read-aloud-case` | `var(--kz-font-label-case, none)` |  |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-read-aloud {
    --kz-read-aloud-fg: #f2f2f0;
    --kz-read-aloud-paper: #0a0a0a;
    --kz-read-aloud-mark: rgba(255, 255, 255, 0.16);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the Listen button | `Enter` / `Space` | Starts reading, pauses, resumes where it stopped |
| On the speed button | `Enter` / `Space` | Next speed (1×, 1.5×, 2×), from the word being read |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
