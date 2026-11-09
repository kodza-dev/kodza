# Feature Compare

[![Feature Compare, live on kodza.dev](https://kodza.dev/anim/feature-compare/og.jpg)](https://kodza.dev/components/feature-compare/)

Without and with on one grid, each line level with its answer, yours on a card of ink. A phone switch rolls the lines over. --table: columns, yours in an ink pill.

**[Live demo](https://kodza.dev/components/feature-compare/)** · Feature sections · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-feature-compare.html`](kodza-feature-compare.html) | 6.0 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-feature-compare.css`](kodza-feature-compare.css) | 52.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-feature-compare.js`](kodza-feature-compare.js) | 23.4 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-feature-compare.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-feature-compare.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/feature-compare/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Feature Compare to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-feature-compare` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-feature-compare-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-feature-compare-dim` | `color-mix(in srgb, var(--kz-feature-compare-ink) 66%, transparent)` |  |
| `--kz-feature-compare-faint` | `color-mix(in srgb, var(--kz-feature-compare-ink) 60%, transparent)` |  |
| `--kz-feature-compare-line` | `color-mix(in srgb, var(--kz-feature-compare-ink) 12%, transparent)` | the hairlines |
| `--kz-feature-compare-card` | `var(--kz-color-paper, #fff)` | the "without" card, the switch |
| `--kz-feature-compare-card-line` | `color-mix(in srgb, var(--kz-feature-compare-ink) 10%, transparent)` | its outline |
| `--kz-feature-compare-accent` | `var(--kz-color-accent, var(--kz-feature-compare-ink))` | the "with" card, your column |
| `--kz-feature-compare-on-accent` | `var(--kz-color-on-accent, var(--kz-feature-compare-card))` | the text on it |
| `--kz-feature-compare-bg` | `transparent` |  |
| `--kz-feature-compare-width` | `var(--kz-page-width, 1440px)` | the content column: the page's, set by the site |
| `--kz-feature-compare-gutter` | `var(--kz-page-gutter, clamp(16px, 4vw, 40px))` | the space kept at the screen edges |
| `--kz-feature-compare-pad-top` | `clamp(56px, 7vw, 112px)` |  |
| `--kz-feature-compare-pad-bottom` | `clamp(56px, 7vw, 112px)` |  |
| `--kz-feature-compare-size` | `clamp(28px, 3.4vw, 44px)` | the title |
| `--kz-feature-compare-topic` | `20%` | the column of the topics, left of the cards |
| `--kz-feature-compare-gap` | `16px` | between the two cards |
| `--kz-feature-compare-pad-x` | `28px` | inside a card |
| `--kz-feature-compare-pad-y` | `20px` |  |
| `--kz-feature-compare-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-feature-compare-label` | `34%` | --table: the column of the row names |
| `--kz-feature-compare-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-feature-compare-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-feature-compare--table`
- Attributes: `data-mark` (e.g. `yes`, `no`, `partly`), `data-side`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-feature-compare {
    --kz-feature-compare-ink: #f2f2f0;
    --kz-feature-compare-card: #161616;
    --kz-feature-compare-card-line: rgba(255, 255, 255, 0.12);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the switch (narrow screens) | `ArrowRight` / `ArrowDown` | Shows the other side |
|  | `ArrowLeft` / `ArrowUp` | Shows the other side |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
