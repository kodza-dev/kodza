# Alert

[![Alert, live on kodza.dev](https://kodza.dev/anim/alert/og.jpg)](https://kodza.dev/components/alert/)

A message in the page: note, success, warning or error, told apart by the icon, not by color. The icon draws itself, a dismissed alert folds away and an error unfolds its log.

**[Live demo](https://kodza.dev/components/alert/)** · Feedback & loading · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-alert.html`](kodza-alert.html) | 2.7 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-alert.css`](kodza-alert.css) | 16.5 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-alert.js`](kodza-alert.js) | 10.0 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-alert.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-alert.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/alert/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Show my form errors with a Kodza Alert.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-alert` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-alert-bg` | `#ffffff` |  |
| `--kz-alert-fg` | `#0a0a0a` |  |
| `--kz-alert-muted` | `rgba(10, 10, 10, 0.64)` |  |
| `--kz-alert-line` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-alert-soft` | `rgba(10, 10, 10, 0.05)` |  |
| `--kz-alert-error-bg` | `#0a0a0a` |  |
| `--kz-alert-error-fg` | `#ffffff` |  |
| `--kz-alert-error-muted` | `rgba(255, 255, 255, 0.68)` |  |
| `--kz-alert-error-soft` | `rgba(255, 255, 255, 0.08)` |  |
| `--kz-alert-radius` | `calc(14px * var(--kz-radius-scale, 1))` |  |
| `--kz-alert-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-alert-tone` | `var(--kz-alert-fg)` |  |
| `--kz-alert-tone-muted` | `var(--kz-alert-muted)` |  |
| `--kz-alert-tone-soft` | `var(--kz-alert-soft)` |  |

- Modifiers: `.kodza-alert--error`, `.kodza-alert--success`, `.kodza-alert--warning`
- Events: `kodza:alert-close`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-alert {
    --kz-alert-bg: #161616;
    --kz-alert-fg: #f2f2f0;
    --kz-alert-muted: rgba(242, 242, 240, 0.64);
    --kz-alert-line: rgba(255, 255, 255, 0.12);
    --kz-alert-soft: rgba(255, 255, 255, 0.07);
    --kz-alert-error-bg: #f2f2f0;
    --kz-alert-error-fg: #0a0a0a;
    --kz-alert-error-muted: rgba(10, 10, 10, 0.64);
    --kz-alert-error-soft: rgba(10, 10, 10, 0.07);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
