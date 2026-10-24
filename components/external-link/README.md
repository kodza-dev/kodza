# External Link

[![External Link, live on kodza.dev](https://kodza.dev/anim/external-link/og.jpg)](https://kodza.dev/components/external-link/)

A link that leaves the site says so: a line of ink runs under the words to the ↗, which then springs out towards the corner, its shaft stretching after it. Pure CSS.

**[Live demo](https://kodza.dev/components/external-link/)** · Links · HTML and CSS only · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-external-link.html`](kodza-external-link.html) | 0.8 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-external-link.css`](kodza-external-link.css) | 6.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-external-link.css">`
2. Paste the HTML where the component goes.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/external-link/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Mark the links that leave my site with Kodza External Link.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-external-link` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-external-text` | `currentColor` |  |
| `--kz-external-line` | `color-mix(in srgb, currentColor 26%, transparent)` |  |
| `--kz-external-ink` | `currentColor` |  |
| `--kz-external-thickness` | `0.06em` |  |
| `--kz-external-size` | `0.6em` |  |
| `--kz-external-ease` | `cubic-bezier(0.65, 0, 0.35, 1)` |  |
| `--kz-external-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |  |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
