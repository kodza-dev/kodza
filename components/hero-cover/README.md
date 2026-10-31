# Hero Cover

[![Hero Cover, live on kodza.dev](https://kodza.dev/anim/hero-cover/og.jpg)](https://kodza.dev/components/hero-cover/)

A cover hero: a full-width picture under a monochrome veil with the title at the bottom left. The picture opens from the top edge and settles, the title lines rise. CSS only.

**[Live demo](https://kodza.dev/components/hero-cover/)** · Hero · HTML and CSS only · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-hero-cover.html`](kodza-hero-cover.html) | 1.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-hero-cover.css`](kodza-hero-cover.css) | 17.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-hero-cover.css">`
2. Paste the HTML where the component goes.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/hero-cover/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Hero Cover to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-hero-cover` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-hero-cover-light` | `#f2f2f0` |  |
| `--kz-hero-cover-ink` | `#0a0a0a` |  |
| `--kz-hero-cover-dim` | `rgba(242, 242, 240, 0.8)` |  |
| `--kz-hero-cover-faint` | `rgba(242, 242, 240, 0.7)` |  |
| `--kz-hero-cover-glass` | `rgba(242, 242, 240, 0.14)` |  |
| `--kz-hero-cover-shade` | `rgba(10, 10, 10, 0.8)` |  |
| `--kz-hero-cover-base` | `#1c1c1c` |  |
| `--kz-hero-cover-bg` | `transparent` |  |
| `--kz-hero-cover-height` | `clamp(560px, 54vw, 800px)` |  |
| `--kz-hero-cover-gutter` | `clamp(12px, 2vw, 24px)` |  |
| `--kz-hero-cover-pad` | `clamp(24px, 4.5vw, 64px)` |  |
| `--kz-hero-cover-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-hero-cover-position` | `50% 50%` |  |
| `--kz-hero-cover-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-hero-cover-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-hero-cover-glide` | `cubic-bezier(0.6, 0, 0.1, 1)` |  |
| `--kz-hero-cover-soft-ease` | `cubic-bezier(0.25, 1, 0.5, 1)` |  |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-hero-cover {
    --kz-hero-cover-base: #161616;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
