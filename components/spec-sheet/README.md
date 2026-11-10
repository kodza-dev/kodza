# Spec Sheet

[![Spec Sheet, live on kodza.dev](https://kodza.dev/anim/spec-sheet/og.jpg)](https://kodza.dev/components/spec-sheet/)

A product or project section: its name very big, a pinned spec sheet beside its pictures, and tabs that wipe the name across with the pictures while every value rolls to the next model.

**[Live demo](https://kodza.dev/components/spec-sheet/)** · Portfolio & projects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-spec-sheet.html`](kodza-spec-sheet.html) | 9.3 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-spec-sheet.css`](kodza-spec-sheet.css) | 28.1 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-spec-sheet.js`](kodza-spec-sheet.js) | 22.9 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-spec-sheet.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-spec-sheet.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/spec-sheet/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Spec Sheet to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-spec-sheet]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-spec-sheet-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-spec-sheet-muted` | `color-mix(in srgb, var(--kz-spec-sheet-ink) 62%, transparent)` | terms, captions, the text |
| `--kz-spec-sheet-line` | `color-mix(in srgb, var(--kz-spec-sheet-ink) 12%, transparent)` | hairlines |
| `--kz-spec-sheet-soft` | `color-mix(in srgb, var(--kz-spec-sheet-ink) 6%, transparent)` | behind a picture while it loads |
| `--kz-spec-sheet-track` | `var(--kz-color-paper, #ffffff)` | the row of model tabs |
| `--kz-spec-sheet-pill` | `var(--kz-color-accent, var(--kz-spec-sheet-ink))` | the pill of the model shown |
| `--kz-spec-sheet-on-pill` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` | its text |
| `--kz-spec-sheet-width` | `var(--kz-page-width, 1440px)` | the content column: the page's, set by the site |
| `--kz-spec-sheet-gutter` | `var(--kz-page-gutter, clamp(16px, 4vw, 40px))` | the space kept at the screen edges |
| `--kz-spec-sheet-space` | `clamp(56px, 7vw, 112px)` | above and below the section |
| `--kz-spec-sheet-gap` | `clamp(32px, 5vw, 96px)` | between the sheet and the pictures |
| `--kz-spec-sheet-top` | `0px` | height of a fixed header: the sheet pins under it |
| `--kz-spec-sheet-ratio` | `4 / 3` | every picture's frame |
| `--kz-spec-sheet-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-spec-sheet-duration` | `0.5s` | the pill gliding from tab to tab |
| `--kz-spec-sheet-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-kodza-spec-sheet`, `data-label`, `data-text-models` (e.g. `Projects`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-spec-sheet {
    --kz-spec-sheet-ink: #f2f2f0;
    --kz-spec-sheet-muted: rgba(242, 242, 240, 0.62);
    --kz-spec-sheet-line: rgba(255, 255, 255, 0.14);
    --kz-spec-sheet-soft: rgba(255, 255, 255, 0.08);
    --kz-spec-sheet-track: rgba(255, 255, 255, 0.06);
    --kz-spec-sheet-pill: #f2f2f0;
    --kz-spec-sheet-on-pill: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a model tab | `ArrowRight` / `ArrowLeft` | Shows the next or previous model, round and round |
|  | `Home` / `End` | Shows the first or last model |
|  | `Tab` | Skips the other tabs, on to the case study link |

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
