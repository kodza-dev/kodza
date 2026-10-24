# Dropdown Menu

[![Dropdown Menu, live on kodza.dev](https://kodza.dev/anim/dropdown-menu/og.jpg)](https://kodza.dev/components/dropdown-menu/)

A menu that unrolls from its button, with a highlight that slides from item to item. Actions or choices, arrows and first letters.

**[Live demo](https://kodza.dev/components/dropdown-menu/)** · Navigation · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-dropdown-menu.html`](kodza-dropdown-menu.html) | 2.0 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-dropdown-menu.css`](kodza-dropdown-menu.css) | 14.1 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-dropdown-menu.js`](kodza-dropdown-menu.js) | 9.5 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-dropdown-menu.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-dropdown-menu.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/dropdown-menu/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Put my account links in a Kodza Dropdown Menu.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-dropdown` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-menu-bg` | `#ffffff` |  |
| `--kz-menu-fg` | `#0a0a0a` |  |
| `--kz-menu-muted` | `rgba(10, 10, 10, 0.58)` |  |
| `--kz-menu-border` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-menu-soft` | `rgba(10, 10, 10, 0.06)` |  |
| `--kz-menu-shadow` | `0 18px 40px -16px rgba(10, 10, 10, 0.3)` |  |
| `--kz-menu-width` | `220px` |  |
| `--kz-menu-duration` | `0.35s` |  |
| `--kz-menu-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Events: `kodza:select`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-dropdown {
    --kz-menu-bg: #161616;
    --kz-menu-fg: #f2f2f0;
    --kz-menu-muted: rgba(242, 242, 240, 0.52);
    --kz-menu-border: rgba(255, 255, 255, 0.12);
    --kz-menu-soft: rgba(255, 255, 255, 0.08);
    --kz-menu-shadow: 0 18px 40px -16px rgba(0, 0, 0, 0.8);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the button | `Enter` / `Space` / `ArrowDown` | Opens it on the first item |
|  | `ArrowUp` | Opens it on the last item |
| In the menu | `ArrowDown` / `ArrowUp` | Next or previous item, round and round |
|  | `Home` / `End` | First or last item |
|  | a letter | Next item starting with that letter |
|  | `Enter` / `Space` | Picks it, focus back on the button |
|  | `Tab` | Closes it and moves on |
| Anywhere, while it's open | `Escape` | Closes it, focus back on the button |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
