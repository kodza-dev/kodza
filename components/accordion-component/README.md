# Accordion

[![Accordion, live on kodza.dev](https://kodza.dev/anim/accordion-component/og.jpg)](https://kodza.dev/components/accordion-component/)

Questions that open on their answer, on a native <details>: the panel opens at its real height, the answer rises, the plus turns into a minus. One open at a time if you like.

**[Live demo](https://kodza.dev/components/accordion-component/)** · Data display · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-accordion-component.html`](kodza-accordion-component.html) | 2.0 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-accordion-component.css`](kodza-accordion-component.css) | 8.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-accordion-component.js`](kodza-accordion-component.js) | 6.3 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-accordion-component.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-accordion-component.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/accordion-component/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Turn my FAQ into a Kodza Accordion, one answer open at a time.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-accordion` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-accordion-fg` | `#0a0a0a` |  |
| `--kz-accordion-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-accordion-line` | `rgba(10, 10, 10, 0.12)` |  |
| `--kz-accordion-soft` | `rgba(10, 10, 10, 0.05)` |  |
| `--kz-accordion-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-single`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-accordion {
    --kz-accordion-fg: #f2f2f0;
    --kz-accordion-muted: rgba(242, 242, 240, 0.62);
    --kz-accordion-line: rgba(255, 255, 255, 0.14);
    --kz-accordion-soft: rgba(255, 255, 255, 0.08);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
