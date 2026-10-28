# Textarea

[![Textarea, live on kodza.dev](https://kodza.dev/anim/textarea/og.jpg)](https://kodza.dev/components/textarea/)

A textarea whose label folds up, whose height eases to fit the text, and whose ring fills as you near the limit, with the characters left in the last fifth.

**[Live demo](https://kodza.dev/components/textarea/)** · Forms · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-textarea.html`](kodza-textarea.html) | 1.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-textarea.css`](kodza-textarea.css) | 11.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-textarea.js`](kodza-textarea.js) | 6.6 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-textarea.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-textarea.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/textarea/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Use the Kodza Textarea for the message in my contact form.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-textarea` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-textarea-bg` | `#ffffff` |  |
| `--kz-textarea-fg` | `#0a0a0a` |  |
| `--kz-textarea-muted` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-textarea-line` | `rgba(10, 10, 10, 0.14)` |  |
| `--kz-textarea-line-hover` | `rgba(10, 10, 10, 0.3)` |  |
| `--kz-textarea-soft` | `rgba(10, 10, 10, 0.06)` |  |
| `--kz-textarea-error` | `#0a0a0a` |  |
| `--kz-textarea-radius` | `12px` |  |
| `--kz-textarea-pad` | `16px` |  |
| `--kz-textarea-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-error` (e.g. `Ten characters at least. Bugs need context.`), `data-max` (e.g. `280`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-textarea {
    --kz-textarea-bg: #161616;
    --kz-textarea-fg: #f2f2f0;
    --kz-textarea-muted: rgba(242, 242, 240, 0.62);
    --kz-textarea-line: rgba(255, 255, 255, 0.14);
    --kz-textarea-line-hover: rgba(255, 255, 255, 0.3);
    --kz-textarea-soft: rgba(255, 255, 255, 0.07);
    --kz-textarea-error: #f2f2f0;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
