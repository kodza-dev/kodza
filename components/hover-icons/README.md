# Hover Icons

[![Hover Icons, live on kodza.dev](https://kodza.dev/anim/hover-icons/og.jpg)](https://kodza.dev/components/hover-icons/)

Stroke icons that act out their meaning on hover or keyboard focus: the bell rings, the bin lifts its lid, the plane flies off and back, the cog turns, refresh spins, the padlock opens. CSS only.

**[Live demo](https://kodza.dev/components/hover-icons/)** · SVG & Drawing · HTML and CSS only · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-hover-icons.html`](kodza-hover-icons.html) | 2.7 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-hover-icons.css`](kodza-hover-icons.css) | 12.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-hover-icons.css">`
2. Paste the HTML where the component goes.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/hover-icons/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Hover Icons to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-hover-icons` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-hover-icons-height` | `40px` |  |
| `--kz-hover-icons-icon` | `18px` |  |
| `--kz-hover-icons-stroke` | `1.75px` | in icon units, 24 across |
| `--kz-hover-icons-ink` | `#0a0a0a` |  |
| `--kz-hover-icons-on-ink` | `#ffffff` | text and icon of the solid pill |
| `--kz-hover-icons-bg` | `#ffffff` |  |
| `--kz-hover-icons-line` | `rgba(10, 10, 10, 0.12)` |  |
| `--kz-hover-icons-line-hover` | `rgba(10, 10, 10, 0.28)` |  |
| `--kz-hover-icons-solid-hover` | `#2a2a2a` |  |
| `--kz-hover-icons-duration` | `0.5s` | cog, lid and padlock; the bell, the plane and the arrows take longer |
| `--kz-hover-icons-ease` | `cubic-bezier(0.34, 1.45, 0.64, 1)` | a small overshoot, so the part clicks into place |

- Modifiers: `.kodza-hover-icons--icon`, `.kodza-hover-icons--solid`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-hover-icons {
    --kz-hover-icons-ink: #f2f2f0;
    --kz-hover-icons-on-ink: #0a0a0a;
    --kz-hover-icons-bg: #161616;
    --kz-hover-icons-line: rgba(255, 255, 255, 0.12);
    --kz-hover-icons-line-hover: rgba(255, 255, 255, 0.26);
    --kz-hover-icons-solid-hover: #ffffff;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
