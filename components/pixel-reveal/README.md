# Pixel Reveal

[![Pixel Reveal, live on kodza.dev](https://kodza.dev/anim/pixel-reveal/og.jpg)](https://kodza.dev/components/pixel-reveal/)

Lazy images come into focus: a flat placeholder holds their place, then the decoded image is drawn on a canvas in four pixel steps before turning sharp. Cached images show at once.

**[Live demo](https://kodza.dev/components/pixel-reveal/)** · Image effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-pixel-reveal.html`](kodza-pixel-reveal.html) | 0.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-pixel-reveal.css`](kodza-pixel-reveal.css) | 6.0 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-pixel-reveal.js`](kodza-pixel-reveal.js) | 15.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-pixel-reveal.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-pixel-reveal.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/pixel-reveal/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Pixel Reveal to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-pixel-reveal` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-pixel-reveal-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-pixel-reveal-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-pixel-reveal-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |

- Attributes: `data-target`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-pixel-reveal {
    --kz-pixel-reveal-placeholder: rgba(255, 255, 255, 0.08);
    --kz-pixel-reveal-muted: rgba(242, 242, 240, 0.7);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
