# Hero Open

[![Hero Open, live on kodza.dev](https://kodza.dev/anim/hero-open/og.jpg)](https://kodza.dev/components/hero-open/)

A hero for a place with opening hours: a status line works out, at the place's own time, if it's open ("Open now · closes 23:00", "Closes in 25 min") and rolls to the new words on the minute.

**[Live demo](https://kodza.dev/components/hero-open/)** · Hero · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-hero-open.html`](kodza-hero-open.html) | 2.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-hero-open.css`](kodza-hero-open.css) | 22.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-hero-open.js`](kodza-hero-open.js) | 11.9 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-hero-open.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-hero-open.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/hero-open/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Hero Open to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-hero-open` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-hero-open-ink` | `#0a0a0a` |  |
| `--kz-hero-open-paper` | `#f2f2f0` |  |
| `--kz-hero-open-dim` | `rgba(10, 10, 10, 0.64)` |  |
| `--kz-hero-open-faint` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-hero-open-soft` | `rgba(10, 10, 10, 0.07)` |  |
| `--kz-hero-open-bg` | `transparent` |  |
| `--kz-hero-open-width` | `1240px` |  |
| `--kz-hero-open-pad-y` | `clamp(48px, 6vw, 96px)` |  |
| `--kz-hero-open-gutter` | `clamp(16px, 4vw, 40px)` |  |
| `--kz-hero-open-radius` | `16px` |  |
| `--kz-hero-open-height` | `clamp(280px, 36vw, 540px)` |  |
| `--kz-hero-open-position` | `50% 60%` |  |
| `--kz-hero-open-mono` | `"Geist Mono", ui-monospace, "SF Mono", Menlo, monospace` |  |
| `--kz-hero-open-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-hero-open-glide` | `cubic-bezier(0.6, 0, 0.1, 1)` |  |
| `--kz-hero-open-soft-ease` | `cubic-bezier(0.25, 1, 0.5, 1)` |  |

- Attributes: `data-hours` (e.g. `mon closed; tue-thu 12:00-14:30, 18:00-23:00; fri-sat 12:00-14:30, 18:00-01:00; sun 11:00-16:00`), `data-now`, `data-soon`, `data-timezone` (e.g. `Europe/Paris`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-hero-open {
    --kz-hero-open-ink: #f2f2f0;
    --kz-hero-open-paper: #0a0a0a;
    --kz-hero-open-dim: rgba(242, 242, 240, 0.68);
    --kz-hero-open-faint: rgba(242, 242, 240, 0.6);
    --kz-hero-open-soft: rgba(242, 242, 240, 0.1);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
