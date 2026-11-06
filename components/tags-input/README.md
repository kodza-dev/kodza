# Tags Input

[![Tags Input, live on kodza.dev](https://kodza.dev/anim/tags-input/og.jpg)](https://kodza.dev/components/tags-input/)

Free values as tags over a real text input, sent joined by commas. Enter or a comma makes a tag, a pasted list is split, a duplicate shakes its twin. Caps with data-max, checks emails.

**[Live demo](https://kodza.dev/components/tags-input/)** · Forms · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-tags-input.html`](kodza-tags-input.html) | 0.8 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-tags-input.css`](kodza-tags-input.css) | 19.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-tags-input.js`](kodza-tags-input.js) | 23.4 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-tags-input.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-tags-input.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/tags-input/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Tags Input to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-tags` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-tags-bg` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-tags-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-tags-muted` | `color-mix(in srgb, var(--kz-tags-fg) 60%, transparent)` |  |
| `--kz-tags-line` | `color-mix(in srgb, var(--kz-tags-fg) 14%, transparent)` |  |
| `--kz-tags-line-hover` | `color-mix(in srgb, var(--kz-tags-fg) 30%, transparent)` |  |
| `--kz-tags-soft` | `color-mix(in srgb, var(--kz-tags-fg) 6%, transparent)` |  |
| `--kz-tags-ink` | `var(--kz-color-accent, var(--kz-tags-fg))` | the tags |
| `--kz-tags-on-ink` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-tags-cross-hover` | `color-mix(in srgb, var(--kz-tags-on-ink) 18%, transparent)` |  |
| `--kz-tags-error` | `var(--kz-color-error, var(--kz-tags-fg))` | a message, never colour alone: set a red here if you want one |
| `--kz-tags-height` | `64px` | one row of tags |
| `--kz-tags-radius` | `calc(12px * var(--kz-radius-scale, 1))` |  |
| `--kz-tags-pad` | `16px` |  |
| `--kz-tags-width` | `var(--kz-field-width, 420px)` |  |
| `--kz-tags-duration` | `0.35s` |  |
| `--kz-tags-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-max` (e.g. `6`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-tags {
    --kz-tags-bg: #161616;
    --kz-tags-fg: #f2f2f0;
    --kz-tags-muted: rgba(242, 242, 240, 0.62);
    --kz-tags-line: rgba(255, 255, 255, 0.14);
    --kz-tags-line-hover: rgba(255, 255, 255, 0.3);
    --kz-tags-soft: rgba(255, 255, 255, 0.08);
    --kz-tags-ink: #f2f2f0;
    --kz-tags-on-ink: #0a0a0a;
    --kz-tags-cross-hover: rgba(10, 10, 10, 0.12);
    --kz-tags-error: #f2f2f0;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| While a tag is selected | `Backspace` / `Delete` | Removes it |
|  | `ArrowLeft` / `ArrowRight` | The tag before or after; past the last, back to typing |
|  | `Escape` | Lets go of it |
| In the field | `Enter` | Turns the text into a tag (a comma does too) |
|  | `Backspace` / `ArrowLeft` | At the start of the field, selects the last tag |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
