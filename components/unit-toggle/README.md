# Unit Toggle

[![Unit Toggle, live on kodza.dev](https://kodza.dev/anim/unit-toggle/og.jpg)](https://kodza.dev/components/unit-toggle/)

Marks each measure of a text once, in either system, and shows them all in metric or imperial: the digits roll, each value eases to its width, and the choice follows the visitor.

**[Live demo](https://kodza.dev/components/unit-toggle/)** · Text effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-unit-toggle.html`](kodza-unit-toggle.html) | 0.3 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-unit-toggle.css`](kodza-unit-toggle.css) | 8.1 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-unit-toggle.js`](kodza-unit-toggle.js) | 20.6 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-unit-toggle.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-unit-toggle.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/unit-toggle/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Unit Toggle to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-unit-toggle` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-unit-toggle-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-unit-toggle-muted` | `color-mix(in srgb, var(--kz-unit-toggle-fg) 62%, transparent)` |  |
| `--kz-unit-toggle-bg` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-unit-toggle-border` | `color-mix(in srgb, var(--kz-unit-toggle-fg) 12%, transparent)` |  |
| `--kz-unit-toggle-ink` | `var(--kz-color-accent, var(--kz-unit-toggle-fg))` |  |
| `--kz-unit-toggle-on-ink` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-unit-toggle-height` | `32px` | the whole switch; the pill is 2 × --kz-unit-toggle-pad shorter |
| `--kz-unit-toggle-pad` | `3px` |  |
| `--kz-unit-toggle-space` | `12px` | on each side of a label |
| `--kz-unit-toggle-font` | `var(--kz-font-label, var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace))` |  |
| `--kz-unit-toggle-size` | `var(--kz-font-label-size, 12px)` |  |
| `--kz-unit-toggle-weight` | `var(--kz-font-label-weight, 500)` |  |
| `--kz-unit-toggle-tracking` | `var(--kz-font-label-tracking, 0)` |  |

- Attributes: `data-decimals`, `data-guess`, `data-system` (e.g. `metric`, `imperial`), `data-target`, `data-to`, `data-unit`
- Events: `kodza:units`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-unit-toggle {
    --kz-unit-toggle-fg: #f2f2f0;
    --kz-unit-toggle-bg: #0a0a0a;
    --kz-unit-toggle-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a system | `Enter` / `Space` | Shows every value of the page in that system |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
