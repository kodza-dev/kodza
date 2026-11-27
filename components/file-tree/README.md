# File Tree

[![File Tree, live on kodza.dev](https://kodza.dev/anim/file-tree/og.jpg)](https://kodza.dev/components/file-tree/)

A project's files from a plain nested list: folders that fold with their height, an icon per kind of file, new, edited and removed marks, and the path you point at rolling into a bar that copies it.

**[Live demo](https://kodza.dev/components/file-tree/)** · Data display · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-file-tree.html`](kodza-file-tree.html) | 1.0 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-file-tree.css`](kodza-file-tree.css) | 21.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-file-tree.js`](kodza-file-tree.js) | 22.9 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-file-tree.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-file-tree.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/file-tree/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza File Tree to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-file-tree]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-file-tree-bg` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-file-tree-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-file-tree-muted` | `color-mix(in srgb, var(--kz-file-tree-fg) 62%, transparent)` | notes, slashes, removed files |
| `--kz-file-tree-border` | `color-mix(in srgb, var(--kz-file-tree-fg) 10%, transparent)` |  |
| `--kz-file-tree-guide` | `color-mix(in srgb, var(--kz-file-tree-fg) 14%, transparent)` | the lines down each level |
| `--kz-file-tree-soft` | `color-mix(in srgb, var(--kz-file-tree-fg) 6%, transparent)` | the row under the pointer |
| `--kz-file-tree-ink` | `var(--kz-color-accent, var(--kz-file-tree-fg))` | the chosen row |
| `--kz-file-tree-on-ink` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-file-tree-row` | `32px` | the height of a row |
| `--kz-file-tree-indent` | `20px` | one level deeper |
| `--kz-file-tree-height` | `none` | past it the tree scrolls, the path bar stays (480px…) |
| `--kz-file-tree-mono` | `var(--kz-font-mono, ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-file-tree-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-closed`, `data-kodza-file-tree`, `data-mark` (e.g. `edit`, `new`, `removed`), `data-root` (e.g. `kodza-theme`), `data-selected`
- Events: `kodza:select`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-file-tree {
    --kz-file-tree-bg: #161616;
    --kz-file-tree-fg: #f2f2f0;
    --kz-file-tree-muted: rgba(242, 242, 240, 0.62);
    --kz-file-tree-border: rgba(255, 255, 255, 0.12);
    --kz-file-tree-guide: rgba(255, 255, 255, 0.16);
    --kz-file-tree-soft: rgba(255, 255, 255, 0.08);
    --kz-file-tree-ink: #f2f2f0;
    --kz-file-tree-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| In the tree | `ArrowDown` / `ArrowUp` | Moves to the next or previous row |
|  | `ArrowRight` | Opens a folder, or goes to its first file |
|  | `ArrowLeft` | Closes a folder, or goes to its parent |
|  | `Home` / `End` | Goes to the first or last row |
|  | `Enter` / `Space` | Opens or closes a folder, chooses a file |
|  | a letter | Goes to the next row starting with that letter |
| On Copy | `Enter` / `Space` | Copies the path of the chosen file |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
