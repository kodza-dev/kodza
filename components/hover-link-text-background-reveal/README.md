# Highlight Link

[![Highlight Link, live on kodza.dev](https://kodza.dev/anim/hover-link-text-background-reveal/og.jpg)](https://kodza.dev/components/hover-link-text-background-reveal/)

A highlighter stroke that sweeps behind the link text, or a solid block that flips the text to white exactly under its edge.

**[Live demo](https://kodza.dev/components/hover-link-text-background-reveal/)** · Links · HTML and CSS only · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-hover-link-text-background-reveal.html`](kodza-hover-link-text-background-reveal.html) | 0.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-hover-link-text-background-reveal.css`](kodza-hover-link-text-background-reveal.css) | 4.6 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-hover-link-text-background-reveal.css">`
2. Paste the HTML where the component goes.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/hover-link-text-background-reveal/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Use Kodza Highlight Link for the links in my articles.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-highlight` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-highlight-text` | `currentColor` |  |
| `--kz-highlight-mark` | `rgba(10, 10, 10, 0.12)` |  |
| `--kz-highlight-height` | `100%` |  |
| `--kz-highlight-duration` | `0.55s` |  |
| `--kz-highlight-ease` | `cubic-bezier(0.76, 0, 0.24, 1)` |  |

- Modifiers: `.kodza-highlight--invert`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-highlight {
    --kz-highlight-mark: rgba(255, 255, 255, 0.2);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
