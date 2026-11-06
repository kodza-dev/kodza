# Quote Spotlight

[![Quote Spotlight, live on kodza.dev](https://kodza.dev/anim/quote-spotlight/og.jpg)](https://kodza.dev/components/quote-spotlight/)

One big quote at a time, faces or press logos as tabs under it: a ring fills while it is read, then the next quote rises line by line. Click, swipe or arrow keys pick one; hover or pause holds it.

**[Live demo](https://kodza.dev/components/quote-spotlight/)** · Testimonials & logos · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-quote-spotlight.html`](kodza-quote-spotlight.html) | 15.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-quote-spotlight.css`](kodza-quote-spotlight.css) | 27.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-quote-spotlight.js`](kodza-quote-spotlight.js) | 23.4 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-quote-spotlight.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-quote-spotlight.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/quote-spotlight/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Quote Spotlight to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-quote-spotlight]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-quote-spotlight-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-quote-spotlight-dim` | `color-mix(in srgb, var(--kz-quote-spotlight-ink) 64%, transparent)` |  |
| `--kz-quote-spotlight-face` | `#e6e6e3` |  |
| `--kz-quote-spotlight-track` | `color-mix(in srgb, var(--kz-quote-spotlight-ink) 16%, transparent)` |  |
| `--kz-quote-spotlight-bg` | `transparent` |  |
| `--kz-quote-spotlight-width` | `720px` |  |
| `--kz-quote-spotlight-rest` | `0.6` | the faces and logos not chosen |
| `--kz-quote-spotlight-logo-area` | `2300` | square pixels per logo: a wide one sits lower, a square one taller, all weigh the same |
| `--kz-quote-spotlight-hang` | `0.4em` | the opening quote mark hangs in the margin by its width |
| `--kz-quote-spotlight-pad-y` | `clamp(64px, 8vw, 112px)` |  |
| `--kz-quote-spotlight-gutter` | `clamp(16px, 4vw, 40px)` |  |
| `--kz-quote-spotlight-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-quote-spotlight-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-interval` (e.g. `7000`), `data-kodza-quote-spotlight`, `data-label` (e.g. `Choose a customer`, `Choose a publication`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-quote-spotlight {
    --kz-quote-spotlight-ink: #f2f2f0;
    --kz-quote-spotlight-dim: rgba(242, 242, 240, 0.64);
    --kz-quote-spotlight-face: #2a2a2a;
    --kz-quote-spotlight-track: rgba(242, 242, 240, 0.18);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

Every colour is a variable on the section: set --kz-quote-spotlight-ink, -dim, -face and -track (the demo's dark band has the recipe).

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a face or a logo | `ArrowRight` / `ArrowLeft` | Next or previous quote |
|  | `Home` / `End` | First or last quote |
| On the pause button | `Enter` / `Space` | Stops the quotes, or starts them again |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
