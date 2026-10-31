# Hero Centered

[![Hero Centered, live on kodza.dev](https://kodza.dev/anim/hero-centered/og.jpg)](https://kodza.dev/components/hero-centered/)

A centred hero with an announcement pill, a headline whose lines rise out of their masks, one sentence and two pill buttons. CSS only, the entrance plays on load.

**[Live demo](https://kodza.dev/components/hero-centered/)** · Hero · HTML and CSS only · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-hero-centered.html`](kodza-hero-centered.html) | 1.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-hero-centered.css`](kodza-hero-centered.css) | 16.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-hero-centered.css">`
2. Paste the HTML where the component goes.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/hero-centered/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Hero Centered to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-hero-centered` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-hero-centered-ink` | `#0a0a0a` |  |
| `--kz-hero-centered-paper` | `#f2f2f0` |  |
| `--kz-hero-centered-dim` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-hero-centered-soft` | `rgba(10, 10, 10, 0.07)` |  |
| `--kz-hero-centered-bg` | `transparent` |  |
| `--kz-hero-centered-width` | `1040px` |  |
| `--kz-hero-centered-pad-y` | `clamp(88px, 11vw, 168px)` |  |
| `--kz-hero-centered-gutter` | `clamp(16px, 4vw, 40px)` |  |
| `--kz-hero-centered-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-hero-centered-glide` | `cubic-bezier(0.6, 0, 0.1, 1)` |  |
| `--kz-hero-centered-soft-ease` | `cubic-bezier(0.25, 1, 0.5, 1)` |  |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-hero-centered {
    --kz-hero-centered-ink: #f2f2f0;
    --kz-hero-centered-paper: #0a0a0a;
    --kz-hero-centered-dim: rgba(242, 242, 240, 0.64);
    --kz-hero-centered-soft: rgba(242, 242, 240, 0.1);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
