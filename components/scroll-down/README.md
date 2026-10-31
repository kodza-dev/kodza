# Scroll Down

[![Scroll Down, live on kodza.dev](https://kodza.dev/anim/scroll-down/og.jpg)](https://kodza.dev/components/scroll-down/)

The cue at the bottom of a hero: an arrow in a ring or a mouse whose wheel rolls now and then. One click glides to the next section, the first scroll fades it out, and it comes back at the top.

**[Live demo](https://kodza.dev/components/scroll-down/)** · Buttons · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-scroll-down.html`](kodza-scroll-down.html) | 0.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-scroll-down.css`](kodza-scroll-down.css) | 8.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-scroll-down.js`](kodza-scroll-down.js) | 12.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-scroll-down.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-scroll-down.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/scroll-down/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Scroll Down to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-scroll-down` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-scroll-down-ink` | `#0a0a0a` |  |
| `--kz-scroll-down-paper` | `#ffffff` |  |
| `--kz-scroll-down-line` | `rgba(10, 10, 10, 0.28)` |  |
| `--kz-scroll-down-size` | `52px` |  |
| `--kz-scroll-down-travel` | `36px` |  |
| `--kz-scroll-down-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-scroll-down--mouse`
- Attributes: `data-hide`, `data-target`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-scroll-down {
    --kz-scroll-down-ink: #f2f2f0;
    --kz-scroll-down-paper: #0a0a0a;
    --kz-scroll-down-line: rgba(255, 255, 255, 0.34);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the cue | `Enter` / `Space` | Glides to the next section and moves the focus there |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
