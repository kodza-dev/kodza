# Share Button

[![Share Button, live on kodza.dev](https://kodza.dev/anim/share-button/og.jpg)](https://kodza.dev/components/share-button/)

Press Share and the options slide out from behind it, the last one pushing the pill open, while the arrow takes off and a cross draws itself. Copy link turns into a check; X and LinkedIn open in a small window.

**[Live demo](https://kodza.dev/components/share-button/)** · Buttons · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-share-button.html`](kodza-share-button.html) | 4.6 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-share-button.css`](kodza-share-button.css) | 16.0 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-share-button.js`](kodza-share-button.js) | 17.7 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-share-button.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-share-button.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/share-button/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Share Button to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-share` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-share-bg` | `#0a0a0a` |  |
| `--kz-share-fg` | `#ffffff` |  |
| `--kz-share-border` | `transparent` |  |
| `--kz-share-tint` | `rgba(255, 255, 255, 0.14)` | the hover, under one option |
| `--kz-share-tip-bg` | `#0a0a0a` |  |
| `--kz-share-tip-fg` | `#ffffff` |  |
| `--kz-share-height` | `52px` |  |
| `--kz-share-option` | `44px` |  |
| `--kz-share-duration` | `0.6s` | opening and closing |
| `--kz-share-unfold` | `cubic-bezier(0.65, 0, 0.35, 1)` |  |
| `--kz-share-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` | the tint, the label, the small moves |

- Modifiers: `.kodza-share--icon`
- Attributes: `data-copied`, `data-share` (e.g. `copy`, `x`, `linkedin`, `email`), `data-title`, `data-url`
- Events: `kodza:share`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-share {
    --kz-share-bg: #f2f2f0;
    --kz-share-fg: #0a0a0a;
    --kz-share-tint: rgba(10, 10, 10, 0.08);
    --kz-share-tip-bg: #f2f2f0;
    --kz-share-tip-fg: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the button | `Enter` / `Space` | Opens or closes the options |
| On the button or an option, while it's open | `ArrowRight` / `ArrowLeft` | Next or previous stop, the button included |
|  | `Home` / `End` | The button, or the last option |
|  | `Tab` | Closes it once the focus has left |
| Anywhere, while it's open | `Escape` | Closes it, focus back on the button |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
