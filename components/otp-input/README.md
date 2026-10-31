# OTP Input

[![OTP Input, live on kodza.dev](https://kodza.dev/anim/otp-input/og.jpg)](https://kodza.dev/components/otp-input/)

A one-time code field: one real input drawn as cells. Digits rise into place, paste and SMS autofill just work, and the cells turn to ink once complete.

**[Live demo](https://kodza.dev/components/otp-input/)** · Forms · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-otp-input.html`](kodza-otp-input.html) | 0.6 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-otp-input.css`](kodza-otp-input.css) | 10.7 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-otp-input.js`](kodza-otp-input.js) | 8.7 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-otp-input.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-otp-input.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/otp-input/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Use the Kodza OTP Input for my 2FA code.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-otp` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-otp-bg` | `#ffffff` |  |
| `--kz-otp-fg` | `#0a0a0a` |  |
| `--kz-otp-muted` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-otp-line` | `rgba(10, 10, 10, 0.14)` |  |
| `--kz-otp-soft` | `rgba(10, 10, 10, 0.06)` |  |
| `--kz-otp-ink` | `#0a0a0a` |  |
| `--kz-otp-on-ink` | `#ffffff` |  |
| `--kz-otp-cell` | `52px` |  |
| `--kz-otp-height` | `60px` |  |
| `--kz-otp-gap` | `8px` |  |
| `--kz-otp-radius` | `calc(12px * var(--kz-radius-scale, 1))` |  |
| `--kz-otp-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-done`, `data-length` (e.g. `6`), `data-resend`
- Events: `kodza:complete`, `kodza:resend`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-otp {
    --kz-otp-bg: #161616;
    --kz-otp-fg: #f2f2f0;
    --kz-otp-muted: rgba(242, 242, 240, 0.62);
    --kz-otp-line: rgba(255, 255, 255, 0.14);
    --kz-otp-soft: rgba(255, 255, 255, 0.08);
    --kz-otp-ink: #f2f2f0;
    --kz-otp-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| In the code field | a letter | Only digits get in, one cell each |
|  | `Backspace` | Erases the last digit |
|  | `ArrowLeft` / `ArrowRight` / `Home` / `End` | Held back, the caret stays after the last digit |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
