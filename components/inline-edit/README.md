# Inline Edit

[![Inline Edit, live on kodza.dev](https://kodza.dev/anim/inline-edit/og.jpg)](https://kodza.dev/components/inline-edit/)

Text that becomes its own field when clicked: the caret lands under the pointer, Enter saves with a check, Escape rolls the old text back in. A real input or textarea underneath, with a kodza:save event.

**[Live demo](https://kodza.dev/components/inline-edit/)** · Forms · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-inline-edit.html`](kodza-inline-edit.html) | 1.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-inline-edit.css`](kodza-inline-edit.css) | 18.5 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-inline-edit.js`](kodza-inline-edit.js) | 16.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-inline-edit.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-inline-edit.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/inline-edit/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Inline Edit to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-inline-edit` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-inline-edit-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-inline-edit-muted` | `color-mix(in srgb, var(--kz-inline-edit-fg) 60%, transparent)` | label, prefix, placeholder, hint |
| `--kz-inline-edit-hover` | `color-mix(in srgb, var(--kz-inline-edit-fg) 5%, transparent)` | the box under the pointer |
| `--kz-inline-edit-bg` | `var(--kz-color-paper, #ffffff)` | the box while editing |
| `--kz-inline-edit-focus` | `var(--kz-inline-edit-fg)` | its outline |
| `--kz-inline-edit-halo` | `color-mix(in srgb, var(--kz-inline-edit-fg) 6%, transparent)` |  |
| `--kz-inline-edit-error` | `var(--kz-color-error, var(--kz-inline-edit-fg))` |  |
| `--kz-inline-edit-width` | `var(--kz-field-width, 420px)` |  |
| `--kz-inline-edit-size` | `15px` |  |
| `--kz-inline-edit-leading` | `1.55` |  |
| `--kz-inline-edit-radius` | `calc(8px * var(--kz-radius-scale, 1))` |  |
| `--kz-inline-edit-reach-y` | `max(6px, 0.25em)` | how far the box reaches past the text, up and down |
| `--kz-inline-edit-reach-x` | `max(10px, 0.4em)` | and sideways |
| `--kz-inline-edit-duration` | `0.45s` | the outline drawing itself; the box and the note follow it. 0s = no motion |
| `--kz-inline-edit-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-inline-edit--title`
- Attributes: `data-error` (e.g. `Lowercase letters, digits and dashes only.`)
- Events: `kodza:save`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-inline-edit {
    --kz-inline-edit-fg: #f2f2f0;
    --kz-inline-edit-muted: rgba(242, 242, 240, 0.62);
    --kz-inline-edit-hover: rgba(255, 255, 255, 0.07);
    --kz-inline-edit-bg: #161616;
    --kz-inline-edit-focus: #f2f2f0;
    --kz-inline-edit-halo: rgba(255, 255, 255, 0.08);
    --kz-inline-edit-error: #f2f2f0;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the text | `Enter` / `Space` | Turns it into a field, all the text selected |
| While editing | `Enter` | Saves, focus back on the text |
|  | `Shift+Enter` | New line, in a multi-line field |
|  | `Escape` | Cancels, the old text rolls back in |
|  | `Tab` | Saves and moves on |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
