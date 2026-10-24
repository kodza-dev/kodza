# Password

[![Password, live on kodza.dev](https://kodza.dev/anim/password-field/og.jpg)](https://kodza.dev/components/password-field/)

A password field with an eye that crosses itself out, a meter that fills as it gets stronger, a verdict that rolls and rules that tick themselves off.

**[Live demo](https://kodza.dev/components/password-field/)** · Forms · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-password-field.html`](kodza-password-field.html) | 1.4 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-password-field.css`](kodza-password-field.css) | 14.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-password-field.js`](kodza-password-field.js) | 6.7 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-password-field.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-password-field.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/password-field/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Use the Kodza Password field in my signup form.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-password` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-pass-bg` | `#ffffff` |  |
| `--kz-pass-fg` | `#0a0a0a` |  |
| `--kz-pass-muted` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-pass-line` | `rgba(10, 10, 10, 0.14)` |  |
| `--kz-pass-line-hover` | `rgba(10, 10, 10, 0.3)` |  |
| `--kz-pass-soft` | `rgba(10, 10, 10, 0.06)` |  |
| `--kz-pass-height` | `56px` |  |
| `--kz-pass-radius` | `12px` |  |
| `--kz-pass-pad` | `16px` |  |
| `--kz-pass-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-rule` (e.g. `length`, `digit`, `symbol`)
- Events: `kodza:strength`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-password {
    --kz-pass-bg: #161616;
    --kz-pass-fg: #f2f2f0;
    --kz-pass-muted: rgba(242, 242, 240, 0.62);
    --kz-pass-line: rgba(255, 255, 255, 0.14);
    --kz-pass-line-hover: rgba(255, 255, 255, 0.3);
    --kz-pass-soft: rgba(255, 255, 255, 0.08);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
