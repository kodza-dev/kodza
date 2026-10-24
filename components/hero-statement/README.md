# Hero Statement

[![Hero Statement, live on kodza.dev](https://kodza.dev/anim/hero-statement/og.jpg)](https://kodza.dev/components/hero-statement/)

A studio statement set very large over a mono line with the city, a live local time and the booking window. The words rise out of their masks one after the other on load.

**[Live demo](https://kodza.dev/components/hero-statement/)** · Hero · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-hero-statement.html`](kodza-hero-statement.html) | 1.0 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-hero-statement.css`](kodza-hero-statement.css) | 13.6 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-hero-statement.js`](kodza-hero-statement.js) | 6.6 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-hero-statement.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-hero-statement.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/hero-statement/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Hero Statement to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-hero-statement` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-hero-statement-ink` | `#0a0a0a` |  |
| `--kz-hero-statement-muted` | `rgba(10, 10, 10, 0.5)` |  |
| `--kz-hero-statement-dim` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-hero-statement-rule` | `rgba(10, 10, 10, 0.14)` |  |
| `--kz-hero-statement-bg` | `transparent` |  |
| `--kz-hero-statement-width` | `1280px` |  |
| `--kz-hero-statement-top` | `clamp(96px, 13vw, 200px)` |  |
| `--kz-hero-statement-bottom` | `clamp(28px, 3.5vw, 44px)` |  |
| `--kz-hero-statement-gutter` | `clamp(16px, 4vw, 40px)` |  |
| `--kz-hero-statement-mono` | `"Geist Mono", ui-monospace, "SF Mono", Menlo, monospace` |  |
| `--kz-hero-statement-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-hero-statement-glide` | `cubic-bezier(0.6, 0, 0.1, 1)` |  |
| `--kz-hero-statement-soft-ease` | `cubic-bezier(0.25, 1, 0.5, 1)` |  |

- Attributes: `data-timezone` (e.g. `Europe/Paris`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-hero-statement {
    --kz-hero-statement-ink: #f2f2f0;
    --kz-hero-statement-muted: rgba(242, 242, 240, 0.5);
    --kz-hero-statement-dim: rgba(242, 242, 240, 0.64);
    --kz-hero-statement-rule: rgba(242, 242, 240, 0.16);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
