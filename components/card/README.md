# Card

[![Card, live on kodza.dev](https://kodza.dev/anim/card/og.jpg)](https://kodza.dev/components/card/)

An editorial card, clickable as a whole through one link: the image drifts closer, the border firms up and an arrow slides in.

**[Live demo](https://kodza.dev/components/card/)** · Cards · HTML and CSS only · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-card.html`](kodza-card.html) | 1.4 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-card.css`](kodza-card.css) | 11.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-card.css">`
2. Paste the HTML where the component goes.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/card/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Lay out my blog posts as Kodza Cards.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-card` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-card-bg` | `#ffffff` |  |
| `--kz-card-fg` | `#0a0a0a` |  |
| `--kz-card-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-card-border` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-card-border-hover` | `rgba(10, 10, 10, 0.32)` |  |
| `--kz-card-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-card-pad` | `28px` |  |
| `--kz-card-ratio` | `4 / 3` |  |
| `--kz-card-duration` | `0.9s` |  |
| `--kz-card-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-card--horizontal`, `.kodza-card--text`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-card {
    --kz-card-bg: #161616;
    --kz-card-fg: #f2f2f0;
    --kz-card-muted: rgba(242, 242, 240, 0.62);
    --kz-card-border: rgba(255, 255, 255, 0.12);
    --kz-card-border-hover: rgba(255, 255, 255, 0.4);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
