# Skeleton

[![Skeleton, live on kodza.dev](https://kodza.dev/anim/skeleton-loader/og.jpg)](https://kodza.dev/components/skeleton-loader/)

Bones drawn from the content itself, one shine across them all. When it loads, a soft edge sweeps down and turns each bone into its line; late images keep theirs.

**[Live demo](https://kodza.dev/components/skeleton-loader/)** · Feedback & loading · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-skeleton-loader.html`](kodza-skeleton-loader.html) | 1.8 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-skeleton-loader.css`](kodza-skeleton-loader.css) | 14.5 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-skeleton-loader.js`](kodza-skeleton-loader.js) | 10.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-skeleton-loader.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-skeleton-loader.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/skeleton-loader/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Show a Kodza Skeleton while my posts load.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-skeleton` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-skel-bg` | `#ffffff` |  |
| `--kz-skel-fg` | `#0a0a0a` |  |
| `--kz-skel-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-skel-border` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-skel-bone` | `#ededeb` |  |
| `--kz-skel-shine` | `rgba(255, 255, 255, 0.85)` |  |
| `--kz-skel-speed` | `1.6s` |  |
| `--kz-skel-radius` | `16px` |  |
| `--kz-skel-pad` | `28px` |  |

- Modifiers: `.kodza-skeleton--card`, `.kodza-skeleton--list`
- Attributes: `data-bone` (e.g. `block`), `data-loading`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-skeleton {
    --kz-skel-bg: #161616;
    --kz-skel-fg: #f2f2f0;
    --kz-skel-muted: rgba(242, 242, 240, 0.62);
    --kz-skel-border: rgba(255, 255, 255, 0.12);
    --kz-skel-bone: #232323;
    --kz-skel-shine: rgba(255, 255, 255, 0.07);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
