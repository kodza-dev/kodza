# Ink Like

[![Ink Like, live on kodza.dev](https://kodza.dev/anim/ink-like/og.jpg)](https://kodza.dev/components/ink-like/)

Like button whose heart fills with ink, a small wave riding the surface, and drains when the like is taken back. The count rolls digit by digit with carries (999 → 1,000) and rolls back if the request fails.

**[Live demo](https://kodza.dev/components/ink-like/)** · Buttons · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-ink-like.html`](kodza-ink-like.html) | 1.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-ink-like.css`](kodza-ink-like.css) | 8.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-ink-like.js`](kodza-ink-like.js) | 14.5 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-ink-like.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-ink-like.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/ink-like/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Ink Like to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-ink-like` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-ink-like-fg` | `#0a0a0a` |  |
| `--kz-ink-like-bg` | `rgba(10, 10, 10, 0.06)` |  |
| `--kz-ink-like-bg-hover` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-ink-like-height` | `52px` |  |
| `--kz-ink-like-pad-x` | `20px` |  |
| `--kz-ink-like-icon` | `22px` |  |
| `--kz-ink-like-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-ink-like--bare`
- Attributes: `data-count` (e.g. `999`, `128`), `data-say-liked`, `data-say-refused`, `data-say-unliked`
- Events: `kodza:like`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-ink-like {
    --kz-ink-like-fg: #f2f2f0;
  }

  .kodza-ink-like:not(.kodza-ink-like--bare) {
    --kz-ink-like-bg: rgba(255, 255, 255, 0.08);
    --kz-ink-like-bg-hover: rgba(255, 255, 255, 0.13);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the button | `Enter` / `Space` | Likes, or takes the like back |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
