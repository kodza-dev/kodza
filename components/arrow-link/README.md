# Arrow Link

[![Arrow Link, live on kodza.dev](https://kodza.dev/anim/arrow-link/og.jpg)](https://kodza.dev/components/arrow-link/)

A link that points the way: at rest a chevron, on hover the shaft draws itself in and the head moves on, › becomes →. A back variant points the other way. Pure CSS.

**[Live demo](https://kodza.dev/components/arrow-link/)** · Links · HTML and CSS only · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-arrow-link.html`](kodza-arrow-link.html) | 0.6 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-arrow-link.css`](kodza-arrow-link.css) | 4.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-arrow-link.css">`
2. Paste the HTML where the component goes.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/arrow-link/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Use the Kodza Arrow Link for the Read more links on my blog.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-arrow-link` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-arrow-link-size` | `0.82em` |  |
| `--kz-arrow-link-gap` | `0.3em` |  |
| `--kz-arrow-link-duration` | `0.45s` |  |
| `--kz-arrow-link-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-arrow-link--back`

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
