# Toggle Group

[![Toggle Group, live on kodza.dev](https://kodza.dev/anim/toggle-group/og.jpg)](https://kodza.dev/components/toggle-group/)

Several on/off choices on real checkboxes. A picked option fills with ink from its centre and its plus turns into a check; picked days side by side join into one band. Pure CSS.

**[Live demo](https://kodza.dev/components/toggle-group/)** · Forms · HTML and CSS only · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-toggle-group.html`](kodza-toggle-group.html) | 4.6 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-toggle-group.css`](kodza-toggle-group.css) | 17.0 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-toggle-group.css">`
2. Paste the HTML where the component goes.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/toggle-group/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Toggle Group to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-toggle-group` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-toggle-group-bg` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-toggle-group-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-toggle-group-muted` | `color-mix(in srgb, var(--kz-toggle-group-fg) 58%, transparent)` |  |
| `--kz-toggle-group-border` | `color-mix(in srgb, var(--kz-toggle-group-fg) 10%, transparent)` |  |
| `--kz-toggle-group-border-hover` | `color-mix(in srgb, var(--kz-toggle-group-fg) 28%, transparent)` |  |
| `--kz-toggle-group-ink` | `var(--kz-color-accent, var(--kz-toggle-group-fg))` |  |
| `--kz-toggle-group-on-ink` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-toggle-group-height` | `40px` | one option; --joined: its diameter |
| `--kz-toggle-group-gap` | `6px` | the room between options |

- Modifiers: `.kodza-toggle-group--joined`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-toggle-group {
    --kz-toggle-group-bg: #161616;
    --kz-toggle-group-fg: #f2f2f0;
    --kz-toggle-group-muted: rgba(242, 242, 240, 0.62);
    --kz-toggle-group-border: rgba(255, 255, 255, 0.12);
    --kz-toggle-group-border-hover: rgba(255, 255, 255, 0.3);
    --kz-toggle-group-ink: #f2f2f0;
    --kz-toggle-group-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On an option | `Space` | Turns the option on or off |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
