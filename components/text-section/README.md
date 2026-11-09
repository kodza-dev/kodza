# Text Section

[![Text Section, live on kodza.dev](https://kodza.dev/anim/text-section/og.jpg)](https://kodza.dev/components/text-section/)

A section of running text: the title stays in view on the left while the text, kept to 64 characters a line, scrolls past. It takes paragraphs, lists and quotes as they are. A modifier sets it on two columns.

**[Live demo](https://kodza.dev/components/text-section/)** · Content sections · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-text-section.html`](kodza-text-section.html) | 1.3 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-text-section.css`](kodza-text-section.css) | 22.0 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-text-section.js`](kodza-text-section.js) | 8.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-text-section.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-text-section.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/text-section/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Text Section to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-text-section` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-text-section-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-text-section-body` | `color-mix(in srgb, var(--kz-text-section-ink) 84%, transparent)` | running text |
| `--kz-text-section-dim` | `color-mix(in srgb, var(--kz-text-section-ink) 66%, transparent)` |  |
| `--kz-text-section-rule` | `color-mix(in srgb, var(--kz-text-section-ink) 16%, transparent)` |  |
| `--kz-text-section-bg` | `transparent` |  |
| `--kz-text-section-width` | `var(--kz-page-width, 1440px)` | the content column, the same as the other sections |
| `--kz-text-section-gutter` | `var(--kz-page-gutter, clamp(16px, 4vw, 40px))` | the space kept at the screen edges |
| `--kz-text-section-pad` | `clamp(56px, 7vw, 112px)` | above and below |
| `--kz-text-section-gap` | `clamp(32px, 5vw, 80px)` | between the title and the text |
| `--kz-text-section-head-span` | `5fr` | the title's share of the width… |
| `--kz-text-section-body-span` | `7fr` | …and the text's |
| `--kz-text-section-measure` | `64ch` | the longest line of text |
| `--kz-text-section-offset` | `96px` | how far from the top the title stays (room for a fixed header) |
| `--kz-text-section-size` | `clamp(16px, 1.25vw, 18px)` | running text |
| `--kz-text-section-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |

- Modifiers: `.kodza-text-section--columns`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-text-section {
    --kz-text-section-ink: #f2f2f0;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
