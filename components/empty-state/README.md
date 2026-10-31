# Empty State

[![Empty State, live on kodza.dev](https://kodza.dev/anim/empty-state/og.jpg)](https://kodza.dev/components/empty-state/)

What a list shows when it is empty: a CSS drawing that answers when you come near, a line in a human voice and the next step. A second take for searches that find nothing.

**[Live demo](https://kodza.dev/components/empty-state/)** · Feedback & loading · HTML and CSS only · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-empty-state.html`](kodza-empty-state.html) | 1.4 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-empty-state.css`](kodza-empty-state.css) | 14.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-empty-state.css">`
2. Paste the HTML where the component goes.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/empty-state/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Show a Kodza Empty State when my search finds nothing.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-empty` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-empty-bg` | `transparent` |  |
| `--kz-empty-fg` | `#0a0a0a` |  |
| `--kz-empty-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-empty-line` | `rgba(10, 10, 10, 0.18)` |  |
| `--kz-empty-soft` | `rgba(10, 10, 10, 0.06)` |  |
| `--kz-empty-card` | `#ffffff` |  |
| `--kz-empty-ink` | `#0a0a0a` |  |
| `--kz-empty-on-ink` | `#ffffff` |  |
| `--kz-empty-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-empty--search`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-empty {
    --kz-empty-fg: #f2f2f0;
    --kz-empty-muted: rgba(242, 242, 240, 0.62);
    --kz-empty-line: rgba(255, 255, 255, 0.2);
    --kz-empty-soft: rgba(255, 255, 255, 0.08);
    --kz-empty-card: #161616;
    --kz-empty-ink: #f2f2f0;
    --kz-empty-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
