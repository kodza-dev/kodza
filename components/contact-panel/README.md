# Contact Panel

[![Contact Panel, live on kodza.dev](https://kodza.dev/anim/contact-panel/og.jpg)](https://kodza.dev/components/contact-panel/)

A Let's talk button that flows to the side like a drop of ink and spreads into a contact panel, a sheet from the bottom on phones. Closed halfway, what was typed stays and the button says Your draft.

**[Live demo](https://kodza.dev/components/contact-panel/)** · Contact · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-contact-panel.html`](kodza-contact-panel.html) | 4.0 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-contact-panel.css`](kodza-contact-panel.css) | 49.1 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-contact-panel.js`](kodza-contact-panel.js) | 38.5 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-contact-panel.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-contact-panel.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/contact-panel/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Contact Panel to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-contact-panel` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-contact-panel-ink` | `var(--kz-color-accent, var(--kz-color-ink, #0a0a0a))` | the button, and the panel it runs into |
| `--kz-contact-panel-on-ink` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` | the button's word |
| `--kz-contact-panel-bg` | `var(--kz-contact-panel-ink)` | the panel: the button's own colour, so the drop keeps it all the way |
| `--kz-contact-panel-fg` | `var(--kz-contact-panel-on-ink)` | the text in the panel |
| `--kz-contact-panel-field` | `color-mix(in srgb, var(--kz-contact-panel-fg) 5%, var(--kz-contact-panel-bg))` | inside the fields |
| `--kz-contact-panel-muted` | `color-mix(in srgb, var(--kz-contact-panel-fg) 62%, transparent)` |  |
| `--kz-contact-panel-line` | `color-mix(in srgb, var(--kz-contact-panel-fg) 14%, transparent)` |  |
| `--kz-contact-panel-soft` | `color-mix(in srgb, var(--kz-contact-panel-fg) 8%, transparent)` | the close button |
| `--kz-contact-panel-halo` | `color-mix(in srgb, var(--kz-contact-panel-fg) 12%, transparent)` | around a focused field |
| `--kz-contact-panel-backdrop` | `transparent` | the page behind stays as it is: the panel stands out on its own |
| `--kz-contact-panel-width` | `460px` |  |
| `--kz-contact-panel-radius` | `calc(20px * var(--kz-radius-scale, 1))` |  |
| `--kz-contact-panel-duration` | `1s` | the button running into the panel like a drop; the way back takes 90 % of it |
| `--kz-contact-panel-ease` | `cubic-bezier(0.32, 0.72, 0, 1)` | the sheet settling back after a drag, on phones |

- Attributes: `data-error` (e.g. `Say a word about the project, even a short one.`), `data-failed`, `data-send`, `data-value` (e.g. `name`, `email`)
- Events: `kodza:submit`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-contact-panel {
    --kz-contact-panel-ink: #f2f2f0;
    --kz-contact-panel-on-ink: #0a0a0a;
    --kz-contact-panel-backdrop: rgba(0, 0, 0, 0.55);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the button | `Enter` / `Space` | Opens it, focus goes to the first field left to fill |
| In the panel | `Tab` / `Shift+Tab` | Next or previous control, the page behind is out of reach |
| In a field | `Enter` | Sends the message, or shows what is missing |
| In the message | `Cmd/Ctrl+Enter` | Sends the message (Enter makes a new line) |
| Anywhere, while it's open | `Escape` | Closes it, what was typed stays, focus back on the button |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
