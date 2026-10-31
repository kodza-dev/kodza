# Dialog

[![Dialog, live on kodza.dev](https://kodza.dev/anim/modal-component/og.jpg)](https://kodza.dev/components/modal-component/)

A real dialog that grows out of the button that opened it and goes back into it. The alert version asks you to type the name before it deletes anything.

**[Live demo](https://kodza.dev/components/modal-component/)** · Overlays · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-modal-component.html`](kodza-modal-component.html) | 2.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-modal-component.css`](kodza-modal-component.css) | 22.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-modal-component.js`](kodza-modal-component.js) | 12.0 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-modal-component.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-modal-component.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/modal-component/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Confirm account deletion with a Kodza Dialog.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-dialog` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-dialog-bg` | `#ffffff` |  |
| `--kz-dialog-fg` | `#0a0a0a` |  |
| `--kz-dialog-muted` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-dialog-line` | `rgba(10, 10, 10, 0.12)` |  |
| `--kz-dialog-soft` | `rgba(10, 10, 10, 0.05)` |  |
| `--kz-dialog-ink` | `#0a0a0a` |  |
| `--kz-dialog-on-ink` | `#ffffff` |  |
| `--kz-dialog-backdrop` | `rgba(10, 10, 10, 0.3)` |  |
| `--kz-dialog-shadow` | `0 30px 70px -20px rgba(10, 10, 10, 0.45)` |  |
| `--kz-dialog-width` | `440px` |  |
| `--kz-dialog-radius` | `calc(20px * var(--kz-radius-scale, 1))` |  |
| `--kz-dialog-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-dialog--alert`
- Attributes: `data-confirm` (e.g. `kodza-site`)
- Events: `kodza:close`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-dialog {
    --kz-dialog-bg: #161616;
    --kz-dialog-fg: #f2f2f0;
    --kz-dialog-muted: rgba(242, 242, 240, 0.62);
    --kz-dialog-line: rgba(255, 255, 255, 0.14);
    --kz-dialog-soft: rgba(255, 255, 255, 0.07);
    --kz-dialog-ink: #f2f2f0;
    --kz-dialog-on-ink: #0a0a0a;
    --kz-dialog-backdrop: rgba(0, 0, 0, 0.55);
    --kz-dialog-shadow: 0 30px 70px -20px rgba(0, 0, 0, 0.9);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the button | `Enter` / `Space` | Opens it, focus goes into the panel |
| In a field | `Enter` | Runs the main button, once it's enabled |
| In the panel | `Tab` / `Shift+Tab` | Next or previous control, the page behind is out of reach |
| Anywhere, while it's open | `Escape` | Closes it, focus back on the button |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
