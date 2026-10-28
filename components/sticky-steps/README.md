# Sticky Steps

[![Sticky Steps, live on kodza.dev](https://kodza.dev/anim/sticky-steps/og.jpg)](https://kodza.dev/components/sticky-steps/)

A picture pinned on one side, steps scrolling on the other: each step draws its picture over the last like a curtain, and the counter rolls along.

**[Live demo](https://kodza.dev/components/sticky-steps/)** · Scroll · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-sticky-steps.html`](kodza-sticky-steps.html) | 1.8 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-sticky-steps.css`](kodza-sticky-steps.css) | 12.7 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-sticky-steps.js`](kodza-sticky-steps.js) | 7.6 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-sticky-steps.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-sticky-steps.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/sticky-steps/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Explain how my product works with Kodza Sticky Steps.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-steps` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-steps-fg` | `#0a0a0a` |  |
| `--kz-steps-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-steps-glass` | `rgba(255, 255, 255, 0.78)` |  |
| `--kz-steps-line` | `rgba(10, 10, 10, 0.12)` |  |
| `--kz-steps-top` | `10vh` |  |
| `--kz-steps-height` | `80vh` |  |
| `--kz-steps-step` | `72vh` |  |
| `--kz-steps-radius` | `20px` |  |
| `--kz-steps-duration` | `1s` |  |
| `--kz-steps-ease` | `cubic-bezier(0.65, 0, 0.35, 1)` |  |
| `--kz-steps-out` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Events: `kodza:step`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-steps {
    --kz-steps-fg: #f2f2f0;
    --kz-steps-muted: rgba(242, 242, 240, 0.62);
    --kz-steps-glass: rgba(22, 22, 22, 0.72);
    --kz-steps-line: rgba(255, 255, 255, 0.16);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
