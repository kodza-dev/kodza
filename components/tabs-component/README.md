# Tabs

[![Tabs, live on kodza.dev](https://kodza.dev/anim/tabs-component/og.jpg)](https://kodza.dev/components/tabs-component/)

Tabs with a pill (or a line) that slides to the chosen one, a panel that comes in from its side, and the full keyboard pattern.

**[Live demo](https://kodza.dev/components/tabs-component/)** · Navigation · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-tabs-component.html`](kodza-tabs-component.html) | 2.0 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-tabs-component.css`](kodza-tabs-component.css) | 9.5 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-tabs-component.js`](kodza-tabs-component.js) | 7.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-tabs-component.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-tabs-component.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/tabs-component/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Split my product details into Kodza Tabs.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-tabs` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-tabs-bg` | `#ffffff` |  |
| `--kz-tabs-fg` | `#0a0a0a` |  |
| `--kz-tabs-muted` | `rgba(10, 10, 10, 0.58)` |  |
| `--kz-tabs-border` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-tabs-ink` | `#0a0a0a` |  |
| `--kz-tabs-on-ink` | `#ffffff` |  |
| `--kz-tabs-width` | `520px` |  |
| `--kz-tabs-duration` | `0.5s` |  |
| `--kz-tabs-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-tabs--line`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-tabs {
    --kz-tabs-bg: #161616;
    --kz-tabs-fg: #f2f2f0;
    --kz-tabs-muted: rgba(242, 242, 240, 0.62);
    --kz-tabs-border: rgba(255, 255, 255, 0.12);
    --kz-tabs-ink: #f2f2f0;
    --kz-tabs-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a tab | `ArrowRight` / `ArrowLeft` | Shows the next or previous tab, round and round |
|  | `Home` / `End` | Shows the first or last tab |
|  | `Tab` | Skips the other tabs, on to the panel |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
