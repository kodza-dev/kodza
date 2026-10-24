# Staggered Horizontal Menu

[![Staggered Horizontal Menu, live on kodza.dev](https://kodza.dev/anim/menu-horizontal-stagger-reverse/og.jpg)](https://kodza.dev/components/menu-horizontal-stagger-reverse/)

A button that lets its links out one by one, nearest first, and calls them back in reverse. Its label rolls to "Close". No GSAP.

**[Live demo](https://kodza.dev/components/menu-horizontal-stagger-reverse/)** · Navigation · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-menu-horizontal-stagger-reverse.html`](kodza-menu-horizontal-stagger-reverse.html) | 1.3 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-menu-horizontal-stagger-reverse.css`](kodza-menu-horizontal-stagger-reverse.css) | 10.5 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-menu-horizontal-stagger-reverse.js`](kodza-menu-horizontal-stagger-reverse.js) | 4.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-menu-horizontal-stagger-reverse.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-menu-horizontal-stagger-reverse.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/menu-horizontal-stagger-reverse/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Fold my header links into a Kodza Staggered Horizontal Menu.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-stagger-menu` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-stagger-fg` | `#0a0a0a` |  |
| `--kz-stagger-muted` | `rgba(10, 10, 10, 0.58)` |  |
| `--kz-stagger-ink` | `#0a0a0a` |  |
| `--kz-stagger-on-ink` | `#ffffff` |  |
| `--kz-stagger-step` | `50ms` |  |
| `--kz-stagger-travel` | `14px` |  |
| `--kz-stagger-duration` | `0.45s` |  |
| `--kz-stagger-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-stagger-menu--right`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-stagger-menu {
    --kz-stagger-fg: #f2f2f0;
    --kz-stagger-muted: rgba(242, 242, 240, 0.6);
    --kz-stagger-ink: #f2f2f0;
    --kz-stagger-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the button | `Enter` / `Space` | Opens or closes the links |
| On the button or a link, while it's open | `Escape` | Closes it, focus back on the button |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
