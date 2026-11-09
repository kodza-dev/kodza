# Screen Callouts

[![Screen Callouts, live on kodza.dev](https://kodza.dev/anim/screen-callouts/og.jpg)](https://kodza.dev/components/screen-callouts/)

A picture and its numbered features, each with its zone in %. Picking one veils the rest, the cut-out glides from zone to zone and the picture leans in.

**[Live demo](https://kodza.dev/components/screen-callouts/)** · Feature sections · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-screen-callouts.html`](kodza-screen-callouts.html) | 4.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-screen-callouts.css`](kodza-screen-callouts.css) | 26.0 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-screen-callouts.js`](kodza-screen-callouts.js) | 21.3 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-screen-callouts.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-screen-callouts.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/screen-callouts/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Screen Callouts to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-screen-callouts` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-screen-callouts-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-screen-callouts-dim` | `color-mix(in srgb, var(--kz-screen-callouts-ink) 66%, transparent)` |  |
| `--kz-screen-callouts-faint` | `color-mix(in srgb, var(--kz-screen-callouts-ink) 60%, transparent)` |  |
| `--kz-screen-callouts-line` | `color-mix(in srgb, var(--kz-screen-callouts-ink) 12%, transparent)` | the hairlines |
| `--kz-screen-callouts-card` | `var(--kz-color-paper, #fff)` | the numbers on the picture |
| `--kz-screen-callouts-accent` | `var(--kz-color-accent, var(--kz-screen-callouts-ink))` | the number picked |
| `--kz-screen-callouts-on-accent` | `var(--kz-color-on-accent, var(--kz-screen-callouts-card))` | its digits |
| `--kz-screen-callouts-veil` | `rgba(10, 10, 10, 0.56)` | over the rest of the picture |
| `--kz-screen-callouts-ring` | `rgba(255, 255, 255, 0.7)` | the edge of the cut-out |
| `--kz-screen-callouts-bg` | `transparent` |  |
| `--kz-screen-callouts-width` | `var(--kz-page-width, 1440px)` | the content column: the page's, set by the site |
| `--kz-screen-callouts-gutter` | `var(--kz-page-gutter, clamp(16px, 4vw, 40px))` | the space kept at the screen edges |
| `--kz-screen-callouts-pad-top` | `clamp(56px, 7vw, 112px)` |  |
| `--kz-screen-callouts-pad-bottom` | `clamp(56px, 7vw, 112px)` |  |
| `--kz-screen-callouts-size` | `clamp(28px, 3.4vw, 44px)` | the title |
| `--kz-screen-callouts-ratio` | `auto` | the frame: auto keeps the picture's own shape |
| `--kz-screen-callouts-narrow-ratio` | `4 / 3` | --wide, on a phone |
| `--kz-screen-callouts-focus` | `50% 50%` | what the frame keeps when it crops |
| `--kz-screen-callouts-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-screen-callouts-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-screen-callouts-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-screen-callouts--wide`
- Attributes: `data-zone` (e.g. `51 34 32 8`, `4 47.5 37 7.5`, `6.5 58 87 5.2`, `6.5 70.5 87 29.5`, `39.5 69 46.5 31`, `17.5 31 17.5 28`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-screen-callouts {
    --kz-screen-callouts-ink: #f2f2f0;
    --kz-screen-callouts-card: #161616;
    --kz-screen-callouts-veil: rgba(0, 0, 0, 0.62);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a feature | `Enter` / `Space` | Keeps its zone shown on the picture, or lets it go |
|  | `Escape` | Lets the zone go |

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
