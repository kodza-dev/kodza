# Tooltip

[![Tooltip, live on kodza.dev](https://kodza.dev/anim/tooltip-component/og.jpg)](https://kodza.dev/components/tooltip-component/)

One bubble per group: it waits on the first hover, then glides from button to button, resizing to its words, with the keyboard shortcut inside.

**[Live demo](https://kodza.dev/components/tooltip-component/)** · Overlays · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-tooltip-component.html`](kodza-tooltip-component.html) | 2.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-tooltip-component.css`](kodza-tooltip-component.css) | 9.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-tooltip-component.js`](kodza-tooltip-component.js) | 9.4 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-tooltip-component.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-tooltip-component.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/tooltip-component/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add Kodza Tooltips to the icon buttons of my toolbar.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-tooltip` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-tip-bg` | `#0a0a0a` |  |
| `--kz-tip-fg` | `#ffffff` |  |
| `--kz-tip-muted` | `rgba(255, 255, 255, 0.62)` |  |
| `--kz-tip-key` | `rgba(255, 255, 255, 0.14)` |  |
| `--kz-tip-surface` | `#ffffff` |  |
| `--kz-tip-ink` | `#0a0a0a` |  |
| `--kz-tip-line` | `rgba(10, 10, 10, 0.12)` |  |
| `--kz-tip-soft` | `rgba(10, 10, 10, 0.06)` |  |
| `--kz-tip-delay` | `500ms` |  |
| `--kz-tip-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-tooltip--bottom`, `.kodza-tooltip--toolbar`
- Attributes: `data-keys` (e.g. `⌘ B`, `⌘ I`, `⌘ ⇧ X`, `⌘ K`, `⌘ E`, `⌘ ↵`), `data-tip` (e.g. `Bold`, `Italic`, `Strikethrough`, `Link`, `Code`, `Ship it`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-tooltip {
    --kz-tip-bg: #f2f2f0;
    --kz-tip-fg: #0a0a0a;
    --kz-tip-muted: rgba(10, 10, 10, 0.6);
    --kz-tip-key: rgba(10, 10, 10, 0.08);
    --kz-tip-surface: #161616;
    --kz-tip-ink: #f2f2f0;
    --kz-tip-line: rgba(255, 255, 255, 0.14);
    --kz-tip-soft: rgba(255, 255, 255, 0.08);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| In the toolbar | `ArrowRight` / `ArrowLeft` | Next or previous button, round and round |
|  | `Tab` / `Shift+Tab` | Leaves the toolbar in one stop |
| On a trigger | `Escape` | Hides the tip |
| Anywhere | `Tab` / `Shift+Tab` | Shows the tip of the trigger that gets focus |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
