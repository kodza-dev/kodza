# Copy to Clipboard

[![Copy to Clipboard, live on kodza.dev](https://kodza.dev/anim/copy-clipboard/og.jpg)](https://kodza.dev/components/copy-clipboard/)

A command, or a sentence for your AI, with a copy button: the icon turns into a check that draws itself and the label rolls to "Copied".

**[Live demo](https://kodza.dev/components/copy-clipboard/)** · Buttons · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-copy-clipboard.html`](kodza-copy-clipboard.html) | 1.7 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-copy-clipboard.css`](kodza-copy-clipboard.css) | 10.5 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-copy-clipboard.js`](kodza-copy-clipboard.js) | 4.9 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-copy-clipboard.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-copy-clipboard.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/copy-clipboard/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add Kodza Copy to Clipboard to my install command.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-copy]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-copy-bg` | `#ffffff` |  |
| `--kz-copy-fg` | `#0a0a0a` |  |
| `--kz-copy-muted` | `rgba(10, 10, 10, 0.45)` |  |
| `--kz-copy-border` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-copy-button-bg` | `#0a0a0a` |  |
| `--kz-copy-button-fg` | `#ffffff` |  |
| `--kz-copy-radius` | `14px` |  |
| `--kz-copy-font` | `ui-monospace, "SF Mono", "Geist Mono", Menlo, monospace` |  |
| `--kz-copy-size` | `14px` |  |
| `--kz-copy-prompt` | `"$ "` |  |
| `--kz-copy-button-height` | `38px` |  |
| `--kz-copy-max-width` | `520px` |  |
| `--kz-copy-duration` | `0.45s` |  |
| `--kz-copy-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-copy--prompt`
- Attributes: `data-kodza-copy`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-copy {
    --kz-copy-bg: #161616;
    --kz-copy-fg: #f2f2f0;
    --kz-copy-muted: rgba(255, 255, 255, 0.45);
    --kz-copy-border: rgba(255, 255, 255, 0.1);
    --kz-copy-button-bg: #ffffff;
    --kz-copy-button-fg: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
