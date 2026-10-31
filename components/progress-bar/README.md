# Progress

[![Progress, live on kodza.dev](https://kodza.dev/anim/progress-bar/og.jpg)](https://kodza.dev/components/progress-bar/)

A bar or a ring driven by data-value: the percentage rolls like an odometer, a segment slides while nobody knows, and at 100 a tick draws itself.

**[Live demo](https://kodza.dev/components/progress-bar/)** · Feedback & loading · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-progress-bar.html`](kodza-progress-bar.html) | 1.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-progress-bar.css`](kodza-progress-bar.css) | 9.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-progress-bar.js`](kodza-progress-bar.js) | 7.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-progress-bar.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-progress-bar.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/progress-bar/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Show my upload progress with a Kodza Progress bar.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-progress` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-progress-fg` | `#0a0a0a` |  |
| `--kz-progress-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-progress-track` | `rgba(10, 10, 10, 0.09)` |  |
| `--kz-progress-fill` | `#0a0a0a` |  |
| `--kz-progress-height` | `6px` |  |
| `--kz-progress-dial` | `104px` |  |
| `--kz-progress-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-progress--ring`
- Attributes: `data-done` (e.g. `hero.webp is live`, `All green`), `data-value` (e.g. `0`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-progress {
    --kz-progress-fg: #f2f2f0;
    --kz-progress-muted: rgba(242, 242, 240, 0.62);
    --kz-progress-track: rgba(255, 255, 255, 0.12);
    --kz-progress-fill: #f2f2f0;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
