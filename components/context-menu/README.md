# Context Menu

[![Context Menu, live on kodza.dev](https://kodza.dev/anim/context-menu/og.jpg)](https://kodza.dev/components/context-menu/)

A right-click menu that grows from the exact point you clicked, stays on screen and works from the keyboard with Shift + F10.

**[Live demo](https://kodza.dev/components/context-menu/)** · Navigation · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-context-menu.html`](kodza-context-menu.html) | 1.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-context-menu.css`](kodza-context-menu.css) | 9.0 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-context-menu.js`](kodza-context-menu.js) | 9.6 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-context-menu.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-context-menu.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/context-menu/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add a Kodza Context Menu to the files in my dashboard.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-context-menu` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-ctx-bg` | `#ffffff` |  |
| `--kz-ctx-fg` | `#0a0a0a` |  |
| `--kz-ctx-muted` | `rgba(10, 10, 10, 0.58)` |  |
| `--kz-ctx-border` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-ctx-soft` | `rgba(10, 10, 10, 0.06)` |  |
| `--kz-ctx-dots` | `rgba(10, 10, 10, 0.14)` |  |
| `--kz-ctx-shadow` | `0 18px 40px -16px rgba(10, 10, 10, 0.3)` |  |
| `--kz-ctx-width` | `230px` |  |
| `--kz-ctx-duration` | `0.22s` |  |
| `--kz-ctx-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Events: `kodza:select`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-context-menu {
    --kz-ctx-bg: #161616;
    --kz-ctx-fg: #f2f2f0;
    --kz-ctx-muted: rgba(242, 242, 240, 0.52);
    --kz-ctx-border: rgba(255, 255, 255, 0.12);
    --kz-ctx-soft: rgba(255, 255, 255, 0.08);
    --kz-ctx-dots: rgba(255, 255, 255, 0.14);
    --kz-ctx-shadow: 0 18px 40px -16px rgba(0, 0, 0, 0.8);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the area | `ContextMenu` / `Shift+F10` | Opens the menu on the first item |
| In the menu | `ArrowDown` / `ArrowUp` | Next or previous item, round and round |
|  | `Home` / `End` | First or last item |
|  | a letter | Next item starting with that letter |
|  | `Enter` / `Space` | Picks it, focus back on the area |
|  | `Escape` / `Tab` | Closes it, focus back on the area |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
