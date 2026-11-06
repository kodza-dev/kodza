# Progressive Blur

[![Progressive Blur, live on kodza.dev](https://kodza.dev/anim/progressive-blur/og.jpg)](https://kodza.dev/components/progressive-blur/)

A blur that builds up toward an edge with no hard line, eight backdrop-filter layers deep. Under a photo caption, under a bar on top of a list, at the bottom of what scrolls. CSS only.

**[Live demo](https://kodza.dev/components/progressive-blur/)** · Image effects · HTML and CSS only · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-progressive-blur.html`](kodza-progressive-blur.html) | 5.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-progressive-blur.css`](kodza-progressive-blur.css) | 16.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-progressive-blur.css">`
2. Paste the HTML where the component goes.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/progressive-blur/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Progressive Blur to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-progressive-blur` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-progressive-blur-height` | `200px` | the blur at the bottom: about twice the caption on it |
| `--kz-progressive-blur-top-height` | `72px` | the blur under a bar on top: the bar and a little more |
| `--kz-progressive-blur-strength` | `30px` | at the very edge; each layer before it is half as strong |
| `--kz-progressive-blur-tint` | `color-mix(in srgb, var(--kz-color-page, #f2f2f0) 62%, transparent)` | a veil that thickens toward the edge, for the words on it |
| `--kz-progressive-blur-ratio` | `4 / 5` |  |
| `--kz-progressive-blur-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-progressive-blur-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-progressive-blur-muted` | `color-mix(in srgb, var(--kz-progressive-blur-ink) 66%, transparent)` |  |
| `--kz-progressive-blur-placeholder` | `color-mix(in srgb, var(--kz-progressive-blur-ink) 6%, transparent)` | under a photo while it loads |
| `--kz-progressive-blur-list-height` | `450px` |  |
| `--kz-progressive-blur-surface` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-progressive-blur-border` | `color-mix(in srgb, var(--kz-progressive-blur-ink) 10%, transparent)` |  |
| `--kz-progressive-blur-line` | `color-mix(in srgb, var(--kz-progressive-blur-ink) 8%, transparent)` |  |
| `--kz-progressive-blur-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |

- Modifiers: `.kodza-progressive-blur--list`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-progressive-blur {
    --kz-progressive-blur-tint: rgba(10, 10, 10, 0.7);
    --kz-progressive-blur-ink: #f2f2f0;
    --kz-progressive-blur-muted: rgba(242, 242, 240, 0.7);
    --kz-progressive-blur-placeholder: rgba(255, 255, 255, 0.06);
  }

  .kodza-progressive-blur--list {
    --kz-progressive-blur-tint: rgba(22, 22, 22, 0.72);
    --kz-progressive-blur-surface: #161616;
    --kz-progressive-blur-border: rgba(255, 255, 255, 0.12);
    --kz-progressive-blur-line: rgba(255, 255, 255, 0.08);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
