# Star Rating

[![Star Rating, live on kodza.dev](https://kodza.dev/anim/rating-component/og.jpg)](https://kodza.dev/components/rating-component/)

Real radio buttons drawn as stars: they light up one after the other under the pointer, the word rolls from Meh to Shipped it, and a static score fills in view.

**[Live demo](https://kodza.dev/components/rating-component/)** · Forms · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-rating-component.html`](kodza-rating-component.html) | 1.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-rating-component.css`](kodza-rating-component.css) | 9.7 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-rating-component.js`](kodza-rating-component.js) | 8.0 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-rating-component.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-rating-component.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/rating-component/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add a Kodza Star Rating to my feedback form.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-rating` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-rating-fg` | `#0a0a0a` |  |
| `--kz-rating-muted` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-rating-rail` | `rgba(10, 10, 10, 0.14)` |  |
| `--kz-rating-ink` | `#0a0a0a` |  |
| `--kz-rating-size` | `30px` |  |
| `--kz-rating-gap` | `6px` |  |
| `--kz-rating-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-rating-star` | `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z' stroke='black' stroke-width='1.2' stroke-linejoin='round'/%3E%3C/svg%3E")` |  |

- Modifiers: `.kodza-rating--static`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-rating {
    --kz-rating-fg: #f2f2f0;
    --kz-rating-muted: rgba(242, 242, 240, 0.62);
    --kz-rating-rail: rgba(255, 255, 255, 0.16);
    --kz-rating-ink: #f2f2f0;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a star | `ArrowRight` / `ArrowDown` | Picks the next star, round and round |
|  | `ArrowLeft` / `ArrowUp` | Picks the previous star, round and round |
|  | `Space` | Picks the focused star |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
