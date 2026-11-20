# Pull Quote

[![Pull Quote, live on kodza.dev](https://kodza.dev/anim/pull-quote/og.jpg)](https://kodza.dev/components/pull-quote/)

The line of an article worth stopping on: a large mark hung in the margin, a 1px rule, the source in mono. On screen, the rule draws, then each line rises from its mask. Works on .wp-block-pullquote.

**[Live demo](https://kodza.dev/components/pull-quote/)** · Text effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-pull-quote.html`](kodza-pull-quote.html) | 0.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-pull-quote.css`](kodza-pull-quote.css) | 14.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-pull-quote.js`](kodza-pull-quote.js) | 10.0 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-pull-quote.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-pull-quote.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/pull-quote/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Pull Quote to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-pull-quote` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-pull-quote-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-pull-quote-muted` | `color-mix(in srgb, var(--kz-pull-quote-fg) 62%, transparent)` |  |
| `--kz-pull-quote-rule` | `color-mix(in srgb, var(--kz-pull-quote-fg) 16%, transparent)` |  |
| `--kz-pull-quote-mark` | `var(--kz-color-accent, var(--kz-pull-quote-fg))` |  |
| `--kz-pull-quote-font` | `var(--kz-font-display, inherit)` |  |
| `--kz-pull-quote-weight` | `var(--kz-font-display-weight, 500)` |  |
| `--kz-pull-quote-case` | `var(--kz-font-display-case, none)` |  |
| `--kz-pull-quote-tracking` | `var(--kz-font-display-tracking, -0.03em)` |  |
| `--kz-pull-quote-size` | `calc(clamp(26px, 3.4vw, 40px) * var(--kz-font-display-scale, 1))` |  |
| `--kz-pull-quote-leading` | `1.2` |  |
| `--kz-pull-quote-gutter` | `1.05em` |  |
| `--kz-pull-quote-overhang` | `48px` |  |
| `--kz-pull-quote-space` | `56px` |  |
| `--kz-pull-quote-source-font` | `var(--kz-font-label, var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace))` |  |
| `--kz-pull-quote-source-size` | `var(--kz-font-label-size, 13px)` |  |
| `--kz-pull-quote-source-weight` | `var(--kz-font-label-weight, 400)` |  |
| `--kz-pull-quote-source-tracking` | `var(--kz-font-label-tracking, 0)` |  |
| `--kz-pull-quote-source-case` | `var(--kz-font-label-case, none)` |  |
| `--kz-pull-quote-source-leading` | `var(--kz-font-label-leading, 1.45)` |  |
| `--kz-pull-quote-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-pull-quote-draw` | `cubic-bezier(0.65, 0, 0.35, 1)` |  |

- Attributes: `data-align` (e.g. `center`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-pull-quote {
    --kz-pull-quote-fg: #f2f2f0;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
