# Morph Icons

[![Morph Icons, live on kodza.dev](https://kodza.dev/anim/morph-icons/og.jpg)](https://kodza.dev/components/morph-icons/)

Icon buttons whose strokes travel into the other icon: play to pause, sound to mute, plus to close, list to grid. They follow aria-pressed or aria-expanded and fire kodza:morph-icons.

**[Live demo](https://kodza.dev/components/morph-icons/)** · SVG & Drawing · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-morph-icons.html`](kodza-morph-icons.html) | 2.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-morph-icons.css`](kodza-morph-icons.css) | 14.0 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-morph-icons.js`](kodza-morph-icons.js) | 5.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-morph-icons.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-morph-icons.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/morph-icons/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Morph Icons to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-morph-icons` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-morph-icons-size` | `44px` |  |
| `--kz-morph-icons-icon` | `20px` |  |
| `--kz-morph-icons-stroke` | `1.75px` | in icon units, 24 across |
| `--kz-morph-icons-ink` | `var(--kz-color-accent, var(--kz-color-ink, #0a0a0a))` |  |
| `--kz-morph-icons-on-ink` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-morph-icons-hover` | `color-mix(in srgb, var(--kz-morph-icons-ink) 86.94%, var(--kz-morph-icons-on-ink))` | the circle under the pointer |
| `--kz-morph-icons-tint` | `color-mix(in srgb, var(--kz-color-ink, #0a0a0a) 7%, transparent)` | the bare button under the pointer |
| `--kz-morph-icons-duration` | `0.45s` |  |
| `--kz-morph-icons-ease` | `cubic-bezier(0.65, 0, 0.35, 1)` | in and out, so the strokes are seen travelling |

- Modifiers: `.kodza-morph-icons--bare`, `.kodza-morph-icons--play`, `.kodza-morph-icons--plus`, `.kodza-morph-icons--sound`, `.kodza-morph-icons--view`
- Events: `kodza:morph-icons`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-morph-icons {
    --kz-morph-icons-ink: #f2f2f0;
    --kz-morph-icons-on-ink: #0a0a0a;
    --kz-morph-icons-hover: #ffffff;
    --kz-morph-icons-tint: rgba(255, 255, 255, 0.1);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a button | `Enter` / `Space` | Switches the icon, and aria-pressed or aria-expanded with it |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
