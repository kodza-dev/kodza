# Split Button

[![Split Button, live on kodza.dev](https://kodza.dev/anim/split-button/og.jpg)](https://kodza.dev/components/split-button/)

The main action on the left, the other options behind an arrow. One tint slides between the halves; pick another way to do it and the label rolls over, the button easing to its new width.

**[Live demo](https://kodza.dev/components/split-button/)** · Buttons · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-split-button.html`](kodza-split-button.html) | 2.3 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-split-button.css`](kodza-split-button.css) | 15.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-split-button.js`](kodza-split-button.js) | 13.4 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-split-button.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-split-button.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/split-button/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Split Button to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-split` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-split-bg` | `#0a0a0a` |  |
| `--kz-split-fg` | `#ffffff` |  |
| `--kz-split-border` | `transparent` |  |
| `--kz-split-divider` | `rgba(255, 255, 255, 0.22)` |  |
| `--kz-split-tint` | `rgba(255, 255, 255, 0.14)` | the hover, under one half |
| `--kz-split-height` | `52px` |  |
| `--kz-split-pad-x` | `24px` |  |
| `--kz-split-toggle` | `50px` | the arrow's half |
| `--kz-split-menu-bg` | `#ffffff` |  |
| `--kz-split-menu-fg` | `#0a0a0a` |  |
| `--kz-split-menu-muted` | `rgba(10, 10, 10, 0.58)` |  |
| `--kz-split-menu-border` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-split-menu-soft` | `rgba(10, 10, 10, 0.06)` |  |
| `--kz-split-menu-shadow` | `0 18px 40px -16px rgba(10, 10, 10, 0.3)` |  |
| `--kz-split-menu-width` | `240px` |  |
| `--kz-split-duration` | `0.35s` |  |
| `--kz-split-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-split--outline`
- Events: `kodza:select`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-split {
    --kz-split-bg: #f2f2f0;
    --kz-split-fg: #0a0a0a;
    --kz-split-divider: rgba(10, 10, 10, 0.2);
    --kz-split-tint: rgba(10, 10, 10, 0.08);
    --kz-split-menu-bg: #161616;
    --kz-split-menu-fg: #f2f2f0;
    --kz-split-menu-muted: rgba(242, 242, 240, 0.52);
    --kz-split-menu-border: rgba(255, 255, 255, 0.12);
    --kz-split-menu-soft: rgba(255, 255, 255, 0.08);
    --kz-split-menu-shadow: 0 18px 40px -16px rgba(0, 0, 0, 0.8);
  }

  .kodza-split--outline {
    --kz-split-bg: transparent;
    --kz-split-fg: #f2f2f0;
    --kz-split-border: rgba(255, 255, 255, 0.85);
    --kz-split-divider: rgba(255, 255, 255, 0.22);
    --kz-split-tint: rgba(255, 255, 255, 0.1);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the arrow | `Enter` / `Space` / `ArrowDown` | Opens it on the checked item, or the first |
|  | `ArrowUp` | Opens it on the last item |
| In the menu | `ArrowDown` / `ArrowUp` | Next or previous item, round and round |
|  | `Home` / `End` | First or last item |
|  | a letter | Next item starting with that letter |
|  | `Enter` / `Space` | Picks it, focus back on the arrow |
|  | `Tab` | Closes it and moves on |
| Anywhere, while it's open | `Escape` | Closes it, focus back on the arrow |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
