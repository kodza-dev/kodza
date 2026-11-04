# Choice Cards

[![Choice Cards, live on kodza.dev](https://kodza.dev/anim/choice-cards/og.jpg)](https://kodza.dev/components/choice-cards/)

Cards to compare and pick, on real radio buttons or checkboxes, with a title, a line and an optional price. The picked card's ink border draws itself around it from the corner while a check draws in its mark. Pure CSS.

**[Live demo](https://kodza.dev/components/choice-cards/)** · Forms · HTML and CSS only · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-choice-cards.html`](kodza-choice-cards.html) | 3.8 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-choice-cards.css`](kodza-choice-cards.css) | 13.1 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-choice-cards.css">`
2. Paste the HTML where the component goes.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/choice-cards/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Choice Cards to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-choice-cards` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-choice-cards-bg` | `#ffffff` |  |
| `--kz-choice-cards-fg` | `#0a0a0a` |  |
| `--kz-choice-cards-muted` | `rgba(10, 10, 10, 0.58)` |  |
| `--kz-choice-cards-border` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-choice-cards-border-hover` | `rgba(10, 10, 10, 0.28)` |  |
| `--kz-choice-cards-ink` | `#0a0a0a` |  |
| `--kz-choice-cards-on-ink` | `#ffffff` |  |
| `--kz-choice-cards-width` | `720px` | the whole group, at most |
| `--kz-choice-cards-min` | `190px` | a card never gets narrower: below it, cards stack |
| `--kz-choice-cards-gap` | `12px` |  |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-choice-cards {
    --kz-choice-cards-bg: #161616;
    --kz-choice-cards-fg: #f2f2f0;
    --kz-choice-cards-muted: rgba(242, 242, 240, 0.62);
    --kz-choice-cards-border: rgba(255, 255, 255, 0.12);
    --kz-choice-cards-border-hover: rgba(255, 255, 255, 0.3);
    --kz-choice-cards-ink: #f2f2f0;
    --kz-choice-cards-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a card with a round mark | `ArrowRight` / `ArrowDown` | Picks the next card, round and round |
|  | `ArrowLeft` / `ArrowUp` | Picks the previous card, round and round |
| On a card with a square mark | `Space` | Picks the card or lets it go |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
