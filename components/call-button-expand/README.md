# Call Button

[![Call Button, live on kodza.dev](https://kodza.dev/anim/call-button-expand/og.jpg)](https://kodza.dev/components/call-button-expand/)

A round phone icon that opens into a full "Book a call" button, with a little ring. Stays open on touch screens. Pure CSS.

**[Live demo](https://kodza.dev/components/call-button-expand/)** · Buttons · HTML and CSS only · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-call-button-expand.html`](kodza-call-button-expand.html) | 0.4 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-call-button-expand.css`](kodza-call-button-expand.css) | 6.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-call-button-expand.css">`
2. Paste the HTML where the component goes.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/call-button-expand/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Call Button to my contact section.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-call-button` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-call-bg` | `#0a0a0a` |  |
| `--kz-call-fg` | `#ffffff` |  |
| `--kz-call-size` | `52px` |  |
| `--kz-call-duration` | `0.6s` |  |
| `--kz-call-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-call-button {
    --kz-call-bg: #ffffff;
    --kz-call-fg: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
