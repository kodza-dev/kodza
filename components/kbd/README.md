# Kbd

[![Kbd, live on kodza.dev](https://kodza.dev/anim/kbd/og.jpg)](https://kodza.dev/components/kbd/)

Keyboard keys with a little depth, alone, in a combo or in a list of shortcuts. Type one for real and its keys sink as you press them; the whole combo down lights its line.

**[Live demo](https://kodza.dev/components/kbd/)** · Data display · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-kbd.html`](kodza-kbd.html) | 1.0 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-kbd.css`](kodza-kbd.css) | 5.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-kbd.js`](kodza-kbd.js) | 6.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-kbd.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-kbd.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/kbd/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Show my keyboard shortcuts with Kodza Kbd.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-kbd` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-kbd-bg` | `#ffffff` |  |
| `--kz-kbd-fg` | `#0a0a0a` |  |
| `--kz-kbd-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-kbd-line` | `rgba(10, 10, 10, 0.16)` |  |
| `--kz-kbd-depth` | `rgba(10, 10, 10, 0.18)` |  |
| `--kz-kbd-soft` | `rgba(10, 10, 10, 0.05)` |  |
| `--kz-kbd-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-kbd-s` | `var(--kz-kbd-size, 26px)` |  |

- Attributes: `data-key` (e.g. `Mod`, `k`, `c`, `Enter`, `z`, `Escape`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-kbd,
  .kodza-kbd-combo,
  .kodza-kbd-list {
    --kz-kbd-bg: #1c1c1c;
    --kz-kbd-fg: #f2f2f0;
    --kz-kbd-muted: rgba(242, 242, 240, 0.62);
    --kz-kbd-line: rgba(255, 255, 255, 0.16);
    --kz-kbd-depth: rgba(255, 255, 255, 0.14);
    --kz-kbd-soft: rgba(255, 255, 255, 0.07);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
