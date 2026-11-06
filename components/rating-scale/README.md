# Rating Scale

[![Rating Scale, live on kodza.dev](https://kodza.dev/anim/rating-scale/og.jpg)](https://kodza.dev/components/rating-scale/)

A score on real radio buttons, from 0 to 10 or 1 to 5. The picked score fills with ink from the bottom, its end lights up, and an optional follow-up question unfolds and rolls to match the score. Pure CSS.

**[Live demo](https://kodza.dev/components/rating-scale/)** · Forms · HTML and CSS only · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-rating-scale.html`](kodza-rating-scale.html) | 6.3 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-rating-scale.css`](kodza-rating-scale.css) | 19.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-rating-scale.css">`
2. Paste the HTML where the component goes.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/rating-scale/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Rating Scale to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-rating-scale` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-rating-scale-bg` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-rating-scale-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-rating-scale-muted` | `color-mix(in srgb, var(--kz-rating-scale-fg) 58%, transparent)` |  |
| `--kz-rating-scale-border` | `color-mix(in srgb, var(--kz-rating-scale-fg) 10%, transparent)` |  |
| `--kz-rating-scale-border-hover` | `color-mix(in srgb, var(--kz-rating-scale-fg) 28%, transparent)` |  |
| `--kz-rating-scale-ink` | `var(--kz-color-accent, var(--kz-rating-scale-fg))` |  |
| `--kz-rating-scale-on-ink` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-rating-scale-soft` | `color-mix(in srgb, var(--kz-rating-scale-fg) 6%, transparent)` | the halo of the follow-up box |
| `--kz-rating-scale-shadow` | `rgba(10, 10, 10, 0.18)` | under a lifted score |
| `--kz-rating-scale-cell` | `44px` | a score's height, and its width when there is room |
| `--kz-rating-scale-gap` | `4px` |  |
| `--kz-rating-scale-lift` | `3px` | how far the score under the pointer rises |

- Modifiers: `.kodza-rating-scale--fill`
- Attributes: `data-end` (e.g. `low`, `high`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-rating-scale {
    --kz-rating-scale-bg: #161616;
    --kz-rating-scale-fg: #f2f2f0;
    --kz-rating-scale-muted: rgba(242, 242, 240, 0.62);
    --kz-rating-scale-border: rgba(255, 255, 255, 0.12);
    --kz-rating-scale-border-hover: rgba(255, 255, 255, 0.3);
    --kz-rating-scale-ink: #f2f2f0;
    --kz-rating-scale-on-ink: #0a0a0a;
    --kz-rating-scale-soft: rgba(255, 255, 255, 0.08);
    --kz-rating-scale-shadow: rgba(0, 0, 0, 0.6);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a score | `ArrowRight` / `ArrowDown` | Picks the next score, round and round |
|  | `ArrowLeft` / `ArrowUp` | Picks the previous score, round and round |
|  | `Space` | Picks the focused score |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
