# Was This Helpful

[![Was This Helpful, live on kodza.dev](https://kodza.dev/anim/was-this-helpful/og.jpg)](https://kodza.dev/components/was-this-helpful/)

A question and two thumbs: the chosen one fills with ink, No unfolds an optional note, then the thanks rolls in where the question was. Posts to the form action or to your code.

**[Live demo](https://kodza.dev/components/was-this-helpful/)** · Forms · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-was-this-helpful.html`](kodza-was-this-helpful.html) | 3.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-was-this-helpful.css`](kodza-was-this-helpful.css) | 30.1 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-was-this-helpful.js`](kodza-was-this-helpful.js) | 12.5 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-was-this-helpful.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-was-this-helpful.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/was-this-helpful/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Was This Helpful to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-helpful` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-helpful-bg` | `#ffffff` |  |
| `--kz-helpful-fg` | `#0a0a0a` |  |
| `--kz-helpful-muted` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-helpful-line` | `rgba(10, 10, 10, 0.14)` |  |
| `--kz-helpful-line-hover` | `rgba(10, 10, 10, 0.3)` |  |
| `--kz-helpful-focus` | `#0a0a0a` |  |
| `--kz-helpful-halo` | `rgba(10, 10, 10, 0.04)` |  |
| `--kz-helpful-error` | `#0a0a0a` | monochrome by default: an icon and a message, never colour alone |
| `--kz-helpful-ink` | `#0a0a0a` | the chosen thumb, the tick and the Send button |
| `--kz-helpful-ink-hover` | `#2a2a2a` |  |
| `--kz-helpful-on-ink` | `#ffffff` |  |
| `--kz-helpful-width` | `var(--kz-field-width, 380px)` |  |
| `--kz-helpful-thumb` | `40px` | the size of a thumb's round button |
| `--kz-helpful-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-helpful-swap` | `cubic-bezier(0.65, 0, 0.35, 1)` | the question leaving, the thanks arriving |

- Attributes: `data-fail`, `data-failed`, `data-for` (e.g. `yes`, `no`), `data-more`, `data-state` (e.g. `sending`, `done`), `data-value`
- Events: `kodza:helpful`, bubbling from the root
- On the root element: `root.kodzaHelpful` (see the comment at the top of the JS)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-helpful {
    --kz-helpful-bg: #161616;
    --kz-helpful-fg: #f2f2f0;
    --kz-helpful-muted: rgba(242, 242, 240, 0.62);
    --kz-helpful-line: rgba(255, 255, 255, 0.14);
    --kz-helpful-line-hover: rgba(255, 255, 255, 0.3);
    --kz-helpful-focus: #f2f2f0;
    --kz-helpful-halo: rgba(255, 255, 255, 0.06);
    --kz-helpful-error: #f2f2f0;
    --kz-helpful-ink: #f2f2f0;
    --kz-helpful-ink-hover: #d6d6d4;
    --kz-helpful-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| In Tell us more | `Cmd/Ctrl+Enter` | Sends the note |
|  | `Escape` | Closes it, focus back on No |
| On a thumb | `Enter` / `Space` | Yes sends it; No opens Tell us more |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
