# Switch

[![Switch, live on kodza.dev](https://kodza.dev/anim/switch-toggle/og.jpg)](https://kodza.dev/components/switch-toggle/)

A real checkbox redrawn as a switch: the ink fills the track behind the thumb, the thumb stretches while pressed and springs into place. Labels, toolbars too.

**[Live demo](https://kodza.dev/components/switch-toggle/)** · Forms · HTML and CSS only · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-switch-toggle.html`](kodza-switch-toggle.html) | 1.8 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-switch-toggle.css`](kodza-switch-toggle.css) | 10.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-switch-toggle.css">`
2. Paste the HTML where the component goes.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/switch-toggle/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Use Kodza Switch for the toggles of my settings page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-switch` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-switch-bg` | `#ffffff` |  |
| `--kz-switch-fg` | `#0a0a0a` |  |
| `--kz-switch-muted` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-switch-off` | `rgba(10, 10, 10, 0.14)` |  |
| `--kz-switch-ink` | `#0a0a0a` |  |
| `--kz-switch-thumb` | `#ffffff` |  |
| `--kz-switch-width` | `44px` |  |
| `--kz-switch-height` | `26px` |  |
| `--kz-switch-gap` | `3px` |  |
| `--kz-switch-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-switch-spring` | `cubic-bezier(0.34, 1.4, 0.64, 1)` |  |

- Modifiers: `.kodza-switch--inline`, `.kodza-switch--labels`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-switch {
    --kz-switch-bg: #161616;
    --kz-switch-fg: #f2f2f0;
    --kz-switch-muted: rgba(242, 242, 240, 0.62);
    --kz-switch-off: rgba(255, 255, 255, 0.16);
    --kz-switch-ink: #f2f2f0;
    --kz-switch-thumb: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
