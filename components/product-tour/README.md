# Product Tour

[![Product Tour, live on kodza.dev](https://kodza.dev/anim/product-tour/og.jpg)](https://kodza.dev/components/product-tour/)

A guided tour: the page dims, a spotlight cuts out each element and glides to the next, reshaping on the way, with a card that follows. Keyboard too.

**[Live demo](https://kodza.dev/components/product-tour/)** · Overlays · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-product-tour.html`](kodza-product-tour.html) | 0.7 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-product-tour.css`](kodza-product-tour.css) | 12.7 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-product-tour.js`](kodza-product-tour.js) | 13.0 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-product-tour.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-product-tour.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/product-tour/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Walk new users through my dashboard with a Kodza Product Tour.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-tour` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-tour-bg` | `#ffffff` |  |
| `--kz-tour-fg` | `#0a0a0a` |  |
| `--kz-tour-muted` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-tour-line` | `rgba(10, 10, 10, 0.12)` |  |
| `--kz-tour-ink` | `#0a0a0a` |  |
| `--kz-tour-on-ink` | `#ffffff` |  |
| `--kz-tour-dim` | `rgba(10, 10, 10, 0.55)` |  |
| `--kz-tour-ring` | `rgba(255, 255, 255, 0.9)` |  |
| `--kz-tour-pad` | `6px` |  |
| `--kz-tour-radius` | `calc(12px * var(--kz-radius-scale, 1))` |  |
| `--kz-tour-ease` | `cubic-bezier(0.65, 0, 0.35, 1)` |  |

- Attributes: `data-scope` (e.g. `.demo-app`), `data-target` (e.g. `.demo-search`, `.demo-new`, `.demo-project`, `.demo-avatar`), `data-title` (e.g. `Search everything`, `Start a project`, `Your projects live here`, `That's you`)
- Events: `kodza:tour`, `kodza:tour-end`, bubbling from the root
- On the root element: `root.kodzaTour` (see the comment at the top of the JS)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-tour {
    --kz-tour-bg: #1b1b1b;
    --kz-tour-fg: #f2f2f0;
    --kz-tour-muted: rgba(242, 242, 240, 0.62);
    --kz-tour-line: rgba(255, 255, 255, 0.14);
    --kz-tour-ink: #f2f2f0;
    --kz-tour-on-ink: #0a0a0a;
    --kz-tour-dim: rgba(0, 0, 0, 0.65);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the button | `Enter` / `Space` | Starts the tour, focus goes to the card |
| While the tour runs | `ArrowRight` / `ArrowLeft` | Next or previous step |
|  | `Tab` / `Shift+Tab` | Next or previous card button, round and round |
|  | `Escape` | Ends the tour, focus back on the button |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
