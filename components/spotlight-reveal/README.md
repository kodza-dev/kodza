# Spotlight Reveal

[![Spotlight Reveal, live on kodza.dev](https://kodza.dev/anim/spotlight-reveal/og.jpg)](https://kodza.dev/components/spotlight-reveal/)

A hero whose picture sits behind fogged glass: the pointer wipes a soft circle through it and the fog slowly closes behind. Canvas only, the finger works too.

**[Live demo](https://kodza.dev/components/spotlight-reveal/)** · Cursor · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-spotlight-reveal.html`](kodza-spotlight-reveal.html) | 1.4 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-spotlight-reveal.css`](kodza-spotlight-reveal.css) | 19.5 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-spotlight-reveal.js`](kodza-spotlight-reveal.js) | 20.0 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-spotlight-reveal.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-spotlight-reveal.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/spotlight-reveal/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Spotlight Reveal to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-spotlight-reveal]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-spotlight-reveal-page` | `var(--kz-color-page, #f2f2f0)` |  |
| `--kz-spotlight-reveal-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-spotlight-reveal-dim` | `color-mix(in srgb, var(--kz-spotlight-reveal-ink) 74%, transparent)` |  |
| `--kz-spotlight-reveal-faint` | `color-mix(in srgb, var(--kz-spotlight-reveal-ink) 64%, transparent)` |  |
| `--kz-spotlight-reveal-accent` | `var(--kz-color-accent, var(--kz-spotlight-reveal-ink))` |  |
| `--kz-spotlight-reveal-on-accent` | `var(--kz-color-on-accent, var(--kz-spotlight-reveal-page))` |  |
| `--kz-spotlight-reveal-fog` | `color-mix(in srgb, var(--kz-spotlight-reveal-page) 70%, transparent)` |  |
| `--kz-spotlight-reveal-blur` | `28px` |  |
| `--kz-spotlight-reveal-reach` | `clamp(80px, 11vw, 150px)` |  |
| `--kz-spotlight-reveal-linger` | `1.6s` |  |
| `--kz-spotlight-reveal-veil` | `color-mix(in srgb, var(--kz-spotlight-reveal-page) 80%, transparent)` |  |
| `--kz-spotlight-reveal-base` | `transparent` |  |
| `--kz-spotlight-reveal-height` | `max(520px, 100svh)` |  |
| `--kz-spotlight-reveal-pad` | `clamp(24px, 4.5vw, 64px)` |  |
| `--kz-spotlight-reveal-position` | `50% 50%` |  |
| `--kz-spotlight-reveal-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-spotlight-reveal-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-spotlight-reveal-glide` | `cubic-bezier(0.6, 0, 0.1, 1)` |  |

- Attributes: `data-kodza-spotlight-reveal`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-spotlight-reveal {
    --kz-spotlight-reveal-page: #0a0a0a;
    --kz-spotlight-reveal-ink: #f2f2f0;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
