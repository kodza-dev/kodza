# Underline Link

[![Underline Link, live on kodza.dev](https://kodza.dev/anim/hover-link-text-underline/og.jpg)](https://kodza.dev/components/hover-link-text-underline/)

An underline that slides in from the left and leaves through the right, or the reverse. Follows the text across lines, like a pen.

**[Live demo](https://kodza.dev/components/hover-link-text-underline/)** · Links · HTML and CSS only · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-hover-link-text-underline.html`](kodza-hover-link-text-underline.html) | 0.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-hover-link-text-underline.css`](kodza-hover-link-text-underline.css) | 3.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-hover-link-text-underline.css">`
2. Paste the HTML where the component goes.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/hover-link-text-underline/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Use Kodza Underline Link for my navigation links.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-underline` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-underline-text` | `currentColor` |  |
| `--kz-underline-color` | `currentColor` |  |
| `--kz-underline-thickness` | `0.07em` |  |
| `--kz-underline-offset` | `0.08em` |  |
| `--kz-underline-duration` | `0.6s` |  |
| `--kz-underline-ease` | `cubic-bezier(0.76, 0, 0.24, 1)` |  |

- Modifiers: `.kodza-underline--retract`

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
