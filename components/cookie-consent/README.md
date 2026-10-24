# Cookie Consent

[![Cookie Consent, live on kodza.dev](https://kodza.dev/anim/cookie-consent/og.jpg)](https://kodza.dev/components/cookie-consent/)

An honest cookie card: Reject weighs as much as Accept, Choose unfolds the categories, the choice is kept and a link brings the card back.

**[Live demo](https://kodza.dev/components/cookie-consent/)** · Overlays · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-cookie-consent.html`](kodza-cookie-consent.html) | 1.6 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-cookie-consent.css`](kodza-cookie-consent.css) | 17.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-cookie-consent.js`](kodza-cookie-consent.js) | 7.1 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-cookie-consent.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-cookie-consent.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/cookie-consent/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Replace my WordPress cookie banner with Kodza Cookie Consent.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-cookies` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-cookies-bg` | `#ffffff` |  |
| `--kz-cookies-fg` | `#0a0a0a` |  |
| `--kz-cookies-muted` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-cookies-line` | `rgba(10, 10, 10, 0.12)` |  |
| `--kz-cookies-soft` | `rgba(10, 10, 10, 0.06)` |  |
| `--kz-cookies-ink` | `#0a0a0a` |  |
| `--kz-cookies-on-ink` | `#ffffff` |  |
| `--kz-cookies-shadow` | `0 24px 60px -24px rgba(10, 10, 10, 0.4)` |  |
| `--kz-cookies-width` | `400px` |  |
| `--kz-cookies-edge` | `20px` |  |
| `--kz-cookies-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-choice` (e.g. `reject`, `accept`), `data-key` (e.g. `kodza-consent`), `data-kodza-cookies`
- Events: `kodza:consent`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-cookies {
    --kz-cookies-bg: #1b1b1b;
    --kz-cookies-fg: #f2f2f0;
    --kz-cookies-muted: rgba(242, 242, 240, 0.62);
    --kz-cookies-line: rgba(255, 255, 255, 0.14);
    --kz-cookies-soft: rgba(255, 255, 255, 0.07);
    --kz-cookies-ink: #f2f2f0;
    --kz-cookies-on-ink: #0a0a0a;
    --kz-cookies-shadow: 0 24px 60px -24px rgba(0, 0, 0, 0.9);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a switch | `Space` | Turns the category on or off |
| In the card, once unfolded | `Escape` | Folds the categories back, nothing saved |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
