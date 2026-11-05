# Theme Toggle

[![Theme Toggle, live on kodza.dev](https://kodza.dev/anim/theme-toggle/og.jpg)](https://kodza.dev/components/theme-toggle/)

A button that switches the page between light and dark, sun to moon. It starts from the system, keeps the visitor's choice, and swaps images that have a night version.

**[Live demo](https://kodza.dev/components/theme-toggle/)** · Navigation · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-theme-toggle.html`](kodza-theme-toggle.html) | 1.8 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-theme-toggle.css`](kodza-theme-toggle.css) | 14.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-theme-toggle.js`](kodza-theme-toggle.js) | 10.9 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-theme-toggle.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-theme-toggle.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/theme-toggle/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Theme Toggle to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-theme-toggle]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-theme-toggle-size` | `40px` |  |
| `--kz-theme-toggle-icon` | `20px` |  |
| `--kz-theme-toggle-stroke` | `1.75px` | in icon units, 24 across |
| `--kz-theme-toggle-ink` | `#0a0a0a` |  |
| `--kz-theme-toggle-surface` | `rgba(10, 10, 10, 0.06)` | the button at rest |
| `--kz-theme-toggle-hover` | `rgba(10, 10, 10, 0.11)` | under the pointer |
| `--kz-theme-toggle-duration` | `0.5s` |  |
| `--kz-theme-toggle-ease` | `cubic-bezier(0.65, 0, 0.35, 1)` | in and out, so the strokes are seen travelling |
| `--kz-theme-toggle-recolor` | `0s` | when the ink flips: at once for a page that switches at once, half its                                     colour transition for one that fades, so it never goes grey on grey |

- Modifiers: `.kodza-theme-toggle--label`
- Attributes: `data-attribute`, `data-class`, `data-dark-src`, `data-kodza-theme-toggle`, `data-storage`, `data-target`
- Events: `kodza:theme-toggle`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-theme-toggle {
    --kz-theme-toggle-ink: #f2f2f0;
    --kz-theme-toggle-surface: rgba(255, 255, 255, 0.08);
    --kz-theme-toggle-hover: rgba(255, 255, 255, 0.14);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the button | `Enter` / `Space` | Switches the page between light and dark |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
