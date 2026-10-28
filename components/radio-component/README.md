# Radio

[![Radio, live on kodza.dev](https://kodza.dev/anim/radio-component/og.jpg)](https://kodza.dev/components/radio-component/)

Real radio buttons with one dot for the whole group: pick another option and the dot travels to it, stretching on the way like a drop of ink.

**[Live demo](https://kodza.dev/components/radio-component/)** · Forms · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-radio-component.html`](kodza-radio-component.html) | 1.9 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-radio-component.css`](kodza-radio-component.css) | 10.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-radio-component.js`](kodza-radio-component.js) | 6.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-radio-component.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-radio-component.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/radio-component/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Restyle my plan choice with Kodza Radio buttons.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-radio` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-radio-bg` | `#ffffff` |  |
| `--kz-radio-fg` | `#0a0a0a` |  |
| `--kz-radio-muted` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-radio-line` | `rgba(10, 10, 10, 0.2)` |  |
| `--kz-radio-soft` | `rgba(10, 10, 10, 0.06)` |  |
| `--kz-radio-ink` | `#0a0a0a` |  |
| `--kz-radio-size` | `20px` |  |
| `--kz-radio-dot` | `8px` |  |
| `--kz-radio-duration` | `0.5s` |  |
| `--kz-radio-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-radio--cards`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-radio {
    --kz-radio-bg: #161616;
    --kz-radio-fg: #f2f2f0;
    --kz-radio-muted: rgba(242, 242, 240, 0.62);
    --kz-radio-line: rgba(255, 255, 255, 0.24);
    --kz-radio-soft: rgba(255, 255, 255, 0.07);
    --kz-radio-ink: #f2f2f0;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On an option | `ArrowDown` / `ArrowRight` | Picks the next option, round and round |
|  | `ArrowUp` / `ArrowLeft` | Picks the previous option, round and round |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
