# Form Wizard

[![Form Wizard, live on kodza.dev](https://kodza.dev/anim/form-wizard/og.jpg)](https://kodza.dev/components/form-wizard/)

One real form cut into steps: Next checks the step first, the steps slide while the height eases, and the last one reads the answers back, each with its Edit. Sends via kodza:submit or a fetch.

**[Live demo](https://kodza.dev/components/form-wizard/)** · Forms · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-form-wizard.html`](kodza-form-wizard.html) | 6.8 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-form-wizard.css`](kodza-form-wizard.css) | 39.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-form-wizard.js`](kodza-form-wizard.js) | 21.3 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-form-wizard.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-form-wizard.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/form-wizard/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Form Wizard to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-wizard` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-wizard-bg` | `#ffffff` |  |
| `--kz-wizard-fg` | `#0a0a0a` |  |
| `--kz-wizard-muted` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-wizard-border` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-wizard-line` | `rgba(10, 10, 10, 0.14)` |  |
| `--kz-wizard-line-hover` | `rgba(10, 10, 10, 0.3)` |  |
| `--kz-wizard-soft` | `rgba(10, 10, 10, 0.04)` |  |
| `--kz-wizard-ink` | `#0a0a0a` |  |
| `--kz-wizard-on-ink` | `#ffffff` |  |
| `--kz-wizard-error` | `#0a0a0a` | a message, never colour alone: set a red here if you want one |
| `--kz-wizard-width` | `560px` |  |
| `--kz-wizard-dot` | `28px` |  |
| `--kz-wizard-field-height` | `56px` |  |
| `--kz-wizard-field-radius` | `calc(12px * var(--kz-radius-scale, 1))` |  |
| `--kz-wizard-duration` | `0.6s` | a step change; the field states take 2/3 of it |
| `--kz-wizard-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-edit`, `data-error` (e.g. `Pick one. Any one.`, `A full address, with https://.`, `A ballpark is fine. Nobody holds you to it.`, `Pick one. No rush is an answer too.`, `We need something to call you.`, `That does not look like an email.`), `data-failed`, `data-next` (e.g. `Next`), `data-send`, `data-sending` (e.g. `Sending…`), `data-to-review` (e.g. `Back to review`)
- Events: `kodza:step`, `kodza:submit`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-wizard {
    --kz-wizard-bg: #161616;
    --kz-wizard-fg: #f2f2f0;
    --kz-wizard-muted: rgba(242, 242, 240, 0.62);
    --kz-wizard-border: rgba(255, 255, 255, 0.12);
    --kz-wizard-line: rgba(255, 255, 255, 0.16);
    --kz-wizard-line-hover: rgba(255, 255, 255, 0.32);
    --kz-wizard-soft: rgba(255, 255, 255, 0.07);
    --kz-wizard-ink: #f2f2f0;
    --kz-wizard-on-ink: #161616;
    --kz-wizard-error: #f2f2f0;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| In a field | `Enter` | Checks the step, then the next one slides in |
| On the choices | `ArrowRight` / `ArrowDown` | Picks the next answer |
|  | `ArrowLeft` / `ArrowUp` | Picks the previous answer |
| On an answer's Edit | `Enter` | Back to that step, focus on its answer; Next returns here |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
