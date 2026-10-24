# Command Palette

[![Command Palette, live on kodza.dev](https://kodza.dev/anim/command-palette/og.jpg)](https://kodza.dev/components/command-palette/)

A ⌘K palette in a real dialog: results filter as you type, matched letters are underlined and a highlight slides between them.

**[Live demo](https://kodza.dev/components/command-palette/)** · Navigation · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-command-palette.html`](kodza-command-palette.html) | 2.8 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-command-palette.css`](kodza-command-palette.css) | 13.8 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-command-palette.js`](kodza-command-palette.js) | 12.3 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-command-palette.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-command-palette.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/command-palette/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add a Kodza Command Palette on ⌘K to my React app.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-command` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-cmdk-bg` | `#ffffff` |  |
| `--kz-cmdk-fg` | `#0a0a0a` |  |
| `--kz-cmdk-muted` | `rgba(10, 10, 10, 0.58)` |  |
| `--kz-cmdk-border` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-cmdk-soft` | `rgba(10, 10, 10, 0.06)` |  |
| `--kz-cmdk-backdrop` | `rgba(10, 10, 10, 0.32)` |  |
| `--kz-cmdk-shadow` | `0 30px 70px -24px rgba(10, 10, 10, 0.45)` |  |
| `--kz-cmdk-width` | `560px` |  |
| `--kz-cmdk-top` | `14vh` |  |
| `--kz-cmdk-duration` | `0.28s` |  |
| `--kz-cmdk-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-cmdk-mono` | `ui-monospace, "SF Mono", Menlo, monospace` |  |

- Events: `kodza:command`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-command {
    --kz-cmdk-bg: #161616;
    --kz-cmdk-fg: #f2f2f0;
    --kz-cmdk-muted: rgba(242, 242, 240, 0.52);
    --kz-cmdk-border: rgba(255, 255, 255, 0.12);
    --kz-cmdk-soft: rgba(255, 255, 255, 0.08);
    --kz-cmdk-backdrop: rgba(0, 0, 0, 0.55);
    --kz-cmdk-shadow: 0 30px 70px -24px rgba(0, 0, 0, 0.9);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| Anywhere | `Cmd/Ctrl+K` | Opens it, or closes it when it's open |
| In the search field | `ArrowDown` / `ArrowUp` | Next or previous result, round and round |
|  | `Enter` | Picks the highlighted result and closes |
| Anywhere, while it's open | `Escape` | Closes it, focus back on the button |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
