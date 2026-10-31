# Morph Button

[![Morph Button, live on kodza.dev](https://kodza.dev/anim/button-svg-morph/og.jpg)](https://kodza.dev/components/button-svg-morph/)

A pill that tightens into a circle on hover while its label gives way to an arrow. The clickable area never moves. Pure CSS.

**[Live demo](https://kodza.dev/components/button-svg-morph/)** · Buttons · HTML and CSS only · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-button-svg-morph.html`](kodza-button-svg-morph.html) | 0.3 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-button-svg-morph.css`](kodza-button-svg-morph.css) | 8.7 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-button-svg-morph.css">`
2. Paste the HTML where the component goes.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/button-svg-morph/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Make my View project link a Kodza Morph Button.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-morph-button` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-morph-bg` | `#0a0a0a` |  |
| `--kz-morph-fg` | `#ffffff` |  |
| `--kz-morph-height` | `52px` |  |
| `--kz-morph-pad-x` | `34px` |  |
| `--kz-morph-duration` | `0.6s` |  |
| `--kz-morph-ease` | `cubic-bezier(0.76, 0, 0.24, 1)` |  |
| `--kz-morph-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |  |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-morph-button {
    --kz-morph-bg: #ffffff;
    --kz-morph-fg: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
