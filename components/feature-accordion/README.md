# Feature Accordion

[![Feature Accordion, live on kodza.dev](https://kodza.dev/anim/feature-accordion/og.jpg)](https://kodza.dev/components/feature-accordion/)

A product tour: the features in a list beside one screen, each visual opening from the top over the last. It moves on by itself and holds on hover or a pick; --tabs puts the features above one wide visual.

**[Live demo](https://kodza.dev/components/feature-accordion/)** · Feature sections · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-feature-accordion.html`](kodza-feature-accordion.html) | 11.4 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-feature-accordion.css`](kodza-feature-accordion.css) | 44.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-feature-accordion.js`](kodza-feature-accordion.js) | 31.0 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-feature-accordion.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-feature-accordion.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/feature-accordion/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Feature Accordion to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-feature-accordion` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-feature-accordion-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-feature-accordion-paper` | `var(--kz-color-paper, #ffffff)` | the card, the tabs' track |
| `--kz-feature-accordion-text` | `color-mix(in srgb, var(--kz-feature-accordion-ink) 84%, transparent)` |  |
| `--kz-feature-accordion-dim` | `color-mix(in srgb, var(--kz-feature-accordion-ink) 66%, transparent)` |  |
| `--kz-feature-accordion-faint` | `color-mix(in srgb, var(--kz-feature-accordion-ink) 60%, transparent)` |  |
| `--kz-feature-accordion-line` | `color-mix(in srgb, var(--kz-feature-accordion-ink) 12%, transparent)` | the hairlines |
| `--kz-feature-accordion-soft` | `color-mix(in srgb, var(--kz-feature-accordion-ink) 6%, transparent)` | behind a picture still loading |
| `--kz-feature-accordion-bg` | `transparent` |  |
| `--kz-feature-accordion-width` | `var(--kz-page-width, 1440px)` | the content column: the page's, set by the site |
| `--kz-feature-accordion-gutter` | `var(--kz-page-gutter, clamp(16px, 4vw, 40px))` | the space kept at the screen edges |
| `--kz-feature-accordion-pad-top` | `clamp(56px, 7vw, 112px)` |  |
| `--kz-feature-accordion-pad-bottom` | `clamp(56px, 7vw, 112px)` |  |
| `--kz-feature-accordion-size` | `clamp(28px, 3.4vw, 44px)` | the title |
| `--kz-feature-accordion-gap` | `clamp(32px, 5cqi, 80px)` | between the list and the visual |
| `--kz-feature-accordion-ratio` | `4 / 3` | the visual, beside the list |
| `--kz-feature-accordion-wide` | `2 / 1` | the visual, under the tabs |
| `--kz-feature-accordion-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-feature-accordion-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-feature-accordion-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-feature-accordion--tabs`
- Attributes: `data-interval` (e.g. `6000`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-feature-accordion {
    --kz-feature-accordion-ink: #f2f2f0;
    --kz-feature-accordion-paper: #161616;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a feature | `ArrowDown` / `ArrowUp` | Moves to the next or previous feature, round and round |
|  | `Home` / `End` | Moves to the first or last feature |
|  | `Enter` / `Space` | Opens the feature, and stops the tour there |
| On a tab | `ArrowRight` / `ArrowLeft` | Shows the next or previous tab, and stops the tour there |
|  | `Home` / `End` | Shows the first or last tab |
| On the pause button | `Enter` / `Space` | Stops the tour, or starts it again |

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
