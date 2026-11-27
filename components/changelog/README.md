# Changelog

[![Changelog, live on kodza.dev](https://kodza.dev/anim/changelog/og.jpg)](https://kodza.dev/components/changelog/)

Release notes from a plain list: filter by type with a sliding pill, a line at the last release the reader saw, and a version link that copies itself. Without the script, the list simply shows.

**[Live demo](https://kodza.dev/components/changelog/)** · Data display · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-changelog.html`](kodza-changelog.html) | 3.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-changelog.css`](kodza-changelog.css) | 32.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-changelog.js`](kodza-changelog.js) | 24.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-changelog.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-changelog.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/changelog/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Changelog to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-changelog` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-changelog-bg` | `var(--kz-color-paper, #ffffff)` | the filter bar |
| `--kz-changelog-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-changelog-muted` | `color-mix(in srgb, var(--kz-changelog-fg) 62%, transparent)` |  |
| `--kz-changelog-border` | `color-mix(in srgb, var(--kz-changelog-fg) 12%, transparent)` |  |
| `--kz-changelog-soft` | `color-mix(in srgb, var(--kz-changelog-fg) 7%, transparent)` | the Fixed tag |
| `--kz-changelog-outline` | `color-mix(in srgb, var(--kz-changelog-fg) 28%, transparent)` | the Improved tag |
| `--kz-changelog-ink` | `var(--kz-color-accent, var(--kz-changelog-fg))` | the New tag, the pill, the last-visit line |
| `--kz-changelog-on-ink` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-changelog-side` | `200px` | the column of versions |
| `--kz-changelog-gap` | `40px` | between the versions and the notes |
| `--kz-changelog-space` | `40px` | above and below each release |
| `--kz-changelog-top` | `24px` | where the version stops while you scroll: under a sticky header, its height |
| `--kz-changelog-tag` | `84px` | the column of tags |
| `--kz-changelog-mono` | `var(--kz-font-mono, ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-changelog-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-anchor`, `data-filter`, `data-key`, `data-seen`, `data-type` (e.g. `new`, `improved`, `fixed`)
- Events: `kodza:filter`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-changelog {
    --kz-changelog-bg: #161616;
    --kz-changelog-fg: #f2f2f0;
    --kz-changelog-muted: rgba(242, 242, 240, 0.62);
    --kz-changelog-border: rgba(255, 255, 255, 0.12);
    --kz-changelog-soft: rgba(255, 255, 255, 0.08);
    --kz-changelog-outline: rgba(255, 255, 255, 0.3);
    --kz-changelog-ink: #f2f2f0;
    --kz-changelog-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a filter pill | `Enter` / `Space` | Shows only the notes of its type, or all of them |
| On a version | `Enter` | Puts the release's address in the bar and copies it |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
