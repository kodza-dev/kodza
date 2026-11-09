# Section Intro

[![Section Intro, live on kodza.dev](https://kodza.dev/anim/section-intro/og.jpg)](https://kodza.dev/components/section-intro/)

The head of a section on its own: a mono label, a tight title and a short intro, set beside the title on its first line, under it or centred. It plays its entrance once, as it comes into view.

**[Live demo](https://kodza.dev/components/section-intro/)** · Content sections · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-section-intro.html`](kodza-section-intro.html) | 0.9 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-section-intro.css`](kodza-section-intro.css) | 16.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-section-intro.js`](kodza-section-intro.js) | 8.5 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-section-intro.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-section-intro.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/section-intro/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Section Intro to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-section-intro` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-section-intro-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-section-intro-dim` | `color-mix(in srgb, var(--kz-section-intro-ink) 66%, transparent)` |  |
| `--kz-section-intro-faint` | `color-mix(in srgb, var(--kz-section-intro-ink) 60%, transparent)` |  |
| `--kz-section-intro-bg` | `transparent` |  |
| `--kz-section-intro-width` | `var(--kz-page-width, 1440px)` | the content column, the same as the other sections |
| `--kz-section-intro-gutter` | `var(--kz-page-gutter, clamp(16px, 4vw, 40px))` | the space kept at the screen edges |
| `--kz-section-intro-pad-top` | `clamp(72px, 9vw, 140px)` | above, like the top of a section… |
| `--kz-section-intro-pad-bottom` | `clamp(40px, 5vw, 72px)` | …and the space left to what it heads |
| `--kz-section-intro-gap` | `clamp(32px, 6vw, 96px)` | split: between the title and the intro |
| `--kz-section-intro-title-span` | `7fr` | split: the title's share of the width… |
| `--kz-section-intro-aside-span` | `5fr` | …and the intro's |
| `--kz-section-intro-size` | `clamp(36px, 5vw, 68px)` | the title |
| `--kz-section-intro-measure` | `480px` | the measure of the intro |
| `--kz-section-intro-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-section-intro-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-layout` (e.g. `stack`, `center`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-section-intro {
    --kz-section-intro-ink: #f2f2f0;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
