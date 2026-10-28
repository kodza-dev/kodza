# Scroll Reveal

[![Scroll Reveal, live on kodza.dev](https://kodza.dev/anim/fade-in-scroll/og.jpg)](https://kodza.dev/components/fade-in-scroll/)

Blocks make their entrance as they scroll in: a fade, lines rising from a mask, or an image unveiled by clip-path. Blocks that arrive together take turns.

**[Live demo](https://kodza.dev/components/fade-in-scroll/)** · Scroll · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-fade-in-scroll.html`](kodza-fade-in-scroll.html) | 1.3 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-fade-in-scroll.css`](kodza-fade-in-scroll.css) | 6.5 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-fade-in-scroll.js`](kodza-fade-in-scroll.js) | 7.5 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-fade-in-scroll.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-fade-in-scroll.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/fade-in-scroll/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add Kodza Scroll Reveal to the sections of my landing page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-reveal` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-reveal-distance` | `28px` |  |
| `--kz-reveal-duration` | `0.9s` |  |
| `--kz-reveal-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-reveal-stagger` | `90ms` |  |
| `--kz-reveal-radius` | `16px` |  |

- Modifiers: `.kodza-reveal--clip`, `.kodza-reveal--mask`, `.kodza-reveal--repeat`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-reveal-sample__label,
  .kodza-reveal-sample figcaption {
    color: rgba(242, 242, 240, 0.62);
  }

  .kodza-reveal-sample__text {
    color: rgba(242, 242, 240, 0.62);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
