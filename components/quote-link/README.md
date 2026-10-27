# Quote Link

[![Quote Link, live on kodza.dev](https://kodza.dev/anim/quote-link/og.jpg)](https://kodza.dev/components/quote-link/)

Select words in an article and a pill offers a link to them: the page's address with a text fragment, which opens it scrolled to the quote and highlighted. It rolls to Link copied with a check.

**[Live demo](https://kodza.dev/components/quote-link/)** · Links · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-quote-link.html`](kodza-quote-link.html) | 0.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-quote-link.css`](kodza-quote-link.css) | 13.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-quote-link.js`](kodza-quote-link.js) | 18.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-quote-link.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-quote-link.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/quote-link/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Quote Link to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-quote-link]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-quote-link-heading` | `#0a0a0a` |  |
| `--kz-quote-link-text` | `rgba(10, 10, 10, 0.72)` |  |
| `--kz-quote-link-pill` | `#0a0a0a` |  |
| `--kz-quote-link-pill-ink` | `#fff` |  |
| `--kz-quote-link-pill-hover` | `#262626` |  |
| `--kz-quote-link-shadow` | `0 1px 2px rgba(10, 10, 10, 0.12), 0 10px 28px rgba(10, 10, 10, 0.18)` |  |
| `--kz-quote-link-mark` | `rgba(10, 10, 10, 0.14)` |  |
| `--kz-quote-link-duration` | `0.22s` |  |
| `--kz-quote-link-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-copied`, `data-failed`, `data-kodza-quote-link`, `data-label`, `data-target`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-quote-link {
    --kz-quote-link-heading: #f2f2f0;
    --kz-quote-link-text: rgba(242, 242, 240, 0.72);
    --kz-quote-link-pill: #f2f2f0;
    --kz-quote-link-pill-ink: #0a0a0a;
    --kz-quote-link-pill-hover: #fff;
    --kz-quote-link-shadow: 0 1px 2px rgba(0, 0, 0, 0.4), 0 10px 28px rgba(0, 0, 0, 0.5);
    --kz-quote-link-mark: rgba(242, 242, 240, 0.22);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the pill | `Enter` / `Space` | Copies a link that opens the page on the quote |
|  | `Escape` | Puts the pill away |
| In the text, with words selected | `Tab` | Moves to the pill |
|  | `Escape` | Puts the pill away, the selection stays |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
