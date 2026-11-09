# Feature List

[![Feature List, live on kodza.dev](https://kodza.dev/anim/feature-list/og.jpg)](https://kodza.dev/components/feature-list/)

Everything a product includes, in groups set out in columns: a tick, a label and a Pro or Soon tag. Each group shows its first lines, one button unfolds them all at their real height.

**[Live demo](https://kodza.dev/components/feature-list/)** · Feature sections · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-feature-list.html`](kodza-feature-list.html) | 9.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-feature-list.css`](kodza-feature-list.css) | 22.1 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-feature-list.js`](kodza-feature-list.js) | 15.5 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-feature-list.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-feature-list.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/feature-list/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Feature List to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-feature-list` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-feature-list-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-feature-list-text` | `color-mix(in srgb, var(--kz-feature-list-ink) 84%, transparent)` | a line |
| `--kz-feature-list-dim` | `color-mix(in srgb, var(--kz-feature-list-ink) 66%, transparent)` |  |
| `--kz-feature-list-faint` | `color-mix(in srgb, var(--kz-feature-list-ink) 60%, transparent)` |  |
| `--kz-feature-list-line` | `color-mix(in srgb, var(--kz-feature-list-ink) 12%, transparent)` | the hairlines and the outlines |
| `--kz-feature-list-soft` | `color-mix(in srgb, var(--kz-feature-list-ink) 6%, transparent)` | the button under the pointer |
| `--kz-feature-list-bg` | `transparent` |  |
| `--kz-feature-list-width` | `var(--kz-page-width, 1440px)` | the content column: the page's, set by the site |
| `--kz-feature-list-gutter` | `var(--kz-page-gutter, clamp(16px, 4vw, 40px))` | the space kept at the screen edges |
| `--kz-feature-list-pad-top` | `clamp(56px, 7vw, 112px)` |  |
| `--kz-feature-list-pad-bottom` | `clamp(56px, 7vw, 112px)` |  |
| `--kz-feature-list-size` | `clamp(28px, 3.4vw, 44px)` | the title |
| `--kz-feature-list-columns` | `4` | the groups side by side, on a wide screen |
| `--kz-feature-list-gap` | `clamp(24px, 3cqi, 48px)` |  |
| `--kz-feature-list-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-feature-list-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-visible` (e.g. `5`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-feature-list {
    --kz-feature-list-ink: #f2f2f0;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
