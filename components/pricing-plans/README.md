# Pricing Plans

[![Pricing Plans, live on kodza.dev](https://kodza.dev/anim/pricing-plans/og.jpg)](https://kodza.dev/components/pricing-plans/)

Three plans in one block, the featured one inked and lifted out. Switch to yearly and only the digits that change roll to their new value.

**[Live demo](https://kodza.dev/components/pricing-plans/)** · Cards · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-pricing-plans.html`](kodza-pricing-plans.html) | 2.8 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-pricing-plans.css`](kodza-pricing-plans.css) | 18.8 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-pricing-plans.js`](kodza-pricing-plans.js) | 7.4 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-pricing-plans.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-pricing-plans.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/pricing-plans/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Build my pricing section with Kodza Pricing Plans.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-pricing` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-price-bg` | `#ffffff` |  |
| `--kz-price-fg` | `#0a0a0a` |  |
| `--kz-price-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-price-border` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-price-soft` | `#f2f2f0` |  |
| `--kz-price-featured-bg` | `#0a0a0a` |  |
| `--kz-price-featured-fg` | `#ffffff` |  |
| `--kz-price-featured-muted` | `rgba(255, 255, 255, 0.62)` |  |
| `--kz-price-featured-border` | `rgba(255, 255, 255, 0.14)` |  |
| `--kz-price-radius` | `16px` |  |
| `--kz-price-pad` | `28px` |  |
| `--kz-price-lift` | `12px` |  |
| `--kz-price-duration` | `0.6s` |  |
| `--kz-price-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-price-mono` | `ui-monospace, "SF Mono", Menlo, monospace` |  |

- Attributes: `data-monthly` (e.g. `0`, `no card needed`, `12`, `billed monthly`, `39`), `data-period` (e.g. `monthly`, `yearly`), `data-symbol`, `data-yearly` (e.g. `0`, `no card needed`, `10`, `€120 billed yearly`, `32`, `€384 billed yearly`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-pricing {
    --kz-price-bg: #161616;
    --kz-price-fg: #f2f2f0;
    --kz-price-muted: rgba(242, 242, 240, 0.62);
    --kz-price-border: rgba(255, 255, 255, 0.12);
    --kz-price-soft: rgba(255, 255, 255, 0.08);
    --kz-price-featured-bg: #ffffff;
    --kz-price-featured-fg: #0a0a0a;
    --kz-price-featured-muted: rgba(10, 10, 10, 0.62);
    --kz-price-featured-border: rgba(10, 10, 10, 0.1);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
