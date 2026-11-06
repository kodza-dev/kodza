# Logo Collapse

[![Logo Collapse, live on kodza.dev](https://kodza.dev/anim/logo-collapse/og.jpg)](https://kodza.dev/components/logo-collapse/)

The logo fills the screen while the page loads, then flies into the header as the screen rolls up. Its line tracks the real load. Any click or key skips it; data-once plays it once per visit.

**[Live demo](https://kodza.dev/components/logo-collapse/)** · Preloaders & transitions · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-logo-collapse.html`](kodza-logo-collapse.html) | 0.3 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-logo-collapse.css`](kodza-logo-collapse.css) | 4.1 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-logo-collapse.js`](kodza-logo-collapse.js) | 15.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-logo-collapse.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-logo-collapse.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/logo-collapse/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Logo Collapse to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-logo-collapse]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-logo-collapse-bg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-logo-collapse-fg` | `var(--kz-color-page, #f2f2f0)` |  |
| `--kz-logo-collapse-size` | `clamp(44px, 8.5vw, 120px)` | the logo while it fills the screen |
| `--kz-logo-collapse-duration` | `1s` | the flight |
| `--kz-logo-collapse-ease` | `cubic-bezier(0.76, 0, 0.24, 1)` |  |
| `--kz-logo-collapse-hold` | `0.45s` | the logo alone, once the page is loaded |
| `--kz-logo-collapse-enter-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-enter`, `data-exit`, `data-kodza-logo-collapse`, `data-once`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-logo-collapse {
    --kz-logo-collapse-bg: #f2f2f0;
    --kz-logo-collapse-fg: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
