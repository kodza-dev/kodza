# Revision Diff

[![Revision Diff, live on kodza.dev](https://kodza.dev/anim/revision-diff/og.jpg)](https://kodza.dev/components/revision-diff/)

Compares a text with its previous version word by word: removed words come back struck through, added words underlined, a margin mark on each change. Arrows, N and P step through.

**[Live demo](https://kodza.dev/components/revision-diff/)** · Text effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-revision-diff.html`](kodza-revision-diff.html) | 0.9 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-revision-diff.css`](kodza-revision-diff.css) | 25.5 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-revision-diff.js`](kodza-revision-diff.js) | 27.1 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-revision-diff.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-revision-diff.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/revision-diff/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Revision Diff to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-revision-diff]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-revision-diff-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-revision-diff-paper` | `var(--kz-color-paper, #fff)` |  |
| `--kz-revision-diff-accent` | `var(--kz-color-accent, var(--kz-revision-diff-fg))` |  |
| `--kz-revision-diff-on-accent` | `var(--kz-color-on-accent, var(--kz-revision-diff-paper))` |  |
| `--kz-revision-diff-calm` | `color-mix(in srgb, var(--kz-revision-diff-fg) 74%, transparent)` |  |
| `--kz-revision-diff-gone` | `color-mix(in srgb, var(--kz-revision-diff-fg) 56%, transparent)` |  |
| `--kz-revision-diff-dim` | `color-mix(in srgb, var(--kz-revision-diff-fg) 62%, transparent)` |  |
| `--kz-revision-diff-border` | `color-mix(in srgb, var(--kz-revision-diff-fg) 10%, transparent)` |  |
| `--kz-revision-diff-tint` | `color-mix(in srgb, var(--kz-revision-diff-fg) 8%, transparent)` |  |
| `--kz-revision-diff-tick` | `color-mix(in srgb, var(--kz-revision-diff-fg) 18%, transparent)` |  |
| `--kz-revision-diff-top` | `16px` |  |
| `--kz-revision-diff-gutter` | `22px` |  |
| `--kz-revision-diff-text-size` | `17px` |  |
| `--kz-revision-diff-leading` | `1.6` |  |
| `--kz-revision-diff-heading-size` | `20px` |  |
| `--kz-revision-diff-font` | `var(--kz-font-label, inherit)` |  |
| `--kz-revision-diff-size` | `var(--kz-font-label-size, 14px)` |  |
| `--kz-revision-diff-weight` | `var(--kz-font-label-weight, 500)` |  |
| `--kz-revision-diff-tracking` | `var(--kz-font-label-tracking, 0)` |  |
| `--kz-revision-diff-case` | `var(--kz-font-label-case, none)` |  |
| `--kz-revision-diff-mono` | `var(--kz-font-mono, ui-monospace, "SFMono-Regular", Menlo, monospace)` |  |

- Attributes: `data-change`, `data-date` (e.g. `2026-03-12`), `data-kodza-revision-diff`, `data-locale`, `data-open`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-revision-diff {
    --kz-revision-diff-fg: #f2f2f0;
    --kz-revision-diff-paper: #161616;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the component | `N` | Next change; shows the changes first if hidden |
|  | `P` | Previous change; shows the changes first if hidden |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
