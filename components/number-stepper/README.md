# Number Stepper

[![Number Stepper, live on kodza.dev](https://kodza.dev/anim/number-stepper/og.jpg)](https://kodza.dev/components/number-stepper/)

A real number input between − and +. Changed digits roll with the count, a held button speeds up, the edge button dims at the limit. Typed values are put back in range on leaving.

**[Live demo](https://kodza.dev/components/number-stepper/)** · Forms · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-number-stepper.html`](kodza-number-stepper.html) | 1.0 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-number-stepper.css`](kodza-number-stepper.css) | 20.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-number-stepper.js`](kodza-number-stepper.js) | 21.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-number-stepper.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-number-stepper.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/number-stepper/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Number Stepper to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-number-stepper` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-number-bg` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-number-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-number-muted` | `color-mix(in srgb, var(--kz-number-fg) 60%, transparent)` |  |
| `--kz-number-line` | `color-mix(in srgb, var(--kz-number-fg) 14%, transparent)` |  |
| `--kz-number-line-hover` | `color-mix(in srgb, var(--kz-number-fg) 30%, transparent)` |  |
| `--kz-number-soft` | `color-mix(in srgb, var(--kz-number-fg) 6%, transparent)` |  |
| `--kz-number-button` | `color-mix(in srgb, var(--kz-number-fg) 5%, transparent)` | the − and + |
| `--kz-number-button-hover` | `color-mix(in srgb, var(--kz-number-fg) 9%, transparent)` |  |
| `--kz-number-button-press` | `color-mix(in srgb, var(--kz-number-fg) 14%, transparent)` |  |
| `--kz-number-error` | `var(--kz-color-error, var(--kz-number-fg))` | a message, never colour alone: set a red here if you want one |
| `--kz-number-height` | `56px` |  |
| `--kz-number-radius` | `calc(12px * var(--kz-radius-scale, 1))` |  |
| `--kz-number-button-size` | `40px` |  |
| `--kz-number-button-radius` | `calc(8px * var(--kz-radius-scale, 1))` |  |
| `--kz-number-value-size` | `17px` |  |
| `--kz-number-width` | `var(--kz-field-width, 240px)` |  |
| `--kz-number-duration` | `0.28s` |  |
| `--kz-number-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-number-stepper--compact`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-number-stepper {
    --kz-number-bg: #161616;
    --kz-number-fg: #f2f2f0;
    --kz-number-muted: rgba(242, 242, 240, 0.62);
    --kz-number-line: rgba(255, 255, 255, 0.14);
    --kz-number-line-hover: rgba(255, 255, 255, 0.3);
    --kz-number-soft: rgba(255, 255, 255, 0.08);
    --kz-number-button: rgba(255, 255, 255, 0.07);
    --kz-number-button-hover: rgba(255, 255, 255, 0.12);
    --kz-number-button-press: rgba(255, 255, 255, 0.18);
    --kz-number-error: #f2f2f0;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| In the field | `ArrowUp` / `ArrowDown` | One step up or down, the digits roll |
|  | `PageUp` / `PageDown` | Ten steps at once |
|  | `Home` / `End` | The min or the max, when the field has one |
|  | `Enter` | Puts a typed value back in range, then submits |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
