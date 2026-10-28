# Checkbox

[![Checkbox, live on kodza.dev](https://kodza.dev/anim/checkbox-component/og.jpg)](https://kodza.dev/components/checkbox-component/)

Real checkboxes, redrawn: ink grows from the centre and the tick draws itself. A select-all box shows a dash when only some are checked. Cards too.

**[Live demo](https://kodza.dev/components/checkbox-component/)** · Forms · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-checkbox-component.html`](kodza-checkbox-component.html) | 3.4 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-checkbox-component.css`](kodza-checkbox-component.css) | 13.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-checkbox-component.js`](kodza-checkbox-component.js) | 4.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-checkbox-component.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-checkbox-component.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/checkbox-component/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Restyle the checkboxes of my signup form with Kodza Checkbox.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-checkbox` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-check-bg` | `#ffffff` |  |
| `--kz-check-fg` | `#0a0a0a` |  |
| `--kz-check-muted` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-check-line` | `rgba(10, 10, 10, 0.2)` |  |
| `--kz-check-soft` | `rgba(10, 10, 10, 0.06)` |  |
| `--kz-check-ink` | `#0a0a0a` |  |
| `--kz-check-on-ink` | `#ffffff` |  |
| `--kz-check-size` | `20px` |  |
| `--kz-check-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-check-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |  |

- Modifiers: `.kodza-checkbox--cards`
- Attributes: `data-all`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-checkbox {
    --kz-check-bg: #161616;
    --kz-check-fg: #f2f2f0;
    --kz-check-muted: rgba(242, 242, 240, 0.62);
    --kz-check-line: rgba(255, 255, 255, 0.24);
    --kz-check-soft: rgba(255, 255, 255, 0.07);
    --kz-check-ink: #f2f2f0;
    --kz-check-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
