# Media Text

[![Media Text, live on kodza.dev](https://kodza.dev/anim/media-text/og.jpg)](https://kodza.dev/components/media-text/)

A content section with a picture on one side and the words on the other. Rows alternate sides on their own, a picture beside a long text stays put as you scroll, and each row enters as it comes into view.

**[Live demo](https://kodza.dev/components/media-text/)** · Content sections · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-media-text.html`](kodza-media-text.html) | 3.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-media-text.css`](kodza-media-text.css) | 34.7 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-media-text.js`](kodza-media-text.js) | 10.3 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-media-text.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-media-text.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/media-text/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Media Text to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-media-text` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-media-text-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-media-text-dim` | `color-mix(in srgb, var(--kz-media-text-ink) 66%, transparent)` |  |
| `--kz-media-text-faint` | `color-mix(in srgb, var(--kz-media-text-ink) 60%, transparent)` |  |
| `--kz-media-text-line` | `color-mix(in srgb, var(--kz-media-text-ink) 12%, transparent)` |  |
| `--kz-media-text-cta` | `var(--kz-color-accent, var(--kz-media-text-ink))` |  |
| `--kz-media-text-cta-fg` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-media-text-bg` | `transparent` |  |
| `--kz-media-text-width` | `var(--kz-page-width, 1440px)` | the content column |
| `--kz-media-text-gutter` | `var(--kz-page-gutter, clamp(16px, 4vw, 40px))` | the space kept at the screen edges |
| `--kz-media-text-pad-y` | `clamp(72px, 9vw, 140px)` |  |
| `--kz-media-text-gap` | `clamp(32px, 6vw, 96px)` | between the picture and the words |
| `--kz-media-text-row-gap` | `clamp(72px, 10vw, 152px)` | between two rows |
| `--kz-media-text-media-span` | `5fr` | the picture's share of the row… |
| `--kz-media-text-copy-span` | `6fr` | …and the words' |
| `--kz-media-text-copy-width` | `520px` | the measure of the text |
| `--kz-media-text-ratio` | `4 / 5` |  |
| `--kz-media-text-ratio-narrow` | `4 / 3` | one column, on a phone |
| `--kz-media-text-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-media-text-sticky-top` | `32px` | where a picture stops next to a long text: add your header's height |
| `--kz-media-text-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-media-text-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-media-text-bleed` | `calc((100cqi - min(100cqi - 2 * var(--kz-media-text-gutter), var(--kz-media-text-width))) / 2)` |  |

- Modifiers: `.kodza-media-text--bleed`, `.kodza-media-text--reverse`
- Attributes: `data-mobile-order` (e.g. `text-first`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-media-text {
    --kz-media-text-ink: #f2f2f0;
    --kz-media-text-cta-fg: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
