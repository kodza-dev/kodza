# Toast

[![Toast, live on kodza.dev](https://kodza.dev/anim/toast-notification/og.jpg)](https://kodza.dev/components/toast-notification/)

Notifications that stack like a deck and spread out on hover. Time runs out on a thin line, a swipe dismisses, and a loading toast turns into a success.

**[Live demo](https://kodza.dev/components/toast-notification/)** · Overlays · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-toast-notification.html`](kodza-toast-notification.html) | 0.7 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-toast-notification.css`](kodza-toast-notification.css) | 10.1 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-toast-notification.js`](kodza-toast-notification.js) | 12.0 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-toast-notification.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-toast-notification.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/toast-notification/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Show a Kodza Toast when my form is sent.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-toast` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-toast-bg` | `#ffffff` |  |
| `--kz-toast-fg` | `#0a0a0a` |  |
| `--kz-toast-muted` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-toast-line` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-toast-soft` | `rgba(10, 10, 10, 0.06)` |  |
| `--kz-toast-ink` | `#0a0a0a` |  |
| `--kz-toast-on-ink` | `#ffffff` |  |
| `--kz-toast-shadow` | `0 16px 40px -18px rgba(10, 10, 10, 0.35)` |  |
| `--kz-toast-width` | `360px` |  |
| `--kz-toast-gap` | `10px` |  |
| `--kz-toast-edge` | `20px` |  |
| `--kz-toast-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-action` (e.g. `Undo`), `data-then` (e.g. `Deployed. On a Tuesday, like adults.`), `data-toast` (e.g. `Copied. Paste responsibly.`, `Deploying to production…`, `Component moved to the trash.`, `Build failed: 1 error, 0 regrets.`), `data-type` (e.g. `success`, `loading`, `error`)
- Events: `kodza:toast-action`, bubbling from the root
- On the root element: `root.kodzaToast` (see the comment at the top of the JS)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-toast {
    --kz-toast-bg: #1b1b1b;
    --kz-toast-fg: #f2f2f0;
    --kz-toast-muted: rgba(242, 242, 240, 0.62);
    --kz-toast-line: rgba(255, 255, 255, 0.12);
    --kz-toast-soft: rgba(255, 255, 255, 0.07);
    --kz-toast-ink: #f2f2f0;
    --kz-toast-on-ink: #0a0a0a;
    --kz-toast-shadow: 0 16px 40px -18px rgba(0, 0, 0, 0.8);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
