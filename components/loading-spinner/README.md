# Spinner

[![Spinner, live on kodza.dev](https://kodza.dev/anim/loading-spinner/og.jpg)](https://kodza.dev/components/loading-spinner/)

A loading status sized on its text: a breathing ring, twelve bars, three dots or a terminal braille cell. Add .is-done and a tick draws itself while the words roll.

**[Live demo](https://kodza.dev/components/loading-spinner/)** · Feedback & loading · HTML and CSS only · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-loading-spinner.html`](kodza-loading-spinner.html) | 2.7 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-loading-spinner.css`](kodza-loading-spinner.css) | 10.0 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-loading-spinner.css">`
2. Paste the HTML where the component goes.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/loading-spinner/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Show a Kodza Spinner while my results load.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-spinner` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-spinner-size` | `1.15em` |  |
| `--kz-spinner-stroke` | `2.2` |  |
| `--kz-spinner-track` | `0.16` |  |
| `--kz-spinner-tempo` | `1` |  |
| `--kz-spinner-gap` | `0.6em` |  |
| `--kz-spinner-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-spinner-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-spinner--terminal`

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
