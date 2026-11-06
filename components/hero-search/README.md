# Hero Search

[![Hero Search, live on kodza.dev](https://kodza.dev/anim/hero-search/og.jpg)](https://kodza.dev/components/hero-search/)

A hero with a real search card: Buy and Rent swap the budget list under a sliding pill, the place field rolls through its examples, the selects unroll like Kodza Select, and the result count rolls in the button.

**[Live demo](https://kodza.dev/components/hero-search/)** · Hero · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-hero-search.html`](kodza-hero-search.html) | 4.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-hero-search.css`](kodza-hero-search.css) | 49.6 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-hero-search.js`](kodza-hero-search.js) | 27.7 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-hero-search.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-hero-search.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/hero-search/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Hero Search to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-hero-search` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-hero-search-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-hero-search-paper` | `var(--kz-color-page, #f2f2f0)` |  |
| `--kz-hero-search-dim` | `color-mix(in srgb, var(--kz-hero-search-ink) 62%, transparent)` |  |
| `--kz-hero-search-faint` | `color-mix(in srgb, var(--kz-hero-search-ink) 60%, transparent)` |  |
| `--kz-hero-search-surface` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-hero-search-line` | `color-mix(in srgb, var(--kz-hero-search-ink) 10%, transparent)` |  |
| `--kz-hero-search-field` | `color-mix(in srgb, var(--kz-hero-search-ink) 14%, transparent)` |  |
| `--kz-hero-search-field-hover` | `color-mix(in srgb, var(--kz-hero-search-ink) 30%, transparent)` |  |
| `--kz-hero-search-soft` | `color-mix(in srgb, var(--kz-hero-search-ink) 6%, transparent)` |  |
| `--kz-hero-search-shadow` | `0 24px 48px -24px rgba(10, 10, 10, 0.24)` |  |
| `--kz-hero-search-pop` | `0 18px 40px -16px rgba(10, 10, 10, 0.3)` |  |
| `--kz-hero-search-bg` | `transparent` |  |
| `--kz-hero-search-width` | `1240px` |  |
| `--kz-hero-search-gap` | `clamp(32px, 5vw, 80px)` |  |
| `--kz-hero-search-pad-y` | `clamp(72px, 9vw, 140px)` |  |
| `--kz-hero-search-gutter` | `clamp(16px, 4vw, 40px)` |  |
| `--kz-hero-search-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-hero-search-ratio` | `4 / 5` |  |
| `--kz-hero-search-height` | `56px` |  |
| `--kz-hero-search-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-hero-search-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-examples` (e.g. `Le Havre, Lisbon, Nantes, Porto`), `data-mode` (e.g. `buy`, `rent`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-hero-search {
    --kz-hero-search-ink: #f2f2f0;
    --kz-hero-search-paper: #0a0a0a;
    --kz-hero-search-dim: rgba(242, 242, 240, 0.64);
    --kz-hero-search-faint: rgba(242, 242, 240, 0.6);
    --kz-hero-search-surface: #161616;
    --kz-hero-search-line: rgba(255, 255, 255, 0.12);
    --kz-hero-search-field: rgba(255, 255, 255, 0.14);
    --kz-hero-search-field-hover: rgba(255, 255, 255, 0.3);
    --kz-hero-search-soft: rgba(255, 255, 255, 0.08);
    --kz-hero-search-shadow: 0 24px 48px -24px rgba(0, 0, 0, 0.7);
    --kz-hero-search-pop: 0 18px 40px -16px rgba(0, 0, 0, 0.8);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On Buy or Rent | `ArrowLeft` / `ArrowRight` | Switches between Buy and Rent, and the budget list with it |
| On Type or Budget, while it's open | `ArrowDown` / `ArrowUp` | Next or previous option, no looping |
|  | `Home` / `End` | First or last option |
|  | `PageDown` / `PageUp` | Five options down or up |
|  | a letter | Jumps to the option starting with that letter |
|  | `Enter` / `Space` | Picks the highlighted option and closes |
|  | `Tab` | Picks the highlighted option and moves on |
| On Type or Budget | `Enter` / `Space` / `ArrowDown` / `ArrowUp` | Opens it on the current choice |
|  | a letter | Picks the option starting with that letter, no opening |
| Anywhere, while a list is open | `Escape` | Closes it, focus back on the field |
| In the place field | `Enter` | Sends the search |

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
