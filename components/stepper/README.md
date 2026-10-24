# Stepper

[![Stepper, live on kodza.dev](https://kodza.dev/anim/stepper/og.jpg)](https://kodza.dev/components/stepper/)

A flow in four steps: the line fills, a check draws itself on each finished step and the content slides in from where you are heading.

**[Live demo](https://kodza.dev/components/stepper/)** · Navigation · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-stepper.html`](kodza-stepper.html) | 2.7 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-stepper.css`](kodza-stepper.css) | 16.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-stepper.js`](kodza-stepper.js) | 7.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-stepper.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-stepper.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/stepper/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Split my checkout into a Kodza Stepper.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-stepper` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-stepper-bg` | `#ffffff` |  |
| `--kz-stepper-fg` | `#0a0a0a` |  |
| `--kz-stepper-muted` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-stepper-border` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-stepper-line` | `rgba(10, 10, 10, 0.12)` |  |
| `--kz-stepper-ink` | `#0a0a0a` |  |
| `--kz-stepper-on-ink` | `#ffffff` |  |
| `--kz-stepper-dot` | `28px` |  |
| `--kz-stepper-duration` | `0.6s` |  |
| `--kz-stepper-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-again` (e.g. `Start over`), `data-last` (e.g. `Ship it`)
- Events: `kodza:step`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-stepper {
    --kz-stepper-bg: #161616;
    --kz-stepper-fg: #f2f2f0;
    --kz-stepper-muted: rgba(242, 242, 240, 0.58);
    --kz-stepper-border: rgba(255, 255, 255, 0.12);
    --kz-stepper-line: rgba(255, 255, 255, 0.16);
    --kz-stepper-ink: #f2f2f0;
    --kz-stepper-on-ink: #161616;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
