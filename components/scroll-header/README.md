# Scroll Header

[![Scroll Header, live on kodza.dev](https://kodza.dev/anim/scroll-header/og.jpg)](https://kodza.dev/components/scroll-header/)

A floating glass pill that clears the top of the page, frosts as you scroll, steps aside while you read and turns to dark glass over dark sections.

**[Live demo](https://kodza.dev/components/scroll-header/)** · Navigation · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-scroll-header.html`](kodza-scroll-header.html) | 1.0 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-scroll-header.css`](kodza-scroll-header.css) | 21.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-scroll-header.js`](kodza-scroll-header.js) | 10.5 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-scroll-header.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-scroll-header.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/scroll-header/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Make my WordPress header a Kodza Scroll Header.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-scroll-header` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-header-fg` | `#0a0a0a` |  |
| `--kz-header-muted` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-header-soft` | `rgba(10, 10, 10, 0.07)` |  |
| `--kz-header-glass` | `rgba(255, 255, 255, 0.74)` |  |
| `--kz-header-edge` | `rgba(10, 10, 10, 0.08)` |  |
| `--kz-header-shadow` | `rgba(10, 10, 10, 0.08)` |  |
| `--kz-header-ink` | `#0a0a0a` |  |
| `--kz-header-on-ink` | `#ffffff` |  |
| `--kz-header-dark-fg` | `rgba(255, 255, 255, 0.92)` |  |
| `--kz-header-dark-muted` | `rgba(255, 255, 255, 0.62)` |  |
| `--kz-header-dark-soft` | `rgba(255, 255, 255, 0.1)` |  |
| `--kz-header-dark-glass` | `rgba(30, 30, 30, 0.72)` |  |
| `--kz-header-dark-edge` | `rgba(255, 255, 255, 0.1)` |  |
| `--kz-header-dark-shadow` | `rgba(0, 0, 0, 0.32)` |  |
| `--kz-header-dark-ink` | `#ffffff` |  |
| `--kz-header-dark-on-ink` | `#0a0a0a` |  |
| `--kz-header-top` | `12px` |  |
| `--kz-header-height` | `60px` |  |
| `--kz-header-max` | `1080px` |  |
| `--kz-header-max-scrolled` | `var(--kz-header-max)` |  |
| `--kz-header-radius` | `22px` |  |
| `--kz-header-duration` | `0.5s` |  |
| `--kz-header-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-header-hide-after` | `600px` |  |
| `--kz-header-hide-duration` | `0.8s` |  |
| `--kz-header-hide-ease` | `cubic-bezier(0.65, 0, 0.35, 1)` |  |
| `--kz-header-width-duration` | `0.7s` |  |
| `--kz-header-width-ease` | `cubic-bezier(0.65, 0, 0.35, 1)` |  |

- Modifiers: `.kodza-scroll-header--keep`, `.kodza-scroll-header--solid`
- Attributes: `data-header-tone`, `data-tone`

## Dark mode

Over a section marked `data-header-tone="dark"` it turns to dark glass by itself. On a page that is dark everywhere, put `data-tone="dark"` on the header (your theme switch can toggle it).

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| In the open menu | `Escape` | Closes the menu, focus back on its button |
| While it's hidden | `Tab` | Tabbing into it brings it back in view |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
