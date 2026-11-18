# Filter Chips

[![Filter Chips, live on kodza.dev](https://kodza.dev/anim/filter-chips/og.jpg)](https://kodza.dev/components/filter-chips/)

Filter chips over a list you already have: real checkboxes in a GET form the shop already reads, chips that fill with ink, tags that lift into the head and counts that roll.

**[Live demo](https://kodza.dev/components/filter-chips/)** · E-commerce · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-filter-chips.html`](kodza-filter-chips.html) | 2.4 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-filter-chips.css`](kodza-filter-chips.css) | 25.1 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-filter-chips.js`](kodza-filter-chips.js) | 25.3 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-filter-chips.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-filter-chips.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/filter-chips/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Filter Chips to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-filter-chips` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-filter-chips-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-filter-chips-bg` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-filter-chips-muted` | `color-mix(in srgb, var(--kz-filter-chips-fg) 62%, transparent)` |  |
| `--kz-filter-chips-border` | `color-mix(in srgb, var(--kz-filter-chips-fg) 12%, transparent)` |  |
| `--kz-filter-chips-border-hover` | `color-mix(in srgb, var(--kz-filter-chips-fg) 30%, transparent)` |  |
| `--kz-filter-chips-ink` | `var(--kz-color-accent, var(--kz-filter-chips-fg))` |  |
| `--kz-filter-chips-on-ink` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-filter-chips-height` | `40px` | one chip |
| `--kz-filter-chips-tag-height` | `32px` | one tag in the head |
| `--kz-filter-chips-gap` | `6px` | between chips, and between tags |
| `--kz-filter-chips-group-gap` | `24px` | between two groups, a thin rule in the middle |
| `--kz-filter-chips-fade` | `32px` | the fade on a scrolling edge |

- Attributes: `data-filter` (e.g. `type`, `colour`), `data-join`, `data-target` (e.g. `.demo-list`), `data-url`
- Events: `kodza:filter`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-filter-chips {
    --kz-filter-chips-fg: #f2f2f0;
    --kz-filter-chips-bg: #161616;
    --kz-filter-chips-muted: rgba(242, 242, 240, 0.62);
    --kz-filter-chips-border: rgba(255, 255, 255, 0.14);
    --kz-filter-chips-border-hover: rgba(255, 255, 255, 0.32);
    --kz-filter-chips-ink: #f2f2f0;
    --kz-filter-chips-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a chip | `Space` | Ticks or unticks it, the list follows at once |
| On a tag | `Enter` / `Space` / `Backspace` / `Delete` | Drops that filter, focus on the next tag |
| On Clear all | `Enter` / `Space` | Drops every filter, focus on the first chip |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
