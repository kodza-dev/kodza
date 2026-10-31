# Sidebar Menu

[![Sidebar Menu, live on kodza.dev](https://kodza.dev/anim/sidebar-toggle-menu/og.jpg)](https://kodza.dev/components/sidebar-toggle-menu/)

A side panel that slides in over the page, then big links rise one by one. A real dialog: focus kept inside, Escape to leave. No GSAP.

**[Live demo](https://kodza.dev/components/sidebar-toggle-menu/)** · Navigation · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-sidebar-toggle-menu.html`](kodza-sidebar-toggle-menu.html) | 1.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-sidebar-toggle-menu.css`](kodza-sidebar-toggle-menu.css) | 13.6 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-sidebar-toggle-menu.js`](kodza-sidebar-toggle-menu.js) | 8.3 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-sidebar-toggle-menu.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-sidebar-toggle-menu.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/sidebar-toggle-menu/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Make my mobile menu a Kodza Sidebar Menu.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-sidebar` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-sidebar-bg` | `#ffffff` |  |
| `--kz-sidebar-fg` | `#0a0a0a` |  |
| `--kz-sidebar-muted` | `rgba(10, 10, 10, 0.5)` |  |
| `--kz-sidebar-border` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-sidebar-ink` | `#0a0a0a` |  |
| `--kz-sidebar-on-ink` | `#ffffff` |  |
| `--kz-sidebar-backdrop` | `rgba(10, 10, 10, 0.32)` |  |
| `--kz-sidebar-width` | `496px` |  |
| `--kz-sidebar-size` | `calc(clamp(34px, 5vw, 48px) * var(--kz-font-display-scale, 1))` |  |
| `--kz-sidebar-duration` | `0.7s` |  |
| `--kz-sidebar-ease` | `cubic-bezier(0.76, 0, 0.24, 1)` |  |
| `--kz-sidebar-rise` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-sidebar {
    --kz-sidebar-bg: #161616;
    --kz-sidebar-fg: #f2f2f0;
    --kz-sidebar-muted: rgba(242, 242, 240, 0.52);
    --kz-sidebar-border: rgba(255, 255, 255, 0.12);
    --kz-sidebar-ink: #f2f2f0;
    --kz-sidebar-on-ink: #0a0a0a;
    --kz-sidebar-backdrop: rgba(0, 0, 0, 0.6);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the button | `Enter` / `Space` | Opens it, focus goes into the panel |
| In the panel | `Tab` / `Shift+Tab` | Next or previous control, the page behind is out of reach |
| Anywhere, while it's open | `Escape` | Closes it, focus back on the button |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
