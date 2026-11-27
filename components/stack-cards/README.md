# Stack Cards

[![Stack Cards, live on kodza.dev](https://kodza.dev/anim/stack-cards/og.jpg)](https://kodza.dev/components/stack-cards/)

A pile of cards you throw: the top one leaves on the side you threw it, turned by your speed, and slides back under while the others step forward. Prev, Next, arrow keys and a rolling counter.

**[Live demo](https://kodza.dev/components/stack-cards/)** · Cards · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-stack-cards.html`](kodza-stack-cards.html) | 5.6 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-stack-cards.css`](kodza-stack-cards.css) | 24.1 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-stack-cards.js`](kodza-stack-cards.js) | 18.1 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-stack-cards.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-stack-cards.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/stack-cards/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Stack Cards to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-stack-cards]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-stack-cards-bg` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-stack-cards-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-stack-cards-muted` | `color-mix(in srgb, var(--kz-stack-cards-fg) 62%, transparent)` |  |
| `--kz-stack-cards-rule` | `color-mix(in srgb, var(--kz-stack-cards-fg) 14%, transparent)` |  |
| `--kz-stack-cards-border` | `color-mix(in srgb, var(--kz-stack-cards-fg) 10%, transparent)` |  |
| `--kz-stack-cards-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-stack-cards-pad` | `28px` |  |
| `--kz-stack-cards-min-height` | `300px` |  |
| `--kz-stack-cards-step` | `14px` | how far each card behind shows below the one in front |
| `--kz-stack-cards-shrink` | `0.05` | how much narrower each card behind is |
| `--kz-stack-cards-shade` | `5%` | how much ink each card behind takes |
| `--kz-stack-cards-fan` | `5deg` | --fan: how far each card behind turns when the hand opens |
| `--kz-stack-cards-stagger` | `0.04s` | the delay between two cards of the pile when they move |
| `--kz-stack-cards-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-stack-cards-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |

- Modifiers: `.kodza-stack-cards--fan`
- Attributes: `data-kodza-stack-cards`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-stack-cards {
    --kz-stack-cards-bg: #161616;
    --kz-stack-cards-fg: #f2f2f0;
    --kz-stack-cards-border: rgba(255, 255, 255, 0.12);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the top card or a button | `ArrowRight` | Sends the top card under the pile, the next one comes up |
|  | `ArrowLeft` | Brings the bottom card back on top |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
