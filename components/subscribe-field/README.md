# Subscribe Field

[![Subscribe Field, live on kodza.dev](https://kodza.dev/anim/subscribe-field/og.jpg)](https://kodza.dev/components/subscribe-field/)

An email field and its button in one pill: the address is checked in place, the button rolls to a turning ring, then the thanks rises where the pill was. Posts to the form action or to your code.

**[Live demo](https://kodza.dev/components/subscribe-field/)** · Forms · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-subscribe-field.html`](kodza-subscribe-field.html) | 2.8 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-subscribe-field.css`](kodza-subscribe-field.css) | 21.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-subscribe-field.js`](kodza-subscribe-field.js) | 11.1 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-subscribe-field.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-subscribe-field.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/subscribe-field/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Subscribe Field to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-subscribe` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-subscribe-bg` | `#ffffff` |  |
| `--kz-subscribe-fg` | `#0a0a0a` |  |
| `--kz-subscribe-muted` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-subscribe-line` | `rgba(10, 10, 10, 0.14)` |  |
| `--kz-subscribe-line-hover` | `rgba(10, 10, 10, 0.3)` |  |
| `--kz-subscribe-focus` | `#0a0a0a` |  |
| `--kz-subscribe-halo` | `rgba(10, 10, 10, 0.04)` |  |
| `--kz-subscribe-error` | `#0a0a0a` | monochrome by default: an icon and a message, never colour alone |
| `--kz-subscribe-ink` | `#0a0a0a` | the button and the tick |
| `--kz-subscribe-ink-hover` | `#2a2a2a` |  |
| `--kz-subscribe-on-ink` | `#ffffff` |  |
| `--kz-subscribe-width` | `var(--kz-field-width, 440px)` |  |
| `--kz-subscribe-height` | `56px` |  |
| `--kz-subscribe-button` | `44px` | the button's height, inside the pill |
| `--kz-subscribe-pad` | `22px` | from the pill's edge to the text |
| `--kz-subscribe-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-subscribe-swap` | `cubic-bezier(0.65, 0, 0.35, 1)` | the pill leaving, the thanks arriving |

- Modifiers: `.kodza-subscribe--icon`
- Attributes: `data-error` (e.g. `Enter a real email address.`), `data-fail`, `data-failed`, `data-state` (e.g. `sending`, `done`)
- Events: `kodza:subscribe`, bubbling from the root
- On the root element: `root.kodzaSubscribe` (see the comment at the top of the JS)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-subscribe {
    --kz-subscribe-bg: #161616;
    --kz-subscribe-fg: #f2f2f0;
    --kz-subscribe-muted: rgba(242, 242, 240, 0.62);
    --kz-subscribe-line: rgba(255, 255, 255, 0.14);
    --kz-subscribe-line-hover: rgba(255, 255, 255, 0.3);
    --kz-subscribe-focus: #f2f2f0;
    --kz-subscribe-halo: rgba(255, 255, 255, 0.06);
    --kz-subscribe-error: #f2f2f0;
    --kz-subscribe-ink: #f2f2f0;
    --kz-subscribe-ink-hover: #d6d6d4;
    --kz-subscribe-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| In the field | `Enter` | Sends the address, or says what is wrong with it |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
